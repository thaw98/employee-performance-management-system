import { baseApi } from '../../../app/baseApi'
import type { ApiResponse } from '../../../types/auth'

export interface ScoreFormulaDto {
  id: number
  name: string
  area: string
  active: boolean
  isDefault: boolean
  definition: string
  description: string | null
  createdBy: number
  createdAt: string
  updatedBy: number | null
  updatedAt: string | null
  inactivatedBy: number | null
  inactivatedAt: string | null
}

export interface CreateScoreFormulaRequest {
  name: string
  area: string
  definition: string
  description?: string
}

export interface UpdateScoreFormulaRequest {
  name?: string
  definition?: string
  description?: string
}

const EXPRESSION_TEMPLATE = JSON.stringify({
  expression: {
    type: 'multiply',
    left: {
      type: 'divide',
      left: { type: 'input', name: 'SUM_RATINGS' },
      right: {
        type: 'multiply',
        left: { type: 'input', name: 'NUM_QUESTIONS' },
        right: { type: 'input', name: 'MAX_RATING' },
      },
    },
    right: { type: 'literal', value: 100 },
  },
})

export function defaultExpression(): string {
  return EXPRESSION_TEMPLATE
}

export const scoreFormulaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFormulasByArea: builder.query<ScoreFormulaDto[], string>({
      query: (area) => `/score-formulas?area=${area}`,
      transformResponse: (response: ApiResponse<ScoreFormulaDto[]>) => response.data ?? [],
      providesTags: ['ScoreFormula'],
    }),
    getFormula: builder.query<ScoreFormulaDto, number>({
      query: (id) => `/score-formulas/${id}`,
      transformResponse: (response: ApiResponse<ScoreFormulaDto>) => response.data!,
      providesTags: (_result, _error, id) => [{ type: 'ScoreFormula', id }],
    }),
    createFormula: builder.mutation<ScoreFormulaDto, CreateScoreFormulaRequest>({
      query: (body) => ({
        url: '/score-formulas',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<ScoreFormulaDto>) => response.data!,
      invalidatesTags: ['ScoreFormula'],
    }),
    updateFormula: builder.mutation<ScoreFormulaDto, { id: number; body: UpdateScoreFormulaRequest }>({
      query: ({ id, body }) => ({
        url: `/score-formulas/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: ApiResponse<ScoreFormulaDto>) => response.data!,
      invalidatesTags: ['ScoreFormula'],
    }),
    setDefaultFormula: builder.mutation<ScoreFormulaDto, number>({
      query: (id) => ({
        url: `/score-formulas/${id}/set-default`,
        method: 'PUT',
      }),
      transformResponse: (response: ApiResponse<ScoreFormulaDto>) => response.data!,
      invalidatesTags: ['ScoreFormula'],
    }),
    inactivateFormula: builder.mutation<ScoreFormulaDto, { id: number; replacementId?: number }>({
      query: ({ id, replacementId }) => ({
        url: `/score-formulas/${id}/inactivate`,
        method: 'PUT',
        params: replacementId ? { replacementId } : undefined,
      }),
      transformResponse: (response: ApiResponse<ScoreFormulaDto>) => response.data!,
      invalidatesTags: ['ScoreFormula'],
    }),
  }),
})

export const {
  useGetFormulasByAreaQuery,
  useGetFormulaQuery,
  useCreateFormulaMutation,
  useUpdateFormulaMutation,
  useSetDefaultFormulaMutation,
  useInactivateFormulaMutation,
} = scoreFormulaApi
