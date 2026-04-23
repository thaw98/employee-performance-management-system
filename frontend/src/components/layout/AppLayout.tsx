import type { ReactNode } from 'react'

import { AppNavbar } from './AppNavbar'
import { AppSidebar } from './AppSidebar'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <AppNavbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
