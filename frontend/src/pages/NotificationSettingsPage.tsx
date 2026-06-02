import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, Check, ChevronRight, Loader2, Lock, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useGetProfileQuery } from '../features/user/userApi'

const configurableNotifications = [
  'KPI Assigned',
  'KPI Updated',
  'KPI Evaluation Reminder',
  'KPI Due Date Reminder',
  'KPI Approval Status',
  'New Feedback Received',
  'Feedback Response Received',
  'Feedback Request Reminder',
  'Appraisal Created',
  'Appraisal Submission Reminder',
  'Appraisal Approval Status',
  'PIP Assigned',
  'PIP Follow-Up Reminder',
  'PIP Status Updates',
  'System Announcements',
  'HR Announcements',
  'Training Announcements',
] as const

const mandatoryNotifications = [
  'New Performance Cycle Started',
  'KPI Submission Required',
  'Feedback Submission Required',
  'Appraisal Submission Required',
  'PIP Action Required',
  'Account Security Alerts',
  'Password Change Confirmation',
  'Login from New Device',
  'Role or Permission Changes',
] as const

type ConfigurableNotification = typeof configurableNotifications[number]
type NotificationPreferences = Record<ConfigurableNotification, boolean>

const defaultPreferences = configurableNotifications.reduce((prefs, notification) => {
  prefs[notification] = true
  return prefs
}, {} as NotificationPreferences)

function getRolePrefix(pathname: string) {
  if (pathname.startsWith('/manager')) return '/manager'
  if (pathname.startsWith('/employee')) return '/employee'
  if (pathname.startsWith('/audit')) return '/audit'
  return '/hr'
}

function Toggle({
  checked,
  disabled = false,
  onChange,
  label,
}: {
  checked: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#2463eb]/25 ${
        checked
          ? disabled
            ? 'bg-emerald-200 dark:bg-emerald-900/45'
            : 'bg-[#2463eb]'
          : 'bg-slate-200 dark:bg-slate-700'
      } ${disabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      >
        {disabled && <Lock size={10} className="text-emerald-600" />}
      </span>
    </button>
  )
}

export function NotificationSettingsPage() {
  const location = useLocation()
  const { data: profileResponse } = useGetProfileQuery()
  const rolePrefix = getRolePrefix(location.pathname)
  const storageKey = useMemo(() => {
    const userId = profileResponse?.data?.id ?? profileResponse?.data?.email ?? 'current-user'
    return `epms-notification-preferences:${userId}`
  }, [profileResponse?.data?.email, profileResponse?.data?.id])

  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [savedPreferences, setSavedPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey)
      if (!saved) {
        setPreferences(defaultPreferences)
        setSavedPreferences(defaultPreferences)
        return
      }

      const parsed = JSON.parse(saved) as Partial<NotificationPreferences>
      const normalized = configurableNotifications.reduce((prefs, notification) => {
        prefs[notification] = parsed[notification] ?? true
        return prefs
      }, {} as NotificationPreferences)

      setPreferences(normalized)
      setSavedPreferences(normalized)
    } catch {
      setPreferences(defaultPreferences)
      setSavedPreferences(defaultPreferences)
    }
  }, [storageKey])

  const hasChanges = configurableNotifications.some(
    (notification) => preferences[notification] !== savedPreferences[notification]
  )

  const enabledCount = configurableNotifications.filter((notification) => preferences[notification]).length

  const handleSave = () => {
    setIsSaving(true)
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(preferences))
      setSavedPreferences(preferences)
      toast.success('Notification settings saved.')
    } catch {
      toast.error('Failed to save notification settings.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <nav className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          <Link to={`${rolePrefix}/settings/system`} className="transition-colors hover:text-[#2463eb] dark:hover:text-[#60a5fa]">
            System Settings
          </Link>
          <ChevronRight size={14} />
          <span className="text-slate-600 dark:text-slate-300">Notification Settings</span>
        </nav>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Notification Settings</h1>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              Manage optional notification preferences while keeping critical alerts always enabled.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-600 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800">
            <Bell size={16} className="text-[#2463eb]" />
            {enabledCount} of {configurableNotifications.length} optional on
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-6 dark:border-slate-800 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dbeafe] text-[#2463eb] dark:bg-[#2463eb]/20 dark:text-[#60a5fa]">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-200">Configurable Notifications</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Turn optional alerts on or off.</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {configurableNotifications.map((notification) => (
              <div key={notification} className="flex min-h-16 items-center justify-between gap-4 px-6 py-4 sm:px-8">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{notification}</p>
                  <p className={`mt-1 text-[11px] font-black uppercase tracking-widest ${preferences[notification] ? 'text-[#2463eb]' : 'text-slate-400'}`}>
                    {preferences[notification] ? 'On' : 'Off'}
                  </p>
                </div>
                <Toggle
                  checked={preferences[notification]}
                  label={`${notification} notification`}
                  onChange={(checked) => setPreferences((current) => ({ ...current, [notification]: checked }))}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-6 dark:border-slate-800 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-200">Mandatory Notifications</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Critical alerts remain enabled.</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {mandatoryNotifications.map((notification) => (
              <div key={notification} className="flex min-h-16 items-center justify-between gap-4 px-6 py-4 sm:px-8">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{notification}</p>
                  <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    <Check size={12} />
                    Always On
                  </div>
                </div>
                <Toggle checked disabled label={`${notification} notification is always on`} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#2463eb] px-8 py-3 text-sm font-black text-white shadow-lg shadow-[#2463eb]/25 transition-all hover:-translate-y-0.5 hover:bg-[#1d4ed8] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Notification Settings
        </button>
      </div>
    </div>
  )
}
