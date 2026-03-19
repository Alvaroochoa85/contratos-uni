import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Contratos from './pages/Contratos';
import FormContrato from './pages/FormContrato';
import Alertas from './pages/Alertas';
import Usuarios from './pages/Usuarios';
import Layout from './components/Layout';
import './index.css';

const RutaProtegida = ({ children }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="loading-screen"><div className="spinner" /></div>;
  return usuario ? children : <Navigate to="/login" replace />;
};

const RutaPublica = ({ children }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="loading-screen"><div className="spinner" /></div>;
  return !usuario ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#1e293b', color: '#f1f5f9', borderRadius: '10px' }
          }}
        />
        <Routes>
          <Route path="/login" element={<RutaPublica><Login /></RutaPublica>} />
          <Route path="/" element={<RutaProtegida><Layout /></RutaProtegida>}>
            <Route index element={<Dashboard />} />
            <Route path="contratos" element={<Contratos />} />
            <Route path="contratos/nuevo" element={<FormContrato />} />
            <Route path="contratos/:id/editar" element={<FormContrato />} />
            <Route path="alertas" element={<Alertas />} />
            <Route path="usuarios" element={<Usuarios />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

