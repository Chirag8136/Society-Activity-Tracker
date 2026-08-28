import axios from 'axios';

// In production all-in-one deployment, default to relative '/api'
// In local dev, default to 'http://localhost:5000/api'
const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Always attach Authorization token and x-society-id to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sat_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const activeSocietyId = localStorage.getItem('sat_current_society');
    if (activeSocietyId) {
      config.headers['x-society-id'] = activeSocietyId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If token expired, clear and redirect to login
      localStorage.removeItem('sat_token');
      localStorage.removeItem('sat_user');
      localStorage.removeItem('sat_current_society');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
