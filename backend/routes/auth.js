const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');
const { proteger, restringirA } = require('../middleware/auth');

const router = express.Router();

const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  });
};

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ email, activo: true }).select('+password');
    if (!usuario || !(await usuario.compararPassword(password))) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    }

    usuario.ultimoLogin = new Date();
    await usuario.save({ validateBeforeSave: false });

    const token = generarToken(usuario._id);

    res.json({
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
});

// POST /api/auth/registro (solo admin)
router.post('/registro', proteger, restringirA('admin'), [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
  body('apellido').trim().notEmpty().withMessage('Apellido requerido'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 8 }).withMessage('Mínimo 8 caracteres'),
  body('rol').isIn(['admin', 'operador', 'visualizador']).withMessage('Rol inválido')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { nombre, apellido, email, password, rol } = req.body;

    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(400).json({ error: 'El email ya está registrado.' });
    }

    const usuario = await Usuario.create({ nombre, apellido, email, password, rol });

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente.',
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar usuario.' });
  }
});

// GET /api/auth/perfil
router.get('/perfil', proteger, (req, res) => {
  res.json({ usuario: req.usuario });
});

// GET /api/auth/usuarios (solo admin)
router.get('/usuarios', proteger, restringirA('admin'), async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-password').sort({ apellido: 1 });
    res.json({ usuarios });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios.' });
  }
});

// PUT /api/auth/usuarios/:id/estado (solo admin)
router.put('/usuarios/:id/estado', proteger, restringirA('admin'), async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { activo: req.body.activo },
      { new: true }
    ).select('-password');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json({ usuario });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar usuario.' });
  }
});

module.exports = router;
