require('dotenv').config();
const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD no definido. Defínelo en el entorno antes de ejecutar este script.');
    process.exit(1);
  }

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'kouira_fichaje',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: process.env.PG_REJECT_UNAUTHORIZED !== 'false' } : false,
  });

  await client.connect();

  const hash = await bcrypt.hash(adminPassword, 10);

  await client.query(
    `
    INSERT INTO usuarios (nombre, username, password, rol, activo)
    VALUES ($1, $2, $3, 'admin', true)
    ON CONFLICT (username)
    DO UPDATE SET
      nombre = EXCLUDED.nombre,
      password = EXCLUDED.password,
      rol = 'admin',
      activo = true
    `,
    ['Administrador', 'admin', hash]
  );

  console.log('Admin reseteado correctamente. Username=admin');
  console.log('Password usada: (oculta por seguridad)');

  await client.end();
}

main().catch(async (err) => {
  console.error('Error reseteando admin:', err.message);
  process.exitCode = 1;
});
const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'kouira_fichaje',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
  });

  await client.connect();

  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin', 10);

  await client.query(
    `
    INSERT INTO usuarios (nombre, username, password, rol, activo)
    VALUES ($1, $2, $3, 'admin', true)
    ON CONFLICT (username)
    DO UPDATE SET
      nombre = EXCLUDED.nombre,
      password = EXCLUDED.password,
      rol = 'admin',
      activo = true
    `,
    ['Administrador', 'admin', hash]
  );

  console.log('Admin reseteado correctamente. Username=admin');
  console.log(`Password usada: ${process.env.ADMIN_PASSWORD || 'admin'}`);

  await client.end();
}

main().catch(async (err) => {
  console.error('Error reseteando admin:', err.message);
  process.exitCode = 1;
});
