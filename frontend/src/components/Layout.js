import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊', exact: true },
  { path: '/contratos', label: 'Contratos', icon: '📋' },
  { path: '/alertas', label: 'Alertas', icon: '🔔', badge: true },
];

export default function Layout() {
  const { usuario, logout, esAdmin } = useAuth();
  const navigate = useNavigate();
  const [alertasCount, setAlertasCount] = useState(0);

  useEffect(() => {
    const fetchAlertas = async () => {
      try {
        const { data } = await axios.get('/alertas');
        setAlertasCount(data.total);
      } catch {}
    };
    fetchAlertas();
    const interval = setInterval(fetchAlertas, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const iniciales = usuario
    ? `${usuario.nombre[0]}${usuario.apellido[0]}`.toUpperCase()
    : '?';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>🎓 UniContratos</h1>
          <p>Sistema de Gestión</p>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              tabIndex={0}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && alertasCount > 0 && (
                <span className="nav-badge">{alertasCount}</span>
              )}
            </NavLink>
          ))}

          {esAdmin && (
            <NavLink
              to="/usuarios"
              tabIndex={0}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="icon">👥</span>
              <span>Usuarios</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-avatar">{iniciales}</div>
            <div>
              <div className="user-name">{usuario?.nombre} {usuario?.apellido}</div>
              <div className="user-rol">{usuario?.rol}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
