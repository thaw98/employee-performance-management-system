import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppSelector } from '../../app/hooks'
import { useGetProfileQuery } from '../../features/user/userApi'
import {
  applyGoogleTranslateCookie,
  applyLanguageFont,
  ensureGoogleTranslateWidget,
  getSavedLanguagePreference,
  hasGoogleTranslateCookie,
  isGoogleTranslateActive,
  isMyanmarLanguage,
  retryGoogleTranslateSelection,
  saveLanguagePreference,
  setGoogleTranslateWidgetVisible,
} from '../../utils/googleTranslatePreference'
import { applyThemePreference, normalizeThemePreference } from '../../utils/themePreference'

export function ThemeBootstrap() {
  const location = useLocation()
  const isLoggedin = useAppSelector((state) => state.auth.isAuthenticated)
  const { data: profileResponse } = useGetProfileQuery(undefined, {
    skip: !isLoggedin
  })
  
  const theme = normalizeThemePreference(profileResponse?.data?.theme)
  const wallpaperUrl = profileResponse?.data?.wallpaperUrl
  const language = profileResponse?.data?.language || getSavedLanguagePreference()

  useEffect(() => {
    setGoogleTranslateWidgetVisible(false)
  }, [])

  useEffect(() => {
    const applyLanguage = () => {
      const isMyanmar = isMyanmarLanguage(language)
      const normalizedLanguage = isMyanmar ? 'Myanmar' : 'English'
      applyLanguageFont(normalizedLanguage)
      if (language) {
        saveLanguagePreference(normalizedLanguage)
      }

      if (isMyanmar) {
        ensureGoogleTranslateWidget()
        
        if (!hasGoogleTranslateCookie('Myanmar')) {
            applyGoogleTranslateCookie('Myanmar')
            window.location.reload()
            return
        }
        retryGoogleTranslateSelection('Myanmar')
      } else if (language) {
        ensureGoogleTranslateWidget()

        if (isGoogleTranslateActive()) {
          applyGoogleTranslateCookie('English')
          window.location.reload()
          return
        }

        retryGoogleTranslateSelection('English')
      }
    }
    applyLanguage()
  }, [language])

  useEffect(() => {
    if (!isMyanmarLanguage(language)) return

    retryGoogleTranslateSelection('Myanmar')
    const delayedRetries = [
      window.setTimeout(() => retryGoogleTranslateSelection('Myanmar', 4), 750),
      window.setTimeout(() => retryGoogleTranslateSelection('Myanmar', 4), 1800),
    ]

    return () => {
      delayedRetries.forEach(window.clearTimeout)
    }
  }, [language, location.pathname, location.search])

  useEffect(() => {
    if (!isMyanmarLanguage(language)) return

    let timeoutId: number | null = null
    const observer = new MutationObserver(() => {
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
      timeoutId = window.setTimeout(() => {
        retryGoogleTranslateSelection('Myanmar', 3)
      }, 350)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [language])

  useEffect(() => {
    applyThemePreference(theme, { wallpaperUrl })
  }, [theme, wallpaperUrl])

  return null
}
