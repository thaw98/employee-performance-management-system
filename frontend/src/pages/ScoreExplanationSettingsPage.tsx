import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
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
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  useGetScoreExplanationsQuery,
  useUpdateScoreExplanationMutation,
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
  const { data, isLoading } = useGetScoreExplanationsQuery()
  const [updateRow, { isLoading: isSaving }] = useUpdateScoreExplanationMutation()
  const [activeModule, setActiveModule] = useState<ScoreExplanationModule>('SELF_ASSESSMENT')
  const [editing, setEditing] = useState<ScoreExplanation | null>(null)
  const [form, setForm] = useState({
    minScore: 0,
    maxScore: 0,
    title: '',
    details: '',
    reason: '',
    applyToModules: ['SELF_ASSESSMENT'] as ScoreExplanationModule[],
  })

  const rows = useMemo(() => data?.[activeModule] ?? [], [activeModule, data])

  const moduleCounts = useMemo(() => {
    if (!data) return {} as Record<ScoreExplanationModule, number>
    const counts: Record<ScoreExplanationModule, number> = {
      SELF_ASSESSMENT: 0,
      APPRAISAL: 0,
      FEEDBACK_360: 0,
    }
    for (const key of Object.keys(data) as ScoreExplanationModule[]) {
      counts[key] = data[key]?.length ?? 0
    }
    return counts
  }, [data])

  const scoreCoverage = useMemo(() => {
    if (!rows.length) return 0
    let covered = 0
    for (const row of rows) {
      covered += row.maxScore - row.minScore + 1
    }
    return Math.min(100, Math.round((covered / 101) * 100))
  }, [rows])

  const openEdit = (row: ScoreExplanation) => {
    setEditing(row)
    setForm({
      minScore: row.minScore,
      maxScore: row.maxScore,
      title: row.title,
      details: row.details,
      reason: '',
      applyToModules: [row.module],
    })
  }

  const toggleModule = (module: ScoreExplanationModule) => {
    setForm((current) => {
      const exists = current.applyToModules.includes(module)
      const next = exists
        ? current.applyToModules.filter((item) => item !== module)
        : [...current.applyToModules, module]
      return { ...current, applyToModules: next.length ? next : [module] }
    })
  }

  const save = async () => {
    if (!editing) return
    if (!form.title.trim() || !form.details.trim() || !form.reason.trim()) {
      toast.error('Title, details, and reason are required.')
      return
    }
    if (form.minScore < 0 || form.maxScore > 100 || form.minScore > form.maxScore) {
      toast.error('Scores must be valid integers from 0 to 100.')
      return
    }
    try {
      await updateRow({
        id: editing.id,
        body: {
          minScore: Math.trunc(form.minScore),
          maxScore: Math.trunc(form.maxScore),
          title: form.title,
          details: form.details,
          reason: form.reason,
          applyToModules: form.applyToModules,
        },
      }).unwrap()
      toast.success('Score band updated.')
      setEditing(null)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update score band.')
    }
  }

  const editingColors = editing ? getScoreColor(form.minScore, form.maxScore) : null

  return (
    <>
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
        {/* Header */}
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
            {/* Summary stats */}
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
          {/* Module Selector Tabs */}
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
                      onClick={() => setActiveModule(module.key)}
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

          {/* Visual Score Scale */}
          {!isLoading && rows.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm overflow-hidden">
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 mb-4">
                  <Info size={14} className="text-slate-400" />
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Score Distribution — 0 to 100</p>
                </div>
                <div className="relative h-8 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  {rows.map((row) => {
                    const colors = getScoreColor(row.minScore, row.maxScore)
                    const left = (row.minScore / 100) * 100
                    const width = ((row.maxScore - row.minScore + 1) / 100) * 100
                    return (
                      <div
                        key={row.id}
                        className={`h-full bg-gradient-to-r ${colors.bar} flex items-center justify-center transition-all relative group/scale`}
                        style={{ marginLeft: `${left}%`, width: `${width}%`, minWidth: '2px' }}
                        title={`${row.title}: ${row.minScore}–${row.maxScore}`}
                      >
                        {width > 8 && (
                          <span className="text-[9px] font-bold text-white/90 truncate px-1">{row.title}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
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

          {/* Score Bands Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm overflow-hidden">
            {/* Table Header */}
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
                    {rows.length} {rows.length === 1 ? 'band' : 'bands'} configured
                  </p>
                </div>
              </div>
            </div>

            {/* Column Headers */}
            {!isLoading && rows.length > 0 && (
              <div className="grid grid-cols-[100px_1fr_auto] items-center gap-4 px-6 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Range</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Description</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest w-8" />
              </div>
            )}

            {/* Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {isLoading ? (
                <div>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ) : rows.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <TableProperties size={24} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">No score bands configured</p>
                  <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Score bands will appear here once created.</p>
                </div>
              ) : (
                rows.map((row) => {
                  const colors = getScoreColor(row.minScore, row.maxScore)
                  const width = Math.max(8, ((row.maxScore - row.minScore + 1) / 100) * 100)
                  return (
                    <div
                      key={row.id}
                      className="grid grid-cols-[100px_1fr_auto] items-center gap-4 px-6 py-4 group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Score range + mini bar */}
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

                      {/* Title + Details */}
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

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 dark:text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 active:scale-90"
                        title="Edit score band"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setEditing(null)} />
            <div className="relative my-auto w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-900/25 border border-slate-200 dark:border-slate-700 z-10 overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal header */}
              <div className="flex shrink-0 items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${editingColors?.badge ?? 'bg-slate-100 text-slate-600'}`}>
                    <Edit3 size={15} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Edit Score Band</h2>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                      {modules.find((m) => m.key === editing.module)?.label} · Band #{editing.sortOrder}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {/* Score preview bar */}
                <div className="px-6 pt-5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 block">Score Range Preview</label>
                  <div className="relative h-3 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 overflow-hidden">
                    <div
                      className={`absolute inset-y-0 bg-gradient-to-r ${editingColors?.bar ?? 'from-slate-400 to-slate-600'} rounded-full transition-all duration-300`}
                      style={{ width: `${((form.maxScore - form.minScore) / 100) * 100}%`, left: `${form.minScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">0</span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${editingColors?.badge ?? 'bg-slate-100 text-slate-600'}`}>
                      {form.minScore} – {form.maxScore}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">100</span>
                  </div>
                </div>

                {/* Form */}
                <div className="px-6 pt-5 pb-2 space-y-4">
                  {/* Score range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        <Hash size={11} />
                        Min Score
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={form.minScore}
                        onChange={(e) => setForm({ ...form, minScore: Number(e.target.value) })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        <Hash size={11} />
                        Max Score
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={form.maxScore}
                        onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      <AlignLeft size={11} />
                      Explanation Title
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Outstanding"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all outline-none"
                    />
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      <FileText size={11} />
                      Details
                    </label>
                    <textarea
                      value={form.details}
                      onChange={(e) => setForm({ ...form, details: e.target.value })}
                      rows={3}
                      placeholder="Describe what this score band represents..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all outline-none resize-none"
                    />
                  </div>

                  {/* Reason */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      <AlertTriangle size={11} />
                      Reason for Change
                    </label>
                    <textarea
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      rows={2}
                      placeholder="Explain why this change is needed..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all outline-none resize-none"
                    />
                  </div>

                  {/* Apply to modules */}
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      <Layers size={11} />
                      Apply To Modules
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {modules.map((module) => {
                        const checked = form.applyToModules.includes(module.key)
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
              </div>

              {/* Modal footer */}
              <div className="flex shrink-0 justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-[0.97] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 transition-all flex items-center gap-2 active:scale-[0.97] disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
