import datetime
import random
from sqlalchemy.orm import Session
import models
import auth
from database import engine, SessionLocal

models.Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    
    # Check if we already have factories
    if db.query(models.Factory).first():
        print("Data already exists. Skipping seed.")
        db.close()
        return

    print("Generating demo data V2...")

    # Create Factories
    f1 = models.Factory(name="Sri Kaliswari Fireworks", location_lat=9.4533, location_lng=77.8024, score=100.0)
    f2 = models.Factory(name="Standard Fireworks", location_lat=9.4633, location_lng=77.8124, score=90.0)
    f3 = models.Factory(name="Sony Fireworks", location_lat=9.4433, location_lng=77.7924, is_active=False, score=45.0)
    
    db.add_all([f1, f2, f3])
    db.commit()
    db.refresh(f1)
    db.refresh(f2)
    db.refresh(f3)

    # Create Users
    admin = models.User(username="admin", role="govt", hashed_password=auth.get_password_hash("admin123"))
    owner1 = models.User(username="owner1", role="owner", factory_id=f1.id, hashed_password=auth.get_password_hash("owner123"))
    owner2 = models.User(username="owner2", role="owner", factory_id=f2.id, hashed_password=auth.get_password_hash("owner123"))

    db.add_all([admin, owner1, owner2])
    db.commit()

    now = datetime.datetime.utcnow()
    rooms = ["Storage Room", "Mixing", "Package Room"]
    
    # Generate sensor data for F1 (Normal Operations)
    for i in range(15):
        t = now - datetime.timedelta(minutes=15 - i)
        for room in rooms:
            temp = 30.0 + random.uniform(-2, 2)
            hum = 45.0 + random.uniform(-5, 5)
            gas = 10.0 + random.uniform(-2, 2)
            
            # Slightly different profiles per room
            if room == "Mixing":
                temp += 5.0 # Mixing gets hotter
                gas += 15.0
            elif room == "Storage Room":
                hum += 10.0 # Storage is more humid
                
            db.add(models.SensorData(factory_id=f1.id, room_type=room, temperature=temp, humidity=hum, gas_level=gas, flame_detected=False, timestamp=t))

    # Generate sensor data for F2 (Alerts active in Mixing)
    for i in range(15):
        t = now - datetime.timedelta(minutes=15 - i)
        for room in rooms:
            if room == "Mixing" and i > 10:
                temp = 55.0 + random.uniform(0, 5) # High temp near end
                hum = 70.0
                gas = 110.0 + random.uniform(0, 10) # High gas
                db.add(models.SensorData(factory_id=f2.id, room_type=room, temperature=temp, humidity=hum, gas_level=gas, flame_detected=(i==14), timestamp=t))
            else:
                db.add(models.SensorData(factory_id=f2.id, room_type=room, temperature=32.0, humidity=50.0, gas_level=12.0, flame_detected=False, timestamp=t))
    
    # Add alerts
    db.add(models.Alert(factory_id=f2.id, alert_type="TEMPERATURE", message="[Mixing] High temperature detected: 58.8°C", timestamp=now))
    db.add(models.Alert(factory_id=f2.id, alert_type="GAS", message="[Mixing] Gas leakage detected!", timestamp=now))
    db.add(models.Alert(factory_id=f2.id, alert_type="FLAME", message="[Mixing] Fire detected!", timestamp=now))
    
    # Factory 3 (Inactive)
    db.add(models.Alert(factory_id=f3.id, alert_type="INACTIVE", message="Factory stopped sending data for over 10 minutes", timestamp=now - datetime.timedelta(minutes=15)))
    
    db.commit()
    db.close()
    print("Demo data V2 generated successfully!")

if __name__ == "__main__":
    seed_data()
