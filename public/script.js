// ==============================
// Capteurs ESP32 (sondes locales)
// ==============================

async function loadWeather() {
    try {
        const response = await fetch('http://192.168.1.76:3001/api/sensors');
        const sondes = await response.json();

        const indoorCards = [];
        const outdoorCards = [];

        sondes.forEach(sonde => {
            const cardHTML = `
                <div class="card">
                    <h3>${sonde.name}</h3>
                    <p>🌡️ ${sonde.temperature ?? "--"} °C</p>
                    <p>💧 ${sonde.humidity ?? "--"} %</p>
                </div>
            `;

            if (sonde.location === 'intérieur' || sonde.location === 'indoor') {
                indoorCards.push(cardHTML);
            } else {
                outdoorCards.push(cardHTML);
            }
        });

        document.getElementById('indoor').innerHTML = indoorCards.join('');
        document.getElementById('outdoor').innerHTML = outdoorCards.join('');

    } catch (error) {
        console.error("Erreur d'affichage :", error);
    }
}

// ==============================
// Horloge
// ==============================

function startTime() {
    const today = new Date();
    const day = today.getDay();
    const date = today.getDate();
    const month = today.getMonth();
    const year = today.getFullYear();
    const hours = today.getHours().toString().padStart(2, "0");
    const minutes = today.getMinutes().toString().padStart(2, "0");
    const seconds = today.getSeconds().toString().padStart(2, "0");

    const dayString = getWeekDay(day);
    const monthString = getMonths(month);

    document.getElementById('time').innerHTML = `
        <h1>${hours} : ${minutes} : ${seconds}</h1>
        <h3>${dayString} ${date} ${monthString} ${year}</h3>
    `;

    setTimeout(startTime, 500);
}

function getWeekDay(code) {
    switch (code) {
        case 0: return "Dimanche";
        case 1: return "Lundi";
        case 2: return "Mardi";
        case 3: return "Mercredi";
        case 4: return "Jeudi";
        case 5: return "Vendredi";
        case 6: return "Samedi";
        default: return "--";
    }
}

function getMonths(code) {
    switch (code) {
        case 0: return "Janvier";
        case 1: return "Février";
        case 2: return "Mars";
        case 3: return "Avril";
        case 4: return "Mai";
        case 5: return "Juin";
        case 6: return "Juillet";
        case 7: return "Aout";
        case 8: return "Septembre";
        case 9: return "Octobre";
        case 10: return "Novembre";
        case 11: return "Décembre";
        default: return "--";
    }
}

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

        document.getElementById("weather").innerHTML = `
            <table>
                <tr>
                    <td><p><i class="wi wi-strong-wind"></i>${wind_speed_10m}Km/H</p></td>
                    <td><p><i class="wi wi-direction-up-right"></i>${wind_direction_10m}°</p></td>
                    <td><p><i class="wi wi-sunrise"></i>${sunrise.split("T")[1]}</p></td>
                    <td><p><i class="wi wi-sunset"></i>${sunset.split("T")[1]}</p></td>
                </tr>
                <tr>
                    <th><h1><i class="wi ${iconClass}"></i></h1></th>
                    <th><h1><i class="wi wi-thermometer"></i>${temp}<i class="wi wi-degrees"></i></h1></th>
                </tr>
                <tr>
                    <td><p>ressenti ${app_temp}°C</p></td>
                </tr>
                <tr>
                    <td><p>${rel_hum}<i class="wi wi-humidity"></i></p></td>
                    <td><p>${precipitation} mm</p></td>
                    <td><p>${p_surface}<i class="wi wi-barometer"></i></p></td>
                </tr>
                <tr>
                    <td><p>Max : ${todayMax}°C</p></td>
                    <td><p>Min : ${todayMin}°C</p></td>
                </tr>
            </table>
        `;

        const tbody = document.querySelector("#forecastTable tbody");
        const rows = [];

        for (let i = 0; i < 5; i++) {
            const date = data.daily.time[i];
            const dayMax = data.daily.temperature_2m_max[i];
            const dayMin = data.daily.temperature_2m_min[i];
            const code = data.daily.weather_code[i];
            const icon = getWeatherIcon(code);

            rows.push(`
                <tr>
                    <td>${date}</td>
                    <td><i class="wi ${icon}"></i></td>
                    <td>${dayMin}°C</td>
                    <td>${dayMax}°C</td>
                </tr>
            `);
        }

        tbody.innerHTML = rows.join('');

    } catch (error) {
        console.error("Erreur météo Open-Meteo :", error);
    }
}

// ==============================
// Démarrage + boucles de rafraîchissement
// ==============================

startTime();
loadWeather();    // Sondes locales ESP32
loadWeatherFM();  // API Open-Meteo

// Sondes ESP32 toutes les 2 minutes
setInterval(loadWeather, 120000);

// Open-Meteo toutes les 15 minutes
setInterval(loadWeatherFM, 900000);
