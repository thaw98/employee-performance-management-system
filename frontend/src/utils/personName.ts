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
