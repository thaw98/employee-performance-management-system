import { baseApi } from '../../app/baseApi'
import type { ApiResponse } from '../../types/auth'

export interface KpiCategory {
  id?: number
  name: string
  description?: string
  status?: string
}

export const kpiCategoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<KpiCategory[], void>({
      query: () => '/kpi-categories',
      providesTags: ['KpiCategory'],
    }),
    addCategory: builder.mutation<KpiCategory, Partial<KpiCategory>>({
      query: (body) => ({
        url: '/kpi-categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['KpiCategory'],
    }),
    deleteCategory: builder.mutation<void, number>({
      query: (id) => ({
        url: `/kpi-categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['KpiCategory'],
    }),
  }),
})

export const {
  useGetCategoriesQuery,
  useAddCategoryMutation,
  useDeleteCategoryMutation,
} = kpiCategoryApi
