import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Link, useLocation } from 'react-router-dom'
import {
  FileText, MessageSquare, CalendarCheck, Download, ChevronRight,
  Search, SlidersHorizontal, RotateCcw, AlertCircle, Loader2,
  Inbox, Users, Building2, UserCircle,
} from 'lucide-react'
import { useGetAllPipNotesQuery, useGetPipsQuery } from '../../features/pip/pipApi'
import { useGetDepartmentsQuery } from '../../features/hrCreateEmployee/hrEmployeeAccountApi'
import { useGetManagersQuery } from '../../features/department/api/departmentApi'
import { formatDateTime } from '../../utils/dateUtils'
import { PaginationBar } from '../../components/common/PaginationBar'

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

const getStatusStyle = (status?: string) => {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    COMPLETED: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    CLOSED: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    AUTO_CLOSED: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    REOPEN_REQUESTED: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    DENIED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  }
  return styles[status as keyof typeof styles] || 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
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

  return (
    <div className="mx-auto max-w-[1600px] p-6 lg:p-8 space-y-6">
      {/* ── Header ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="relative bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-8 py-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold tracking-wide text-blue-100 backdrop-blur-sm ring-1 ring-white/20">
                <FileText className="h-3.5 w-3.5" />
                Performance Improvement Plan
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
                PIP Note History
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-blue-100">
                Review communication and follow-up meeting notes across all performance improvement plans.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={notes.length === 0}
              className="inline-flex shrink-0 items-center gap-2.5 rounded-xl bg-white/15 px-6 py-3 text-sm font-bold text-white shadow-lg backdrop-blur-sm ring-1 ring-white/20 transition-all duration-200 hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-px bg-slate-200 md:grid-cols-3">
          <div className="bg-white px-8 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#2463eb]">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Total Records</p>
                <p className="mt-1 text-3xl font-black text-slate-900">{notesPage?.totalElements ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white px-8 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Follow-up Notes</p>
                <p className="mt-1 text-3xl font-black text-emerald-600">{visibleFollowups}</p>
              </div>
            </div>
          </div>
          <div className="bg-white px-8 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Communication Notes</p>
                <p className="mt-1 text-3xl font-black text-violet-600">{visibleCommunications}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Section ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setFiltersVisible((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] text-white shadow-sm">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800">Filters</span>
              <span className="ml-1 text-xs font-medium text-slate-400">
                {activeFilterCount > 0 ? `(${activeFilterCount} active)` : '(optional)'}
              </span>
              {hasActiveFilters && (
                <span className="ml-2 inline-flex items-center rounded-full bg-[#2463eb]/10 px-2.5 py-0.5 text-xs font-bold text-[#2463eb]">
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
                <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <Search className="h-3 w-3" />
                  Employee
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={employeeName}
                    onChange={(event) => { setEmployeeName(event.target.value); setPage(0) }}
                    placeholder="Search employee..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-[#2463eb] focus:outline-none focus:ring-4 focus:ring-[#2463eb]/10"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
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
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 focus:border-[#2463eb] focus:outline-none focus:ring-4 focus:ring-[#2463eb]/10"
                >
                  <option value="">All Departments</option>
                  {departmentOptions.map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
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
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 focus:border-[#2463eb] focus:outline-none focus:ring-4 focus:ring-[#2463eb]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
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
                <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <FileText className="h-3 w-3" />
                  Note Type
                </label>
                <select
                  value={noteType}
                  onChange={(event) => { setNoteType(event.target.value as typeof noteType); setPage(0) }}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 focus:border-[#2463eb] focus:outline-none focus:ring-4 focus:ring-[#2463eb]/10"
                >
                  <option value="">All Types</option>
                  {NOTE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <AlertCircle className="h-3 w-3" />
                  PIP Status
                </label>
                <select
                  value={pipStatus}
                  onChange={(event) => { setPipStatus(event.target.value); setPage(0) }}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 focus:border-[#2463eb] focus:outline-none focus:ring-4 focus:ring-[#2463eb]/10"
                >
                  <option value="">All Statuses</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => { setDateFrom(event.target.value); setPage(0) }}
                  max={dateTo || undefined}
                  className={`h-10 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 focus:border-[#2463eb] focus:outline-none focus:ring-4 focus:ring-[#2463eb]/10 ${hasInvalidDateRange ? 'border-red-300 text-red-600' : ''}`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => { setDateTo(event.target.value); setPage(0) }}
                  min={dateFrom || undefined}
                  className={`h-10 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 focus:border-[#2463eb] focus:outline-none focus:ring-4 focus:ring-[#2463eb]/10 ${hasInvalidDateRange ? 'border-red-300 text-red-600' : ''}`}
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
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
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
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {hasInvalidDateRange && (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-7 w-7 text-red-400" />
            </div>
            <p className="text-sm font-bold text-red-600">Invalid date range detected</p>
            <p className="text-xs text-slate-500">Adjust the date filters above to continue.</p>
          </div>
        )}

        {!hasInvalidDateRange && isLoading && (
          <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#2463eb]" />
            <p className="text-sm font-medium text-slate-500">Loading note history...</p>
          </div>
        )}

        {!hasInvalidDateRange && isError && (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-7 w-7 text-red-400" />
            </div>
            <p className="text-sm font-bold text-red-600">Unable to load PIP note history</p>
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
              <div
                key={note.id}
                className="group relative p-6 transition-all duration-200 hover:bg-slate-50/70 lg:px-8 lg:py-7"
              >
                <div
                  className={`absolute left-0 top-0 h-full w-1 rounded-r transition-all duration-200 ${
                    note.noteType === 'FOLLOWUP'
                      ? 'bg-emerald-500'
                      : 'bg-[#2463eb]'
                  } ${note.noteType === 'FOLLOWUP' ? 'opacity-0 group-hover:opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
                />

                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 ${
                        note.noteType === 'FOLLOWUP'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : 'bg-blue-50 text-blue-700 ring-blue-200'
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
                      <span className="text-xs font-semibold text-slate-400">{formatDateTime(note.createdAt)}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="rounded-xl bg-slate-50/80 p-3.5 transition-colors group-hover:bg-white">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <Users className="h-3 w-3" />
                          Employee
                        </div>
                        <p className="mt-1.5 font-bold text-slate-900">{note.employee?.employeeName || '-'}</p>
                        <p className="text-xs font-medium text-slate-500">{note.employee?.departmentName || '-'}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50/80 p-3.5 transition-colors group-hover:bg-white">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <UserCircle className="h-3 w-3" />
                          Manager
                        </div>
                        <p className="mt-1.5 font-bold text-slate-900">{note.manager?.employeeName || '-'}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50/80 p-3.5 transition-colors group-hover:bg-white">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <UserCircle className="h-3 w-3" />
                          Recorded By
                        </div>
                        <p className="mt-1.5 font-bold text-slate-900">{getAuthorName(note)}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-sm transition-shadow duration-200 group-hover:shadow-md">
                      <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                        {note.content}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 xl:pt-1">
                    <Link
                      to={`${pipMonitoringBasePath}/${note.pipId}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all duration-200 hover:border-[#2463eb]/30 hover:bg-[#2463eb]/5 hover:text-[#2463eb] hover:shadow-md"
                    >
                      View PIP
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {!hasInvalidDateRange && !isLoading && !isError && notes.length > 0 && (
        <PaginationBar
          pageIndex={page}
          pageSize={size}
          pageCount={totalPages}
          totalItems={notesPage?.totalElements ?? 0}
          itemLabel="records"
          onPageIndexChange={setPage}
          onPageSizeChange={(newSize) => { setSize(newSize); setPage(0) }}
          rowsPerPageOptions={[10, 20, 50]}
        />
      )}
    </div>
  )
}
