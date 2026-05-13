import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useGetPipsQuery } from '../../features/pip/pipApi'
import { downloadIndividualPipReport } from '../../features/pip/pipReportApi'
import type { RootState } from '../../app/store'
import { Download, FileText, Zap } from 'lucide-react'

export default function ReportsPage() {
  const { user } = useSelector((state: RootState) => state.auth)

  const { data: pips = [], isLoading } = useGetPipsQuery()

  const myPips = useMemo(() => {
    if (!user?.id) return []
    return pips.filter((pip) => pip.employee?.id === user.id)
  }, [pips, user])

  const handleDownloadReport = (pipId: number, format: 'pdf' | 'excel') => {
    downloadIndividualPipReport(pipId, format).catch((error: any) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'CLOSED':
      case 'AUTO_CLOSED':
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
      case 'REOPEN_REQUESTED':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
    }
  }

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
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.active}</div>
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
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Manager</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Start Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">End Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Progress</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Hours</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myPips.map((pip) => (
                      <tr key={pip.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 text-slate-900 dark:text-slate-100">#{pip.id}</td>
                        <td className="py-3 px-4 text-slate-900 dark:text-slate-100">
                          {pip.manager?.employee?.employeeName || pip.manager?.email || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pip.status)}`}>
                            {pip.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{pip.startDate}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{pip.endDate}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${pip.overallProgressPercentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500">{pip.overallProgressPercentage}%</span>
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