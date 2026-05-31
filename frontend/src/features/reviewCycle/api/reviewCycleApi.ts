import { baseApi } from '../../../app/baseApi'

export interface ReviewCycleDto {
  id: number
  timeSettingId: number | null
  parentCycleId: number | null
  name: string
  code: string
  cycleType: string
  yearLabel: string
  sequenceNo: number
  startDate: string
  endDate: string
  requiresEmployeeSubmission: boolean
  rollupMethod: string | null
  status: 'UPCOMING' | 'ACTIVE' | 'CLOSED' | string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ReviewCycleQueryParams {
  status?: 'UPCOMING' | 'ACTIVE' | 'CLOSED' | string
  cycleType?: string
  requiresEmployeeSubmission?: boolean
}

interface ApiBody<T> {
  success?: boolean
  data?: T
}

const normalizeReviewCycles = (response: unknown): ReviewCycleDto[] => {
  const body = response as ApiBody<ReviewCycleDto[]>
  const list = body?.data
  return Array.isArray(list) ? list : []
}

export const reviewCycleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReviewCycles: builder.query<ReviewCycleDto[], ReviewCycleQueryParams | undefined>({
      query: (params = {}) => ({
        url: '/review-cycles',
        params,
      }),
      transformResponse: normalizeReviewCycles,
    }),
    getActiveReviewCycles: builder.query<ReviewCycleDto[], void>({
      query: () => '/review-cycles/active',
      transformResponse: normalizeReviewCycles,
    }),
  }),
})

export const { useGetReviewCyclesQuery, useGetActiveReviewCyclesQuery } = reviewCycleApi
