import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to every outgoing request if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cloudvault_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept 401 Unauthorized responses to clear stale sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Avoid looping if the failing request is /api/auth/login or /api/auth/register
      const isAuthUrl = error.config.url?.includes('/api/auth/login') || error.config.url?.includes('/api/auth/register');
      if (!isAuthUrl) {
        localStorage.removeItem('cloudvault_token');
        localStorage.removeItem('cloudvault_user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
