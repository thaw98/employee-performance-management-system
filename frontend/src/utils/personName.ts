/**
 * Trim, collapse repeated spaces, and capitalize each word (e.g. "Khant ko Ko" → "Khant Ko Ko").
 */
export function toTitleCasePersonName(raw: string): string {
  const collapsed = raw.trim().replace(/\s+/g, ' ')
  if (!collapsed) return ''
  return collapsed
    .split(' ')
    .filter((w) => w.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function titleForGender(gender?: string): '' | 'U' | 'Daw' {
  if (gender === 'Male') return 'U'
  if (gender === 'Female') return 'Daw'
  return ''
}

export function withGenderTitle(raw: string, gender?: string): string {
  const normalized = toTitleCasePersonName(raw)
  if (!normalized || /^u\s/i.test(normalized) || /^daw\s/i.test(normalized)) {
    return normalized
  }
  const title = titleForGender(gender)
  return title ? `${title} ${normalized}` : normalized
}
