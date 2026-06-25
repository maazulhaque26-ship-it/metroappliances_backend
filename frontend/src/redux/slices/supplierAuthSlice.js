import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE = '/api';

export const supplierLogin = createAsyncThunk('supplierAuth/login', async (creds, { rejectWithValue }) => {
  try {
    const { data } = await axios.post(`${BASE}/supplier/auth/login`, creds);
    localStorage.setItem('supplierToken', data.data.token);
    localStorage.setItem('supplierUser',  JSON.stringify(data.data.user));
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Login failed'); }
});

export const fetchSupplierMe = createAsyncThunk('supplierAuth/me', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('supplierToken');
    const { data } = await axios.get(`${BASE}/supplier/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Session expired'); }
});

export const supplierLogout = createAsyncThunk('supplierAuth/logout', async () => {
  try {
    const token = localStorage.getItem('supplierToken');
    await axios.post(`${BASE}/supplier/auth/logout`, {}, { headers: { Authorization: `Bearer ${token}` } });
  } catch (_) {}
  localStorage.removeItem('supplierToken');
  localStorage.removeItem('supplierUser');
});

const supplierAuthSlice = createSlice({
  name: 'supplierAuth',
  initialState: {
    token:        localStorage.getItem('supplierToken') || null,
    supplierUser: (() => { try { return JSON.parse(localStorage.getItem('supplierUser')); } catch { return null; } })(),
    loading:      false,
    error:        null,
  },
  reducers: {
    clearSupplierAuth: (state) => {
      state.token = null; state.supplierUser = null;
      localStorage.removeItem('supplierToken'); localStorage.removeItem('supplierUser');
    },
    clearSupplierError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(supplierLogin.pending,    (s) => { s.loading = true; s.error = null; })
      .addCase(supplierLogin.fulfilled,  (s, a) => { s.loading = false; s.token = a.payload.token; s.supplierUser = a.payload.user; })
      .addCase(supplierLogin.rejected,   (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchSupplierMe.fulfilled,(s, a) => { s.supplierUser = a.payload; })
      .addCase(supplierLogout.fulfilled, (s)    => { s.token = null; s.supplierUser = null; });
  },
});

export const { clearSupplierAuth, clearSupplierError } = supplierAuthSlice.actions;
export default supplierAuthSlice.reducer;
