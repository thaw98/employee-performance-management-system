import { baseApi } from '../../../app/baseApi'
import type { ApiResponse } from '../../../types/auth'

export interface DepartmentPositionMappingDto {
  id: number
  departmentId: number
  departmentName: string
  positionId: number
  positionCode: string
  positionName: string
  status: string
  createdOn: string
  updatedOn: string
}

export interface CreateDepartmentPositionRequest {
  departmentId: number
  positionId: number
  status: string
}

type DepartmentPositionsByDepartmentResponse =
  | ApiResponse<DepartmentPositionMappingDto[]>
  | DepartmentPositionMappingDto[]
  | { content?: DepartmentPositionMappingDto[] }

const normalizeDepartmentPositions = (
  response: DepartmentPositionsByDepartmentResponse
): DepartmentPositionMappingDto[] => {
  if (Array.isArray(response)) {
    return response
  }

  if ('data' in response) {
    return Array.isArray(response.data) ? response.data : []
  }

  return Array.isArray(response.content) ? response.content : []
}

export const departmentPositionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDepartmentPositionMappingsByDepartment: builder.query<DepartmentPositionMappingDto[], number>({
      query: (id) => `/departments/${id}/positions`,
      transformResponse: (response: DepartmentPositionsByDepartmentResponse) => normalizeDepartmentPositions(response),
      providesTags: (_result, _error, id) => [{ type: 'DepartmentPositions', id }],
    }),
    addPositionToDepartment: builder.mutation<DepartmentPositionMappingDto, CreateDepartmentPositionRequest>({
      query: (body) => ({
        url: '/department-positions',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<DepartmentPositionMappingDto>) => response.data as DepartmentPositionMappingDto,
      invalidatesTags: (_result, _error, arg) => [{ type: 'DepartmentPositions', id: arg.departmentId }],
    }),
    toggleDepartmentPositionStatus: builder.mutation<DepartmentPositionMappingDto, { id: number; departmentId: number }>({
      query: ({ id }) => ({
        url: `/department-positions/${id}/status`,
        method: 'PATCH',
      }),
      transformResponse: (response: ApiResponse<DepartmentPositionMappingDto>) => response.data as DepartmentPositionMappingDto,
      invalidatesTags: (_result, _error, arg) => [{ type: 'DepartmentPositions', id: arg.departmentId }],
    }),
    removeDepartmentPosition: builder.mutation<void, { id: number; departmentId: number }>({
      query: ({ id }) => ({
        url: `/department-positions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: 'DepartmentPositions', id: arg.departmentId }],
    }),
  }),
})

export const {
  useGetDepartmentPositionMappingsByDepartmentQuery,
  useAddPositionToDepartmentMutation,
  useToggleDepartmentPositionStatusMutation,
  useRemoveDepartmentPositionMutation,
} = departmentPositionsApi
