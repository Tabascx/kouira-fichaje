// Deprecated: this script previously contained hardcoded credentials.
// Use set-passwords.safe.js instead which reads USERS_JSON and DATABASE_URL from the environment.
// Keeping this file as a safe stub to avoid accidental execution.

console.error('Este script está deshabilitado por seguridad. Usa backend/scripts/set-passwords.safe.js en su lugar.');
process.exit(1);
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://kouira_db_2_user:ZCaf8GrAvJFT6UxAMYldF7FoD71HwzaQ@dpg-d912nqflk1mc739n9otg-a.oregon-postgres.render.com/kouira_db_2',
    ssl: { rejectUnauthorized: false }
});

const usuarios = [
    // REMOVED: user entry removed for security,
    // REMOVED: user entry removed for security,
    // REMOVED: user entry removed for security,
];

(async () => {
    for (const u of usuarios) {
        const hash = await bcrypt.hash(u.password, 10);
        await pool.query('UPDATE usuarios SET password = $1 WHERE username = $2', [hash, u.username]);
        console.log('OK:', u.username);
    }
    await pool.end();
    console.log('Listo');
})();