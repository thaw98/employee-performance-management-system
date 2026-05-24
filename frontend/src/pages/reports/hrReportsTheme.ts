/** Primary brand color for HR Reports (/hr/reports). */
export const HR_REPORT_PRIMARY = '#2463eb'

/** High-contrast palette for charts (projector / large-screen friendly). */
export const HR_REPORT_CHART_COLORS = [
  '#2463eb', // blue
  '#059669', // emerald
  '#d97706', // amber
  '#7c3aed', // violet
  '#e11d48', // rose
  '#0891b2', // cyan
] as const

export const HR_REPORT_PRIMARY_DARK = '#1d4ed8'
export const HR_REPORT_PRIMARY_DARKER = '#1e40af'
export const HR_REPORT_PRIMARY_LIGHT = '#eff6ff'
export const HR_REPORT_PRIMARY_MUTED = '#dbeafe'
export const HR_REPORT_PRIMARY_BORDER = '#bfdbfe'

const hrReportBtnDisabled =
  'disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none'

export const hrReportBtnPrimary =
  `bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] text-white hover:from-[#1d4ed8] hover:to-[#1e40af] shadow-sm shadow-[#dbeafe] ${hrReportBtnDisabled}`

export const hrReportBtnPdf = hrReportBtnPrimary

export const hrReportBtnExcel =
  `bg-gradient-to-r from-[#059669] to-[#047857] text-white hover:from-[#047857] hover:to-[#065f46] shadow-sm shadow-emerald-100 ${hrReportBtnDisabled}`

export const hrReportTabActive =
  'bg-[#eff6ff] dark:bg-[#1e3a8a]/30 text-[#1d4ed8] dark:text-[#93c5fd]'

export const hrReportProgressBar =
  'h-full rounded-full bg-gradient-to-r from-[#2463eb] to-[#1d4ed8]'

export const hrReportLink =
  'text-[#2463eb] hover:text-[#1d4ed8] font-medium hover:underline'

export const hrReportIconHover =
  'p-1.5 text-slate-500 hover:text-[#2463eb] hover:bg-[#eff6ff] dark:hover:bg-[#1e3a8a]/20 rounded'

export const hrReportStatPrimary = 'bg-[#eff6ff] dark:bg-[#1e3a8a]/20 rounded-lg p-4'

export const hrReportStatPrimaryValue =
  'text-2xl font-bold text-[#2463eb] dark:text-[#93c5fd]'

export const hrReportSelectFocus =
  'hover:border-[#bfdbfe] focus:outline-none focus:ring-2 focus:ring-[#dbeafe]'

export const hrReportPaginationActive =
  'bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] text-white border-[#2463eb] shadow-sm shadow-[#dbeafe]'

export const hrReportPaginationInactive =
  'text-slate-600 border-slate-200 bg-white hover:bg-[#eff6ff] hover:border-[#bfdbfe] hover:text-[#1d4ed8]'
