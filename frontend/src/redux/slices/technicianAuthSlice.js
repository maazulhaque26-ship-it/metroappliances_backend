import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import technicianAPI from '../../services/technicianAPI';

const persist = (token, technician) => {
  localStorage.setItem('technicianToken', token);
  localStorage.setItem('technicianUser', JSON.stringify(technician));
};

const loadFromStorage = () => {
  try {
    return {
      token:      localStorage.getItem('technicianToken') || null,
      technician: JSON.parse(localStorage.getItem('technicianUser') || 'null'),
    };
  } catch {
    return { token: null, technician: null };
  }
};

export const technicianLogin = createAsyncThunk(
  'technicianAuth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await technicianAPI.post('/technician/auth/login', { email, password });
      persist(data.token, data.technician);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const fetchTechnicianMe = createAsyncThunk(
  'technicianAuth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await technicianAPI.get('/technician/auth/me');
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const technicianLogout = createAsyncThunk(
  'technicianAuth/logout',
  async () => {
    localStorage.removeItem('technicianToken');
    localStorage.removeItem('technicianUser');
  }
);

const { token: storedToken, technician: storedTechnician } = loadFromStorage();

const technicianAuthSlice = createSlice({
  name: 'technicianAuth',
  initialState: {
    technician: storedTechnician,
    token:      storedToken,
    loading:    false,
    error:      null,
  },
  reducers: {
    clearTechnicianAuth(state) {
      state.technician = null;
      state.token      = null;
      state.error      = null;
      localStorage.removeItem('technicianToken');
      localStorage.removeItem('technicianUser');
    },
    clearTechnicianError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const setLoading = (state) => { state.loading = true; state.error = null; };
    const setError   = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(technicianLogin.pending,  setLoading)
      .addCase(technicianLogin.fulfilled, (state, action) => {
        state.loading    = false;
        state.token      = action.payload.token;
        state.technician = action.payload.technician;
      })
      .addCase(technicianLogin.rejected, setError)

      .addCase(fetchTechnicianMe.pending,  setLoading)
      .addCase(fetchTechnicianMe.fulfilled, (state, action) => {
        state.loading    = false;
        state.technician = action.payload.technician;
      })
      .addCase(fetchTechnicianMe.rejected, (state) => { state.loading = false; })

      .addCase(technicianLogout.fulfilled, (state) => {
        state.technician = null;
        state.token      = null;
        state.loading    = false;
        state.error      = null;
      });
  },
});

export const { clearTechnicianAuth, clearTechnicianError } = technicianAuthSlice.actions;
export default technicianAuthSlice.reducer;
