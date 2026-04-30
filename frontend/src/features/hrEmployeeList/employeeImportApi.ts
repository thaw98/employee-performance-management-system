import { baseApi } from '../../app/baseApi'
import type { ApiResponse } from '../../types/auth'

export type EmployeeImportRowData = {
  staffNo?: string
  fullName: string
  email: string
  department: string
  position: string
  phoneNumber: string
  gender: string
  dateOfBirth: string
  hireDate: string
  staffType: string
  address: string
  race: string
  employmentStatus: string
  emergencyContactName: string
  emergencyContactRelationship: string
  emergencyContactPhone: string
  fatherName: string
  fatherPhone: string
  fatherAddress: string
  fatherNationality: string
}

export type EmployeeImportRowError = {
  rowNumber: number
  rowData: Record<string, string>
  errors: string[]
}

export type EmployeeImportValidationResponse = {
  validationId: string
  fileName: string
  totalRows: number
  validRows: number
  invalidRows: number
  validItems: { rowNumber: number; rowData: Record<string, string> }[]
  invalidItems: EmployeeImportRowError[]
  errorFileAvailable: boolean
  errorFileDownloadUrl?: string
}

export type EmployeeImportCommitResponse = {
  success: boolean
  message: string
  importedCount: number
  failedCount: number
  auditId?: number
}

export const employeeImportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    validateEmployeeImportFile: builder.mutation<
      ApiResponse<EmployeeImportValidationResponse>,
      FormData
    >({
      query: (formData) => ({
        url: '/employees/import/validate',
        method: 'POST',
        body: formData,
      }),
    }),
    commitEmployeeImport: builder.mutation<
      ApiResponse<EmployeeImportCommitResponse>,
      { validationId: string }
    >({
      query: (body) => ({
        url: '/employees/import/commit',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Employee'],
    }),
  }),
})

export const {
  useValidateEmployeeImportFileMutation,
  useCommitEmployeeImportMutation,
} = employeeImportApi
