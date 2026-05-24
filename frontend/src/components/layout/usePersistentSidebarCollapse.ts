import { useEffect, useMemo, useState } from 'react'

type SidebarUser = {
  id?: number | string | null
  email?: string | null
  role?: string | null
  roleId?: number | string | null
}

export function usePersistentSidebarCollapse(user?: SidebarUser | null) {
  const storageKey = useMemo(() => {
    const userKey = user?.id ?? user?.email ?? `${user?.role ?? 'role'}-${user?.roleId ?? 'unknown'}`
    return `epms_sidebar_collapsed_${userKey}`
  }, [user?.email, user?.id, user?.role, user?.roleId])

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hydratedKey, setHydratedKey] = useState<string | null>(null)

  useEffect(() => {
    setIsCollapsed(localStorage.getItem(storageKey) === 'true')
    setHydratedKey(storageKey)
  }, [storageKey])

  useEffect(() => {
    if (hydratedKey !== storageKey) return
    localStorage.setItem(storageKey, String(isCollapsed))
  }, [hydratedKey, isCollapsed, storageKey])

  return {
    isSidebarCollapsed: isCollapsed,
    setIsSidebarCollapsed: setIsCollapsed,
    toggleSidebarCollapsed: () => setIsCollapsed((value) => !value),
  }
}
