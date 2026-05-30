import { baseApi } from '../../app/baseApi'

export type ScoreExplanationModule = 'SELF_ASSESSMENT' | 'APPRAISAL' | 'FEEDBACK_360'

export interface ScoreExplanation {
  id: number
  module: ScoreExplanationModule
  sortOrder: number
  minScore: number
  maxScore: number
  title: string
  details: string
  createdAt: string
  updatedAt: string
  updatedBy?: number | null
  updatedByRoleId?: number | null
}

export interface UpdateScoreExplanationRequest {
  minScore: number
  maxScore: number
  title: string
  details: string
  reason: string
  applyToModules: ScoreExplanationModule[]
}

export const scoreExplanationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getScoreExplanations: builder.query<Record<ScoreExplanationModule, ScoreExplanation[]>, void>({
      query: () => '/score-explanations',
      transformResponse: (response: { data: Record<ScoreExplanationModule, ScoreExplanation[]> }) => response.data,
      providesTags: ['ScoreExplanation'],
    }),
    updateScoreExplanation: builder.mutation<ScoreExplanation[], { id: number; body: UpdateScoreExplanationRequest }>({
      query: ({ id, body }) => ({
        url: `/score-explanations/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: { data: ScoreExplanation[] }) => response.data,
      invalidatesTags: ['ScoreExplanation', 'AuditLog'],
    }),
  }),
})

export const { useGetScoreExplanationsQuery, useUpdateScoreExplanationMutation } = scoreExplanationApi
