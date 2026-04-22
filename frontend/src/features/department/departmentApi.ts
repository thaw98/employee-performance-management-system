import { baseApi } from '../../app/baseApi';
import type { ApiResponse } from '../../types/auth';
import type { DepartmentDto, DepartmentCreateDto, DepartmentUpdateDto } from '../../types/department';

export const departmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query<ApiResponse<DepartmentDto[]>, void>({
      query: () => ({ url: '/departments' }),
      providesTags: ['Department'],
    }),
    createDepartment: builder.mutation<ApiResponse<DepartmentDto>, DepartmentCreateDto>({
      query: (body) => ({
        url: '/departments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Department'],
    }),
    updateDepartment: builder.mutation<ApiResponse<DepartmentDto>, { id: number; data: DepartmentUpdateDto }>({
      query: ({ id, data }) => ({
        url: `/departments/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Department'],
    }),
    disbandDepartment: builder.mutation<ApiResponse<DepartmentDto>, number>({
      query: (id) => ({
        url: `/departments/${id}/disband`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Department'],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDisbandDepartmentMutation,
} = departmentApi;
