import { baseApi } from '../../../app/baseApi'
import type { ApiResponse } from '../../../types/auth'

export interface LevelCodePositionDto {
  positionId: number
  positionCode: string
  positionName: string
  roleId: number | null
  roleName: string | null
  status: string
}

export interface LevelCodeDto {
  id: number
  code: string
  description: string | null
  positionCount: number
}

export interface LevelCodeDetailDto {
  id: number
  code: string
  description: string | null
  positions: LevelCodePositionDto[]
  positionCount: number
}

export interface LevelCodeListResponse {
  data: LevelCodeDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface CreateLevelCodeRequest {
  code: string
  description?: string
}

export interface UpdateLevelCodeRequest {
  description?: string
}

export interface UpdatePositionRoleRequest {
  roleId: number
}

export const levelCodeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLevelCodes: builder.query<ApiResponse<LevelCodeListResponse>, void>({
      query: () => '/level-codes',
      providesTags: ['LevelCode'],
    }),
    getLevelCodeDetail: builder.query<ApiResponse<LevelCodeDetailDto>, number>({
      query: (id) => `/level-codes/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'LevelCode', id }],
    }),
    createLevelCode: builder.mutation<ApiResponse<LevelCodeDto>, CreateLevelCodeRequest>({
      query: (body) => ({ url: '/level-codes', method: 'POST', body }),
      invalidatesTags: ['LevelCode'],
    }),
    updateLevelCode: builder.mutation<ApiResponse<LevelCodeDto>, { id: number; body: UpdateLevelCodeRequest }>({
      query: ({ id, body }) => ({ url: `/level-codes/${id}`, method: 'PUT', body }),
      invalidatesTags: ['LevelCode'],
    }),
    updatePositionRole: builder.mutation<ApiResponse<LevelCodePositionDto>, { positionId: number; body: UpdatePositionRoleRequest }>({
      query: ({ positionId, body }) => ({ url: `/level-codes/positions/${positionId}/role`, method: 'PATCH', body }),
      invalidatesTags: ['LevelCode', 'Position'],
    }),
  }),
})

export const {
  useGetLevelCodesQuery,
  useGetLevelCodeDetailQuery,
  useCreateLevelCodeMutation,
  useUpdateLevelCodeMutation,
  useUpdatePositionRoleMutation,
} = levelCodeApi
