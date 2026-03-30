import time
import json
import random
import paho.mqtt.client as mqtt

MQTT_BROKER = "test.mosquitto.org"
MQTT_PORT = 1883
MQTT_TOPIC = "firecracker/safety/sensors"

# Factory IDs assuming 1="Sri Kaliswari", 2="Standard Fireworks", 3="Sony Fireworks"
FACTORIES = [1, 2, 3]
ROOMS = ["Storage Room", "Mixing", "Package Room"]

def simulate_data():
    client = mqtt.Client(client_id="firecracker_simulator", clean_session=True)
    
    print("Connecting to MQTT Broker...")
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        print("Connected! Simulating live data...")
    except Exception as e:
        print(f"Failed to connect: {e}")
        return

    try:
        while True:
            for factory_id in FACTORIES:
                # Factory 3 is generally inactive, maybe skip it 80% of the time to trigger inactivity
                if factory_id == 3 and random.random() < 0.8:
                    continue

                for room in ROOMS:
                    # Base normal values
                    temp = 30.0 + random.uniform(-2, 2)
                    hum = 45.0 + random.uniform(-5, 5)
                    gas = 10.0 + random.uniform(-2, 2)
                    dust = 30.0 + random.uniform(-5, 15)
                    flame = False

                    # Specific room adjustments
                    if room == "Mixing":
                        temp += 5.0 + random.uniform(-4, 4)
                        gas += 20.0 + random.uniform(-3, 8)
                        dust += 50.0 + random.uniform(0, 40)
                    elif room == "Storage Room":
                        hum += 10.0 + random.uniform(-2, 5)

                    # Introduce random anomalies/alerts for factory 1 and 2
                    alert_chance = random.random()
                    if alert_chance < 0.05: # 5% chance of temp alert
                        temp = 55.0 + random.uniform(0, 10)
                    elif alert_chance > 0.95: # 5% chance of gas alert
                        gas = 110.0 + random.uniform(0, 20)
                    elif 0.50 < alert_chance < 0.52: # 2% chance of fire
                        flame = True
                        temp = 80.0
                    elif 0.60 < alert_chance < 0.65: # 5% chance of high humidity in storage
                        hum = 85.0 + random.uniform(0, 5)
                    elif 0.70 < alert_chance < 0.75: # 5% chance of high dust
                        dust = 160.0 + random.uniform(0, 50)

                    payload = {
                        "factory_id": factory_id,
                        "room_type": room,
                        "temperature": round(temp, 2),
                        "humidity": round(hum, 2),
                        "dust_level": round(dust, 2),
                        "gas_level": round(gas, 2),
                        "flame_detected": flame
                    }

                    client.publish(MQTT_TOPIC, json.dumps(payload))
                    print(f"Published to Factory {factory_id} - {room}: {payload}")
                    
                    time.sleep(1) # delay between room updates
            
            print("--- Waiting for next cycle ---")
            time.sleep(5) # global delay between cycles

    except KeyboardInterrupt:
        print("Simulation stopped.")
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    simulate_data()
