import { useEffect } from 'react'
import { useAppSelector } from '../../app/hooks'
import { useGetProfileQuery } from '../../features/user/userApi'

export function ThemeBootstrap() {
  const isLoggedin = useAppSelector((state) => state.auth.isAuthenticated)
  const { data: profileResponse } = useGetProfileQuery(undefined, {
    skip: !isLoggedin
  })
  
  const theme = profileResponse?.data?.theme || 'light'

  useEffect(() => {
    const applyTheme = () => {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (theme === 'dark' || (theme === 'system' && isSystemDark)) {
        document.documentElement.classList.add('dark')
        document.body.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
        document.body.classList.remove('dark')
      }
    }

    applyTheme()

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => applyTheme()
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  return null
}
