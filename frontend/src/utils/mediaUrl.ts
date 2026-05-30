/** Base URL for the API (e.g. http://localhost:8080/api). */
function apiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL as string)?.replace(/\/$/, '') || 'http://localhost:8080/api'
}

/** Origin for static files (no /api suffix), e.g. http://localhost:8080 */
export function backendOrigin(): string {
  const configured = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '')
  if (configured?.startsWith('http://') || configured?.startsWith('https://')) {
    if (configured.endsWith('/api')) {
      return configured.slice(0, -4)
    }
    return configured.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'http://localhost:8080'
}

/**
 * Turns a stored media path or inline image into a URL suitable for <img src>.
 */
const PROFILE_PICTURE_FILE = /\.(png|jpe?g|gif|webp)$/i

function normalizeProfilePicturePath(pathOrUrl: string): string {
  if (
    pathOrUrl.startsWith('/api/public/profile-pictures/') ||
    pathOrUrl.startsWith('/uploads/profile-pictures/')
  ) {
    return pathOrUrl
  }
  if (PROFILE_PICTURE_FILE.test(pathOrUrl) && !pathOrUrl.includes('/')) {
    return `/uploads/profile-pictures/${pathOrUrl}`
  }
  return pathOrUrl
}

export function resolveProfilePictureSrc(pathOrUrl: string | undefined | null): string | undefined {
  if (pathOrUrl == null || pathOrUrl === '') return undefined
  const s = pathOrUrl.trim()
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  if (s.startsWith('data:')) return s
  if (/^[A-Za-z0-9+/=\s]+$/.test(s) && s.length > 120) {
    return `data:image/png;base64,${s.replace(/\s/g, '')}`
  }
  const normalized = normalizeProfilePicturePath(s)
  if (normalized.startsWith('/')) return `${backendOrigin()}${normalized}`
  return `${backendOrigin()}/${normalized}`
}

export function resolveMediaSrc(pathOrUrl: string | undefined | null): string | undefined {
  return resolveProfilePictureSrc(pathOrUrl)
}

const IMAGE_FILE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg)(\?[^#]*)?(#.*)?$/i

/**
 * True when a stored signature should render with resolveMediaSrc in an img element:
 * relative paths (e.g. /uploads/signatures/uuid.png), http(s) URLs to images, data URLs, and raw base64 blobs.
 */
export function isImageLikeMediaRef(value: string | undefined | null): boolean {
  if (value == null) return false
  const s = value.trim()
  if (!s) return false
  if (s.startsWith('data:image/')) return true
  if (IMAGE_FILE_EXT.test(s)) return true
  return /^[A-Za-z0-9+/=\s]+$/.test(s) && s.length > 120
}
