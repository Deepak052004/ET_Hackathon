from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.db import Base


class AlertSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    HIGH = "high"
    CRITICAL = "critical"


class AlertStatus(str, enum.Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    ESCALATED = "escalated"
    RESOLVED = "resolved"


class AlertSource(str, enum.Enum):
    SENSOR = "sensor"
    COMPOUND_RISK = "compound_risk"
    CV_DETECTION = "cv_detection"
    PERMIT_CONFLICT = "permit_conflict"
    COMPLIANCE = "compliance"
    PREDICTIVE = "predictive"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_uid = Column(String(30), unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(Enum(AlertSeverity), nullable=False)
    source = Column(Enum(AlertSource), nullable=False)
    status = Column(Enum(AlertStatus), default=AlertStatus.ACTIVE)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id"), nullable=True)
    priority_score = Column(Float, default=50.0)  # 0-100
    compound_risk_score = Column(Float, nullable=True)
    acknowledged_by = Column(String(100), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    escalation_count = Column(Integer, default=0)
    sla_deadline = Column(DateTime, nullable=True)
    regulatory_ref = Column(String(200), nullable=True)  # e.g. "OISD-GDN-105 §4.3"
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    zone = relationship("Zone", back_populates="alerts")
