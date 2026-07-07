from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.db import Base


class PermitType(str, enum.Enum):
    HOT_WORK = "HOT_WORK"
    CONFINED_SPACE = "CONFINED_SPACE"
    ELECTRICAL = "ELECTRICAL"
    WORKING_AT_HEIGHT = "WORKING_AT_HEIGHT"
    EXCAVATION = "EXCAVATION"
    RADIOGRAPHY = "RADIOGRAPHY"
    CRITICAL_LIFT = "CRITICAL_LIFT"


class PermitStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    COMPLETED = "completed"
    REJECTED = "rejected"


class Permit(Base):
    __tablename__ = "permits"

    id = Column(Integer, primary_key=True, index=True)
    permit_uid = Column(String(30), unique=True, nullable=False)  # e.g. "PTW-2026-0847"
    permit_type = Column(Enum(PermitType), nullable=False)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    status = Column(Enum(PermitStatus), default=PermitStatus.ACTIVE)
    issued_by = Column(String(100), nullable=False)
    crew_count = Column(Integer, default=1)
    description = Column(Text, nullable=True)
    preconditions = Column(Text, nullable=True)  # JSON string
    equipment_involved = Column(Text, nullable=True)  # JSON string
    risk_score = Column(Float, default=0.0)  # AI-assessed risk
    ai_recommendation = Column(String(30), nullable=True)  # approve / approve_with_conditions / deny
    ai_reasoning = Column(Text, nullable=True)
    has_conflict = Column(Boolean, default=False)
    conflict_details = Column(Text, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    zone = relationship("Zone", back_populates="permits")
