const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Contrato = require('../models/Contrato');
const { proteger, restringirA } = require('../middleware/auth');

const router = express.Router();

// Todos los endpoints requieren autenticación
router.use(proteger);

// GET /api/contratos - Listar con filtros y paginación
router.get('/', async (req, res) => {
  try {
    const {
      page = 1, limit = 15, buscar, tipo, estado,
      ordenPor = 'fechaVencimientoContrato', orden = 'asc'
    } = req.query;

    const filtro = {};

    if (buscar) {
      filtro.$or = [
        { nroExpediente: { $regex: buscar, $options: 'i' } },
        { nombre: { $regex: buscar, $options: 'i' } },
        { apellido: { $regex: buscar, $options: 'i' } },
        { dni: { $regex: buscar, $options: 'i' } }
      ];
    }
    if (tipo) filtro.tipoContrato = tipo;
    if (estado) filtro.estado = estado;

    const total = await Contrato.countDocuments(filtro);
    const contratos = await Contrato.find(filtro)
      .populate('creadoPor', 'nombre apellido')
      .sort({ [ordenPor]: orden === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      contratos,
      total,
      paginas: Math.ceil(total / limit),
      paginaActual: Number(page)
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener contratos.' });
  }
});

// GET /api/contratos/estadisticas
router.get('/estadisticas', async (req, res) => {
  try {
    const hoy = new Date();
    const en15dias = new Date(hoy.getTime() + 15 * 24 * 60 * 60 * 1000);

    const [total, porEstado, porTipo, proximosVencer] = await Promise.all([
      Contrato.countDocuments(),
      Contrato.aggregate([
        { $group: { _id: '$estado', count: { $sum: 1 } } }
      ]),
      Contrato.aggregate([
        { $group: { _id: '$tipoContrato', count: { $sum: 1 } } }
      ]),
      Contrato.countDocuments({
        $or: [
          { fechaVencimientoContrato: { $gte: hoy, $lte: en15dias } },
          { fechaVencimientoSeguro: { $gte: hoy, $lte: en15dias } }
        ]
      })
    ]);

    res.json({ total, porEstado, porTipo, proximosVencer });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener estadísticas.' });
  }
});

// GET /api/contratos/:id
router.get('/:id', async (req, res) => {
  try {
    const contrato = await Contrato.findById(req.params.id)
      .populate('creadoPor', 'nombre apellido email')
      .populate('modificadoPor', 'nombre apellido email');
    if (!contrato) return res.status(404).json({ error: 'Contrato no encontrado.' });
    res.json({ contrato });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el contrato.' });
  }
});

// Validaciones comunes
const validarContrato = [
  body('nroExpediente').trim().notEmpty().withMessage('Número de expediente requerido'),
  body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
  body('apellido').trim().notEmpty().withMessage('Apellido requerido'),
  body('dni').trim().matches(/^\d{7,8}$/).withMessage('DNI inválido (7 u 8 dígitos)'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido'),
  body('tipoContrato').notEmpty().withMessage('Tipo de contrato requerido'),
  body('fechaInicioContrato').isISO8601().withMessage('Fecha de inicio inválida'),
  body('fechaVencimientoContrato').isISO8601().withMessage('Fecha de vencimiento inválida')
];

// POST /api/contratos
router.post('/', restringirA('admin', 'operador'), validarContrato, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const contrato = await Contrato.create({
      ...req.body,
      creadoPor: req.usuario._id,
      estado: calcularEstado(req.body.fechaVencimientoContrato)
    });

    res.status(201).json({ contrato, mensaje: 'Contrato creado exitosamente.' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'El número de expediente ya existe.' });
    }
    res.status(500).json({ error: 'Error al crear el contrato.' });
  }
});

// PUT /api/contratos/:id
router.put('/:id', restringirA('admin', 'operador'), validarContrato, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const contrato = await Contrato.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        modificadoPor: req.usuario._id,
        estado: calcularEstado(req.body.fechaVencimientoContrato)
      },
      { new: true, runValidators: true }
    );
    if (!contrato) return res.status(404).json({ error: 'Contrato no encontrado.' });
    res.json({ contrato, mensaje: 'Contrato actualizado exitosamente.' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'El número de expediente ya existe.' });
    }
    res.status(500).json({ error: 'Error al actualizar el contrato.' });
  }
});

// DELETE /api/contratos/:id (solo admin)
router.delete('/:id', restringirA('admin'), async (req, res) => {
  try {
    const contrato = await Contrato.findByIdAndDelete(req.params.id);
    if (!contrato) return res.status(404).json({ error: 'Contrato no encontrado.' });
    res.json({ mensaje: 'Contrato eliminado exitosamente.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el contrato.' });
  }
});

function calcularEstado(fechaVencimiento) {
  const hoy = new Date();
  const venc = new Date(fechaVencimiento);
  const diff = (venc - hoy) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'Vencido';
  if (diff <= 15) return 'Por Vencer';
  return 'Vigente';
}

module.exports = router;
