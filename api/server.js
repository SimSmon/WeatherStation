require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const pool = require("./db");
const sensorsRoutes = require("./routes/sensors");
const weatherRoutes = require("./routes/weather");

const app = express();

app.use(cors());
app.use(express.json());

// ==============================
// Frontend statique
// ==============================

const publicPath = path.join(__dirname, "..", "public");

app.use(express.static(publicPath));

app.get("/", (req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
});

// ==============================
// API
// ==============================

app.use("/api", sensorsRoutes);
app.use("/api", weatherRoutes);

// ==============================
// Démarrage
// ==============================

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, "0.0.0.0", () => {
    console.log("Serveur démarré sur le port", PORT);
});

// Arrêt propre (utile en Docker : SIGTERM envoyé sur `docker compose down`)
process.on("SIGTERM", () => {
    console.log("SIGTERM reçu, fermeture en cours...");
    server.close(() => {
        pool.end().then(() => {
            console.log("Connexions PostgreSQL fermées.");
            process.exit(0);
        });
    });
});
