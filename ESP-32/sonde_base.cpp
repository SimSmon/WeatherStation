#include <WiFi.h>
#include <WiFiClient.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <esp_wifi.h> // <--- Ajoute cet include en haut de ton fichier

// --- Configuration WiFi ---
const char* ssid = "Freebox-7721D6";
const char* password = "m92wbq4246qfvdfrqr4c5n";

// --- Configuration API ---
const char* serverUrl = "http://192.168.1.76:3001/api/weather";

// --- Configuration Matérielle ---
#define DHTPIN     14         // Capteur DHT11 connecté au GPIO 14
#define LED_BLEUE  13         // Ta LED bleue externe connectée au GPIO 13

#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

const char* sensorId = "sonde1";
const char* name = "sonde1";
const char* location = "indoor";
const char* firmware = "1.0.10";

int wifiRSSI = WiFi.RSSI();

void setup() {
  Serial.begin(115200);
  dht.begin();

  // Configuration de la broche de la LED en mode SORTIE
  pinMode(LED_BLEUE, OUTPUT);
  digitalWrite(LED_BLEUE, LOW); // Éteinte au démarrage

  WiFi.disconnect(true); // Efface les anciennes configurations stockées
  delay(1000);

  WiFi.mode(WIFI_STA);   // Force l'ESP32 à être UNIQUEMENT un client Wi-Fi
  delay(1000);

  // Connexion au WiFi
  WiFi.begin(ssid, password);
  esp_wifi_set_ps(WIFI_PS_NONE); // Désactive TOUTE économie d'énergie Wi-Fi
  Serial.print("Connexion au WiFi...");
  
  // La LED clignote tant qu'on n'est pas connecté
  while (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED_BLEUE, HIGH);
    delay(250);
    digitalWrite(LED_BLEUE, LOW);
    delay(250);
    Serial.print(".");
  }
  
  Serial.println("\nConnecté au WiFi !");
  Serial.print("Adresse IP de l'ESP : ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Vérification de la connexion WiFi avant d'envoyer
  if (WiFi.status() == WL_CONNECTED) {
    
    // Lecture des données du DHT11
    float h = dht.readHumidity();
    float t = dht.readTemperature();

    // Lecture de la qualité du WiFi
    int wifiRSSI = WiFi.RSSI();

    // On vérifie si la lecture a échoué
    if (isnan(h) || isnan(t)) {
      Serial.println("Échec de la lecture du capteur DHT11 !");
      delay(5000); // On attend un peu avant de réessayer
      return;
    }


    Serial.print("WiFi RSSI : ");
    Serial.print(wifiRSSI);
    Serial.println(" dBm");

    Serial.print("Température : "); Serial.print(t);
    Serial.print("°C | Humidité : "); Serial.print(h); Serial.println("%");

    // --- EN TRAVAIL : On allume la LED bleue fixe ---
    digitalWrite(LED_BLEUE, HIGH);

    // Préparation de la requête HTTP
    WiFiClient client;
    HTTPClient http;

    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Construction du payload JSON corrigé (avec les guillemets manquants \" autour des textes)
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

    // Envoi de la requête POST
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("Code de réponse HTTP : ");
      Serial.println(httpResponseCode);
      Serial.print("Réponse du serveur : ");
      Serial.println(response);
    } else {
      Serial.print("Erreur lors de l'envoi POST : ");
      Serial.println(httpResponseCode);
      Serial.println(http.errorToString(httpResponseCode));
    }

    // Libération des ressources
    http.end();

    // Petit délai pour te laisser le temps de voir la LED bleue fixe
    delay(2000);

  } else {
    Serial.println("Erreur : Non connecté au WiFi.");
  }

  // --- FIN DU CYCLE : On éteint la LED bleue pour la phase de veille ---
  digitalWrite(LED_BLEUE, LOW);

  // Attendre 5 minutes (5 min * 60 sec * 1000 ms = 300 000 ms)
  Serial.println("En veille pour 5 minutes...");
  delay(300000); 
}