const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false
    })
    : new Pool({
        host:     process.env.DB_HOST,
        port:     process.env.DB_PORT,
        database: process.env.DB_NAME,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

pool.query('SELECT NOW()', (err) => {
    if (err) console.error('Error conectando a PostgreSQL:', err.message);
    else     console.log('Conectado a PostgreSQL correctamente');
});

module.exports = pool;