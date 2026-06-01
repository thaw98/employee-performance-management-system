import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { BarChart3, Building2, Download, FileSpreadsheet, FileText, TrendingDown, TrendingUp, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { HR_REPORT_CHART_COLORS } from './hrReportsTheme'
import { toast } from 'react-hot-toast'
import { useGetReviewCyclesQuery } from '../../features/reviewCycle/api/reviewCycleApi'
import { useGetSelfAssessmentReportQuery, type EmployeeDirectoryRow, type GroupSummary, type SelfAssessmentReportDto } from '../../features/selfAssessmentForm/api/selfAssessmentReportApi'
import { exportSelfAssessmentReportExcel } from '../../features/selfAssessmentForm/exportSelfAssessmentReportExcel'
import { exportSelfAssessmentReportPdf } from '../../features/selfAssessmentForm/exportSelfAssessmentReportPdf'

type Props = {
  mode: 'hr' | 'manager' | 'audit'
}

type ReportTab = 'department' | 'positions' | 'directory'

const BAND_KEYS = [
  { key: 'outstanding', label: 'Outstanding' },
  { key: 'good', label: 'Good' },
  { key: 'meetRequirement', label: 'Meet Requirement' },
  { key: 'needImprovement', label: 'Need Improvement' },
  { key: 'unsatisfactory', label: 'Unsatisfactory' },
] as const

function formatScore(value: number | null | undefined) {
  return `${Number(value ?? 0).toFixed(1)}%`
}

function statusLabel(value: string) {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

type MetricTone = 'blue' | 'violet' | 'green' | 'amber' | 'rose' | 'indigo' | 'cyan'

const METRIC_TONE_CLASSNAMES: Record<MetricTone, string> = {
  blue: 'bg-[#eff6ff] text-[#2463eb] dark:bg-[#1e3a8a]/30 dark:text-[#93c5fd]',
  violet: 'bg-[#f5f3ff] text-[#7c3aed] dark:bg-[#4c1d95]/35 dark:text-[#c4b5fd]',
  green: 'bg-[#ecfdf5] text-[#059669] dark:bg-[#064e3b]/35 dark:text-[#6ee7b7]',
  amber: 'bg-[#fffbeb] text-[#d97706] dark:bg-[#78350f]/35 dark:text-[#fcd34d]',
  rose: 'bg-[#fff1f2] text-[#e11d48] dark:bg-[#881337]/35 dark:text-[#fda4af]',
  indigo: 'bg-[#eef2ff] text-[#4f46e5] dark:bg-[#312e81]/35 dark:text-[#a5b4fc]',
  cyan: 'bg-[#ecfeff] text-[#0891b2] dark:bg-[#164e63]/35 dark:text-[#67e8f9]',
}

function MetricCard({ icon, label, value, tone = 'blue' }: { icon: React.ReactNode; label: string; value: string; tone?: MetricTone }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${METRIC_TONE_CLASSNAMES[tone]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function rowKey(row: GroupSummary) {
  return `${row.departmentId ?? 'dept'}-${row.groupId ?? row.groupName}`
}

function SummaryTable({
  title,
  rows,
  onRowClick,
  activeRowId,
}: {
  title: string
  rows: GroupSummary[]
  onRowClick?: (row: GroupSummary) => void
  activeRowId?: number | null
}) {
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
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={`${onRowClick ? 'cursor-pointer transition hover:bg-[#eff6ff]/70 dark:hover:bg-[#1e3a8a]/20' : ''} ${activeRowId != null && row.groupId === activeRowId ? 'bg-[#eff6ff] dark:bg-[#1e3a8a]/20' : ''}`}
              >
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

function EmployeeDirectoryTable({ rows }: { rows: EmployeeDirectoryRow[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Employee Directory</h2>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Staff No</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Department</th>
              <th className="px-4 py-3 text-left">Position</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3 text-left">Performance</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No employees match the current filters.</td></tr>
            ) : rows.map((row) => (
              <tr key={`${row.employeeId}-${row.staffNo}`}>
                <td className="px-4 py-3">{row.staffNo || '-'}</td>
                <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">{row.employeeName}</td>
                <td className="px-4 py-3">{row.departmentName || '-'}</td>
                <td className="px-4 py-3">{row.positionName || '-'}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatScore(row.selectedCycleScore)}</td>
                <td className="px-4 py-3">{row.performance || '-'}</td>
                <td className="px-4 py-3">{statusLabel(row.status)}</td>
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

function EmployeeScoreTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="font-bold text-slate-900 dark:text-slate-100">{data.name}</p>
      <p className="text-xs text-slate-500">Staff No: {data.staffNo || '-'}</p>
      <p className="text-xs text-slate-500">Department: {data.department || '-'}</p>
      <p className="text-xs text-slate-500">Position: {data.position || '-'}</p>
      <p className="text-xs font-semibold text-[#2463eb]">Score: {Number(data.score).toFixed(1)}%</p>
      <p className="text-xs text-slate-500">Performance: {data.performance || '-'}</p>
      <p className="text-xs text-slate-500">Status: {statusLabel(data.status)}</p>
    </div>
  )
}

export default function SelfAssessmentReportPage({ mode }: Props) {
  const { data: cycles = [] } = useGetReviewCyclesQuery({ requiresEmployeeSubmission: true })
  const [cycleId, setCycleId] = useState<number | ''>('')
  const [activeTab, setActiveTab] = useState<ReportTab>('department')
  const [selectedDepartment, setSelectedDepartment] = useState<GroupSummary | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<GroupSummary | null>(null)

  useEffect(() => {
    if (!cycleId && cycles.length > 0) {
      setCycleId(cycles[0].id)
    }
  }, [cycles, cycleId])

  const selectedCycleId = typeof cycleId === 'number' ? cycleId : undefined
  const { data: report, isFetching, isError } = useGetSelfAssessmentReportQuery(selectedCycleId as number, {
    skip: !selectedCycleId,
  })

  useEffect(() => {
    setActiveTab('department')
    setSelectedDepartment(null)
    setSelectedPosition(null)
  }, [selectedCycleId])

  useEffect(() => {
    if (!report) return
    setSelectedDepartment((current) => {
      if (!current) return null
      return report.departmentSummaries.some((row) => row.groupId === current.groupId) ? current : null
    })
    setSelectedPosition((current) => {
      if (!current) return null
      return report.positionSummaries.some((row) => row.groupId === current.groupId && row.departmentId === current.departmentId) ? current : null
    })
  }, [report])

  const departmentRows = report?.departmentSummaries ?? []
  const positionRows = useMemo(() => {
    const rows = report?.positionSummaries ?? []
    if (!selectedDepartment?.groupId) return rows
    return rows.filter((row) => row.departmentId === selectedDepartment.groupId)
  }, [report, selectedDepartment])
  const directoryRows = useMemo(() => {
    let rows = report?.employeeDirectory ?? []
    if (selectedDepartment?.groupId) {
      rows = rows.filter((row) => row.departmentId === selectedDepartment.groupId)
    }
    if (selectedPosition?.groupId) {
      rows = rows.filter((row) => row.positionId === selectedPosition.groupId)
    }
    return rows
  }, [report, selectedDepartment, selectedPosition])
  const radarData = useMemo(() => buildRadarData(report), [report])
  const radarGroups = report?.performanceBandRadar.map((item) => item.groupName) ?? []

  const employeeChartData = useMemo(() => {
    if (!report?.employeeDirectory) return []
    return [...report.employeeDirectory]
      .sort((a, b) => (b.selectedCycleScore ?? 0) - (a.selectedCycleScore ?? 0))
      .map((emp) => ({
        name: emp.employeeName,
        score: emp.selectedCycleScore ?? 0,
        staffNo: emp.staffNo,
        department: emp.departmentName,
        position: emp.positionName,
        performance: emp.performance,
        status: emp.status,
      }))
  }, [report])

  const handleDepartmentClick = (row: GroupSummary) => {
    setSelectedDepartment(row)
    setSelectedPosition(null)
    setActiveTab('positions')
  }

  const handlePositionClick = (row: GroupSummary) => {
    setSelectedPosition(row)
    if (!selectedDepartment && row.departmentId != null) {
      const department = departmentRows.find((item) => item.groupId === row.departmentId)
      setSelectedDepartment(department ?? null)
    }
    setActiveTab('directory')
  }

  const clearDepartment = () => {
    setSelectedDepartment(null)
    setSelectedPosition(null)
  }

  const clearPosition = () => {
    setSelectedPosition(null)
  }

  const exportContext = useMemo(
    () => ({
      tab: activeTab,
      departmentRows,
      positionRows,
      directoryRows,
    }),
    [activeTab, departmentRows, positionRows, directoryRows],
  )

  const handleExport = async () => {
    if (!report) return
    await exportSelfAssessmentReportPdf(report, exportContext)
    toast.success('PDF exported')
  }

  const handleExportExcel = () => {
    if (!report) return
    exportSelfAssessmentReportExcel(report, exportContext)
    toast.success('Excel exported')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#2463eb] dark:text-[#93c5fd]">Reports</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950 dark:text-slate-50">Self-Assessment Report</h1>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            {mode === 'manager' ? 'Position comparison for your current department' : 'Cross-department performance overview'}
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
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-4 text-sm font-black text-white shadow-sm shadow-[#dbeafe] transition hover:from-[#1d4ed8] hover:to-[#1e40af] disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
          >
            <Download size={17} />
            Export PDF
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={!report}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 text-sm font-black text-white shadow-sm shadow-emerald-100 transition hover:from-emerald-700 hover:to-teal-700 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
          >
            <FileSpreadsheet size={17} />
            Export Excel
          </button>
        </div>
      </div>

      {isError && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">Failed to load report.</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={<FileText size={20} />} label="Records" value={String(report?.overallTotals.recordCount ?? 0)} tone="blue" />
        <MetricCard icon={<BarChart3 size={20} />} label="Average" value={formatScore(report?.overallTotals.averageScore)} tone="violet" />
        <MetricCard icon={<TrendingUp size={20} />} label="Highest" value={formatScore(report?.overallTotals.highestScore)} tone="green" />
        <MetricCard icon={<TrendingDown size={20} />} label="Lowest" value={formatScore(report?.overallTotals.lowestScore)} tone="amber" />
        <MetricCard icon={<Users size={20} />} label="Missed" value={String(report?.overallTotals.missedCount ?? 0)} tone="rose" />
      </div>

      {mode !== 'manager' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <MetricCard icon={<Building2 size={20} />} label="Highest Department" value={report?.highestDepartment?.groupName ?? '-'} tone="indigo" />
          <MetricCard icon={<Building2 size={20} />} label="Lowest Department" value={report?.lowestDepartment?.groupName ?? '-'} tone="cyan" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Employee Score Analytics</h2>
          <div className="h-[280px] overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            {isFetching ? (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">Loading report...</div>
            ) : employeeChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">No employee score data for this cycle.</div>
            ) : (
              <div style={{ height: Math.max(280, employeeChartData.length * 28) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employeeChartData} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                    <Tooltip content={<EmployeeScoreTooltip />} />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                      {employeeChartData.map((_, index) => (
                        <Cell
                          key={`score-${index}`}
                          fill={HR_REPORT_CHART_COLORS[index % HR_REPORT_CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Competency Radar</h2>
          <div className="h-[280px] rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            {isFetching ? (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">Loading report...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="band" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {radarGroups.map((group, index) => (
                    <Radar
                      key={group}
                      name={group}
                      dataKey={group}
                      stroke={HR_REPORT_CHART_COLORS[index % HR_REPORT_CHART_COLORS.length]}
                      fill={HR_REPORT_CHART_COLORS[index % HR_REPORT_CHART_COLORS.length]}
                      fillOpacity={0.2}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

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

      <section className="space-y-4">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800">
          {[
            { id: 'department' as const, label: 'Department' },
            { id: 'positions' as const, label: 'Positions' },
            { id: 'directory' as const, label: 'Employee Directory' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-3 py-2 text-sm font-black transition ${
                activeTab === tab.id
                  ? 'border-[#2463eb] text-[#2463eb] dark:border-[#93c5fd] dark:text-[#93c5fd]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {(selectedDepartment || selectedPosition) && (
          <div className="flex flex-wrap gap-2">
            {selectedDepartment && (
              <button
                type="button"
                onClick={clearDepartment}
                className="inline-flex items-center rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-xs font-black text-[#1d4ed8] dark:border-[#1e40af] dark:bg-[#1e3a8a]/30 dark:text-[#93c5fd]"
              >
                Department: {selectedDepartment.groupName} x
              </button>
            )}
            {selectedPosition && (
              <button
                type="button"
                onClick={clearPosition}
                className="inline-flex items-center rounded-full border border-[#bfdbfe] bg-[#dbeafe] px-3 py-1 text-xs font-black text-[#1e40af] dark:border-[#1e40af] dark:bg-[#1e3a8a]/40 dark:text-[#bfdbfe]"
              >
                Position: {selectedPosition.groupName} x
              </button>
            )}
          </div>
        )}

        {activeTab === 'department' && (
          <SummaryTable
            title={mode === 'manager' ? 'Department Context' : 'Department Summary'}
            rows={departmentRows}
            onRowClick={handleDepartmentClick}
            activeRowId={selectedDepartment?.groupId}
          />
        )}
        {activeTab === 'positions' && (
          <SummaryTable
            title={selectedDepartment ? `Positions in ${selectedDepartment.groupName}` : 'Position Summary'}
            rows={positionRows}
            onRowClick={handlePositionClick}
            activeRowId={selectedPosition?.groupId}
          />
        )}
        {activeTab === 'directory' && <EmployeeDirectoryTable rows={directoryRows} />}
      </section>

    </div>
  )
}
