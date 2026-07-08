// ==============================
// Trend
// ==============================

async function loadTrends() {

        const response = await fetch("/api/trend");
        const trends = await response.json();

        let html = `<div class="trendContainer flex-center">`;
        for (const zone of trends) {

            html += `
                <div class="subPanel">

                    <h3>${zone.type}</h3>
                    <i class="wi wi-thermometer icon icon-lg"></i>
                    <p>temperature Moyenne il y a une heure : ${zone.temperature_1h} °C </p> 
                    <p>temperature Moyenne actuel : ${zone.temperature } °C </p> 
                    <p>tendance = ${trend(zone.temperature_trend,"°C")}</p>
                    <i class="wi wi-humidity icon icon-lg"></i> 
                    <p>humidité Moyenne il y a une heure : ${zone.humidity_1h} %< /p> 
                    <p>humidité Moyenne actuel : ${zone.humidity } % </p> 
                    <p>tendance = ${trend(zone.humidity_trend,"%")}</p>
                    <i class="wi wi-barometer icon icon-lg"></i>
                    <p>pression Moyenne il y a une heure : ${zone.pressure_1h} hPa < /p> 
                    <p>pression Moyenne actuel : ${zone.pressure } hPa </p>
                    <p>tendance = ${trend(zone.pressure_trend," hPa")}</p>

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