const mongoose = require('mongoose');

const alertaSchema = new mongoose.Schema({
  contrato: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contrato',
    required: true
  },
  tipo: {
    type: String,
    enum: ['contrato', 'seguro'],
    required: true
  },
  diasRestantes: {
    type: Number,
    required: true
  },
  fechaVencimiento: {
    type: Date,
    required: true
  },
  leida: {
    type: Boolean,
    default: false
  },
  leidaPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  fechaLeida: Date
}, { timestamps: true });

module.exports = mongoose.model('Alerta', alertaSchema);
