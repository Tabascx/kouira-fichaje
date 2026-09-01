require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcrypt');

(async () => {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'kouira_fichaje',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: process.env.PG_REJECT_UNAUTHORIZED !== 'false' } : false,
  });

  const checkPassword = process.env.CHECK_PASSWORD;
  if (!checkPassword) {
    console.error('DEFINE CHECK_PASSWORD en el entorno para comparar con el hash del admin.');
    process.exit(1);
  }

  try {
    await client.connect();
    const res = await client.query("SELECT password FROM usuarios WHERE username = 'admin'");
    if (res.rows.length === 0) {
      console.error('No existe usuario admin');
      process.exit(1);
    }
    const hash = res.rows[0].password;
    const ok = await bcrypt.compare(checkPassword, hash);
    console.log('Compare provided password with DB hash =>', ok);
    process.exit(ok ? 0 : 2);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();

