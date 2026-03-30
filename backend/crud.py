from sqlalchemy.orm import Session
import models, schemas, auth
import datetime

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        role=user.role,
        hashed_password=hashed_password,
        factory_id=user.factory_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_factories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Factory).offset(skip).limit(limit).all()

def get_factory(db: Session, factory_id: int):
    return db.query(models.Factory).filter(models.Factory.id == factory_id).first()

def create_factory(db: Session, factory: schemas.FactoryCreate):
    db_factory = models.Factory(**factory.model_dump())
    db.add(db_factory)
    db.commit()
    db.refresh(db_factory)
    return db_factory

def create_sensor_data(db: Session, sensor_data: schemas.SensorDataCreate, factory_id: int):
    # Update factory last seen and score
    factory = db.query(models.Factory).filter(models.Factory.id == factory_id).first()
    if factory:
        factory.last_seen = datetime.datetime.utcnow()
        factory.is_active = True
        
        # Simple dynamic score logic: basic reset on data ingest
        # Score will be decremented by alerts
        if factory.score < 100.0:
            factory.score = min(100.0, factory.score + 0.5)

    db_sensor_data = models.SensorData(**sensor_data.model_dump(), factory_id=factory_id)
    db.add(db_sensor_data)
    
    # Simple alert logic
    if sensor_data.dust_level > 150.0:
        create_alert(db, schemas.AlertCreate(alert_type="DUST", message=f"[{sensor_data.room_type}] PM2.5 level high: {sensor_data.dust_level} µg/m³"), factory_id)
    if sensor_data.temperature > 50.0:
        create_alert(db, schemas.AlertCreate(alert_type="TEMPERATURE", message=f"[{sensor_data.room_type}] High temp: {sensor_data.temperature}°C"), factory_id)
    if sensor_data.humidity > 80.0:
        create_alert(db, schemas.AlertCreate(alert_type="HUMIDITY", message=f"[{sensor_data.room_type}] High humidity: {sensor_data.humidity}%"), factory_id)
    if sensor_data.gas_level > 100.0:
        create_alert(db, schemas.AlertCreate(alert_type="GAS", message=f"[{sensor_data.room_type}] Gas leakage detected!"), factory_id)
    if sensor_data.flame_detected:
        create_alert(db, schemas.AlertCreate(alert_type="FLAME", message=f"[{sensor_data.room_type}] Fire detected!"), factory_id)

    db.commit()
    db.refresh(db_sensor_data)
    return db_sensor_data

def get_sensor_data(db: Session, factory_id: int, limit: int = 100):
    return db.query(models.SensorData).filter(models.SensorData.factory_id == factory_id).order_by(models.SensorData.timestamp.desc()).limit(limit).all()

def create_alert(db: Session, alert: schemas.AlertCreate, factory_id: int):
    db_alert = models.Alert(**alert.model_dump(), factory_id=factory_id)
    db.add(db_alert)
    
    factory = db.query(models.Factory).filter(models.Factory.id == factory_id).first()
    if factory:
        factory.score = max(0.0, factory.score - 10.0)
        
    db.commit()
    db.refresh(db_alert)
    return db_alert

def get_alerts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Alert).order_by(models.Alert.timestamp.desc()).offset(skip).limit(limit).all()

def get_alerts_by_factory(db: Session, factory_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Alert).filter(models.Alert.factory_id == factory_id).order_by(models.Alert.timestamp.desc()).offset(skip).limit(limit).all()

def resolve_alert(db: Session, alert_id: int):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if alert:
        alert.is_resolved = True
        db.commit()
        db.refresh(alert)
    return alert
