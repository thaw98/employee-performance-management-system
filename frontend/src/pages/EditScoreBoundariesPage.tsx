import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ChevronRight,
  Edit3,
  Loader2,
  Save,
  AlertTriangle,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  useGetScoreExplanationsQuery,
  useBulkUpdateScoreExplanationMutation,
  type ScoreExplanationModule,
} from '../features/scoreExplanation/scoreExplanationApi'
import { BAND_NAMES, ScoreScaleBar, scoreColorBySortOrder } from '../features/scoreExplanation/scoreBandDisplay'
import {
  parseScoreExplanationModule,
  SCORE_EXPLANATION_MODULES,
  SCORE_EXPLANATION_SETTINGS_PATH,
} from '../features/scoreExplanation/scoreExplanationModules'

export function EditScoreBoundariesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sourceModule = parseScoreExplanationModule(searchParams.get('module'))

  const { data, isLoading } = useGetScoreExplanationsQuery()
  const [bulkUpdate, { isLoading: isSaving }] = useBulkUpdateScoreExplanationMutation()
  const [boundaries, setBoundaries] = useState<[number, number, number, number]>([39, 59, 70, 85])
  const [bandTitles, setBandTitles] = useState<Record<number, string>>({})
  const [bandDetails, setBandDetails] = useState<Record<number, string>>({})
  const [reason, setReason] = useState('')
  const [applyToModules, setApplyToModules] = useState<ScoreExplanationModule[]>([sourceModule])

  const activeRows = useMemo(() => data?.[sourceModule] ?? [], [data, sourceModule])

  useEffect(() => {
    setApplyToModules([sourceModule])
  }, [sourceModule])

  useEffect(() => {
    if (activeRows.length === 5) {
      const b1 = activeRows.find(r => r.sortOrder === 5)!.maxScore
      const b2 = activeRows.find(r => r.sortOrder === 4)!.maxScore
      const b3 = activeRows.find(r => r.sortOrder === 3)!.maxScore
      const b4 = activeRows.find(r => r.sortOrder === 2)!.maxScore
      setBoundaries([b1, b2, b3, b4])
      const titles: Record<number, string> = {}
      const details: Record<number, string> = {}
      for (const row of activeRows) {
        titles[row.sortOrder] = row.title
        details[row.sortOrder] = row.details
      }
      setBandTitles(titles)
      setBandDetails(details)
      setReason('')
    }
  }, [activeRows])

  const proposedBands = useMemo(() => {
    const [b1, b2, b3, b4] = boundaries
    return [
      { sortOrder: 5, minScore: 0, maxScore: b1, title: bandTitles[5] ?? '', details: bandDetails[5] ?? '' },
      { sortOrder: 4, minScore: b1 + 1, maxScore: b2, title: bandTitles[4] ?? '', details: bandDetails[4] ?? '' },
      { sortOrder: 3, minScore: b2 + 1, maxScore: b3, title: bandTitles[3] ?? '', details: bandDetails[3] ?? '' },
      { sortOrder: 2, minScore: b3 + 1, maxScore: b4, title: bandTitles[2] ?? '', details: bandDetails[2] ?? '' },
      { sortOrder: 1, minScore: b4 + 1, maxScore: 100, title: bandTitles[1] ?? '', details: bandDetails[1] ?? '' },
    ]
  }, [boundaries, bandTitles, bandDetails])

  const isValid = useMemo(() => {
    if (!reason.trim()) return false
    if (applyToModules.length === 0) return false
    const [b1, b2, b3, b4] = boundaries
    if (b1 < 0 || b2 <= b1 || b3 <= b2 || b4 <= b3 || b4 > 99) return false
    for (const band of proposedBands) {
      if (!band.title.trim() || !band.details.trim()) return false
    }
    return true
  }, [boundaries, proposedBands, reason, applyToModules])

  const setBoundary = (index: number, raw: number) => {
    setBoundaries(prev => {
      const next = [...prev]
      let min: number
      let max: number
      if (index === 0) { min = 0; max = next[1] - 1 }
      else if (index === 1) { min = next[0] + 1; max = next[2] - 1 }
      else if (index === 2) { min = next[1] + 1; max = next[3] - 1 }
      else { min = next[2] + 1; max = 99 }
      next[index] = Math.max(min, Math.min(max, Math.round(raw)))
      return next as [number, number, number, number]
    })
  }

  const toggleModule = (module: ScoreExplanationModule) => {
    setApplyToModules(prev => {
      const exists = prev.includes(module)
      if (exists && prev.length === 1) return prev
      return exists ? prev.filter(m => m !== module) : [...prev, module]
    })
  }

  const beforeAfterModules = useMemo(() => {
    return applyToModules.map(modKey => {
      const currentRows = data?.[modKey] ?? []
      return {
        module: modKey,
        label: SCORE_EXPLANATION_MODULES.find(m => m.key === modKey)?.label ?? modKey,
        current: currentRows,
        proposed: proposedBands,
      }
    })
  }, [data, applyToModules, proposedBands])

  const save = async () => {
    if (!isValid) return
    try {
      await bulkUpdate({
        body: {
          bands: proposedBands.map(b => ({
            sortOrder: b.sortOrder,
            minScore: b.minScore,
            maxScore: b.maxScore,
            title: b.title.trim(),
            details: b.details.trim(),
          })),
          reason: reason.trim(),
          applyToModules,
        },
      }).unwrap()
      toast.success('Score bands updated.')
      navigate(`${SCORE_EXPLANATION_SETTINGS_PATH}?module=${sourceModule}`)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update score bands.')
    }
  }

  const cancel = () => {
    navigate(`${SCORE_EXPLANATION_SETTINGS_PATH}?module=${sourceModule}`)
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (activeRows.length !== 5) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <p className="text-sm text-slate-500">Score bands are not configured for this module.</p>
        <Link
          to={SCORE_EXPLANATION_SETTINGS_PATH}
          className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Back to Score Band Settings
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <nav className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-5">
        <Link to="/hr/settings/system" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          System Settings
        </Link>
        <ChevronRight size={12} />
        <Link to={SCORE_EXPLANATION_SETTINGS_PATH} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          Score Band Settings
        </Link>
        <ChevronRight size={12} />
        <span className="text-slate-600 dark:text-slate-300">Edit Boundaries</span>
      </nav>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40 shadow-sm overflow-hidden ring-1 ring-indigo-500/10">
        <div className="px-6 pt-5 pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
              <Edit3 size={15} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Edit Score Boundaries
              </h1>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Adjust the four internal boundaries. Endpoints 0 and 100 are locked.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 block">
              Boundary Controls
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { index: 0, label: 'Unsatisfactory → Need Imp.', sortOrder: 5 },
                { index: 1, label: 'Need Imp. → Meet Req.', sortOrder: 4 },
                { index: 2, label: 'Meet Req. → Good', sortOrder: 3 },
                { index: 3, label: 'Good → Outstanding', sortOrder: 2 },
              ].map(({ index, label, sortOrder }) => {
                const color = scoreColorBySortOrder(sortOrder)
                return (
                  <div key={index} className="space-y-1.5">
                    <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                      {label}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={boundaries[index]}
                      onChange={(e) => setBoundary(index, Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all outline-none text-center tabular-nums"
                    />
                    <p className="text-[10px] text-slate-400 text-center">
                      Band width: {(() => {
                        if (index === 0) return boundaries[0] - 0 + 1
                        if (index === 1) return boundaries[1] - boundaries[0]
                        if (index === 2) return boundaries[2] - boundaries[1]
                        return boundaries[3] - boundaries[2]
                      })()}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye size={13} className="text-indigo-500" />
              <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Proposed Score Distribution</p>
            </div>
            <ScoreScaleBar bands={proposedBands} />
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] font-semibold text-slate-400">0</span>
              <span className="text-[10px] font-semibold text-slate-400">25</span>
              <span className="text-[10px] font-semibold text-slate-400">50</span>
              <span className="text-[10px] font-semibold text-slate-400">75</span>
              <span className="text-[10px] font-semibold text-slate-400">100</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 block">
              Band Titles &amp; Details
            </label>
            <div className="space-y-3">
              {proposedBands.map((band) => {
                const colors = scoreColorBySortOrder(band.sortOrder)
                return (
                  <div key={band.sortOrder} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
                    <div className={`w-1 self-stretch rounded-full shrink-0 ${colors.solid}`} />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                          {BAND_NAMES[band.sortOrder]}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 tabular-nums">
                          {band.minScore}–{band.maxScore}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={bandTitles[band.sortOrder] ?? ''}
                          onChange={(e) => setBandTitles(prev => ({ ...prev, [band.sortOrder]: e.target.value }))}
                          placeholder={`${BAND_NAMES[band.sortOrder]} title`}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none transition-all"
                        />
                        <input
                          type="text"
                          value={bandDetails[band.sortOrder] ?? ''}
                          onChange={(e) => setBandDetails(prev => ({ ...prev, [band.sortOrder]: e.target.value }))}
                          placeholder="Brief description"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <EyeOff size={13} className="text-slate-400" />
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Before / After Preview for Selected Modules
              </p>
            </div>
            <div className="space-y-3">
              {beforeAfterModules.map(({ module, label, current, proposed }) => (
                <div key={module} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">{label}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 mb-1">Current</p>
                      <ScoreScaleBar bands={current} height="h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 mb-1">Proposed</p>
                      <ScoreScaleBar bands={proposed} height="h-6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              <AlertTriangle size={11} />
              Reason for Change
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Explain why these changes are needed..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all outline-none resize-none"
            />
          </div>

          <div className="space-y-2.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              <Layers size={11} />
              Apply To Modules
            </label>
            <div className="flex flex-wrap gap-2">
              {SCORE_EXPLANATION_MODULES.map((module) => {
                const checked = applyToModules.includes(module.key)
                const Icon = module.icon
                return (
                  <button
                    key={module.key}
                    type="button"
                    onClick={() => toggleModule(module.key)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      checked
                        ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <Icon size={13} />
                    {module.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
          <button
            type="button"
            onClick={cancel}
            disabled={isSaving}
            className="px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-[0.97] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!isValid || isSaving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 transition-all flex items-center gap-2 active:scale-[0.97] disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
