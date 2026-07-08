// ==============================
// Tab
// ==============================


function switchTab(event, tabName) {

    console.log("Onglet :", tabName);

    const contents = document.querySelectorAll(".tab-content");
    console.log(contents);

    contents.forEach(content => content.classList.add("hidden"));

    const buttons = document.querySelectorAll(".nav-btn");
    console.log(buttons);

    buttons.forEach(btn => btn.classList.remove("active"));

    const target = document.getElementById("tab-" + tabName);

    console.log(target);

    target.classList.remove("hidden");

    event.currentTarget.classList.add("active");

}
