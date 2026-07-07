from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.db import Base


class IncidentSeverity(str, enum.Enum):
    NEAR_MISS = "near_miss"
    MINOR = "minor"
    MODERATE = "moderate"
    MAJOR = "major"
    FATAL = "fatal"


class IncidentType(str, enum.Enum):
    GAS_LEAK = "gas_leak"
    FIRE = "fire"
    EXPLOSION = "explosion"
    PPE_VIOLATION = "ppe_violation"
    EQUIPMENT_FAILURE = "equipment_failure"
    ZONE_VIOLATION = "zone_violation"
    CHEMICAL_SPILL = "chemical_spill"
    ELECTRICAL = "electrical"
    FALL = "fall"
    SHIFT_HANDOVER_FAILURE = "shift_handover_failure"


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_uid = Column(String(30), unique=True, nullable=False)
    incident_type = Column(Enum(IncidentType), nullable=False)
    severity = Column(Enum(IncidentSeverity), nullable=False)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    root_cause = Column(Text, nullable=True)
    contributing_factors = Column(Text, nullable=True)  # JSON string
    actions_taken = Column(Text, nullable=True)
    equipment_involved = Column(String(500), nullable=True)
    workers_affected = Column(Integer, default=0)
    injuries = Column(Integer, default=0)
    fatalities = Column(Integer, default=0)
    property_damage_inr = Column(Float, default=0.0)
    occurred_at = Column(DateTime, nullable=False)
    reported_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    zone = relationship("Zone", back_populates="incidents")
