import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import agentAPI from '../../services/agentAPI';

const persist = (token, agent) => {
  localStorage.setItem('agentToken', token);
  localStorage.setItem('agent', JSON.stringify(agent));
};

const loadFromStorage = () => {
  try {
    return {
      token: localStorage.getItem('agentToken') || null,
      agent: JSON.parse(localStorage.getItem('agent') || 'null'),
    };
  } catch {
    return { token: null, agent: null };
  }
};

export const agentLogin = createAsyncThunk(
  'agentAuth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await agentAPI.post('/agent/auth/login', { email, password });
      persist(data.token, data.agent);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const fetchAgentMe = createAsyncThunk(
  'agentAuth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await agentAPI.get('/agent/auth/me');
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const agentLogout = createAsyncThunk(
  'agentAuth/logout',
  async () => {
    try { await agentAPI.post('/agent/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('agentToken');
    localStorage.removeItem('agent');
  }
);

export const updateAgentProfile = createAsyncThunk(
  'agentAuth/updateProfile',
  async (updates, { rejectWithValue }) => {
    try {
      const { data } = await agentAPI.put('/agent/auth/profile', updates);
      localStorage.setItem('agent', JSON.stringify(data.agent));
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Update failed');
    }
  }
);

const { token: storedToken, agent: storedAgent } = loadFromStorage();

const agentAuthSlice = createSlice({
  name: 'agentAuth',
  initialState: {
    agent:   storedAgent,
    token:   storedToken,
    loading: false,
    error:   null,
  },
  reducers: {
    clearAgentAuth(state) {
      state.agent = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('agentToken');
      localStorage.removeItem('agent');
    },
    clearAgentError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const setLoading = (state) => { state.loading = true; state.error = null; };
    const setError   = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(agentLogin.pending,  setLoading)
      .addCase(agentLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.token   = action.payload.token;
        state.agent   = action.payload.agent;
      })
      .addCase(agentLogin.rejected, setError)

      .addCase(fetchAgentMe.pending,  setLoading)
      .addCase(fetchAgentMe.fulfilled, (state, action) => {
        state.loading = false;
        state.agent   = action.payload.agent;
      })
      .addCase(fetchAgentMe.rejected, (state) => { state.loading = false; })

      .addCase(agentLogout.fulfilled, (state) => {
        state.agent   = null;
        state.token   = null;
        state.loading = false;
        state.error   = null;
      })

      .addCase(updateAgentProfile.pending,  setLoading)
      .addCase(updateAgentProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.agent   = action.payload.agent;
      })
      .addCase(updateAgentProfile.rejected, setError);
  },
});

export const { clearAgentAuth, clearAgentError } = agentAuthSlice.actions;
export default agentAuthSlice.reducer;
