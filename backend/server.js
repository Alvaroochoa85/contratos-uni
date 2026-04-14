const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const contratoRoutes = require('./routes/contratos');
const alertaRoutes = require('./routes/alertas');
const { verificarAlertas } = require('./config/alertas');

const app = express();

// ─── Trust proxy ────────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ─── CORS — tiene que ir ANTES de helmet y rutas ────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.options('*', cors());

// ─── Seguridad ──────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// ─── Rate limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,  // ← subí de 100 a 500
  message: { error: 'Demasiadas solicitudes, intente más tarde.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,   // ← subí de 10 a 50
  message: { error: 'Demasiados intentos de login, intente en 15 minutos.' }
});

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Log de requests para debug ─────────────────────────────────────────────
app.use((req, res, next) => {
  if (req.method !== 'OPTIONS') {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

// ─── Rutas ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/contratos', contratoRoutes);
app.use('/api/alertas', alertaRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── MongoDB ─────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB conectado');
    verificarAlertas();
    cron.schedule('0 8 * * *', () => {
      console.log('🔔 Verificando alertas de vencimiento...');
      verificarAlertas();
    });
  })
  .catch(err => {
    console.error('❌ Error MongoDB:', err.message);
    process.exit(1);
  });

// ─── Error handler ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});