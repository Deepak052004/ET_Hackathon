from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import random
from app.models.db import get_db
from app.models.alert import Alert, AlertSeverity, AlertSource, AlertStatus
from app.models.zone import Zone

router = APIRouter(prefix="/api/vision", tags=["vision"])

CCTV_CAMERAS = [
    {"id": "CAM-01", "name": "Blast Furnace Entrance", "zone_id": 1, "status": "active"},
    {"id": "CAM-02", "name": "Hot Strip Mill Floor", "zone_id": 2, "status": "active"},
    {"id": "CAM-03", "name": "Coke Oven Battery Deck", "zone_id": 3, "status": "active"},
    {"id": "CAM-04", "name": "Steel Melting Shop Conveyor", "zone_id": 4, "status": "active"},
]

@router.get("/cameras")
def get_cameras():
    """Returns the list of active CCTV camera feeds in the plant."""
    return {"cameras": CCTV_CAMERAS}

@router.post("/trigger_mock_detection")
def trigger_mock_detection(db: Session = Depends(get_db)):
    """
    MOCK ENDPOINT: Simulates a YOLOv8 computer vision model detecting a PPE or Safety Violation 
    via a CCTV feed and sending it to the backend.
    """
    camera = random.choice(CCTV_CAMERAS)
    zone_id = camera["zone_id"]
    
    # Randomly select a violation type
    violations = [
        {"title": "Missing Hard Hat Detected", "desc": "Worker detected without helmet near heavy machinery.", "sev": AlertSeverity.HIGH},
        {"title": "Missing High-Vis Vest", "desc": "Worker detected without reflective vest in active forklift zone.", "sev": AlertSeverity.WARNING},
        {"title": "Unauthorized Access (Red Zone)", "desc": "Person detected entering a restricted hazardous area.", "sev": AlertSeverity.CRITICAL},
        {"title": "Fall Detected", "desc": "Worker slip/fall detected. Motion analysis triggered.", "sev": AlertSeverity.CRITICAL}
    ]
    
    violation = random.choice(violations)
    
    # Retrieve zone details
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    zone_name = zone.name if zone else f"Zone {zone_id}"
    
    # Create the alert
    new_alert = Alert(
        alert_uid=f"CV-{str(uuid.uuid4())[:8].upper()}",
        title=f"CV: {violation['title']} in {zone_name}",
        description=f"Camera {camera['id']} ({camera['name']}): {violation['desc']}",
        severity=violation['sev'],
        source=AlertSource.CV_DETECTION,
        status=AlertStatus.ACTIVE,
        zone_id=zone_id,
        priority_score=80.0 if violation['sev'] == AlertSeverity.CRITICAL else 60.0,
        created_at=datetime.utcnow()
    )
    
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    
    return {
        "status": "success", 
        "message": "Mock YOLOv8 detection triggered and alert generated.",
        "alert_uid": new_alert.alert_uid
    }
