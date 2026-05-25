import type { AuthUser } from './types';

const TOKEN_KEY = 'epms_token';
const USER_KEY = 'epms_user';
const EXPIRES_AT_KEY = 'epms_expires_at';

// Helper to set a cookie
function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

// Helper to get a cookie
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// Helper to delete a cookie
function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

function safeStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key) ?? null;
  } catch (e) {
    // Likely blocked by tracking protection; fall back to cookie
    return getCookie(key);
  }
}

function safeStorageSet(key: string, value: string, rememberMe: boolean) {
  try {
    if (rememberMe) {
      localStorage.setItem(key, value);
    } else {
      sessionStorage.setItem(key, value);
    }
  } catch (e) {
    // Fallback to cookie when storage is blocked
    setCookie(key, value, rememberMe ? 30 : 0);
  }
}

function safeStorageRemove(key: string) {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch (e) {
    deleteCookie(key);
  }
}

export function loadPersistedAuth(): { token: string; user: AuthUser } | null {
  const token = safeStorageGet(TOKEN_KEY);
  const userJson = safeStorageGet(USER_KEY);
  if (!token || !userJson) {
    return null;
  }
  try {
    const user = JSON.parse(userJson) as AuthUser;
    return { token, user };
  } catch {
    return null;
  }
}

export function persistAuth(rememberMe: boolean, token: string, user: AuthUser) {
  safeStorageSet(TOKEN_KEY, token, rememberMe);
  safeStorageSet(USER_KEY, JSON.stringify(user), rememberMe);
  // Clear any stale expiry entry
  safeStorageRemove(EXPIRES_AT_KEY);
}

export function clearAuthStorage() {
  safeStorageRemove(TOKEN_KEY);
  safeStorageRemove(USER_KEY);
  safeStorageRemove(EXPIRES_AT_KEY);
}

/** Updates stored user JSON wherever the session token lives (after login or profile sync). */
export function updatePersistedUser(user: AuthUser) {
  const primary = safeStorageGet(TOKEN_KEY) ? (localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage) : null;
  if (primary) {
    primary.setItem(USER_KEY, JSON.stringify(user));
  }
}
