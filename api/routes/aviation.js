const express = require("express");
const router = express.Router();

router.get("/aviation", async (req, res) => {

    try {

        const response = await fetch(
            "https://aviationweather.gov/api/data/metar?ids=LFRN&format=json"
        );

        const data = await response.json();

        res.json(data);

    } catch(err){

        console.error(err);

        res.status(500).json({
            error: "Impossible de récupérer le METAR"
        });

    }

});

module.exports = router;