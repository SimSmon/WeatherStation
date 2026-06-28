const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Vérification connexion BDD au démarrage
pool.connect()
    .then(client => {
        console.log("✅ Connecté à PostgreSQL");
        client.release();
    })
    .catch(err => {
        console.error("❌ Erreur PostgreSQL :", err);
    });

module.exports = pool;
