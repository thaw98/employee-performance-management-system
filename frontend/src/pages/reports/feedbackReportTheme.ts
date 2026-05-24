/** Primary brand color for Feedback Report (matches dash accent). */
export const FEEDBACK_REPORT_PRIMARY = '#2463eb'
export const FEEDBACK_REPORT_PRIMARY_DARK = '#1d4ed8'
export const FEEDBACK_REPORT_PRIMARY_DARKER = '#1e40af'
export const FEEDBACK_REPORT_PRIMARY_LIGHT = '#eff6ff'
export const FEEDBACK_REPORT_PRIMARY_MUTED = '#dbeafe'
export const FEEDBACK_REPORT_PRIMARY_BORDER = '#bfdbfe'
export const FEEDBACK_REPORT_PRIMARY_RGB = [36, 99, 235] as const

export const feedbackReportBtnPrimary =
  'bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] text-white hover:from-[#1d4ed8] hover:to-[#1e40af] shadow-sm shadow-[#dbeafe]'

export const feedbackReportBtnPdf = feedbackReportBtnPrimary

export const feedbackReportBtnExcel =
  'bg-gradient-to-r from-[#059669] to-[#047857] text-white hover:from-[#047857] hover:to-[#065f46] shadow-sm shadow-emerald-100'

export const feedbackReportBtnPrimaryDisabled =
  'disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none'

export const feedbackReportProgressBar =
  'h-full rounded-full bg-gradient-to-r from-[#2463eb] to-[#1d4ed8]'

export const feedbackReportOutlineBtn =
  'border border-[#bfdbfe] text-[#1d4ed8] hover:bg-[#eff6ff] dark:border-[#1e40af] dark:text-[#93c5fd] dark:hover:bg-[#1e3a8a]/30'

export const feedbackReportFocusRing =
  'focus:border-[#2463eb] focus:outline-none focus:ring-1 focus:ring-[#2463eb]'

export const feedbackReportRankingHover =
  'hover:border-[#bfdbfe] hover:bg-[#eff6ff]/70 dark:hover:border-[#1e40af] dark:hover:bg-[#1e3a8a]/20'

export const feedbackReportTopCard =
  'border-[#bfdbfe] bg-[#eff6ff]/70 dark:border-[#1e40af]/50 dark:bg-[#1e3a8a]/25'

export const feedbackReportTopCardLabel = 'text-[#1d4ed8] dark:text-[#93c5fd]'

export const feedbackReportTopCardIcon =
  'bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] text-white'

export const feedbackReportTopCardScore = 'text-[#1e40af] dark:text-[#bfdbfe]'

export const feedbackReportTopCardBadge =
  'bg-[#dbeafe] text-[#1e40af] dark:bg-[#1e3a8a]/50 dark:text-[#bfdbfe]'

export const feedbackReportScorePanel = 'rounded-lg bg-[#eff6ff] p-4 dark:bg-[#1e3a8a]/30'

export const feedbackReportScorePanelLabel =
  'text-xs font-black uppercase tracking-wide text-[#1d4ed8] dark:text-[#93c5fd]'

export const feedbackReportScorePanelValue =
  'mt-1 text-3xl font-black text-[#1e40af] dark:text-[#bfdbfe]'

export const feedbackReportAccentText = 'text-[#2463eb] dark:text-[#93c5fd]'

export const feedbackReportStatChip =
  'shrink-0 rounded-lg bg-[#eff6ff] px-2.5 py-1.5 text-right dark:bg-[#1e3a8a]/30'

export const feedbackReportStatChipTight =
  'rounded-lg bg-[#eff6ff] px-2.5 py-2 text-right dark:bg-[#1e3a8a]/30'

export const feedbackReportStatChipLabel =
  'text-[10px] font-bold uppercase text-[#1d4ed8] dark:text-[#93c5fd]'

export const feedbackReportStatChipValueLg =
  'text-lg font-black text-[#1e40af] dark:text-[#bfdbfe]'

export const feedbackReportStatChipValueSm =
  'text-sm font-black text-[#1e40af] dark:text-[#bfdbfe]'
