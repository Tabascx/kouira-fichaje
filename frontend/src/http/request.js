import axios from 'axios';

// Generic axios wrapper with sensible defaults: timeout, retries, centralized headers
const DEFAULT_TIMEOUT = 10000; // 10s
const DEFAULT_RETRIES = 2;

function createInstance({ baseURL, timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES } = {}) {
  const instance = axios.create({ baseURL, timeout });

  // Request interceptor: attach token
  instance.interceptors.request.use((config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) config.headers = { ...config.headers, Authorization: 'Bearer ' + token };
    } catch (e) {
      // ignore
    }
    return config;
  });

  // Response interceptor: global handling (unauthorized -> logout)
  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const status = error.response?.status;
      const url = error.config?.url || '';
      const isLogin = url.includes('/auth/login');

      if ((status === 401 || status === 403) && !isLogin) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        // Redirect to login page
        window.location.href = '/';
        return Promise.reject(error);
      }

      // Simple retry logic for network errors / 5xx
      const shouldRetry = !error.response || (error.response.status >= 500 && error.config && (error.config._retryCount || 0) < retries);
      if (shouldRetry && error.config) {
        error.config._retryCount = (error.config._retryCount || 0) + 1;
        return instance(error.config);
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

// Convenience wrappers
function buildDefaultApi() {
  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
  return createInstance({ baseURL });
}

const api = buildDefaultApi();

export { createInstance, buildDefaultApi };
export default api;
