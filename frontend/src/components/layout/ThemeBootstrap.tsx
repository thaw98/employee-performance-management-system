import { useEffect } from 'react'
import { useAppSelector } from '../../app/hooks'
import { useGetProfileQuery } from '../../features/user/userApi'

export function ThemeBootstrap() {
  const isLoggedin = useAppSelector((state) => state.auth.isAuthenticated)
  const { data: profileResponse } = useGetProfileQuery(undefined, {
    skip: !isLoggedin
  })
  
  const theme = profileResponse?.data?.theme || 'light'
  const wallpaperUrl = profileResponse?.data?.wallpaperUrl
  const language = profileResponse?.data?.language

  useEffect(() => {
    const applyLanguage = () => {
      if (language === 'Myanmar (Burmese)') {
        if (!document.getElementById('google-translate-script')) {
          const script = document.createElement('script')
          script.id = 'google-translate-script'
          script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          document.body.appendChild(script)

          const gtScript = document.createElement('script')
          gtScript.id = 'google-translate-init'
          gtScript.innerHTML = `
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({pageLanguage: 'en', includedLanguages: 'my,en', autoDisplay: false}, 'google_translate_element');
            }
          `
          document.body.appendChild(gtScript)
          
          if (!document.getElementById('google_translate_element')) {
              const div = document.createElement('div')
              div.id = 'google_translate_element'
              div.style.display = 'none'
              document.body.appendChild(div)
          }
        }
        
        if (document.cookie.indexOf('googtrans=/en/my') === -1) {
            document.cookie = 'googtrans=/en/my; path=/; domain=' + window.location.hostname
            document.cookie = 'googtrans=/en/my; path=/; domain=localhost'
            document.cookie = 'googtrans=/en/my; path=/;'
            window.location.reload()
        }
      } else if (language) {
        if (document.cookie.indexOf('googtrans=') !== -1) {
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost'
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
            window.location.reload()
        }
      }
    }
    applyLanguage()
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
