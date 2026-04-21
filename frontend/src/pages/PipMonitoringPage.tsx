import { useGetPipsQuery } from '../features/pip/pipApi'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useState, useMemo } from 'react'
import { getRoleGroup } from '../utils/dashboardRedirect'
import type { RootState } from '../app/store'
// Removed unused formatDate

const STATUS_COLORS: Record<string, string> = {
  PENDING_CREATION: 'bg-yellow-100 text-yellow-700',
  PENDING_REOPEN: 'bg-orange-100 text-orange-700',
  ACTIVE: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-slate-100 text-slate-700',
  DENIED: 'bg-red-100 text-red-700',
}

export default function PipMonitoringPage() {
  const { data: pips, isLoading } = useGetPipsQuery()
  const { user } = useSelector((state: RootState) => state.auth)
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const isManager = user?.role === 'DEPARTMENT_HEAD' || user?.role === 'TEAM_HEAD'
  const routeBase = user ? (getRoleGroup(user as never) === 'HR' ? '/hr/pip-monitoring' : '/manager/pip') : '/manager/pip'

  const filteredPips = useMemo(() => {
    if (!pips) return []
    let result = pips

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => {
        const empName = p.employee.employee?.employeeName?.toLowerCase() || ''
        const empId = (p.employee?.employee?.id != null ? String(p.employee.employee.id) : '').toLowerCase()
        const email = p.employee?.email?.toLowerCase() || ''
        const dept = p.employee.employee?.department?.departmentName?.toLowerCase() || ''
        return empName.includes(q) || empId.includes(q) || email.includes(q) || dept.includes(q)
      })
    }

    if (filterTab === 'ACTIVE') {
      result = result.filter(p => ['ACTIVE', 'PENDING_CREATION', 'PENDING_REOPEN'].includes(p.status))
    } else if (filterTab === 'CLOSED') {
      result = result.filter(p => ['CLOSED', 'DENIED', 'COMPLETED'].includes(p.status))
    }

    // Sort Active to top, Closed to bottom
    return result.slice().sort((a, b) => {
      const isAActive = ['ACTIVE', 'PENDING_CREATION', 'PENDING_REOPEN'].includes(a.status)
      const isBActive = ['ACTIVE', 'PENDING_CREATION', 'PENDING_REOPEN'].includes(b.status)
      if (isAActive && !isBActive) return -1
      if (!isAActive && isBActive) return 1
      return 0
    })
  }, [pips, filterTab, searchQuery])

  if (isLoading) return <div className="p-8">Loading PIPs...</div>

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PIP Monitoring</h1>
          <p className="text-slate-500">Manage and track performance improvement plans.</p>
        </div>
        {isManager && (
          <Link
            to={`${routeBase}/create`}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
          >
            <i className="bi bi-plus-lg" />
            Create PIP
          </Link>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-2">
        <div className="flex gap-4">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`pb-2 text-sm font-medium ${filterTab === 'ALL' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            All PIPs
          </button>
          <button
            onClick={() => setFilterTab('ACTIVE')}
            className={`pb-2 text-sm font-medium ${filterTab === 'ACTIVE' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterTab('CLOSED')}
            className={`pb-2 text-sm font-medium ${filterTab === 'CLOSED' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Closed
          </button>
        </div>
        <div className="relative">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Name, ID, Email, or Dept..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-64"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Name</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">ID</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Dept</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Email</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Completed Hours</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Total Hours</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredPips.map((pip) => {
              return (
                <tr key={pip.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{pip.employee.employee?.employeeName || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{pip.employee.employee?.id ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{pip.employee.employee?.department?.departmentName || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{pip.employee.email}</td>
                  <td className="px-6 py-4 font-semibold text-blue-600">{pip.completedHours}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{pip.totalHours}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[pip.status]}`}>
                      {pip.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`${routeBase}/${pip.id}`}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              )
            })}
            {filteredPips.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
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
