import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import engineerAPI from '../../services/engineerAPI';

const persist = (token, engineer) => {
  localStorage.setItem('engineerAuth', JSON.stringify({ token, engineer }));
};

const loadFromStorage = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('engineerAuth') || 'null');
    return { token: stored?.token || null, engineer: stored?.engineer || null };
  } catch {
    return { token: null, engineer: null };
  }
};

export const engineerLogin = createAsyncThunk(
  'engineerAuth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await engineerAPI.post('/engineer/auth/login', { email, password });
      persist(data.data.token, data.data.engineer);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const fetchEngineerMe = createAsyncThunk(
  'engineerAuth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await engineerAPI.get('/engineer/auth/me');
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const engineerLogout = createAsyncThunk(
  'engineerAuth/logout',
  async () => {
    localStorage.removeItem('engineerAuth');
  }
);

const { token: storedToken, engineer: storedEngineer } = loadFromStorage();

const engineerAuthSlice = createSlice({
  name: 'engineerAuth',
  initialState: {
    engineer: storedEngineer,
    token:    storedToken,
    loading:  false,
    error:    null,
  },
  reducers: {
    clearEngineerAuth(state) {
      state.engineer = null;
      state.token    = null;
      state.error    = null;
      localStorage.removeItem('engineerAuth');
    },
    clearEngineerError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const setLoading = (state) => { state.loading = true; state.error = null; };
    const setError   = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(engineerLogin.pending,  setLoading)
      .addCase(engineerLogin.fulfilled, (state, action) => {
        state.loading  = false;
        state.token    = action.payload.token;
        state.engineer = action.payload.engineer;
      })
      .addCase(engineerLogin.rejected, setError)

      .addCase(fetchEngineerMe.pending,  setLoading)
      .addCase(fetchEngineerMe.fulfilled, (state, action) => {
        state.loading  = false;
        state.engineer = action.payload.data;
      })
      .addCase(fetchEngineerMe.rejected, (state) => { state.loading = false; })

      .addCase(engineerLogout.fulfilled, (state) => {
        state.engineer = null;
        state.token    = null;
        state.loading  = false;
        state.error    = null;
      });
  },
});

export const { clearEngineerAuth, clearEngineerError } = engineerAuthSlice.actions;
export default engineerAuthSlice.reducer;
