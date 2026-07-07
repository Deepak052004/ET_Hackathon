from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from app.models.db import get_db
from app.models.zone import Zone, ZoneClassification
from app.models.sensor import Sensor, SensorReading, SensorType
from app.models.permit import Permit, PermitStatus, PermitType
from app.models.worker import Worker
from app.models.alert import Alert, AlertStatus, AlertSeverity
import random
import math

# NOTE: Prefix is /api so that flat URLs /api/risk-score and /api/heatmap match the plan exactly.
# Shubhranshu's frontend calls these exact paths.
router = APIRouter(prefix="/api", tags=["risk"])


def _compute_zone_risk(zone: Zone, db: Session) -> dict:
    """
    Compound Risk Score computation for a zone.
    Weights: gas(30%) + permit(20%) + equipment(15%) + personnel(15%) + temporal(10%) + history(10%)
    Compound multiplier applied when multiple factors are elevated.
    """
    now = datetime.utcnow()
    
    # ── Gas Risk (0-1) ───────────────────────────────────────────────
    gas_sensors = db.query(Sensor).filter(
        Sensor.zone_id == zone.id,
        Sensor.sensor_type.in_([SensorType.GAS_H2S, SensorType.GAS_CH4, SensorType.GAS_CO])
    ).all()
    
    gas_risk = 0.0
    for s in gas_sensors:
        reading = db.query(SensorReading).filter(SensorReading.sensor_id == s.id).order_by(desc(SensorReading.timestamp)).first()
        if reading:
            # Normalize: how close is the reading to critical threshold?
            ratio = (reading.value - s.normal_min) / max(1, s.threshold_critical - s.normal_min)
            gas_risk = max(gas_risk, min(1.0, ratio))

    # ── Permit Risk (0-1) ────────────────────────────────────────────
    active_permits = db.query(Permit).filter(
        Permit.zone_id == zone.id,
        Permit.status == PermitStatus.ACTIVE,
    ).all()
    
    permit_risk = 0.0
    high_risk_types = {PermitType.HOT_WORK: 0.9, PermitType.CONFINED_SPACE: 0.7, PermitType.RADIOGRAPHY: 0.6}
    for p in active_permits:
        permit_risk = max(permit_risk, high_risk_types.get(p.permit_type, 0.3))
    # Compound: multiple active permits
    if len(active_permits) > 1:
        has_conflict = any(p.has_conflict for p in active_permits)
        permit_risk = min(1.0, permit_risk + 0.2 * (len(active_permits) - 1) + (0.3 if has_conflict else 0))

    # ── Equipment Risk (0-1) ─────────────────────────────────────────
    vib_sensors = db.query(Sensor).filter(
        Sensor.zone_id == zone.id,
        Sensor.sensor_type == SensorType.VIBRATION
    ).all()
    equipment_risk = 0.0
    for s in vib_sensors:
        reading = db.query(SensorReading).filter(SensorReading.sensor_id == s.id).order_by(desc(SensorReading.timestamp)).first()
        if reading:
            ratio = (reading.value - s.normal_min) / max(1, s.threshold_critical - s.normal_min)
            equipment_risk = max(equipment_risk, min(1.0, ratio))

    # ── Personnel Risk (0-1) ─────────────────────────────────────────
    workers_in_zone = db.query(Worker).filter(Worker.zone_id == zone.id, Worker.is_on_site == True).count()
    non_compliant = db.query(Worker).filter(Worker.zone_id == zone.id, Worker.ppe_status == "non_compliant").count()
    
    personnel_risk = 0.0
    if workers_in_zone > 0:
        ppe_non_compliance_rate = non_compliant / workers_in_zone
        # Higher workers + PPE violations in hazardous zones = higher risk
        zone_multiplier = {"critical": 1.0, "hazardous": 0.8, "restricted": 0.5, "safe": 0.2}.get(zone.classification.value, 0.5)
        personnel_risk = min(1.0, (0.3 + ppe_non_compliance_rate * 0.7) * zone_multiplier if workers_in_zone > 0 else 0)

    # ── Temporal Risk (0-1) ──────────────────────────────────────────
    hour = now.hour
    # Higher risk during shift changes (6am, 2pm, 10pm) and night shifts
    shift_change_hours = [6, 14, 22]
    near_shift_change = any(abs(hour - sc) <= 1 for sc in shift_change_hours)
    is_night = 22 <= hour or hour < 6
    temporal_risk = 0.3 + (0.3 if near_shift_change else 0) + (0.2 if is_night else 0)

    # ── History Risk (0-1) ───────────────────────────────────────────
    history_risk_map = {
        ZoneClassification.CRITICAL: 0.8,
        ZoneClassification.HAZARDOUS: 0.6,
        ZoneClassification.RESTRICTED: 0.4,
        ZoneClassification.SAFE: 0.1,
    }
    history_risk = history_risk_map.get(zone.classification, 0.3)

    # ── Compound Score ───────────────────────────────────────────────
    weights = {"gas": 0.30, "permit": 0.20, "equipment": 0.15, "personnel": 0.15, "temporal": 0.10, "history": 0.10}
    risks = [gas_risk, permit_risk, equipment_risk, personnel_risk, temporal_risk, history_risk]
    base_score = sum(w * r for w, r in zip(weights.values(), risks))
    
    elevated_count = sum(1 for r in risks if r > 0.6)
    compound_multiplier = 1.0 + (elevated_count - 1) * 0.3 if elevated_count > 1 else 1.0
    
    final_score = min(100, round(base_score * compound_multiplier * 100, 1))

    return {
        "zone_id": zone.id,
        "zone_name": zone.name,
        "classification": zone.classification.value,
        "center_lat": zone.center_lat,
        "center_lng": zone.center_lng,
        "risk_score": final_score,
        "risk_level": "critical" if final_score >= 80 else "high" if final_score >= 60 else "warning" if final_score >= 40 else "normal",
        "factors": {
            "gas_risk": round(gas_risk * 100, 1),
            "permit_risk": round(permit_risk * 100, 1),
            "equipment_risk": round(equipment_risk * 100, 1),
            "personnel_risk": round(personnel_risk * 100, 1),
            "temporal_risk": round(temporal_risk * 100, 1),
            "history_risk": round(history_risk * 100, 1),
        },
        "active_permits": len(active_permits),
        "workers_on_site": workers_in_zone,
        "compound_multiplier": round(compound_multiplier, 2),
        "elevated_factors": elevated_count,
    }


@router.get("/risk-score")
def get_risk_scores(db: Session = Depends(get_db)):
    """Get compound risk scores for all zones."""
    zones = db.query(Zone).all()
    zone_scores = [_compute_zone_risk(z, db) for z in zones]

    # Update risk_score in DB
    for zs in zone_scores:
        db.query(Zone).filter(Zone.id == zs["zone_id"]).update({"risk_score": zs["risk_score"]})
    db.commit()

    overall_score = max(z["risk_score"] for z in zone_scores) if zone_scores else 0
    critical_zones = [z for z in zone_scores if z["risk_level"] == "critical"]

    return {
        "overall_risk_score": overall_score,
        "overall_risk_level": "critical" if overall_score >= 80 else "high" if overall_score >= 60 else "warning" if overall_score >= 40 else "normal",
        "zones": zone_scores,
        "critical_zones": len(critical_zones),
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/heatmap")
def get_heatmap_data(db: Session = Depends(get_db)):  # Plan: GET /api/heatmap
    """
    Returns GeoJSON FeatureCollection for the frontend Leaflet heatmap.
    Each zone is a point with risk_score intensity.
    """
    zones = db.query(Zone).all()
    features = []
    
    for zone in zones:
        zone_risk = _compute_zone_risk(zone, db)
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [zone.center_lng, zone.center_lat],
            },
            "properties": {
                "zone_id": zone.id,
                "zone_name": zone.name,
                "risk_score": zone_risk["risk_score"],
                "risk_level": zone_risk["risk_level"],
                "classification": zone.classification.value,
                "intensity": zone_risk["risk_score"] / 100,  # 0-1 for Leaflet heatmap
                "active_permits": zone_risk["active_permits"],
                "workers_on_site": zone_risk["workers_on_site"],
                "factors": zone_risk["factors"],
            }
        })

    return {
        "type": "FeatureCollection",
        "features": features,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/risk/zone/{zone_id}")
def get_zone_risk(zone_id: int, db: Session = Depends(get_db)):
    """Get detailed risk breakdown for a single zone."""
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Zone not found")
    return _compute_zone_risk(zone, db)
