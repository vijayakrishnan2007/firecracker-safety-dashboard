from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String) # 'owner' or 'govt'
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=True)
    
    factory = relationship("Factory", back_populates="owner")

class Factory(Base):
    __tablename__ = "factories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    location_lat = Column(Float)
    location_lng = Column(Float)
    is_active = Column(Boolean, default=True)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)
    score = Column(Float, default=100.0)
    
    owner = relationship("User", back_populates="factory", uselist=False)
    sensors = relationship("SensorData", back_populates="factory")
    alerts = relationship("Alert", back_populates="factory")

class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, index=True)
    factory_id = Column(Integer, ForeignKey("factories.id"))
    room_type = Column(String, default="Storage Room")
    temperature = Column(Float)
    humidity = Column(Float, default=0.0)
    dust_level = Column(Float, default=0.0)
    gas_level = Column(Float)
    flame_detected = Column(Boolean)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    factory = relationship("Factory", back_populates="sensors")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    factory_id = Column(Integer, ForeignKey("factories.id"))
    alert_type = Column(String) # 'TEMPERATURE', 'GAS', 'FLAME', 'INACTIVE'
    message = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    is_resolved = Column(Boolean, default=False)

    factory = relationship("Factory", back_populates="alerts")
