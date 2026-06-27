const express = require("express");
const { Pool } = require("pg");

const app = express();

app.use(express.json());

const pool = new Pool({
host: "postgres",
user: "weather",
password: "weatherpass",
database: "weather",
port: 5432
});

app.post("/api/weather", async (req, res) => {

const {
sensor_id,
temperature,
humidity,
pressure,
battery,
luminosity
} = req.body;

await pool.query(
`     INSERT INTO measurements
    (
      sensor_id,
      temperature,
      humidity,
      pressure,
      battery,
      luminosity
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    `,
[
sensor_id,
temperature,
humidity,
pressure,
battery,
luminosity
]
);

res.json({ success: true });
});

app.get("/api/latest", async (req, res) => {

const result =
await pool.query(
`       SELECT *
      FROM measurements
      ORDER BY created_at DESC
      LIMIT 1
      `
);

res.json(result.rows[0]);
});

app.listen(3001, () => {

console.log(
"Weather API running on port 3001"
);
});

const path = require("path");

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);
