import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Link, useLocation } from 'react-router-dom'
import { useGetAllPipNotesQuery, useGetPipsQuery } from '../../features/pip/pipApi'
import { useGetDepartmentsQuery } from '../../features/hrCreateEmployee/hrEmployeeAccountApi'
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

const getNoteTypeClass = (noteType: string) => {
  return noteType === 'FOLLOWUP'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
    : 'bg-blue-50 text-blue-700 ring-blue-100'
}

const getStatusClass = (status?: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-50 text-green-700'
    case 'COMPLETED':
    case 'CLOSED':
      return 'bg-slate-100 text-slate-700'
    case 'AUTO_CLOSED':
    case 'REOPEN_REQUESTED':
      return 'bg-amber-50 text-amber-700'
    case 'DENIED':
      return 'bg-red-50 text-red-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
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
  })
  const { data: pips = [] } = useGetPipsQuery()
  const { data: departmentsResponse } = useGetDepartmentsQuery()

  const managerOptions = useMemo(() => {
    const managers = new Map<number, string>()
    pips.forEach((pip) => {
      const manager = pip.manager.employee
      if (manager?.id) {
        managers.set(manager.id, manager.employeeName || `Manager ${manager.id}`)
      }
    })
    return Array.from(managers.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [pips])

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

  return (
    <div className="mx-auto max-w-[1600px] p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">PIP Note History</h1>
          <p className="mt-1 text-slate-500">Review communication and follow-up meeting notes across all performance improvement plans.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={notes.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#115e59] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#0f4f4b] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <i className="bi bi-download" />
          Export Excel
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Visible Records</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{notesPage?.totalElements ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Follow-up Notes On Page</p>
          <p className="mt-2 text-3xl font-black text-emerald-700">{visibleFollowups}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Communication Notes On Page</p>
          <p className="mt-2 text-3xl font-black text-blue-700">{visibleCommunications}</p>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-7">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Employee Search</label>
            <input
              type="text"
              value={employeeName}
              onChange={(event) => {
                setEmployeeName(event.target.value)
                setPage(0)
              }}
              placeholder="Employee name..."
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Manager</label>
            <select
              value={managerId ?? ''}
              onChange={(event) => {
                setManagerId(event.target.value ? Number(event.target.value) : undefined)
                setPage(0)
              }}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Managers</option>
              {managerOptions.map((manager) => (
                <option key={manager.id} value={manager.id}>{manager.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Department</label>
            <select
              value={departmentId ?? ''}
              onChange={(event) => {
                setDepartmentId(event.target.value ? Number(event.target.value) : undefined)
                setPage(0)
              }}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Departments</option>
              {departmentOptions.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Note Type</label>
            <select
              value={noteType}
              onChange={(event) => {
                setNoteType(event.target.value as typeof noteType)
                setPage(0)
              }}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Types</option>
              {NOTE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">PIP Status</label>
            <select
              value={pipStatus}
              onChange={(event) => {
                setPipStatus(event.target.value)
                setPage(0)
              }}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value)
                setPage(0)
              }}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value)
                setPage(0)
              }}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-bold text-blue-600 hover:text-blue-800"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-100">
        {isLoading && <p className="px-6 py-12 text-center text-slate-500">Loading note history...</p>}
        {isError && <p className="px-6 py-12 text-center text-red-600">Unable to load PIP note history.</p>}
        {!isLoading && !isError && notes.length === 0 && (
          <p className="px-6 py-16 text-center text-slate-500">No PIP note history found.</p>
        )}
        {!isLoading && !isError && notes.length > 0 && (
          <div className="divide-y divide-slate-100">
            {notes.map((note) => (
              <article key={note.id} className="p-6 transition-colors hover:bg-slate-50/70">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${getNoteTypeClass(note.noteType)}`}>
                        {getNoteTypeLabel(note.noteType)}
                      </span>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(note.pipStatus)}`}>
                        {(note.pipStatus || 'UNKNOWN').replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">{formatDateTime(note.createdAt)}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Employee</p>
                        <p className="mt-1 font-bold text-slate-900">{note.employee?.employeeName || '-'}</p>
                        <p className="text-xs text-slate-500">{note.employee?.departmentName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Manager</p>
                        <p className="mt-1 font-semibold text-slate-700">{note.manager?.employeeName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Recorded By</p>
                        <p className="mt-1 font-semibold text-slate-700">{getAuthorName(note)}</p>
                      </div>
                    </div>
                    <p className="mt-5 whitespace-pre-wrap break-words rounded-xl border border-slate-100 bg-white p-4 text-sm leading-6 text-slate-700">
                      {note.content}
                    </p>
                  </div>
                  <Link
                    to={`${pipMonitoringBasePath}/${note.pipId}`}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
                  >
                    View PIP
                    <i className="bi bi-chevron-right text-[10px]" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-md shadow-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <span>
            Page <span className="font-bold text-slate-700">{page + 1}</span> of{' '}
            <span className="font-bold text-slate-700">{totalPages}</span>
          </span>
          <label className="flex items-center gap-2">
            <span className="text-slate-400">Rows:</span>
            <select
              value={size}
              onChange={(event) => {
                setSize(Number(event.target.value))
                setPage(0)
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
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
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
