import { useGetPipByIdQuery, useGetPipHistoryQuery } from '../pipApi'
import type { PipProgressUpdate } from '../pipApi'
import { format } from 'date-fns'

interface PipUnifiedLogProps {
  pipId: number
}

export default function PipUnifiedLog({ pipId }: PipUnifiedLogProps) {
  const { data: pipData } = useGetPipByIdQuery(pipId)
  const { data: updatesData = [], isLoading, isError } = useGetPipHistoryQuery(pipId)

  const updates = [...updatesData].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.updateDate || 0).getTime()
    const timeB = new Date(b.createdAt || b.updateDate || 0).getTime()
    
    if (timeB !== timeA) {
      return timeB - timeA
    }
    
    // Tie-breaker: Higher ID (more recent) first
    return b.id - a.id
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2463eb] border-t-transparent"></div>
        <span className="ml-3 text-sm text-slate-500 font-medium">Loading activity history...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
        Failed to load activity history.
      </div>
    )
  }

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
        <h2 className="text-lg font-bold text-slate-900">Activity Log</h2>
        <p className="text-xs text-slate-500 mt-0.5">Timeline of all progress updates and feedback</p>
      </div>

      <div className="max-h-[520px] overflow-auto p-6">
        {updates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <i className="bi bi-clock-history text-4xl mb-3 opacity-20"></i>
            <p className="text-sm font-medium">No updates recorded yet.</p>
          </div>
        ) : (
          <div className="relative min-w-[620px] space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-slate-100">
            {updates.map((update, index) => (
              <LogEntry 
                key={update.id} 
                update={update} 
                isLatest={index === 0} 
                pipEmployeeId={pipData?.employee?.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function LogEntry({ update, isLatest, pipEmployeeId }: { update: PipProgressUpdate; isLatest?: boolean; pipEmployeeId?: number }) {
  const dateStr = update.createdAt || update.updateDate || ''
  const formattedDate = dateStr ? format(new Date(dateStr), 'MMM d, yyyy • h:mm a') : 'N/A'

  const hasProgressChange = update.newPercentage !== update.previousPercentage
  const isEmployeeUpdate = pipEmployeeId && update.updatedBy?.id === pipEmployeeId

  return (
    <div className="relative pl-12 group">
      {/* Timeline Dot */}
      <div className="absolute left-0 mt-1.5 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-[#eff6ff] text-[#2463eb] shadow-sm transition-transform group-hover:scale-110">
        <i className="bi bi-pencil-square text-xs"></i>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{formattedDate}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
            Progress Update
          </span>
          {isLatest && (
            <span className="rounded-full bg-[#2463eb] px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider animate-pulse">
              Latest
            </span>
          )}
        </div>

        <h3 className="mt-1 text-sm font-bold text-slate-900 leading-tight">
          {update.objectiveDescription || 'Objective Update'}
        </h3>

        <div className="mt-2 flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 border border-slate-100">
            {hasProgressChange && (
              <>
                <span className="text-xs font-medium text-slate-400 line-through">{update.previousPercentage}%</span>
                <i className="bi bi-arrow-right text-slate-300 text-[10px]"></i>
              </>
            )}
            <span className={`text-sm font-extrabold ${update.newPercentage >= 100 ? 'text-emerald-600' : 'text-[#2463eb]'}`}>
              {update.newPercentage}%
            </span>
          </div>

          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden max-w-[100px]">
            <div
              className={`h-full transition-all duration-500 ${update.newPercentage >= 70 ? 'bg-emerald-500' : update.newPercentage >= 30 ? 'bg-[#2463eb]' : 'bg-orange-500'}`}
              style={{ width: `${update.newPercentage}%` }}
            ></div>
          </div>

          {isEmployeeUpdate && update.completedHours !== undefined && update.completedHours !== null && update.completedHours > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 border border-indigo-100 text-indigo-700">
              <i className="bi bi-clock-history text-[10px]"></i>
              <span className="text-xs font-bold">{update.completedHours} hrs</span>
            </div>
          )}
        </div>

        {update.feedback && (
          <div className="mt-3 relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#dbeafe] rounded-full"></div>
            <div className="pl-4 py-1">
              <p className="break-words text-sm text-slate-600 italic leading-relaxed">
                "{update.feedback}"
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">
                  {update.updatedBy?.employee?.employeeName?.charAt(0) || 'U'}
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  Updated by {update.updatedBy?.employee?.employeeName || 'System'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
