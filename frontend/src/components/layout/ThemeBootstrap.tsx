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
  isMyanmarLanguage,
  retryGoogleTranslateSelection,
  saveLanguagePreference,
} from '../../utils/googleTranslatePreference'

export function ThemeBootstrap() {
  const location = useLocation()
  const isLoggedin = useAppSelector((state) => state.auth.isAuthenticated)
  const { data: profileResponse } = useGetProfileQuery(undefined, {
    skip: !isLoggedin
  })
  
  const theme = profileResponse?.data?.theme || 'light'
  const wallpaperUrl = profileResponse?.data?.wallpaperUrl
  const language = profileResponse?.data?.language || getSavedLanguagePreference()

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
        if (document.cookie.includes('googtrans=')) {
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
    const applyTheme = () => {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
      document.body.style.backgroundImage = ''
      document.body.style.backgroundSize = ''
      document.body.style.backgroundPosition = ''
      document.body.style.backgroundAttachment = ''

      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
        document.body.classList.add('dark')
      } else if (theme === 'wallpaper' && wallpaperUrl) {
        document.body.style.backgroundImage = `linear-gradient(rgba(248, 250, 252, 0.40), rgba(248, 250, 252, 0.40)), url("${wallpaperUrl}")`
        document.body.style.backgroundSize = 'cover'
        document.body.style.backgroundPosition = 'center'
        document.body.style.backgroundAttachment = 'fixed'
      }
    }

    applyTheme()
  }, [theme, wallpaperUrl])

  return null
}
