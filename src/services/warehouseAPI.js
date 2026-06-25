import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const warehouseAPI = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

warehouseAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('warehouseToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

warehouseAPI.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('warehouseToken');
      localStorage.removeItem('warehouseUser');
    }
    return Promise.reject(err);
  }
);

export default warehouseAPI;
