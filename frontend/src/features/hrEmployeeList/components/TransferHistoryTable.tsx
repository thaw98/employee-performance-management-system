import type { TransferHistoryItem } from '../employeeTransferApi'

const TRANSFER_TYPE_STYLES: Record<string, string> = {
  INITIAL: 'bg-blue-100 text-blue-800',
  TEMPORARY: 'bg-amber-100 text-amber-800',
  PERMANENT_TRANSFER: 'bg-purple-100 text-purple-800',
  RETURN: 'bg-green-100 text-green-800',
}

const TRANSFER_TYPE_LABELS: Record<string, string> = {
  INITIAL: 'Initial Placement',
  TEMPORARY: 'Temporary Transfer',
  PERMANENT_TRANSFER: 'Permanent Transfer',
  RETURN: 'Return from Temporary',
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '-'
  try {
    const date = new Date(`${d}T00:00:00`)
    if (isNaN(date.getTime())) return '-'
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  } catch {
    return '-'
  }
}

interface TransferHistoryTableProps {
  history: TransferHistoryItem[]
  isLoading: boolean
}

export function TransferHistoryTable({ history, isLoading }: TransferHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-400">No transfer history found.</p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Type', 'From Dept', 'To Dept', 'From Position', 'To Position', 'Start Date', 'End Date', 'Status'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {history.map((row) => (
            <tr key={row.id} className={row.isCurrent ? 'bg-indigo-50/40' : ''}>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${TRANSFER_TYPE_STYLES[row.transferType] ?? 'bg-gray-100 text-gray-700'}`}>
                  {TRANSFER_TYPE_LABELS[row.transferType] ?? row.transferType}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{row.fromDepartmentName ?? '-'}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{row.toDepartmentName}</td>
              <td className="px-4 py-3 text-gray-600">{row.fromPositionName ?? '-'}</td>
              <td className="px-4 py-3 text-gray-700">{row.toPositionName}</td>
              <td className="px-4 py-3 text-gray-600">{formatDate(row.effectiveStartDate)}</td>
              <td className="px-4 py-3 text-gray-600">{formatDate(row.effectiveEndDate)}</td>
              <td className="px-4 py-3">
                {row.isCurrent ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Active
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Closed</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
