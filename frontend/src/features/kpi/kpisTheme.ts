/** Primary brand color for /kpis pages (matches dash accent). */
export const KPI_PRIMARY = '#2463eb'
export const KPI_PRIMARY_DARK = '#1d4ed8'
export const KPI_PRIMARY_DARKER = '#1e40af'
export const KPI_PRIMARY_LIGHT = '#eff6ff'
export const KPI_PRIMARY_MUTED = '#dbeafe'
export const KPI_PRIMARY_BORDER = '#bfdbfe'

/** Segment colors for weight breakdown bars (KPI assignment pages). */
export const KPI_CHART_COLORS = [
  '#2563eb', // blue
  '#059669', // emerald
  '#d97706', // amber
  '#7c3aed', // violet
  '#e11d48', // rose
  '#0891b2', // cyan
  '#ea580c', // orange
] as const

/**
 * KPI Reports (/kpi-reports) — saturated, widely spaced hues for projectors and large screens.
 * Each slice/bar should read clearly when projected (avoid similar blues/greens).
 */
export const KPI_REPORTS_CHART_COLORS = [
  '#DC2626', // red
  '#1D4ED8', // blue
  '#15803D', // green
  '#B45309', // amber
  '#7E22CE', // purple
  '#0E7490', // cyan
  '#C2410C', // orange
  '#BE185D', // pink
  '#0F766E', // teal
  '#4338CA', // indigo
] as const

/** Bar chart fill on KPI Reports (distinct from pie slices). */
export const KPI_REPORTS_BAR_FILL = '#0F766E'

export const KPI_REPORTS_CHART_AXIS = { fill: '#1e293b', fontSize: 13, fontWeight: 700 }
export const KPI_REPORTS_CHART_GRID = '#cbd5e1'
export const KPI_REPORTS_PIE_LABEL = { fill: '#0f172a', fontSize: 11, fontWeight: 700 }
export const KPI_REPORTS_PIE_STROKE = '#ffffff'
export const KPI_REPORTS_PIE_STROKE_WIDTH = 3

export const kpisGradientBr =
  'bg-gradient-to-br from-[#2463eb] to-[#1d4ed8]'

export const kpisGradientR =
  'bg-gradient-to-r from-[#2463eb] to-[#1d4ed8]'
