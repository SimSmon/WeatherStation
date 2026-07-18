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
                <div class="subPanel grid grid-auto">
                    <div class="sectionTitle">
                        <h3 style="color:${sonde.color}"><i class="bi ${wifi.icon} wifi-icon" title="${wifi.label} (${sonde.wifi_rssi ?? "?"} dBm)">${sonde.name}</i></h3> 
                    </div>
                     
                    <h1 class="temp"><i class="wi wi-thermometer icon icon-lg"></i> ${sonde.temperature ?? "--"} °C</h1>
                    <p><i class="wi wi-humidity icon icon-lg"></i> ${sonde.humidity ?? "--"} %</p>
                    ${sonde.pressure != null ? `<p><i class="wi wi-barometer icon icon-lg"></i> ${sonde.pressure} hPa</p>` : "" }      
                    ${sonde.created_at ? `<p><i class="wi wi-time-3 icon-lg"></i> ${new Date(sonde.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>` : "" }
                    ${sonde.battery != null ? `<p><i class="bi bi-battery-full icon"></i> ${sonde.battery} <i class="bi bi-percent"></i></p>` : "" }      
            
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