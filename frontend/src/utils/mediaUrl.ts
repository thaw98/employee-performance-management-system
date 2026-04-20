/** Base URL for the API (e.g. http://localhost:8080/api). */
function apiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL as string)?.replace(/\/$/, '') || 'http://localhost:8080/api'
}

/** Origin for static files (no /api suffix), e.g. http://localhost:8080 */
export function backendOrigin(): string {
  const base = apiBaseUrl()
  if (base.endsWith('/api')) {
    return base.slice(0, -4)
  }
  return base.replace(/\/$/, '')
}

/**
 * Turns a stored profile picture path (e.g. /api/public/profile-pictures/uuid.png) into a full URL for <img src>.
 */
export function resolveProfilePictureSrc(pathOrUrl: string | undefined | null): string | undefined {
  if (pathOrUrl == null || pathOrUrl === '') return undefined
  const s = pathOrUrl.trim()
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  if (s.startsWith('/')) return `${backendOrigin()}${s}`
  return `${backendOrigin()}/${s}`
}
