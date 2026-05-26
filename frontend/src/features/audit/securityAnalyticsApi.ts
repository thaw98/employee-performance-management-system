import { baseApi } from '../../app/baseApi';

export interface SecuritySummary {
  criticalAlerts: number;
  highRiskEvents: number;
  failedLogins: number;
  unauthorizedAccess: number;
  sensitiveExports: number;
  kpiChangesAfterFinal: number;
  roleChanges: number;
  suspiciousIps: number;
}

export interface SecurityAlert {
  id: number;
  timestamp: string;
  alertType: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  userName: string;
  userRole: string;
  ipAddress: string;
  module: string;
  affectedEmployeeName: string | null;
  description: string;
  status: 'New' | 'Reviewed' | 'False Positive' | 'Resolved';
  recommendedAction: string;
}

export interface SecurityEvent {
  id: number;
  timestamp: string;
  userName: string;
  userRole: string;
  ipAddress: string;
  userAgent: string;
  module: string;
  assetType: string;
  affectedEmployeeName: string | null;
  action: string;
  description: string;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  oldValue: string | null;
  newValue: string | null;
  detectionRule: string | null;
}

export interface SecurityRule {
  id: number;
  ruleName: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Inactive';
  lastTriggered: string | null;
  triggerCount: number;
}

export interface SecurityTrend {
  date: string;
  count: number;
  severity: string;
}

export const securityAnalyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSecuritySummary: builder.query<SecuritySummary, void>({
      query: () => '/audit/security/summary',
      transformResponse: (response: { success: boolean; data: SecuritySummary }) => response.data,
    }),
    getSecurityAlerts: builder.query<SecurityAlert[], void>({
      query: () => '/audit/security/alerts',
      transformResponse: (response: { success: boolean; data: SecurityAlert[] }) => response.data,
    }),
    getSecurityEvents: builder.query<SecurityEvent[], void>({
      query: () => '/audit/security/events',
      transformResponse: (response: { success: boolean; data: SecurityEvent[] }) => response.data,
    }),
    getSecurityRules: builder.query<SecurityRule[], void>({
      query: () => '/audit/security/rules',
      transformResponse: (response: { success: boolean; data: SecurityRule[] }) => response.data,
    }),
    getSecurityTrends: builder.query<SecurityTrend[], void>({
      query: () => '/audit/security/trends',
      transformResponse: (response: { success: boolean; data: SecurityTrend[] }) => response.data,
    }),
  }),
});

export const {
  useGetSecuritySummaryQuery,
  useGetSecurityAlertsQuery,
  useGetSecurityEventsQuery,
  useGetSecurityRulesQuery,
  useGetSecurityTrendsQuery,
} = securityAnalyticsApi;
