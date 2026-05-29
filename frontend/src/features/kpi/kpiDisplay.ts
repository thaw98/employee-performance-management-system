export const displayKpiUnit = (unit?: string | null) => unit?.trim() || '-'

export const displayKpiTarget = (target?: string | null, unit?: string | null) => {
  const normalizedTarget = target?.trim() || '-'
  const normalizedUnit = unit?.trim()
  return normalizedUnit ? `${normalizedTarget} ${normalizedUnit}` : normalizedTarget
}
