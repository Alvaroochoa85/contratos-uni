import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

// Configurar axios
axios.defaults.baseURL = '/api';

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const setToken = (token) => {
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const verificarToken = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCargando(false);
      return;
    }
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const { data } = await axios.get('/auth/perfil');
      setUsuario(data.usuario);
    } catch {
      setToken(null);
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    verificarToken();
  }, [verificarToken]);

  const login = async (email, password) => {
    const { data } = await axios.post('/auth/login', { email, password });
    setToken(data.token);
    setUsuario(data.usuario);
    return data;
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
  };

  const esAdmin = usuario?.rol === 'admin';
  const puedeEditar = ['admin', 'operador'].includes(usuario?.rol);

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, esAdmin, puedeEditar }}>
      {children}
    </AuthContext.Provider>
  );
};
