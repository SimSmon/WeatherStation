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