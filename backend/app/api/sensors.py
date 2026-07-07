from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from app.models.db import get_db
from app.models.sensor import Sensor, SensorReading, SensorType
from app.models.zone import Zone
import random

router = APIRouter(prefix="/api/sensors", tags=["sensors"])


def _reading_to_dict(sensor: Sensor, reading: SensorReading | None) -> dict:
    val = reading.value if reading else 0.0
    if sensor.sensor_type == SensorType.GAS_O2:
        status = "critical" if val < sensor.threshold_critical else "warning" if val < sensor.threshold_warning else "normal"
    else:
        status = "critical" if val >= sensor.threshold_critical else "warning" if val >= sensor.threshold_warning else "normal"

    return {
        "sensor_id": sensor.id,
        "sensor_uid": sensor.sensor_uid,
        "name": sensor.name,
        "type": sensor.sensor_type.value,
        "zone_id": sensor.zone_id,
        "lat": sensor.lat,
        "lng": sensor.lng,
        "current_value": round(val, 2),
        "unit": sensor.unit,
        "status": status,
        "threshold_warning": sensor.threshold_warning,
        "threshold_critical": sensor.threshold_critical,
        "timestamp": reading.timestamp.isoformat() if reading else datetime.utcnow().isoformat(),
        "is_anomaly": reading.is_anomaly if reading else False,
    }


@router.get("/")
def get_all_sensors(
    zone_id: int | None = Query(None),
    sensor_type: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Get latest readings for all sensors, optionally filtered by zone or type."""
    query = db.query(Sensor).filter(Sensor.is_active == True)
    if zone_id:
        query = query.filter(Sensor.zone_id == zone_id)
    if sensor_type:
        query = query.filter(Sensor.sensor_type == sensor_type)

    sensors = query.all()
    result = []
    for sensor in sensors:
        latest = (
            db.query(SensorReading)
            .filter(SensorReading.sensor_id == sensor.id)
            .order_by(desc(SensorReading.timestamp))
            .first()
        )
        result.append(_reading_to_dict(sensor, latest))
    return {"sensors": result, "count": len(result), "timestamp": datetime.utcnow().isoformat()}


@router.get("/{sensor_uid}/history")
def get_sensor_history(
    sensor_uid: str,
    minutes: int = Query(60, ge=5, le=1440),
    db: Session = Depends(get_db),
):
    """Get time-series history for a specific sensor."""
    sensor = db.query(Sensor).filter(Sensor.sensor_uid == sensor_uid).first()
    if not sensor:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Sensor not found")

    from datetime import timedelta
    since = datetime.utcnow() - timedelta(minutes=minutes)
    readings = (
        db.query(SensorReading)
        .filter(SensorReading.sensor_id == sensor.id, SensorReading.timestamp >= since)
        .order_by(SensorReading.timestamp)
        .all()
    )

    return {
        "sensor_uid": sensor_uid,
        "sensor_name": sensor.name,
        "unit": sensor.unit,
        "threshold_warning": sensor.threshold_warning,
        "threshold_critical": sensor.threshold_critical,
        "readings": [
            {"timestamp": r.timestamp.isoformat(), "value": r.value, "is_anomaly": r.is_anomaly}
            for r in readings
        ],
    }
