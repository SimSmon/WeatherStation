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
WITH latest AS (
    SELECT DISTINCT ON (m.sensor_id)
        m.sensor_id,
        s.type,
        m.temperature,
        m.humidity,
        m.pressure
    FROM measurements m
    JOIN sensors s ON s.sensor_id = m.sensor_id
    ORDER BY m.sensor_id, m.created_at DESC
),

past AS (
    SELECT DISTINCT ON (m.sensor_id)
        m.sensor_id,
        m.temperature,
        m.humidity,
        m.pressure
    FROM measurements m
    ORDER BY m.sensor_id,
             ABS(EXTRACT(EPOCH FROM (m.created_at - (NOW() - INTERVAL '1 hour'))))
),

per_sensor AS (
    SELECT
        l.sensor_id,
        l.type,

        l.temperature AS temp_now,
        p.temperature AS temp_1h,

        l.humidity AS hum_now,
        p.humidity AS hum_1h,

        l.pressure AS pres_now,
        p.pressure AS pres_1h

    FROM latest l
    LEFT JOIN past p ON p.sensor_id = l.sensor_id
)

SELECT
    type,

    AVG(temp_now) AS temp_now,
    AVG(temp_1h)  AS temp_1h,
    AVG(temp_now - temp_1h) AS temp_trend,

    AVG(hum_now) AS humidity_now,
    AVG(hum_1h)  AS humidity_1h,
    AVG(hum_now - hum_1h) AS humidity_trend,

    AVG(pres_now) AS pressure_now,
    AVG(pres_1h)  AS pressure_1h,
    AVG(pres_now - pres_1h) AS pressure_trend

FROM per_sensor
GROUP BY type;
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
