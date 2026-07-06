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

router.get("/trend/outdoor", async (req, res) => {

    try {

        const result = await pool.query(`
            WITH current_avg AS (

                SELECT AVG(m.temperature) AS temp

                FROM measurements m
                JOIN sensors s
                    ON s.sensor_id = m.sensor_id

                WHERE s.type = 'outdoor'

            ),

            old_avg AS (

                SELECT AVG(m.temperature) AS temp

                FROM measurements m
                JOIN sensors s
                    ON s.sensor_id = m.sensor_id

                WHERE s.type = 'outdoor'
                AND m.created_at <= NOW() - INTERVAL '1 hour'
                AND m.created_at >= NOW() - INTERVAL '1 hour 5 minutes'

            )

            SELECT

                current_avg.temp AS current,

                old_avg.temp AS one_hour_ago,

                ROUND(current_avg.temp - old_avg.temp,1) AS trend

            FROM current_avg, old_avg;
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

module.exports = router;
