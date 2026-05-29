import { baseApi } from '../../app/baseApi'

export interface KpiName {
  id?: number
  name: string
  description?: string | null
  status?: string
}

export const kpiNameApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNames: builder.query<KpiName[], void>({
      query: () => '/kpi-names',
      providesTags: ['KpiName'],
    }),
    addName: builder.mutation<KpiName, Partial<KpiName>>({
      query: (body) => ({
        url: '/kpi-names',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['KpiName'],
    }),
    deleteName: builder.mutation<void, number>({
      query: (id) => ({
        url: `/kpi-names/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['KpiName'],
    }),
  }),
})

export const {
  useGetNamesQuery,
  useAddNameMutation,
  useDeleteNameMutation,
} = kpiNameApi
