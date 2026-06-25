import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const engineerAPI = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

engineerAPI.interceptors.request.use((config) => {
  try {
    const stored = JSON.parse(localStorage.getItem('engineerAuth'));
    if (stored?.token) config.headers.Authorization = `Bearer ${stored.token}`;
  } catch (_) {}
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

engineerAPI.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('engineerAuth');
    }
    return Promise.reject(err);
  }
);

export default engineerAPI;
