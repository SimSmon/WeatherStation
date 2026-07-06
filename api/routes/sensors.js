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
                    s.type,
                    m.temperature,
                    m.humidity,
                    m.pressure
                FROM measurements m
                JOIN sensors s ON s.sensor_id = m.sensor_id
                ORDER BY m.sensor_id,
                        ABS(EXTRACT(EPOCH FROM (m.created_at - (NOW() - INTERVAL '1 hour'))))
            )

            SELECT
                l.type,

                AVG(l.temperature) AS temp_now,
                AVG(p.temperature) AS temp_1h,

                AVG(l.temperature - p.temperature) AS temp_trend,

                AVG(l.humidity) AS humidity_now,
                AVG(p.humidity) AS humidity_1h,

                AVG(l.humidity - p.humidity) AS humidity_trend,

                AVG(l.pressure) AS pressure_now,
                AVG(p.pressure) AS pressure_1h,

                AVG(l.pressure - p.pressure) AS pressure_trend

            FROM latest l
            JOIN past p ON p.sensor_id = l.sensor_id
            GROUP BY l.type;
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
