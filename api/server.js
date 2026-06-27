const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const cors = require("cors");

console.log("=== DOSSIER COURANT NODE ===", __dirname);
console.log("=== COMPARAISON CHEMIN PUBLIC ===", path.join(__dirname, '..', 'public'));

// 1. Toujours charger le .env en premier
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// 1. On indique le chemin relatif propre (on remonte d'un dossier avec '..')
const publicPath = path.join(__dirname, '..', 'public');

// 2. On donne ce chemin à Express
app.use(express.static(publicPath));

// 3. On force la route '/' à envoyer le bon fichier
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// Configuration de la base de données
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Route 1 : Récupérer toutes les sondes avec leur dernière mesure
app.get("/api/sensors", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT ON (m.sensor_id)
                s.sensor_id,
                s.name,
                s.location,
                m.temperature,
                m.humidity,
                m.pressure,
                m.wind_speed,
                m.luminosity,
                m.battery,
                m.created_at
            FROM measurements m
            JOIN sensors s
                ON s.sensor_id = m.sensor_id
            ORDER BY m.sensor_id, m.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("Erreur dans GET /api/sensors :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des sondes" });
    }
});

// Route 2 : Recevoir les données de l'ESP32 (C'est celle qui t'a répondu HTTP 200 !)
app.post("/api/weather", async (req, res) => {
    try {
        console.log("📥 Données reçues :", req.body);

        // On extrait les nouvelles variables envoyées par l'ESP32
        const { sensor_id, name, location, temperature, humidity, battery } = req.body;
        
        const batteryValue = battery !== undefined ? battery : null;

        // Est-ce que la sonde existe ?
        const result = await pool.query(
            "SELECT * FROM sensors WHERE sensor_id = $1",
            [sensor_id]
        );

        // Si elle n'existe pas, on la crée avec le VRAI nom et la VRAIE localisation envoyés !
        if (result.rows.length === 0) {
            await pool.query(
                `INSERT INTO sensors (sensor_id, name, location) VALUES ($1, $2, $3)`,
                [sensor_id, name || sensor_id, location || "indoor"] // Valeurs de secours au cas où
            );
            console.log(`🆕 Nouvelle sonde enregistrée : ${sensor_id}`);
        }

        // On enregistre la mesure
        await pool.query(
            `INSERT INTO measurements (sensor_id, temperature, humidity, battery) VALUES ($1, $2, $3, $4)`,
            [sensor_id, temperature, humidity, batteryValue]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Erreur dans POST /api/weather :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route 3 : Récupérer la toute dernière mesure globale
app.get("/api/latest", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM measurements
            ORDER BY created_at DESC
            LIMIT 1
        `);
        
        if (result.rows.length === 0) {
            return res.json({ message: "Aucune mesure disponible" });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Erreur dans GET /api/latest :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération de la dernière mesure" });
    }
});

// Démarrage du serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Weather API running on port ${PORT} (Listening on all interfaces)`);
});