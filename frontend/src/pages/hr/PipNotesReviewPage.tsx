import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGetAllPipNotesQuery, useGetPipsQuery } from '../../features/pip/pipApi'
import { useGetDepartmentsQuery } from '../../features/hrCreateEmployee/hrEmployeeAccountApi'
import { formatDateTime } from '../../utils/dateUtils'

const STATUS_OPTIONS = ['ACTIVE', 'AUTO_CLOSED', 'REOPEN_REQUESTED', 'COMPLETED', 'CLOSED', 'DENIED']
const NOTE_TYPE_OPTIONS = [
  { value: 'COMMUNICATION', label: 'Communication' },
  { value: 'FOLLOWUP', label: 'Followup' },
] as const

const getAuthorName = (note: { author: { email: string; employee?: { employeeName?: string } } }) => {
  return note.author.employee?.employeeName || note.author.email || 'Unknown author'
}

const csvEscape = (value: unknown) => {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

export default function PipNotesReviewPage() {
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

  useEffect(() => {
    setPage(0)
  }, [employeeName, managerId, departmentId, noteType, pipStatus, dateFrom, dateTo, size])

  const handleExport = () => {
    const rows = [
      ['Employee', 'Department', 'Manager', 'Note Type', 'PIP Status', 'Note Content', 'Author', 'Date'],
      ...notes.map((note) => [
        note.employee?.employeeName || '',
        note.employee?.departmentName || '',
        note.manager?.employeeName || '',
        note.noteType || '',
        note.pipStatus || '',
        note.content,
        getAuthorName(note),
        formatDateTime(note.createdAt),
      ]),
    ]
    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'pip-communication-notes.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-[1600px] p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">PIP Communication Notes</h1>
          <p className="mt-1 text-slate-500">Review communication notes across all performance improvement plans.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={notes.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#115e59] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#0f4f4b] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <i className="bi bi-download" />
          Export CSV
        </button>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-7">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Employee Search</label>
            <input
              type="text"
              value={employeeName}
              onChange={(event) => setEmployeeName(event.target.value)}
              placeholder="Employee name..."
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Manager</label>
            <select
              value={managerId ?? ''}
              onChange={(event) => setManagerId(event.target.value ? Number(event.target.value) : undefined)}
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
              onChange={(event) => setDepartmentId(event.target.value ? Number(event.target.value) : undefined)}
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
              onChange={(event) => setNoteType(event.target.value as typeof noteType)}
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
              onChange={(event) => setPipStatus(event.target.value)}
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
              onChange={(event) => setDateFrom(event.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setEmployeeName('')
              setManagerId(undefined)
              setDepartmentId(undefined)
              setNoteType('')
              setPipStatus('')
              setDateFrom('')
              setDateTo('')
            }}
            className="text-sm font-bold text-blue-600 hover:text-blue-800"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-100">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 bg-slate-50/50">
            <tr>
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Employee</th>
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Department</th>
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Manager</th>
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Note Type</th>
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">PIP Status</th>
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Note Content</th>
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Author</th>
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
              <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-slate-500">Loading notes...</td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-red-600">Unable to load PIP notes.</td>
              </tr>
            )}
            {!isLoading && !isError && notes.map((note) => (
              <tr key={note.id} className="align-top hover:bg-slate-50">
                <td className="px-5 py-4 text-sm font-semibold text-slate-900">{note.employee?.employeeName || '-'}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{note.employee?.departmentName || '-'}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{note.manager?.employeeName || '-'}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{note.noteType.replace(/_/g, ' ')}</td>
                <td className="px-5 py-4">
                  <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                    {(note.pipStatus || '-').replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="max-w-xl px-5 py-4 text-sm leading-6 text-slate-700">
                  <p className="line-clamp-3 whitespace-pre-wrap">{note.content}</p>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">{getAuthorName(note)}</td>
                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{formatDateTime(note.createdAt)}</td>
                <td className="whitespace-nowrap px-5 py-4 text-right">
                  <Link
                    to={`/hr/pip-monitoring/${note.pipId}`}
                    className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800"
                  >
                    View PIP
                    <i className="bi bi-chevron-right text-[10px]" />
                  </Link>
                </td>
              </tr>
            ))}
            {!isLoading && !isError && notes.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center text-slate-500">No PIP communication notes found.</td>
              </tr>
            )}
          </tbody>
        </table>
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
              onChange={(event) => setSize(Number(event.target.value))}
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
