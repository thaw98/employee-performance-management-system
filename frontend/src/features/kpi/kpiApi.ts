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
  period: string
  status: string
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
  period: string
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
} = kpiApi
