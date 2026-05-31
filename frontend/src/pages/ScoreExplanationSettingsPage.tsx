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
}> = [
  { key: 'SELF_ASSESSMENT', label: 'Self Assessment', icon: ClipboardList, desc: 'Employee self-rating bands' },
  { key: 'APPRAISAL', label: 'Appraisal', icon: Award, desc: 'Manager evaluation bands' },
  { key: 'FEEDBACK_360', label: '360 Feedback', icon: Users, desc: 'Peer & multi-rater bands' },
]

function getScoreColor(min: number, max: number) {
  if (min >= 86) return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-700 dark:text-emerald-300', bar: 'from-emerald-500 to-emerald-600', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', dot: 'bg-emerald-500' }
  if (min >= 71) return { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-300', bar: 'from-blue-500 to-blue-600', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', dot: 'bg-blue-500' }
  if (min >= 60) return { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-300', bar: 'from-amber-500 to-amber-600', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', dot: 'bg-amber-500' }
  if (min >= 40) return { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-300', bar: 'from-orange-500 to-orange-600', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', dot: 'bg-orange-500' }
  return { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-300 dark:border-red-700', text: 'text-red-700 dark:text-red-300', bar: 'from-red-500 to-red-600', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', dot: 'bg-red-500' }
}

function SkeletonRow() {
  return (
    <div className="relative flex items-stretch rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden animate-pulse">
      <div className="w-1 bg-slate-300 dark:bg-slate-600" />
      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded-md" />
            <div className="h-4 w-44 bg-slate-200 dark:bg-slate-700 rounded-md" />
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-md" />
          </div>
          <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>
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
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="mb-10">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
            <Link to="/hr/settings/system" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              System Settings
            </Link>
            <ChevronRight size={14} />
            <span className="text-slate-600 dark:text-slate-300">Score Band Settings</span>
          </nav>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center shrink-0">
              <Layers size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Score Band Settings</h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                Configure and manage score bands, labels, and descriptions used across all performance evaluation modules.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Module Selector */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden transition-all hover:shadow-md animate-in slide-in-from-bottom-4">
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                  <TableProperties size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">Performance Modules</h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Select a module to configure its score bands</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {modules.map((module) => {
                  const isActive = activeModule === module.key
                  const Icon = module.icon
                  const count = moduleCounts[module.key] ?? 0
                  return (
                    <button
                      key={module.key}
                      type="button"
                      onClick={() => setActiveModule(module.key)}
                      className={`relative flex items-center gap-3 px-5 py-4 rounded-xl border-2 transition-all duration-200 ${
                        isActive
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-sm shadow-blue-500/5'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                          : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className={`text-sm font-bold transition-colors ${
                          isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {module.label}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                          {module.desc}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isActive
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Score Bands */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden transition-all hover:shadow-md animate-in slide-in-from-bottom-4 delay-100">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                    {(() => {
                      const ActiveIcon = modules.find((m) => m.key === activeModule)?.icon ?? ClipboardList
                      return <ActiveIcon size={18} />
                    })()}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                      {modules.find((m) => m.key === activeModule)?.label}
                    </h2>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                      {rows.length} score {rows.length === 1 ? 'band' : 'bands'} configured
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {isLoading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : rows.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <TableProperties size={28} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">No score bands configured</p>
                    <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Score bands will appear here once created.</p>
                  </div>
                ) : (
                  rows.map((row) => {
                    const colors = getScoreColor(row.minScore, row.maxScore)
                    return (
                      <div
                        key={row.id}
                        className={`relative flex items-stretch rounded-xl border ${colors.border} ${colors.bg} overflow-hidden transition-all hover:shadow-md hover:shadow-slate-900/5 group`}
                      >
                        {/* Color indicator bar */}
                        <div className={`w-1 shrink-0 bg-gradient-to-b ${colors.bar}`} />

                        <div className="flex-1 p-4 sm:p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Score badge + Title */}
                              <div className="flex items-center gap-2.5 mb-2">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${colors.badge}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                  {row.minScore}–{row.maxScore}
                                </span>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                  {row.title}
                                </h3>
                              </div>
                              {/* Details */}
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                                {row.details}
                              </p>
                            </div>

                            {/* Edit button */}
                            <button
                              type="button"
                              onClick={() => openEdit(row)}
                              className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-400 hover:text-blue-600 hover:border-blue-400 dark:hover:text-blue-400 dark:hover:border-blue-500 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 active:scale-95"
                              title="Edit score band"
                            >
                              <Edit3 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !isSaving && setEditing(null)} />
            <div className="relative my-auto w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-200 dark:border-slate-700 z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal header */}
            <div className="flex shrink-0 items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${editingColors?.badge}`}>
                  <Edit3 size={15} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Edit Score Band</h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {modules.find((m) => m.key === editing.module)?.label}
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
            <div className="px-6 pt-6">
              <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 block">Score Range Preview</label>
              <div className="relative h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${editingColors?.bar ?? 'from-slate-400 to-slate-600'} rounded-full transition-all duration-300`}
                  style={{ width: `${((form.maxScore - form.minScore) / 100) * 100}%`, left: `${form.minScore}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">0</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${editingColors?.badge ?? 'bg-slate-100 text-slate-600'}`}>
                  {form.minScore}–{form.maxScore}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">100</span>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 pt-5 pb-2 space-y-4">
              {/* Score range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <Hash size={12} />
                    Min Score
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.minScore}
                    onChange={(e) => setForm({ ...form, minScore: Number(e.target.value) })}
                    className="w-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <Hash size={12} />
                    Max Score
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.maxScore}
                    onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) })}
                    className="w-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <AlignLeft size={12} />
                  Explanation Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Outstanding"
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all outline-none"
                />
              </div>

              {/* Details */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <FileText size={12} />
                  Details
                </label>
                <textarea
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                  rows={3}
                  placeholder="Describe what this score band represents..."
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all outline-none resize-none"
                />
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <AlertTriangle size={12} />
                  Reason for Change
                </label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  rows={2}
                  placeholder="Explain why this change is needed..."
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all outline-none resize-none"
                />
              </div>

              {/* Apply to modules */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <Layers size={12} />
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
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                          checked
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <Icon size={14} />
                        {module.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            </div>

            {/* Modal footer */}
            <div className="flex shrink-0 justify-end gap-2.5 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={isSaving}
                className="px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-semibold border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-all active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
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
