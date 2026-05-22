import { baseApi } from '../../../app/baseApi'

export interface CycleMetadata {
  id: number
  name: string
  startDate: string | null
  endDate: string | null
}

export interface OverallTotals {
  recordCount: number
  averageScore: number
  highestScore: number
  lowestScore: number
  missedCount: number
}

export interface GroupSummary {
  groupId: number | null
  groupCode: string | null
  departmentId: number | null
  departmentName: string | null
  groupName: string
  employeeCount: number
  averageScore: number
  highestScore: number
  lowestScore: number
  missedCount: number
}

export interface PerformanceBandRadarPoint {
  groupName: string
  outstanding: number
  good: number
  meetRequirement: number
  needImprovement: number
  unsatisfactory: number
  outstandingPercent: number
  goodPercent: number
  meetRequirementPercent: number
  needImprovementPercent: number
  unsatisfactoryPercent: number
}

export interface PerformerScore {
  employeeId: number | null
  staffNo: string
  employeeName: string
  departmentName: string
  positionName: string
  score: number
  performance: string
  status: string
}

export interface PerformerHighlight {
  groupName: string
  highestPerformers: PerformerScore[]
  lowestPerformers: PerformerScore[]
}

export interface EmployeeDirectoryRow {
  employeeId: number | null
  staffNo: string
  employeeName: string
  departmentId: number | null
  departmentName: string
  positionId: number | null
  positionName: string
  selectedCycleScore: number
  performance: string
  status: string
  previousCycleScore: number | null
  previousCycleDelta: number | null
}

export interface SelfAssessmentReportDto {
  role: 'hr' | 'manager' | string
  selectedCycle: CycleMetadata
  previousCycle: CycleMetadata | null
  overallTotals: OverallTotals
  highestDepartment: GroupSummary | null
  lowestDepartment: GroupSummary | null
  departmentSummaries: GroupSummary[]
  positionSummaries: GroupSummary[]
  performanceBandRadar: PerformanceBandRadarPoint[]
  performerHighlights: PerformerHighlight[]
  employeeDirectory: EmployeeDirectoryRow[]
}

interface ApiBody<T> {
  data?: T
}

export const selfAssessmentReportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSelfAssessmentReport: builder.query<SelfAssessmentReportDto, number>({
      query: (cycleId) => ({
        url: '/self-assessment-forms/reports',
        params: { cycleId },
      }),
      transformResponse: (response: ApiBody<SelfAssessmentReportDto>) => response.data as SelfAssessmentReportDto,
    }),
  }),
})

export const { useGetSelfAssessmentReportQuery } = selfAssessmentReportApi
