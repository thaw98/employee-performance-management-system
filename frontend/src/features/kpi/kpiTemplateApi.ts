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
  }),
})

export const {
  useGetKpiTemplatesQuery,
  useCreateKpiTemplateMutation,
} = kpiTemplateApi
