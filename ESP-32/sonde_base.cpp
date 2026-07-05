#include <WiFi.h>
#include <WiFiClient.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <esp_wifi.h>

// --- Configuration WiFi ---
// ATTENTION : change ce mot de passe sur ta Freebox, il a été exposé.
// Idéalement, mets ssid/password dans un fichier séparé (config.h) exclu du repo.
const char* ssid = "Freebox-7721D6";
const char* password = "code_wifi";

// --- Configuration API ---
const char* serverUrl = "http://192.168.1.76:3001/api/weather";

// --- Configuration Matérielle ---
#define DHTPIN     14
#define LED_BLEUE  13

#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

const char* sensorId = "Sonde1";
const char* name = "Sonde1";
const char* location = "indoor";
const char* firmware = "1.1.1";

// --- Réglages de robustesse ---
const unsigned long WIFI_CONNECT_TIMEOUT_MS = 15000;  // 15s max pour se connecter
const unsigned long HTTP_TIMEOUT_MS = 8000;            // 8s max pour la requête HTTP
const unsigned long SLEEP_DURATION_MS = 300000;        // 5 minutes
const unsigned long SLEEP_CHUNK_MS = 1000;             // on dort par tranches de 1s
const int DHT_MAX_RETRIES = 3;                         // tentatives de lecture capteur

// ==============================
// Connexion WiFi avec timeout
// ==============================
bool connectWiFi() {
  WiFi.disconnect(true);
  delay(500);

  WiFi.mode(WIFI_STA);
  esp_wifi_set_ps(WIFI_PS_NONE); // Désactive l'économie d'énergie WiFi

  Serial.print("Connexion au WiFi");
  WiFi.begin(ssid, password);

  unsigned long start = millis();

  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - start > WIFI_CONNECT_TIMEOUT_MS) {
      Serial.println("\nTimeout de connexion WiFi.");
      return false;
    }

    digitalWrite(LED_BLEUE, HIGH);
    delay(250);
    digitalWrite(LED_BLEUE, LOW);
    delay(250);
    Serial.print(".");
  }

  Serial.println("\nConnecté au WiFi !");
  Serial.print("Adresse IP de l'ESP : ");
  Serial.println(WiFi.localIP());
  return true;
}

// ==============================
// Sleep non bloquant par tranches
// (laisse le système respirer, évite les soucis de watchdog)
// ==============================
void smartDelay(unsigned long totalMs) {
  unsigned long elapsed = 0;
  while (elapsed < totalMs) {
    delay(SLEEP_CHUNK_MS);
    elapsed += SLEEP_CHUNK_MS;
    yield(); // laisse tourner les tâches WiFi internes
  }
}

// ==============================
// Setup
// ==============================
void setup() {
  Serial.begin(115200);
  dht.begin();

  pinMode(LED_BLEUE, OUTPUT);
  digitalWrite(LED_BLEUE, LOW);

  connectWiFi(); // si ça échoue, on retentera dans loop()
}

// ==============================
// Loop
// ==============================
void loop() {

  // --- 1. Vérifie / rétablit la connexion WiFi ---
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi déconnecté, tentative de reconnexion...");
    if (!connectWiFi()) {
      Serial.println("Reconnexion échouée, nouvelle tentative dans 10s.");
      smartDelay(10000);
      return; // on ressort, le loop() recommence direct (pas d'attente de 5min ici)
    }
  }

  // --- 2. Lecture du capteur avec retries ---
  float h = NAN;
  float t = NAN;

  for (int attempt = 0; attempt < DHT_MAX_RETRIES; attempt++) {
    h = dht.readHumidity();
    t = dht.readTemperature();

    if (!isnan(h) && !isnan(t)) break;

    Serial.print("Lecture DHT11 échouée (tentative ");
    Serial.print(attempt + 1);
    Serial.println("/3)...");
    delay(2000);
  }

  if (isnan(h) || isnan(t)) {
    Serial.println("Abandon : capteur DHT11 illisible après plusieurs tentatives.");
    smartDelay(SLEEP_DURATION_MS);
    return;
  }

  int wifiRSSI = WiFi.RSSI();

  Serial.print("WiFi RSSI : ");
  Serial.print(wifiRSSI);
  Serial.println(" dBm");

  Serial.print("Température : "); Serial.print(t);
  Serial.print("°C | Humidité : "); Serial.print(h); Serial.println("%");

  digitalWrite(LED_BLEUE, HIGH);

  // --- 3. Envoi HTTP avec timeout ---
  WiFiClient client;
  HTTPClient http;

  http.setTimeout(HTTP_TIMEOUT_MS);
  http.begin(client, serverUrl);
  http.addHeader("Content-Type", "application/json");

  String jsonPayload =
    "{"
    "\"sensor_id\":\"" + String(sensorId) + "\","
    "\"name\":\"" + String(name) + "\","
    "\"location\":\"" + String(location) + "\","
    "\"firmware\":\"" + String(firmware) + "\","
    "\"temperature\":" + String(t, 1) + ","
    "\"humidity\":" + String(h, 0) + ","
    "\"wifi_rssi\":" + String(wifiRSSI) +
    "}";

  Serial.print("Envoi du JSON : ");
  Serial.println(jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("Code de réponse HTTP : ");
    Serial.println(httpResponseCode);
    Serial.print("Réponse du serveur : ");
    Serial.println(response);
  } else {
    Serial.print("Erreur lors de l'envoi POST : ");
    Serial.println(http.errorToString(httpResponseCode));
  }

  http.end();

  delay(2000);
  digitalWrite(LED_BLEUE, LOW);

  // --- 4. Veille non bloquante de 5 minutes ---
  Serial.println("En veille pour 5 minutes...");
  smartDelay(SLEEP_DURATION_MS);
}
