const express = require("express");
const router = express.Router();
const pool = require("../db");

// Dernière mesure de chaque sonde
router.get("/sensors", async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT DISTINCT ON (m.sensor_id)
                s.sensor_id,
                s.name,
                s.location,
                s.firmware,
                m.temperature,
                m.humidity,
                m.pressure,
                m.wind_speed,
                m.wind_direction,
                m.luminosity,
                m.battery,
                m.wifi_rssi,
                m.created_at
            FROM sensors s
            LEFT JOIN measurements m
                ON s.sensor_id = m.sensor_id
            ORDER BY
                m.sensor_id,
                m.created_at DESC;
        `);

        res.json(result.rows);

    } catch (err) {

        console.error(err);
        res.status(500).json({
            error: "Erreur serveur"
        });

    }

});

// Dernière mesure globale (toutes sondes confondues)
router.get("/latest", async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT *
            FROM measurements
            ORDER BY created_at DESC
            LIMIT 1;
        `);

        if (result.rows.length === 0) {

            return res.json({
                message: "Aucune mesure"
            });

        }

        res.json(result.rows[0]);

    } catch (err) {

        console.error(err);
        res.status(500).json({
            error: "Erreur serveur"
        });

    }

});

//moyenne ext

router.get("/trend", async (req, res) => {

    try {

        const result = await pool.query(`
            WITH current_data AS (
                SELECT
                    m.sensor_id,
                    s.name,
                    s.location,
                    s.type,
                    ROUND(AVG(m.temperature)::numeric, 1) AS temperature,
                    ROUND(AVG(m.humidity)::numeric, 0)    AS humidity,
                    ROUND(AVG(m.pressure)::numeric, 1)    AS pressure
                FROM measurements m
                JOIN sensors s ON s.sensor_id = m.sensor_id
                WHERE m.created_at >= NOW() - INTERVAL '5 minutes'
                GROUP BY m.sensor_id, s.name, s.location, s.type
            ),
            old_data AS (
                SELECT
                    m.sensor_id,
                    ROUND(AVG(m.temperature)::numeric, 1) AS temperature,
                    ROUND(AVG(m.humidity)::numeric, 0)    AS humidity,
                    ROUND(AVG(m.pressure)::numeric, 1)    AS pressure
                FROM measurements m
                WHERE m.created_at BETWEEN NOW() - INTERVAL '1 hour 5 minutes' 
                                    AND NOW() - INTERVAL '55 minutes'
                GROUP BY m.sensor_id
            )
            SELECT
                c.sensor_id,
                c.name,
                c.location,
                c.type,
                c.temperature,
                c.humidity,
                c.pressure,
                -- Le COALESCE permet d'afficher 0.0 si la sonde n'existait pas il y a 1h, évitant les bugs d'affichage
                ROUND((c.temperature - COALESCE(o.temperature, c.temperature))::numeric, 1) AS temperature_trend,
                ROUND((c.humidity - COALESCE(o.humidity, c.humidity))::numeric, 0)       AS humidity_trend,
                ROUND((c.pressure - COALESCE(o.pressure, c.pressure))::numeric, 1)       AS pressure_trend
            FROM current_data c
            LEFT JOIN old_data o ON c.sensor_id = o.sensor_id; -- <--- LEFT JOIN sur l'identifiant UNIQUE
        `);

        if (result.rows.length === 0) {

            return res.json({
                message: "Aucune mesure"
            });

        }

        res.json(result.rows[0]);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

}

});

module.exports = router;
