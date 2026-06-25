/**
 * authSlice.js — Professional Audit Fix
 *
 * BUGS FIXED:
 * 1. clearAuth now exported (was missing from original — caused
 *    Navbar logout to fail silently)
 * 2. logout.pending no longer sets loading=true (caused brief
 *    spinner flash before redirect)
 * 3. Added setUser action for profile updates without full re-auth
 * 4. Safe JSON.parse with IIFE — prevents startup crash on corrupted storage
 * 5. All thunks already had rejectWithValue — verified and kept correct
 *
 * PERFORMANCE:
 * - Removed redundant localStorage writes in logout thunk
 *   (clearAuth already handles this synchronously)
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

// Safe reads — crash-proof even if localStorage has corrupted JSON
const storedToken = localStorage.getItem('token') || null;
const storedUser  = (() => {
  try { return JSON.parse(localStorage.getItem('user')) || null; }
  catch { localStorage.removeItem('user'); return null; }
})();

// ── Thunks ────────────────────────────────────────────────────────

export const register = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const res = await API.post('/auth/register', data);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (data, { rejectWithValue }) => {
    try {
      const res = await API.post('/auth/login', data);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Login failed. Please try again.'
      );
    }
  }
);

// Fire-and-forget — UI redirect happens via clearAuth (sync) first
export const logout = createAsyncThunk('auth/logout', async () => {
  try { await API.post('/auth/logout'); } catch { /* ignore */ }
  // clearAuth already wiped localStorage — no need to repeat here
});

export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get('/auth/me');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      const res = await API.put('/auth/profile', data);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Profile update failed.'
      );
    }
  }
);

// ── Helpers ───────────────────────────────────────────────────────

// Called by register.fulfilled and login.fulfilled
const persistAuth = (state, { payload }) => {
  state.loading = false;
  state.error   = null;
  state.user    = payload.user;
  state.token   = payload.token;
  localStorage.setItem('token', payload.token);
  localStorage.setItem('user',  JSON.stringify(payload.user));
};

const resetState = (state) => {
  state.user    = null;
  state.token   = null;
  state.loading = false;
  state.error   = null;
};

// ── Slice ─────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:    storedUser,
    token:   storedToken,
    loading: false,
    error:   null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },

    // SYNC instant logout — dispatched by Navbar BEFORE async logout()
    // Wipes Redux state + localStorage in one tick → no blank screen
    clearAuth: (state) => {
      resetState(state);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },

    // Manual user state update (e.g. after address save)
    setUser: (state, { payload }) => {
      state.user = payload;
      localStorage.setItem('user', JSON.stringify(payload));
    },
  },
  extraReducers: (builder) => {
    builder
      // ── register ──
      .addCase(register.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(register.fulfilled, persistAuth)
      .addCase(register.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      // ── login ──
      .addCase(login.pending,      (s) => { s.loading = true; s.error = null; })
      .addCase(login.fulfilled,    persistAuth)
      .addCase(login.rejected,     (s, a) => { s.loading = false; s.error = a.payload; })

      // ── logout (async — clearAuth handles instant UI) ──
      // FIX: removed loading=true on pending — prevents spinner flash
      .addCase(logout.fulfilled,   resetState)
      .addCase(logout.rejected,    resetState)

      // ── fetchMe ──
      .addCase(fetchMe.fulfilled,  (s, a) => {
        s.user = a.payload.user;
        localStorage.setItem('user', JSON.stringify(a.payload.user));
      })
      .addCase(fetchMe.rejected, (s) => {
        // Token invalid/expired — clear silently, no error shown
        resetState(s);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      })

      // ── updateProfile ──
      .addCase(updateProfile.pending,   (s) => { s.loading = true; })
      .addCase(updateProfile.fulfilled, (s, a) => {
        s.loading = false;
        s.user    = a.payload.user;
        localStorage.setItem('user', JSON.stringify(a.payload.user));
      })
      .addCase(updateProfile.rejected, (s, a) => {
        s.loading = false;
        s.error   = a.payload;
      });
  },
});

export const changePassword = (data) => API.put('/auth/password', data); // direct API call helper

export const { clearError, clearAuth, setUser } = authSlice.actions;
export default authSlice.reducer;