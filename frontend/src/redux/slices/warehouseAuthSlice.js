import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import warehouseAPI from '../../services/warehouseAPI';

const persist = (token, warehouseUser) => {
  localStorage.setItem('warehouseToken',     token);
  localStorage.setItem('warehouseUser', JSON.stringify(warehouseUser));
};

const loadFromStorage = () => {
  try {
    return {
      token:         localStorage.getItem('warehouseToken') || null,
      warehouseUser: JSON.parse(localStorage.getItem('warehouseUser') || 'null'),
    };
  } catch {
    return { token: null, warehouseUser: null };
  }
};

export const warehouseLogin = createAsyncThunk(
  'warehouseAuth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await warehouseAPI.post('/warehouse/auth/login', { email, password });
      persist(data.token, data.user);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const fetchWarehouseMe = createAsyncThunk(
  'warehouseAuth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await warehouseAPI.get('/warehouse/auth/me');
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const warehouseLogout = createAsyncThunk(
  'warehouseAuth/logout',
  async () => {
    try { await warehouseAPI.post('/warehouse/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('warehouseToken');
    localStorage.removeItem('warehouseUser');
  }
);

const { token: storedToken, warehouseUser: storedUser } = loadFromStorage();

const warehouseAuthSlice = createSlice({
  name: 'warehouseAuth',
  initialState: {
    warehouseUser: storedUser,
    token:         storedToken,
    loading:       false,
    error:         null,
  },
  reducers: {
    clearWarehouseAuth(state) {
      state.warehouseUser = null;
      state.token         = null;
      state.error         = null;
      localStorage.removeItem('warehouseToken');
      localStorage.removeItem('warehouseUser');
    },
    clearWarehouseError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const setLoading = (state) => { state.loading = true; state.error = null; };
    const setError   = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(warehouseLogin.pending,  setLoading)
      .addCase(warehouseLogin.fulfilled, (state, action) => {
        state.loading       = false;
        state.token         = action.payload.token;
        state.warehouseUser = action.payload.user;
      })
      .addCase(warehouseLogin.rejected, setError)

      .addCase(fetchWarehouseMe.pending,  setLoading)
      .addCase(fetchWarehouseMe.fulfilled, (state, action) => {
        state.loading       = false;
        state.warehouseUser = action.payload.user;
      })
      .addCase(fetchWarehouseMe.rejected, (state) => { state.loading = false; })

      .addCase(warehouseLogout.fulfilled, (state) => {
        state.warehouseUser = null;
        state.token         = null;
        state.loading       = false;
        state.error         = null;
      });
  },
});

export const { clearWarehouseAuth, clearWarehouseError } = warehouseAuthSlice.actions;
export default warehouseAuthSlice.reducer;
