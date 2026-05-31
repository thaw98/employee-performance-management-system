import React, { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import type { ScoreExplanationSnapshot } from '../api/selfAssessmentFormApi'
import type { ScoreExplanation } from '../../scoreExplanation/scoreExplanationApi'

type Band = ScoreExplanationSnapshot | ScoreExplanation

interface SelfAssessmentScoreBandTableProps {
  bands: Band[] | null | undefined
  loading?: boolean
  error?: boolean
  title?: string
}

export const SelfAssessmentScoreBandTable: React.FC<SelfAssessmentScoreBandTableProps> = ({
  bands,
  loading = false,
  error = false,
  title = 'Score Band Reference',
}) => {
  const [expanded, setExpanded] = useState(false)

  const sortedBands = useMemo(() => {
    if (!bands) return []
    return [...bands].sort((a, b) => a.sortOrder - b.sortOrder)
  }, [bands])

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#2463eb]" />
          Loading score bands...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Could not load score band reference.
        </p>
      </div>
    )
  }

  if (!sortedBands.length) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/60">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
      >
        <div className="flex items-center gap-2">
          <Info size={15} className="text-[#2463eb] dark:text-[#60a5fa]" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</span>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="pb-2 pr-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Score Range
                  </th>
                  <th className="pb-2 pr-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Title
                  </th>
                  <th className="pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedBands.map((band, index) => (
                  <tr
                    key={band.sortOrder ?? index}
                    className="border-b border-slate-50 last:border-0 dark:border-slate-700/50"
                  >
                    <td className="py-2 pr-3 font-mono text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                      {band.minScore}–{band.maxScore}
                    </td>
                    <td className="py-2 pr-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                      {band.title}
                    </td>
                    <td className="py-2 text-sm text-slate-600 dark:text-slate-400">
                      {band.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
