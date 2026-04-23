import { baseApi } from '../../../app/baseApi'
import type { ApiResponse } from '../../../types/auth'
import type { DepartmentDto, CreateDepartmentRequest, UpdateDepartmentRequest } from '../types'

export const departmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query<ApiResponse<DepartmentDto[]>, void>({
      query: () => '/departments',
      providesTags: ['Department'],
    }),
    createDepartment: builder.mutation<ApiResponse<DepartmentDto>, CreateDepartmentRequest>({
      query: (body) => ({
        url: '/departments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Department'],
    }),
    updateDepartment: builder.mutation<ApiResponse<DepartmentDto>, { id: number; body: UpdateDepartmentRequest }>({
      query: ({ id, body }) => ({
        url: `/departments/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Department'],
    }),
    deleteDepartment: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/departments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Department'],
    }),
  }),
})

export const {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentApi
