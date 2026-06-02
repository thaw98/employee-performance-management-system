import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Calendar, ChevronDown, ChevronUp, Loader2, Megaphone, Plus, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import axios from '../../app/axiosInstance'
import { useGetProfileQuery } from '../../features/user/userApi'

type Priority = 'HIGH' | 'MEDIUM' | 'LOW'
type AudienceType = 'COMPANY' | 'DEPARTMENT'

type Announcement = {
  id: string
  title: string
  message: string
  audienceType: AudienceType
  departments: string[]
  priority: Priority
  createdAt: string
  shownUntil?: string
}

type DepartmentOption = {
  id: string
  name: string
}

const STORAGE_KEY = 'epms-dashboard-announcements'

const seedAnnouncements: Announcement[] = [
  {
    id: 'seed-ojt-night-owls',
    title: 'OJT Presentation Group 1',
    message: 'OJT Presentation Group 1 (Team Night Owls) showing 2 June 2026',
    audienceType: 'COMPANY',
    departments: [],
    priority: 'HIGH',
    createdAt: '2026-06-02T09:00:00.000Z',
    shownUntil: '2026-06-30',
  },
]

const priorityRank: Record<Priority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
}

const priorityStyle: Record<Priority, { badge: string; rail: string; dot: string; label: string }> = {
  HIGH: {
    badge: 'bg-red-50 text-red-700 ring-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900',
    rail: 'border-l-red-500',
    dot: 'bg-red-500',
    label: 'High Priority',
  },
  MEDIUM: {
    badge: 'bg-orange-50 text-orange-700 ring-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-900',
    rail: 'border-l-orange-500',
    dot: 'bg-orange-500',
    label: 'Medium Priority',
  },
  LOW: {
    badge: 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900',
    rail: 'border-l-blue-500',
    dot: 'bg-blue-500',
    label: 'Low Priority',
  },
}

function getStoredAnnouncements() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedAnnouncements
    const parsed = JSON.parse(raw) as Announcement[]
    return Array.isArray(parsed) ? parsed : seedAnnouncements
  } catch {
    return seedAnnouncements
  }
}

function saveAnnouncements(announcements: Announcement[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(announcements))
  window.dispatchEvent(new Event('epms-announcements-updated'))
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function getDepartmentName(raw: unknown) {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const value = row.name ?? row.departmentName
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function AnnouncementPanel() {
  const { data: profileResponse } = useGetProfileQuery()
  const user = profileResponse?.data
  const isHR = user?.roleId === 1 || String(user?.role ?? '').toUpperCase() === 'HR'
  const userDepartment = user?.departmentName?.trim()

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => getStoredAnnouncements())
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<Priority>('MEDIUM')
  const [audienceType, setAudienceType] = useState<AudienceType>('COMPANY')
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [shownUntil, setShownUntil] = useState('')
  const shownUntilInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const sync = () => setAnnouncements(getStoredAnnouncements())
    window.addEventListener('storage', sync)
    window.addEventListener('epms-announcements-updated', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('epms-announcements-updated', sync)
    }
  }, [])

  useEffect(() => {
    if (!isHR) return

    let active = true
    const loadDepartments = async () => {
      setIsLoadingDepartments(true)
      try {
        const response = await axios.get('/departments')
        const rows = response.data?.data?.content ?? response.data?.data ?? response.data ?? []
        const next = (Array.isArray(rows) ? rows : [])
          .map((row: unknown, index: number) => {
            const name = getDepartmentName(row)
            if (!name) return null
            const id = typeof row === 'object' && row !== null && 'id' in row
              ? String((row as { id?: unknown }).id ?? name)
              : `${name}-${index}`
            return { id, name }
          })
          .filter((row: DepartmentOption | null): row is DepartmentOption => Boolean(row))

        if (active) setDepartments(next)
      } catch {
        if (active) setDepartments([])
      } finally {
        if (active) setIsLoadingDepartments(false)
      }
    }

    void loadDepartments()
    return () => {
      active = false
    }
  }, [isHR])

  const visibleAnnouncements = useMemo(() => {
    const normalizedDepartment = userDepartment?.toLowerCase()
    const today = todayIsoDate()
    return announcements
      .filter((announcement) => {
        if (announcement.shownUntil && announcement.shownUntil < today) return false
        if (isHR || announcement.audienceType === 'COMPANY') return true
        if (!normalizedDepartment) return false
        return announcement.departments.some((department) => department.toLowerCase() === normalizedDepartment)
      })
      .sort((a, b) => {
        const priorityDelta = priorityRank[a.priority] - priorityRank[b.priority]
        if (priorityDelta !== 0) return priorityDelta
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [announcements, isHR, userDepartment])

  const resetForm = () => {
    setTitle('')
    setMessage('')
    setPriority('MEDIUM')
    setAudienceType('COMPANY')
    setSelectedDepartments([])
    setShownUntil('')
  }

  const handleCreate = () => {
    const trimmedTitle = title.trim()
    const trimmedMessage = message.trim()
    if (!trimmedTitle || !trimmedMessage) {
      toast.error('Announcement title and message are required.')
      return
    }
    if (!shownUntil) {
      toast.error('Select the date this announcement should be shown until.')
      return
    }
    if (shownUntil < todayIsoDate()) {
      toast.error('Shown until date cannot be in the past.')
      return
    }
    if (audienceType === 'DEPARTMENT' && selectedDepartments.length === 0) {
      toast.error('Select at least one department.')
      return
    }

    const nextAnnouncement: Announcement = {
      id: `announcement-${Date.now()}`,
      title: trimmedTitle,
      message: trimmedMessage,
      audienceType,
      departments: audienceType === 'DEPARTMENT' ? selectedDepartments : [],
      priority,
      createdAt: new Date().toISOString(),
      shownUntil,
    }

    const next = [nextAnnouncement, ...announcements]
    setAnnouncements(next)
    saveAnnouncements(next)
    resetForm()
    setIsCreateOpen(false)
    toast.success('Announcement created.')
  }

  return (
    <>
      <section className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-sm ring-1 ring-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <Megaphone size={21} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Announcements</h2>
                {visibleAnnouncements.some((announcement) => announcement.priority === 'HIGH') && (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-red-700 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900">
                    High priority pinned
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Latest company and department announcements, sorted by priority.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isHR && (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus size={16} />
                Create Announcement
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCollapsed((current) => !current)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-xs font-black text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              {isCollapsed ? 'Show' : 'Collapse'}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="max-h-80 space-y-3 overflow-y-auto p-5">
            {visibleAnnouncements.length === 0 ? (
              <div className="grid min-h-24 place-items-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/70 px-4 text-center text-sm font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
                No announcements are available for your audience.
              </div>
            ) : (
              visibleAnnouncements.map((announcement) => {
                const style = priorityStyle[announcement.priority]
                const audienceLabel = announcement.audienceType === 'COMPANY'
                  ? 'Company-wide'
                  : `Department: ${announcement.departments.join(', ')}`
                return (
                  <article
                    key={announcement.id}
                    className={`rounded-2xl border border-slate-100 border-l-4 ${style.rail} bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/80`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                          <h3 className="text-sm font-black text-slate-950 dark:text-white">{announcement.title}</h3>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
                          {announcement.message}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span>{audienceLabel}</span>
                          <span aria-hidden="true">.</span>
                          <span>{formatTimestamp(announcement.createdAt)}</span>
                          {announcement.shownUntil && (
                            <>
                              <span aria-hidden="true">.</span>
                              <span>Shown until {formatDate(announcement.shownUntil)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={`w-fit shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ring-1 ${style.badge}`}>
                        {style.label}
                      </span>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        )}
      </section>

      {isCreateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-950 dark:text-white">Create Announcement</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">Target all departments or selected departments only.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
                  placeholder="OJT Presentation Group 1"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Message</span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
                  placeholder="OJT Presentation Group 1 (Team Night Owls) showing 2 June 2026"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Audience</span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(['COMPANY', 'DEPARTMENT'] as AudienceType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAudienceType(type)}
                        className={`rounded-2xl border px-4 py-3 text-xs font-black transition ${
                          audienceType === type
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {type === 'COMPANY' ? 'Company-wide' : 'Department'}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority</span>
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as Priority)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shown Until</span>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:ring-blue-950">
                  <Calendar size={18} className="text-blue-600" />
                  <input
                    ref={shownUntilInputRef}
                    type="date"
                    min={todayIsoDate()}
                    value={shownUntil}
                    onChange={(event) => setShownUntil(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-black text-slate-800 outline-none dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = shownUntilInputRef.current
                      if (!input) return
                      if (typeof input.showPicker === 'function') input.showPicker()
                      else input.focus()
                    }}
                    className="rounded-xl bg-blue-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-blue-700 transition hover:bg-blue-100"
                  >
                    Calendar
                  </button>
                </div>
              </label>

              {audienceType === 'DEPARTMENT' && (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Departments</span>
                    {isLoadingDepartments && <Loader2 size={14} className="animate-spin text-blue-600" />}
                  </div>
                  <div className="mt-2 grid max-h-44 gap-2 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60 sm:grid-cols-2">
                    {departments.length === 0 ? (
                      <p className="col-span-full text-xs font-bold text-slate-500">
                        No departments were loaded.
                      </p>
                    ) : departments.map((department) => (
                      <label key={department.id} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={selectedDepartments.includes(department.name)}
                          onChange={(event) => {
                            setSelectedDepartments((current) => event.target.checked
                              ? [...current, department.name]
                              : current.filter((name) => name !== department.name))
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        {department.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 p-6 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
              >
                <Bell size={17} />
                Publish Announcement
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
