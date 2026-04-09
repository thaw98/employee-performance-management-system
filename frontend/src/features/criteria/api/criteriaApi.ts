import { baseApi } from '../../../app/baseApi'

export interface Criteria {
  id: number
  name: string
  description: string
  active: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const criteriaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCriteria: builder.query<ApiResponse<Criteria[]>, void>({
      query: () => '/criteria',
      providesTags: ['Criteria'],
    }),
    createCriteria: builder.mutation<ApiResponse<Criteria>, Partial<Criteria>>({
      query: (body) => ({
        url: '/criteria',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Criteria'],
    }),
    updateCriteria: builder.mutation<ApiResponse<Criteria>, { id: number; data: Partial<Criteria> }>({
      query: ({ id, data }) => ({
        url: `/criteria/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Criteria'],
    }),
    deleteCriteria: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/criteria/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Criteria'],
    }),
  }),
})

export const {
  useGetCriteriaQuery,
  useCreateCriteriaMutation,
  useUpdateCriteriaMutation,
  useDeleteCriteriaMutation,
} = criteriaApi
