import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ChevronRight,
  Edit3,
  TableProperties,
  ClipboardList,
  Layers,
  TrendingUp,
  BarChart3,
  Info,
} from 'lucide-react'
import {
  useGetScoreExplanationsQuery,
  type ScoreExplanationModule,
} from '../features/scoreExplanation/scoreExplanationApi'
import { getScoreColor, ScoreScaleBar } from '../features/scoreExplanation/scoreBandDisplay'
import {
  EDIT_SCORE_BOUNDARIES_PATH,
  parseScoreExplanationModule,
  SCORE_EXPLANATION_MODULES,
} from '../features/scoreExplanation/scoreExplanationModules'

function SkeletonRow() {
  return (
    <div className="flex items-center gap-5 px-5 py-4 animate-pulse">
      <div className="w-16 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-2.5 w-56 bg-slate-100 dark:bg-slate-800 rounded" />
      </div>
      <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg" />
    </div>
  )
}

export function ScoreExplanationSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data, isLoading } = useGetScoreExplanationsQuery()
  const [activeModule, setActiveModule] = useState<ScoreExplanationModule>(() =>
    parseScoreExplanationModule(searchParams.get('module')),
  )

  useEffect(() => {
    const moduleFromUrl = parseScoreExplanationModule(searchParams.get('module'))
    setActiveModule(moduleFromUrl)
  }, [searchParams])

  const activeRows = useMemo(() => data?.[activeModule] ?? [], [activeModule, data])

  const setActiveModuleAndUrl = (module: ScoreExplanationModule) => {
    setActiveModule(module)
    setSearchParams({ module }, { replace: true })
  }

  const moduleCounts = useMemo(() => {
    if (!data) return {} as Record<ScoreExplanationModule, number>
    const counts: Record<ScoreExplanationModule, number> = { SELF_ASSESSMENT: 0, APPRAISAL: 0, FEEDBACK_360: 0 }
    for (const key of Object.keys(data) as ScoreExplanationModule[]) {
      counts[key] = data[key]?.length ?? 0
    }
    return counts
  }, [data])

  const scoreCoverage = useMemo(() => {
    if (!activeRows.length) return 0
    let covered = 0
    for (const row of activeRows) {
      covered += row.maxScore - row.minScore + 1
    }
    return Math.min(100, Math.round((covered / 101) * 100))
  }, [activeRows])

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <nav className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-5">
          <Link to="/hr/settings/system" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            System Settings
          </Link>
          <ChevronRight size={12} />
          <span className="text-slate-600 dark:text-slate-300">Score Band Settings</span>
        </nav>
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center shrink-0">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Score Band Settings</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Configure score ranges, labels, and descriptions for performance evaluation modules.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <Layers size={14} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">3 Modules</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <TrendingUp size={14} className="text-indigo-500" />
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{scoreCoverage}% Coverage</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm overflow-hidden">
          <div className="px-6 pt-5 pb-1">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Evaluation Module</p>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              {SCORE_EXPLANATION_MODULES.map((module) => {
                const isActive = activeModule === module.key
                const Icon = module.icon
                const count = moduleCounts[module.key] ?? 0
                return (
                  <button
                    key={module.key}
                    type="button"
                    onClick={() => setActiveModuleAndUrl(module.key)}
                    className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex-1 justify-center ${
                      isActive
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon size={15} />
                    <span className="hidden sm:inline">{module.label}</span>
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {!isLoading && activeRows.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-4">
                <Info size={14} className="text-slate-400" />
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Current Score Distribution — 0 to 100</p>
              </div>
              <ScoreScaleBar bands={activeRows} />
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] font-semibold text-slate-400">0</span>
                <span className="text-[10px] font-semibold text-slate-400">25</span>
                <span className="text-[10px] font-semibold text-slate-400">50</span>
                <span className="text-[10px] font-semibold text-slate-400">75</span>
                <span className="text-[10px] font-semibold text-slate-400">100</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg flex items-center justify-center">
                {(() => {
                  const ActiveIcon = SCORE_EXPLANATION_MODULES.find((m) => m.key === activeModule)?.icon ?? ClipboardList
                  return <ActiveIcon size={15} />
                })()}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {SCORE_EXPLANATION_MODULES.find((m) => m.key === activeModule)?.label} Bands
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {activeRows.length} {activeRows.length === 1 ? 'band' : 'bands'} configured
                </p>
              </div>
            </div>
            <Link
              to={`${EDIT_SCORE_BOUNDARIES_PATH}?module=${activeModule}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 hover:border-indigo-700 shadow-sm transition-all"
            >
              <Edit3 size={13} />
              Edit Boundaries
            </Link>
          </div>

          {!isLoading && activeRows.length > 0 && (
            <div className="grid grid-cols-[100px_1fr_auto] items-center gap-4 px-6 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Range</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Description</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest w-8" />
            </div>
          )}

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {isLoading ? (
              <div>
                <SkeletonRow /> <SkeletonRow /> <SkeletonRow /> <SkeletonRow /> <SkeletonRow />
              </div>
            ) : activeRows.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TableProperties size={24} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">No score bands configured</p>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Score bands will appear here once created.</p>
              </div>
            ) : (
              activeRows.map((row) => {
                const colors = getScoreColor(row.minScore, row.maxScore)
                const width = Math.max(8, ((row.maxScore - row.minScore + 1) / 100) * 100)
                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-[100px_1fr_auto] items-center gap-4 px-6 py-4 group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100 tabular-nums">
                          {row.minScore}<span className="text-slate-400 dark:text-slate-500 font-semibold mx-0.5">–</span>{row.maxScore}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${colors.bar}`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                    <div className="min-w-0 py-0.5">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          {row.title}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${colors.badge}`}>
                          {row.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-1">
                        {row.details}
                      </p>
                    </div>
                    <div className="w-8" />
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
