import { baseApi } from '../../app/baseApi'
import type { ApiResponse } from '../../types/auth'

export interface MovementHistoryItem {
  id: number
  employeeId: number
  movementType: 'INITIAL' | 'TEMPORARY' | 'PERMANENT_TRANSFER' | 'RETURN'
  fromDepartmentId: number | null
  fromDepartmentName: string | null
  toDepartmentId: number
  toDepartmentName: string
  fromPositionId: number | null
  fromPositionName: string | null
  toPositionId: number
  toPositionName: string
  effectiveStartDate: string
  effectiveEndDate: string | null
  isCurrent: boolean
  reason: string | null
  remarks: string | null
}

export interface HomeDepartment {
  departmentId: number
  departmentName: string
  derivedFrom: string
}

export interface TemporaryTransferRequest {
  toDepartmentId: number
  toPositionId: number
  effectiveStartDate: string
  reason?: string
  remarks?: string
}

export interface ReturnRequest {
  toPositionId: number
  effectiveStartDate: string
  reason?: string
  remarks?: string
}

export interface PermanentTransferRequest {
  toDepartmentId: number
  toPositionId: number
  effectiveStartDate: string
  reason?: string
  remarks?: string
}

export interface ReportingHistoryItem {
  id: number
  employeeId: number
  managerEmployeeId: number
  managerName: string
  effectiveStartDate: string
  effectiveEndDate: string | null
  isCurrent: boolean
  reason: string | null
  remarks: string | null
}

export interface ReportingHistoryRequest {
  managerEmployeeId: number
  effectiveStartDate: string
  reason?: string
  remarks?: string
}

export const employeeMovementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMovementHistory: builder.query<ApiResponse<MovementHistoryItem[]>, number>({
      query: (employeeId) => `/employees/${employeeId}/movements`,
      providesTags: (_r, _e, id) => [{ type: 'Employee', id }, 'EmployeeMovement'],
    }),
    getCurrentMovement: builder.query<ApiResponse<MovementHistoryItem | null>, number>({
      query: (employeeId) => `/employees/${employeeId}/movements/current`,
      providesTags: (_r, _e, id) => [{ type: 'Employee', id }],
    }),
    getHomeDepartment: builder.query<ApiResponse<HomeDepartment>, number>({
      query: (employeeId) => `/employees/${employeeId}/home-department`,
      providesTags: (_r, _e, id) => [{ type: 'Employee', id }],
    }),
    temporaryTransfer: builder.mutation<ApiResponse<MovementHistoryItem>, { employeeId: number; body: TemporaryTransferRequest }>({
      query: ({ employeeId, body }) => ({
        url: `/employees/${employeeId}/movements/temporary-transfer`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { employeeId }) => ['Employee', 'EmployeeMovement', { type: 'Employee', id: employeeId }],
    }),
    returnFromTemporary: builder.mutation<ApiResponse<MovementHistoryItem>, { employeeId: number; body: ReturnRequest }>({
      query: ({ employeeId, body }) => ({
        url: `/employees/${employeeId}/movements/return`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { employeeId }) => ['Employee', 'EmployeeMovement', { type: 'Employee', id: employeeId }],
    }),
    permanentTransfer: builder.mutation<ApiResponse<MovementHistoryItem>, { employeeId: number; body: PermanentTransferRequest }>({
      query: ({ employeeId, body }) => ({
        url: `/employees/${employeeId}/movements/permanent-transfer`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { employeeId }) => ['Employee', 'EmployeeMovement', { type: 'Employee', id: employeeId }],
    }),
    getReportingHistory: builder.query<ApiResponse<ReportingHistoryItem[]>, number>({
      query: (employeeId) => `/employees/${employeeId}/reporting-history`,
      providesTags: (_r, _e, id) => [{ type: 'Employee', id }],
    }),
    assignManager: builder.mutation<ApiResponse<ReportingHistoryItem>, { employeeId: number; body: ReportingHistoryRequest }>({
      query: ({ employeeId, body }) => ({
        url: `/employees/${employeeId}/reporting-history`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { employeeId }) => ['Employee', { type: 'Employee', id: employeeId }],
    }),
  }),
})

export const {
  useGetMovementHistoryQuery,
  useGetCurrentMovementQuery,
  useGetHomeDepartmentQuery,
  useTemporaryTransferMutation,
  useReturnFromTemporaryMutation,
  usePermanentTransferMutation,
  useGetReportingHistoryQuery,
  useAssignManagerMutation,
} = employeeMovementApi
