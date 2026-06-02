import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Link, useLocation } from 'react-router-dom'
import {
  FileText, MessageSquare, Download, ChevronRight,
  Search, SlidersHorizontal, RotateCcw, AlertCircle, Loader2,
  Inbox, ChevronLeft, ChevronDown, Users, Building2, UserCircle,
  Calendar,
} from 'lucide-react'
import { useGetAllPipNotesQuery, useGetPipsQuery } from '../../features/pip/pipApi'
import { useGetDepartmentsQuery } from '../../features/hrCreateEmployee/hrEmployeeAccountApi'
import { useGetManagersQuery } from '../../features/department/api/departmentApi'
import { formatDateTime } from '../../utils/dateUtils'
import {
  pipPrimary,
  pipPrimaryDark,
  pipPrimaryDarker,
  pipPrimaryLight,
  pipPrimaryMuted,
  pipPrimaryBorder,
  pipStatusColors,
} from '../reports/pipReportTheme'

const STATUS_OPTIONS = ['ACTIVE', 'AUTO_CLOSED', 'COMPLETED', 'CLOSED']

const getAuthorName = (note: { author: { email: string; employee?: { employeeName?: string } } }) => {
  return note.author.employee?.employeeName || note.author.email || 'Unknown author'
}

function getStatusLabel(status?: string) {
  if (status === 'REOPEN_REQUESTED') return 'ACTIVE'
  if (status === 'DENIED') return 'CLOSED'
  return status || 'UNKNOWN'
}

function getPageNumbers(page: number, totalPages: number): (number | string)[] {
  const pages: (number | string)[] = []
  const maxVisible = 5
  if (totalPages <= maxVisible + 2) {
    for (let i = 0; i < totalPages; i++) pages.push(i)
  } else {
    pages.push(0)
    const start = Math.max(1, page - 1)
    const end = Math.min(totalPages - 2, page + 1)
    if (start > 1) pages.push('...')
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < totalPages - 2) pages.push('...')
    pages.push(totalPages - 1)
  }
  return pages
}

export default function PipNotesReviewPage() {
  const location = useLocation()
  const pipMonitoringBasePath = location.pathname.startsWith('/audit/') ? '/audit/pip-monitoring' : '/hr/pip-monitoring'
  const [employeeName, setEmployeeName] = useState('')
  const [managerId, setManagerId] = useState<number | undefined>(undefined)
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined)
  const [pipStatus, setPipStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [filtersVisible, setFiltersVisible] = useState(true)
  const hasInvalidDateRange = Boolean(dateFrom && dateTo && dateFrom > dateTo)

  const { data: notesPage, isLoading, isError } = useGetAllPipNotesQuery({
    employeeName: employeeName || undefined,
    managerId,
    departmentId,
    noteType: 'COMMUNICATION',
    pipStatus: pipStatus || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    size,
  }, { skip: hasInvalidDateRange })
  const { data: pips = [] } = useGetPipsQuery()
  const { data: departmentsResponse } = useGetDepartmentsQuery()
  const { data: managersResponse } = useGetManagersQuery(departmentId, { skip: !departmentId })

  const selectedDepartment = useMemo(() => {
    if (!departmentId) return undefined
    return departmentsResponse?.data?.find((department) => (department.departmentId ?? department.id) === departmentId)
  }, [departmentId, departmentsResponse])

  const managerOptions = useMemo(() => {
    if (!departmentId || !selectedDepartment?.managerId) return []
    const departmentHeadId = selectedDepartment.managerId
    const managerFromDepartmentEndpoint = managersResponse?.data?.find((manager) => manager.employeeId === departmentHeadId)
    const managerFromPip = pips.find((pip) => pip.manager.employee?.id === departmentHeadId)?.manager.employee
    return [{
      id: departmentHeadId,
      name: managerFromDepartmentEndpoint?.fullName || managerFromPip?.employeeName || `Manager ${departmentHeadId}`,
    }]
  }, [departmentId, managersResponse, pips, selectedDepartment])

  const departmentOptions = useMemo(() => {
    const departments = new Map<number, string>()
    departmentsResponse?.data?.forEach((department) => {
      departments.set(department.departmentId ?? department.id, department.departmentName ?? department.name)
    })
    pips.forEach((pip) => {
      const department = pip.employee.employee?.department
      if (department?.id) {
        departments.set(department.id, department.departmentName || `Department ${department.id}`)
      }
    })
    return Array.from(departments.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [departmentsResponse, pips])

  const getDepartmentHeadId = (nextDepartmentId?: number) => {
    if (!nextDepartmentId) return undefined
    const department = departmentsResponse?.data?.find((item) => (item.departmentId ?? item.id) === nextDepartmentId)
    return department?.managerId ?? undefined
  }

  const notes = notesPage?.content ?? []
  const totalPages = Math.max(notesPage?.totalPages ?? 1, 1)
  const visibleCommunications = notes.filter((note) => note.noteType === 'COMMUNICATION').length

  const clearFilters = () => {
    setEmployeeName('')
    setManagerId(undefined)
    setDepartmentId(undefined)
    setPipStatus('')
    setDateFrom('')
    setDateTo('')
    setPage(0)
  }

  const handleExport = () => {
    const rows = [
      ['Date', 'Employee', 'Department', 'Manager', 'PIP Status', 'Note Content', 'Author'],
      ...notes.map((note) => [
        formatDateTime(note.createdAt),
        note.employee?.employeeName || '',
        note.employee?.departmentName || '',
        note.manager?.employeeName || '',
        note.pipStatus || '',
        note.content,
        getAuthorName(note),
      ]),
    ]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'PIP Note History')
    XLSX.writeFile(workbook, `pip-note-history-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const hasActiveFilters = employeeName || departmentId || managerId || pipStatus || dateFrom || dateTo
  const activeFilterCount = [employeeName, departmentId, pipStatus, dateFrom, dateTo].filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-6 px-8 py-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: pipPrimaryMuted }}>
              <MessageSquare size={24} style={{ color: pipPrimary }} />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                style={{ backgroundColor: pipPrimaryLight, color: pipPrimaryDarker }}>
                Performance Improvement Plan
              </div>
              <h1 className="mt-1.5 text-2xl font-bold text-slate-900">PIP Note History</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Review communication notes across all performance improvement plans.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExport}
              disabled={notes.length === 0}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 hover:shadow-md"
              style={{ backgroundColor: pipPrimary }}
            >
              <Download size={16} />
              Export Excel
            </button>
          </div>
        </div>
        <div className="border-t border-slate-100">
          <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="flex items-center gap-4 px-8 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: pipPrimaryMuted }}>
                <FileText size={18} style={{ color: pipPrimary }} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Records</p>
                <p className="mt-0.5 text-xl font-bold text-slate-900">{notesPage?.totalElements ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-8 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: pipPrimaryMuted }}>
                <MessageSquare size={18} style={{ color: pipPrimary }} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Communication Notes</p>
                <p className="mt-0.5 text-xl font-bold" style={{ color: pipPrimary }}>{visibleCommunications}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Section ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200">
        <button
          type="button"
          onClick={() => setFiltersVisible((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: pipPrimaryMuted }}>
              <SlidersHorizontal size={15} style={{ color: pipPrimary }} />
            </div>
            <span className="text-sm font-bold text-slate-800">Filters</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={{ backgroundColor: pipPrimaryMuted, color: pipPrimaryDarker }}>
                {activeFilterCount} active
              </span>
            )}
          </div>
          <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${filtersVisible ? 'rotate-180' : ''}`} />
        </button>

        {filtersVisible && (
          <div className="border-t border-slate-100 px-6 pb-6 pt-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Search size={12} />
                  Employee
                </label>
                <input
                  type="text"
                  value={employeeName}
                  onChange={(event) => { setEmployeeName(event.target.value); setPage(0) }}
                  placeholder="Search employee..."
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-[--pip-border] focus:outline-none focus:ring-4"
                  style={{ ['--pip-border' as string]: pipPrimaryBorder, '--pip-ring': `${pipPrimaryMuted}80` } as React.CSSProperties}
                  onFocus={(e) => { e.target.style.borderColor = pipPrimaryBorder; e.target.style.setProperty('--tw-ring-color', `${pipPrimaryMuted}80`) }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Building2 size={12} />
                  Department
                </label>
                <select
                  value={departmentId ?? ''}
                  onChange={(event) => {
                    const nextDepartmentId = event.target.value ? Number(event.target.value) : undefined
                    setDepartmentId(nextDepartmentId)
                    setManagerId(getDepartmentHeadId(nextDepartmentId))
                    setPage(0)
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm transition-all duration-200 focus:border-[--pip-border] focus:outline-none focus:ring-4"
                  style={{ ['--pip-border' as string]: pipPrimaryBorder } as React.CSSProperties}
                >
                  <option value="">All Departments</option>
                  {departmentOptions.map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <UserCircle size={12} />
                  Manager
                </label>
                <select
                  value={managerId ?? ''}
                  onChange={(event) => {
                    setManagerId(event.target.value ? Number(event.target.value) : undefined)
                    setPage(0)
                  }}
                  disabled
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm transition-all duration-200 focus:border-[--pip-border] focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  style={{ ['--pip-border' as string]: pipPrimaryBorder } as React.CSSProperties}
                >
                  <option value="">
                    {!departmentId
                      ? 'Select department first'
                      : managerOptions.length > 0
                        ? 'Department head'
                        : 'No department head assigned'}
                  </option>
                  {managerOptions.map((manager) => (
                    <option key={manager.id} value={manager.id}>{manager.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <AlertCircle size={12} />
                  PIP Status
                </label>
                <select
                  value={pipStatus}
                  onChange={(event) => { setPipStatus(event.target.value); setPage(0) }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm transition-all duration-200 focus:border-[--pip-border] focus:outline-none focus:ring-4"
                  style={{ ['--pip-border' as string]: pipPrimaryBorder } as React.CSSProperties}
                >
                  <option value="">All Statuses</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Calendar size={12} />
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => { setDateFrom(event.target.value); setPage(0) }}
                  max={dateTo || undefined}
                  className={`rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm transition-all duration-200 focus:outline-none focus:ring-4 ${
                    hasInvalidDateRange
                      ? 'border-red-300 text-red-600 focus:border-red-400 focus:ring-red-100'
                      : 'border-slate-200 focus:border-[--pip-border]'
                  }`}
                  style={{ ['--pip-border' as string]: pipPrimaryBorder } as React.CSSProperties}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Calendar size={12} />
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => { setDateTo(event.target.value); setPage(0) }}
                  min={dateFrom || undefined}
                  className={`rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm transition-all duration-200 focus:outline-none focus:ring-4 ${
                    hasInvalidDateRange
                      ? 'border-red-300 text-red-600 focus:border-red-400 focus:ring-red-100'
                      : 'border-slate-200 focus:border-[--pip-border]'
                  }`}
                  style={{ ['--pip-border' as string]: pipPrimaryBorder } as React.CSSProperties}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-500">
                {hasInvalidDateRange && (
                  <>
                    <AlertCircle size={16} />
                    Date From must be on or before Date To.
                  </>
                )}
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                >
                  <RotateCcw size={14} />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Results ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {hasInvalidDateRange && (
          <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">Invalid date range</p>
              <p className="mt-1 text-sm text-slate-500">Adjust the date filters to continue.</p>
            </div>
          </div>
        )}

        {!hasInvalidDateRange && isLoading && (
          <div className="space-y-4 px-6 py-16">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        )}

        {!hasInvalidDateRange && isError && (
          <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">Failed to load notes</p>
              <p className="mt-1 text-sm text-slate-500">Please try again later or contact support.</p>
            </div>
          </div>
        )}

        {!hasInvalidDateRange && !isLoading && !isError && notes.length === 0 && (
          <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
              <Inbox size={32} className="text-slate-300" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">No notes found</p>
              <p className="mt-1 text-sm text-slate-500">
                {hasActiveFilters ? 'Try adjusting your filters.' : 'No communication notes recorded yet.'}
              </p>
            </div>
          </div>
        )}

        {!hasInvalidDateRange && !isLoading && !isError && notes.length > 0 && (
          <div className="divide-y divide-slate-100">
            {notes.map((note) => (
              <article
                key={note.id}
                className="group px-8 py-6 transition-colors hover:bg-slate-50/70"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1 space-y-4">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                        style={{ backgroundColor: pipPrimaryMuted, color: pipPrimaryDarker }}>
                        <MessageSquare size={12} />
                        Communication Note
                      </span>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${pipStatusColors[note.pipStatus || ''] || 'bg-slate-50 text-slate-600'}`}>
                        {getStatusLabel(note.pipStatus).replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-medium text-slate-400">{formatDateTime(note.createdAt)}</span>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
                        <Users size={16} className="text-slate-400" />
                        <div>
                          <p className="text-xs font-semibold text-slate-500">Employee</p>
                          <p className="text-sm font-bold text-slate-900">{note.employee?.employeeName || '-'}</p>
                          {note.employee?.departmentName && (
                            <p className="text-xs text-slate-500">{note.employee.departmentName}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
                        <UserCircle size={16} className="text-slate-400" />
                        <div>
                          <p className="text-xs font-semibold text-slate-500">Manager</p>
                          <p className="text-sm font-bold text-slate-900">{note.manager?.employeeName || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
                        <UserCircle size={16} className="text-slate-400" />
                        <div>
                          <p className="text-xs font-semibold text-slate-500">Recorded By</p>
                          <p className="text-sm font-bold text-slate-900">{getAuthorName(note)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Note content */}
                    <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 px-5 py-4 shadow-sm">
                      <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                        {note.content}
                      </p>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="shrink-0 xl:pt-1">
                    <Link
                      to={`${pipMonitoringBasePath}/${note.pipId}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all duration-200 hover:border-[--pip-border] hover:text-white"
                      style={{ ['--pip-border' as string]: pipPrimaryBorder } as React.CSSProperties}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = pipPrimary; e.currentTarget.style.borderColor = pipPrimary }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                    >
                      View PIP
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {!hasInvalidDateRange && !isLoading && !isError && notes.length > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span>
              Page <span className="font-bold text-slate-800">{page + 1}</span> of{' '}
              <span className="font-bold text-slate-800">{totalPages}</span>
            </span>
            <span className="hidden text-slate-300 sm:inline">|</span>
            <span className="hidden sm:inline">
              <span className="font-bold text-slate-800">{notes.length}</span> of{' '}
              <span className="font-bold text-slate-800">{notesPage?.totalElements ?? 0}</span> records
            </span>
            <label className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Rows:</span>
              <select
                value={size}
                onChange={(event) => { setSize(Number(event.target.value)); setPage(0) }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none transition-colors"
                style={{ '--focus-color': pipPrimaryBorder } as React.CSSProperties}
              >
                {[10, 20, 50].map((rows) => (
                  <option key={rows} value={rows}>{rows}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              disabled={page === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Prev
            </button>

            {getPageNumbers(page, totalPages).map((p, index) =>
              typeof p === 'string' ? (
                <span key={`ellipsis-${index}`} className="px-2 text-xs text-slate-300">...</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold shadow-sm transition-all duration-200 ${
                    p === page
                      ? 'text-white shadow-md'
                      : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  style={p === page ? { backgroundColor: pipPrimary } : undefined}
                >
                  {p + 1}
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
