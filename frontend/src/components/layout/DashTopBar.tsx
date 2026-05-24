import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { NotificationBell } from '../common/NotificationBell'
import { ProfileDropdown } from './ProfileDropdown'
import { getDashPageTitle } from './dashPageTitle'

interface DashTopBarProps {
  onToggleSidebar: () => void
  searchPlaceholder?: string
}

export function DashTopBar({ onToggleSidebar, searchPlaceholder = 'Organizational search...' }: DashTopBarProps) {
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
    <header className="top-bar sticky top-0 z-20 bg-white border-b border-[#e2e8f0] print:hidden">
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
        <div className="top-bar-search hidden md:block">
          <i className="bi bi-search" />
          <input type="text" placeholder={searchPlaceholder} aria-label={searchPlaceholder} />
        </div>

        <NotificationBell variant="dash" />

        <span className="top-bar-divider hidden sm:block" aria-hidden="true" />

        <ProfileDropdown variant="dash" />
      </div>
    </header>
  )
}
