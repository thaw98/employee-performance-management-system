export interface AuthUser {
  id: number
  employeeId: string
  name: string
  email: string
  role: string
  roleId: number
  /** When true, user must change password before using the app (synced from backend). */
  mustChangePassword?: boolean
}

export interface LoginResponseData {
  token: string
  tokenType: string
  user: AuthUser
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
}

export interface LoginRequestBody {
  identifier: string
  password: string
}
