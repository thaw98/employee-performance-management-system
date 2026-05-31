import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Link, useLocation } from 'react-router-dom'
import {
  FileText, MessageSquare, CalendarCheck, Download, ChevronRight,
  Search, SlidersHorizontal, RotateCcw, AlertCircle, Loader2,
  Inbox, ChevronLeft, Users, Building2, UserCircle,
} from 'lucide-react'
import { useGetAllPipNotesQuery, useGetPipsQuery } from '../../features/pip/pipApi'
import { useGetDepartmentsQuery } from '../../features/hrCreateEmployee/hrEmployeeAccountApi'
import { useGetManagersQuery } from '../../features/department/api/departmentApi'
import { formatDateTime } from '../../utils/dateUtils'

const STATUS_OPTIONS = ['ACTIVE', 'AUTO_CLOSED', 'REOPEN_REQUESTED', 'COMPLETED', 'CLOSED', 'DENIED']
const NOTE_TYPE_OPTIONS = [
  { value: 'COMMUNICATION', label: 'Communication Note' },
  { value: 'FOLLOWUP', label: 'Follow-up Meeting Note' },
] as const

const getAuthorName = (note: { author: { email: string; employee?: { employeeName?: string } } }) => {
  return note.author.employee?.employeeName || note.author.email || 'Unknown author'
}

const getNoteTypeLabel = (noteType: string) => {
  return noteType === 'FOLLOWUP' ? 'Follow-up Meeting Note' : 'Communication Note'
}

const STYLES = {
  badge: {
    followup: 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    communication: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 ring-1 ring-blue-200',
  },
  status: {
    ACTIVE: 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 ring-1 ring-green-200',
    COMPLETED: 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 ring-1 ring-slate-200',
    CLOSED: 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 ring-1 ring-slate-200',
    AUTO_CLOSED: 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 ring-1 ring-amber-200',
    REOPEN_REQUESTED: 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 ring-1 ring-amber-200',
    DENIED: 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 ring-1 ring-red-200',
  },
  input: 'rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100',
  select: 'rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm transition-all duration-200 focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100',
}

function getStatusStyle(status?: string) {
  return STYLES.status[status as keyof typeof STYLES.status] || 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-500 ring-1 ring-slate-200'
}

export default function PipNotesReviewPage() {
  const location = useLocation()
  const pipMonitoringBasePath = location.pathname.startsWith('/audit/') ? '/audit/pip-monitoring' : '/hr/pip-monitoring'
  const [employeeName, setEmployeeName] = useState('')
  const [managerId, setManagerId] = useState<number | undefined>(undefined)
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined)
  const [noteType, setNoteType] = useState<'COMMUNICATION' | 'FOLLOWUP' | ''>('')
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
    noteType: noteType || undefined,
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
    if (!departmentId) {
      return undefined
    }
    return departmentsResponse?.data?.find((department) => (department.departmentId ?? department.id) === departmentId)
  }, [departmentId, departmentsResponse])

  const managerOptions = useMemo(() => {
    if (!departmentId || !selectedDepartment?.managerId) {
      return []
    }
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
    if (!nextDepartmentId) {
      return undefined
    }
    const department = departmentsResponse?.data?.find((item) => (item.departmentId ?? item.id) === nextDepartmentId)
    return department?.managerId ?? undefined
  }

  const notes = notesPage?.content ?? []
  const totalPages = Math.max(notesPage?.totalPages ?? 1, 1)
  const visibleFollowups = notes.filter((note) => note.noteType === 'FOLLOWUP').length
  const visibleCommunications = notes.filter((note) => note.noteType === 'COMMUNICATION').length

  const clearFilters = () => {
    setEmployeeName('')
    setManagerId(undefined)
    setDepartmentId(undefined)
    setNoteType('')
    setPipStatus('')
    setDateFrom('')
    setDateTo('')
    setPage(0)
  }

  const handleExport = () => {
    const rows = [
      ['Date', 'Employee', 'Department', 'Manager', 'History Type', 'PIP Status', 'Note Content', 'Author'],
      ...notes.map((note) => [
        formatDateTime(note.createdAt),
        note.employee?.employeeName || '',
        note.employee?.departmentName || '',
        note.manager?.employeeName || '',
        getNoteTypeLabel(note.noteType),
        note.pipStatus || '',
        note.content,
        getAuthorName(note),
      ]),
    ]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'PIP Note History')
    XLSX.writeFile(workbook, `pip-note-history-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const hasActiveFilters = employeeName || departmentId || managerId || noteType || pipStatus || dateFrom || dateTo
  const activeFilterCount = [employeeName, departmentId, noteType, pipStatus, dateFrom, dateTo].filter(Boolean).length

  const getPageNumbers = () => {
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

  return (
    <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
      {/* ── Header ── */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-8 py-10 shadow-2xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-indigo-200 backdrop-blur-sm">
              <FileText className="h-3.5 w-3.5" />
              Performance Improvement Plan
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
              PIP Note History
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
              Review communication and follow-up meeting notes across all performance improvement plans.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={notes.length === 0}
            className="inline-flex shrink-0 items-center gap-2.5 rounded-xl bg-white/10 px-6 py-3 text-sm font-bold text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
        </div>

        {/* Stats */}
        <div className="relative mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="group rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all duration-200 hover:bg-white/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Total Records</p>
                <p className="mt-2 text-3xl font-black text-white">{notesPage?.totalElements ?? 0}</p>
              </div>
              <div className="rounded-lg bg-white/10 p-2.5 text-indigo-300 transition-colors group-hover:bg-white/20">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="group rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all duration-200 hover:bg-white/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Follow-up Notes</p>
                <p className="mt-2 text-3xl font-black text-emerald-400">{visibleFollowups}</p>
              </div>
              <div className="rounded-lg bg-white/10 p-2.5 text-emerald-300 transition-colors group-hover:bg-white/20">
                <CalendarCheck className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="group rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all duration-200 hover:bg-white/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Communication Notes</p>
                <p className="mt-2 text-3xl font-black text-blue-400">{visibleCommunications}</p>
              </div>
              <div className="rounded-lg bg-white/10 p-2.5 text-blue-300 transition-colors group-hover:bg-white/20">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Section ── */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-100/50 transition-all duration-200">
        <button
          type="button"
          onClick={() => setFiltersVisible((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-slate-50/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-sm">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800">Filters</span>
              {hasActiveFilters && (
                <span className="ml-2 inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                  {activeFilterCount} active
                </span>
              )}
            </div>
          </div>
          <div className={`text-slate-400 transition-transform duration-200 ${filtersVisible ? 'rotate-180' : ''}`}>
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>

        {filtersVisible && (
          <div className="border-t border-slate-100 px-6 pb-6 pt-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Search className="h-3 w-3" />
                  Employee
                </label>
                <input
                  type="text"
                  value={employeeName}
                  onChange={(event) => { setEmployeeName(event.target.value); setPage(0) }}
                  placeholder="Search employee..."
                  className={STYLES.input}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Building2 className="h-3 w-3" />
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
                  className={STYLES.select}
                >
                  <option value="">All Departments</option>
                  {departmentOptions.map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <UserCircle className="h-3 w-3" />
                  Manager
                </label>
                <select
                  value={managerId ?? ''}
                  onChange={(event) => {
                    setManagerId(event.target.value ? Number(event.target.value) : undefined)
                    setPage(0)
                  }}
                  disabled
                  className={`${STYLES.select} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
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
                  <FileText className="h-3 w-3" />
                  Note Type
                </label>
                <select
                  value={noteType}
                  onChange={(event) => { setNoteType(event.target.value as typeof noteType); setPage(0) }}
                  className={STYLES.select}
                >
                  <option value="">All Types</option>
                  {NOTE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <AlertCircle className="h-3 w-3" />
                  PIP Status
                </label>
                <select
                  value={pipStatus}
                  onChange={(event) => { setPipStatus(event.target.value); setPage(0) }}
                  className={STYLES.select}
                >
                  <option value="">All Statuses</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => { setDateFrom(event.target.value); setPage(0) }}
                  max={dateTo || undefined}
                  className={`${STYLES.input} ${hasInvalidDateRange ? 'border-red-300 text-red-600' : ''}`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => { setDateTo(event.target.value); setPage(0) }}
                  min={dateFrom || undefined}
                  className={`${STYLES.input} ${hasInvalidDateRange ? 'border-red-300 text-red-600' : ''}`}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-500">
                {hasInvalidDateRange && (
                  <>
                    <AlertCircle className="h-4 w-4" />
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
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Results ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-100/50">
        {hasInvalidDateRange && (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-7 w-7 text-red-400" />
            </div>
            <p className="text-sm font-semibold text-red-600">Invalid date range detected</p>
            <p className="text-xs text-slate-500">Adjust the date filters above to continue.</p>
          </div>
        )}

        {!hasInvalidDateRange && isLoading && (
          <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm font-medium text-slate-500">Loading note history...</p>
          </div>
        )}

        {!hasInvalidDateRange && isError && (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-7 w-7 text-red-400" />
            </div>
            <p className="text-sm font-semibold text-red-600">Unable to load PIP note history</p>
            <p className="text-xs text-slate-500">Please try again later or contact support.</p>
          </div>
        )}

        {!hasInvalidDateRange && !isLoading && !isError && notes.length === 0 && (
          <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
              <Inbox className="h-8 w-8 text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No PIP note history found</p>
              <p className="mt-1 text-xs text-slate-400">
                {hasActiveFilters ? 'Try adjusting your filters.' : 'There are no notes recorded yet.'}
              </p>
            </div>
          </div>
        )}

        {!hasInvalidDateRange && !isLoading && !isError && notes.length > 0 && (
          <div className="divide-y divide-slate-100">
            {notes.map((note) => (
              <article
                key={note.id}
                className="group relative p-6 transition-all duration-200 hover:bg-slate-50/70 lg:p-8"
              >
                {/* Left accent bar */}
                <div
                  className={`absolute bottom-0 left-0 top-0 w-1 rounded-r transition-all duration-200 ${
                    note.noteType === 'FOLLOWUP'
                      ? 'bg-gradient-to-b from-emerald-400 to-emerald-500'
                      : 'bg-gradient-to-b from-blue-400 to-blue-500'
                  } ${note.noteType === 'FOLLOWUP' ? 'opacity-0 group-hover:opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
                />

                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1 space-y-4">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 ${
                        note.noteType === 'FOLLOWUP' ? STYLES.badge.followup : STYLES.badge.communication
                      }`}>
                        {note.noteType === 'FOLLOWUP' ? (
                          <CalendarCheck className="h-3 w-3" />
                        ) : (
                          <MessageSquare className="h-3 w-3" />
                        )}
                        {getNoteTypeLabel(note.noteType)}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 ${getStatusStyle(note.pipStatus)}`}>
                        {(note.pipStatus || 'UNKNOWN').replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-medium text-slate-400">{formatDateTime(note.createdAt)}</span>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="rounded-xl bg-slate-50/80 p-3.5 transition-colors group-hover:bg-white">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                          <Users className="h-3 w-3" />
                          Employee
                        </div>
                        <p className="mt-1.5 font-bold text-slate-900">{note.employee?.employeeName || '-'}</p>
                        <p className="text-xs text-slate-500">{note.employee?.departmentName || '-'}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50/80 p-3.5 transition-colors group-hover:bg-white">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                          <UserCircle className="h-3 w-3" />
                          Manager
                        </div>
                        <p className="mt-1.5 font-semibold text-slate-800">{note.manager?.employeeName || '-'}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50/80 p-3.5 transition-colors group-hover:bg-white">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                          <UserCircle className="h-3 w-3" />
                          Recorded By
                        </div>
                        <p className="mt-1.5 font-semibold text-slate-800">{getAuthorName(note)}</p>
                      </div>
                    </div>

                    {/* Note content */}
                    <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-sm transition-shadow duration-200 group-hover:shadow-md">
                      <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                        {note.content}
                      </p>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="shrink-0 xl:pt-1">
                    <Link
                      to={`${pipMonitoringBasePath}/${note.pipId}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md"
                    >
                      View PIP
                      <ChevronRight className="h-3.5 w-3.5" />
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
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-100/50">
          <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span>
                Page <span className="font-bold text-slate-700">{page + 1}</span> of{' '}
                <span className="font-bold text-slate-700">{totalPages}</span>
              </span>
              <span className="hidden text-slate-300 sm:inline">|</span>
              <span className="hidden sm:inline">
                Showing <span className="font-bold text-slate-700">{notes.length}</span> of{' '}
                <span className="font-bold text-slate-700">{notesPage?.totalElements ?? 0}</span> records
              </span>
              <label className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Rows:</span>
                <select
                  value={size}
                  onChange={(event) => { setSize(Number(event.target.value)); setPage(0) }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-200 focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100"
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
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-500 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>

              {getPageNumbers().map((p, index) =>
                typeof p === 'string' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-xs text-slate-300">...</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold shadow-sm transition-all duration-200 ${
                      p === page
                        ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md'
                        : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {p + 1}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-500 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
