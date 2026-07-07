from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from datetime import datetime
import enum
from app.models.db import Base


class SensorType(str, enum.Enum):
    GAS_H2S = "GAS_H2S"
    GAS_CH4 = "GAS_CH4"
    GAS_CO = "GAS_CO"
    GAS_O2 = "GAS_O2"
    TEMPERATURE = "TEMPERATURE"
    PRESSURE = "PRESSURE"
    VIBRATION = "VIBRATION"
    HUMIDITY = "HUMIDITY"


class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(Integer, primary_key=True, index=True)
    sensor_uid = Column(String(50), unique=True, nullable=False)  # e.g. "GAS-H2S-ZONEA-01"
    name = Column(String(100), nullable=False)
    sensor_type = Column(Enum(SensorType), nullable=False)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    # PostGIS point for sensor location
    location = Column(Geometry("POINT", srid=4326), nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    unit = Column(String(20), default="ppm")
    normal_min = Column(Float, default=0.0)
    normal_max = Column(Float, default=50.0)
    threshold_warning = Column(Float, default=35.0)
    threshold_critical = Column(Float, default=50.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    zone = relationship("Zone", back_populates="sensors")
    readings = relationship("SensorReading", back_populates="sensor", cascade="all, delete-orphan")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id"), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(20), default="ppm")
    is_anomaly = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    sensor = relationship("Sensor", back_populates="readings")
