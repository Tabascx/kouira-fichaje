require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./connection');

async function run() {
  try {
    const migPath = path.join(__dirname, 'migrations', '20260901_add_ausencias_auditoria.sql');
    if (!fs.existsSync(migPath)) {
      console.error('Migration file not found:', migPath);
      process.exit(1);
    }
    const sql = fs.readFileSync(migPath, 'utf8');
    console.log('Running migration...');
    await pool.query(sql);
    console.log('Migration applied successfully');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

run();
