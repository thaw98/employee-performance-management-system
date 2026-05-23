import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  source: string;
  targetId?: number | null;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  wsConnected: boolean;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  wsConnected: false,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<NotificationItem>) => {
      state.notifications = [
        action.payload,
        ...state.notifications.filter((item) => item.id !== action.payload.id),
      ].slice(0, 20);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    setNotifications: (state, action: PayloadAction<NotificationItem[]>) => {
      state.notifications = action.payload;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    markAsRead: (state, action: PayloadAction<number>) => {
      const item = state.notifications.find((notification) => notification.id === action.payload);
      if (item && !item.read) {
        item.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach((notification) => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    setWsConnected: (state, action: PayloadAction<boolean>) => {
      state.wsConnected = action.payload;
    },
    resetNotifications: () => initialState,
  },
});

export const {
  addNotification,
  setNotifications,
  setUnreadCount,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  setWsConnected,
  resetNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;
