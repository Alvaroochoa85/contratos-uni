import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [marcando, setMarcando] = useState(false);

  const fetchAlertas = async () => {
    setCargando(true);
    try {
      const { data } = await axios.get('/alertas');
      setAlertas(data.alertas);
    } catch {
      toast.error('Error al cargar alertas');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { fetchAlertas(); }, []);

  const marcarLeida = async (id) => {
    try {
      await axios.put(`/alertas/${id}/leer`);
      setAlertas(prev => prev.filter(a => a._id !== id));
      toast.success('Alerta marcada como leída');
    } catch {
      toast.error('Error al actualizar alerta');
    }
  };

  const marcarTodasLeidas = async () => {
    setMarcando(true);
    try {
      await axios.put('/alertas/leer-todas');
      setAlertas([]);
      toast.success('Todas las alertas marcadas como leídas');
    } catch {
      toast.error('Error al actualizar alertas');
    } finally {
      setMarcando(false);
    }
  };

  const urgentes = alertas.filter(a => a.diasRestantes <= 7);
  const advertencias = alertas.filter(a => a.diasRestantes > 7);

  const AlertaCard = ({ alerta }) => {
    const esUrgente = alerta.diasRestantes <= 7;
    const contrato = alerta.contrato;
    const fechaVenc = format(new Date(alerta.fechaVencimiento), "dd 'de' MMMM 'de' yyyy", { locale: es });

    return (
      <div className={`alerta-item ${esUrgente ? 'urgente' : 'advertencia'}`}>
        <div className="alerta-icon">
          {alerta.tipo === 'contrato' ? '📋' : '🛡️'}
        </div>
        <div className="alerta-body">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div className="alerta-titulo">
                {contrato?.apellido}, {contrato?.nombre}
                <span style={{
                  marginLeft: 8, fontSize: 11,
                  background: esUrgente ? 'var(--danger-light)' : 'var(--warning-light)',
                  color: esUrgente ? 'var(--danger)' : 'var(--warning)',
                  padding: '2px 8px', borderRadius: 8, fontWeight: 700
                }}>
                  {alerta.diasRestantes === 0 ? '¡HOY!' : `${alerta.diasRestantes} día${alerta.diasRestantes !== 1 ? 's' : ''}`}
                </span>
              </div>
              <div className="alerta-desc" style={{ marginTop: 4 }}>
                {alerta.tipo === 'contrato'
                  ? '📋 Vencimiento de contrato'
                  : '🛡️ Vencimiento de seguro'
                } el <strong>{fechaVenc}</strong>
              </div>
              <div className="alerta-meta" style={{ marginTop: 6, display: 'flex', gap: 16 }}>
                <span>Exp: {contrato?.nroExpediente}</span>
                <span>Tipo: {contrato?.tipoContrato}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Link
                to={`/contratos/${contrato?._id}/editar`}
                className="btn btn-sm btn-secondary"
              >
                ✏️ Ver
              </Link>
              <button
                className="btn btn-sm"
                style={{ background: 'var(--success-light)', color: 'var(--success)' }}
                onClick={() => marcarLeida(alerta._id)}
              >
                ✓ Leída
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">🔔 Alertas de Vencimiento</h2>
          <p className="page-subtitle">
            {alertas.length === 0
              ? 'No hay alertas activas'
              : `${alertas.length} alerta${alertas.length !== 1 ? 's' : ''} pendiente${alertas.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        {alertas.length > 0 && (
          <button
            className="btn btn-secondary"
            onClick={marcarTodasLeidas}
            disabled={marcando}
          >
            {marcando ? '⏳ Marcando...' : '✓ Marcar todas como leídas'}
          </button>
        )}
      </div>

      <div className="page-content">
        {cargando ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : alertas.length === 0 ? (
          <div className="empty-state">
            <div className="icon">✅</div>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>¡Todo en orden!</p>
            <p>No hay contratos ni seguros próximos a vencer en los próximos 15 días.</p>
            <Link to="/contratos" className="btn btn-primary" style={{ marginTop: 20 }}>
              Ver todos los contratos
            </Link>
          </div>
        ) : (
          <>
            {/* Urgentes (≤ 7 días) */}
            {urgentes.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 14, padding: '8px 14px',
                  background: 'var(--danger-light)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(239,68,68,0.3)'
                }}>
                  <span style={{ fontSize: 18 }}>🚨</span>
                  <span style={{ fontWeight: 700, color: 'var(--danger)' }}>
                    URGENTE — {urgentes.length} vencimiento{urgentes.length !== 1 ? 's' : ''} en 7 días o menos
                  </span>
                </div>
                {urgentes.map(a => <AlertaCard key={a._id} alerta={a} />)}
              </div>
            )}

            {/* Advertencias (8–15 días) */}
            {advertencias.length > 0 && (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 14, padding: '8px 14px',
                  background: 'var(--warning-light)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(245,158,11,0.3)'
                }}>
                  <span style={{ fontSize: 18 }}>⚠️</span>
                  <span style={{ fontWeight: 700, color: 'var(--warning)' }}>
                    PRÓXIMOS — {advertencias.length} vencimiento{advertencias.length !== 1 ? 's' : ''} entre 8 y 15 días
                  </span>
                </div>
                {advertencias.map(a => <AlertaCard key={a._id} alerta={a} />)}
              </div>
            )}

            {/* Info */}
            <div style={{
              marginTop: 24, padding: '14px 18px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-muted)'
            }}>
              🔄 Las alertas se verifican automáticamente todos los días a las 8:00 AM.
              Al marcar una alerta como leída, desaparece de esta lista pero el contrato sigue registrado.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
