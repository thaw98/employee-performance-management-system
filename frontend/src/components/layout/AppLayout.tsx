import type { ReactNode } from 'react'

import { AppNavbar } from './AppNavbar'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppNavbar />
      <main>{children}</main>
    </div>
  )
}
