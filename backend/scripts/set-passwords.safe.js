require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Script seguro: lee usuarios desde USERS_JSON env var y DATABASE_URL desde env
// Usage example:
//   export DATABASE_URL='postgres://user:pass@host:5432/db'
//   export USERS_JSON='[{"username":"u1","password":"tmpPass1"}]'
//   node set-passwords.safe.js

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL no definido. Exporta DATABASE_URL en el entorno antes de ejecutar este script.');
  process.exit(1);
}

const sslOption = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: process.env.PG_REJECT_UNAUTHORIZED !== 'false' } : false;
const pool = new Pool({ connectionString, ssl: sslOption });

let usuarios;
try {
  usuarios = JSON.parse(process.env.USERS_JSON || '[]');
} catch (err) {
  console.error('USERS_JSON inválido. Debe ser un JSON válido.');
  process.exit(1);
}

if (!Array.isArray(usuarios) || usuarios.length === 0) {
  console.error('No hay usuarios en USERS_JSON. Defínelo en el entorno con credenciales temporales.');
  process.exit(1);
}

(async () => {
    for (const u of usuarios) {
        const hash = await bcrypt.hash(u.password, 10);
        await pool.query('UPDATE usuarios SET password = $1 WHERE username = $2', [hash, u.username]);
        console.log('OK:', u.username);
    }
    await pool.end();
    console.log('Listo');
})();
