import axios from 'axios';

// Todas las peticiones al backend van por aquí
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
const api = axios.create({
  baseURL,
});

// Interceptor: añade el token JWT automáticamente a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: si el token expira (401/403), cierra sesión automáticamente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const esLogin = url.includes('/auth/login');

    if ((status === 401 || status === 403) && !esLogin) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
