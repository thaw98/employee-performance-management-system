import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, CalendarClock, ClipboardCheck, MessageSquare, Target, CheckCircle2 } from 'lucide-react'

import axios from '../../app/axiosInstance'
import { useGetMyLatestKpisQuery } from '../../features/kpi/kpiApi'
import { getNotificationSourceLabel } from '../../features/notification/notificationSourceLabels'

type MeetingItem = {
  id: number
  title: string
  scheduledTime?: string
  meetingTime?: string
  status: string
}

type ActivityItem = {
  id: number
  title: string
  message: string
  source: string
  createdAt: string
  read?: boolean
}

type AppraisalItem = {
  id: number
  status: string
}

type GoalItem = {
  id: number
  name: string
  progress: number
  color: string
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

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="grid min-h-32 place-items-center rounded-3xl border border-dashed border-blue-200 bg-blue-50/70 px-4 text-center text-sm font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
      {message}
    </div>
  )
}

export function EmployeeDashboardPage() {
  const { data: kpis = [], isLoading: isKpisLoading } = useGetMyLatestKpisQuery()
  const [meetings, setMeetings] = useState<MeetingItem[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [appraisals, setAppraisals] = useState<AppraisalItem[]>([])
  const [goals, setGoals] = useState<GoalItem[]>([])
  const [meetingError, setMeetingError] = useState('')
  const [activityError, setActivityError] = useState('')
  const [appraisalError, setAppraisalError] = useState('')
  const [goalsError, setGoalsError] = useState('')

  useEffect(() => {
    let active = true
    const meetingStatuses = 'PENDING,ACCEPTED,RESCHEDULE_REQUESTED,RESCHEDULE_MGR,CANCEL_REQUESTED,ONGOING'

    const loadDashboard = async () => {
      const [meetingResult, activityResult, appraisalResult] = await Promise.allSettled([
        axios.get(`/meetings/employee?statuses=${meetingStatuses}&page=0&size=5&sortBy=oldest`),
        axios.get('/notifications?status=all&page=0&size=8'),
        axios.get('/appraisal-assignments/my-assignments'),
      ])

      if (!active) return

      if (meetingResult.status === 'fulfilled') {
        setMeetings(meetingResult.value.data?.data?.content ?? [])
      } else {
        setMeetingError('Unable to load your upcoming meetings.')
      }

      if (activityResult.status === 'fulfilled') {
        setActivities(activityResult.value.data?.data?.content ?? [])
      } else {
        setActivityError('Unable to load recent activity.')
      }

      if (appraisalResult.status === 'fulfilled') {
        setAppraisals(appraisalResult.value.data?.data ?? [])
      } else {
        setAppraisalError('Unable to load your appraisals.')
      }

      // Set default goals data
      setGoals([
        { id: 1, name: 'Quality of Work', progress: 95, color: 'bg-emerald-500' },
        { id: 2, name: 'On-time Delivery', progress: 85, color: 'bg-blue-500' },
        { id: 3, name: 'Communication', progress: 70, color: 'bg-amber-500' },
      ])
    }

    loadDashboard()
    return () => {
      active = false
    }
  }, [])

  const submittedKpis = kpis.filter((kpi) => String(kpi.status ?? '').toUpperCase() === 'SUBMITTED')
  const averageKpiScore = useMemo(() => {
    const scored = kpis
      .map((kpi) => Number(kpi.weightedScore ?? kpi.score ?? 0))
      .filter((value) => Number.isFinite(value) && value > 0)
    if (scored.length === 0) return 0
    return Math.round(scored.reduce((sum, value) => sum + value, 0) / scored.length)
  }, [kpis])

  const pendingAppraisals = appraisals.filter((item) => ['DRAFT', 'PENDING_MANAGER', 'RETURNED', 'SUBMITTED'].includes(String(item.status).toUpperCase())).length

  return (
    <div className="min-h-full space-y-6 bg-[#f5f9ff] text-slate-900 dark:bg-slate-950 dark:text-white">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">My Dashboard</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Track your KPIs, appraisals, meetings, and latest performance activity.</p>
        </div>
        <Link to="/employee/my-kpis" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 dark:shadow-none">
          <Target size={18} /> View My KPIs
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'My KPI Score', value: isKpisLoading ? '-' : `${averageKpiScore}%`, helper: `${formatNumber(kpis.length)} KPI records`, icon: Target, tone: 'bg-blue-50 text-blue-700' },
          { label: 'Submitted KPIs', value: formatNumber(submittedKpis.length), helper: 'Current/latest records', icon: ClipboardCheck, tone: 'bg-emerald-50 text-emerald-700' },
          { label: 'Pending Appraisals', value: appraisalError ? '-' : formatNumber(pendingAppraisals), helper: appraisalError || 'Require attention', icon: MessageSquare, tone: 'bg-amber-50 text-amber-700' },
          { label: 'Upcoming Meetings', value: meetingError ? '-' : formatNumber(meetings.length), helper: meetingError || 'Scheduled with manager', icon: CalendarClock, tone: 'bg-cyan-50 text-cyan-700' },
        ].map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm ring-1 ring-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
                  <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{card.value}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{card.helper}</p>
                </div>
                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${card.tone}`}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          )
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm ring-1 ring-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Goals Progress</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">Track your goal completion status</p>
              </div>
              <CheckCircle2 className="text-blue-600" size={22} />
            </div>
            <div className="mt-5 space-y-5">
              {goals.length ? (
                goals.map((goal) => (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-sm font-black text-slate-950 dark:text-white">{goal.name}</span>
                      <span className="text-xs font-black text-slate-500">{goal.progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full ${goal.color} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyPanel message="No goals are available yet." />
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm ring-1 ring-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">Meeting Schedule</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">Upcoming meetings involving you</p>
            <div className="mt-5 space-y-3">
              {meetingError ? (
                <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{meetingError}</div>
              ) : meetings.length === 0 ? (
                <EmptyPanel message="You have no upcoming meetings." />
              ) : meetings.map((meeting) => {
                const dateValue = meeting.scheduledTime || meeting.meetingTime
                return (
                  <Link key={meeting.id} to={`/employee/meetings/${meeting.id}`} className="grid gap-3 rounded-2xl border border-blue-50 bg-blue-50/60 p-4 transition hover:bg-blue-50 sm:grid-cols-[1fr_auto] sm:items-center dark:border-slate-800 dark:bg-slate-800">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950 dark:text-white">{meeting.title}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{formatDate(dateValue)} at {formatTime(dateValue)}</p>
                    </div>
                    <span className="w-fit rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700 shadow-sm dark:bg-slate-900">{meeting.status}</span>
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
              <p className="mt-1 text-xs font-semibold text-slate-500">Latest performance notifications</p>
            </div>
            <Activity className="text-blue-600" size={22} />
          </div>
          <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {activityError ? (
              <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{activityError}</div>
            ) : activities.length === 0 ? (
              <EmptyPanel message="No recent activity is available." />
            ) : activities.map((activity) => (
              <Link key={activity.id} to="/employee/notifications" className="block rounded-2xl border border-blue-50 bg-blue-50/50 p-4 transition hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-black text-slate-950 dark:text-white">{activity.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{activity.message}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest ${activity.read ? 'bg-slate-100 text-slate-500' : 'bg-blue-600 text-white'}`}>
                    {activity.read ? 'Read' : 'New'}
                  </span>
                </div>
                <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">{getNotificationSourceLabel(activity.source)} · {formatDate(activity.createdAt)} {formatTime(activity.createdAt)}</p>
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </div>
  )
}
