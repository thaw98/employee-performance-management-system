// src/features/auth/authSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const TOKEN_KEY = 'epms_token';
const USER_KEY = 'epms_user';

// Load from storage
const loadToken = (): string | null => {
  // Keep a fallback to sessionStorage for users logged in before this fix.
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
};

const loadUser = (): User | null => {
  const userJson = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as User;
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  user: loadUser(),
  token: loadToken(),
  isAuthenticated: !!loadToken(),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: User; rememberMe?: boolean }>
    ) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;

      // Always persist auth in localStorage so sessions survive new tabs/reopen.
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      // Clean up legacy session copy to avoid split-session behavior.
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
        storage.setItem(USER_KEY, JSON.stringify(state.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    },
  },
});

export const { setCredentials, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;