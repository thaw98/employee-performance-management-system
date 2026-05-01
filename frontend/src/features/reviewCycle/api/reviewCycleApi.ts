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
  status: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ApiBody<T> {
  success?: boolean
  data?: T
}

export const reviewCycleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActiveReviewCycles: builder.query<ReviewCycleDto[], void>({
      query: () => '/review-cycles/active',
      transformResponse: (response: unknown): ReviewCycleDto[] => {
        const body = response as ApiBody<ReviewCycleDto[]>
        const list = body?.data
        return Array.isArray(list) ? list : []
      },
    }),
  }),
})

export const { useGetActiveReviewCyclesQuery } = reviewCycleApi
