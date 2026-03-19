import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const TIPOS = [
  'Docente','No Docente','Administrativo','Abogado','Contador',
  'Alumno Tutor','Empresa - Limpieza','Empresa - Seguridad',
  'Empresa - Mantenimiento','Empresa - Tecnología','Empresa - Otro','Otro'
];

const INITIAL = {
  nroExpediente: '', nombre: '', apellido: '', dni: '',
  telefono: '', email: '', tipoContrato: '', descripcion: '',
  fechaInicioContrato: '', fechaVencimientoContrato: '', fechaVencimientoSeguro: ''
};

function formatDateInput(dateStr) {
  if (!dateStr) return '';
  return format(new Date(dateStr), 'yyyy-MM-dd');
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
          descripcion: c.descripcion || '',
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
    setForm(prev => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: '' }));
  };

  const validar = () => {
    const nuevosErrores = {};
    if (!form.nroExpediente.trim()) nuevosErrores.nroExpediente = 'Requerido';
    if (!form.nombre.trim()) nuevosErrores.nombre = 'Requerido';
    if (!form.apellido.trim()) nuevosErrores.apellido = 'Requerido';
    if (!/^\d{7,8}$/.test(form.dni)) nuevosErrores.dni = 'DNI inválido (7 u 8 dígitos)';
    if (!form.tipoContrato) nuevosErrores.tipoContrato = 'Seleccioná un tipo';
    if (!form.fechaInicioContrato) nuevosErrores.fechaInicioContrato = 'Requerida';
    if (!form.fechaVencimientoContrato) nuevosErrores.fechaVencimientoContrato = 'Requerida';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) nuevosErrores.email = 'Email inválido';
    if (form.fechaInicioContrato && form.fechaVencimientoContrato) {
      if (new Date(form.fechaVencimientoContrato) <= new Date(form.fechaInicioContrato)) {
        nuevosErrores.fechaVencimientoContrato = 'Debe ser posterior al inicio';
      }
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
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