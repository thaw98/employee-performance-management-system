import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import type { AuthUser } from './types'

import { clearAuthStorage } from './authStorage'

export interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: AuthUser }>,
    ) => {
      state.token = action.payload.token
      state.user = action.payload.user
      state.isAuthenticated = true
    },
    logout: (state) => {
      state.token = null
      state.user = null
      state.isAuthenticated = false
      clearAuthStorage()
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
