import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useGetPipsQuery } from '../../../features/pip/pipApi'
import { downloadIndividualPipReport } from '../../../features/pip/pipReportApi'
import type { RootState } from '../../../app/store'
import { Download, FileText, Zap } from 'lucide-react'

const formatDateValue = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const getPipStaffId = (pip: { employee?: { employeeId?: string } }) => pip.employee?.employeeId || '-'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-blue-100 text-blue-700',
  AUTO_CLOSED: 'bg-amber-100 text-amber-700',
  REOPEN_REQUESTED: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-700',
  DENIED: 'bg-red-100 text-red-700',
}

const getStatusDisplayLabel = (status: string, finalOutcome?: string) => {
  if (status === 'CLOSED' && finalOutcome === 'SUCCESSFUL') return 'Close - Successful'
  if (status === 'CLOSED' && finalOutcome === 'FAILED') return 'Close - Fail'
  if (status === 'AUTO_CLOSED') return 'auto-close'
  return status.replace(/_/g, ' ')
}

const getStatusColorClass = (status: string, finalOutcome?: string) => {
  if (status === 'CLOSED' && finalOutcome === 'SUCCESSFUL') return 'bg-green-100 text-green-700'
  if (status === 'CLOSED' && finalOutcome === 'FAILED') return 'bg-red-100 text-red-700'
  return STATUS_COLORS[status] || 'bg-slate-100 text-slate-700'
}

const getProgressColorClass = (progress: number) => (
  progress >= 70 ? 'bg-green-500' : progress >= 30 ? 'bg-blue-500' : 'bg-orange-500'
)

export default function PipReportPage() {
  const { user } = useSelector((state: RootState) => state.auth)

  const { data: pips = [], isLoading } = useGetPipsQuery()

  const myPips = useMemo(() => {
    if (!user?.id) return []
    return pips.filter((pip) => pip.employee?.id === user.id)
  }, [pips, user])

  const handleDownloadReport = (pipId: number, format: 'pdf' | 'excel') => {
    downloadIndividualPipReport(
      pipId,
      format,
      `pip-employee-pip-${pipId}-report-${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xlsx' : 'pdf'}`,
    ).catch((error: any) => {
      console.error('Failed to download report:', error)
      alert(error?.response?.data?.message || 'Failed to download report')
    })
  }

  const stats = useMemo(() => {
    const total = myPips.length
    const active = myPips.filter((p) => p.status === 'ACTIVE').length
    const completed = myPips.filter((p) => p.status === 'COMPLETED').length
    const closed = myPips.filter((p) => p.status === 'CLOSED' || p.status === 'AUTO_CLOSED').length
    return { total, active, completed, closed }
  }, [myPips])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My PIP Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">View and download your Performance Improvement Plan reports</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : myPips.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Zap size={32} className="text-slate-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No PIP Records Found</h3>
          <p className="text-slate-500 dark:text-slate-400">You don't have any Performance Improvement Plans on record.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Total PIPs</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.active}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Active</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Completed</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">{stats.closed}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Closed</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Your PIP History</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">PIP ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Staff ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Manager</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Start Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">End Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Overall Progress</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Hours</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myPips.map((pip) => (
                      <tr key={pip.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 text-slate-900 dark:text-slate-100">#{pip.id}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Staff ID: {getPipStaffId(pip)}</td>
                        <td className="py-3 px-4 text-slate-900 dark:text-slate-100">
                          {pip.manager?.employee?.employeeName || pip.manager?.email || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getStatusColorClass(pip.status, pip.finalOutcome)}`}>
                            {getStatusDisplayLabel(pip.status, pip.finalOutcome)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{formatDateValue(pip.startDate)}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{formatDateValue(pip.endDate)}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100 shadow-inner dark:bg-slate-700">
                              <div
                                className={`h-full transition-all duration-500 ${getProgressColorClass(pip.overallProgressPercentage)}`}
                                style={{ width: `${pip.overallProgressPercentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-extrabold uppercase tracking-tight text-slate-400">
                              {pip.overallProgressPercentage}% COMPLETED
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{pip.completedHours}/{pip.totalHours}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDownloadReport(pip.id, 'pdf')}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded"
                              title="Download PDF"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => handleDownloadReport(pip.id, 'excel')}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded"
                              title="Download Excel"
                            >
                              <FileText size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
