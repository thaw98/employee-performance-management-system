export interface AuthUser {
  id: number
  employeeId: string
  email: string
  role: string
  roleId: number
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
