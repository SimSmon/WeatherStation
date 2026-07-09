async function loadCharts(period = 24){

    const response = await fetch(`/api/history?hours=${period}`);
    const rows = await response.json();

    drawChart(rows,"temperature","temperatureChart");
    drawChart(rows,"humidity","humidityChart");
    drawChart(rows,"pressure","pressureChart");

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

        if(!datasets[row.name])
            datasets[row.name] = [];

        datasets[row.name].push(row[dataName]);

    }

    const chartData = {

        labels,

        datasets:Object.entries(datasets).map(([name,data])=>({

            label:name,

            data,

            tension:0.3

        }))

    };

    // graphique déjà créé ?
    if(charts[canvasId]){

        charts[canvasId].data = chartData;
        charts[canvasId].update();

        return;

    }

    charts[canvasId] = new Chart(document.getElementById(canvasId),{

        type:"line",

        data:chartData,

        options:{
            responsive:true,
            maintainAspectRatio:false
        }

    });

}