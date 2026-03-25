import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const TIPOS = [
  'Docente','No Docente','Administrativo','Abogado','Contador',
  'Alumno Tutor','Empresa - Limpieza','Empresa - Seguridad',
  'Empresa - Mantenimiento','Empresa - Tecnología','Empresa - Otro','Gimnacia Laboral','Entrenador fisico deportista','Otro'
];

const SECRETARIAS = [
  'Rectorado',
  'Vicerector',
  'Secretaria General',
  'Secretaría Académica',
  'Secretaría de Hacienda y Administracion',
  'Secretaría de Extensión',
  'Secretaría de Bienestar Estudiantil',
  'Secretaría de Infraestructura',
  'Secretaria de Ciencia y Tecnica',
  'Secretaria de Innovacion y Arcticulacion Tecnologica',
  'Secretaria de Posgrado',
  'Secretaria de Comunicacion Estrategica',
  'Tesorería',
  'Asesoria Legal y Técnica',
  'Dirección de Personal',
  'Dirección de Compras',
  'Departamento de Pesupuesto y Liquidacion de Gastos',
  'Departamento de Liquidacion de Haberes',
  'Departamento de Contrataciones',
  'Departamento de Compras',
  'Departamente de Ciencias Basicas',
  'Departamento de Ciencias Aplicadas y Tecnologicas',
  'Biblioteca',
  'Escuela de Ciencia de la Salud',
  'Escuela de Gestion de Empresas y Economia',
  'Escuela de Ciencias Sociales y Educacion',
  'Escuela de Ingenieria y Ciencias Ambientales',
  'Escuela de Medicina',
  'UGR'
];

const INITIAL = {
  nroExpediente: '', nombre: '', apellido: '', dni: '',
  telefono: '', email: '', tipoContrato: '', secretaria: '',
  descripcion: '', importeMensual: '', cantidadMeses: '',
  importeTotal: '',
  fechaInicioContrato: '', fechaVencimientoContrato: '', fechaVencimientoSeguro: ''
};

function formatDateInput(dateStr) {
  if (!dateStr) return '';
  return format(new Date(dateStr), 'yyyy-MM-dd');
}

function formatPesos(valor) {
  if (!valor && valor !== 0) return '';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 2
  }).format(valor);
}

// ✅ Field definido FUERA del componente principal
function Field({ label, name, required, error, fullWidth, children }) {
  return (
    <div className={`form-group ${fullWidth ? 'full-width' : ''}`}>
      <label>{label}{required && <span className="required"> *</span>}</label>
      {children}
      {error && <span className="field-error">⚠ {error}</span>}
    </div>
  );
}

export default function FormContrato() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  const [form, setForm] = useState(INITIAL);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(esEdicion);

  useEffect(() => {
    if (!esEdicion) return;
    const fetchContrato = async () => {
      try {
        const { data } = await axios.get(`/contratos/${id}`);
        const c = data.contrato;
        setForm({
          nroExpediente: c.nroExpediente || '',
          nombre: c.nombre || '',
          apellido: c.apellido || '',
          dni: c.dni || '',
          telefono: c.telefono || '',
          email: c.email || '',
          tipoContrato: c.tipoContrato || '',
          secretaria: c.secretaria || '',
          descripcion: c.descripcion || '',
          importeMensual: c.importeMensual || '',
          cantidadMeses: c.cantidadMeses || '',
          importeTotal: c.importeTotal || '',
          fechaInicioContrato: formatDateInput(c.fechaInicioContrato),
          fechaVencimientoContrato: formatDateInput(c.fechaVencimientoContrato),
          fechaVencimientoSeguro: formatDateInput(c.fechaVencimientoSeguro)
        });
      } catch {
        toast.error('Error al cargar el contrato');
        navigate('/contratos');
      } finally {
        setCargando(false);
      }
    };
    fetchContrato();
  }, [id, esEdicion, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm(prev => {
      const nuevo = { ...prev, [name]: value };

      // Calcular importe total automáticamente
      if (name === 'importeMensual' || name === 'cantidadMeses') {
        const mensual = parseFloat(name === 'importeMensual' ? value : prev.importeMensual) || 0;
        const meses = parseFloat(name === 'cantidadMeses' ? value : prev.cantidadMeses) || 0;
        nuevo.importeTotal = mensual > 0 && meses > 0 ? (mensual * meses).toFixed(2) : '';
      }

      return nuevo;
    });

    if (errores[name]) setErrores(prev => ({ ...prev, [name]: '' }));
  };

  const validar = () => {
    const e = {};
    if (!form.nroExpediente.trim()) e.nroExpediente = 'Requerido';
    if (!form.nombre.trim()) e.nombre = 'Requerido';
    if (!form.apellido.trim()) e.apellido = 'Requerido';
    if (!/^\d{7,8}$/.test(form.dni)) e.dni = 'DNI inválido (7 u 8 dígitos)';
    if (!form.tipoContrato) e.tipoContrato = 'Seleccioná un tipo';
    if (!form.secretaria.trim()) e.secretaria = 'Requerida';
    if (!form.fechaInicioContrato) e.fechaInicioContrato = 'Requerida';
    if (!form.fechaVencimientoContrato) e.fechaVencimientoContrato = 'Requerida';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email inválido';
    if (form.importeMensual && isNaN(parseFloat(form.importeMensual))) e.importeMensual = 'Debe ser un número';
    if (form.cantidadMeses && (isNaN(parseInt(form.cantidadMeses)) || parseInt(form.cantidadMeses) < 1)) e.cantidadMeses = 'Debe ser al menos 1';
    if (form.fechaInicioContrato && form.fechaVencimientoContrato) {
      if (new Date(form.fechaVencimientoContrato) <= new Date(form.fechaInicioContrato)) {
        e.fechaVencimientoContrato = 'Debe ser posterior al inicio';
      }
    }
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) {
      toast.error('Corregí los errores antes de continuar');
      return;
    }
    setGuardando(true);
    try {
      const payload = { ...form };
      if (!payload.fechaVencimientoSeguro) delete payload.fechaVencimientoSeguro;
      if (!payload.email) delete payload.email;
      if (!payload.telefono) delete payload.telefono;
      if (payload.importeMensual) payload.importeMensual = parseFloat(payload.importeMensual);
      if (payload.cantidadMeses) payload.cantidadMeses = parseInt(payload.cantidadMeses);
      if (payload.importeTotal) payload.importeTotal = parseFloat(payload.importeTotal);

      if (esEdicion) {
        await axios.put(`/contratos/${id}`, payload);
        toast.success('Contrato actualizado correctamente');
      } else {
        await axios.post('/contratos', payload);
        toast.success('Contrato creado correctamente');
      }
      navigate('/contratos');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Error al guardar';
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <div className="loading-screen"><div className="spinner" /></div>;

  const importeTotalCalculado = parseFloat(form.importeTotal) || 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">{esEdicion ? '✏️ Editar Contrato' : '➕ Nuevo Contrato'}</h2>
          <p className="page-subtitle">
            {esEdicion ? 'Modificá los datos del contrato' : 'Completá el formulario para registrar un nuevo contrato'}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/contratos')}>
          ← Volver
        </button>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit}>

          {/* Datos del Contrato */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <span className="card-title">📄 Datos del Contrato</span>
            </div>
            <div className="form-grid">
              <Field label="Número de Expediente" name="nroExpediente" required error={errores.nroExpediente}>
                <input
                  name="nroExpediente"
                  value={form.nroExpediente}
                  onChange={handleChange}
                  placeholder="Ej: EXP-2024-001"
                  autoComplete="off"
                  style={errores.nroExpediente ? { borderColor: 'var(--danger)' } : {}}
                />
              </Field>

              <Field label="Tipo de Contrato" name="tipoContrato" required error={errores.tipoContrato}>
                <select
                  name="tipoContrato"
                  value={form.tipoContrato}
                  onChange={handleChange}
                  style={errores.tipoContrato ? { borderColor: 'var(--danger)' } : {}}
                >
                  <option value="">Seleccioná un tipo...</option>
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>

              <Field label="Secretaría / Sector solicitante" name="secretaria" required error={errores.secretaria} fullWidth>
                <select
                  name="secretaria"
                  value={form.secretaria}
                  onChange={handleChange}
                  style={errores.secretaria ? { borderColor: 'var(--danger)' } : {}}
                >
                  <option value="">Seleccioná una secretaría o sector...</option>
                  {SECRETARIAS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="Descripción / Observaciones" name="descripcion" fullWidth>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Información adicional sobre el contrato..."
                />
              </Field>
            </div>
          </div>

          {/* Datos Personales */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <span className="card-title">👤 Datos Personales</span>
            </div>
            <div className="form-grid">
              <Field label="Apellido" name="apellido" required error={errores.apellido}>
                <input
                  name="apellido"
                  value={form.apellido}
                  onChange={handleChange}
                  placeholder="Ej: García"
                  autoComplete="off"
                  style={errores.apellido ? { borderColor: 'var(--danger)' } : {}}
                />
              </Field>

              <Field label="Nombre" name="nombre" required error={errores.nombre}>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej: María"
                  autoComplete="off"
                  style={errores.nombre ? { borderColor: 'var(--danger)' } : {}}
                />
              </Field>

              <Field label="DNI" name="dni" required error={errores.dni}>
                <input
                  name="dni"
                  value={form.dni}
                  onChange={handleChange}
                  placeholder="Ej: 30123456"
                  maxLength={8}
                  autoComplete="off"
                  style={errores.dni ? { borderColor: 'var(--danger)' } : {}}
                />
              </Field>

              <Field label="Teléfono" name="telefono">
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="Ej: 2664-123456"
                  autoComplete="off"
                />
              </Field>

              <Field label="Email" name="email" error={errores.email}>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Ej: persona@email.com"
                  autoComplete="off"
                  style={errores.email ? { borderColor: 'var(--danger)' } : {}}
                />
              </Field>
            </div>
          </div>

          {/* Importes */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <span className="card-title">💰 Importes del Contrato</span>
            </div>
            <div className="form-grid-3">
              <Field label="Importe Mensual ($)" name="importeMensual" error={errores.importeMensual}>
                <input
                  name="importeMensual"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.importeMensual}
                  onChange={handleChange}
                  placeholder="Ej: 150000"
                  autoComplete="off"
                  style={errores.importeMensual ? { borderColor: 'var(--danger)' } : {}}
                />
              </Field>

              <Field label="Cantidad de Meses" name="cantidadMeses" error={errores.cantidadMeses}>
                <input
                  name="cantidadMeses"
                  type="number"
                  min="1"
                  step="1"
                  value={form.cantidadMeses}
                  onChange={handleChange}
                  placeholder="Ej: 6"
                  autoComplete="off"
                  style={errores.cantidadMeses ? { borderColor: 'var(--danger)' } : {}}
                />
              </Field>

              <Field label="Importe Total ($)" name="importeTotal">
                <input
                  name="importeTotal"
                  type="number"
                  value={form.importeTotal}
                  readOnly
                  placeholder="Se calcula automáticamente"
                  style={{
                    background: 'var(--bg-hover)',
                    cursor: 'not-allowed',
                    fontWeight: 600,
                    color: importeTotalCalculado > 0 ? 'var(--success)' : 'var(--text-muted)'
                  }}
                />
              </Field>
            </div>

            {/* Resumen visual del importe */}
            {importeTotalCalculado > 0 && (
              <div style={{
                marginTop: 16, padding: '14px 18px',
                background: 'var(--success-light)', border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: 13, color: 'var(--success)' }}>
                  💵 <strong>{formatPesos(parseFloat(form.importeMensual))}</strong> x{' '}
                  <strong>{form.cantidadMeses} mes{parseInt(form.cantidadMeses) !== 1 ? 'es' : ''}</strong>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>
                  Total: {formatPesos(importeTotalCalculado)}
                </div>
              </div>
            )}
          </div>

          {/* Fechas */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <span className="card-title">📅 Fechas</span>
            </div>
            <div className="form-grid-3">
              <Field label="Inicio del Contrato" name="fechaInicioContrato" required error={errores.fechaInicioContrato}>
                <input
                  type="date"
                  name="fechaInicioContrato"
                  value={form.fechaInicioContrato}
                  onChange={handleChange}
                  style={errores.fechaInicioContrato ? { borderColor: 'var(--danger)' } : {}}
                />
              </Field>

              <Field label="Vencimiento del Contrato" name="fechaVencimientoContrato" required error={errores.fechaVencimientoContrato}>
                <input
                  type="date"
                  name="fechaVencimientoContrato"
                  value={form.fechaVencimientoContrato}
                  onChange={handleChange}
                  style={errores.fechaVencimientoContrato ? { borderColor: 'var(--danger)' } : {}}
                />
              </Field>

              <Field label="Vencimiento del Seguro" name="fechaVencimientoSeguro">
                <input
                  type="date"
                  name="fechaVencimientoSeguro"
                  value={form.fechaVencimientoSeguro}
                  onChange={handleChange}
                />
              </Field>
            </div>

            {(form.fechaVencimientoContrato || form.fechaVencimientoSeguro) && (
              <div style={{
                marginTop: 16, padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-light)', border: '1px solid rgba(59,130,246,0.3)',
                fontSize: 13, color: 'var(--accent)'
              }}>
                🔔 Se generarán alertas automáticas <strong>15 días antes</strong> del vencimiento
                {form.fechaVencimientoSeguro ? ' del contrato y del seguro' : ' del contrato'}.
              </div>
            )}
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/contratos')}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? '⏳ Guardando...' : esEdicion ? '💾 Actualizar Contrato' : '✅ Crear Contrato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
