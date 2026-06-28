CREATE TABLE IF NOT EXISTS sensors (

    sensor_id VARCHAR(50) PRIMARY KEY,

    name VARCHAR(100),

    location VARCHAR(50),

    type VARCHAR(20),

    firmware VARCHAR(20),

    last_seen TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS measurements (

    id SERIAL PRIMARY KEY,

    sensor_id VARCHAR(50) NOT NULL,

    temperature REAL,
    humidity REAL,
    pressure REAL,

    wind_speed REAL,
    wind_direction REAL,

    luminosity REAL,

    battery REAL,

    wifi_rssi INTEGER,

    created_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY(sensor_id)
        REFERENCES sensors(sensor_id)
        ON DELETE CASCADE
);

-- Index pour accélérer la requête "dernière mesure par sonde"
-- (utilisée par DISTINCT ON (sensor_id) ... ORDER BY sensor_id, created_at DESC)
CREATE INDEX IF NOT EXISTS idx_measurements_sensor_created
    ON measurements (sensor_id, created_at DESC);
