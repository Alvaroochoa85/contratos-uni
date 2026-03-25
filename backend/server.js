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

// ─── Seguridad ─────────────────────────────────────────────────────────────
app.use(helmet());
app.set('trust proxy', 1); // ← agregá esta línea
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
  ? 'https://tu-dominio.com'
  : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { error: 'Demasiadas solicitudes, intente más tarde.' }
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de login, intente en 15 minutos.' }
});

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rutas ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/contratos', contratoRoutes);
app.use('/api/alertas', alertaRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── MongoDB ────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB conectado');

    // Verificar alertas al iniciar
    verificarAlertas();

    // Cron: verificar alertas todos los días a las 8 AM
    cron.schedule('0 8 * * *', () => {
      console.log('🔔 Verificando alertas de vencimiento...');
      verificarAlertas();
    });
  })
  .catch(err => {
    console.error('❌ Error MongoDB:', err.message);
    process.exit(1);
  });

// ─── Error handler ──────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
