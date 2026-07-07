"""
SafetyNexus AI — Predictive Analytics API
Endpoints for anomaly detection and equipment failure predictions.
Plan URLs: GET /api/predictions/anomalies, GET /api/predictions/failures
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.db import get_db
from app.services.prediction import (
    detect_anomalies,
    predict_equipment_failures,
    analyze_sensor_trend,
)

router = APIRouter(prefix="/api/predictions", tags=["predictions"])


@router.get("/anomalies")
def get_anomalies(
    zone_id: int | None = Query(None, description="Filter by zone ID"),
    db: Session = Depends(get_db),
):
    """
    Run anomaly detection on all active sensors using Isolation Forest.
    Returns anomaly scores (0-1) for each sensor.
    Plan spec: GET /api/predictions/anomalies
    """
    results = detect_anomalies(db)

    if zone_id is not None:
        results = [r for r in results if r["zone_id"] == zone_id]

    # Sort: anomalies first, then by score descending
    results.sort(key=lambda x: (not x["is_anomaly"], -(x["anomaly_score"] or 0)))

    anomaly_count = sum(1 for r in results if r["is_anomaly"])
    critical_anomalies = sum(1 for r in results if r.get("anomaly_level") == "critical")

    return {
        "anomalies": results,
        "summary": {
            "total_sensors": len(results),
            "anomalies_detected": anomaly_count,
            "critical_anomalies": critical_anomalies,
            "anomaly_rate": round(anomaly_count / len(results) * 100, 1) if results else 0,
        },
        "model": "IsolationForest",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/failures")
def get_failure_predictions(
    zone_id: int | None = Query(None, description="Filter by zone ID"),
    urgency: str | None = Query(None, description="Filter by urgency: immediate, short_term, medium_term, healthy"),
    db: Session = Depends(get_db),
):
    """
    Predict equipment failures using Remaining Useful Life (RUL) estimation.
    Analyzes vibration, temperature, and pressure sensor trends.
    Plan spec: GET /api/predictions/failures
    """
    predictions = predict_equipment_failures(db)

    if zone_id is not None:
        predictions = [p for p in predictions if p["zone_id"] == zone_id]

    if urgency is not None:
        predictions = [p for p in predictions if p.get("urgency") == urgency]

    # Sort: most urgent first
    urgency_order = {"immediate": 0, "short_term": 1, "medium_term": 2, "healthy": 3}
    predictions.sort(key=lambda x: (
        urgency_order.get(x.get("urgency", ""), 4),
        x.get("rul_hours") or 99999,
    ))

    immediate = sum(1 for p in predictions if p.get("urgency") == "immediate")
    short_term = sum(1 for p in predictions if p.get("urgency") == "short_term")
    degrading = sum(1 for p in predictions if p.get("trend") == "degrading")

    return {
        "predictions": predictions,
        "summary": {
            "total_equipment": len(predictions),
            "immediate_attention": immediate,
            "short_term_risk": short_term,
            "degrading_trend": degrading,
            "healthy": sum(1 for p in predictions if p.get("urgency") == "healthy"),
        },
        "model": "LinearRegression_RUL",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/trends/{sensor_uid}")
def get_sensor_trend(
    sensor_uid: str,
    hours: int = Query(24, ge=1, le=168, description="Analysis window in hours"),
    db: Session = Depends(get_db),
):
    """
    Detailed trend analysis for a specific sensor.
    Returns statistics, trend direction, 6-hour projection, and anomaly history.
    """
    result = analyze_sensor_trend(sensor_uid, db, hours)
    if "error" in result:
        if result["error"] == "Sensor not found":
            raise HTTPException(status_code=404, detail="Sensor not found")
        if result["error"] == "insufficient_data":
            return {
                "sensor_uid": sensor_uid,
                "message": f"Insufficient data for trend analysis (found {result.get('readings_found', 0)} readings in {hours}h window)",
                "timestamp": datetime.utcnow().isoformat(),
            }
    return result
