import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, CalendarClock, ClipboardCheck, PenLine, Target, Users } from 'lucide-react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import axios from '../../app/axiosInstance'
import { useGetManagerTeamQuery } from '../../features/kpi/kpiApi'
import { useGetDefaultSignatureQuery } from '../../features/user/userApi'

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

type TeamKpiSummary = {
  employeeId: number
  employeeName: string
  kpiCount: number
  submittedCount: number
  averageScore: number
}

const chartColors = ['#2563eb', '#06b6d4', '#8b5cf6', '#10b981', '#f97316', '#ec4899']

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

export function ManagerDashboardPage() {
  const { data: teamData = [], isLoading: isTeamLoading } = useGetManagerTeamQuery()
  const { data: defaultSigResponse, isLoading: isDefaultSigLoading } = useGetDefaultSignatureQuery()
  const [meetings, setMeetings] = useState<MeetingItem[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [teamKpis, setTeamKpis] = useState<TeamKpiSummary[]>([])
  const [meetingError, setMeetingError] = useState('')
  const [activityError, setActivityError] = useState('')
  const [kpiError, setKpiError] = useState('')
  const hasDefaultSignature = Boolean(defaultSigResponse?.data)

  useEffect(() => {
    let active = true
    const meetingStatuses = 'PENDING,ACCEPTED,RESCHEDULE_REQUESTED,RESCHEDULE_MGR,CANCEL_REQUESTED,ONGOING'

    const loadDashboard = async () => {
      const [meetingResult, activityResult] = await Promise.allSettled([
        axios.get(`/meetings/manager?statuses=${meetingStatuses}&page=0&size=5&sortBy=oldest`),
        axios.get('/notifications?status=all&page=0&size=8'),
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
    }

    loadDashboard()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadTeamKpis = async () => {
      setKpiError('')
      if (teamData.length === 0) {
        setTeamKpis([])
        return
      }

      const results = await Promise.allSettled(
        teamData.map(async (member) => {
          const response = await axios.get(`/kpis/latest/${member.id}`)
          const kpis = response.data ?? []
          const scores = kpis
            .map((kpi: any) => Number(kpi.weightedScore ?? kpi.score ?? 0))
            .filter((value: number) => Number.isFinite(value) && value > 0)
          return {
            employeeId: member.id,
            employeeName: member.name,
            kpiCount: kpis.length,
            submittedCount: kpis.filter((kpi: any) => String(kpi.status ?? '').toUpperCase() === 'SUBMITTED').length,
            averageScore: scores.length ? Math.round(scores.reduce((sum: number, value: number) => sum + value, 0) / scores.length) : 0,
          }
        }),
      )

      if (!active) return

      const fulfilled = results
        .filter((result): result is PromiseFulfilledResult<TeamKpiSummary> => result.status === 'fulfilled')
        .map((result) => result.value)

      if (fulfilled.length !== teamData.length) {
        setKpiError('Some team KPI records could not be loaded.')
      }
      setTeamKpis(fulfilled)
    }

    loadTeamKpis()
    return () => {
      active = false
    }
  }, [teamData])

  const teamAverage = useMemo(() => {
    const scored = teamKpis.map((item) => item.averageScore).filter((value) => value > 0)
    if (scored.length === 0) return 0
    return Math.round(scored.reduce((sum, value) => sum + value, 0) / scored.length)
  }, [teamKpis])

  const submittedKpiCount = teamKpis.reduce((sum, item) => sum + item.submittedCount, 0)
  const totalKpiCount = teamKpis.reduce((sum, item) => sum + item.kpiCount, 0)

  return (
    <div className="min-h-full space-y-6 bg-[#f5f9ff] text-slate-900 dark:bg-slate-950 dark:text-white">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">Manager Dashboard</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Monitor your team KPIs, meetings, and latest performance activity.</p>
        </div>
        <Link to="/manager/settings/signature" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 dark:shadow-none">
          <PenLine size={18} /> Signature Settings
        </Link>
      </section>

      {!isDefaultSigLoading && !hasDefaultSignature && (
        <div className="flex flex-col gap-4 rounded-3xl border border-amber-200 bg-amber-50/90 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-slate-100">Set up your signature</p>
              <p className="mt-1 max-w-xl text-xs font-medium text-slate-600 dark:text-slate-400">
                A default signature is required for self-assessment reviews and approvals.
              </p>
            </div>
          </div>
          <Link to="/manager/settings/signature" className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-black text-white transition-opacity hover:opacity-90 dark:bg-slate-100 dark:text-slate-900">
            <PenLine size={14} /> Open signature settings
          </Link>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Team Size', value: isTeamLoading ? '-' : formatNumber(teamData.length), helper: 'Direct reports', icon: Users, tone: 'bg-blue-50 text-blue-700' },
          { label: 'Upcoming Meetings', value: meetingError ? '-' : formatNumber(meetings.length), helper: meetingError || 'Scheduled with team', icon: CalendarClock, tone: 'bg-cyan-50 text-cyan-700' },
          { label: 'Team Avg Score', value: `${teamAverage}%`, helper: 'Latest KPI average', icon: Target, tone: 'bg-emerald-50 text-emerald-700' },
          { label: 'Submitted KPIs', value: formatNumber(submittedKpiCount), helper: `${formatNumber(totalKpiCount)} total KPI records`, icon: ClipboardCheck, tone: 'bg-amber-50 text-amber-700' },
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
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Team KPI Distribution</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">Latest average KPI score by team member</p>
              </div>
              <Target className="text-blue-600" size={22} />
            </div>
            {kpiError ? <p className="mt-3 text-xs font-bold text-amber-600">{kpiError}</p> : null}
            <div className="mt-5 h-[420px]">
              {teamKpis.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamKpis.map((item) => ({ name: item.employeeName, value: item.averageScore }))} layout="vertical" margin={{ left: 12, right: 28 }}>
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={24}>
                      {teamKpis.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyPanel message={isTeamLoading ? 'Loading team KPI data...' : 'No team KPI data is available yet.'} />
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
                  <Link key={meeting.id} to={`/manager/meetings/${meeting.id}`} className="grid gap-3 rounded-2xl border border-blue-50 bg-blue-50/60 p-4 transition hover:bg-blue-50 sm:grid-cols-[1fr_auto] sm:items-center dark:border-slate-800 dark:bg-slate-800">
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
              <p className="mt-1 text-xs font-semibold text-slate-500">Latest team and performance notifications</p>
            </div>
            <Activity className="text-blue-600" size={22} />
          </div>
          <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {activityError ? (
              <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{activityError}</div>
            ) : activities.length === 0 ? (
              <EmptyPanel message="No recent activity is available." />
            ) : activities.map((activity) => (
              <Link key={activity.id} to="/manager/notifications" className="block rounded-2xl border border-blue-50 bg-blue-50/50 p-4 transition hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-black text-slate-950 dark:text-white">{activity.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{activity.message}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest ${activity.read ? 'bg-slate-100 text-slate-500' : 'bg-blue-600 text-white'}`}>
                    {activity.read ? 'Read' : 'New'}
                  </span>
                </div>
                <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">{activity.source} · {formatDate(activity.createdAt)} {formatTime(activity.createdAt)}</p>
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </div>
  )
}
