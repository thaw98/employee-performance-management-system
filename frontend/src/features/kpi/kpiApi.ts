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
    setupKpis: builder.mutation<Kpi[], Kpi[]>({
      query: (body) => ({
        url: '/kpis/setup',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'KPI', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetKpisByEmployeeQuery,
  useSetupKpisMutation,
} = kpiApi
