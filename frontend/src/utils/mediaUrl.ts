/** Base URL for the API (e.g. http://localhost:8080/api). */
function apiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL as string)?.replace(/\/$/, '') || 'http://localhost:8080/api'
}

/** Origin for static files (no /api suffix), e.g. http://localhost:8080 */
export function backendOrigin(): string {
  const base = apiBaseUrl()
  if (base.startsWith('http://') || base.startsWith('https://')) {
    if (base.endsWith('/api')) {
      return base.slice(0, -4)
    }
    return base.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return ''
}

/**
 * Turns a stored media path or inline image into a URL suitable for <img src>.
 */
export function resolveProfilePictureSrc(pathOrUrl: string | undefined | null): string | undefined {
  if (pathOrUrl == null || pathOrUrl === '') return undefined
  const s = pathOrUrl.trim()
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  if (s.startsWith('data:')) return s
  if (/^[A-Za-z0-9+/=\s]+$/.test(s) && s.length > 120) {
    return `data:image/png;base64,${s.replace(/\s/g, '')}`
  }
  if (s.startsWith('/')) return `${backendOrigin()}${s}`
  return `${backendOrigin()}/${s}`
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
