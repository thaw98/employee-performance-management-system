import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
} from '@tanstack/react-table'
import { memo, useMemo } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Layers, Loader2, Pencil, Users } from 'lucide-react'
import type { LevelCodeDto } from '../api/levelCodeApi'

interface LevelCodeTableProps {
  data: LevelCodeDto[]
  isLoading: boolean
  onRowClick: (levelCode: LevelCodeDto) => void
  onEdit: (levelCode: LevelCodeDto) => void
  sorting: SortingState
  setSorting: OnChangeFn<SortingState>
}

function LevelCodeTable({ data, isLoading, onRowClick, onEdit, sorting, setSorting }: LevelCodeTableProps) {
  const columns = useMemo<ColumnDef<LevelCodeDto>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Level Code',
        cell: (info) => (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#eff6ff] to-[#dbeafe] text-[#1d4ed8] text-xs font-bold">
            <Layers className="w-3.5 h-3.5" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'positionCount',
        header: 'Position Count',
        cell: (info) => (
          <span className="inline-flex items-center gap-2 text-slate-700 font-semibold">
            <Users className="w-4 h-4 text-[#2463eb]" />
            {info.getValue() as number}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info: { row: { original: LevelCodeDto } }) => (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onEdit(info.row.original)
            }}
            className="p-2.5 text-slate-500 hover:bg-[#eff6ff] hover:text-[#2463eb] rounded-lg transition-all duration-200 active:scale-95"
            title="Edit Level Code"
          >
            <Pencil className="w-4 h-4" />
          </button>
        ),
      },
    ],
    [onEdit],
  )

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-[#2463eb] animate-spin" />
        <p className="mt-4 text-sm text-slate-500 font-medium">Loading level codes...</p>
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
                  onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      header.column.getIsSorted() === 'asc' ? <ArrowUp className="w-4 h-4 text-[#2463eb]" /> :
                      header.column.getIsSorted() === 'desc' ? <ArrowDown className="w-4 h-4 text-[#2463eb]" /> :
                      <ArrowUpDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {table.getRowModel().rows.length > 0 ? table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick(row.original)}
              className="cursor-pointer hover:bg-gradient-to-r hover:from-[#eff6ff]/50 hover:to-[#dbeafe]/30 transition-all duration-200"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-6 py-4 text-sm text-slate-700">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-20 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-4">
                    <Layers className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-lg font-semibold text-slate-700">No level codes found</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default memo(LevelCodeTable)
