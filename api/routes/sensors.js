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
                s.color,
                s.icon,
                s.display_order,
                s.enabled ,
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
),

per_sensor AS (
    SELECT
        s.sensor_id,
        s.type,

        cur.temperature AS temp_now,
        old.temperature AS temp_1h,

        cur.humidity AS hum_now,
        old.humidity AS hum_1h,

        cur.pressure AS pres_now,
        old.pressure AS pres_1h

    FROM sensors s
    CROSS JOIN ref

    LEFT JOIN LATERAL (
        SELECT
            temperature,
            humidity,
            pressure
        FROM measurements m
        WHERE m.sensor_id = s.sensor_id
        ORDER BY created_at DESC
        LIMIT 1
    ) cur ON TRUE

    LEFT JOIN LATERAL (
        SELECT
            temperature,
            humidity,
            pressure
        FROM measurements m
        WHERE m.sensor_id = s.sensor_id
        ORDER BY ABS(
            EXTRACT(EPOCH FROM (
                m.created_at - (ref.t_ref - INTERVAL '1 hour')
            ))
        )
        LIMIT 1
    ) old ON TRUE
)

SELECT
    type,

    ROUND(AVG(temp_now)::numeric, 1) AS temperature,
    ROUND(AVG(temp_1h)::numeric, 1) AS temperature_1h,
    ROUND(AVG(temp_now - temp_1h)::numeric, 1) AS temperature_trend,

    ROUND(AVG(hum_now)::numeric, 0) AS humidity,
    ROUND(AVG(hum_1h)::numeric, 0) AS humidity_1h,
    ROUND(AVG(hum_now - hum_1h)::numeric, 0) AS humidity_trend,

    ROUND(AVG(pres_now)::numeric, 1) AS pressure,
    ROUND(AVG(pres_1h)::numeric, 1) AS pressure_1h,
    ROUND(AVG(pres_now - pres_1h)::numeric, 1) AS pressure_trend

FROM per_sensor
GROUP BY type
ORDER BY type;
        `);

        if (result.rows.length === 0) {

            return res.json({
                message: "Aucune mesure"
            });

        }

        res.json(result.rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

}

});

router.get("/history", async (req, res) => {

    try {

        const hours = Number(req.query.hours || 24);

        let bucket;

        if (hours <= 1)
            bucket = "2 minutes";

        else if (hours <= 6)
            bucket = "5 minutes";

        else if (hours <= 24)
            bucket = "10 minutes";

        else if (hours <= 72)
            bucket = "30 minutes";

        else
            bucket = "1 hour";

        const result = await pool.query(`
            WITH history AS (

            SELECT

                s.name,
                s.type,

                date_bin(
                    $2::interval,
                    m.created_at,
                    TIMESTAMP '2000-01-01'
                ) AS bucket,

                AVG(m.temperature) AS temperature,
                AVG(m.humidity) AS humidity,
                AVG(m.pressure) AS pressure

            FROM measurements m

            JOIN sensors s
                ON s.sensor_id = m.sensor_id

            WHERE m.created_at >= NOW() - ($1 * INTERVAL '1 hour')

            GROUP BY

                s.name,
                s.type,
                bucket

        )

        SELECT *

        FROM history

        ORDER BY bucket;
        `
            , [hours, bucket]);

        res.json(result.rows);

    }

    catch(err){

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});

module.exports = router;
