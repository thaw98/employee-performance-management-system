import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { BarChart3, Building2, Download, FileText, TrendingDown, TrendingUp, Users } from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { toast } from 'react-hot-toast'
import { useGetReviewCyclesQuery } from '../../features/reviewCycle/api/reviewCycleApi'
import { useGetSelfAssessmentReportQuery, type GroupSummary, type SelfAssessmentReportDto } from '../../features/selfAssessmentForm/api/selfAssessmentReportApi'
import { exportSelfAssessmentReportPdf } from '../../features/selfAssessmentForm/exportSelfAssessmentReportPdf'

type Props = {
  mode: 'hr' | 'manager'
}

const BAND_KEYS = [
  { key: 'outstanding', label: 'Outstanding' },
  { key: 'good', label: 'Good' },
  { key: 'meetRequirement', label: 'Meet Requirement' },
  { key: 'needImprovement', label: 'Need Improvement' },
  { key: 'unsatisfactory', label: 'Unsatisfactory' },
] as const

const COLORS = ['#0f766e', '#2563eb', '#d97706', '#ea580c', '#dc2626', '#7c3aed']

function formatScore(value: number | null | undefined) {
  return `${Number(value ?? 0).toFixed(1)}%`
}

function statusLabel(value: string) {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

function deltaLabel(value: number | null) {
  if (value == null) return '-'
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
          {icon}
        </div>
      </div>
    </div>
  )
}

function SummaryTable({ title, rows }: { title: string; rows: GroupSummary[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">{title}</h2>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Group</th>
              <th className="px-4 py-3 text-right">Employees</th>
              <th className="px-4 py-3 text-right">Average</th>
              <th className="px-4 py-3 text-right">Highest</th>
              <th className="px-4 py-3 text-right">Lowest</th>
              <th className="px-4 py-3 text-right">Missed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No records for this cycle.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.groupName}>
                <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">{row.groupName}</td>
                <td className="px-4 py-3 text-right">{row.employeeCount}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatScore(row.averageScore)}</td>
                <td className="px-4 py-3 text-right">{formatScore(row.highestScore)}</td>
                <td className="px-4 py-3 text-right">{formatScore(row.lowestScore)}</td>
                <td className="px-4 py-3 text-right">{row.missedCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function buildRadarData(report: SelfAssessmentReportDto | undefined) {
  return BAND_KEYS.map((band) => {
    const row: Record<string, string | number> = { band: band.label }
    report?.performanceBandRadar.forEach((group) => {
      row[group.groupName] = Number(group[band.key])
    })
    return row
  })
}

export default function SelfAssessmentReportPage({ mode }: Props) {
  const { data: cycles = [] } = useGetReviewCyclesQuery({ requiresEmployeeSubmission: true })
  const [cycleId, setCycleId] = useState<number | ''>('')

  useEffect(() => {
    if (!cycleId && cycles.length > 0) {
      setCycleId(cycles[0].id)
    }
  }, [cycles, cycleId])

  const selectedCycleId = typeof cycleId === 'number' ? cycleId : undefined
  const { data: report, isFetching, isError } = useGetSelfAssessmentReportQuery(selectedCycleId as number, {
    skip: !selectedCycleId,
  })

  const summaryRows = mode === 'hr' ? report?.departmentSummaries ?? [] : report?.positionSummaries ?? []
  const radarData = useMemo(() => buildRadarData(report), [report])
  const radarGroups = report?.performanceBandRadar.map((item) => item.groupName) ?? []

  const handleExport = () => {
    if (!report) return
    exportSelfAssessmentReportPdf(report)
    toast.success('PDF exported')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Reports</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950 dark:text-slate-50">Self-Assessment Report</h1>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            {mode === 'hr' ? 'Cross-department performance overview' : 'Position comparison for your current department'}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={cycleId}
            onChange={(event) => setCycleId(event.target.value ? Number(event.target.value) : '')}
            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            aria-label="Review cycle"
          >
            <option value="">Select cycle</option>
            {cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}
          </select>
          <button
            type="button"
            onClick={handleExport}
            disabled={!report}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Download size={17} />
            Export PDF
          </button>
        </div>
      </div>

      {isError && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">Failed to load report.</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={<FileText size={20} />} label="Records" value={String(report?.overallTotals.recordCount ?? 0)} />
        <MetricCard icon={<BarChart3 size={20} />} label="Average" value={formatScore(report?.overallTotals.averageScore)} />
        <MetricCard icon={<TrendingUp size={20} />} label="Highest" value={formatScore(report?.overallTotals.highestScore)} />
        <MetricCard icon={<TrendingDown size={20} />} label="Lowest" value={formatScore(report?.overallTotals.lowestScore)} />
        <MetricCard icon={<Users size={20} />} label="Missed" value={String(report?.overallTotals.missedCount ?? 0)} />
      </div>

      {mode === 'hr' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <MetricCard icon={<Building2 size={20} />} label="Highest Department" value={report?.highestDepartment?.groupName ?? '-'} />
          <MetricCard icon={<Building2 size={20} />} label="Lowest Department" value={report?.lowestDepartment?.groupName ?? '-'} />
        </div>
      )}

      <SummaryTable title={mode === 'hr' ? 'Department Summary' : 'Position Summary'} rows={summaryRows} />

      <section className="space-y-3">
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Competency Radar</h2>
        <div className="h-[420px] rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          {isFetching ? (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">Loading report...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="band" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                {radarGroups.map((group, index) => (
                  <Radar
                    key={group}
                    name={group}
                    dataKey={group}
                    stroke={COLORS[index % COLORS.length]}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.14}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Per-Group Performer Highlights</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {(report?.performerHighlights ?? []).map((item) => (
            <div key={item.groupName} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-black text-slate-900 dark:text-slate-100">{item.groupName}</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-black uppercase text-emerald-600">Highest</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.highestPerformers.map((p) => `${p.employeeName} (${formatScore(p.score)})`).join(', ') || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-red-600">Lowest</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.lowestPerformers.map((p) => `${p.employeeName} (${formatScore(p.score)})`).join(', ') || '-'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {mode === 'manager' && (
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Employee Directory</h2>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left">Staff No</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Position</th>
                  <th className="px-4 py-3 text-right">Score</th>
                  <th className="px-4 py-3 text-left">Performance</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Previous Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(report?.employeeDirectory ?? []).map((row) => (
                  <tr key={`${row.employeeId}-${row.staffNo}`}>
                    <td className="px-4 py-3">{row.staffNo || '-'}</td>
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">{row.employeeName}</td>
                    <td className="px-4 py-3">{row.positionName || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatScore(row.selectedCycleScore)}</td>
                    <td className="px-4 py-3">{row.performance || '-'}</td>
                    <td className="px-4 py-3">{statusLabel(row.status)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{deltaLabel(row.previousCycleDelta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
