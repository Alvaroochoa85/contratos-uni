import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORES_ESTADO = {
  'Vigente': '#22c55e',
  'Por Vencer': '#f59e0b',
  'Vencido': '#ef4444',
  'Renovado': '#3b82f6',
  'Cancelado': '#64748b'
};

// Calcula el estado real basado en la fecha, sin depender de la DB
function calcularEstadoReal(fechaVencimiento) {
  if (!fechaVencimiento) return 'Vigente';
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = new Date(fechaVencimiento);
  venc.setHours(0, 0, 0, 0);
  const diff = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'Vencido';
  if (diff <= 30) return 'Por Vencer';  // ← ¿dice 30?
  return 'Vigente';
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Traer todos los contratos para calcular estados reales
        const [contratosRes, alertasRes] = await Promise.all([
          axios.get('/contratos', { params: { limit: 1000 } }),
          axios.get('/alertas')
        ]);

        const contratos = contratosRes.data.contratos;

        // Calcular estadísticas reales basadas en fechas actuales
        const estadoCount = { Vigente: 0, 'Por Vencer': 0, Vencido: 0, Renovado: 0, Cancelado: 0 };
        const tipoCount = {};

        contratos.forEach(c => {
          // Si el contrato fue cancelado o renovado manualmente, respetar ese estado
          let estadoReal;
          if (c.estado === 'Cancelado' || c.estado === 'Renovado') {
            estadoReal = c.estado;
          } else {
            estadoReal = calcularEstadoReal(c.fechaVencimientoContrato);
          }

          estadoCount[estadoReal] = (estadoCount[estadoReal] || 0) + 1;

          // Contar por tipo
          if (c.tipoContrato) {
            tipoCount[c.tipoContrato] = (tipoCount[c.tipoContrato] || 0) + 1;
          }
        });

        const porEstado = Object.entries(estadoCount)
          .filter(([, v]) => v > 0)
          .map(([_id, count]) => ({ _id, count }));

        const porTipo = Object.entries(tipoCount)
          .map(([_id, count]) => ({ _id, count }))
          .sort((a, b) => b.count - a.count);

        setStats({
          total: contratos.length,
          porEstado,
          porTipo,
          proximosVencer: alertasRes.data.total
        });

        setAlertas(alertasRes.data.alertas.slice(0, 20));
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  }, []);

  if (cargando) return <div className="loading-screen"><div className="spinner" /></div>;

  const estadoData = stats?.porEstado?.map(e => ({ name: e._id, value: e.count })) || [];
  const tipoData = stats?.porTipo?.map(t => ({
    name: t._id.replace('Empresa - ', 'Emp. '),
    value: t.count
  })) || [];

  const vigentes = stats?.porEstado?.find(e => e._id === 'Vigente')?.count || 0;
  const porVencer = stats?.porEstado?.find(e => e._id === 'Por Vencer')?.count || 0;
  const vencidos = stats?.porEstado?.find(e => e._id === 'Vencido')?.count || 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Resumen general del sistema de contratos</p>
        </div>
        <Link to="/contratos/nuevo" className="btn btn-primary">
          ➕ Nuevo Contrato
        </Link>
      </div>

      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--accent-light)' }}>📋</div>
            <div>
              <div className="stat-value">{stats?.total || 0}</div>
              <div className="stat-label">Contratos Totales</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--success-light)' }}>✅</div>
            <div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{vigentes}</div>
              <div className="stat-label">Vigentes</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>⏰</div>
            <div>
              <div className="stat-value" style={{ color: 'var(--warning)' }}>{porVencer}</div>
              <div className="stat-label">Por Vencer</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--danger-light)' }}>❌</div>
            <div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{vencidos}</div>
              <div className="stat-label">Vencidos</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--danger-light)' }}>🔔</div>
            <div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>
                {stats?.proximosVencer || 0}
              </div>
              <div className="stat-label">Alertas Activas</div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Estado de Contratos</span>
            </div>
            {estadoData.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <p>No hay contratos cargados</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={estadoData}
                    cx="50%" cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                    fontSize={11}
                  >
                    {estadoData.map((entry, i) => (
                      <Cell key={i} fill={COLORES_ESTADO[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b', border: '1px solid #334155',
                      borderRadius: 8, color: '#f1f5f9'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Por Tipo de Contrato</span>
            </div>
            {tipoData.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <p>No hay contratos cargados</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={tipoData} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={90} />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b', border: '1px solid #334155',
                      borderRadius: 8, color: '#f1f5f9'
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Alertas recientes */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔔 Alertas Recientes</span>
            <Link to="/alertas" className="btn btn-sm btn-secondary">Ver todas</Link>
          </div>
          {alertas.length === 0 ? (
            <div className="empty-state">
              <div className="icon">✅</div>
              <p>No hay alertas activas. ¡Todo en orden!</p>
            </div>
          ) : (
            alertas.map(alerta => (
              <div
                key={alerta._id}
                className={`alerta-item ${alerta.diasRestantes <= 7 ? 'urgente' : 'advertencia'}`}
              >
                <div className="alerta-icon">
                  {alerta.tipo === 'contrato' ? '📋' : '🛡️'}
                </div>
                <div className="alerta-body">
                  <div className="alerta-titulo">
                    {alerta.contrato?.apellido}, {alerta.contrato?.nombre}
                  </div>
                  <div className="alerta-desc">
                    Vence el {alerta.tipo === 'contrato' ? 'contrato' : 'seguro'} en{' '}
                    <strong style={{
                      color: alerta.diasRestantes <= 7 ? 'var(--danger)' : 'var(--warning)'
                    }}>
                      {alerta.diasRestantes} días
                    </strong>
                  </div>
                  <div className="alerta-meta">
                    Exp: {alerta.contrato?.nroExpediente} · {alerta.contrato?.tipoContrato}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Contratos vencidos recientes */}
        <VencidosRecientes />
      </div>
    </div>
  );
}

function VencidosRecientes() {
  const [vencidos, setVencidos] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axios.get('/contratos', {
          params: { estado: 'Vencido', limit: 5, ordenPor: 'fechaVencimientoContrato', orden: 'desc' }
        });
        setVencidos(data.contratos);
      } catch {}
    };
    fetch();
  }, []);

  if (vencidos.length === 0) return null;

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-header">
        <span className="card-title">❌ Contratos Vencidos Recientes</span>
        <Link to="/contratos?estado=Vencido" className="btn btn-sm btn-secondary">Ver todos</Link>
      </div>
      {vencidos.map(c => (
        <div key={c._id} className="alerta-item urgente">
          <div className="alerta-icon">📋</div>
          <div className="alerta-body">
            <div className="alerta-titulo">{c.apellido}, {c.nombre}</div>
            <div className="alerta-desc" style={{ color: 'var(--danger)' }}>
              Contrato vencido
            </div>
            <div className="alerta-meta">
              Exp: {c.nroExpediente} · {c.tipoContrato} · {c.secretaria || '—'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}