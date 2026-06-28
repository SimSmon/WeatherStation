const express = require("express");
const router = express.Router();
const pool = require("../db");

// Convertit en nombre si possible, sinon renvoie null
function toNumberOrNull(value) {
    if (value === undefined || value === null || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

// Réception des données envoyées par l'ESP32
router.post("/weather", async (req, res) => {

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

        if (!sensor_id) {

            return res.status(400).json({
                error: "sensor_id manquant"
            });

        }

        // Vérifie si la sonde existe déjà
        const sensor = await pool.query(
            "SELECT sensor_id FROM sensors WHERE sensor_id=$1",
            [sensor_id]
        );

        if (sensor.rows.length === 0) {

            await pool.query(
                `
                INSERT INTO sensors
                (sensor_id, name, location, type, firmware, last_seen)
                VALUES ($1,$2,$3,$4,$5,NOW())
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

        } else {

            // Met à jour last_seen + firmware à chaque envoi
            await pool.query(
                `
                UPDATE sensors
                SET last_seen = NOW(),
                    firmware = COALESCE($2, firmware)
                WHERE sensor_id = $1
                `,
                [sensor_id, firmware || null]
            );

        }

        // Ajoute la mesure (les valeurs non numériques sont stockées en NULL)
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
                toNumberOrNull(temperature),
                toNumberOrNull(humidity),
                toNumberOrNull(pressure),
                toNumberOrNull(wind_speed),
                toNumberOrNull(wind_direction),
                toNumberOrNull(luminosity),
                toNumberOrNull(battery),
                toNumberOrNull(wifi_rssi)
            ]
        );

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});

module.exports = router;
