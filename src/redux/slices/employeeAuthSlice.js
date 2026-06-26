import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const employeeLogin = createAsyncThunk('employeeAuth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await axios.post('/api/employee/auth/login', credentials);
    const { token, employee } = data.data;
    localStorage.setItem('employeeToken', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return { token, employee };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const employeeLogout = createAsyncThunk('employeeAuth/logout', async () => {
  localStorage.removeItem('employeeToken');
  delete axios.defaults.headers.common['Authorization'];
});

const storedToken = localStorage.getItem('employeeToken');
if (storedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
}

const employeeAuthSlice = createSlice({
  name: 'employeeAuth',
  initialState: {
    employee: null,
    token: storedToken || null,
    loading: false,
    error: null,
  },
  reducers: {
    setEmployee: (state, action) => { state.employee = action.payload; },
    clearEmployeeAuth: (state) => {
      state.employee = null;
      state.token = null;
      localStorage.removeItem('employeeToken');
      delete axios.defaults.headers.common['Authorization'];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(employeeLogin.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(employeeLogin.fulfilled, (s, a) => { s.loading = false; s.employee = a.payload.employee; s.token = a.payload.token; })
      .addCase(employeeLogin.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(employeeLogout.fulfilled, (s) => { s.employee = null; s.token = null; });
  },
});

export const { setEmployee, clearEmployeeAuth } = employeeAuthSlice.actions;
export default employeeAuthSlice.reducer;
