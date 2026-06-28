require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

// ==============================
// Base de données
// ==============================

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Vérification connexion BDD
pool.connect()
    .then(client => {
        console.log("✅ Connecté à PostgreSQL");
        client.release();
    })
    .catch(err => {
        console.error("❌ Erreur PostgreSQL :", err);
    });

// ==============================
// Frontend
// ==============================

const publicPath = path.join(__dirname, "..", "public");

app.use(express.static(publicPath));

app.get("/", (req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
});

// ==============================
// API
// ==============================

// Dernière mesure de chaque sonde
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
            FROM sensors s
            LEFT JOIN measurements m
                ON s.sensor_id = m.sensor_id
            ORDER BY
                m.sensor_id,
                m.created_at DESC;
        `);

        res.json(result.rows);

    } catch(err) {

        console.error(err);
        res.status(500).json({
            error: "Erreur serveur"
        });

    }

});

// Dernière mesure globale
app.get("/api/latest", async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT *
            FROM measurements
            ORDER BY created_at DESC
            LIMIT 1;
        `);

        if(result.rows.length === 0){

            return res.json({
                message: "Aucune mesure"
            });

        }

        res.json(result.rows[0]);

    } catch(err){

        console.error(err);
        res.status(500).json({
            error: "Erreur serveur"
        });

    }

});

// Réception ESP32
app.post("/api/weather", async (req, res) => {

    try {

        console.log("📥", req.body);

        const {
            sensor_id,
            name,
            location,
            firmware,
            temperature,
            humidity,
            pressure,
            wind_speed,
            wind_direction,
            luminosity,
            battery,
            wifi_rssi
        } = req.body;

        if(!sensor_id){

            return res.status(400).json({
                error: "sensor_id manquant"
            });

        }

        // Vérifie si la sonde existe
        const sensor = await pool.query(
            "SELECT sensor_id FROM sensors WHERE sensor_id=$1",
            [sensor_id]
        );

        if(sensor.rows.length === 0){

            await pool.query(
            `
            INSERT INTO sensors
            (sensor_id,name,location,type,firmware,last_seen)
            VALUES($1,$2,$3,$4,$5,NOW())
            `,
                [
                    sensor_id,
                    name || sensor_id,
                    location || "indoor",
                    "indoor",
                    firmware || null
                ]
            );
            console.log("Nouvelle sonde :", sensor_id);
        }

        // Ajoute la mesure
        await pool.query(
        `
        INSERT INTO measurements
        (
            sensor_id,
            temperature,
            humidity,
            pressure,
            wind_speed,
            wind_direction,
            luminosity,
            battery,
            wifi_rssi
        )
        VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        `,
        [
            sensor_id,
            temperature ?? null,
            humidity ?? null,
            pressure ?? null,
            wind_speed ?? null,
            wind_direction ?? null,
            luminosity ?? null,
            battery ?? null,
            wifi_rssi ?? null
            ]
        );

        res.json({
            success:true
        });

    } catch(err){

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});

// ==============================

const PORT = process.env.PORT || 3001;

app.listen(PORT,"0.0.0.0",()=>{

    console.log("Serveur démarré sur le port",PORT);

});