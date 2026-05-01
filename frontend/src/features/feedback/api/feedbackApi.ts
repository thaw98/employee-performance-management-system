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
  }),
})

export const {
  useGetFeedbackRolesQuery,
  useGetMyDepartmentQuery,
  useGetMeQuery,
  useSubmitFeedbackMutation,
  useGetFeedbackHistoryQuery,
  useGetTimeSettingsQuery,
} = feedbackApi
