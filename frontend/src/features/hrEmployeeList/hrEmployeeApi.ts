import { baseApi } from '../../app/baseApi'
import type { ApiResponse } from '../../types/auth'

export interface EmployeeListItem {
  employeeId: number
  staffNo: string
  employeeName: string
  departmentName: string
  positionName: string
  /** Matches {@code staff_type.id} (1 = permanent, 2 = probation). */
  staffTypeId?: number
  staffTypeName?: string
  phoneNumber?: string
  profilePictureUrl: string
  email: string
  mustChangePassword: boolean | null
  hasUserAccount: boolean
  employmentStatus: 'Probation' | 'Permanent' | 'Resigned' | 'Terminated'
  employeeActiveStatus: 'ACTIVE' | 'RESIGNED' | 'TERMINATED'
  currentTransferType: 'INITIAL' | 'TEMPORARY' | 'PERMANENT_TRANSFER' | 'RETURN' | null
  hasKpis?: boolean
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
  dateOfBirth?: string
  phoneNo?: string
  address?: string
  race?: string
  departmentId: number
  departmentName: string
  departmentPositionId?: number
  positionId: number
  positionName: string
  managerId: number | null
  managerName: string | null
  staffTypeId: number
  staffTypeName: string
  dateOfJoining: string
  probationStartDate?: string
  probationEndDate?: string
  status: string
  profilePictureUrl: string
  fatherName?: string
  fatherNrcNo?: string
  fatherOccupation?: string
  emergencyPhone?: string
  emergencyRelation?: string
  probationDays?: number
  /** Single | Married */
  maritalStatus?: string
  spouseId?: number | null
  spouseName?: string | null
  spouseNrc?: string | null
}

export interface EmployeeUpdateRequest {
  employeeId: string
  employeeName: string
  email: string
  staffNrcNo?: string
  gender?: string
  religion?: string
  maritalStatus?: 'Single' | 'Married'
  spouseName?: string
  spouseNrc?: string
  fatherName?: string
  fatherNrcNo?: string
  fatherOccupation?: string
  emergencyPhone?: string
  emergencyRelation?: string
  departmentId: number
  departmentPositionId: number
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
  kpiStatus?: 'DEFINED' | 'NOT_DEFINED' | ''
  period?: string
}

export interface EmployeeViewDepartment {
  departmentId: number
  departmentName: string
}

export interface EmployeeViewPosition {
  positionId: number
  positionName: string
}

export interface EmployeeViewStaffType {
  staffTypeId: number
  staffTypeName: string
}

export interface EmployeeViewEmergencyContact {
  employeePhone: string
  relation: string
}

export interface EmployeeViewFather {
  fatherName: string
  fatherNrcNo: string
  fatherOccupation: string
}

export interface EmployeeViewSpouse {
  spouseId: number
  spouseName: string | null
  spouseNrc: string | null
}

export interface ProbationInfo {
  hasProbationRecord: boolean
  probationStartDate: string | null
  probationEndDate: string | null
}

export interface EmployeeViewDetail {
  employeeId: number
  staffNo: string
  fullName: string
  email: string
  phoneNumber: string
  gender: string
  dateOfBirth: string
  hireDate: string
  status: string
  profilePictureUrl: string
  staffNrcNumber: string
  address: string
  race: string
  employmentStatus: string
  statusEffectiveFrom: string | null
  employmentStatusReason: string | null
  /** Single | Married */
  maritalStatus?: string | null
  department: EmployeeViewDepartment | null
  position: EmployeeViewPosition | null
  staffType: EmployeeViewStaffType | null
  emergencyContact: EmployeeViewEmergencyContact | null
  father: EmployeeViewFather | null
  spouse: EmployeeViewSpouse | null
  probationInfo: ProbationInfo | null
}

export interface UpdateEmploymentStatusRequest {
  targetStatus: string
  transitionMode?: string
  effectiveDate?: string
  reason?: string
}

export interface EmploymentStatusHistoryItem {
  id: number
  employeeId: number
  previousStatus: string | null
  newStatus: string
  effectiveDate: string
  changedByUserId: number | null
  changedAt: string
  reason: string | null
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
    getEmployeesKpiStatus: builder.query<ApiResponse<EmployeeListResponse>, GetEmployeesParams>({
      query: (params) => ({
        url: '/hr/employees/kpi-status',
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
    updateEmploymentStatus: builder.mutation<ApiResponse<void>, { id: number; body: UpdateEmploymentStatusRequest }>({
      query: ({ id, body }) => ({
        url: `/hr/employees/${id}/employment-status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Employee'],
    }),
    getEmploymentStatusHistory: builder.query<ApiResponse<EmploymentStatusHistoryItem[]>, number>({
      query: (id) => `/hr/employees/${id}/employment-status-history`,
      providesTags: (_result, _error, id) => [{ type: 'Employee', id }],
    }),
    exportEmployees: builder.mutation<Blob, void>({
      query: () => ({
        url: '/employees/export',
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
    }),
    getEmployeeViewById: builder.query<ApiResponse<EmployeeViewDetail>, number>({
      query: (id) => `/hr/employees/${id}/view`,
      providesTags: (_result, _error, id) => [{ type: 'Employee', id }],
    }),
  }),
})

export const {
  useGetEmployeesQuery,
  useGetEmployeesKpiStatusQuery,
  useGetEmployeeByIdQuery,
  useUpdateEmployeeMutation,
  useResendPasswordMutation,
  useSendNewPasswordMutation,
  useUpdateEmploymentStatusMutation,
  useGetEmploymentStatusHistoryQuery,
  useExportEmployeesMutation,
  useLazyGetEmployeeViewByIdQuery,
} = hrEmployeeApi
