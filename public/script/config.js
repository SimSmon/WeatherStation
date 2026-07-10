async function loadConfig(){

    const response = await fetch("/api/sensors");

    const sensors = await response.json();

    let html = "";

    sensors.forEach(sensor=>{

        html += `

        <div class="sensorConfig flex-between">

            <div class="sensorHeader">

                <h3>${sensor.name}</h3>

            </div>

            <div class="formGrid">

                <label>Nom</label>

                <input
                    id="name-${sensor.sensor_id}"
                    value="${sensor.name}">
                    
                <label>Type</label>

                <input
                    id="type-${sensor.sensor_id}"
                    value="${sensor.type}">

                <label>Couleur</label>

                <input
                    type="color"
                    id="color-${sensor.sensor_id}"
                    value="${sensor.color}">

                <!--<label>Icône</label>

                <input
                    id="icon-${sensor.sensor_id}"
                    value="${sensor.icon ?? "bi-thermometer-half"}">

                <label>Ordre</label>

                <input
                    type="number"
                    id="order-${sensor.sensor_id}"
                    value="${sensor.display_order}">

                <label>Visible</label>

                <input
                    type="checkbox"
                    id="enabled-${sensor.sensor_id}"
                    ${sensor.enabled ? "checked" : ""}>-->

            </div>

            <div class="sensorActions">

                <button
                    class="saveBtn"
                    onclick='saveSensor("${sensor.sensor_id}")'>

                    Enregistrer

                </button>

            </div>

        </div>

        `;

    });

    document.getElementById("sensorConfigList").innerHTML = html;

}

async function saveSensor(id){

    console.log("Sauvegarde", id);

    const body = {

        name:document.getElementById(`name-${id}`).value,

        color:document.getElementById(`color-${id}`).value,

        //icon:document.getElementById(`icon-${id}`).value,

        // display_order:Number(document.getElementById(`order-${id}`).value),

        //enabled: document.getElementById(`enabled-${id}`).checked

    };

    await fetch(`/api/sensors/${id}`,{

        method:"PUT",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify(body)

    });

    loadWeather();

    loadCharts();

}