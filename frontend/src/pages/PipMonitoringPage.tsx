import { useGetPipsQuery } from '../features/pip/pipApi'
import { Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useState, useMemo, useEffect } from 'react'
import type { RootState } from '../app/store'
import { useGetDepartmentsQuery, useGetPositionsQuery } from '../features/hrCreateEmployee/hrEmployeeAccountApi'

const STATUS_COLORS: Record<string, string> = {
  PENDING_CREATION: 'bg-yellow-100 text-yellow-700',
  PENDING_REOPEN: 'bg-orange-100 text-orange-700',
  PENDING_CLOSE: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-slate-100 text-slate-700',
  DENIED: 'bg-red-100 text-red-700',
}

export default function PipMonitoringPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const userRole = user?.role?.toUpperCase().replace(/\s+/g, '_') || ''
  const isHr = userRole === 'HR'
  const isManager = userRole === 'DEPARTMENT_HEAD' || userRole === 'TEAM_HEAD' || userRole === 'MANAGER'

  const [filterDept, setFilterDept] = useState<number | undefined>(undefined)
  const [filterPos, setFilterPos] = useState<number | undefined>(undefined)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchName, setSearchName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data: pips, isLoading, isError, error } = useGetPipsQuery({
    departmentId: filterDept,
    positionId: filterPos,
    employeeName: searchName,
    status: filterStatus || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  const { data: departmentsData } = useGetDepartmentsQuery()
  const { data: positionsData } = useGetPositionsQuery(filterDept)

  const departments = departmentsData?.data || []
  const positions = positionsData?.data || []

  // Auto-select department for manager
  useEffect(() => {
    if (isManager && !isHr && departments.length > 0) {
      setFilterDept(departments[0].departmentId)
    }
  }, [isManager, isHr, departments])

  const location = useLocation()
  const canCreate = isManager && !isHr // Only managers can create, HR is auditor/reviewer

  const filteredPips = useMemo(() => {
    if (!pips) return []
    return pips.slice().sort((a, b) => {
      const isAActive = ['ACTIVE', 'PENDING_CREATION', 'PENDING_REOPEN', 'PENDING_CLOSE'].includes(a.status)
      const isBActive = ['ACTIVE', 'PENDING_CREATION', 'PENDING_REOPEN', 'PENDING_CLOSE'].includes(b.status)
      if (isAActive && !isBActive) return -1
      if (!isAActive && isBActive) return 1
      return 0
    })
  }, [pips])

  if (isLoading) return <div className="p-8 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><span className="ml-3">Loading PIPs...</span></div>

  if (isError) {
    const errorMessage = (error as any)?.data?.message || (error as any)?.error || 'Failed to load PIP records.'
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <h2 className="text-lg font-bold">Unable to load PIP Monitoring</h2>
          <p className="mt-2 text-sm">{errorMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">PIP Monitoring</h1>
          <p className="text-slate-500 mt-1">Manage and track performance improvement plans across your scope.</p>
        </div>
        {canCreate && (
          <Link
            to="create"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:scale-105 active:scale-95"
          >
            <i className="bi bi-plus-lg" />
            Create PIP
          </Link>
        )}
      </div>

      {/* Advanced Filters */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {/* Department Filter - Only for HR or if Manager has multiple (unlikely based on current backend) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Department</label>
            <select
              value={filterDept || ''}
              onChange={(e) => {
                setFilterDept(e.target.value ? Number(e.target.value) : undefined)
                setFilterPos(undefined) // Reset position when department changes
              }}
              disabled={!isHr}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              {(isHr || !isManager) && <option value="">All Departments</option>}
              {departments.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.departmentName || 'Unnamed Department'}
                </option>
              ))}
            </select>
          </div>

          {/* Position Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Position</label>
            <select
              value={filterPos || ''}
              onChange={(e) => setFilterPos(e.target.value ? Number(e.target.value) : undefined)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Positions</option>
              {positions.map((p) => (
                <option key={p.positionId} value={p.positionId}>
                  {p.positionName || 'Unnamed Position'}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {Object.keys(STATUS_COLORS).map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* Employee Name Search */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Employee Name</label>
            <div className="relative">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Start Date From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">End Date To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setFilterDept(isHr ? undefined : (isManager ? departments[0]?.departmentId : undefined))
              setFilterPos(undefined)
              setFilterStatus('')
              setSearchName('')
              setStartDate('')
              setEndDate('')
            }}
            className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-100">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Employee</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Position</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Department</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Start Date</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">End Date</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Progress</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPips.map((pip) => {
              const emp = pip.employee.employee
              return (
                <tr key={pip.id} className="group hover:bg-slate-50 transition-all duration-200">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{emp?.employeeName || 'N/A'}</span>
                      <span className="text-xs text-slate-400">ID: {emp?.id || '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm text-slate-600 font-medium">{(emp as any)?.position?.positionName || (emp as any)?.position?.name || '—'}</span>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600">
                    {emp?.department?.departmentName || (emp as any)?.department?.name || '—'}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_COLORS[pip.status]}`}>
                      {pip.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600 font-medium">
                    {new Date(pip.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600 font-medium">
                    {new Date(pip.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100 shadow-inner">
                        <div
                          className={`h-full transition-all duration-500 ${pip.overallProgressPercentage >= 70 ? 'bg-green-500' : pip.overallProgressPercentage >= 30 ? 'bg-blue-500' : 'bg-orange-500'}`}
                          style={{ width: `${pip.overallProgressPercentage}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-400">{pip.overallProgressPercentage}% COMPLETE</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Link
                      to={`${location.pathname}/${pip.id}`}
                      className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      View Details
                      <i className="bi bi-chevron-right text-[10px]" />
                    </Link>
                  </td>
                </tr>
              )
            })}
            {filteredPips.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <i className="bi bi-clipboard-x text-5xl mb-4 opacity-20" />
                    <p className="text-lg font-medium">No PIP records found matching your criteria.</p>
                    <p className="text-sm">Try adjusting your filters or search terms.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
