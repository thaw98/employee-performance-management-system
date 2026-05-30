import { baseApi } from '../../app/baseApi'

export interface KpiTemplateItem {
  name: string
  category: string
  target: string
  unit?: string | null
  weight: number
}

export interface KpiTemplate {
  id: number
  name: string
  type: 'INDIVIDUAL' | 'POSITION' | 'DEPARTMENT'
  departmentId?: number
  positionId?: number
  items: KpiTemplateItem[]
}

export interface KpiTemplateImportValidRow {
  rowNumber: number
  name: string
  category: string
  target: string
  unit: string | null
  weight: number
}

export interface KpiTemplateImportInvalidRow {
  rowNumber: number
  name: string | null
  category: string | null
  target: string | null
  unit: string | null
  weight: number | null
  errors: string[]
}

export interface KpiTemplateImportValidationResponse {
  totalRows: number
  validRows: number
  invalidRows: number
  validRowData: KpiTemplateImportValidRow[]
  invalidRowsData: KpiTemplateImportInvalidRow[]
}

export interface KpiTemplateImportCreateRequest {
  name: string
  type: 'INDIVIDUAL' | 'POSITION' | 'DEPARTMENT'
  departmentId?: number
  positionId?: number
  items: KpiTemplateItem[]
}

export const kpiTemplateApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getKpiTemplates: builder.query<KpiTemplate[], { type: string; departmentId?: number; positionId?: number }>({
      query: (params) => ({
        url: '/kpi-templates',
        params,
      }),
      providesTags: ['KPI'],
    }),
    createKpiTemplate: builder.mutation<KpiTemplate, Partial<KpiTemplate>>({
      query: (body) => ({
        url: '/kpi-templates',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['KPI'],
    }),
    validateKpiTemplateImport: builder.mutation<{ success: boolean; message: string; data: KpiTemplateImportValidationResponse }, FormData>({
      query: (body) => ({
        url: '/kpi-templates/import/validate',
        method: 'POST',
        body,
      }),
    }),
    createKpiTemplateFromImport: builder.mutation<{ success: boolean; message: string; data: KpiTemplate }, KpiTemplateImportCreateRequest>({
      query: (body) => ({
        url: '/kpi-templates/import/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['KPI'],
    }),
  }),
})

export const {
  useGetKpiTemplatesQuery,
  useCreateKpiTemplateMutation,
  useValidateKpiTemplateImportMutation,
  useCreateKpiTemplateFromImportMutation,
} = kpiTemplateApi
