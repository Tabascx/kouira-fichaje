require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const fichajeRoutes = require('./routes/fichajes');
const trabajadorRoutes = require('./routes/trabajadores');
const exportarRoutes = require('./routes/exportar');
const ausenciasRoutes = require('./routes/ausencias');

const app = express();

const PORT = process.env.PORT || 3002;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://kouira-fichaje.vercel.app',
  FRONTEND_ORIGIN,
  /^https:\/\/.*\.vercel\.app$/,
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
];

// CORS: permite localhost, Vercel y red local (necesario para móvil)
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some((allowed) => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    })) {
      callback(null, true);
    } else {
      callback(new Error('CORS no permitido'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/fichajes', fichajeRoutes);
app.use('/api/trabajadores', trabajadorRoutes);
app.use('/api/exportar', exportarRoutes);
app.use('/api/ausencias', ausenciasRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mensaje: 'Servidor Kouira S.L funcionando',
  });
});

app.get('/', (req, res) => {
  res.json({
    ok: true,
    mensaje: 'Backend Kouira S.L activo',
    health: '/api/health',
    login: '/api/auth/login',
  });
});

// Detecta errores silenciosos
process.on('uncaughtException', (err) => {
  console.error('ERROR NO CAPTURADO:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('PROMESA RECHAZADA:', err);
});

// Arranque del servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en:`);
  console.log(`  - http://localhost:${PORT}`);
  console.log(`  - http://192.168.1.20:${PORT}`);
});

// Detecta errores del puerto/server
server.on('error', (err) => {
  console.error('ERROR DEL SERVER:', err);
});