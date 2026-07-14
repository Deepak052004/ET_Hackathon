"""
SafetyNexus AI — FastAPI Main Application
Real-time industrial safety intelligence platform.

WebSocket: python-socketio (ASGI) — matches the plan's Socket.io client on the frontend.
Channels (plan-specified): sensor-data, alerts, risk-updates, worker-locations
"""
import asyncio
import json
import random
from contextlib import asynccontextmanager
from datetime import datetime

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.models.db import create_tables, SessionLocal
from app.models.sensor import Sensor, SensorReading, SensorType
from app.models.zone import Zone
from app.api import sensors, alerts, risk, permits, incidents, compliance, query, knowledge, predictions, vision
from app.services.emergency import check_and_trigger_evacuations
from sqlalchemy import desc

settings = get_settings()

# ─── Socket.io Server (matches plan: Socket.io client on frontend) ────────────
# Plan specifies channels: sensor-data, alerts, risk-updates, worker-locations
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)


def _get_live_sensor_data() -> list[dict]:
    """Pull latest sensor readings with small random drift for live feel."""
    db = SessionLocal()
    try:
        sensors_list = db.query(Sensor).filter(Sensor.is_active == True).all()
        readings = []
        for sensor in sensors_list:
            last = (
                db.query(SensorReading)
                .filter(SensorReading.sensor_id == sensor.id)
                .order_by(desc(SensorReading.timestamp))
                .first()
            )
            base_val = last.value if last else (sensor.normal_min + sensor.normal_max) / 2
            noise = random.gauss(0, (sensor.normal_max - sensor.normal_min) * 0.015)
            new_val = round(
                max(sensor.normal_min * 0.8, min(sensor.threshold_critical * 1.1, base_val + noise)), 2
            )
            if sensor.sensor_type == SensorType.GAS_O2:
                status = "critical" if new_val < sensor.threshold_critical else "warning" if new_val < sensor.threshold_warning else "normal"
            else:
                status = "critical" if new_val >= sensor.threshold_critical else "warning" if new_val >= sensor.threshold_warning else "normal"

            readings.append({
                "sensor_uid": sensor.sensor_uid,
                "name": sensor.name,
                "type": sensor.sensor_type.value,
                "zone_id": sensor.zone_id,
                "value": new_val,
                "unit": sensor.unit,
                "status": status,
                "threshold_warning": sensor.threshold_warning,
                "threshold_critical": sensor.threshold_critical,
                "lat": sensor.lat,
                "lng": sensor.lng,
            })
        return readings
    finally:
        db.close()


def _get_zone_risk_summary() -> list[dict]:
    """Lightweight zone risk snapshot for real-time updates."""
    db = SessionLocal()
    try:
        zones = db.query(Zone).all()
        return [
            {
                "zone_id": z.id,
                "zone_name": z.name,
                "risk_score": round(max(0, min(100, z.risk_score + random.gauss(0, 1.5))), 1),
                "center_lat": z.center_lat,
                "center_lng": z.center_lng,
                "classification": z.classification.value,
            }
            for z in zones
        ]
    finally:
        db.close()


def _get_active_alerts_summary() -> list[dict]:
    """Summary of latest unresolved alerts for Socket.io push."""
    from app.models.alert import Alert, AlertStatus
    db = SessionLocal()
    try:
        alerts_list = (
            db.query(Alert)
            .filter(Alert.status == AlertStatus.ACTIVE)
            .order_by(desc(Alert.priority_score))
            .limit(10)
            .all()
        )
        return [
            {
                "alert_uid": a.alert_uid,
                "title": a.title,
                "severity": a.severity.value,
                "source": a.source.value,
                "priority_score": a.priority_score,
                "zone_id": a.zone_id,
                "created_at": a.created_at.isoformat(),
            }
            for a in alerts_list
        ]
    finally:
        db.close()


# ─── Socket.io Event Handlers ─────────────────────────────────────────────────
@sio.event
async def connect(sid, environ):
    print(f"[Socket.io] Client connected: {sid}")
    # Send initial state immediately on connect
    await sio.emit("initial-state", {
        "sensors": _get_live_sensor_data(),
        "zones": _get_zone_risk_summary(),
        "alerts": _get_active_alerts_summary(),
        "timestamp": datetime.utcnow().isoformat(),
    }, to=sid)


@sio.event
async def disconnect(sid):
    print(f"[Socket.io] Client disconnected: {sid}")


@sio.event
async def ping(sid, data):
    """Respond to client ping — for connection health check."""
    await sio.emit("pong", {"timestamp": datetime.utcnow().isoformat()}, to=sid)


# ─── Background broadcast loop ────────────────────────────────────────────────
async def sensor_broadcast_loop():
    """
    Broadcasts live data every 3 seconds on plan-specified channels:
    - sensor-data
    - risk-updates
    - alerts (every 15s to avoid spam)
    """
    tick = 0
    while True:
        try:
            sensor_payload = {
                "sensors": _get_live_sensor_data(),
                "timestamp": datetime.utcnow().isoformat(),
            }
            await sio.emit("sensor-data", sensor_payload)

            # Risk updates every 9 seconds (every 3rd tick)
            if tick % 3 == 0:
                # Trigger emergency orchestrator check before broadcasting risks
                db = SessionLocal()
                try:
                    check_and_trigger_evacuations(db)
                finally:
                    db.close()
                    
                zone_payload = {
                    "zones": _get_zone_risk_summary(),
                    "timestamp": datetime.utcnow().isoformat(),
                }
                await sio.emit("risk-updates", zone_payload)

            # Worker locations every 9 seconds
            if tick % 3 == 1:
                await sio.emit("worker-locations", {
                    "workers": [],  # Populated in Phase 3 with real worker tracking
                    "timestamp": datetime.utcnow().isoformat(),
                })

            # Alert refresh every 15 seconds
            if tick % 5 == 0:
                await sio.emit("alerts", {
                    "alerts": _get_active_alerts_summary(),
                    "timestamp": datetime.utcnow().isoformat(),
                })

            tick += 1
        except Exception as e:
            print(f"[Socket.io] Broadcast error: {e}")
        await asyncio.sleep(3)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 SafetyNexus AI backend starting...")
    create_tables()
    broadcast_task = asyncio.create_task(sensor_broadcast_loop())
    yield
    broadcast_task.cancel()
    print("👋 SafetyNexus AI backend stopped.")


# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="SafetyNexus AI",
    description="Industrial Safety Intelligence Platform — ET AI Hackathon 2026",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── API Routers ──────────────────────────────────────────────────────────────
app.include_router(sensors.router)   # GET /api/sensors
app.include_router(alerts.router)    # GET /api/alerts
app.include_router(risk.router)      # GET /api/risk-score, GET /api/heatmap  ← PLAN URLs
app.include_router(permits.router)   # GET/POST /api/permits
app.include_router(incidents.router) # GET /api/incidents
app.include_router(compliance.router)# GET /api/compliance
app.include_router(query.router)     # POST /api/query  ← PLAN URL
app.include_router(knowledge.router) # GET /api/knowledge/*  ← Knowledge Graph
app.include_router(predictions.router) # GET /api/predictions/*  ← Predictive Analytics
app.include_router(vision.router)    # GET/POST /api/vision/* ← CV Mock

# ─── Health & Meta ───────────────────────────────────────────────────────────
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SafetyNexus AI Backend",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/api/dashboard/summary")
def get_dashboard_summary():
    """One-shot endpoint — all KPIs for dashboard initial load."""
    db = SessionLocal()
    try:
        from app.models.alert import Alert, AlertStatus, AlertSeverity
        from app.models.worker import Worker
        from app.models.permit import Permit, PermitStatus

        active_alerts = db.query(Alert).filter(Alert.status == AlertStatus.ACTIVE).count()
        critical_alerts = db.query(Alert).filter(Alert.severity == AlertSeverity.CRITICAL, Alert.status == AlertStatus.ACTIVE).count()
        workers_on_site = db.query(Worker).filter(Worker.is_on_site == True).count()
        active_permits = db.query(Permit).filter(Permit.status == PermitStatus.ACTIVE).count()
        conflict_permits = db.query(Permit).filter(Permit.has_conflict == True, Permit.status == PermitStatus.ACTIVE).count()
        max_risk_zone = db.query(Zone).order_by(desc(Zone.risk_score)).first()

        return {
            "active_alerts": active_alerts,
            "critical_alerts": critical_alerts,
            "workers_on_site": workers_on_site,
            "active_permits": active_permits,
            "conflict_permits": conflict_permits,
            "overall_risk_score": round(max_risk_zone.risk_score if max_risk_zone else 0, 1),
            "overall_risk_level": (
                "critical" if (max_risk_zone and max_risk_zone.risk_score >= 80)
                else "high" if (max_risk_zone and max_risk_zone.risk_score >= 60)
                else "normal"
            ),
            "timestamp": datetime.utcnow().isoformat(),
        }
    finally:
        db.close()


# ─── Mount Socket.io ASGI app (serves /socket.io/ path) ──────────────────────
# This MUST be last — it mounts socket.io at /socket.io/ which the frontend client auto-discovers.
# Frontend usage: const socket = io('http://localhost:8000')
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
