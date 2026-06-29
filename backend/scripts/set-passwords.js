require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://kouira_db_2_user:ZCaf8GrAvJFT6UxAMYldF7FoD71HwzaQ@dpg-d912nqflk1mc739n9otg-a.oregon-postgres.render.com/kouira_db_2',
    ssl: { rejectUnauthorized: false }
});

const usuarios = [
    { username: 'mahjoub.kouira',  password: 'M1979ce_' },
    { username: 'haytham.samouni', password: 'haytham2024' },
    { username: 'mouhsin.kouira',  password: '567890ce_' },
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