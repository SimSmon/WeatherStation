async function loadWeather() {

const response =
await fetch("/api/latest");

const data =
await response.json();

document.getElementById(
"currentWeather"
).innerHTML = `

<h2>${data.sensor_id}</h2>

<p>
  Température :
  ${data.temperature} °C
</p>

<p>
  Humidité :
  ${data.humidity} %
</p>

`;
}

loadWeather();
