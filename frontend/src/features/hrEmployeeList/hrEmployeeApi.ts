import { baseApi } from '../../app/baseApi'
import type { ApiResponse } from '../../types/auth'

export interface EmployeeListItem {
  employeeId: number
  staffNo: string
  employeeName: string
  departmentName: string
  positionName: string
  profilePictureUrl: string
  email: string
  mustChangePassword: boolean | null
  hasUserAccount: boolean
  employmentStatus: 'Probation' | 'Permanent' | 'Resigned' | 'Terminated'
  employeeActiveStatus: 'ACTIVE' | 'RESIGNED' | 'TERMINATED'
}

export interface EmployeeListResponse {
  content: EmployeeListItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface EmployeeDetail {
  id: number
  employeeId: string
  employeeName: string
  email: string
  staffNrcNo: string
  gender: string
  religion: string
  departmentId: number
  departmentName: string
  positionId: number
  positionName: string
  managerId: number | null
  managerName: string | null
  staffTypeId: number
  staffTypeName: string
  dateOfJoining: string
  status: string
  profilePictureUrl: string
  fatherName?: string
  fatherNrcNo?: string
  fatherOccupation?: string
  emergencyPhone?: string
  emergencyRelation?: string
  probationMonth?: number
  probationEndDate?: string
}

export interface EmployeeUpdateRequest {
  employeeId: string
  employeeName: string
  email: string
  staffNrcNo?: string
  gender?: string
  religion?: string
  fatherName?: string
  fatherNrcNo?: string
  fatherOccupation?: string
  emergencyPhone?: string
  emergencyRelation?: string
  departmentId: number
  positionId: number
  managerId?: number | null
  dateOfJoining: string
  staffTypeId: number
  status: string
  profilePictureUrl?: string
}

export interface PasswordActionResponse {
  message: string
  employeeId: number
  email: string
  actionType: string
}

export interface GetEmployeesParams {
  page?: number
  size?: number
  search?: string
  departmentId?: number
  positionId?: number
  employmentStatus?: string
  sortBy?: string
  sortDir?: string
}

export const hrEmployeeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query<ApiResponse<EmployeeListResponse>, GetEmployeesParams>({
      query: (params) => ({
        url: '/hr/employees',
        params,
      }),
      providesTags: ['Employee'],
    }),
    getEmployeeById: builder.query<ApiResponse<EmployeeDetail>, number>({
      query: (id) => `/hr/employees/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Employee', id }],
    }),
    updateEmployee: builder.mutation<ApiResponse<void>, { id: number; body: EmployeeUpdateRequest }>({
      query: ({ id, body }) => ({
        url: `/hr/employees/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => ['Employee', { type: 'Employee', id }],
    }),
    resendPassword: builder.mutation<ApiResponse<PasswordActionResponse>, number>({
      query: (id) => ({
        url: `/hr/employees/${id}/resend-password`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Employee', id }],
    }),
    sendNewPassword: builder.mutation<ApiResponse<PasswordActionResponse>, number>({
      query: (id) => ({
        url: `/hr/employees/${id}/send-new-password`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Employee', id }],
    }),
    updateEmploymentStatus: builder.mutation<ApiResponse<void>, { id: number; status: string; probationEndDate?: string }>({
      query: ({ id, status, probationEndDate }) => ({
        url: `/hr/employees/${id}/employment-status`,
        method: 'PATCH',
        body: { status, probationEndDate },
      }),
      invalidatesTags: ['Employee'],
    }),
  }),
})

export const {
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useUpdateEmployeeMutation,
  useResendPasswordMutation,
  useSendNewPasswordMutation,
  useUpdateEmploymentStatusMutation,
} = hrEmployeeApi
