import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const dealerAPI = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

dealerAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('dealerToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

dealerAPI.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dealerToken');
      localStorage.removeItem('dealer');
    }
    return Promise.reject(err);
  }
);

export default dealerAPI;
