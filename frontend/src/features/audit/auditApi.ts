import { baseApi } from '../../app/baseApi'
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface AuditLog {
  id: number
  actionType: string
  targetType: string
  targetId: number
  performedByUserId: number
  performedByUserName: string
  description: string
  metadataJson: string
  beforeData: string
  afterData: string
  createdAt: string
  employeeDbId?: number | null
  employeeId?: string | null
  employeeName?: string | null
  formTitle?: string | null
  formStatus?: string | null
  cycleId?: number | null
  cycleName?: string | null
  templateTitle?: string | null
}

export const auditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getKpiAuditLogs: builder.query<AuditLog[], void>({
      query: () => '/audit-logs/kpi',
      transformResponse: (response: ApiResponse<AuditLog[]>) => response.data,
      providesTags: ['AuditLog'],
    }),
    getSelfAssessmentAuditLogs: builder.query<AuditLog[], void>({
      query: () => '/audit-logs/self-assessment',
      transformResponse: (response: ApiResponse<AuditLog[]>) => response.data,
      providesTags: ['AuditLog'],
    }),
  }),
})

export const { useGetKpiAuditLogsQuery, useGetSelfAssessmentAuditLogsQuery } = auditApi
