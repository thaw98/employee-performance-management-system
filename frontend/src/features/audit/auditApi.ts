// src/features/audit/auditApi.ts
import { baseApi } from '../../app/baseApi';

export interface AuditLog {
  auditId: number;
  actionType: string;
  targetType: string;
  targetId: number;
  performedByUserId: number;
  performedByUserName: string;
  description: string;
  metadataJson: any;
  beforeData: string | null;
  afterData: string | null;
  createdAt: string;
}

export interface AuditSummary {
  totalAudits: number;
  todayAudits: number;
  uniqueUsers: number;
  mostActiveAction: string;
}

export interface AuditFilter {
  page: number;
  size: number;
  actionType?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
  userId?: number;
}

export interface PaginatedAuditResponse {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const auditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<PaginatedAuditResponse, AuditFilter>({
      query: (filters) => {
        const params = new URLSearchParams();
        params.append('page', filters.page.toString());
        params.append('size', filters.size.toString());
        if (filters.actionType) params.append('actionType', filters.actionType);
        if (filters.targetType) params.append('targetType', filters.targetType);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.userId) params.append('userId', filters.userId.toString());
        return `/audit/logs?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: PaginatedAuditResponse }) => response.data,
      providesTags: ['AuditLog'],
    }),
    getAuditSummary: builder.query<AuditSummary, void>({
      query: () => '/audit/summary',
      transformResponse: (response: { success: boolean; data: AuditSummary }) => response.data,
      providesTags: ['AuditLog'],
    }),
    getActivityEvents: builder.query<AuditLog[], void>({
      query: () => '/audit/activity/events',
      transformResponse: (response: { success: boolean; data: AuditLog[] }) => response.data,
      providesTags: ['AuditLog'],
    }),
    getActivitySessions: builder.query<any[], void>({
      query: () => '/audit/activity/sessions',
      transformResponse: (response: { success: boolean; data: any[] }) => response.data,
    }),
    getActivityHealth: builder.query<any, void>({
      query: () => '/audit/activity/health',
      transformResponse: (response: { success: boolean; data: any }) => response.data,
    }),
    getActivitySecurityAlerts: builder.query<any[], void>({
      query: () => '/audit/activity/security-alerts',
      transformResponse: (response: { success: boolean; data: any[] }) => response.data,
    }),
    getActivityResources: builder.query<any[], void>({
      query: () => '/audit/activity/resources',
      transformResponse: (response: { success: boolean; data: any[] }) => response.data,
    }),
  }),
});

export const {
  useGetAuditLogsQuery,
  useGetAuditSummaryQuery,
  useGetActivityEventsQuery,
  useGetActivitySessionsQuery,
  useGetActivityHealthQuery,
  useGetActivitySecurityAlertsQuery,
  useGetActivityResourcesQuery
} = auditApi;