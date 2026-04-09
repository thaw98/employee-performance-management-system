import { useGetPipsQuery } from '../features/pip/pipApi'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'
import { formatDate } from '../utils/dateUtils'

const STATUS_COLORS = {
  ACTIVE: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-slate-100 text-slate-700',
}

export default function PipMonitoringPage() {
  const { data: pips, isLoading } = useGetPipsQuery()
  const { user } = useSelector((state: RootState) => state.auth)

  const isManagerOrAdmin = user?.role === 'HR' || user?.role === 'DEPARTMENT_HEAD' || user?.role === 'TEAM_HEAD'

  if (isLoading) return <div className="p-8">Loading PIPs...</div>

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PIP Monitoring</h1>
          <p className="text-slate-500">Manage and track performance improvement plans.</p>
        </div>
        {isManagerOrAdmin && (
          <Link
            to="/hr/pip-monitoring/create"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
          >
            <i className="bi bi-plus-lg" />
            Create PIP
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Employee</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Progress</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Timeline</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {pips?.map((pip) => {
              const totalProgress = pip.objectives.reduce((acc, obj) => acc + obj.progressPercentage, 0)
              const avgProgress = pip.objectives.length > 0 ? Math.round(totalProgress / pip.objectives.length) : 0
              const is100Percent = avgProgress === 100

              return (
                <tr key={pip.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{pip.employee.email}</span>
                      <div className="flex gap-2">
                        <span className="text-xs text-slate-500">ID: {pip.employee.employeeId}</span>
                        <span className="text-xs text-blue-600 font-medium">• {pip.completedHours}/{pip.totalHours} hrs</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[pip.status]}`}>
                      {pip.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex w-32 items-center gap-2">
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${is100Percent ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${avgProgress}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${is100Percent ? 'text-green-600' : 'text-slate-600'}`}>
                        {avgProgress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {formatDate(pip.startDate)} to {formatDate(pip.endDate)}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/hr/pip-monitoring/${pip.id}`}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              )
            })}
            {(!pips || pips.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No PIP records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
