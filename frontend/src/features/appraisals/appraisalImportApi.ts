import { baseApi } from '../../app/baseApi'
import type { ApiResponse } from '../../types/auth'

export type AppraisalImportRowData = {
  categoryName: string
  categoryDescription: string
  questionText: string
}

export type AppraisalImportRowError = {
  rowNumber: number
  rowData: Record<string, string>
  errors: string[]
}

export type AppraisalImportValidationResponse = {
  validationId: string
  fileName: string
  totalRows: number
  validRows: number
  invalidRows: number
  validItems: { rowNumber: number; rowData: Record<string, string> }[]
  invalidItems: AppraisalImportRowError[]
  errorFileAvailable: boolean
  errorFileDownloadUrl?: string
}

export type AppraisalImportCommitResponse = {
  success: boolean
  message: string
  createdCategoryCount: number
  reusedCategoryCount: number
  createdQuestionCount: number
  reusedQuestionCount: number
  failedCount: number
}

export const appraisalImportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    validateAppraisalImportFile: builder.mutation<
      ApiResponse<AppraisalImportValidationResponse>,
      FormData
    >({
      query: (formData) => ({
        url: '/appraisals/import/validate',
        method: 'POST',
        body: formData,
      }),
    }),
    commitAppraisalImport: builder.mutation<
      ApiResponse<AppraisalImportCommitResponse>,
      { validationId: string }
    >({
      query: (body) => ({
        url: '/appraisals/import/commit',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Employee'],
    }),
  }),
})

export const {
  useValidateAppraisalImportFileMutation,
  useCommitAppraisalImportMutation,
} = appraisalImportApi
