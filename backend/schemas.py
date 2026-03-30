from pydantic import BaseModel, ConfigDict
from typing import List, Optional
import datetime

class SensorDataBase(BaseModel):
    room_type: str
    temperature: float
    humidity: float
    gas_level: float
    dust_level: float = 0.0
    flame_detected: bool

class SensorDataCreate(SensorDataBase):
    pass

class SensorData(SensorDataBase):
    id: int
    factory_id: int
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

class AlertBase(BaseModel):
    alert_type: str
    message: str

class AlertCreate(AlertBase):
    pass

class Alert(AlertBase):
    id: int
    factory_id: int
    timestamp: datetime.datetime
    is_resolved: bool

    class Config:
        from_attributes = True

class FactoryBase(BaseModel):
    name: str
    location_lat: float
    location_lng: float

class FactoryCreate(FactoryBase):
    pass

class Factory(FactoryBase):
    id: int
    is_active: bool
    last_seen: datetime.datetime
    owner_id: Optional[int] = None
    score: float = 100.0

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    role: str

class UserCreate(UserBase):
    password: str
    factory_id: Optional[int] = None

class User(UserBase):
    id: int
    factory_id: Optional[int] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    factory_id: Optional[int] = None
