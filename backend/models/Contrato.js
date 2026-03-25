const mongoose = require('mongoose');

const contratoSchema = new mongoose.Schema({
  nroExpediente: {
    type: String,
    required: [true, 'El número de expediente es requerido'],
    unique: true,
    trim: true,
    uppercase: true
  },
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [100, 'Máximo 100 caracteres']
  },
  apellido: {
    type: String,
    required: [true, 'El apellido es requerido'],
    trim: true,
    maxlength: [100, 'Máximo 100 caracteres']
  },
  dni: {
    type: String,
    required: [true, 'El DNI es requerido'],
    trim: true,
    match: [/^\d{7,8}$/, 'DNI inválido (7 u 8 dígitos)']
  },
  telefono: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  tipoContrato: {
    type: String,
    required: [true, 'El tipo de contrato es requerido'],
    enum: [
      'Docente','No Docente','Administrativo','Abogado','Contador',
      'Alumno Tutor','Empresa - Limpieza','Empresa - Seguridad',
      'Empresa - Mantenimiento','Empresa - Tecnología','Empresa - Otro','Otro'
    ]
  },
  secretaria: {
    type: String,
    trim: true,
    maxlength: [150, 'Máximo 150 caracteres']
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: [500, 'Máximo 500 caracteres']
  },
  importeMensual: {
    type: Number,
    min: [0, 'El importe no puede ser negativo'],
    default: 0
  },
  cantidadMeses: {
    type: Number,
    min: [1, 'Debe ser al menos 1 mes'],
    default: 1
  },
  importeTotal: {
    type: Number,
    min: [0, 'El importe no puede ser negativo'],
    default: 0
  },
  fechaInicioContrato: {
    type: Date,
    required: [true, 'La fecha de inicio del contrato es requerida']
  },
  fechaVencimientoContrato: {
    type: Date,
    required: [true, 'La fecha de vencimiento del contrato es requerida']
  },
  fechaVencimientoSeguro: {
    type: Date
  },
  alertaContrato15: { type: Boolean, default: false },
  alertaSeguro15: { type: Boolean, default: false },
  estado: {
    type: String,
    enum: ['Vigente','Por Vencer','Vencido','Renovado','Cancelado'],
    default: 'Vigente'
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  modificadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  }
}, { timestamps: true });

contratoSchema.index({ nroExpediente: 1 });
contratoSchema.index({ apellido: 1, nombre: 1 });
contratoSchema.index({ dni: 1 });
contratoSchema.index({ fechaVencimientoContrato: 1 });
contratoSchema.index({ fechaVencimientoSeguro: 1 });
contratoSchema.index({ estado: 1 });
contratoSchema.index({ tipoContrato: 1 });
contratoSchema.index({ secretaria: 1 });

contratoSchema.virtual('nombreCompleto').get(function() {
  return `${this.apellido}, ${this.nombre}`;
});

module.exports = mongoose.model('Contrato', contratoSchema);
