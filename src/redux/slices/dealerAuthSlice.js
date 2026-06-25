import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import dealerAPI from '../../services/dealerAPI';

// ── Helpers ───────────────────────────────────────────────────────────────────

const persist = (token, dealer) => {
  localStorage.setItem('dealerToken', token);
  localStorage.setItem('dealer', JSON.stringify(dealer));
};

const loadFromStorage = () => {
  try {
    return {
      token:  localStorage.getItem('dealerToken') || null,
      dealer: JSON.parse(localStorage.getItem('dealer') || 'null'),
    };
  } catch {
    return { token: null, dealer: null };
  }
};

// ── Thunks ────────────────────────────────────────────────────────────────────

export const dealerRegister = createAsyncThunk(
  'dealerAuth/register',
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await dealerAPI.post('/dealer/auth/register', formData);
      persist(data.token, data.dealer);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const dealerLogin = createAsyncThunk(
  'dealerAuth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await dealerAPI.post('/dealer/auth/login', { email, password });
      persist(data.token, data.dealer);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const fetchDealerMe = createAsyncThunk(
  'dealerAuth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await dealerAPI.get('/dealer/auth/me');
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const dealerLogout = createAsyncThunk(
  'dealerAuth/logout',
  async () => {
    try { await dealerAPI.post('/dealer/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('dealerToken');
    localStorage.removeItem('dealer');
  }
);

export const updateDealerProfile = createAsyncThunk(
  'dealerAuth/updateProfile',
  async (updates, { rejectWithValue }) => {
    try {
      const { data } = await dealerAPI.put('/dealer/auth/profile', updates);
      localStorage.setItem('dealer', JSON.stringify(data.dealer));
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Update failed');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const { token: storedToken, dealer: storedDealer } = loadFromStorage();

const dealerAuthSlice = createSlice({
  name: 'dealerAuth',
  initialState: {
    dealer:  storedDealer,
    token:   storedToken,
    loading: false,
    error:   null,
  },
  reducers: {
    clearDealerAuth(state) {
      state.dealer = null;
      state.token  = null;
      state.error  = null;
      localStorage.removeItem('dealerToken');
      localStorage.removeItem('dealer');
    },
    clearDealerError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const setLoading = (state) => { state.loading = true; state.error = null; };
    const setError   = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(dealerRegister.pending,  setLoading)
      .addCase(dealerRegister.fulfilled, (state, action) => {
        state.loading = false;
        state.token   = action.payload.token;
        state.dealer  = action.payload.dealer;
      })
      .addCase(dealerRegister.rejected, setError)

      .addCase(dealerLogin.pending,  setLoading)
      .addCase(dealerLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.token   = action.payload.token;
        state.dealer  = action.payload.dealer;
      })
      .addCase(dealerLogin.rejected, setError)

      .addCase(fetchDealerMe.pending,  setLoading)
      .addCase(fetchDealerMe.fulfilled, (state, action) => {
        state.loading = false;
        state.dealer  = action.payload.dealer;
      })
      .addCase(fetchDealerMe.rejected, (state) => { state.loading = false; })

      .addCase(dealerLogout.fulfilled, (state) => {
        state.dealer  = null;
        state.token   = null;
        state.loading = false;
        state.error   = null;
      })

      .addCase(updateDealerProfile.pending,  setLoading)
      .addCase(updateDealerProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.dealer  = action.payload.dealer;
      })
      .addCase(updateDealerProfile.rejected, setError);
  },
});

export const { clearDealerAuth, clearDealerError } = dealerAuthSlice.actions;
export default dealerAuthSlice.reducer;
