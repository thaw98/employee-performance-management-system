import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { NotificationBell } from '../common/NotificationBell'
import { ProfileDropdown } from './ProfileDropdown'
import { getDashPageTitle } from './dashPageTitle'

interface DashTopBarProps {
  onToggleSidebar: () => void
}

export function DashTopBar({ onToggleSidebar }: DashTopBarProps) {
  const location = useLocation()
  const [formattedDate, setFormattedDate] = useState('')

  useEffect(() => {
    const update = () => {
      setFormattedDate(
        new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(new Date()),
      )
    }
    update()
    const id = window.setInterval(update, 60_000)
    return () => window.clearInterval(id)
  }, [])

  const pageTitle = getDashPageTitle(location.pathname)

  return (
    <header className="top-bar sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-[#e2e8f0] dark:border-slate-700 print:hidden">
      <div className="top-bar-left">
        <button
          type="button"
          className="top-bar-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <i className="bi bi-list" />
        </button>
        <div className="top-bar-title-block">
          <h1 className="top-bar-page-title">{pageTitle}</h1>
          <p className="top-bar-date">{formattedDate}</p>
        </div>
      </div>

      <div className="top-bar-right">
        <NotificationBell variant="dash" />

        <span className="top-bar-divider hidden sm:block" aria-hidden="true" />

        <ProfileDropdown variant="dash" />
      </div>
    </header>
  )
}
