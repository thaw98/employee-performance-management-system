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
