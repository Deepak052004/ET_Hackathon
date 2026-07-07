"""
SafetyNexus AI — Knowledge Graph API
Endpoints for querying the Neo4j relationship graph.
Plan URLs: GET /api/knowledge/equipment/{id}/risks
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime

from app.services.knowledge_graph import (
    get_graph_summary,
    get_equipment_risks,
    get_zone_relationships,
    get_risk_chain,
)

router = APIRouter(prefix="/api/knowledge", tags=["knowledge-graph"])


@router.get("/graph")
def graph_overview():
    """Get overall knowledge graph statistics — node counts, relationship counts."""
    summary = get_graph_summary()
    if "error" in summary:
        raise HTTPException(status_code=503, detail=f"Neo4j unavailable: {summary['error']}")
    return {
        **summary,
        "description": "SafetyNexus Knowledge Graph — Equipment, Permit, Risk, Zone, Worker, and Incident relationships",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/equipment/{sensor_uid}/risks")
def equipment_risks(sensor_uid: str):
    """
    Get all risks connected to a piece of equipment and its zone context.
    Plan spec: GET /api/knowledge/equipment/{id}/risks
    Returns: equipment details, active risks, related incidents, active permits in zone.
    """
    result = get_equipment_risks(sensor_uid)
    if "error" in result and result["error"] == "Equipment not found":
        raise HTTPException(status_code=404, detail="Equipment/sensor not found in knowledge graph")
    if "error" in result:
        raise HTTPException(status_code=503, detail=f"Neo4j query error: {result['error']}")
    return {
        **result,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/zone/{zone_id}/relationships")
def zone_relationships(zone_id: int):
    """
    Get all entities connected to a zone — equipment, workers, permits, incidents.
    Useful for building zone detail panels on the frontend.
    """
    result = get_zone_relationships(zone_id)
    if "error" in result and result["error"] == "Zone not found":
        raise HTTPException(status_code=404, detail="Zone not found in knowledge graph")
    if "error" in result:
        raise HTTPException(status_code=503, detail=f"Neo4j query error: {result['error']}")
    return {
        **result,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/risk-chain/{zone_id}")
def risk_chain(zone_id: int):
    """
    Trace the full risk chain for a zone:
    Equipment → Risks, Permits (with conflicts), Workers at risk, Historical incidents.
    This is the "why is this zone high risk?" explainability endpoint.
    """
    result = get_risk_chain(zone_id)
    if "error" in result and result["error"] == "Zone not found":
        raise HTTPException(status_code=404, detail="Zone not found in knowledge graph")
    if "error" in result:
        raise HTTPException(status_code=503, detail=f"Neo4j query error: {result['error']}")
    return result
