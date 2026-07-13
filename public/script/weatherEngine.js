analyseWeather({
    temperature,
    humidity,
    pressure,
    temperatureTrend,
    pressureTrend

})

async function analyseWeather() {

    try {

        const response = await fetch("/api/trend");
    
        const response = await response.json();
        const data = json[0];


        document.getElementById("analyseWeatherCard").innerHTML = `


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

    } catch (error) {
        console.error("Erreur d'affichage :", error);
    }
}

function getHumidex() {

}