import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const technicianAPI = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

technicianAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('technicianToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

technicianAPI.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('technicianToken');
      localStorage.removeItem('technicianUser');
    }
    return Promise.reject(err);
  }
);

export default technicianAPI;
