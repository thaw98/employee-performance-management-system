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
import type { PositionDto } from '../api/positionApi'

interface PositionTableProps {
  data: PositionDto[]
  isLoading: boolean
  onEdit: (id: number) => void
  onRemove: (position: PositionDto) => void
  sorting: SortingState
  setSorting: OnChangeFn<SortingState>
}

function PositionTable({
  data,
  isLoading,
  onEdit,
  onRemove,
  sorting,
  setSorting,
}: PositionTableProps) {
  const columns = useMemo<ColumnDef<PositionDto>[]>(
    () => [
      {
        accessorKey: 'positionCode',
        header: 'Position Code',
        cell: (info) => (
          <span className="font-bold text-slate-900">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'positionName',
        header: 'Position Name',
        cell: (info) => (
          <span className="text-slate-700 font-medium">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'levelCodeName',
        header: 'Level Code',
        cell: (info) => {
          const value = info.getValue() as string
          return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-bold">
              <i className="bi bi-layers mr-1.5"></i>
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
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">
              <i className="bi bi-shield-check mr-1.5"></i>
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
              <button
                onClick={() => onEdit(row.positionId)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all hover:scale-105 active:scale-95"
                title="Edit Position"
              >
                <i className="bi bi-pencil-square text-lg"></i>
              </button>
              <button
                onClick={() => onRemove(row)}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all hover:scale-105 active:scale-95"
                title="Remove Position"
              >
                <i className="bi bi-trash text-lg"></i>
              </button>
            </div>
          )
        },
      },
    ],
    [onEdit, onRemove]
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
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-indigo-200 border-t-indigo-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500 font-medium">Loading positions...</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-50 transition-colors select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <span className="ml-1">
                      {header.column.getIsSorted() === 'asc' ? (
                        <i className="bi bi-sort-alpha-down-fill text-emerald-600"></i>
                      ) : header.column.getIsSorted() === 'desc' ? (
                        <i className="bi bi-sort-alpha-up-fill text-emerald-600"></i>
                      ) : (
                        <i className="bi bi-arrow-down-up text-slate-400 hover:text-slate-600"></i>
                      )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-100">
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row, idx) => (
              <tr key={row.id} className={`hover:bg-slate-50/80 transition-all duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-20 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                    <i className="bi bi-inbox text-3xl text-slate-400"></i>
                  </div>
                  <p className="text-slate-500 font-bold">No positions found</p>
                  <p className="text-slate-400 text-xs mt-1">Try adjusting your search or filters</p>
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