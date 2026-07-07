from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from datetime import datetime
from app.models.db import get_db
from app.models.alert import Alert, AlertSeverity, AlertStatus
from app.models.zone import Zone
from pydantic import BaseModel

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


class AlertAcknowledgeRequest(BaseModel):
    acknowledged_by: str


class AlertEscalateRequest(BaseModel):
    reason: str


def _alert_to_dict(alert: Alert) -> dict:
    return {
        "id": alert.id,
        "alert_uid": alert.alert_uid,
        "title": alert.title,
        "description": alert.description,
        "severity": alert.severity.value,
        "source": alert.source.value,
        "status": alert.status.value,
        "zone_id": alert.zone_id,
        "zone_name": alert.zone.name if alert.zone else None,
        "priority_score": alert.priority_score,
        "compound_risk_score": alert.compound_risk_score,
        "acknowledged_by": alert.acknowledged_by,
        "acknowledged_at": alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
        "sla_deadline": alert.sla_deadline.isoformat() if alert.sla_deadline else None,
        "sla_breached": alert.sla_deadline < datetime.utcnow() if alert.sla_deadline else False,
        "regulatory_ref": alert.regulatory_ref,
        "escalation_count": alert.escalation_count,
        "created_at": alert.created_at.isoformat(),
        "updated_at": alert.updated_at.isoformat() if alert.updated_at else None,
    }


@router.get("/")
def get_alerts(
    status: str | None = Query(None),
    severity: str | None = Query(None),
    zone_id: int | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Get all alerts with optional filtering."""
    query = db.query(Alert).options(joinedload(Alert.zone)).order_by(
        desc(Alert.priority_score), desc(Alert.created_at)
    )
    if status:
        query = query.filter(Alert.status == status)
    if severity:
        query = query.filter(Alert.severity == severity)
    if zone_id:
        query = query.filter(Alert.zone_id == zone_id)

    alerts = query.limit(limit).all()
    
    counts = {
        "total": db.query(Alert).filter(Alert.status == AlertStatus.ACTIVE).count(),
        "critical": db.query(Alert).filter(Alert.severity == AlertSeverity.CRITICAL, Alert.status == AlertStatus.ACTIVE).count(),
        "high": db.query(Alert).filter(Alert.severity == AlertSeverity.HIGH, Alert.status == AlertStatus.ACTIVE).count(),
        "warning": db.query(Alert).filter(Alert.severity == AlertSeverity.WARNING, Alert.status == AlertStatus.ACTIVE).count(),
    }

    return {
        "alerts": [_alert_to_dict(a) for a in alerts],
        "counts": counts,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/{alert_uid}")
def get_alert(alert_uid: str, db: Session = Depends(get_db)):
    alert = db.query(Alert).options(joinedload(Alert.zone)).filter(Alert.alert_uid == alert_uid).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return _alert_to_dict(alert)


@router.post("/{alert_uid}/acknowledge")
def acknowledge_alert(alert_uid: str, body: AlertAcknowledgeRequest, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.alert_uid == alert_uid).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = AlertStatus.ACKNOWLEDGED
    alert.acknowledged_by = body.acknowledged_by
    alert.acknowledged_at = datetime.utcnow()
    db.commit()
    return {"success": True, "alert_uid": alert_uid, "status": "acknowledged"}


@router.post("/{alert_uid}/escalate")
def escalate_alert(alert_uid: str, body: AlertEscalateRequest, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.alert_uid == alert_uid).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = AlertStatus.ESCALATED
    alert.escalation_count = (alert.escalation_count or 0) + 1
    db.commit()
    return {"success": True, "alert_uid": alert_uid, "escalation_count": alert.escalation_count}


@router.post("/{alert_uid}/resolve")
def resolve_alert(alert_uid: str, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.alert_uid == alert_uid).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = AlertStatus.RESOLVED
    alert.resolved_at = datetime.utcnow()
    db.commit()
    return {"success": True, "alert_uid": alert_uid, "status": "resolved"}
