import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  type SortingState,
  type ColumnDef,
  type OnChangeFn,
} from '@tanstack/react-table'
import { useMemo, memo } from 'react'
import {
  Briefcase, Hash, Layers, Shield,
  ArrowUp, ArrowDown, ArrowUpDown,
  Edit2, Trash2,
  Loader2,
} from 'lucide-react'
import type { PositionDto } from '../api/positionApi'

interface PositionTableProps {
  data: PositionDto[]
  isLoading: boolean
  onEdit: (id: number) => void
  onRemove: (position: PositionDto) => void
  onShowAssignedDepartments?: (position: PositionDto) => void
  sorting: SortingState
  setSorting: OnChangeFn<SortingState>
}

function PositionTable({
  data,
  isLoading,
  onEdit,
  onRemove,
  onShowAssignedDepartments,
  sorting,
  setSorting,
}: PositionTableProps) {
  const columns = useMemo<ColumnDef<PositionDto>[]>(
    () => [
      {
        accessorKey: 'positionCode',
        header: 'Position Code',
        cell: (info) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
              <Hash className="w-4 h-4 text-slate-600" />
            </div>
            <span className="font-semibold text-slate-900">{info.getValue() as string}</span>
          </div>
        ),
      },
      {
        accessorKey: 'positionName',
        header: 'Position Name',
        cell: (info) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-slate-700 font-medium">{info.getValue() as string}</span>
          </div>
        ),
      },
      {
        accessorKey: 'levelCodeName',
        header: 'Level Code',
        cell: (info) => {
          const value = info.getValue() as string
          return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              {value}
            </span>
          )
        },
      },
      {
        accessorKey: 'roleName',
        header: 'Role',
        cell: (info) => {
          const value = info.getValue() as string
          return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              {value}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const row = info.row.original
          return (
            <div className="flex items-center gap-1">
              {onShowAssignedDepartments && (
                <button
                  onClick={() => onShowAssignedDepartments(row)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-blue-700 transition-all duration-200 hover:bg-blue-50 active:scale-95"
                  title="Assigned Departments"
                >
                  <i className="bi bi-diagram-3 text-sm" aria-hidden />
                  <span>Assigned Departments</span>
                </button>
              )}
              <button
                onClick={() => onEdit(row.positionId)}
                className="p-2.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                title="Edit Position"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onRemove(row)}
                className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                title="Remove Position"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )
        },
      },
    ],
    [onEdit, onRemove, onShowAssignedDepartments]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        </div>
        <p className="mt-4 text-sm text-slate-500 font-medium">Loading positions...</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-200/50 transition-colors select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <span className="ml-1">
                      {header.column.getIsSorted() === 'asc' ? (
                        <ArrowUp className="w-4 h-4 text-indigo-600" />
                      ) : header.column.getIsSorted() === 'desc' ? (
                        <ArrowDown className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                      )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-purple-50/30 transition-all duration-200 group">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 text-sm text-slate-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-20 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                    <Briefcase className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-lg font-semibold text-slate-700">No positions found</p>
                  <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default memo(PositionTable)
