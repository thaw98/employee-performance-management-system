import { baseApi } from '../../../app/baseApi'

export interface AudienceRule {
  departmentId: number
  departmentName?: string
  positionId?: number | null
  positionName?: string | null
}

export interface FeedbackTemplateConfig {
  id?: number
  templateName: string
  targetType: 'DEPARTMENT' | 'LEVEL_CODE' | 'PERSON' | 'POSITION' | 'HYBRID'
  targetId: number
  targetName?: string
  reviewCycleId?: number
  reviewCycleName?: string
  questionIds: number[]
  audienceRules?: AudienceRule[]
  status: 'ACTIVE' | 'INACTIVE'
  maxRating?: number
  createdDate?: string
  updatedDate?: string
  activeRoles?: string[]
  questionsByRole?: Record<string, number[]>
}

export interface FormConfigCriteria {
  id: number
  name: string
  description: string
}

export interface FormConfigResponse {
  templateId?: number
  templateName?: string
  maxRating: number
  criteria: FormConfigCriteria[]
}

export interface FeedbackLimitConfig {
  id?: number
  relationshipType: 'MANAGER' | 'PEER' | 'SUBORDINATE'
  reviewCycleId?: number
  reviewCycleName?: string
  minimumCount: number
  maximumCount: number
  createdDate?: string
  updatedDate?: string
}

export interface FeedbackTemplateImportValidRow {
  rowNumber: number
  criteriaName: string
  description: string | null
  existingCriteriaId?: number | null
}

export interface FeedbackTemplateImportInvalidRow {
  rowNumber: number
  criteriaName: string | null
  description: string | null
  errors: string[]
}

export interface FeedbackTemplateImportValidationResponse {
  totalRows: number
  validRows: number
  invalidRows: number
  validRowData: FeedbackTemplateImportValidRow[]
  invalidRowsData: FeedbackTemplateImportInvalidRow[]
}

export interface SelectedReviewCycleDto {
  id: number
  name: string
  code: string
  startDate: string
  endDate: string
  status: string
}

export interface FeedbackCoverageEmployeeRow {
  employeeId: number
  employeeCode: string | null
  employeeName: string
  departmentId: number | null
  departmentName: string | null
  positionId: number | null
  positionName: string | null
  levelCodeId: number | null
  levelCode: string | null
}

export interface FeedbackCoverage {
  selectedReviewCycle: SelectedReviewCycleDto | null
  eligibleCount: number
  coveredCount: number
  uncoveredCount: number
  coveragePercent: number
  coveredEmployees: FeedbackCoverageEmployeeRow[]
  uncoveredEmployees: FeedbackCoverageEmployeeRow[]
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const feedbackManagementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFeedbackTemplates: builder.query<FeedbackTemplateConfig[], number | void>({
      query: (reviewCycleId) => ({
        url: '/feedback-management/templates',
        params: reviewCycleId ? { reviewCycleId } : undefined,
      }),
      transformResponse: (response: ApiResponse<FeedbackTemplateConfig[]>) => response.data ?? [],
      providesTags: ['FeedbackManagement'],
    }),
    saveFeedbackTemplate: builder.mutation<FeedbackTemplateConfig, FeedbackTemplateConfig>({
      query: ({ id, ...body }) => ({
        url: id ? `/feedback-management/templates/${id}` : '/feedback-management/templates',
        method: id ? 'PUT' : 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<FeedbackTemplateConfig>) => response.data,
      invalidatesTags: ['FeedbackManagement'],
    }),
    deleteFeedbackTemplate: builder.mutation<void, number>({
      query: (id) => ({ url: `/feedback-management/templates/${id}`, method: 'DELETE' }),
      invalidatesTags: ['FeedbackManagement'],
    }),
    getFeedbackLimits: builder.query<FeedbackLimitConfig[], number | void>({
      query: (reviewCycleId) => ({
        url: '/feedback-management/limits',
        params: reviewCycleId ? { reviewCycleId } : undefined,
      }),
      transformResponse: (response: ApiResponse<FeedbackLimitConfig[]>) => response.data ?? [],
      providesTags: ['FeedbackManagement'],
    }),
    saveFeedbackLimit: builder.mutation<FeedbackLimitConfig, FeedbackLimitConfig>({
      query: ({ id, ...body }) => ({
        url: id ? `/feedback-management/limits/${id}` : '/feedback-management/limits',
        method: id ? 'PUT' : 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<FeedbackLimitConfig>) => response.data,
      invalidatesTags: ['FeedbackManagement'],
    }),
    deleteFeedbackLimit: builder.mutation<void, number>({
      query: (id) => ({ url: `/feedback-management/limits/${id}`, method: 'DELETE' }),
      invalidatesTags: ['FeedbackManagement'],
    }),
    validateFeedbackTemplateImport: builder.mutation<
      { success: boolean; message: string; data: FeedbackTemplateImportValidationResponse },
      FormData
    >({
      query: (body) => ({
        url: '/feedback-management/templates/import/validate',
        method: 'POST',
        body,
      }),
    }),
    getFeedbackCoverage: builder.query<FeedbackCoverage, number | void>({
      query: (reviewCycleId) => ({
        url: '/feedback-management/coverage',
        params: reviewCycleId ? { reviewCycleId } : undefined,
      }),
      transformResponse: (response: ApiResponse<FeedbackCoverage>) => response.data,
      providesTags: ['FeedbackManagement'],
    }),
  }),
})

export const {
  useGetFeedbackTemplatesQuery,
  useSaveFeedbackTemplateMutation,
  useDeleteFeedbackTemplateMutation,
  useGetFeedbackLimitsQuery,
  useSaveFeedbackLimitMutation,
  useDeleteFeedbackLimitMutation,
  useValidateFeedbackTemplateImportMutation,
  useGetFeedbackCoverageQuery,
} = feedbackManagementApi
