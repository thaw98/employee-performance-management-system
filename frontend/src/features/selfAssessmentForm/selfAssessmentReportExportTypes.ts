import type { EmployeeDirectoryRow, GroupSummary } from './api/selfAssessmentReportApi'

export type SelfAssessmentReportTab = 'department' | 'positions' | 'directory'

export type SelfAssessmentReportExportContext = {
  tab: SelfAssessmentReportTab
  departmentRows: GroupSummary[]
  positionRows: GroupSummary[]
  directoryRows: EmployeeDirectoryRow[]
}

const TAB_FILE_SUFFIX: Record<SelfAssessmentReportTab, string> = {
  department: 'department',
  positions: 'positions',
  directory: 'employee-directory',
}

export function selfAssessmentReportExportSuffix(tab: SelfAssessmentReportTab) {
  return TAB_FILE_SUFFIX[tab]
}
