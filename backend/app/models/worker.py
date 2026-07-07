from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Boolean, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.db import Base


class WorkerRole(str, enum.Enum):
    OPERATOR = "operator"
    SUPERVISOR = "supervisor"
    MAINTENANCE = "maintenance"
    SAFETY_OFFICER = "safety_officer"
    CONTRACTOR = "contractor"
    ENGINEER = "engineer"


class PPEStatus(str, enum.Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    UNKNOWN = "unknown"


class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(20), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(Enum(WorkerRole), default=WorkerRole.OPERATOR)
    department = Column(String(100), nullable=True)
    shift = Column(String(20), default="day")  # day, night, rotating
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    ppe_status = Column(Enum(PPEStatus), default=PPEStatus.UNKNOWN)
    is_on_site = Column(Boolean, default=True)
    certifications = Column(String(500), nullable=True)  # comma-separated
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    zone = relationship("Zone", back_populates="workers")
