import { configureStore } from '@reduxjs/toolkit'

import { baseApi } from './baseApi'

import { authSlice } from '../features/auth/authSlice'
import { loadPersistedAuth } from '../features/auth/authStorage'

export function createAppStore() {
  const persisted = loadPersistedAuth()

  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
    preloadedState: persisted
      ? {
          auth: {
            token: persisted.token,
            user: persisted.user,
            isAuthenticated: true,
          },
        }
      : undefined,
  })
}

export type AppStore = ReturnType<typeof createAppStore>
export type RootState = ReturnType<ReturnType<typeof createAppStore>['getState']>
export type AppDispatch = ReturnType<typeof createAppStore>['dispatch']
