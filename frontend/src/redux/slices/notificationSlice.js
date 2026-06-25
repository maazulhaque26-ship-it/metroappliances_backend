import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (page = 1) => {
    const { data } = await API.get(`/notifications?page=${page}`);
    return { ...data, page };
  }
);

export const markNotifRead = createAsyncThunk(
  'notifications/markRead',
  async (id) => {
    await API.put(`/notifications/${id}/read`);
    return id;
  }
);

export const markAllNotifRead = createAsyncThunk(
  'notifications/markAllRead',
  async () => {
    await API.put('/notifications/read-all');
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items:       [],
    unreadCount: 0,
    total:       0,
    page:        1,
    pages:       1,
    hasMore:     false,
    loading:     false,
  },
  reducers: {
    pushNotification(state, action) {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
      state.total += 1;
    },
    resetNotifications(state) {
      state.items       = [];
      state.unreadCount = 0;
      state.total       = 0;
      state.page        = 1;
      state.hasMore     = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchNotifications.pending,  (state) => { state.loading = true; })
      .addCase(fetchNotifications.fulfilled, (state, { payload }) => {
        state.loading     = false;
        state.total       = payload.total;
        state.page        = payload.page;
        state.pages       = payload.pages;
        state.hasMore     = payload.page < payload.pages;
        state.unreadCount = payload.unreadCount;
        if (payload.page === 1) {
          state.items = payload.notifications;
        } else {
          state.items = [...state.items, ...payload.notifications];
        }
      })
      .addCase(fetchNotifications.rejected, (state) => { state.loading = false; })
      .addCase(markNotifRead.fulfilled, (state, { payload: id }) => {
        const n = state.items.find(n => n._id === id);
        if (n && !n.isRead) { n.isRead = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
      })
      .addCase(markAllNotifRead.fulfilled, (state) => {
        state.items.forEach(n => { n.isRead = true; });
        state.unreadCount = 0;
      });
  },
});

export const { pushNotification, resetNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
