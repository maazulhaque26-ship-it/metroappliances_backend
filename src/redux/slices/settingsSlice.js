import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

// Single shared fetch for store settings — previously App.jsx and Footer.jsx
// each fetched /settings independently on every mount, doubling the request
// and refiring it on every navigation (Footer remounted per route). Redux
// caches it app-wide for the session; sockets/admin updates can still
// dispatch settingsUpdated if real-time sync is ever needed.
export const fetchSettings = createAsyncThunk(
  'settings/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get('/settings');
      return res.data.settings;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState: { data: null, loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending,   (s) => { s.loading = true; })
      .addCase(fetchSettings.fulfilled, (s, a) => { s.loading = false; s.data = a.payload; })
      .addCase(fetchSettings.rejected,  (s) => { s.loading = false; });
  },
});

export default settingsSlice.reducer;
