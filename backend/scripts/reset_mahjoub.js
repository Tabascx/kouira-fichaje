// script to login as admin and reset Mahjoub password, printing the temp password
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

