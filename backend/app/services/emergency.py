import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.zone import Zone
from app.models.alert import Alert, AlertSeverity, AlertSource, AlertStatus
from app.api.risk import _compute_zone_risk
from app.api.compliance import _evaluate_violations

def check_and_trigger_evacuations(db: Session):
    """
    Monitors all zones by continuously computing their real-time Compound Risk Score,
    including Compliance penalties. If the score exceeds 90, it triggers an evacuation.
    """
    zones = db.query(Zone).all()
    
    # 1. Evaluate global compliance violations once
    violations = _evaluate_violations(db)
    has_compliance_issues = len(violations) > 0
    
    for zone in zones:
        # 2. Compute dynamic compound risk
        risk_data = _compute_zone_risk(zone, db)
        real_time_score = risk_data["risk_score"]
        
        # 3. Apply Advanced Compliance Penalty
        if has_compliance_issues:
            # Add a flat 15 point penalty if there are critical plant-wide compliance failures
            real_time_score = min(100.0, real_time_score + 15.0)
            
        # 4. Save the live score to the database so the frontend sees the exact number
        zone.risk_score = real_time_score
        
        # 5. Check Emergency Threshold
        if real_time_score >= 90.0:
            # Check if an evacuation alert already exists and is active
            recent_alert = db.query(Alert).filter(
                Alert.zone_id == zone.id,
                Alert.source == AlertSource.COMPOUND_RISK,
                Alert.severity == AlertSeverity.CRITICAL,
                Alert.title.like("EVACUATION INITIATED%"),
                Alert.status == AlertStatus.ACTIVE
            ).first()
            
            if not recent_alert:
                safe_route = f"Exit {zone.name} immediately via North Gate. Proceed to Assembly Point Alpha."
                
                new_alert = Alert(
                    alert_uid=f"EVAC-{str(uuid.uuid4())[:8].upper()}",
                    title=f"EVACUATION INITIATED: {zone.name}",
                    description=f"CRITICAL RISK ({round(real_time_score, 1)}). Immediate evacuation required. {safe_route}",
                    severity=AlertSeverity.CRITICAL,
                    source=AlertSource.COMPOUND_RISK,
                    status=AlertStatus.ACTIVE,
                    zone_id=zone.id,
                    priority_score=100.0,
                    compound_risk_score=real_time_score,
                    created_at=datetime.utcnow()
                )
                db.add(new_alert)
    
    # Commit risk score updates and any new alerts
    db.commit()
