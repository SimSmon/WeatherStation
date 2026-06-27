async function loadWeather() {
    const response = await fetch("/api/sensors");
    const sensors = await response.json();

    // 1. On cible d'abord les éléments du DOM
    const indoor = document.getElementById("indoor");
    const outdoor = document.getElementById("outdoor");

    // 2. Ensuite on les vide
    if (indoor) indoor.innerHTML = "";
    if (outdoor) outdoor.innerHTML = "";

    // 3. Enfin on boucle
    sensors.forEach(sensor => {
        if (sensor.type === "indoor") {
            if (indoor) indoor.innerHTML += createCard(sensor);
        } else {
            if (outdoor) outdoor.innerHTML += createCard(sensor);
        }
    });
}

function createCard(sensor) {

    return `
        <div class="card">

            <h2>${sensor.name ?? sensor.sensor_id}</h2>

            <p>🌡 ${sensor.temperature} °C</p>

            <p>💧 ${sensor.humidity} %</p>

            ${sensor.pressure != null ?
                `<p>🌪 ${sensor.pressure} hPa</p>` : ""}

            ${sensor.wind_speed != null ?
                `<p>💨 ${sensor.wind_speed} km/h</p>` : ""}

            ${sensor.luminosity != null ?
                `<p>☀ ${sensor.luminosity} lux</p>` : ""}

            ${sensor.battery != null ?
                `<p>🔋 ${sensor.battery} V</p>` : ""}

        </div>
    `;
}

loadWeather();