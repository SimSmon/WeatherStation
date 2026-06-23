CREATE TABLE IF NOT EXISTS measurements (

id SERIAL PRIMARY KEY,

sensor_id VARCHAR(50),

temperature REAL,

humidity REAL,

pressure REAL,

battery REAL,

luminosity REAL,

created_at TIMESTAMP DEFAULT NOW()
);
