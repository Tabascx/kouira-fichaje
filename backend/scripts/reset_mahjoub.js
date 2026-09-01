// script to login as admin and reset a user's password using env vars
// Usage: set ADMIN_USERNAME, ADMIN_PASSWORD, TARGET_USER_ID and API_URL before running
const fetch = global.fetch || require('node-fetch');
require('dotenv').config();

(async () => {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3002/api';
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;
    const targetId = process.env.TARGET_USER_ID;

    if (!adminUser || !adminPass || !targetId) {
      console.error('Define ADMIN_USERNAME, ADMIN_PASSWORD y TARGET_USER_ID en el entorno antes de ejecutar.');
      process.exit(1);
    }

    const loginRes = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminUser, password: adminPass }),
    });
    const loginJson = await loginRes.json();
    if (!loginRes.ok) {
      console.error('Login failed:', loginJson);
      process.exit(1);
    }
    const token = loginJson.token;
    console.log('Admin token: (oculto)');

    const resetRes = await fetch(`${apiUrl}/trabajadores/${targetId}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    const resetJson = await resetRes.json();
    if (!resetRes.ok) {
      console.error('Reset failed:', resetJson);
      process.exit(1);
    }
    console.log('Temp password:', resetJson.tempPassword);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
const fetch = global.fetch || require('node-fetch');
(async () => {
  try {
    const loginRes = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    const loginJson = await loginRes.json();
    if (!loginRes.ok) {
      console.error('Login failed:', loginJson);
      process.exit(1);
    }
    const token = loginJson.token;
    console.log('Admin token:', token.slice(0,20) + '...');

    const resetRes = await fetch('http://localhost:3002/api/trabajadores/2/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    const resetJson = await resetRes.json();
    if (!resetRes.ok) {
      console.error('Reset failed:', resetJson);
      process.exit(1);
    }
    console.log('Mahjoub temp password:', resetJson.tempPassword);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();

