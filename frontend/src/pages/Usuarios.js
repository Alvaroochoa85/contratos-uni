import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ROLES = ['admin', 'operador', 'visualizador'];

const PERMISOS = {
  admin: ['Ver contratos', 'Crear contratos', 'Editar contratos', 'Eliminar contratos', 'Gestionar usuarios'],
  operador: ['Ver contratos', 'Crear contratos', 'Editar contratos'],
  visualizador: ['Ver contratos']
};

export default function Usuarios() {
  const { esAdmin, usuario: usuarioActual } = useAuth();
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', password: '', rol: 'operador'
  });
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (!esAdmin) { navigate('/'); return; }
    fetchUsuarios();
  }, [esAdmin, navigate]);

  const fetchUsuarios = async () => {
    setCargando(true);
    try {
      const { data } = await axios.get('/auth/usuarios');
      setUsuarios(data.usuarios);
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setCargando(false);
    }
  };

  const toggleEstado = async (id, activo) => {
    if (id === usuarioActual._id) {
      toast.error('No podés desactivar tu propio usuario');
      return;
    }
    try {
      await axios.put(`/auth/usuarios/${id}/estado`, { activo: !activo });
      toast.success(`Usuario ${!activo ? 'activado' : 'desactivado'}`);
      fetchUsuarios();
    } catch {
      toast.error('Error al actualizar usuario');
    }
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'Requerido';
    if (!form.apellido.trim()) e.apellido = 'Requerido';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email inválido';
    if (form.password.length < 8) e.password = 'Mínimo 8 caracteres';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setGuardando(true);
    try {
      await axios.post('/auth/registro', form);
      toast.success('Usuario creado correctamente');
      setModalNuevo(false);
      setForm({ nombre: '', apellido: '', email: '', password: '', rol: 'operador' });
      setErrores({});
      fetchUsuarios();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear usuario');
    } finally {
      setGuardando(false);
    }
  };

  const badgeRol = (rol) => {
    const map = { admin: 'badge-danger', operador: 'badge-info', visualizador: 'badge-muted' };
    return map[rol] || 'badge-muted';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">👥 Gestión de Usuarios</h2>
          <p className="page-subtitle">{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} en el sistema</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalNuevo(true)}>
          ➕ Nuevo Usuario
        </button>
      </div>

      <div className="page-content">
        {/* Tabla de roles */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">🔐 Permisos por Rol</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {ROLES.map(rol => (
              <div key={rol} style={{
                background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
                padding: '14px 16px', border: '1px solid var(--border)'
              }}>
                <span className={`badge ${badgeRol(rol)}`} style={{ marginBottom: 10, display: 'inline-block' }}>
                  {rol.charAt(0).toUpperCase() + rol.slice(1)}
                </span>
                <ul style={{ paddingLeft: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                  {PERMISOS[rol].map(p => <li key={p} style={{ marginBottom: 4 }}>{p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de usuarios */}
        {cargando ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Último Login</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                          {u.nombre[0]}{u.apellido[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.apellido}, {u.nombre}</div>
                          {u._id === usuarioActual._id && (
                            <span style={{ fontSize: 11, color: 'var(--accent)' }}>← vos</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                    <td><span className={`badge ${badgeRol(u.rol)}`}>{u.rol}</span></td>
                    <td>
                      <span className={`badge ${u.activo ? 'badge-success' : 'badge-muted'}`}>
                        {u.activo ? '● Activo' : '○ Inactivo'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {u.ultimoLogin
                        ? format(new Date(u.ultimoLogin), "dd/MM/yy HH:mm", { locale: es })
                        : 'Nunca'
                      }
                    </td>
                    <td>
                      <button
                        className="btn btn-sm"
                        style={{
                          background: u.activo ? 'var(--danger-light)' : 'var(--success-light)',
                          color: u.activo ? 'var(--danger)' : 'var(--success)'
                        }}
                        onClick={() => toggleEstado(u._id, u.activo)}
                        disabled={u._id === usuarioActual._id}
                      >
                        {u.activo ? '🚫 Desactivar' : '✅ Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nuevo Usuario */}
      {modalNuevo && (
        <div className="modal-overlay" onClick={() => setModalNuevo(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">➕ Crear Nuevo Usuario</span>
              <button className="btn-icon" onClick={() => setModalNuevo(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label>Nombre <span className="required">*</span></label>
                  <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="María" />
                  {errores.nombre && <span className="field-error">⚠ {errores.nombre}</span>}
                </div>
                <div className="form-group">
                  <label>Apellido <span className="required">*</span></label>
                  <input value={form.apellido} onChange={e => setForm(p => ({ ...p, apellido: e.target.value }))} placeholder="García" />
                  {errores.apellido && <span className="field-error">⚠ {errores.apellido}</span>}
                </div>
                <div className="form-group">
                  <label>Email <span className="required">*</span></label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="usuario@universidad.edu.ar" />
                  {errores.email && <span className="field-error">⚠ {errores.email}</span>}
                </div>
                <div className="form-group">
                  <label>Contraseña <span className="required">*</span></label>
                  <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Mínimo 8 caracteres" />
                  {errores.password && <span className="field-error">⚠ {errores.password}</span>}
                </div>
                <div className="form-group full-width">
                  <label>Rol <span className="required">*</span></label>
                  <select value={form.rol} onChange={e => setForm(p => ({ ...p, rol: e.target.value }))}>
                    <option value="operador">Operador — puede crear y editar</option>
                    <option value="visualizador">Visualizador — solo lectura</option>
                    <option value="admin">Administrador — acceso total</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalNuevo(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={guardando}>
                  {guardando ? '⏳ Creando...' : '✅ Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
