// ==============================
// Capteurs ESP32 (sondes locales)
// ==============================

async function loadWeather() {
    try {
        const response = await fetch('http://192.168.1.76:3001/api/sensors');
        const sondes = await response.json();

        const sondeCards = [];

        sondes.forEach(sonde => {
            const wifi = getWifiIcon(sonde.wifi_rssi);
            const cardHTML = `
                <div class="card">
                    <div class="card-header">
                        <h3><i class="bi ${wifi.icon} wifi-icon" title="${wifi.label} (${sonde.wifi_rssi ?? "?"} dBm)">${sonde.name}</i></h3> 
                    </div>
                     
                    <h1 style="color: orange;">🌡️ ${sonde.temperature ?? "--"} °C</h1>
                    <p><i class="wi wi-drop"></i>${sonde.humidity ?? "--"} %</p>
                    ${sonde.pressure != null ? `<p><i class="wi wi-barometer"></i> ${sonde.pressure} hPa</p>` : "" }      
                    ${sonde.created_at ? `<p><i class="wi wi-time-3"></i> ${new Date(sonde.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>` : "" }            
                </div>
            `;

            sondeCards.push(cardHTML);

        });

        document.getElementById('sondes').innerHTML = sondeCards.join('');

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

// ==============================
// Icône WiFi selon le RSSI (dBm)
// ==============================

function getWifiIcon(rssi) {
    if (rssi === null || rssi === undefined) {
        return { icon: "bi-wifi-off", label: "Hors ligne" };
    }
    if (rssi >= -55) {
        return { icon: "bi-wifi", label: "Excellent" };
    }
    if (rssi >= -67) {
        return { icon: "bi-wifi-2", label: "Bon" };
    }
    if (rssi >= -75) {
        return { icon: "bi-wifi-1", label: "Faible" };
    }
    return { icon: "bi-wifi-off", label: "Très faible" };
}

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
            <div class="mf-header">
                <div class="mf-logo-badge">MF</div>
                <div class="mf-logo-text">MÉTÉO FRANCE</div>
            </div>
 
            <div class="mf-main">
                <div class="mf-icon"><i class="wi ${iconClass}"></i></div>
                <div class="mf-temp-block">
                    <div class="mf-temp">${temp.toFixed(1)}°C</div>
                    <div class="mf-feels">RESSENTI ${app_temp.toFixed(1)}°C</div>
                </div>
                <div class="mf-right">
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
 
            <div class="mf-stats">
                <div class="mf-stat">
                    <div class="mf-stat-label">Humidité</div>
                    <div class="mf-stat-val"><i class="wi wi-humidity"></i> ${rel_hum} %</div>
                </div>
                <div class="mf-stat">
                    <div class="mf-stat-label">Précipitations</div>
                    <div class="mf-stat-val"><i class="wi wi-rain"></i> ${precipitation} mm</div>
                </div>
                <div class="mf-stat">
                    <div class="mf-stat-label">Pression</div>
                    <div class="mf-stat-val mf-blue"><i class="wi wi-barometer"></i> ${p_surface.toFixed(0)} hPa</div>
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
                <div class="mf-day">
                    <div class="mf-day-label">${dayLabel}</div>
                    <div class="mf-day-icon"><i class="wi ${icon}"></i></div>
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


// ==============================
// Compas SVG style aéro
// ==============================

function makeCompassSVG(wdir, wspd, wgst) {

    const cx = 90, cy = 90, r = 78;

    // --- Graduations ---
    let ticks = "";

    for (let deg = 0; deg < 360; deg += 5) {

        const isMajor  = deg % 10 === 0;
        const isCardinal = deg % 90 === 0;

        const len   = isCardinal ? 14 : isMajor ? 10 : 6;
        const width = isCardinal ? 2  : isMajor ? 1.5 : 0.8;
        const color = isCardinal ? "#4db6ff" : isMajor ? "#7ab8cc" : "#3a5a6a";

        const rad1 = (deg - 90) * Math.PI / 180;
        const x1 = cx + r * Math.cos(rad1);
        const y1 = cy + r * Math.sin(rad1);
        const x2 = cx + (r - len) * Math.cos(rad1);
        const y2 = cy + (r - len) * Math.sin(rad1);

        ticks += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${color}" stroke-width="${width}"/>`;
    }

    // --- Labels cardinaux ---
    const cardinals = [
        { label: "N",   deg:   0, color: "#ff4444" },
        { label: "NE",  deg:  45, color: "#4db6ff" },
        { label: "E",   deg:  90, color: "#4db6ff" },
        { label: "SE",  deg: 135, color: "#4db6ff" },
        { label: "S",   deg: 180, color: "#4db6ff" },
        { label: "SO",  deg: 225, color: "#4db6ff" },
        { label: "O",   deg: 270, color: "#4db6ff" },
        { label: "NO",  deg: 315, color: "#4db6ff" },
    ];

    let labels = "";

    for (const c of cardinals) {
        const rInner = r - 22;
        const rad = (c.deg - 90) * Math.PI / 180;
        const x = cx + rInner * Math.cos(rad);
        const y = cy + rInner * Math.sin(rad);
        const fontSize = c.label.length === 1 ? 11 : 8;
        labels += `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}"
            text-anchor="middle" dominant-baseline="central"
            font-family="monospace" font-size="${fontSize}"
            font-weight="bold" fill="${c.color}">${c.label}</text>`;
    }

    // --- Flèche du vent (SVG path centré, rotation pure) ---
    // La flèche pointe vers le haut (0°) par défaut, on la tourne de wdir degrés
    const needleAngle = wdir ?? 0;
    const arrowPath = `
        M 0,-52
        L  5,-10
        L  0,-18
        L -5,-10
        Z
    `; // pointe en haut, pivot en (0,0)

    const tailPath = `
        M 0,18
        L 0,52
    `;

    // --- Cercle central ---
    const centerDot = `<circle cx="0" cy="0" r="5" fill="white"/>`;

    // --- Vitesse au centre ---
    const speedLabel = `
        <text x="0" y="14" text-anchor="middle" dominant-baseline="central"
            font-family="monospace" font-size="9" fill="#4db6ff">
            ${wspd ?? "--"} kt${wgst ? ` G${wgst}` : ""}
        </text>
    `;

    return `
    <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">

        <!-- Fond -->
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#0d1520" stroke="#1e3a4a" stroke-width="1.5"/>

        <!-- Graduations -->
        ${ticks}

        <!-- Labels cardinaux -->
        ${labels}

        <!-- Flèche du vent centrée sur cx,cy -->
        <g transform="translate(${cx},${cy}) rotate(${needleAngle})">
            <!-- Queue de flèche -->
            <line x1="0" y1="18" x2="0" y2="52"
                stroke="#4db6ff" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Pointe -->
            <path d="${arrowPath}" fill="#ff4444"/>
            <!-- Centre -->
            ${centerDot}
        </g>

        <!-- Vitesse sous le centre -->
        <g transform="translate(${cx},${cy})">
            ${speedLabel}
        </g>

        <!-- Cercle extérieur -->
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#4db6ff" stroke-width="1.5"/>

    </svg>
    `;
}

async function loadWeatherMetar() {

    try {

        const response = await fetch("/api/aviation");
        const json = await response.json();
        const data = json[0];

        document.getElementById("metar").innerHTML = `


            <div class="metarHeader">

                <h2>
                    <i class="bi bi-airplane-fill"></i>
                    LFRN METAR
                </h2>

                <div class="metarTime">
                    ${new Date(data.reportTime).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "UTC"
                    })} UTC
                </div>

            </div>


            <div class="flightRule ${data.fltCat}">
                ${data.fltCat}
            </div>


            <div class="metarGrid">

                <div class="metarItem">
                    <i class="wi wi-thermometer"></i>
                    <span>${data.temp}°C</span>
                    <small>Température</small>
                </div>

                <div class="metarItem">
                    <i class="wi wi-humidity"></i>
                    <span>${data.dewp}°C</span>
                    <small>Point de rosée</small>
                </div>

                <div class="metarItem">
                    <i class="wi wi-barometer"></i>
                    <span>${data.altim}</span>
                    <small>QNH</small>
                </div>

                <div class="windCompass">
                    ${makeCompassSVG(data.wdir, data.wspd, data.wgst)}
                </div>

                <div class="metarItem">
                    <i class="wi wi-fog"></i>
                    <span>${data.visib}</span>
                    <small>Visibilité</small>
                </div>

                <div class="metarItem">
                    <div class="cover">
                        ${data.cover}
                    </div>
                    <div>
                        ${data.cloud}
                    </div>
                </div>
            </div>

            </div>

            <div class="metarRaw">

                ${data.rawOb}

            </div>


        `;

    }

    catch (err) {

        console.error(err);

    }

}

// Logique de basculement des onglets
    function switchTab(event, tabName) {
      // 1. On cache toutes les sections
      const contents = document.querySelectorAll('.tab-content');
      contents.forEach(content => content.classList.add('hidden'));

      // 2. On désactive tous les boutons
      const buttons = document.querySelectorAll('.tab-btn');
      buttons.forEach(btn => btn.classList.remove('active'));

      // 3. On affiche la section demandée
      document.getElementById('tab-' + tabName).classList.remove('hidden');

      // 4. On active le bouton sur lequel on a cliqué
      event.currentTarget.classList.add('active');

      // (Optionnel) Ici, on pourra lancer une fonction fetch spécifique selon l'onglet cliqué
      if (tabName === 'charts') {
        console.log("Lancement du chargement des graphiques...");
      }
    }

async function loadTrends() {

        const response = await fetch("/api/trend");
        const trends = await response.json();

        let html = `<div class="trendContainer">`;
        html += `<h2>SONDES</h2>`
        for (const zone of trends) {

            html += `
                <div class="trendCard card">

                    <h3>${zone.type}</h3>

                    <p>🌡 ${trend(zone.temperature_trend,"°C")}</p>
                    <p>💧 ${trend(zone.humidity_trend,"%")}</p>
                    <p>🧭 ${trend(zone.pressure_trend," hPa")}</p>

                </div>
            `;
        }

        html += `</div>`;

        document.getElementById("trend").innerHTML = html;

}

function trend(value, unit = "") {

    if (value == null)
        return `<span class="trendNeutral">--</span>`;

    if (value > 0)
        return `<span class="trendUp">
            <i class="bi bi-arrow-up-right"></i>
            +${value}${unit}
        </span>`;

    if (value < 0)
        return `<span class="trendDown">
            <i class="bi bi-arrow-down-right"></i>
            ${value}${unit}
        </span>`;

    return `<span class="trendFlat">
        <i class="bi bi-dash"></i>
        0${unit}
    </span>`;

}



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
