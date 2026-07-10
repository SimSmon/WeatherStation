async function loadCharts(period = 24){

    const response = await fetch(`/api/history?hours=${period}`);
    const rows = await response.json();

    drawChart(rows, "temperature", "temperatureChart");
    drawChart(rows, "humidity", "humidityChart");
    drawChart(rows, "pressure", "pressureChart");

}

const charts = {};

function drawChart(rows, dataName, canvasId){

    const labels = [];
    const datasets = {};

    for(const row of rows){

        const label = new Date(row.bucket).toLocaleTimeString("fr-FR",{
            hour:"2-digit",
            minute:"2-digit"
        });

        if(!labels.includes(label))
            labels.push(label);

        if(!datasets[row.name]){

            datasets[row.name] = {

                label: row.name,
                color: row.color,
                values: []

            };

        }

        // <-- c'est ce qui manquait
        datasets[row.name].values.push(row[dataName]);

    }

    const chartData = {

        labels,

        datasets: Object.values(datasets).map(sensor => ({

            label: sensor.label,
            data: sensor.values,

            borderColor: sensor.color,
            backgroundColor: sensor.color,

            borderWidth: 3,

            pointRadius: 0,
            pointHoverRadius: 6,

            tension: 0.35,
            fill: false

        }))

    };

    if(charts[canvasId]){

        charts[canvasId].data = chartData;
        charts[canvasId].update();

        return;

    }

    charts[canvasId] = new Chart(document.getElementById(canvasId),{

        type: "line",

        data: chartData,

        options:{

            responsive: true,
            maintainAspectRatio: false

        }

    });

}