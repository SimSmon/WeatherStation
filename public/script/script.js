// ==============================
// Démarrage + boucles de rafraîchissement
// ==============================

startTime();
loadWeather();    // Sondes locales ESP32
loadWeatherFM();  // API Open-Meteo
loadWeatherMetar();
loadTrends();

// Sondes ESP32 toutes les 2 minutes
setInterval(loadWeather, 120000);

// Open-Meteo toutes les 15 minutes
setInterval(loadWeatherFM, 900000);
setInterval(loadWeatherMetar, 900000);
setInterval(loadTrends, 900000);
