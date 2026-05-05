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
}

export const auditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getKpiAuditLogs: builder.query<AuditLog[], void>({
      query: () => '/audit-logs/kpi',
      transformResponse: (response: ApiResponse<AuditLog[]>) => response.data,
      providesTags: ['AuditLog'],
    }),
  }),
})

export const { useGetKpiAuditLogsQuery } = auditApi
