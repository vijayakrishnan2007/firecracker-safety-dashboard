import json
import paho.mqtt.client as mqtt
from sqlalchemy.orm import Session
from database import SessionLocal
import crud
import schemas

MQTT_BROKER = "test.mosquitto.org"
MQTT_PORT = 1883
MQTT_TOPIC = "firecracker/safety/sensors"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"Connected to MQTT Broker: {MQTT_BROKER}")
        client.subscribe(MQTT_TOPIC)
    else:
        print(f"Failed to connect, return code {rc}")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        factory_id = payload.get("factory_id")
        
        if not factory_id:
            return

        sensor_data = schemas.SensorDataCreate(
            room_type=payload.get("room_type", "Storage Room"),
            temperature=payload.get("temperature", 0.0),
            humidity=payload.get("humidity", 0.0),
            dust_level=payload.get("dust_level", 0.0),
            gas_level=payload.get("gas_level", 0.0),
            flame_detected=payload.get("flame_detected", False)
        )

        db = SessionLocal()
        crud.create_sensor_data(db=db, sensor_data=sensor_data, factory_id=factory_id)
        db.close()
        print(f"Saved MQTT data for factory {factory_id}")
    except Exception as e:
        print(f"Error parsing MQTT message: {e}")

def start_mqtt():
    client = mqtt.Client(client_id="", clean_session=True)
    client.on_connect = on_connect
    client.on_message = on_message
    
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        print("MQTT Client started in background.")
    except Exception as e:
        print(f"MQTT Connection failed: {e}")
