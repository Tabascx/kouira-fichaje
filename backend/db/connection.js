const { Pool } = require('pg');

// Pool = grupo de conexiones reutilizables (más eficiente que conectar cada vez)
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Probar la conexión al arrancar
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Error conectando a PostgreSQL:', err.message);
  } else {
    console.log('Conectado a PostgreSQL correctamente');
  }
});

module.exports = pool;
