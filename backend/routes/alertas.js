const express = require('express');
const Alerta = require('../models/Alerta');
const { proteger } = require('../middleware/auth');

const router = express.Router();
router.use(proteger);

// GET /api/alertas - Obtener alertas activas
router.get('/', async (req, res) => {
  try {
    const alertas = await Alerta.find({ leida: false })
      .populate({
        path: 'contrato',
        select: 'nroExpediente nombre apellido tipoContrato fechaVencimientoContrato fechaVencimientoSeguro'
      })
      .sort({ diasRestantes: 1 });

    res.json({ alertas, total: alertas.length });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener alertas.' });
  }
});

// PUT /api/alertas/:id/leer
router.put('/:id/leer', async (req, res) => {
  try {
    const alerta = await Alerta.findByIdAndUpdate(
      req.params.id,
      { leida: true, leidaPor: req.usuario._id, fechaLeida: new Date() },
      { new: true }
    );
    if (!alerta) return res.status(404).json({ error: 'Alerta no encontrada.' });
    res.json({ alerta, mensaje: 'Alerta marcada como leída.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar alerta.' });
  }
});

// PUT /api/alertas/leer-todas
router.put('/leer-todas', async (req, res) => {
  try {
    await Alerta.updateMany(
      { leida: false },
      { leida: true, leidaPor: req.usuario._id, fechaLeida: new Date() }
    );
    res.json({ mensaje: 'Todas las alertas marcadas como leídas.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar alertas.' });
  }
});

module.exports = router;
