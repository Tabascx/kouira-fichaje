const { Client } = require('pg');
const bcrypt = require('bcrypt');

(async () => {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'kouira_fichaje',
    user: 'postgres',
    password: 'admin',
  });
  try {
    await client.connect();
    const res = await client.query("SELECT password FROM usuarios WHERE username = 'admin'");
    if (res.rows.length === 0) {
      console.error('No existe usuario admin');
      process.exit(1);
    }
    const hash = res.rows[0].password;
    const ok = await bcrypt.compare('admin', hash);
    console.log('Compare admin with DB hash =>', ok);
    process.exit(ok ? 0 : 2);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();

