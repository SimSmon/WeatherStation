// ============================================================
// WeatherStation - Sonde ESP32 autonome
// Capteurs : AHT20 + BMP280
// Batterie Li-Ion + TP4056
// Deep Sleep
// ============================================================

#include <WiFi.h>
#include <WiFiClient.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_AHTX0.h>
#include <Adafruit_BMP280.h>
#include <esp_wifi.h>

// ============================================================
// CONFIGURATION WIFI
// ============================================================

const char* ssid     = "Freebox-7721D6";
const char* password = "m92wbq4246qfvdfrqr4c5n";

// ============================================================
// CONFIGURATION API
// ============================================================

const char* serverUrl = "http://192.168.1.76:3001/api/weather";

// ============================================================
// IDENTITÉ DE LA SONDE
// ============================================================

const char* sensorId = "Sonde2";
const char* name     = "Chambre";
const char* location = "indoor";
const char* firmware = "2.1.6";

// ============================================================
// BROCHES
// ============================================================

#define LED_BLEUE      13

#define BATTERY_ADC    34

// I2C
// SDA = GPIO21
// SCL = GPIO22

// ============================================================
// RÉGLAGES
// ============================================================

const unsigned long WIFI_TIMEOUT_MS   = 15000;
const unsigned long HTTP_TIMEOUT_MS   = 8000;

const uint64_t SLEEP_DURATION_US =
    5ULL * 60ULL * 1000000ULL;

// ============================================================
// CAPTEURS
// ============================================================

Adafruit_AHTX0  aht;
Adafruit_BMP280 bmp;

// ============================================================
// CONNEXION WIFI
// ============================================================

bool connectWiFi() {

    WiFi.mode(WIFI_STA);

    esp_wifi_set_ps(WIFI_PS_NONE);

    WiFi.setTxPower(WIFI_POWER_19_5dBm);

    WiFi.begin(ssid, password);

    Serial.print("Connexion WiFi");

    unsigned long start = millis();

    while(WiFi.status() != WL_CONNECTED) {

        if(millis() - start > WIFI_TIMEOUT_MS) {

            Serial.println("\nTimeout WiFi");

            return false;
        }

        digitalWrite(LED_BLEUE, HIGH);
        delay(250);

        digitalWrite(LED_BLEUE, LOW);
        delay(250);

        Serial.print(".");
    }

    Serial.println("\nWiFi connecté");

    Serial.print("IP : ");
    Serial.println(WiFi.localIP());

    Serial.print("RSSI : ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");

    return true;
}

// ============================================================
// LECTURE BATTERIE
// ============================================================

float readBatteryVoltage() {
    delay(5);

    int mv = analogReadMilliVolts(BATTERY_ADC);

    float voltageADC = mv / 1000.0f;
    float batteryVoltage = voltageADC * 2.0f;

    Serial.print("Batterie : ");
    Serial.print(batteryVoltage, 2);
    Serial.println(" V");

    return batteryVoltage;
}

// ============================================================
// POURCENTAGE BATTERIE
// ============================================================

float batteryToPercent(float v){

    if(v >= 4.20) return 100;
    if(v >= 4.10) return 90 + (v-4.10)*100;
    if(v >= 4.00) return 80 + (v-4.00)*100;
    if(v >= 3.92) return 70 + (v-3.92)*125;
    if(v >= 3.87) return 60 + (v-3.87)*200;
    if(v >= 3.82) return 50 + (v-3.82)*200;
    if(v >= 3.79) return 40 + (v-3.79)*333;
    if(v >= 3.75) return 30 + (v-3.75)*250;
    if(v >= 3.70) return 20 + (v-3.70)*200;
    if(v >= 3.60) return 10 + (v-3.60)*100;

    return 0;
}

// ============================================================
// LECTURE CAPTEURS
// ============================================================

bool readSensors(
    float &temp,
    float &humidity,
    float &pressure
) {

    sensors_event_t hum;
    sensors_event_t ahtTemp;

    if(!aht.getEvent(&hum, &ahtTemp)) {

        Serial.println("Erreur AHT20");

        return false;
    }

    temp =
        ahtTemp.temperature;

    humidity =
        hum.relative_humidity;

    pressure =
        bmp.readPressure() / 100.0F;

    if(
        isnan(pressure) ||
        pressure < 800 ||
        pressure > 1100
    ) {

        Serial.println("Erreur BMP280");

        return false;
    }

    Serial.print("Température : ");
    Serial.print(temp);
    Serial.println(" °C");

    Serial.print("Humidité : ");
    Serial.print(humidity);
    Serial.println(" %");

    Serial.print("Pression : ");
    Serial.print(pressure);
    Serial.println(" hPa");

    return true;
}

// ============================================================
// ENVOI API
// ============================================================

bool sendData(
    float temp,
    float humidity,
    float pressure,
    float battery,
    int rssi
) {

    WiFiClient client;

    HTTPClient http;

    client.setTimeout(
        HTTP_TIMEOUT_MS / 1000
    );

    http.setConnectTimeout(
        HTTP_TIMEOUT_MS
    );

    http.setTimeout(
        HTTP_TIMEOUT_MS
    );

    http.begin(client, serverUrl);

    http.addHeader(
        "Content-Type",
        "application/json"
    );

    char payload[512];

    snprintf(
        payload,
        sizeof(payload),

        "{\"sensor_id\":\"%s\","
        "\"name\":\"%s\","
        "\"location\":\"%s\","
        "\"firmware\":\"%s\","
        "\"temperature\":%.2f,"
        "\"humidity\":%.1f,"
        "\"pressure\":%.1f,"
        "\"battery\":%.2f,"
        "\"wifi_rssi\":%d}",

        sensorId,
        name,
        location,
        firmware,
        temp,
        humidity,
        pressure,
        battery,
        rssi
    );
    Serial.println("JSON :");

    Serial.println(payload);

    int code =
        http.POST(payload);

    http.end();

    client.stop();

    if(code == 200) {

        Serial.println("Envoi OK");

        return true;
    }

    Serial.print("Erreur HTTP : ");

    Serial.println(code);

    return false;
}

// ============================================================
// DEEP SLEEP
// ============================================================

void goToSleep() {

    Serial.print("Deep sleep ");

    Serial.print(
        SLEEP_DURATION_US / 1000000 / 60
    );

    Serial.println(" min");

    Serial.flush();

    digitalWrite(LED_BLEUE, LOW);

    WiFi.disconnect(true);

    WiFi.mode(WIFI_OFF);

    esp_sleep_enable_timer_wakeup(
        SLEEP_DURATION_US
    );

    esp_deep_sleep_start();
}

// ============================================================
// SETUP
// ============================================================

void setup() {

    Serial.begin(115200);

    delay(100);

    // GPIO

    pinMode(LED_BLEUE, OUTPUT);

    digitalWrite(LED_BLEUE, LOW);

    analogSetPinAttenuation(BATTERY_ADC, ADC_11db);

    // I2C

    Wire.begin();

    // AHT20

    if(!aht.begin()) {

        Serial.println(
            "AHT20 introuvable"
        );

        goToSleep();
    }

    // BMP280

    if(!bmp.begin(0x76)) {

        if(!bmp.begin(0x77)) {

            Serial.println(
                "BMP280 introuvable"
            );

            goToSleep();
        }
    }

    bmp.setSampling(

        Adafruit_BMP280::MODE_FORCED,

        Adafruit_BMP280::SAMPLING_X2,

        Adafruit_BMP280::SAMPLING_X16,

        Adafruit_BMP280::FILTER_X16,

        Adafruit_BMP280::STANDBY_MS_500
    );

    // Lecture capteurs

    float temp;
    float humidity;
    float pressure;

    if(
        !readSensors(
            temp,
            humidity,
            pressure
        )
    ) {

        goToSleep();
    }

    // WiFi

    if(!connectWiFi()) {

        goToSleep();
    }

    int rssi =
        WiFi.RSSI();

    // Batterie

    float battery = 
        readBatteryVoltage();

    float batteryPercent =
        batteryToPercent(battery); 

    // LED ON

    digitalWrite(
        LED_BLEUE,
        HIGH
    );

    // Envoi API

    sendData(
        temp,
        humidity,
        pressure,
        batteryPercent,
        rssi
    );

    // Dodo

    goToSleep();
}

// ============================================================
// LOOP
// ============================================================

void loop() {

}

