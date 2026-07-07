"""
SafetyNexus AI — Predictive Analytics Service
Anomaly detection (Isolation Forest) + Equipment failure prediction (RUL estimation).
Uses existing sensor readings from PostgreSQL.
"""
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc

from app.models.sensor import Sensor, SensorReading, SensorType
from app.models.zone import Zone


# ─── Anomaly Detection (Isolation Forest) ─────────────────────────────────────

def detect_anomalies(db: Session, contamination: float = 0.05) -> list[dict]:
    """
    Run Isolation Forest anomaly detection on all active sensors.
    Uses historical readings to learn normal patterns, then scores latest readings.

    Args:
        db: Database session
        contamination: Expected proportion of anomalies (0.01-0.1)

    Returns:
        List of sensor anomaly assessments with scores.
    """
    from sklearn.ensemble import IsolationForest

    sensors = db.query(Sensor).filter(Sensor.is_active == True).all()
    results = []

    for sensor in sensors:
        # Get historical readings (last 200 for training)
        readings = (
            db.query(SensorReading)
            .filter(SensorReading.sensor_id == sensor.id)
            .order_by(desc(SensorReading.timestamp))
            .limit(200)
            .all()
        )

        if len(readings) < 10:
            # Not enough data to train — skip
            results.append(_build_anomaly_result(sensor, None, None, "insufficient_data"))
            continue

        values = np.array([r.value for r in readings]).reshape(-1, 1)
        latest_value = values[0][0]  # Most recent reading

        # Train Isolation Forest
        try:
            model = IsolationForest(
                contamination=contamination,
                n_estimators=100,
                random_state=42,
            )
            model.fit(values)

            # Score the latest reading (-1 = anomaly, 1 = normal)
            prediction = model.predict(np.array([[latest_value]]))[0]
            # decision_function returns anomaly score (more negative = more anomalous)
            anomaly_score_raw = model.decision_function(np.array([[latest_value]]))[0]
            # Normalize to 0-1 (0 = normal, 1 = highly anomalous)
            anomaly_score = max(0.0, min(1.0, 0.5 - anomaly_score_raw))

            is_anomaly = prediction == -1

            # Additional context: how far from mean?
            mean_val = float(np.mean(values))
            std_val = float(np.std(values))
            z_score = (latest_value - mean_val) / std_val if std_val > 0 else 0.0

            results.append(
                _build_anomaly_result(
                    sensor, latest_value, anomaly_score, "analyzed",
                    is_anomaly=is_anomaly,
                    z_score=round(z_score, 2),
                    mean_value=round(mean_val, 2),
                    std_value=round(std_val, 2),
                    samples_used=len(readings),
                )
            )
        except Exception as e:
            results.append(_build_anomaly_result(sensor, latest_value, None, f"error: {str(e)}"))

    return results


def _build_anomaly_result(
    sensor: Sensor,
    current_value: float | None,
    anomaly_score: float | None,
    status: str,
    **kwargs,
) -> dict:
    """Build a standardized anomaly result dict."""
    # Determine threshold status
    if current_value is not None:
        if sensor.sensor_type == SensorType.GAS_O2:
            threshold_status = (
                "critical" if current_value < sensor.threshold_critical
                else "warning" if current_value < sensor.threshold_warning
                else "normal"
            )
        else:
            threshold_status = (
                "critical" if current_value >= sensor.threshold_critical
                else "warning" if current_value >= sensor.threshold_warning
                else "normal"
            )
    else:
        threshold_status = "unknown"

    return {
        "sensor_uid": sensor.sensor_uid,
        "sensor_name": sensor.name,
        "sensor_type": sensor.sensor_type.value,
        "zone_id": sensor.zone_id,
        "current_value": current_value,
        "unit": sensor.unit,
        "threshold_status": threshold_status,
        "anomaly_score": round(anomaly_score, 3) if anomaly_score is not None else None,
        "is_anomaly": kwargs.get("is_anomaly", False),
        "anomaly_level": (
            "critical" if anomaly_score and anomaly_score > 0.8
            else "warning" if anomaly_score and anomaly_score > 0.5
            else "normal" if anomaly_score is not None
            else "unknown"
        ),
        "analysis_status": status,
        "z_score": kwargs.get("z_score"),
        "mean_value": kwargs.get("mean_value"),
        "std_value": kwargs.get("std_value"),
        "samples_used": kwargs.get("samples_used", 0),
    }


# ─── Equipment Failure Prediction (RUL) ───────────────────────────────────────

def predict_equipment_failures(db: Session) -> list[dict]:
    """
    Predict equipment failures using Remaining Useful Life (RUL) estimation.
    Focuses on vibration, temperature, and pressure sensors — the best indicators
    of mechanical degradation.

    Method:
    - Fit linear regression on recent readings (trend direction + slope)
    - Project when the value will cross the critical threshold
    - Classify into urgency categories
    """
    from sklearn.linear_model import LinearRegression

    # Sensors most indicative of equipment health
    health_sensor_types = [SensorType.VIBRATION, SensorType.TEMPERATURE, SensorType.PRESSURE]

    sensors = db.query(Sensor).filter(
        Sensor.is_active == True,
        Sensor.sensor_type.in_(health_sensor_types),
    ).all()

    predictions = []

    for sensor in sensors:
        # Get last 50 readings in chronological order
        readings = (
            db.query(SensorReading)
            .filter(SensorReading.sensor_id == sensor.id)
            .order_by(asc(SensorReading.timestamp))
            .limit(50)
            .all()
        )

        if len(readings) < 5:
            predictions.append(_build_failure_result(sensor, "insufficient_data"))
            continue

        values = np.array([r.value for r in readings])
        timestamps = np.array([r.timestamp.timestamp() for r in readings])

        # Normalize timestamps to hours from first reading
        t_hours = (timestamps - timestamps[0]) / 3600.0
        t_hours = t_hours.reshape(-1, 1)

        try:
            # Fit linear regression for trend
            model = LinearRegression()
            model.fit(t_hours, values)

            slope = model.coef_[0]  # units per hour
            current_value = values[-1]
            latest_timestamp = readings[-1].timestamp

            # Calculate RUL: hours until critical threshold
            if slope > 0.001:
                # Value is increasing (bad for most sensors)
                hours_to_critical = (sensor.threshold_critical - current_value) / slope
                hours_to_warning = (sensor.threshold_warning - current_value) / slope
            elif slope < -0.001 and sensor.sensor_type == SensorType.GAS_O2:
                # O2 decreasing is dangerous
                hours_to_critical = (current_value - sensor.threshold_critical) / abs(slope)
                hours_to_warning = (current_value - sensor.threshold_warning) / abs(slope)
            else:
                # Stable or improving — no failure predicted
                predictions.append(_build_failure_result(
                    sensor, "healthy",
                    current_value=float(current_value),
                    slope_per_hour=round(float(slope), 4),
                    trend="stable" if abs(slope) < 0.01 else "improving",
                ))
                continue

            # Classify urgency
            if hours_to_critical <= 0:
                urgency = "immediate"
                rul_hours = 0
            elif hours_to_critical <= 24:
                urgency = "immediate"
                rul_hours = hours_to_critical
            elif hours_to_critical <= 168:  # 7 days
                urgency = "short_term"
                rul_hours = hours_to_critical
            elif hours_to_critical <= 672:  # 28 days
                urgency = "medium_term"
                rul_hours = hours_to_critical
            else:
                urgency = "healthy"
                rul_hours = hours_to_critical

            # Trend direction
            trend = "degrading" if slope > 0.01 else "stable" if abs(slope) < 0.01 else "improving"

            # Confidence based on R² score
            from sklearn.metrics import r2_score
            predicted_values = model.predict(t_hours)
            r2 = max(0, r2_score(values, predicted_values))

            # Predicted failure date
            failure_date = None
            if rul_hours > 0 and rul_hours < 10000:
                failure_date = (latest_timestamp + timedelta(hours=rul_hours)).isoformat()

            predictions.append(_build_failure_result(
                sensor, urgency,
                current_value=float(current_value),
                slope_per_hour=round(float(slope), 4),
                rul_hours=round(float(rul_hours), 1),
                predicted_failure=failure_date,
                trend=trend,
                confidence=round(float(r2), 3),
                readings_analyzed=len(readings),
            ))

        except Exception as e:
            predictions.append(_build_failure_result(sensor, f"error: {str(e)}"))

    return predictions


def _build_failure_result(sensor: Sensor, status: str, **kwargs) -> dict:
    """Build a standardized failure prediction result dict."""
    zone = None
    return {
        "sensor_uid": sensor.sensor_uid,
        "sensor_name": sensor.name,
        "sensor_type": sensor.sensor_type.value,
        "zone_id": sensor.zone_id,
        "unit": sensor.unit,
        "threshold_warning": sensor.threshold_warning,
        "threshold_critical": sensor.threshold_critical,
        "prediction_status": status,
        "current_value": kwargs.get("current_value"),
        "slope_per_hour": kwargs.get("slope_per_hour"),
        "rul_hours": kwargs.get("rul_hours"),
        "rul_days": round(kwargs["rul_hours"] / 24, 1) if kwargs.get("rul_hours") else None,
        "predicted_failure": kwargs.get("predicted_failure"),
        "trend": kwargs.get("trend", "unknown"),
        "confidence": kwargs.get("confidence"),
        "urgency": status if status in ("immediate", "short_term", "medium_term", "healthy") else None,
        "readings_analyzed": kwargs.get("readings_analyzed", 0),
    }


# ─── Trend Analysis ──────────────────────────────────────────────────────────

def analyze_sensor_trend(sensor_uid: str, db: Session, hours: int = 24) -> dict:
    """
    Detailed trend analysis for a specific sensor.
    Returns statistics, trend direction, and projected values.
    """
    from sklearn.linear_model import LinearRegression

    sensor = db.query(Sensor).filter(Sensor.sensor_uid == sensor_uid).first()
    if not sensor:
        return {"error": "Sensor not found"}

    since = datetime.utcnow() - timedelta(hours=hours)
    readings = (
        db.query(SensorReading)
        .filter(SensorReading.sensor_id == sensor.id, SensorReading.timestamp >= since)
        .order_by(asc(SensorReading.timestamp))
        .all()
    )

    if len(readings) < 3:
        return {
            "sensor_uid": sensor_uid,
            "error": "insufficient_data",
            "readings_found": len(readings),
        }

    values = np.array([r.value for r in readings])
    timestamps = np.array([r.timestamp.timestamp() for r in readings])
    t_hours = (timestamps - timestamps[0]) / 3600.0

    # Basic statistics
    stats = {
        "min": round(float(np.min(values)), 2),
        "max": round(float(np.max(values)), 2),
        "mean": round(float(np.mean(values)), 2),
        "std": round(float(np.std(values)), 2),
        "median": round(float(np.median(values)), 2),
        "range": round(float(np.max(values) - np.min(values)), 2),
    }

    # Trend via linear regression
    model = LinearRegression()
    model.fit(t_hours.reshape(-1, 1), values)
    slope = float(model.coef_[0])
    intercept = float(model.intercept_)

    # Project next 6 hours
    future_hours = np.array([t_hours[-1] + h for h in range(1, 7)]).reshape(-1, 1)
    projected = model.predict(future_hours)

    # Anomaly readings
    anomaly_readings = [
        {
            "timestamp": r.timestamp.isoformat(),
            "value": r.value,
        }
        for r in readings if r.is_anomaly
    ]

    return {
        "sensor_uid": sensor_uid,
        "sensor_name": sensor.name,
        "sensor_type": sensor.sensor_type.value,
        "zone_id": sensor.zone_id,
        "unit": sensor.unit,
        "analysis_window_hours": hours,
        "readings_count": len(readings),
        "statistics": stats,
        "trend": {
            "direction": "increasing" if slope > 0.01 else "decreasing" if slope < -0.01 else "stable",
            "slope_per_hour": round(slope, 4),
            "projected_6h": [
                {
                    "hours_from_now": i + 1,
                    "projected_value": round(float(projected[i]), 2),
                }
                for i in range(len(projected))
            ],
        },
        "thresholds": {
            "warning": sensor.threshold_warning,
            "critical": sensor.threshold_critical,
            "current_vs_warning_pct": round(
                (values[-1] / sensor.threshold_warning * 100) if sensor.threshold_warning > 0 else 0, 1
            ),
            "current_vs_critical_pct": round(
                (values[-1] / sensor.threshold_critical * 100) if sensor.threshold_critical > 0 else 0, 1
            ),
        },
        "anomalies_detected": len(anomaly_readings),
        "anomaly_readings": anomaly_readings[:10],
        "timestamp": datetime.utcnow().isoformat(),
    }
