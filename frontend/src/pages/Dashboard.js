import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORES_ESTADO = {
  'Vigente': '#22c55e', 'Por Vencer': '#f59e0b',
  'Vencido': '#ef4444', 'Renovado': '#3b82f6', 'Cancelado': '#64748b'
};

const COLORES_TIPO = [
  '#3b82f6','#a855f7','#22c55e','#f59e0b','#ef4444',
  '#06b6d4','#ec4899','#84cc16','#f97316','#6366f1'
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, alertasRes] = await Promise.all([
          axios.get('/contratos/estadisticas'),
          axios.get('/alertas')
        ]);
        setStats(statsRes.data);
        setAlertas(alertasRes.data.alertas.slice(0, 5));
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
  const tipoData = stats?.porTipo?.map(t => ({ name: t._id.replace('Empresa - ', 'Emp. '), value: t.count })) || [];

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
              <div className="stat-value" style={{ color: 'var(--success)' }}>
                {stats?.porEstado?.find(e => e._id === 'Vigente')?.count || 0}
              </div>
              <div className="stat-label">Vigentes</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>⏰</div>
            <div>
              <div className="stat-value" style={{ color: 'var(--warning)' }}>
                {stats?.porEstado?.find(e => e._id === 'Por Vencer')?.count || 0}
              </div>
              <div className="stat-label">Por Vencer</div>
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

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Estado de Contratos</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={estadoData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>
                  {estadoData.map((entry, i) => (
                    <Cell key={i} fill={COLORES_ESTADO[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Por Tipo de Contrato</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tipoData} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={90} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={4} />
              </BarChart>
            </ResponsiveContainer>
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
              <div key={alerta._id} className={`alerta-item ${alerta.diasRestantes <= 7 ? 'urgente' : 'advertencia'}`}>
                <div className="alerta-icon">{alerta.tipo === 'contrato' ? '📋' : '🛡️'}</div>
                <div className="alerta-body">
                  <div className="alerta-titulo">
                    {alerta.contrato?.apellido}, {alerta.contrato?.nombre}
                  </div>
                  <div className="alerta-desc">
                    Vence el {alerta.tipo === 'contrato' ? 'contrato' : 'seguro'} en{' '}
                    <strong style={{ color: alerta.diasRestantes <= 7 ? 'var(--danger)' : 'var(--warning)' }}>
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
      </div>
    </div>
  );
}
