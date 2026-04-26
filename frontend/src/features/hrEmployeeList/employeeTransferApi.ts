import { baseApi } from '../../app/baseApi'
import type { ApiResponse } from '../../types/auth'

export interface TransferHistoryItem {
  id: number
  employeeId: number
  transferType: 'INITIAL' | 'TEMPORARY' | 'PERMANENT_TRANSFER' | 'RETURN'
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
  effectiveEndDate: string
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

export interface MakePermanentRequest {
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

export const employeeTransferApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTransferHistory: builder.query<ApiResponse<TransferHistoryItem[]>, number>({
      query: (employeeId) => `/employees/${employeeId}/transfers`,
      providesTags: (_r, _e, id) => [{ type: 'Employee', id }, 'EmployeeTransfer'],
    }),
    getCurrentTransfer: builder.query<ApiResponse<TransferHistoryItem | null>, number>({
      query: (employeeId) => `/employees/${employeeId}/transfers/current`,
      providesTags: (_r, _e, id) => [{ type: 'Employee', id }, 'EmployeeTransfer'],
    }),
    getHomeDepartment: builder.query<ApiResponse<HomeDepartment>, number>({
      query: (employeeId) => `/employees/${employeeId}/home-department`,
      providesTags: (_r, _e, id) => [{ type: 'Employee', id }],
    }),
    temporaryTransfer: builder.mutation<ApiResponse<TransferHistoryItem>, { employeeId: number; body: TemporaryTransferRequest }>({
      query: ({ employeeId, body }) => ({
        url: `/employees/${employeeId}/transfers/temporary`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { employeeId }) => ['Employee', 'EmployeeTransfer', { type: 'Employee', id: employeeId }],
    }),
    returnFromTemporary: builder.mutation<ApiResponse<TransferHistoryItem>, { employeeId: number; body: ReturnRequest }>({
      query: ({ employeeId, body }) => ({
        url: `/employees/${employeeId}/transfers/return`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { employeeId }) => ['Employee', 'EmployeeTransfer', { type: 'Employee', id: employeeId }],
    }),
    permanentTransfer: builder.mutation<ApiResponse<TransferHistoryItem>, { employeeId: number; body: PermanentTransferRequest }>({
      query: ({ employeeId, body }) => ({
        url: `/employees/${employeeId}/transfers/permanent`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { employeeId }) => ['Employee', 'EmployeeTransfer', { type: 'Employee', id: employeeId }],
    }),
    makePermanent: builder.mutation<ApiResponse<TransferHistoryItem>, { employeeId: number; body: MakePermanentRequest }>({
      query: ({ employeeId, body }) => ({
        url: `/employees/${employeeId}/transfers/make-permanent`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { employeeId }) => ['Employee', 'EmployeeTransfer', { type: 'Employee', id: employeeId }],
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
  useGetTransferHistoryQuery,
  useGetCurrentTransferQuery,
  useGetHomeDepartmentQuery,
  useTemporaryTransferMutation,
  useReturnFromTemporaryMutation,
  usePermanentTransferMutation,
  useMakePermanentMutation,
  useGetReportingHistoryQuery,
  useAssignManagerMutation,
} = employeeTransferApi
