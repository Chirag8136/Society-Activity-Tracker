import axios from 'axios';

// Determine the correct API base URL
// On deployed environments (like Render), ALWAYS use relative '/api' on the same origin.
// In local development on localhost:5173, use 'http://localhost:5000/api'.
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal) {
      // Deployed cloud environment (e.g. Render) -> use relative path
      return '/api';
    }
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

// Always attach Authorization token and x-society-id to every outgoing request
api.interceptors.request.use(
  (config) => {
    // Ensure baseURL is dynamically evaluated per request
    if (!config.baseURL || config.baseURL === 'http://localhost:5000/api') {
      config.baseURL = getBaseURL();
    }

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
