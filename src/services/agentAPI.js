import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const agentAPI = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

agentAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('agentToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

agentAPI.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('agentToken');
      localStorage.removeItem('agent');
    }
    return Promise.reject(err);
  }
);

export default agentAPI;
