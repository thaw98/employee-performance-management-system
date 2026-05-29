import { baseApi } from '../../app/baseApi'

export interface KpiUnit {
  id?: number
  name: string
  description?: string | null
  status?: string
}

export const kpiUnitApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUnits: builder.query<KpiUnit[], void>({
      query: () => '/kpi-units',
      providesTags: ['KpiUnit'],
    }),
    addUnit: builder.mutation<KpiUnit, Partial<KpiUnit>>({
      query: (body) => ({
        url: '/kpi-units',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['KpiUnit'],
    }),
    deleteUnit: builder.mutation<void, number>({
      query: (id) => ({
        url: `/kpi-units/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['KpiUnit'],
    }),
  }),
})

export const {
  useGetUnitsQuery,
  useAddUnitMutation,
  useDeleteUnitMutation,
} = kpiUnitApi
