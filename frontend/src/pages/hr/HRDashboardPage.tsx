import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Building2,
  CalendarClock,
  ClipboardCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'

import axios from '../../app/axiosInstance'
import { AnnouncementPanel } from '../../components/dashboard/AnnouncementPanel'
import { getNotificationSourceLabel } from '../../features/notification/notificationSourceLabels'
import { usePermissionState } from '../../features/permission'

type NameValue = {
  name: string
  value: number
}

type HrDashboardSummary = {
  overview: {
    totalEmployees: number
    activeEmployees: number
    departments: number
    employeesInAppraisalCycle: number
    upcomingMeetings: number
  }
  visuals: {
    employeeDistributionByDepartment: NameValue[]
    appraisalCompletion?: {
      total: number
      completed: number
      pending: number
      overdue: number
      percentage: number
    }
    selfAssessmentSubmissionStatus?: {
      total: number
      submitted: number
      pending: number
      overdue: number
      percentage: number
    }
    pipStatusOverview?: NameValue[]
  }
}

type MeetingItem = {
  id: number
  title: string
  scheduledTime?: string
  meetingTime?: string
  status: string
  meetingGroupKey?: string | null
  meetingScope?: string | null
  departmentName?: string | null
}

type ActivityItem = {
  id: number
  title: string
  message: string
  source: string
  createdAt: string
  read?: boolean
}

type SummaryCard = {
  label: string
  value: string
  helper: string
  icon: LucideIcon
  tone: string
  to?: string
}

const formatNumber = (value: number | undefined) => new Intl.NumberFormat().format(value ?? 0)

const formatDate = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

const isDepartmentMeeting = (meeting: MeetingItem) => String(meeting.meetingScope ?? '').toUpperCase() === 'DEPARTMENT'

const getMeetingCardKey = (meeting: MeetingItem) => {
  const dateValue = meeting.scheduledTime || meeting.meetingTime || ''
  if (!isDepartmentMeeting(meeting)) return `meeting-${meeting.id}`
  return meeting.meetingGroupKey || `department-${meeting.departmentName || 'all'}-${meeting.title}-${dateValue}`
}

const getDashboardMeetingCards = (rows: MeetingItem[]) => Array.from(
  new Map(rows.map((meeting) => [getMeetingCardKey(meeting), meeting])).values(),
)

const getMeetingAudienceLabel = (meeting: MeetingItem) => (
  isDepartmentMeeting(meeting) ? `For department: ${meeting.departmentName || 'Department'}` : null
)

function LoadingState() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="h-16 w-72 rounded-3xl bg-blue-100" />
        <div className="h-12 w-44 rounded-2xl bg-blue-100" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="h-[560px] rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-[560px] rounded-3xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  )
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="grid min-h-36 place-items-center rounded-3xl border border-dashed border-blue-200 bg-blue-50/70 px-4 text-center text-sm font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
      {message}
    </div>
  )
}

function SummaryCardContent({ card }: { card: SummaryCard }) {
  const Icon = card.icon
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
          <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{card.value}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{card.helper}</p>
        </div>
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${card.tone}`}>
          <Icon size={22} />
        </div>
      </div>
    </>
  )
}

function SummaryCardView({ card }: { card: SummaryCard }) {
  return (
    <Link to={card.to || '#'} className="rounded-3xl border border-white/80 bg-white p-5 text-left shadow-sm ring-1 ring-blue-50 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800">
      <SummaryCardContent card={card} />
    </Link>
  )
}

const UPCOMING_MEETING_STATUSES = 'PENDING,ACCEPTED,RESCHEDULE_REQUESTED,RESCHEDULE_MGR,CANCEL_REQUESTED,ONGOING'

export function HRDashboardPage() {
  const { isReady, canViewMeetings } = usePermissionState()
  const [summary, setSummary] = useState<HrDashboardSummary | null>(null)
  const [meetings, setMeetings] = useState<MeetingItem[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [summaryError, setSummaryError] = useState('')
  const [meetingError, setMeetingError] = useState('')
  const [activityError, setActivityError] = useState('')

  useEffect(() => {
    if (!isReady) return

    let active = true

    const loadDashboard = async () => {
      setIsLoading(true)
      setSummaryError('')
      setMeetingError('')
      setActivityError('')

      const showMeetings = canViewMeetings()
      const requests: Promise<any>[] = [
        axios.get('/hr/dashboard'),
        axios.get('/notifications?status=all&page=0&size=10'),
      ]
      if (showMeetings) {
        requests.splice(
          1,
          0,
          axios.get(`/meetings/manager?statuses=${UPCOMING_MEETING_STATUSES}&page=0&size=8&sortBy=oldest`),
          axios.get(`/meetings/employee?statuses=${UPCOMING_MEETING_STATUSES}&page=0&size=8&sortBy=oldest`),
        )
      }

      const results = await Promise.allSettled(requests)
      const summaryResult = results[0]
      const managerMeetingsResult = showMeetings ? results[1] : null
      const employeeMeetingsResult = showMeetings ? results[2] : null
      const activityResult = results[showMeetings ? 3 : 1]

      if (!active) return

      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value.data?.data ?? null)
      } else {
        const reason = summaryResult.reason as { response?: { data?: { message?: string } } }
        setSummaryError(reason?.response?.data?.message || 'Unable to load HR dashboard summary.')
      }

      if (showMeetings) {
        const loadedMeetings: MeetingItem[] = []
        if (managerMeetingsResult?.status === 'fulfilled' && managerMeetingsResult.value.data?.success !== false) {
          loadedMeetings.push(...(managerMeetingsResult.value.data?.data?.content ?? []))
        }
        if (employeeMeetingsResult?.status === 'fulfilled' && employeeMeetingsResult.value.data?.success !== false) {
          loadedMeetings.push(...(employeeMeetingsResult.value.data?.data?.content ?? []))
        }
        if (managerMeetingsResult?.status === 'rejected' && employeeMeetingsResult?.status === 'rejected') {
          const reason = managerMeetingsResult.reason as { response?: { data?: { message?: string } } }
          setMeetingError(reason?.response?.data?.message || 'Unable to load your upcoming meetings.')
        }
        setMeetings(
          getDashboardMeetingCards(loadedMeetings)
            .sort((a, b) => new Date(a.scheduledTime || a.meetingTime || '').getTime() - new Date(b.scheduledTime || b.meetingTime || '').getTime())
            .slice(0, 5),
        )
      } else {
        setMeetings([])
      }

      if (activityResult.status === 'fulfilled') {
        setActivities(activityResult.value.data?.data?.content ?? [])
      } else {
        const reason = activityResult.reason as { response?: { data?: { message?: string } } }
        setActivityError(reason?.response?.data?.message || 'Unable to load recent activity.')
      }

      setIsLoading(false)
    }

    loadDashboard()
    return () => {
      active = false
    }
  }, [isReady, canViewMeetings])

  const summaryCards: SummaryCard[] = [
    {
      label: 'Total Employees',
      value: formatNumber(summary?.overview.totalEmployees),
      helper: `${formatNumber(summary?.overview.activeEmployees)} active employees`,
      icon: Users,
      tone: 'bg-blue-50 text-blue-700',
      to: '/hr/employees',
    },
    {
      label: 'Total Departments',
      value: formatNumber(summary?.overview.departments),
      helper: 'Organization units',
      icon: Building2,
      tone: 'bg-cyan-50 text-cyan-700',
      to: '/hr/departments',
    },
    {
      label: 'Upcoming Meetings',
      value: formatNumber(meetings.length),
      helper: 'Involving your HR account',
      icon: CalendarClock,
      tone: 'bg-violet-50 text-violet-700',
      to: '/hr/meetings',
    },
    {
      label: 'Active Appraisals',
      value: formatNumber(summary?.overview.employeesInAppraisalCycle),
      helper: `${summary?.visuals.appraisalCompletion?.percentage ?? 0}% completion`,
      icon: ClipboardCheck,
      tone: 'bg-emerald-50 text-emerald-700',
      to: '/hr/appraisals/submissions',
    },
  ]

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <div className="min-h-full space-y-6 bg-[#f5f9ff] p-0 text-slate-900 dark:bg-slate-950 dark:text-white">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">HR Dashboard</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Welcome back. Here is a clear snapshot of your people, meetings, activity, and performance workspace.
          </p>
        </div>
      </section>

      <AnnouncementPanel />

      {summaryError ? (
        <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
          {summaryError}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => <SummaryCardView key={card.label} card={card} />)}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm ring-1 ring-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">HR Performance Overview</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">High-level progress from appraisal, self-assessment, and PIP records</p>
              </div>
              <Activity className="text-emerald-600" size={22} />
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { label: 'Appraisal Completion', value: summary?.visuals.appraisalCompletion?.percentage ?? 0, helper: `${formatNumber(summary?.visuals.appraisalCompletion?.completed)} completed`, color: 'bg-blue-600' },
                { label: 'Self-Assessments', value: summary?.visuals.selfAssessmentSubmissionStatus?.percentage ?? 0, helper: `${formatNumber(summary?.visuals.selfAssessmentSubmissionStatus?.pending)} pending`, color: 'bg-amber-500' },
                { label: 'PIP Records', value: Math.min((summary?.visuals.pipStatusOverview ?? []).reduce((total, item) => total + item.value, 0) * 10, 100), helper: `${formatNumber((summary?.visuals.pipStatusOverview ?? []).reduce((total, item) => total + item.value, 0))} total plans`, color: 'bg-rose-500' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-800 dark:text-white">{item.label}</p>
                    <span className="text-sm font-black text-slate-500">{item.value}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white dark:bg-slate-900">
                    <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">{item.helper}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm ring-1 ring-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Meeting Schedule</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">Upcoming meetings involving the logged-in HR user</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  to="/hr/meetings?section=schedule"
                  className="text-xs font-black uppercase tracking-widest text-blue-600 transition hover:underline"
                >
                  View All
                </Link>
                <CalendarClock className="text-blue-600" size={22} />
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {meetingError ? (
                <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{meetingError}</div>
              ) : meetings.length === 0 ? (
                <EmptyPanel message="You have no upcoming meetings." />
              ) : meetings.map((meeting) => {
                const dateValue = meeting.scheduledTime || meeting.meetingTime
                const audienceLabel = getMeetingAudienceLabel(meeting)
                return (
                  <Link key={meeting.id} to={`/hr/meetings/${meeting.id}`} className="grid gap-3 rounded-2xl border border-blue-50 bg-blue-50/60 p-4 transition hover:bg-blue-50 sm:grid-cols-[1fr_auto] sm:items-center dark:border-slate-800 dark:bg-slate-800">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950 dark:text-white">{meeting.title}</p>
                      {audienceLabel && <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-blue-600">{audienceLabel}</p>}
                      <p className="mt-1 text-xs font-semibold text-slate-500">{formatDate(dateValue)} at {formatTime(dateValue)}</p>
                    </div>
                    <span className="w-fit rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700 shadow-sm dark:bg-slate-900">
                      {meeting.status}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        <aside className="flex max-h-[520px] flex-col overflow-hidden rounded-3xl border border-white/80 bg-white p-5 shadow-sm ring-1 ring-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Recent Activity</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">Latest HR and performance notifications</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Link
                to="/hr/notifications"
                className="text-xs font-black uppercase tracking-widest text-blue-600 transition hover:underline"
              >
                View All
              </Link>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                <Activity size={20} />
              </div>
            </div>
          </div>
          <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {activityError ? (
              <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{activityError}</div>
            ) : activities.length === 0 ? (
              <EmptyPanel message="No recent activity is available." />
            ) : activities.map((activity) => (
              <Link key={activity.id} to="/hr/notifications" className="block rounded-2xl border border-blue-50 bg-blue-50/50 p-4 transition hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="wrap-break-word text-sm font-black text-slate-950 dark:text-white">{activity.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{activity.message}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest ${activity.read ? 'bg-slate-100 text-slate-500' : 'bg-blue-600 text-white'}`}>
                    {activity.read ? 'Read' : 'New'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700 dark:bg-slate-900">
                    {getNotificationSourceLabel(activity.source)}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {formatDate(activity.createdAt)} {formatTime(activity.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </section>

    </div>
  )
}