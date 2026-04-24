import { baseApi } from '../../../app/baseApi'
import type { ApiResponse } from '../../../types/auth'

export interface PositionDto {
	positionId: number
	positionCode: string
	positionName: string
	status: string
	levelCodeId: number
	levelCodeName: string
	roleId: number
	roleName: string
	createdDate: string
	updatedDate: string
}

export interface PositionListResponse {
	content: PositionDto[]
	page: number
	size: number
	totalElements: number
	totalPages: number
}

export interface CreatePositionRequest {
	positionCode: string
	positionName: string
	levelCodeId: number
	roleId: number
	status: string
}

export interface UpdatePositionRequest {
	positionCode: string
	positionName: string
	levelCodeId: number
	roleId: number
	status: string
}

export interface GetPositionsParams {
	page?: number
	size?: number
	search?: string
	positionName?: string
	roleId?: number
	levelCodeId?: number
	status?: string
	sortBy?: string
	sortDir?: string
}

export interface LevelCodeOption {
	id: number
	code: string
	description: string | null
}

export interface RoleOption {
	id: number
	name: string
	description: string | null
}

export interface AssignedDepartmentDto {
	departmentId: number
	departmentCode: string
	departmentName: string
}

type RawPositionListPayload =
	| ApiResponse<PositionListResponse>
	| (PositionListResponse & { number?: number })

const normalizePositionListResponse = (response: RawPositionListPayload): ApiResponse<PositionListResponse> => {
	if ('success' in response && 'data' in response) {
		return response
	}

	return {
		success: true,
		message: 'Positions fetched successfully.',
		data: {
			content: response.content ?? [],
			page: response.page ?? response.number ?? 0,
			size: response.size ?? 10,
			totalElements: response.totalElements ?? 0,
			totalPages: response.totalPages ?? 0,
		},
	}
}

export const positionApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getPositions: builder.query<ApiResponse<PositionListResponse>, GetPositionsParams>({
			query: (params) => ({ url: '/positions', params }),
			transformResponse: (response: RawPositionListPayload) => normalizePositionListResponse(response),
			providesTags: ['Position'],
		}),
		getPositionById: builder.query<ApiResponse<PositionDto>, number>({
			query: (id) => `/positions/${id}`,
			providesTags: (_result, _error, id) => [{ type: 'Position', id }],
		}),
		getDepartmentsByPositionId: builder.query<AssignedDepartmentDto[], number>({
			query: (positionId) => `/positions/${positionId}/departments`,
			providesTags: (_result, _error, positionId) => [
				{ type: 'PositionDepartments', id: positionId },
			],
		}),
		createPosition: builder.mutation<ApiResponse<PositionDto>, CreatePositionRequest>({
			query: (body) => ({ url: '/positions', method: 'POST', body }),
			invalidatesTags: ['Position'],
		}),
		updatePosition: builder.mutation<ApiResponse<PositionDto>, { id: number; body: UpdatePositionRequest }>({
			query: ({ id, body }) => ({ url: `/positions/${id}`, method: 'PUT', body }),
			invalidatesTags: ['Position'],
		}),
		deletePosition: builder.mutation<ApiResponse<void>, number>({
			query: (id) => ({ url: `/positions/${id}`, method: 'DELETE' }),
			invalidatesTags: ['Position'],
		}),
		togglePositionStatus: builder.mutation<ApiResponse<PositionDto>, number>({
			query: (id) => ({ url: `/positions/${id}/status`, method: 'PATCH' }),
			invalidatesTags: ['Position'],
		}),
		getActiveLevelCodes: builder.query<ApiResponse<LevelCodeOption[]>, void>({
			query: () => '/lookups/level-codes/active',
			providesTags: ['Lookup'],
		}),
		getActiveRoles: builder.query<ApiResponse<RoleOption[]>, void>({
			query: () => '/lookups/roles/active',
			providesTags: ['Lookup'],
		}),
	}),
})

export const {
	useGetPositionsQuery,
	useGetPositionByIdQuery,
	useGetDepartmentsByPositionIdQuery,
	useCreatePositionMutation,
	useUpdatePositionMutation,
	useDeletePositionMutation,
	useTogglePositionStatusMutation,
	useGetActiveLevelCodesQuery,
	useGetActiveRolesQuery,
} = positionApi
