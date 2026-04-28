import { useGetPipsQuery } from '../features/pip/pipApi'
import { skipToken } from '@reduxjs/toolkit/query'
import { Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useState, useMemo } from 'react'
import type { RootState } from '../app/store'
import { useGetDepartmentsQuery, useGetDepartmentPositionsQuery } from '../features/hrCreateEmployee/hrEmployeeAccountApi'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-blue-100 text-blue-700',
  AUTO_CLOSED: 'bg-amber-100 text-amber-700',
  REOPEN_REQUESTED: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-slate-100 text-slate-700',
  DENIED: 'bg-red-100 text-red-700',
}

type ApiError = {
  data?: {
    message?: string
  }
  error?: string
}

type EmployeeDisplay = {
  id?: number
  employeeName?: string
  positionName?: string | null
  positionId?: number | null
  department?: {
    departmentName?: string
    name?: string
  }
  position?: {
    positionName?: string
    name?: string
  }
}

const getPositionName = (employee?: EmployeeDisplay) => {
  return employee?.position?.positionName || employee?.position?.name || employee?.positionName || 'N/A'
}

const getDepartmentName = (employee?: EmployeeDisplay) => {
  return employee?.department?.departmentName || employee?.department?.name || 'N/A'
}

type PositionFilterOption = {
  positionId: number
  positionName: string
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
  const departmentFilter = isHr ? filterDept : undefined

  const { data: pips, isLoading, isError, error } = useGetPipsQuery({
    departmentId: departmentFilter,
    positionId: filterPos,
    employeeName: searchName,
    status: filterStatus || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })
  const { data: departmentPips } = useGetPipsQuery(
    isHr && typeof departmentFilter === 'number'
      ? { departmentId: departmentFilter }
      : skipToken,
  )

  const managerDepartmentId = useMemo(() => {
    if (isHr) return undefined
    const firstPip = pips?.[0]
    const emp = firstPip?.employee as any
    const employeeObj = emp?.employee || emp
    const dept = employeeObj?.department
    if (dept) {
      return dept.departmentId || dept.id
    }
    return undefined
  }, [pips, isHr])

  const { data: departmentsData } = useGetDepartmentsQuery()
  const targetDepartmentId = isHr && typeof filterDept === 'number' ? filterDept : (!isHr && managerDepartmentId ? managerDepartmentId : undefined)
  const { data: positionsData } = useGetDepartmentPositionsQuery(
    targetDepartmentId !== undefined ? targetDepartmentId : skipToken,
  )

  const departments = departmentsData?.data || []
  const positions = useMemo<PositionFilterOption[]>(() => {
    const apiPositions = (positionsData?.data ?? [])
      .filter((position) => typeof position.positionId === 'number' && position.positionId > 0)
      .map((position) => ({
        positionId: position.positionId,
        positionName: position.positionName || 'Unnamed Position',
      }))

    const fallbackPips = departmentPips ?? pips ?? []
    const fallbackPositions = fallbackPips.reduce<PositionFilterOption[]>((acc, pip) => {
      const employee = pip.employee.employee as EmployeeDisplay | undefined
      const positionId = employee?.positionId
      const positionName = getPositionName(employee)

      if (!positionId || !positionName || positionName === 'N/A') {
        return acc
      }

      if (acc.some((position) => position.positionId === positionId)) {
        return acc
      }

      acc.push({ positionId, positionName })
      return acc
    }, [])

    return [...apiPositions, ...fallbackPositions]
      .filter((position, index, all) => all.findIndex((item) => item.positionId === position.positionId) === index)
      .sort((a, b) => a.positionName.localeCompare(b.positionName))
  }, [departmentPips, pips, positionsData?.data])

  const managerDepartmentName = useMemo(() => {
    if (isHr) return null
    const firstPip = pips?.[0]
    const emp = firstPip?.employee as any
    const employeeObj = emp?.employee || emp
    const dept = employeeObj?.department
    if (dept) {
      return dept.departmentName || dept.name || 'My Department'
    }
    return 'My Department'
  }, [pips, isHr])

  const location = useLocation()
  const canCreate = isManager && !isHr

  const filteredPips = useMemo(() => {
    if (!pips) return []
    return pips.slice().sort((a, b) => {
      const isAActive = ['ACTIVE', 'AUTO_CLOSED', 'REOPEN_REQUESTED'].includes(a.status)
      const isBActive = ['ACTIVE', 'AUTO_CLOSED', 'REOPEN_REQUESTED'].includes(b.status)
      if (isAActive && !isBActive) return -1
      if (!isAActive && isBActive) return 1
      return 0
    })
  }, [pips])

  if (isLoading) return <div className="p-8 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><span className="ml-3">Loading PIPs...</span></div>

  if (isError) {
    const apiError = error as ApiError | undefined
    const errorMessage = apiError?.data?.message || apiError?.error || 'Failed to load PIP records.'
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
          {(isHr || isManager) && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Department</label>
              <select
                value={filterDept || ''}
                onChange={(e) => {
                  setFilterDept(e.target.value ? Number(e.target.value) : undefined)
                  setFilterPos(undefined) // Reset position when department changes
                }}
                disabled={!isHr}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-700"
              >
                {isHr ? <option value="">All Departments</option> : <option value="">{managerDepartmentName}</option>}
                {isHr && departments.map((d) => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.departmentName || 'Unnamed Department'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Position Filter */}
          {(isHr || isManager) && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Position</label>
              <select
                value={filterPos || ''}
                onChange={(e) => setFilterPos(e.target.value ? Number(e.target.value) : undefined)}
                disabled={isHr && typeof filterDept !== 'number'}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">
                  {isHr && typeof filterDept !== 'number' ? 'Select Department First' : 'All Positions'}
                </option>
                {positions.map((p) => (
                  <option key={p.positionId} value={p.positionId}>
                    {p.positionName || 'Unnamed Position'}
                  </option>
                ))}
              </select>
            </div>
          )}

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
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Employee Name Search */}
          {(isHr || isManager) && (
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
          )}

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
              setFilterDept(undefined)
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
              {isHr && <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Department</th>}
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Start Date</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">End Date</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Progress</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPips.map((pip) => {
              const emp: EmployeeDisplay | undefined = pip.employee.employee
              return (
                <tr key={pip.id} className="group hover:bg-slate-50 transition-all duration-200">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{emp?.employeeName || 'N/A'}</span>
                      <span className="text-xs text-slate-400">ID: {emp?.id || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm text-slate-600 font-medium">{getPositionName(emp)}</span>
                  </td>
                  {isHr && (
                    <td className="px-6 py-5 text-sm text-slate-600">
                      {getDepartmentName(emp)}
                    </td>
                  )}
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      pip.status === 'CLOSED' && pip.finalOutcome === 'SUCCESSFUL' ? 'bg-green-100 text-green-700' :
                      pip.status === 'CLOSED' && pip.finalOutcome === 'FAILED' ? 'bg-red-100 text-red-700' :
                      (STATUS_COLORS[pip.status] || 'bg-slate-100 text-slate-700')
                    }`}>
                      {pip.status === 'CLOSED' && pip.finalOutcome === 'SUCCESSFUL' ? 'Close - Successful' :
                       pip.status === 'CLOSED' && pip.finalOutcome === 'FAILED' ? 'Close - Fail' :
                       pip.status.replace(/_/g, ' ')}
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
