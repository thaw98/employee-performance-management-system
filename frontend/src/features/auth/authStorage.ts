import type { AuthUser } from './types'

const TOKEN_KEY = 'epms_token'
const USER_KEY = 'epms_user'

export function loadPersistedAuth(): { token: string; user: AuthUser } | null {
  const token =
    localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
  const userJson =
    localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY)
  if (!token || !userJson) {
    return null
  }
  try {
    const user = JSON.parse(userJson) as AuthUser
    return { token, user }
  } catch {
    return null
  }
}

export function persistAuth(rememberMe: boolean, token: string, user: AuthUser) {
  const primary = rememberMe ? localStorage : sessionStorage
  const secondary = rememberMe ? sessionStorage : localStorage
  secondary.removeItem(TOKEN_KEY)
  secondary.removeItem(USER_KEY)
  primary.setItem(TOKEN_KEY, token)
  primary.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}
