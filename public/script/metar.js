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

        document.getElementById("metarCard").innerHTML = `


            <div class="sectionTitle flex-between">
                <div>
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


            <div class="grid grid-3">

                <div class="metarItem subPanel">
                    <i class="wi wi-thermometer icon icon-lg"></i>
                    <span>${data.temp}°C</span>
                    <small>Température</small>
                </div>

                <div class="metarItem subPanel">
                    <i class="wi wi-humidity icon icon-lg"></i>
                    <span>${data.dewp}°C</span>
                    <small>Point de rosée</small>
                </div>

                <div class="metarItem subPanel">
                    <i class="wi wi-barometer icon icon-lg"></i>
                    <span>${data.altim}</span>
                    <small>QNH</small>
                </div>

                <div class="windCompass flex flex-center">
                    ${makeCompassSVG(data.wdir, data.wspd, data.wgst)}
                </div>

                <div class="metarItem subPanel">
                    <i class="wi wi-fog icon icon-lg"></i>
                    <span>${data.visib}</span>
                    <small>Visibilité</small>
                </div>

                <div class="metarItem subPanel">
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