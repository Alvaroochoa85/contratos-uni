import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TIPOS = [
  'Docente','No Docente','Administrativo','Abogado','Contador',
  'Alumno Tutor','Empresa - Limpieza','Empresa - Seguridad',
  'Empresa - Mantenimiento','Empresa - Tecnología','Empresa - Otro','Otro'
];

const ESTADOS = ['Vigente','Por Vencer','Vencido','Renovado','Cancelado'];

function badgeEstado(estado) {
  const map = {
    'Vigente': 'badge-success',
    'Por Vencer': 'badge-warning',
    'Vencido': 'badge-danger',
    'Renovado': 'badge-info',
    'Cancelado': 'badge-muted'
  };
  return map[estado] || 'badge-muted';
}

function diasHasta(fecha) {
  if (!fecha) return null;
  return Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24));
}

function FechaCelda({ fecha }) {
  if (!fecha) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const dias = diasHasta(fecha);
  const formatted = format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
  let color = 'var(--text-primary)';
  if (dias !== null && dias <= 0) color = 'var(--danger)';
  else if (dias !== null && dias <= 15) color = 'var(--warning)';
  return (
    <span style={{ color, fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
      {formatted}
      {dias !== null && dias <= 15 && dias > 0 && (
        <span style={{ marginLeft: 6, fontSize: 11, background: 'var(--warning-light)', color: 'var(--warning)', padding: '1px 6px', borderRadius: 8 }}>
          {dias}d
        </span>
      )}
      {dias !== null && dias <= 0 && (
        <span style={{ marginLeft: 6, fontSize: 11, background: 'var(--danger-light)', color: 'var(--danger)', padding: '1px 6px', borderRadius: 8 }}>
          Vencido
        </span>
      )}
    </span>
  );
}

function FilaContrato({ c, puedeEditar, esAdmin, onEditar, onEliminar }) {
  return (
    <tr>
      <td>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--accent)' }}>
          {c.nroExpediente}
        </span>
      </td>
      <td>
        <div style={{ fontWeight: 600 }}>{c.apellido}, {c.nombre}</div>
        {c.email && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</div>}
      </td>
      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{c.dni}</td>
      <td><span className="badge badge-purple">{c.tipoContrato}</span></td>
      <td><span className={`badge ${badgeEstado(c.estado)}`}>{c.estado}</span></td>
      <td><FechaCelda fecha={c.fechaVencimientoContrato} /></td>
      <td><FechaCelda fecha={c.fechaVencimientoSeguro} /></td>
      <td>
        <div style={{ display: 'flex', gap: 6 }}>
          {puedeEditar && (
            <button className="btn-icon" title="Editar" onClick={() => onEditar(c._id)}>✏️</button>
          )}
          {esAdmin && (
            <button className="btn-icon" title="Eliminar" onClick={() => onEliminar(c)} style={{ color: 'var(--danger)' }}>🗑️</button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function Contratos() {
  const { puedeEditar, esAdmin } = useAuth();
  const navigate = useNavigate();

  const [contratos, setContratos] = useState([]);
  const [total, setTotal] = useState(0);
  const [paginas, setPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);

  const [buscarInput, setBuscarInput] = useState('');
  const [buscarQuery, setBuscarQuery] = useState('');
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const debounceRef = useRef(null);

  const handleBuscarChange = (e) => {
    const valor = e.target.value;
    setBuscarInput(valor);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setBuscarQuery(valor);
      setPage(1);
    }, 400);
  };

  const fetchContratos = useCallback(async () => {
    setCargando(true);
    try {
      const params = { page, limit: 15 };
      if (buscarQuery) params.buscar = buscarQuery;
      if (tipo) params.tipo = tipo;
      if (estado) params.estado = estado;
      const { data } = await axios.get('/contratos', { params });
      setContratos(data.contratos);
      setTotal(data.total);
      setPaginas(data.paginas);
    } catch {
      toast.error('Error al cargar los contratos');
    } finally {
      setCargando(false);
    }
  }, [page, buscarQuery, tipo, estado]);

  useEffect(() => { fetchContratos(); }, [fetchContratos]);

  const handleLimpiar = () => {
    setBuscarInput('');
    setBuscarQuery('');
    setTipo('');
    setEstado('');
    setPage(1);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/contratos/${id}`);
      toast.success('Contrato eliminado');
      setConfirmDelete(null);
      fetchContratos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const exportarCSV = () => {
    const headers = ['Expediente','Apellido','Nombre','DNI','Teléfono','Email','Tipo','Estado','Inicio','Venc. Contrato','Venc. Seguro'];
    const rows = contratos.map(c => [
      c.nroExpediente, c.apellido, c.nombre, c.dni,
      c.telefono || '', c.email || '', c.tipoContrato, c.estado,
      c.fechaInicioContrato ? format(new Date(c.fechaInicioContrato), 'dd/MM/yyyy') : '',
      c.fechaVencimientoContrato ? format(new Date(c.fechaVencimientoContrato), 'dd/MM/yyyy') : '',
      c.fechaVencimientoSeguro ? format(new Date(c.fechaVencimientoSeguro), 'dd/MM/yyyy') : ''
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contratos_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Contratos</h2>
          <p className="page-subtitle">{total} contrato{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={exportarCSV}>📥 Exportar CSV</button>
          {puedeEditar && (
            <Link to="/contratos/nuevo" className="btn btn-primary">➕ Nuevo Contrato</Link>
          )}
        </div>
      </div>

      <div className="page-content">
        <div className="filters-bar">
          <div className="search-input">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por expediente, nombre, apellido o DNI..."
              value={buscarInput}
              onChange={handleBuscarChange}
              autoComplete="off"
            />
          </div>
          <select className="filter-select" value={tipo} onChange={e => { setTipo(e.target.value); setPage(1); }}>
            <option value="">Todos los tipos</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="filter-select" value={estado} onChange={e => { setEstado(e.target.value); setPage(1); }}>
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          {(buscarInput || tipo || estado) && (
            <button className="btn btn-secondary btn-sm" onClick={handleLimpiar}>✕ Limpiar</button>
          )}
        </div>

        {cargando ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : contratos.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <p>No se encontraron contratos</p>
            {puedeEditar && (
              <Link to="/contratos/nuevo" className="btn btn-primary" style={{ marginTop: 16 }}>➕ Agregar el primero</Link>
            )}
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Expediente</th>
                    <th>Apellido y Nombre</th>
                    <th>DNI</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Venc. Contrato</th>
                    <th>Venc. Seguro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {contratos.map(c => (
                    <FilaContrato
                      key={c._id}
                      c={c}
                      puedeEditar={puedeEditar}
                      esAdmin={esAdmin}
                      onEditar={(id) => navigate(`/contratos/${id}/editar`)}
                      onEliminar={(c) => setConfirmDelete(c)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {paginas > 1 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
                {Array.from({ length: paginas }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === paginas || Math.abs(p - page) <= 2)
                  .map((p, i, arr) => (
                    <React.Fragment key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color: 'var(--text-muted)' }}>…</span>}
                      <button className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                    </React.Fragment>
                  ))}
                <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === paginas}>›</button>
              </div>
            )}
          </>
        )}
      </div>

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🗑️ Confirmar eliminación</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>¿Estás seguro de que querés eliminar el contrato:</p>
            <p style={{ fontWeight: 600, marginBottom: 24 }}>{confirmDelete.apellido}, {confirmDelete.nombre} — Exp. {confirmDelete.nroExpediente}</p>
            <p style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 24 }}>⚠️ Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete._id)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
