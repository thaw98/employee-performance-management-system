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
  onToggleStatus: (id: number, currentStatus: string) => void
  sorting: SortingState
  setSorting: OnChangeFn<SortingState>
}

function PositionTable({
  data,
  isLoading,
  onEdit,
  onToggleStatus,
  sorting,
  setSorting,
}: PositionTableProps) {
  const columns = useMemo<ColumnDef<PositionDto>[]>(
    () => [
      {
        accessorKey: 'positionCode',
        header: 'Position Code',
        cell: (info) => (
          <span className="font-semibold text-gray-900">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'positionName',
        header: 'Position Name',
        cell: (info) => (
          <span className="text-gray-700 font-medium">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'levelCodeName',
        header: 'Level Code',
        cell: (info) => {
          const value = info.getValue() as string
          return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">
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
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
              <i className="bi bi-shield-check mr-1.5"></i>
              {value}
            </span>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const status = info.getValue() as string
          const isActive = status === 'ACTIVE'

          return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
              isActive
                ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200'
                : 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-500 border border-gray-200'
            }`}
            >
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
              {status}
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
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all hover:scale-105 active:scale-95"
                title="Edit Position"
              >
                <i className="bi bi-pencil-square text-lg"></i>
              </button>
            </div>
          )
        },
      },
    ],
    [onEdit, onToggleStatus]
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
                  className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <span className="ml-1">
                      {header.column.getIsSorted() === 'asc' ? (
                        <i className="bi bi-sort-alpha-down-fill text-indigo-600"></i>
                      ) : header.column.getIsSorted() === 'desc' ? (
                        <i className="bi bi-sort-alpha-up-fill text-indigo-600"></i>
                      ) : (
                        <i className="bi bi-arrow-down-up text-gray-500 hover:text-gray-600"></i>
                      )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-200">
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row, idx) => (
              <tr key={row.id} className={`hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-20 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <i className="bi bi-inbox text-3xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-500 font-medium">No positions found</p>
                  <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
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