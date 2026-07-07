from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from datetime import datetime
import enum
from app.models.db import Base


class ZoneClassification(str, enum.Enum):
    SAFE = "safe"
    RESTRICTED = "restricted"
    HAZARDOUS = "hazardous"
    CRITICAL = "critical"


class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    classification = Column(Enum(ZoneClassification), default=ZoneClassification.SAFE)
    area_sqm = Column(Float, default=0.0)
    description = Column(Text, nullable=True)
    # PostGIS polygon for zone boundary (lat/lng)
    geometry = Column(Geometry("POLYGON", srid=4326), nullable=True)
    # Center point for heatmap calculation
    center_lat = Column(Float, nullable=False, default=17.6868)
    center_lng = Column(Float, nullable=False, default=83.2185)
    risk_score = Column(Float, default=0.0)  # 0-100, updated by risk engine
    created_at = Column(DateTime, default=datetime.utcnow)

    sensors = relationship("Sensor", back_populates="zone")
    workers = relationship("Worker", back_populates="zone")
    permits = relationship("Permit", back_populates="zone")
    incidents = relationship("Incident", back_populates="zone")
    alerts = relationship("Alert", back_populates="zone")
