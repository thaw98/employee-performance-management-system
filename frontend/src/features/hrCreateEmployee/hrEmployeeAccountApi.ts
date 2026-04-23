import { baseApi } from '../../app/baseApi'
import type { ApiResponse } from '../../types/auth'

export interface DepartmentOptionDto {
  departmentId: number
  departmentName: string
}

export interface PositionOptionDto {
  positionId: number
  positionName: string
}

export interface ExistsDto {
  exists: boolean
}

export interface NextStaffNoDto {
  nextStaffNo: string
}

export interface HrCreateEmployeeAccountResponse {
  employeeId: number
  staffNo: string
  userAccountId: number
  employeeName: string
  email: string
  roleId: number
  mustChangePassword: boolean
  message: string
}

export interface HrCreateEmployeeAccountRequest {
  staffNo: string
  employeeName: string
  gender: 'Male' | 'Female'
  email: string
  dateOfBirth: string
  phoneNo: string
  address: string
  religion: string
  nationality: string
  nrc: string
  fatherName: string
  fatherNrc?: string
  fatherOccupation: string
  emergencyPhone: string
  emergencyRelation: string
  staffType: 'PERMANENT' | 'PROBATION'
  probationStartDate?: string
  probationEndDate?: string
  hireDate: string
  departmentId: number
  positionId: number
  profilePictureUrl?: string
}

export const hrEmployeeAccountApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query<ApiResponse<DepartmentOptionDto[]>, void>({
      query: () => ({ url: '/departments' }),
    }),
    getPositions: builder.query<ApiResponse<PositionOptionDto[]>, number | void>({
      query: (departmentId) => ({
        url: '/positions',
        params: departmentId ? { departmentId } : undefined,
      }),
    }),
    getNextStaffNo: builder.query<ApiResponse<NextStaffNoDto>, void>({
      query: () => ({ url: '/hr/employees/next-staff-no' }),
    }),
    checkEmail: builder.query<ApiResponse<ExistsDto>, string>({
      query: (email) => ({ url: '/employees/check-email', params: { email } }),
    }),
    checkStaffNo: builder.query<ApiResponse<ExistsDto>, string>({
      query: (staffNo) => ({ url: '/employees/check-staff-no', params: { staffNo } }),
    }),
    checkStaffNrc: builder.query<ApiResponse<boolean>, string>({
      query: (staffNrcNo) => ({ url: '/employees/check-staff-nrc', params: { staffNrcNo } }),
    }),
    createEmployeeAccount: builder.mutation<ApiResponse<HrCreateEmployeeAccountResponse>, HrCreateEmployeeAccountRequest>({
      query: (body) => ({ url: '/hr/employees/create-account', method: 'POST', body }),
    }),
    resendTemporaryPassword: builder.mutation<ApiResponse<{ message: string }>, number>({
      query: (employeeId) => ({
        url: `/hr/employees/${employeeId}/resend-temporary-password`,
        method: 'POST',
      }),
    }),
  }),
})

export const {
  useGetDepartmentsQuery,
  useGetPositionsQuery,
  useGetNextStaffNoQuery,
  useLazyCheckEmailQuery,
  useLazyCheckStaffNoQuery,
  useLazyCheckStaffNrcQuery,
  useCreateEmployeeAccountMutation,
  useResendTemporaryPasswordMutation,
} = hrEmployeeAccountApi
