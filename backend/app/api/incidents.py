from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime
from app.models.db import get_db
from app.models.incident import Incident, IncidentType, IncidentSeverity
from app.models.zone import Zone

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


def _incident_to_dict(incident: Incident) -> dict:
    return {
        "id": incident.id,
        "incident_uid": incident.incident_uid,
        "incident_type": incident.incident_type.value,
        "severity": incident.severity.value,
        "zone_id": incident.zone_id,
        "zone_name": incident.zone.name if incident.zone else None,
        "title": incident.title,
        "description": incident.description,
        "root_cause": incident.root_cause,
        "workers_affected": incident.workers_affected,
        "injuries": incident.injuries,
        "fatalities": incident.fatalities,
        "property_damage_inr": incident.property_damage_inr,
        "occurred_at": incident.occurred_at.isoformat(),
        "reported_at": incident.reported_at.isoformat() if incident.reported_at else None,
        "resolved_at": incident.resolved_at.isoformat() if incident.resolved_at else None,
    }


@router.get("/")
def get_incidents(
    severity: str | None = Query(None),
    incident_type: str | None = Query(None),
    zone_id: int | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    from sqlalchemy.orm import joinedload
    query = db.query(Incident).options(joinedload(Incident.zone)).order_by(desc(Incident.occurred_at))
    if severity:
        query = query.filter(Incident.severity == severity)
    if incident_type:
        query = query.filter(Incident.incident_type == incident_type)
    if zone_id:
        query = query.filter(Incident.zone_id == zone_id)

    incidents = query.limit(limit).all()

    # Stats
    stats = {
        "total": db.query(Incident).count(),
        "fatalities": db.query(func.sum(Incident.fatalities)).scalar() or 0,
        "injuries": db.query(func.sum(Incident.injuries)).scalar() or 0,
        "near_misses": db.query(Incident).filter(Incident.severity == IncidentSeverity.NEAR_MISS).count(),
    }

    return {
        "incidents": [_incident_to_dict(i) for i in incidents],
        "stats": stats,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/search")
async def search_incidents(q: str = Query(..., description="Natural language search query"), db: Session = Depends(get_db)):
    """RAG-powered incident search using Gemini + ChromaDB."""
    from app.services.rag import query_incidents
    results = await query_incidents(q, db)
    return results
