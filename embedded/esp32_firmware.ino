#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ==========================================
// User Configuration
// ==========================================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

const char* mqtt_server = "test.mosquitto.org";
const int mqtt_port = 1883;
const char* mqtt_topic = "firecracker/safety/sensors";

const int FACTORY_ID = 2;              // Identifier for your factory in dashboard
const char* ROOM_TYPE = "Mixing";      // Room being monitored

// ==========================================
// Hardware Pins
// ==========================================
#define TEMP_PIN 34       // Analog pin for Temperature (e.g., TMP36 or NTC)
#define gas_PIN 35        // Analog pin for Gas (e.g., MQ-2)
#define FLAME_PIN 32      // Digital pin for Flame Sensor 
#define BUZZER_PIN 25     // Digital pin for active buzzer
#define RELAY_PIN 26      // Digital pin for Relay (Controls main bulb/current)

// ==========================================
// Safety Thresholds
// ==========================================
const float TEMP_THRESHOLD = 50.0;   // 50 Degrees Celsius
const float GAS_THRESHOLD = 100.0;   // Arbitrary units depending on sensor calibration

WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    // Create a random client ID
    String clientId = "ESP32Client-FireGuard-";
    clientId += String(random(0, 0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  
  // Initialize Pins
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(FLAME_PIN, INPUT);

  // Default States (Relay LOW might mean 'ON' depending on your relay module natively - adjust if needed)
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(RELAY_PIN, LOW); // Assumes LOW = Bulb ON (Normal state)

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // 1. Read Sensor Data
  int rawTemp = analogRead(TEMP_PIN);
  int rawGas = analogRead(gas_PIN);
  int flameVal = digitalRead(FLAME_PIN); 

  // Convert raw analog values to human readable metrics (You must calibrate these to your specific sensors)
  float temperature = (rawTemp / 4095.0) * 3300; // ESP32 ADC is 12-bit (4095) for 3.3V
  temperature = temperature / 10.0; // Approximation for LM35/TMP36
  
  float gasLevel = (rawGas / 4095.0) * 1000.0; // Simple percentage map
  
  // Most flame sensors read LOW (0) when fire is detected, HIGH (1) when safe
  bool isFlameDetected = (flameVal == LOW); 
  float humidity = 50.0; // Stub: If you use a DHT11/DHT22 later, add the DHT library

  // 2. Local Safety Checks (Buzzer & Relay Shutoff)
  bool triggerAlarm = false;
  
  if (temperature > TEMP_THRESHOLD || gasLevel > GAS_THRESHOLD || isFlameDetected) {
     triggerAlarm = true;
  }

  if (triggerAlarm) {
     digitalWrite(BUZZER_PIN, HIGH);     // Sound buzzer
     digitalWrite(RELAY_PIN, HIGH);      // Cut off relay/bulb (assuming HIGH triggers NC disconnect)
     Serial.println("ALARM! Thresholds breached. Power isolated.");
  } else {
     digitalWrite(BUZZER_PIN, LOW);      // Silence buzzer
     digitalWrite(RELAY_PIN, LOW);       // Keep relay passing power safely
  }

  // 3. Construct JSON Payload to send to your backend Dashboard
  StaticJsonDocument<200> doc;
  doc["factory_id"] = FACTORY_ID;
  doc["room_type"] = ROOM_TYPE;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["gas_level"] = gasLevel;
  doc["flame_detected"] = isFlameDetected;

  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);

  // 4. Publish to MQTT Broker
  Serial.print("Publishing struct: ");
  Serial.println(jsonBuffer);
  client.publish(mqtt_topic, jsonBuffer);

  // Publish every 5 seconds
  delay(5000);
}
