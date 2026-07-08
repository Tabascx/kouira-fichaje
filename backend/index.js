require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');

// ── Verificar variables de entorno obligatorias al arrancar ──────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET', 'JWT_EXPIRES_IN'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ Variable de entorno faltante: ${key}`);
    process.exit(1);
  }
}

const authRoutes       = require('./routes/auth');
const fichajeRoutes    = require('./routes/fichajes');
const trabajadorRoutes = require('./routes/trabajadores');
const exportarRoutes   = require('./routes/exportar');
const ausenciasRoutes  = require('./routes/ausencias');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Seguridad: Helmet ────────────────────────────────────────────────────────
app.use(helmet());

// ── Trust proxy (necesario en Render para obtener IPs reales) ────────────────
app.set('trust proxy', 1);

// ── CORS con whitelist ───────────────────────────────────────────────────────
const whitelist = [
  'http://localhost:3000',
  'https://kouira-fichaje.vercel.app',
  /https:\/\/kouira-fichaje.*\.vercel\.app$/,
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // permitir Postman/curl
    const permitido = whitelist.some(w =>
        typeof w === 'string' ? w === origin : w.test(origin)
    );
    if (permitido) callback(null, true);
    else callback(new Error(`CORS bloqueado: ${origin}`));
  },
  credentials: true,
}));

// ── Rate limiting general ────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones, espera un momento' },
}));

// ── Rate limiting estricto para login ────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // máximo 10 intentos de login cada 15 minutos
  message: { error: 'Demasiados intentos de login. Espera 15 minutos.' },
});

app.use(express.json());

// ── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/auth',         loginLimiter, authRoutes);
app.use('/api/fichajes',     fichajeRoutes);
app.use('/api/trabajadores', trabajadorRoutes);
app.use('/api/exportar',     exportarRoutes);
app.use('/api/ausencias',    ausenciasRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ ok: true, mensaje: 'Servidor Kouira S.L funcionando' });
});

// ── Error handler global ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});