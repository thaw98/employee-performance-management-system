import { baseApi } from '../../app/baseApi'

export interface Kpi {
  id?: number
  employeeId: number
  employeeName?: string
  name: string
  category: string
  target: string
  unit: string
  actual?: string
  weight: number
  score?: number
  weightedScore?: number
  kpiTotalScore?: number
  period: string
  status: string
  recordStatus?: string
  createdDate?: string
  updatedDate?: string
}

export interface PositionKpi {
  id?: number
  departmentId: number
  positionId: number
  name: string
  category: string
  target: string
  unit: string
  weight: number
  actual?: string
  score?: number
  weightedScore?: number
  period: string
  status?: string
  recordStatus?: string
}

export interface DepartmentKpi {
  id?: number
  departmentId: number
  name: string
  category: string
  target: string
  unit: string
  actual?: string
  weight: number
  score?: number
  weightedScore?: number
  totalDepartmentScore?: number
  period: string
  status?: string
  recordStatus?: string
}

export interface PositionKpiStatus {
  departmentId: number
  departmentName: string
  positionId: number
  positionName: string
  hasKpis: boolean
}

export interface DepartmentKpiStatus {
  departmentId: number
  departmentName: string
  hasKpis: boolean
}

export interface KpiHistorySummary {
  employeeId: number;
  employeeName: string;
  staffNo?: string;
  managerName?: string;
  departmentName: string;
  positionName: string;
  totalKpis: number;
  period: string;
  createdDate: string;
  totalScore?: number;
}

export const kpiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getKpisByEmployee: builder.query<Kpi[], { employeeId: number; period: string }>({
      query: ({ employeeId, period }) => ({
        url: `/kpis/employee/${employeeId}`,
        params: { period },
      }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'KPI' as const, id })), { type: 'KPI', id: 'LIST' }]
          : [{ type: 'KPI', id: 'LIST' }],
    }),
    getLatestKpisByEmployee: builder.query<Kpi[], number>({
      query: (employeeId) => `/kpis/latest/${employeeId}`,
      providesTags: ['KPI'],
    }),
    getMyLatestKpis: builder.query<Kpi[], void>({
      query: () => '/kpis/me/latest',
      providesTags: ['KPI'],
    }),
    getLatestKpiDateByEmployee: builder.query<{ latestDate: string }, number>({
      query: (employeeId) => `/kpis/latest-date/${employeeId}`,
      providesTags: ['KPI'],
    }),
    getEmployeeKpiPeriods: builder.query<String[], number>({
      query: (employeeId) => `/kpis/periods/${employeeId}`,
      providesTags: ['KPI'],
    }),
    setupKpis: builder.mutation<Kpi[], Kpi[]>({
      query: (body) => ({
        url: '/kpis/setup',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'KPI', id: 'LIST' }],
    }),
    getPositionKpis: builder.query<PositionKpi[], { departmentId: number; positionId: number; period: string }>({
      query: (params) => ({
        url: '/kpis/position',
        params,
      }),
      providesTags: ['KPI'],
    }),
    setupPositionKpis: builder.mutation<PositionKpi[], PositionKpi[]>({
      query: (body) => ({
        url: '/kpis/position/setup',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['KPI'],
    }),
    getDepartmentKpis: builder.query<DepartmentKpi[], { departmentId: number; period: string }>({
      query: (params) => ({
        url: '/kpis/department',
        params,
      }),
      providesTags: ['KPI'],
    }),
    setupDepartmentKpis: builder.mutation<DepartmentKpi[], DepartmentKpi[]>({
      query: (body) => ({
        url: '/kpis/department/setup',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['KPI'],
    }),
    updateManagerKpiActuals: builder.mutation<Kpi[], { employeeId: number; kpis: Kpi[] }>({
      query: ({ employeeId, kpis }) => ({
        url: `/kpis/manager/employee/${employeeId}/actuals`,
        method: 'PUT',
        body: kpis,
      }),
      invalidatesTags: [{ type: 'KPI', id: 'LIST' }],
    }),
    updateHrKpiActuals: builder.mutation<Kpi[], { employeeId: number; kpis: Kpi[] }>({
      query: ({ employeeId, kpis }) => ({
        url: `/kpis/hr/employee/${employeeId}/actuals`,
        method: 'PUT',
        body: kpis,
      }),
      invalidatesTags: [{ type: 'KPI', id: 'LIST' }],
    }),
    updateDepartmentHrKpiActuals: builder.mutation<DepartmentKpi[], { departmentId: number; kpis: DepartmentKpi[] }>({
      query: ({ departmentId, kpis }) => ({
        url: `/kpis/hr/department/${departmentId}/actuals`,
        method: 'PUT',
        body: kpis,
      }),
      invalidatesTags: [{ type: 'KPI', id: 'LIST' }],
    }),
    updatePositionHrKpiActuals: builder.mutation<PositionKpi[], { departmentId: number; positionId: number; kpis: PositionKpi[] }>({
      query: ({ departmentId, positionId, kpis }) => ({
        url: `/kpis/hr/position/${departmentId}/${positionId}/actuals`,
        method: 'PUT',
        body: kpis,
      }),
      invalidatesTags: [{ type: 'KPI', id: 'LIST' }],
    }),
    getManagerTeam: builder.query<{ id: number; name: string; role: string; status: string }[], void>({
      query: () => '/kpis/manager/team',
      providesTags: ['KPI'],
    }),
    getPositionsKpiStatus: builder.query<PositionKpiStatus[], { departmentId?: number; period: string }>({
      query: (params) => ({
        url: '/kpis/positions/status',
        params,
      }),
      providesTags: ['KPI'],
    }),
    getDepartmentsKpiStatus: builder.query<DepartmentKpiStatus[], { period: string }>({
      query: (params) => ({
        url: '/kpis/departments/status',
        params,
      }),
      providesTags: ['KPI'],
    }),
    getEmployeeKpiHistory: builder.query<Kpi[], { employeeId: number; period?: string }>({
      query: ({ employeeId, period }) => ({
        url: `/kpis/history/employee/${employeeId}`,
        params: { period },
      }),
      providesTags: ['KPI'],
    }),
    getPositionKpiHistory: builder.query<PositionKpi[], { departmentId?: number; positionId?: number; period?: string }>({
      query: (params) => ({
        url: '/kpis/history/position',
        params,
      }),
      providesTags: ['KPI'],
    }),
    getDepartmentKpiHistory: builder.query<DepartmentKpi[], { departmentId?: number; period?: string }>({
      query: (params) => ({
        url: '/kpis/history/department',
        params,
      }),
      providesTags: ['KPI'],
    }),
    getKpiHistorySummary: builder.query<KpiHistorySummary[], void>({
      query: () => '/kpis/history/summary',
      providesTags: ['KPI'],
    }),
    performMonthlyKpiReset: builder.mutation<void, void>({
      query: () => ({
        url: '/kpis/hr/reset-monthly',
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'KPI', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetKpisByEmployeeQuery,
  useGetLatestKpisByEmployeeQuery,
  useGetLatestKpiDateByEmployeeQuery,
  useGetEmployeeKpiPeriodsQuery,
  useSetupKpisMutation,
  useGetPositionKpisQuery,
  useSetupPositionKpisMutation,
  useGetDepartmentKpisQuery,
  useSetupDepartmentKpisMutation,
  useUpdateManagerKpiActualsMutation,
  useUpdateHrKpiActualsMutation,
  useUpdateDepartmentHrKpiActualsMutation,
  useUpdatePositionHrKpiActualsMutation,
  useGetManagerTeamQuery,
  useGetMyLatestKpisQuery,
  useGetPositionsKpiStatusQuery,
  useGetDepartmentsKpiStatusQuery,
  useGetEmployeeKpiHistoryQuery,
  useGetPositionKpiHistoryQuery,
  useGetDepartmentKpiHistoryQuery,
  useGetKpiHistorySummaryQuery,
  usePerformMonthlyKpiResetMutation,
} = kpiApi
