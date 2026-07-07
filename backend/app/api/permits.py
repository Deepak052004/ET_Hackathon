from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from pydantic import BaseModel
from app.models.db import get_db
from app.models.permit import Permit, PermitStatus, PermitType
from app.models.zone import Zone

router = APIRouter(prefix="/api/permits", tags=["permits"])


class PermitCreateRequest(BaseModel):
    permit_type: str
    zone_id: int
    description: str
    crew_count: int
    start_time: datetime
    end_time: datetime
    issued_by: str


def _permit_to_dict(permit: Permit) -> dict:
    now = datetime.utcnow()
    remaining_minutes = int((permit.end_time - now).total_seconds() / 60) if permit.end_time > now else 0
    return {
        "id": permit.id,
        "permit_uid": permit.permit_uid,
        "permit_type": permit.permit_type.value,
        "zone_id": permit.zone_id,
        "zone_name": permit.zone.name if permit.zone else None,
        "status": permit.status.value,
        "issued_by": permit.issued_by,
        "crew_count": permit.crew_count,
        "description": permit.description,
        "risk_score": permit.risk_score,
        "ai_recommendation": permit.ai_recommendation,
        "ai_reasoning": permit.ai_reasoning,
        "has_conflict": permit.has_conflict,
        "conflict_details": permit.conflict_details,
        "start_time": permit.start_time.isoformat(),
        "end_time": permit.end_time.isoformat(),
        "remaining_minutes": remaining_minutes,
        "is_overdue": permit.end_time < now and permit.status == PermitStatus.ACTIVE,
        "created_at": permit.created_at.isoformat(),
    }


@router.get("/")
def get_permits(
    status: str | None = Query(None),
    zone_id: int | None = Query(None),
    permit_type: str | None = Query(None),
    db: Session = Depends(get_db),
):
    from sqlalchemy.orm import joinedload
    query = db.query(Permit).options(joinedload(Permit.zone)).order_by(desc(Permit.created_at))
    if status:
        query = query.filter(Permit.status == status)
    if zone_id:
        query = query.filter(Permit.zone_id == zone_id)
    if permit_type:
        query = query.filter(Permit.permit_type == permit_type)

    permits = query.limit(100).all()
    active_count = db.query(Permit).filter(Permit.status == PermitStatus.ACTIVE).count()
    conflict_count = db.query(Permit).filter(Permit.has_conflict == True, Permit.status == PermitStatus.ACTIVE).count()

    return {
        "permits": [_permit_to_dict(p) for p in permits],
        "active_count": active_count,
        "conflict_count": conflict_count,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/assess")
async def assess_permit(body: PermitCreateRequest, db: Session = Depends(get_db)):
    """
    AI-powered permit risk assessment using Gemini.
    Checks current zone conditions, active permit overlaps, and provides a recommendation.
    """
    from app.services.permit_agent import assess_permit_risk
    
    zone = db.query(Zone).filter(Zone.id == body.zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    # Check for overlapping active permits
    overlapping = db.query(Permit).filter(
        Permit.zone_id == body.zone_id,
        Permit.status == PermitStatus.ACTIVE,
    ).all()

    assessment = await assess_permit_risk(
        zone=zone,
        permit_type=body.permit_type,
        crew_count=body.crew_count,
        start_time=body.start_time,
        end_time=body.end_time,
        overlapping_permits=overlapping,
        db=db,
    )
    return assessment


@router.post("/{permit_uid}/suspend")
def suspend_permit(permit_uid: str, db: Session = Depends(get_db)):
    permit = db.query(Permit).filter(Permit.permit_uid == permit_uid).first()
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")
    permit.status = PermitStatus.SUSPENDED
    db.commit()
    return {"success": True, "permit_uid": permit_uid, "status": "suspended"}
