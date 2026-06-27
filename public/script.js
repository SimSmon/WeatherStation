async function loadWeather() {
    try {
        const response = await fetch('http://192.168.1.76:3001/api/sensors');
        const sondes = await response.json();

        // On vide les conteneurs existants avant de réafficher
        document.getElementById('indoor').innerHTML = '';
        document.getElementById('outdoor').innerHTML = '';

        sondes.forEach(sonde => {
            // 1. On crée le code HTML de la carte
            const cardHTML = `
                <div class="card">
                    <h3>${sonde.name}</h3>
                    <p>🌡️ ${sonde.temperature} °C</p>
                    <p>💧 ${sonde.humidity} %</p>
                </div>
            `;

            // 2. C'est ICI qu'on fait le groupement !
            // On vérifie si la sonde est intérieure ou extérieure
            if (sonde.location === 'intérieur' || sonde.location === 'indoor') {
                // On l'ajoute dans la div id="indoor"
                document.getElementById('indoor').innerHTML += cardHTML;
            } else {
                // Sinon, on l'ajoute dans la div id="outdoor"
                document.getElementById('outdoor').innerHTML += cardHTML;
            }
        });

    } catch (error) {
        console.error("Erreur d'affichage :", error);
    }
}

// On lance la fonction au chargement de la page
loadWeather();

function startTime() {
  var today = new Date();
  var day = today.getDay();
  var date = today.getDate();
  var month = today.getMonth();
  var year = today.getFullYear();
  var hours = today.getHours().toString().padStart(2, "0");
  var minutes = today.getMinutes().toString().padStart(2, "0");
  var seconds = today.getSeconds().toString().padStart(2, "0");

  m = checkTime(minutes);
  
  const dayString = getWeekDay(day);
  const monthString = getMonths(month);
  
  document.getElementById('time').innerHTML = `
  <h1>${hours} : ${minutes} : ${seconds}</h1>
  <h3>${dayString} ${date} ${monthString} ${year}  </h3>
  `
  var t = setTimeout(startTime, 500);
}
function checkTime(i) {
  if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
  return i;
}
 
// 1. On lance tout une première fois au démarrage
startTime();
loadWeather();   // Tes sondes locales
loadWeatherFM(); // L'API Open-Meteo

// 2. On crée des boucles de répétition (Intervalles)

// On rafraîchit tes sondes ESP32 toutes les 2 minutes (120 000 ms)
setInterval(loadWeather, 120000);

// On rafraîchit la météo Open-Meteo toutes les 15 minutes (900 000 ms)
setInterval(loadWeatherFM, 900000);

function getWeekDay(code) {

  switch(code) {

    case 0:
      return "Dimanche";

    case 1:
      return "Lundi";

    case 2:
      return "Mardi";

    case 3:
      return "Mercredi";

    case 4:
      return "Jeudi";

    case 5:
      return "Vendredi";

    case 6:
      return "Samedi";

    default:
      return "--";
  }
}

function getMonths(code) {

  switch(code) {

    case 0:
      return "Janvier";

    case 1:
      return "Février";

    case 2:
      return "Mars";

    case 3:
      return "Avril";

    case 4:
      return "Mai";

    case 5:
      return "Juin";

    case 6:
      return "Juillet";

    case 7:
      return "Aout";

    case 8:
      return "Septembre";

    case 9:
      return "Octobre";

    case 10:
      return "Novembre";

    case 11:
      return "Décembre";

    default:
      return "--";
  }
}

function getWeatherIcon(code) {

  switch(code) {

    case 0:
      return "wi-day-sunny";

    case 1:
    case 2:
      return "wi-day-cloudy";

    case 3:
      return "wi-cloudy";

    case 61:
    case 63:
      return "wi-rain";

    case 71:
      return "wi-snow";

    default:
      return "wi-na";
  }
}

async function loadWeatherFM() {

  const cacheBuster = new Date().getTime();
  const url =
     "https://api.open-meteo.com/v1/forecast?" +
     "latitude=48.1019&longitude=-1.7956" +
     "&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset" + 
     "&models=meteofrance_seamless" + 
     "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure" +
     "&timezone=auto&forecast_days=5"+
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
  const DweatherCode = data.daily.weather_code;

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
            <td><p>${rel_hum}<i class="wi wi-humidity"></i></p> </td>
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

    for (let i = 0; i < 5; i++) {

    const date = data.daily.time[i];
    const todayMax = data.daily.temperature_2m_max[i];
    const todayMin = data.daily.temperature_2m_min[i];

     const code = data.daily.weather_code[i];

    const icon =
      getWeatherIcon(code);

    const row = `
      <tr>
        <td>${date}</td>
        <td><i class="wi ${icon}"></i></td>
        <td>${todayMin}°C</td>
        <td>${todayMax}°C</td>
      </tr>
    `;

    tbody.innerHTML += row;
  }
};