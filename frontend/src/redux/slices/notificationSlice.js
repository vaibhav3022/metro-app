import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notification',
  initialState: { list: [], unreadCount: 0, loading: false },
  reducers: {
    setNotifLoading: (state, action) => { state.loading = action.payload; },
    setNotifications: (state, action) => {
      state.list = action.payload;
      state.unreadCount = action.payload.filter(n => !n.isRead).length;
    },
    markAsRead: (state, action) => {
      const notif = state.list.find(n => n._id === action.payload);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    }
  }
});

export const { setNotifLoading, setNotifications, markAsRead } = notificationSlice.actions;
export default notificationSlice.reducer;
