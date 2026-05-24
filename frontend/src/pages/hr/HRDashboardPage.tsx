import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileText,
  MessageSquare,
  Plus,
  Send,
  Target,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import axios from '../../app/axiosInstance'
import { useGetEmployeesQuery } from '../../features/hrEmployeeList/hrEmployeeApi'
import { useGetDepartmentsKpiStatusQuery } from '../../features/kpi/kpiApi'
import { useGetPipsQuery } from '../../features/pip/pipApi'
import {
  useGetActiveCycleFormsForHrQuery,
  useGetHrReviewFormsQuery,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi'

type AppraisalAssignment = {
  id: number
  status: string
  employee?: {
    employeeName?: string
    fullName?: string
    department?: { name?: string; departmentName?: string }
  }
  evaluator?: { employeeName?: string; fullName?: string }
  period?: { name?: string; endDate?: string }
  template?: { name?: string }
  updatedAt?: string
}

type MeetingItem = {
  id: number
  title?: string
  description?: string
  employeeName?: string
  managerName?: string
  meetingTime?: string
  scheduledAt?: string
  status?: string
}

type SummaryCard = {
  label: string
  value: number
  icon: LucideIcon
  tone: string
  helper: string
  to?: string
}

const currentPeriod = new Date().toISOString().slice(0, 7)

const fallbackKpiCycles = [
  {
    name: 'Current KPI Cycle',
    team: 'Organization wide',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    progress: 64,
    status: 'ACTIVE',
  },
]

const fallbackFeedbackRows = [
  { label: 'Pending feedback requests', count: 0, status: 'Queued for HR review' },
  { label: 'Recent feedback submitted', count: 0, status: 'No recent items loaded' },
  { label: 'Feedback requiring HR review', count: 0, status: 'Clear' },
]

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatDateTime = (value?: string | null) => {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const isPendingStatus = (status?: string | null) => {
  const normalized = String(status ?? '').toUpperCase()
  return normalized.includes('PENDING') || normalized.includes('DRAFT') || normalized.includes('RETURNED')
}

const isCompletedStatus = (status?: string | null) => {
  const normalized = String(status ?? '').toUpperCase()
  return normalized.includes('APPROVED') || normalized.includes('COMPLETED') || normalized.includes('LOCKED')
}

const getStatusTone = (status?: string | null) => {
  const normalized = String(status ?? '').toUpperCase()
  if (normalized.includes('OVERDUE') || normalized.includes('RETURNED') || normalized.includes('REJECTED')) {
    return 'bg-red-50 text-red-700 border-red-100'
  }
  if (normalized.includes('PENDING') || normalized.includes('DRAFT') || normalized.includes('REQUEST')) {
    return 'bg-amber-50 text-amber-700 border-amber-100'
  }
  if (normalized.includes('ACTIVE') || normalized.includes('ACCEPTED') || normalized.includes('APPROVED') || normalized.includes('COMPLETED')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  }
  return 'bg-slate-50 text-slate-600 border-slate-100'
}

function StatusBadge({ status }: { status?: string | null }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${getStatusTone(status)}`}>
      {status || 'Pending'}
    </span>
  )
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}

function EmptyRow({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={6} className="px-4 py-8 text-center text-sm font-semibold text-slate-400">
        {message}
      </td>
    </tr>
  )
}

export function HRDashboardPage() {
  const { data: employeesResponse } = useGetEmployeesQuery({ page: 0, size: 1 })
  const { data: pips = [] } = useGetPipsQuery()
  const { data: kpiStatuses = [] } = useGetDepartmentsKpiStatusQuery({ period: currentPeriod })
  const { data: activeCycleForms } = useGetActiveCycleFormsForHrQuery()
  const { data: hrReviewForms = [] } = useGetHrReviewFormsQuery()
  const [appraisals, setAppraisals] = useState<AppraisalAssignment[]>([])
  const [meetings, setMeetings] = useState<MeetingItem[]>([])

  useEffect(() => {
    let active = true

    const loadDashboardData = async () => {
      const [appraisalResult, meetingResult] = await Promise.allSettled([
        axios.get('/appraisal-assignments'),
        axios.get('/meetings/manager?statuses=PENDING,ACCEPTED,RESCHEDULE_REQUESTED,RESCHEDULE_MGR,CANCEL_REQUESTED&page=0&size=6&sortBy=meetingTime'),
      ])

      if (!active) return

      if (appraisalResult.status === 'fulfilled') {
        setAppraisals(appraisalResult.value.data?.data || [])
      }

      if (meetingResult.status === 'fulfilled') {
        setMeetings(meetingResult.value.data?.data?.content || [])
      }
    }

    loadDashboardData()
    return () => {
      active = false
    }
  }, [])

  const employeesTotal = employeesResponse?.data?.totalElements ?? 0
  const selfAssessmentForms = activeCycleForms?.forms ?? []
  const pendingSelfAssessments = selfAssessmentForms.filter((form) => isPendingStatus(form.status))
  const pendingManagerAppraisals = appraisals.filter((item) => item.status === 'PENDING_MANAGER' || item.status === 'RETURNED')
  const completedAppraisals = appraisals.filter((item) => isCompletedStatus(item.status))
  const activePips = pips.filter((pip) => pip.status === 'ACTIVE' || pip.status === 'REOPEN_REQUESTED')
  const upcomingMeetings = meetings.filter((meeting) => !String(meeting.status ?? '').toUpperCase().includes('COMPLETED'))

  const kpiCycles = useMemo(() => {
    if (kpiStatuses.length === 0) return fallbackKpiCycles

    const definedCount = kpiStatuses.filter((item) => item.hasKpis).length
    const totalCount = Math.max(kpiStatuses.length, 1)

    return [
      {
        name: `${currentPeriod} KPI Cycle`,
        team: `${definedCount}/${totalCount} departments configured`,
        startDate: `${currentPeriod}-01`,
        endDate: `${currentPeriod}-28`,
        progress: Math.round((definedCount / totalCount) * 100),
        status: definedCount === totalCount ? 'READY' : 'ACTIVE',
      },
    ]
  }, [kpiStatuses])

  const summaryCards: SummaryCard[] = [
    { label: 'Total Employees', value: employeesTotal, icon: Users, tone: 'bg-blue-50 text-blue-700', helper: 'Active employee records', to: '/hr/employees' },
    { label: 'Pending Self-Assessments', value: pendingSelfAssessments.length, icon: ClipboardList, tone: 'bg-amber-50 text-amber-700', helper: 'Need employee action', to: '/hr/self-assessment/forms' },
    { label: 'Pending Manager Appraisals', value: pendingManagerAppraisals.length, icon: ClipboardCheck, tone: 'bg-orange-50 text-orange-700', helper: 'Awaiting manager review', to: '/hr/appraisals/submissions' },
    { label: 'Completed Appraisals', value: completedAppraisals.length, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700', helper: 'Approved or locked forms', to: '/hr/reports/appraisal' },
    { label: 'Active KPI Cycles', value: kpiCycles.filter((cycle) => cycle.status !== 'CLOSED').length, icon: Target, tone: 'bg-indigo-50 text-indigo-700', helper: 'Current KPI workstreams', to: '/hr/kpi-management' },
    { label: 'Active PIPs', value: activePips.length, icon: Zap, tone: 'bg-red-50 text-red-700', helper: 'Improvement plans in progress', to: '/hr/pip-monitoring' },
    { label: 'Pending Feedback Requests', value: 0, icon: MessageSquare, tone: 'bg-cyan-50 text-cyan-700', helper: 'Ready for feedback API', to: '/hr/360-feedback/received' },
    { label: 'Upcoming HR Meetings', value: upcomingMeetings.length, icon: CalendarClock, tone: 'bg-violet-50 text-violet-700', helper: 'Scheduled performance meetings', to: '/hr/meetings' },
  ]

  const visibleSelfAssessments = pendingSelfAssessments.slice(0, 5)
  const visibleAppraisals = appraisals.slice(0, 5)
  const visiblePips = activePips.slice(0, 5)
  const visibleMeetings = upcomingMeetings.slice(0, 5)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600">HR Performance Dashboard</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Performance management overview
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500 dark:text-slate-400">
            Monitor KPI cycles, self-assessments, appraisals, feedback, PIPs, and HR performance meetings.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Link to="/hr/kpi-management" className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-black text-white transition hover:bg-slate-800">
            <Plus size={16} /> Create KPI Cycle
          </Link>
          <Link to="/hr/self-assessment/review-queue" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50">
            <ClipboardList size={16} /> Review Self-Assessments
          </Link>
          <Link to="/hr/pip-monitoring" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50">
            <Zap size={16} /> Create PIP
          </Link>
          <Link to="/hr/reports" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50">
            <BarChart3 size={16} /> Generate Report
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          const content = (
            <div className="flex h-full items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
                <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{card.value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{card.helper}</p>
              </div>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.tone}`}>
                <Icon size={24} />
              </div>
            </div>
          )

          return card.to ? <Link key={card.label} to={card.to}>{content}</Link> : <div key={card.label}>{content}</div>
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <SectionHeader
            title="KPI Management Summary"
            subtitle="Active KPI cycles and department setup progress"
            action={<Link to="/hr/kpi-management" className="text-xs font-black text-blue-600 hover:text-blue-700">Manage KPI Cycles</Link>}
          />
          <div className="mt-5 space-y-4">
            {kpiCycles.map((cycle) => (
              <div key={cycle.name} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white">{cycle.name}</h3>
                    <p className="text-xs font-semibold text-slate-500">{cycle.team}</p>
                  </div>
                  <StatusBadge status={cycle.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-bold text-slate-500">
                  <span>Start: {formatDate(cycle.startDate)}</span>
                  <span>End: {formatDate(cycle.endDate)}</span>
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Completion progress</span>
                    <span>{cycle.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${cycle.progress}%` }} />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link to="/hr/kpi-assigned" className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">View KPI Details</Link>
                  <Link to="/hr/kpi-management" className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">Manage Cycle</Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <SectionHeader
            title="Quick Actions"
            subtitle="Common HR performance workflows"
          />
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: 'Review Appraisal Forms', icon: FileText, to: '/hr/appraisals/submissions' },
              { label: 'View Feedback', icon: MessageSquare, to: '/hr/360-feedback/received' },
              { label: 'Request Feedback', icon: Send, to: '/hr/360-feedback/give' },
              { label: 'Schedule HR Meeting', icon: CalendarClock, to: '/hr/meetings?section=schedule' },
              { label: 'Review PIP Notes', icon: AlertTriangle, to: '/hr/pip-notes' },
              { label: 'Self-Assessment Report', icon: BarChart3, to: '/hr/reports/self-assessment' },
            ].map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.label} to={action.to} className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 text-sm font-black text-slate-700 transition hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-800 dark:text-slate-200">
                  <Icon size={18} />
                  {action.label}
                </Link>
              )
            })}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <SectionHeader title="Self-Assessment Summary" subtitle="Employees with pending self-assessments and HR review items" />
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Assessment Period</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleSelfAssessments.length === 0 ? <EmptyRow message="No pending self-assessments found." /> : visibleSelfAssessments.map((form) => (
                <tr key={form.id}>
                  <td className="px-4 py-4 font-bold text-slate-900">{form.employee.employeeName}</td>
                  <td className="px-4 py-4 text-slate-500">{form.employee.departmentName}</td>
                  <td className="px-4 py-4 text-slate-500">{form.cycleName || 'Current cycle'}</td>
                  <td className="px-4 py-4 text-slate-500">{formatDate(form.deadlineDate)}</td>
                  <td className="px-4 py-4"><StatusBadge status={form.status} /></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/hr/self-assessment/reviews/${form.id}`} className="text-xs font-black text-blue-600">View</Link>
                      <Link to="/hr/meetings?section=schedule" className="text-xs font-black text-amber-600">Follow up</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <SectionHeader title="Appraisal Forms Summary" subtitle="Pending manager appraisals and recent appraisal forms" />
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Manager</th>
                <th className="px-4 py-3">Appraisal Period</th>
                <th className="px-4 py-3">Form Status</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleAppraisals.length === 0 ? <EmptyRow message="No appraisal forms loaded yet." /> : visibleAppraisals.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-4 font-bold text-slate-900">{item.employee?.employeeName || item.employee?.fullName || 'Employee'}</td>
                  <td className="px-4 py-4 text-slate-500">{item.evaluator?.employeeName || item.evaluator?.fullName || 'Assigned manager'}</td>
                  <td className="px-4 py-4 text-slate-500">{item.period?.name || item.template?.name || 'Current period'}</td>
                  <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-4 text-slate-500">{formatDate(item.period?.endDate || item.updatedAt)}</td>
                  <td className="px-4 py-4">
                    <Link to={`/hr/appraisals/submissions?assignmentId=${item.id}`} className="text-xs font-black text-blue-600">View details</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <SectionHeader title="Feedback Summary" subtitle="Employee and manager feedback activity" />
          <div className="mt-5 space-y-3">
            {fallbackFeedbackRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                <div>
                  <p className="text-sm font-black text-slate-900">{row.label}</p>
                  <p className="text-xs font-semibold text-slate-500">{row.status}</p>
                </div>
                <span className="text-2xl font-black text-slate-900">{row.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/hr/360-feedback/received" className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">View Feedback</Link>
            <Link to="/hr/360-feedback/give" className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">Request Feedback</Link>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <SectionHeader title="PIP Summary" subtitle="Active Performance Improvement Plans" />
          <div className="mt-5 space-y-3">
            {visiblePips.length === 0 ? (
              <div className="rounded-xl border border-slate-100 p-6 text-center text-sm font-semibold text-slate-400">No active PIPs found.</div>
            ) : visiblePips.map((pip) => (
              <div key={pip.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900">{pip.employee.employee?.employeeName || 'Employee'}</p>
                    <p className="text-xs font-semibold text-slate-500">Manager: {pip.manager.employee?.employeeName || 'Assigned manager'}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Review date: {formatDate(pip.endDate)}</p>
                  </div>
                  <StatusBadge status={pip.status} />
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-red-500" style={{ width: `${Math.min(100, pip.overallProgressPercentage || 0)}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to={`/hr/pip-monitoring/${pip.id}`} className="text-xs font-black text-blue-600">View details</Link>
                  <Link to="/hr/meetings?section=schedule" className="text-xs font-black text-amber-600">Schedule review</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <SectionHeader title="Meetings Summary" subtitle="Upcoming HR performance meetings" action={<Link to="/hr/meetings?section=schedule" className="text-xs font-black text-blue-600">Schedule Meeting</Link>} />
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-4 py-3">Meeting Title</th>
                <th className="px-4 py-3">Employee or Manager</th>
                <th className="px-4 py-3">Date and Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleMeetings.length === 0 ? <EmptyRow message="No upcoming HR meetings found." /> : visibleMeetings.map((meeting) => (
                <tr key={meeting.id}>
                  <td className="px-4 py-4 font-bold text-slate-900">{meeting.title || meeting.description || 'Performance meeting'}</td>
                  <td className="px-4 py-4 text-slate-500">{meeting.employeeName || meeting.managerName || 'Participant'}</td>
                  <td className="px-4 py-4 text-slate-500">{formatDateTime(meeting.meetingTime || meeting.scheduledAt)}</td>
                  <td className="px-4 py-4"><StatusBadge status={meeting.status} /></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/hr/meetings/${meeting.id}`} className="text-xs font-black text-blue-600">View</Link>
                      <Link to="/hr/meetings?section=schedule" className="text-xs font-black text-amber-600">Reschedule</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {hrReviewForms.length > 0 && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          {hrReviewForms.length} self-assessment form{hrReviewForms.length === 1 ? '' : 's'} require HR review.
        </div>
      )}
    </div>
  )
}
