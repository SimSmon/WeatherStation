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
WITH current_zones AS (
    SELECT
        s.location AS zone_type,
        ROUND(AVG(m.temperature)::numeric, 1) AS temperature,
        ROUND(AVG(m.humidity)::numeric, 0)    AS humidity,
        ROUND(AVG(m.pressure)::numeric, 1)    AS pressure
    FROM measurements m
    JOIN sensors s ON s.sensor_id = m.sensor_id
    WHERE m.created_at >= NOW() - INTERVAL '15 minutes'
    GROUP BY s.location
),
old_zones AS (
    SELECT
        s.location AS zone_type,
        ROUND(AVG(m.temperature)::numeric, 1) AS temperature,
        ROUND(AVG(m.humidity)::numeric, 0)    AS humidity,
        ROUND(AVG(m.pressure)::numeric, 1)    AS pressure
    FROM measurements m
    JOIN sensors s ON s.sensor_id = m.sensor_id
    WHERE m.created_at BETWEEN NOW() - INTERVAL '1 hour 15 minutes' AND NOW() - INTERVAL '45 minutes'
    GROUP BY s.location
)
SELECT
    COALESCE(c.zone_type, o.zone_type) AS zone_type,
    c.temperature,
    c.humidity,
    c.pressure,
    ROUND((COALESCE(c.temperature, 0) - COALESCE(o.temperature, c.temperature, 0))::numeric, 1) AS temperature_trend,
    ROUND((COALESCE(c.humidity, 0) - COALESCE(o.humidity, c.humidity, 0))::numeric, 0)       AS humidity_trend,
    ROUND((COALESCE(c.pressure, 0) - COALESCE(o.pressure, c.pressure, 0))::numeric, 1)       AS pressure_trend
FROM current_zones c
FULL OUTER JOIN old_zones o ON c.zone_type = o.zone_type; -- <--- FULL JOIN : Force l'affichage même si un côté est vide
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
