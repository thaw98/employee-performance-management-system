import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight,
  Edit3,
  Loader2,
  Save,
  X,
  TableProperties,
  ClipboardList,
  Award,
  Users,
  Hash,
  AlignLeft,
  FileText,
  AlertTriangle,
  Layers,
  TrendingUp,
  BarChart3,
  Info,
  Eye,
  EyeOff,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  useGetScoreExplanationsQuery,
  useBulkUpdateScoreExplanationMutation,
  type ScoreExplanation,
  type ScoreExplanationModule,
} from '../features/scoreExplanation/scoreExplanationApi'

const modules: Array<{
  key: ScoreExplanationModule
  label: string
  icon: typeof ClipboardList
  desc: string
  accent: string
  accentBg: string
  accentText: string
}> = [
  { key: 'SELF_ASSESSMENT', label: 'Self Assessment', icon: ClipboardList, desc: 'Employee self-rating bands', accent: 'blue', accentBg: 'bg-blue-50 dark:bg-blue-900/20', accentText: 'text-blue-600 dark:text-blue-400' },
  { key: 'APPRAISAL', label: 'Appraisal', icon: Award, desc: 'Manager evaluation bands', accent: 'violet', accentBg: 'bg-violet-50 dark:bg-violet-900/20', accentText: 'text-violet-600 dark:text-violet-400' },
  { key: 'FEEDBACK_360', label: '360 Feedback', icon: Users, desc: 'Peer & multi-rater bands', accent: 'teal', accentBg: 'bg-teal-50 dark:bg-teal-900/20', accentText: 'text-teal-600 dark:text-teal-400' },
]

const BAND_NAMES: Record<number, string> = {
  1: 'Outstanding',
  2: 'Good',
  3: 'Meet Requirement',
  4: 'Need Improvement',
  5: 'Unsatisfactory',
}

function getScoreColor(min: number, max: number) {
  if (min >= 86) return {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    bar: 'from-emerald-400 to-emerald-600',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500/20',
    solid: 'bg-emerald-500',
  }
  if (min >= 71) return {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800/60',
    text: 'text-blue-700 dark:text-blue-300',
    bar: 'from-blue-400 to-blue-600',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    dot: 'bg-blue-500',
    ring: 'ring-blue-500/20',
    solid: 'bg-blue-500',
  }
  if (min >= 60) return {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800/60',
    text: 'text-amber-700 dark:text-amber-300',
    bar: 'from-amber-400 to-amber-600',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    dot: 'bg-amber-500',
    ring: 'ring-amber-500/20',
    solid: 'bg-amber-500',
  }
  if (min >= 40) return {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800/60',
    text: 'text-orange-700 dark:text-orange-300',
    bar: 'from-orange-400 to-orange-600',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    dot: 'bg-orange-500',
    ring: 'ring-orange-500/20',
    solid: 'bg-orange-500',
  }
  return {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800/60',
    text: 'text-red-700 dark:text-red-300',
    bar: 'from-red-400 to-red-600',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    dot: 'bg-red-500',
    ring: 'ring-red-500/20',
    solid: 'bg-red-500',
  }
}

function scoreColorBySortOrder(sortOrder: number) {
  if (sortOrder === 1) return getScoreColor(86, 100)
  if (sortOrder === 2) return getScoreColor(71, 85)
  if (sortOrder === 3) return getScoreColor(60, 70)
  if (sortOrder === 4) return getScoreColor(40, 59)
  return getScoreColor(0, 39)
}

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

function ScoreScaleBar({ bands, height }: { bands: Array<{ minScore: number; maxScore: number; title: string }>; height?: string }) {
  return (
    <div className={`relative rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex ${height ?? 'h-8'}`}>
      {bands.map((band, idx) => {
        const colors = getScoreColor(band.minScore, band.maxScore)
        const left = (band.minScore / 100) * 100
        const width = ((band.maxScore - band.minScore + 1) / 100) * 100
        return (
          <div
            key={idx}
            className={`h-full bg-gradient-to-r ${colors.bar} flex items-center justify-center transition-all relative group/scale`}
            style={{ marginLeft: `${left}%`, width: `${width}%`, minWidth: '2px' }}
            title={`${band.title}: ${band.minScore}–${band.maxScore}`}
          >
            {width > 8 && (
              <span className="text-[9px] font-bold text-white/90 truncate px-1">{band.title}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ScoreExplanationSettingsPage() {
  const { data, isLoading } = useGetScoreExplanationsQuery()
  const [bulkUpdate, { isLoading: isSaving }] = useBulkUpdateScoreExplanationMutation()
  const [activeModule, setActiveModule] = useState<ScoreExplanationModule>('SELF_ASSESSMENT')
  const [isEditing, setIsEditing] = useState(false)
  const [boundaries, setBoundaries] = useState<[number, number, number, number]>([39, 59, 70, 85])
  const [bandTitles, setBandTitles] = useState<Record<number, string>>({})
  const [bandDetails, setBandDetails] = useState<Record<number, string>>({})
  const [reason, setReason] = useState('')
  const [applyToModules, setApplyToModules] = useState<ScoreExplanationModule[]>([])

  const activeRows = useMemo(() => data?.[activeModule] ?? [], [activeModule, data])

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
      if (!isEditing) {
        setReason('')
        setApplyToModules([activeModule])
      }
    }
  }, [activeModule, activeRows, isEditing])

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

  const startEditing = () => {
    setReason('')
    setApplyToModules([activeModule])
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
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
    }
  }

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
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update score bands.')
    }
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

  const beforeAfterModules = useMemo(() => {
    return applyToModules.map(modKey => {
      const currentRows = data?.[modKey] ?? []
      return {
        module: modKey,
        label: modules.find(m => m.key === modKey)?.label ?? modKey,
        current: currentRows,
        proposed: proposedBands,
      }
    })
  }, [data, applyToModules, proposedBands])

  return (
    <>
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
                {modules.map((module) => {
                  const isActive = activeModule === module.key
                  const Icon = module.icon
                  const count = moduleCounts[module.key] ?? 0
                  return (
                    <button
                      key={module.key}
                      type="button"
                      onClick={() => { setActiveModule(module.key); if (!isEditing) setApplyToModules([module.key]) }}
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
                    const ActiveIcon = modules.find((m) => m.key === activeModule)?.icon ?? ClipboardList
                    return <ActiveIcon size={15} />
                  })()}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    {modules.find((m) => m.key === activeModule)?.label} Bands
                  </h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {activeRows.length} {activeRows.length === 1 ? 'band' : 'bands'} configured
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={isEditing ? cancelEditing : startEditing}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  isEditing
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 hover:border-indigo-700 shadow-sm'
                }`}
              >
                {isEditing ? <X size={13} /> : <Edit3 size={13} />}
                {isEditing ? 'Cancel' : 'Edit Boundaries'}
              </button>
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

          {/* Editor Section */}
          {isEditing && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40 shadow-sm overflow-hidden ring-1 ring-indigo-500/10">
              <div className="px-6 pt-5 pb-1 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
                    <Edit3 size={15} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                      Edit Score Boundaries
                    </h2>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Adjust the four internal boundaries. Endpoints 0 and 100 are locked.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 space-y-6">
                {/* Boundary Controls */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 block">
                    Boundary Controls
                  </label>
                  <div className="grid grid-cols-4 gap-3">
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
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={boundaries[index]}
                              onChange={(e) => setBoundary(index, Number(e.target.value))}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all outline-none text-center tabular-nums"
                            />
                          </div>
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

                {/* Proposed Scale Preview */}
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

                {/* Band Details */}
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

                {/* Before/After Preview */}
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
                        <div className="mt-2 grid grid-cols-5 gap-1">
                          {current.map((row, i) => {
                            const prop = proposed.find(p => p.sortOrder === row.sortOrder)
                            const changed = prop && (prop.minScore !== row.minScore || prop.maxScore !== row.maxScore || prop.title !== row.title || prop.details !== row.details)
                            return (
                              <div key={row.sortOrder} className={`text-[9px] font-semibold px-1 py-0.5 rounded ${changed ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'text-slate-400'}`}>
                                {row.minScore}–{row.maxScore}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                    {beforeAfterModules.length === 0 && (
                      <p className="text-xs text-slate-400 italic">Select modules below to see a preview.</p>
                    )}
                  </div>
                </div>

                {/* Reason */}
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

                {/* Apply to Modules */}
                <div className="space-y-2.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <Layers size={11} />
                    Apply To Modules
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {modules.map((module) => {
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

              {/* Footer */}
              <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                <button
                  type="button"
                  onClick={cancelEditing}
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
          )}
        </div>
      </div>
    </>
  )
}
