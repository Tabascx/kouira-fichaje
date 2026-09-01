require('dotenv').config({ path: __dirname + '/../.env' });
const fs = require('fs');
const path = require('path');
const pool = require('./connection');

async function run() {
  try {
    const migDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migDir)) {
      console.error('Migrations directory not found:', migDir);
      process.exit(1);
    }
    const files = fs.readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();
    if (files.length === 0) {
      console.log('No migration files found');
      process.exit(0);
    }
    for (const f of files) {
      const migPath = path.join(migDir, f);
      console.log('Running migration:', f);
      const sql = fs.readFileSync(migPath, 'utf8');
      await pool.query(sql);
    }
    console.log('All migrations applied successfully');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

run();
