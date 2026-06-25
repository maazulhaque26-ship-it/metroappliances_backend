import axios from 'axios';

// Dev: VITE_API_URL=http://localhost:5001/api  |  Prod: https://metroappliances-backend.onrender.com/api
// baseURL already ends in /api so route paths must NOT repeat /api
const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(err);
  }
);

export default API;