// src/app/store.ts
import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { baseApi } from './baseApi';
import authReducer, { logout } from '../features/auth/authSlice';
import notificationReducer from '../features/notification/notificationSlice';
import permissionReducer from '../features/permission/permissionSlice';

const logoutListener = createListenerMiddleware();

logoutListener.startListening({
  matcher: isAnyOf(logout),
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(baseApi.util.resetApiState());
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notification: notificationReducer,
    permission: permissionReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(logoutListener.middleware)
      .concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
