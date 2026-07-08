// ==============================
// Météo Open-Meteo
// ==============================

function getWeatherIcon(code) {
    switch (code) {
        case 0: return "wi-day-sunny";
        case 1:
        case 2: return "wi-day-cloudy";
        case 3: return "wi-cloudy";
        case 61:
        case 63: return "wi-rain";
        case 71: return "wi-snow";
        default: return "wi-na";
    }
}

async function loadWeatherFM() {
    try {
        const cacheBuster = new Date().getTime();
        const url =
            "https://api.open-meteo.com/v1/forecast?" +
            "latitude=48.1019&longitude=-1.7956" +
            "&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset" +
            "&models=meteofrance_seamless" +
            "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure" +
            "&timezone=auto&forecast_days=5" +
            `&cb=${cacheBuster}`;
 
        const response = await fetch(url);
        const data = await response.json();
 
        const temp = data.current.temperature_2m;
        const rel_hum = data.current.relative_humidity_2m;
        const precipitation = data.current.precipitation;
        const app_temp = data.current.apparent_temperature;
        const p_surface = data.current.surface_pressure;
        const wind_direction_10m = data.current.wind_direction_10m;
        const wind_speed_10m = data.current.wind_speed_10m;
        const weatherCode = data.current.weather_code;
 
        const todayMax = data.daily.temperature_2m_max[0];
        const todayMin = data.daily.temperature_2m_min[0];
 
        const sunrise = data.daily.sunrise[0];
        const sunset = data.daily.sunset[0];
 
        const iconClass = getWeatherIcon(weatherCode);
 
        document.getElementById("weatherCard").innerHTML = `

            <div class="mf-main flex-center">
                <div class="mf-icon icon-xl"><i class="wi ${iconClass}"></i></div>
                <div class="mf-temp-block">
                    <div class="mf-temp">${temp.toFixed(1)}°C</div>
                    <div class="mf-feels label">RESSENTI ${app_temp.toFixed(1)}°C</div>
                </div>
                <div class="mf-right grid-auto">
                    <span class="mf-ic"><i class="wi wi-strong-wind"></i></span>
                    <span class="mf-val">${wind_speed_10m} km/h</span>
                    <span class="mf-ic"><i class="wi wi-direction-up-right"></i></span>
                    <span class="mf-val">${wind_direction_10m}°</span>
                    <span class="mf-ic"><i class="wi wi-sunrise"></i></span>
                    <span class="mf-val">${sunrise.split("T")[1]}</span>
                    <span class="mf-ic"><i class="wi wi-sunset"></i></span>
                    <span class="mf-val">${sunset.split("T")[1]}</span>
                </div>
            </div>
 
            <div class="grid grid-3">
                <div class="mf-stat subPanel">
                    <div class="mf-stat-label label">Humidité</div>
                    <div class="value"><i class="wi wi-humidity"></i> ${rel_hum} %</div>
                </div>
                <div class="mf-stat subPanel">
                    <div class="mf-stat-label label">Précipitations</div>
                    <div class="value"><i class="wi wi-rain"></i> ${precipitation} mm</div>
                </div>
                <div class="mf-stat subPanel">
                    <div class="mf-stat-label label">Pression</div>
                    <div class="value mf-blue"><i class="wi wi-barometer"></i> ${p_surface.toFixed(0)} hPa</div>
                </div>
            </div>
        `;
 
        // --- Prévisions : on filtre les jours avec null ---
        const rows = [];
 
        for (let i = 0; i < 5; i++) {
 
            const date   = data.daily.time[i];
            const dayMax = data.daily.temperature_2m_max[i];
            const dayMin = data.daily.temperature_2m_min[i];
            const code   = data.daily.weather_code[i];
 
            if (dayMax === null || dayMin === null || code === null) continue;
 
            const d = new Date(date + "T12:00:00");
            const dayLabel = d.toLocaleDateString("fr-FR", {
                weekday: "short",
                day:     "2-digit",
                month:   "2-digit"
            }).toUpperCase();
 
            const icon = getWeatherIcon(code);
 
            rows.push(`
                <div class="mf-day subPanel">
                    <div class="mf-day-label label">${dayLabel}</div>
                    <div class="mf-day-icon icon-lg"><i class="wi ${icon}"></i></div>
                    <div class="mf-day-max">${dayMax.toFixed(1)}°</div>
                    <div class="mf-day-min">${dayMin.toFixed(1)}°</div>
                </div>
            `);
        }
 
        document.getElementById("forecastContainer").innerHTML = rows.join('');
 
    } catch (error) {
        console.error("Erreur météo Open-Meteo :", error);
    }
}