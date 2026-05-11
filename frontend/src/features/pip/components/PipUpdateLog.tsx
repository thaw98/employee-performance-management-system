import type { PipObjective, PipProgressUpdate } from '../pipApi'
import { useGetObjectiveHistoryQuery } from '../pipApi'
import { formatDate, formatDateTime } from '../../../utils/dateUtils'

type PipUpdateLogProps = {
  objectives: PipObjective[]
}

type ObjectiveUpdateLogProps = {
  objective: PipObjective
}

const getUpdaterName = (update: PipProgressUpdate) => {
  return update.updatedBy.employee?.employeeName || update.updatedBy.email || 'Unknown user'
}

function ObjectiveUpdateLog({ objective }: ObjectiveUpdateLogProps) {
  const { data: updates = [], isLoading } = useGetObjectiveHistoryQuery(objective.id)
  const sortedUpdates = [...updates].sort((a, b) => {
    const aTime = new Date(a.createdAt || a.updateDate || '').getTime()
    const bTime = new Date(b.createdAt || b.updateDate || '').getTime()
    return bTime - aTime
  })

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-bold text-slate-900">{objective.description}</h3>
         <span className="text-xs font-bold text-slate-400">{objective.progressPercentage}% current</span>
      </div>

      {isLoading && <p className="py-3 text-sm text-slate-500">Loading update log...</p>}

      {!isLoading && sortedUpdates.length === 0 && (
        <p className="py-3 text-sm text-slate-500">No updates recorded for this objective.</p>
      )}

      {!isLoading && sortedUpdates.length > 0 && (
        <div className="space-y-3">
          {sortedUpdates.map((update) => (
            <div key={update.id} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{getUpdaterName(update)}</p>
                  <p className="text-xs font-medium text-slate-400">
                    {update.createdAt ? formatDateTime(update.createdAt) : formatDate(update.updateDate)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">
                    Latest {update.previousPercentage}%
                  </span>
                  <i className="bi bi-arrow-right text-slate-400" />
                  <span className="rounded-md bg-blue-100 px-2 py-1 text-blue-700">
                    New {update.newPercentage}%
                  </span>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{update.feedback || '-'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function PipUpdateLog({ objectives }: PipUpdateLogProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-bold text-slate-900">Update Log</h2>
      <div className="space-y-4">
        {objectives.map((objective) => (
          <ObjectiveUpdateLog key={objective.id} objective={objective} />
        ))}
        {objectives.length === 0 && (
          <p className="py-4 text-center text-slate-500">No objectives available.</p>
        )}
      </div>
    </section>
  )
}
