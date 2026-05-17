// src/types/auth.ts
export type RoleGroup = 'HR' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  id: number;
  employeeId: string | null;
  name: string;
  email: string;
  role: string;
  roleId: number;
  mustChangePassword?: boolean;
  profilePictureUrl?: string;
}

export interface LoginResponseData {
  token: string;
  tokenType: string;
  expiresAt: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}