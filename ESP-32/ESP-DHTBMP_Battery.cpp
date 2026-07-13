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
const char* firmware = "2.1.5";

// ============================================================
// BROCHES
// ============================================================

#define LED_BLEUE      13

#define BATTERY_ENABLE 25
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

    digitalWrite(BATTERY_ENABLE, HIGH);

    delay(5);

    int raw = analogRead(BATTERY_ADC);

    digitalWrite(BATTERY_ENABLE, LOW);

    float voltageADC =
        raw * 3.3f / 4095.0f;

    float batteryVoltage =
        voltageADC * 2.0f;

    Serial.print("Batterie : ");
    Serial.print(batteryVoltage, 2);
    Serial.println(" V");

    return batteryVoltage;
}

// ============================================================
// POURCENTAGE BATTERIE
// ============================================================

int batteryToPercent(float voltage) {

    int percent = map(
        voltage * 100,
        300,
        420,
        0,
        100
    );

    percent = constrain(percent, 0, 100);

    return percent;
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
    float batteryVoltage,
    int batteryPercent,
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

    pinMode(BATTERY_ENABLE, OUTPUT);

    digitalWrite(LED_BLEUE, LOW);

    digitalWrite(BATTERY_ENABLE, LOW);

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
        battery,
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

