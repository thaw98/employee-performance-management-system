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
import { ArrowLeftRight } from 'lucide-react'
import EmployeeProfileCell from './EmployeeProfileCell'
import { STAFF_TYPE_PROBATION } from '../../employeeOnboarding/utils/staffType'
import type { EmployeeListItem } from '../hrEmployeeApi'

interface EmployeeTableProps {
  data: EmployeeListItem[]
  isLoading: boolean
  onView: (id: number) => void
  onEdit: (id: number) => void
  onTransfer?: (id: number, employeeName: string) => void
  onResendPassword: (id: number) => void
  onChangeStatus: (id: number, currentStatus: 'Probation' | 'Permanent' | 'Resigned' | 'Terminated') => void
  sorting: SortingState
  setSorting: OnChangeFn<SortingState>
  isHR?: boolean
}

function EmployeeTable({
  data,
  isLoading,
  onView,
  onEdit,
  onTransfer,
  onResendPassword,
  onChangeStatus,
  sorting,
  setSorting,
  isHR = true,
}: EmployeeTableProps) {
  const columns = useMemo<ColumnDef<EmployeeListItem>[]>(
    () => {
      const baseColumns: ColumnDef<EmployeeListItem>[] = [
      {
        accessorKey: 'staffNo',
        header: 'Staff No',
      },
      {
        accessorKey: 'employeeName',
        header: 'Employee',
        cell: (info) => (
          <EmployeeProfileCell
            url={info.row.original.profilePictureUrl}
            name={info.getValue() as string}
          />
        ),
      },
      {
        accessorKey: 'departmentName',
        header: 'Department',
      },
      {
        accessorKey: 'positionName',
        header: 'Position',
      },
      {
        accessorKey: 'employmentStatus',
        header: 'Employment Status',
        cell: (info) => {
          const status = info.getValue() as 'Probation' | 'Permanent' | 'Resigned' | 'Terminated'
          const row = info.row.original

          const badgeStyles: Record<string, string> = {
            Probation: 'bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer',
            Permanent: 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer',
            Resigned: 'bg-gray-100 text-gray-600',
            Terminated: 'bg-red-100 text-red-800',
          }

          const bgColor = badgeStyles[status] || 'bg-gray-100 text-gray-600'
          const isClickable = isHR && (status === 'Probation' || status === 'Permanent')

          if (isClickable) {
            return (
              <button
                onClick={() => onChangeStatus(row.employeeId, status)}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${bgColor}`}
                title="Click to change employment status"
              >
                {status}
                <i className="bi bi-pencil text-[10px] opacity-60"></i>
              </button>
            )
          }

          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}
            >
              {status}
            </span>
          )
        },
      },
      ]

      if (isHR) {
        baseColumns.push({
          accessorKey: 'email',
          header: 'Email',
          cell: (info) => <span className="text-gray-600">{info.getValue() as string || '-'}</span>,
        })
      } else {
        baseColumns.push(
          {
            accessorKey: 'staffTypeName',
            header: 'Staff Type',
            cell: (info) => <span className="text-gray-600">{info.getValue() as string || '-'}</span>,
          },
          {
            accessorKey: 'phoneNumber',
            header: 'Phone Number',
            cell: (info) => <span className="text-gray-600">{info.getValue() as string || '-'}</span>,
          }
        )
      }

      baseColumns.push(
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const row = info.row.original
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onView(row.employeeId)}
                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                title="View Employee"
              >
                <i className="bi bi-eye text-lg"></i>
              </button>

              {isHR && (
                <>
                  <button
                    onClick={() => onEdit(row.employeeId)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit Employee"
                  >
                    <i className="bi bi-pencil-square text-lg"></i>
                  </button>

                  {row.staffTypeId !== STAFF_TYPE_PROBATION && (
                    <button
                      onClick={() => onTransfer?.(row.employeeId, row.employeeName)}
                      disabled={row.currentTransferType === 'TEMPORARY'}
                      className="p-1 text-amber-500 hover:bg-amber-50 rounded transition-colors disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
                      title={
                        row.currentTransferType === 'TEMPORARY'
                          ? 'Already on temporary assignment — return first'
                          : 'Temporary Transfer'
                      }
                    >
                      <ArrowLeftRight size={18} />
                    </button>
                  )}

                  {row.hasUserAccount && row.mustChangePassword && (
                    <button
                      onClick={() => onResendPassword(row.employeeId)}
                      className="p-1 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                      title="Resend Temporary Password"
                    >
                      <i className="bi bi-envelope-arrow-up text-lg"></i>
                    </button>
                  )}
                </>
              )}
            </div>
          )
        },
      },
      )

      return baseColumns
    },
    [isHR, onView, onEdit, onTransfer, onResendPassword, onChangeStatus]
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
    manualSorting: true, // we handle sorting server-side
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' ? (
                      <i className="bi bi-sort-alpha-down text-indigo-600"></i>
                    ) : header.column.getIsSorted() === 'desc' ? (
                      <i className="bi bi-sort-alpha-up text-indigo-600"></i>
                    ) : (
                      <i className="bi bi-arrow-down-up text-gray-300"></i>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-10 text-center text-gray-500">
                No employees found matching your criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default memo(EmployeeTable)
