import axios from 'axios';

const supplierAPI = axios.create({ baseURL: '/api' });

supplierAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('supplierToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

supplierAPI.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('supplierToken');
      localStorage.removeItem('supplierUser');
      window.location.href = '/supplier/login';
    }
    return Promise.reject(err);
  }
);

export default supplierAPI;
