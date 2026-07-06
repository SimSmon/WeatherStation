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
WITH ref AS (
    SELECT MAX(created_at) AS t_ref
    FROM measurements
)
SELECT
    s.sensor_id,
    s.type,
    cur.temperature AS temp_now,
    old.temperature AS temp_1h
FROM sensors s
CROSS JOIN ref

LEFT JOIN LATERAL (
    SELECT temperature, humidity, pressure, created_at
    FROM measurements m
    WHERE m.sensor_id = s.sensor_id
    ORDER BY created_at DESC
    LIMIT 1
) cur ON TRUE

LEFT JOIN LATERAL (
    SELECT temperature, humidity, pressure, created_at
    FROM measurements m
    WHERE m.sensor_id = s.sensor_id
    ORDER BY ABS(EXTRACT(EPOCH FROM (
        m.created_at - (ref.t_ref - INTERVAL '1 hour')
    )))
    LIMIT 1
) old ON TRUE;
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
