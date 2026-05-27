import { baseApi } from '../../app/baseApi';

export interface PerformanceReportSummary {
  employeeId: number;
  staffNo: string | null;
  employeeName: string;
  departmentName: string | null;
  positionName: string | null;
  profilePictureUrl: string | null;
  joinedDate: string | null;
  kpiScore: number | null;
  kpiPeriod: string | null;
  appraisalScore: number | null;
  appraisalPeriod: string | null;
  appraisalRatingCategory: string | null;
  selfAssessmentScore: number | null;
  selfAssessmentCycle: string | null;
  feedbackScore: number | null;
  feedbackCount: number;
  hasActivePip: boolean;
  pipStatus: string | null;
  overallRating: number | null;
  performanceLevel: string;
  promotionEligibility: string;
  promotionEligible: boolean;
}

export const performanceReportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPerformanceSummaries: builder.query<PerformanceReportSummary[], void>({
      query: () => '/performance-reports/summaries',
      providesTags: ['PerformanceReport'],
      transformResponse: (response: any) => response.data || [],
    }),
    getEmployeePerformanceSummary: builder.query<PerformanceReportSummary, number>({
      query: (employeeId) => `/performance-reports/employee/${employeeId}`,
      providesTags: (_result, _error, id) => [{ type: 'PerformanceReport', id }],
      transformResponse: (response: any) => response.data,
    }),
    getAvailablePositions: builder.query<any[], number>({
      query: (employeeId) => `/promotions/employee/${employeeId}/available-positions`,
      transformResponse: (response: any) => response.data || [],
    }),
    executePromotion: builder.mutation<void, { employeeId: number; newPositionId: number; effectiveDate: string; remarks?: string }>({
      query: ({ employeeId, ...body }) => ({
        url: `/promotions/employee/${employeeId}/execute`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { employeeId }) => [
        'PerformanceReport',
        { type: 'PerformanceReport', id: employeeId },
      ],
    }),
  }),
});

export const {
  useGetPerformanceSummariesQuery,
  useGetEmployeePerformanceSummaryQuery,
  useGetAvailablePositionsQuery,
  useExecutePromotionMutation,
} = performanceReportApi;
