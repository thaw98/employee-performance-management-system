import { baseApi } from '../../app/baseApi'
import type { ApiResponse } from '../../types/auth'

export interface DepartmentOptionDto {
  /** Legacy compatibility fields used in some modals. */
  id: number
  name: string
  departmentId: number
  departmentName: string
}

export interface PositionOptionDto {
  /** department_position.id */
  id: number
  positionId: number
  positionName: string
  /** Legacy compatibility label fields used by transfer modals. */
  name: string
  positionCode: string
  levelCodeName?: string | null
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
  departmentPositionId: number
  profilePictureUrl?: string
}

export const hrEmployeeAccountApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query<ApiResponse<DepartmentOptionDto[]>, void>({
      query: () => ({ url: '/lookups/departments/active' }),
      transformResponse: (response: ApiResponse<{ id: number; name: string }[]>) => ({
        ...response,
        data: (response.data ?? []).map((d) => ({
          id: d.id,
          name: d.name,
          departmentId: d.id,
          departmentName: d.name,
        })),
      }),
    }),
    getDepartmentPositions: builder.query<ApiResponse<PositionOptionDto[]>, number>({
      query: (departmentId) => {
        if (typeof departmentId !== 'number') {
          console.error('Invalid departmentId type:', typeof departmentId, departmentId)
          throw new Error('departmentId must be a number')
        }
        return { url: `/lookups/departments/${departmentId}/positions` }
      },
      transformResponse: (response: ApiResponse<PositionOptionDto[]>) => ({
        ...response,
        data: (response.data ?? []).map((p) => ({
          ...p,
          name: p.positionName,
        })),
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
  useGetDepartmentPositionsQuery,
  useGetNextStaffNoQuery,
  useLazyCheckEmailQuery,
  useLazyCheckStaffNoQuery,
  useLazyCheckStaffNrcQuery,
  useCreateEmployeeAccountMutation,
  useResendTemporaryPasswordMutation,
} = hrEmployeeAccountApi
