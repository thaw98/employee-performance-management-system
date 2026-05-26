export type ThemePreference = 'light' | 'dark' | 'wallpaper'

export const isThemePreference = (theme: unknown): theme is ThemePreference =>
  theme === 'light' || theme === 'dark' || theme === 'wallpaper'

export function normalizeThemePreference(theme: unknown): ThemePreference {
  if (isThemePreference(theme)) {
    return theme
  }
  if (typeof theme === 'string') {
    const normalized = theme.trim().toLowerCase()
    if (normalized === 'dark' || normalized === 'light' || normalized === 'wallpaper') {
      return normalized
    }
  }
  return 'light'
}

export function applyThemePreference(
  theme: ThemePreference,
  options?: { wallpaperUrl?: string | null }
) {
  const wallpaperUrl = options?.wallpaperUrl
  const root = document.documentElement

  root.classList.remove('dark', 'theme-wallpaper')
  document.body.classList.remove('dark')
  document.body.style.backgroundColor = ''
  document.body.style.backgroundImage = ''
  document.body.style.backgroundSize = ''
  document.body.style.backgroundPosition = ''
  document.body.style.backgroundAttachment = ''
  document.body.style.backgroundRepeat = ''

  if (theme === 'dark') {
    root.classList.add('dark')
    document.body.classList.add('dark')
  } else if (theme === 'wallpaper' && wallpaperUrl) {
    root.classList.add('theme-wallpaper')
    document.body.style.backgroundColor = 'transparent'
    document.body.style.backgroundImage = `linear-gradient(rgba(248, 250, 252, 0.35), rgba(248, 250, 252, 0.35)), url("${wallpaperUrl}")`
    document.body.style.backgroundSize = 'cover'
    document.body.style.backgroundPosition = 'center'
    document.body.style.backgroundAttachment = 'fixed'
    document.body.style.backgroundRepeat = 'no-repeat'
  }
}
