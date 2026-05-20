import { baseApi } from '../../../app/baseApi'

export interface FeedbackTarget {
  id: number
  employeeDbId: number
  employeeId: string
  employeeName: string
  departmentName: string
  positionName: string
  roleName: string
}

export interface DepartmentPositionDto {
  id: number
  name: string
}

export interface FeedbackDetailDto {
  criteriaId: number
  rating: number
  comment: string
}

export interface FeedbackSubmissionDto {
  evaluateePositionId: number
  evaluateeName: string
  totalPoints: number
  totalScore: number
  scoreGrade: string
  details: FeedbackDetailDto[]
}

export interface FeedbackHistoryDetailDto {
  criteriaName: string
  rating: number
  comment: string
}

export interface FeedbackHistoryDto {
  id: number
  evaluateeName: string
  evaluateeDepartment: string
  evaluateePosition: string
  assessmentDate: string
  totalPoints: number
  totalScore: number
  scoreGrade: string
  details: FeedbackHistoryDetailDto[]
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface TimeSettingDto {
  yearType: string
  pendingYearType?: string | null
  startDate?: string | null
  endDate?: string | null
  duration: string
  periodType?: string | null
  periods?: unknown[]
}

export interface ReportDepartmentDto {
  departmentId: number
  departmentName: string
}

export interface CriteriaAverageDto {
  criteriaId: number
  criteriaName: string
  average: number
}

export interface EmployeeRankingDto {
  employeeId: number
  employeeName: string
  departmentId?: number | null
  departmentName?: string | null
  averageScore: number
}

export interface EmployeeCriteriaAverageDto {
  criteriaId: number
  criteriaName: string
  average: number
}

export interface EmployeeFeedbackDetailReportDto {
  employeeId: number
  employeeName: string
  departmentId: number
  departmentName: string
  totalAverageScore: number
  criteriaAverages: EmployeeCriteriaAverageDto[]
}

export interface TopBottomEmployeeSummaryDto {
  topEmployee: EmployeeRankingDto | null
  bottomEmployee: EmployeeRankingDto | null
}

export interface DepartmentAverageDto {
  departmentId: number
  departmentName: string
  averageScore: number
}

export interface DepartmentTrendPoint {
  period: string
  average: number
}

export interface DepartmentTrendDto {
  departmentId: number
  departmentName: string
  points: DepartmentTrendPoint[]
}

export interface FeedbackReportFilters {
  from?: string
  to?: string
  reviewCycleId?: number
}

export interface DepartmentFeedbackReportFilters extends FeedbackReportFilters {
  departmentId?: number
  criteriaId?: number
  order?: 'asc' | 'desc'
}

export interface EmployeeFeedbackDetailFilters extends FeedbackReportFilters {
  departmentId: number
  employeeId: number
}

export interface DepartmentTrendFilters extends FeedbackReportFilters {
  fromReviewCycleId?: number
  toReviewCycleId?: number
}

export const feedbackApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFeedbackRoles: builder.query<ApiResponse<DepartmentPositionDto[]>, void>({
      query: () => '/feedback/roles',
    }),
    getMyDepartment: builder.query<ApiResponse<string>, void>({
      query: () => '/feedback/my-department',
    }),
    getMe: builder.query<ApiResponse<FeedbackTarget>, void>({
      query: () => '/feedback/me',
    }),
    submitFeedback: builder.mutation<ApiResponse<void>, FeedbackSubmissionDto>({
      query: (body) => ({
        url: '/feedback/submit',
        method: 'POST',
        body,
      }),
    }),
    getFeedbackHistory: builder.query<ApiResponse<FeedbackHistoryDto[]>, void>({
      query: () => '/feedback/history',
    }),
    getTimeSettings: builder.query<TimeSettingDto, void>({
      query: () => '/feedback/time-settings',
      transformResponse: (response: unknown): TimeSettingDto => {
        const body = response as ApiResponse<TimeSettingDto>
        return (
          body?.data ?? {
            yearType: '',
            duration: '',
          }
        )
      },
    }),
    getFeedbackReportDepartments: builder.query<ApiResponse<ReportDepartmentDto[]>, void>({
      query: () => '/feedback/reports/manager-departments',
    }),
    getCriteriaAverages: builder.query<ApiResponse<CriteriaAverageDto[]>, { departmentId?: number; from?: string; to?: string; reviewCycleId?: number }>({
        query: (params) => {
          const { departmentId, from, to } = params
          const qs = []
          if (from) qs.push(`from=${from}`)
          if (to) qs.push(`to=${to}`)
          if (params.reviewCycleId) qs.push(`reviewCycleId=${params.reviewCycleId}`)
          const q = qs.length ? `?${qs.join('&')}` : ''
          return departmentId
            ? `/feedback/reports/department/${departmentId}/criteria-averages${q}`
            : `/feedback/reports/criteria-averages${q}`
        },
      }),
    getEmployeeRanking: builder.query<ApiResponse<EmployeeRankingDto[]>, DepartmentFeedbackReportFilters>({
        query: (params) => {
          const { departmentId, from, to, criteriaId, order, reviewCycleId } = params
          const qs: string[] = []
          if (from) qs.push(`from=${from}`)
          if (to) qs.push(`to=${to}`)
          if (criteriaId) qs.push(`criteriaId=${criteriaId}`)
          if (order) qs.push(`order=${order}`)
          if (reviewCycleId) qs.push(`reviewCycleId=${reviewCycleId}`)
          const q = qs.length ? `?${qs.join('&')}` : ''
          return departmentId
            ? `/feedback/reports/department/${departmentId}/employee-ranking${q}`
            : `/feedback/reports/employee-ranking${q}`
        },
      }),
    getEmployeeFeedbackDetail: builder.query<ApiResponse<EmployeeFeedbackDetailReportDto>, EmployeeFeedbackDetailFilters>({
      query: ({ departmentId, employeeId, from, to, reviewCycleId }) => {
        const qs: string[] = []
        if (from) qs.push(`from=${from}`)
        if (to) qs.push(`to=${to}`)
        if (reviewCycleId) qs.push(`reviewCycleId=${reviewCycleId}`)
        const q = qs.length ? `?${qs.join('&')}` : ''
        return `/feedback/reports/department/${departmentId}/employee/${employeeId}${q}`
      },
    }),
    getTopBottomEmployees: builder.query<ApiResponse<TopBottomEmployeeSummaryDto>, (FeedbackReportFilters & { departmentId?: number }) | void>({
      query: (params) => {
        const { departmentId, from, to, reviewCycleId } = params || {}
        const qs: string[] = []
        if (departmentId) qs.push(`departmentId=${departmentId}`)
        if (from) qs.push(`from=${from}`)
        if (to) qs.push(`to=${to}`)
        if (reviewCycleId) qs.push(`reviewCycleId=${reviewCycleId}`)
        const q = qs.length ? `?${qs.join('&')}` : ''
        return `/feedback/reports/top-bottom-employees${q}`
      },
    }),
    getAveragesByDepartment: builder.query<ApiResponse<DepartmentAverageDto[]>, FeedbackReportFilters | void>({
        query: (params) => {
          const { from, to, reviewCycleId } = params || {}
          const qs: string[] = []
          if (from) qs.push(`from=${from}`)
          if (to) qs.push(`to=${to}`)
          if (reviewCycleId) qs.push(`reviewCycleId=${reviewCycleId}`)
          const q = qs.length ? `?${qs.join('&')}` : ''
          return `/feedback/reports/averages-by-department${q}`
        },
      }),
    getDepartmentTrends: builder.query<ApiResponse<DepartmentTrendDto[]>, DepartmentTrendFilters | void>({
        query: (params) => {
          const { from, to, fromReviewCycleId, toReviewCycleId } = params || {}
          const qs: string[] = []
          if (from) qs.push(`from=${from}`)
          if (to) qs.push(`to=${to}`)
          if (fromReviewCycleId) qs.push(`fromReviewCycleId=${fromReviewCycleId}`)
          if (toReviewCycleId) qs.push(`toReviewCycleId=${toReviewCycleId}`)
          const q = qs.length ? `?${qs.join('&')}` : ''
          return `/feedback/reports/trends${q}`
        },
      }),
    getFeedbackReportExportData: builder.query<ApiResponse<EmployeeFeedbackDetailReportDto[]>, (FeedbackReportFilters & { departmentId?: number }) | void>({
      query: (params) => {
        const { departmentId, from, to, reviewCycleId } = params || {}
        const qs: string[] = []
        if (departmentId) qs.push(`departmentId=${departmentId}`)
        if (from) qs.push(`from=${from}`)
        if (to) qs.push(`to=${to}`)
        if (reviewCycleId) qs.push(`reviewCycleId=${reviewCycleId}`)
        const q = qs.length ? `?${qs.join('&')}` : ''
        return `/feedback/reports/export-data${q}`
      },
    }),
  }),
})

export const {
  useGetFeedbackRolesQuery,
  useGetMyDepartmentQuery,
  useGetMeQuery,
  useSubmitFeedbackMutation,
  useGetFeedbackHistoryQuery,
  useGetTimeSettingsQuery,
  useGetFeedbackReportDepartmentsQuery,
  useGetCriteriaAveragesQuery,
  useGetEmployeeRankingQuery,
  useGetEmployeeFeedbackDetailQuery,
  useGetTopBottomEmployeesQuery,
  useGetAveragesByDepartmentQuery,
  useGetDepartmentTrendsQuery,
  useLazyGetFeedbackReportExportDataQuery,
} = feedbackApi
