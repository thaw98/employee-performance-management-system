/** Primary brand color for Appraisal Reports (/reports/appraisal). */
export const APPRAISAL_REPORT_PRIMARY = '#2463eb'
export const APPRAISAL_REPORT_PRIMARY_DARK = '#1d4ed8'
export const APPRAISAL_REPORT_PRIMARY_DARKER = '#1e40af'
export const APPRAISAL_REPORT_PRIMARY_LIGHT = '#eff6ff'
export const APPRAISAL_REPORT_PRIMARY_MUTED = '#dbeafe'
export const APPRAISAL_REPORT_PRIMARY_BORDER = '#bfdbfe'

export const appraisalReportBtnPrimary =
  'bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] text-white hover:from-[#1d4ed8] hover:to-[#1e40af] shadow-md shadow-[#dbeafe] active:scale-95'

export const appraisalReportGradientIcon =
  'bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] text-white'

export const appraisalReportStatIcon =
  'bg-[#eff6ff] text-[#2463eb]'

export const appraisalReportStatIconMuted =
  'bg-[#dbeafe] text-[#1d4ed8]'

export const appraisalReportStatIconTotal =
  'bg-[#eff6ff] text-[#2463eb]'

export const appraisalReportStatIconCompleted =
  'bg-gradient-to-br from-[#059669] to-[#047857] text-white'

export const appraisalReportStatIconAverage =
  'bg-[#f5f3ff] text-[#7c3aed]'

export const appraisalReportStatIconPending =
  'bg-[#fff7ed] text-[#ea580c]'

export const appraisalReportFocusRing =
  'focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe]'

export const appraisalReportAccentText = 'text-[#2463eb]'

export const appraisalReportPaginationActive =
  'bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] text-white shadow-lg shadow-[#dbeafe]'

export const appraisalReportIconHover =
  'hover:bg-[#eff6ff] hover:text-[#2463eb]'

export const appraisalReportPaginationNav =
  'hover:bg-gradient-to-r hover:from-[#2463eb] hover:to-[#1d4ed8] hover:text-white'

/** High-contrast palette for charts (projector / large-screen friendly). */
export const APPRAISAL_REPORT_CHART_COLORS = [
  '#2463eb', // blue
  '#059669', // emerald
  '#d97706', // amber
  '#7c3aed', // violet
  '#e11d48', // rose
  '#0891b2', // cyan
  '#ea580c', // orange
  '#4f46e5', // indigo
] as const

/** Semantic colors for appraisal status segments in pie charts. */
export const APPRAISAL_STATUS_CHART_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  'PENDING MANAGER': '#f97316',
  PENDING_MANAGER: '#f97316',
  SUBMITTED: '#2463eb',
  RETURNED: '#ca8a04',
  'HR APPROVED': '#059669',
  HR_APPROVED: '#059669',
  REJECTED: '#dc2626',
  FINALIZED: '#16a34a',
  LOCKED: '#16a34a',
}

export function getAppraisalStatusChartColor(statusLabel: string, fallbackIndex: number): string {
  const key = statusLabel.toUpperCase().trim()
  return (
    APPRAISAL_STATUS_CHART_COLORS[key] ??
    APPRAISAL_REPORT_CHART_COLORS[fallbackIndex % APPRAISAL_REPORT_CHART_COLORS.length]
  )
}
