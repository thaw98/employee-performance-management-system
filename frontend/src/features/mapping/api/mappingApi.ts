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

export interface DepartmentPositionMappingListResponse {
	content: DepartmentPositionMappingDto[]
	page: number
	size: number
	totalElements: number
	totalPages: number
}

export interface CreateMappingRequest {
	departmentId: number
	positionId: number
	status: string
}

export interface UpdateMappingRequest {
	departmentId: number
	positionId: number
	status: string
}

export interface GetMappingsParams {
	page?: number
	size?: number
	search?: string
	sortBy?: string
	sortDir?: string
}

export interface DepartmentOption {
	id: number
	name: string
}

export interface PositionOption {
	id: number
	name: string
	code: string
}

export interface DepartmentPositionMappingOption {
	id: number
	positionId: number
	positionName: string
	positionCode: string
	levelCodeName: string | null
}

export const mappingApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getMappings: builder.query<ApiResponse<DepartmentPositionMappingListResponse>, GetMappingsParams>({
			query: (params) => ({ url: '/department-positions', params }),
			providesTags: ['Mapping'],
		}),
		getMappingById: builder.query<ApiResponse<DepartmentPositionMappingDto>, number>({
			query: (id) => `/department-positions/${id}`,
			providesTags: (_result, _error, id) => [{ type: 'Mapping', id }],
		}),
		createMapping: builder.mutation<ApiResponse<DepartmentPositionMappingDto>, CreateMappingRequest>({
			query: (body) => ({ url: '/department-positions', method: 'POST', body }),
			invalidatesTags: ['Mapping'],
		}),
		updateMapping: builder.mutation<ApiResponse<DepartmentPositionMappingDto>, { id: number; body: UpdateMappingRequest }>({
			query: ({ id, body }) => ({ url: `/department-positions/${id}`, method: 'PUT', body }),
			invalidatesTags: ['Mapping'],
		}),
		toggleMappingStatus: builder.mutation<ApiResponse<DepartmentPositionMappingDto>, number>({
			query: (id) => ({ url: `/department-positions/${id}/status`, method: 'PATCH' }),
			invalidatesTags: ['Mapping'],
		}),
		getActiveDepartments: builder.query<ApiResponse<DepartmentOption[]>, void>({
			query: () => '/lookups/departments/active',
			providesTags: ['Lookup'],
		}),
		getActivePositions: builder.query<ApiResponse<PositionOption[]>, void>({
			query: () => '/lookups/positions/active',
			providesTags: ['Lookup'],
		}),
		getPositionsByDepartment: builder.query<ApiResponse<DepartmentPositionMappingOption[]>, number>({
			query: (departmentId) => `/lookups/departments/${departmentId}/positions`,
			providesTags: ['Lookup'],
		}),
	}),
})

export const {
	useGetMappingsQuery,
	useGetMappingByIdQuery,
	useCreateMappingMutation,
	useUpdateMappingMutation,
	useToggleMappingStatusMutation,
	useGetActiveDepartmentsQuery,
	useGetActivePositionsQuery,
	useGetPositionsByDepartmentQuery,
} = mappingApi