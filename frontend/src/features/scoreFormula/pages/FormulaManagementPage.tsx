import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  SlidersHorizontal,
  ChevronRight,
  Plus,
  Star,
  Edit3,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  ClipboardList,
  Users,
  Award,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useGetFormulasByAreaQuery,
  useCreateFormulaMutation,
  useUpdateFormulaMutation,
  useSetDefaultFormulaMutation,
  useInactivateFormulaMutation,
} from '../api/scoreFormulaApi'
import type { ScoreFormulaDto } from '../api/scoreFormulaApi'
import FormulaBuilderDialog from '../components/FormulaBuilderDialog'

const AREAS = ['SELF_ASSESSMENT', 'FEEDBACK_360', 'APPRAISAL'] as const

const areaConfig: Record<string, { label: string; icon: typeof ClipboardList; accent: string; accentBg: string; accentText: string }> = {
  SELF_ASSESSMENT: { label: 'Self-Assessment', icon: ClipboardList, accent: 'blue', accentBg: 'bg-blue-50 dark:bg-blue-900/20', accentText: 'text-blue-600 dark:text-blue-400' },
  FEEDBACK_360: { label: '360 Feedback', icon: Users, accent: 'teal', accentBg: 'bg-teal-50 dark:bg-teal-900/20', accentText: 'text-teal-600 dark:text-teal-400' },
  APPRAISAL: { label: 'Appraisal', icon: Award, accent: 'violet', accentBg: 'bg-violet-50 dark:bg-violet-900/20', accentText: 'text-violet-600 dark:text-violet-400' },
}

export default function FormulaManagementPage() {
  const [area, setArea] = useState<string>('SELF_ASSESSMENT')
  const { data: formulas = [], isLoading } = useGetFormulasByAreaQuery(area)
  const [createFormula] = useCreateFormulaMutation()
  const [updateFormula] = useUpdateFormulaMutation()
  const [setDefaultFormula] = useSetDefaultFormulaMutation()
  const [inactivateFormula] = useInactivateFormulaMutation()

  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingFormula, setEditingFormula] = useState<ScoreFormulaDto | null>(null)
  const [inactivateDialog, setInactivateDialog] = useState<ScoreFormulaDto | null>(null)
  const [replacementId, setReplacementId] = useState<number | ''>('')
  const [inactivating, setInactivating] = useState(false)

  const activeFormulas = formulas.filter((f) => f.active)
  const defaultFormula = formulas.find((f) => f.isDefault && f.active)
  const currentArea = areaConfig[area]

  const handleCreate = () => {
    setEditingFormula(null)
    setBuilderOpen(true)
  }

  const handleEdit = (formula: ScoreFormulaDto) => {
    setEditingFormula(formula)
    setBuilderOpen(true)
  }

  const handleSave = async (data: { name: string; description?: string; definition: string }) => {
    try {
      if (editingFormula) {
        await updateFormula({ id: editingFormula.id, body: data }).unwrap()
        toast.success('Formula updated')
      } else {
        await createFormula({ ...data, area }).unwrap()
        toast.success('Formula created')
      }
      setBuilderOpen(false)
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save formula')
    }
  }

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultFormula(id).unwrap()
      toast.success('Default formula updated')
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to set default formula')
    }
  }

  const handleInactivateClick = (formula: ScoreFormulaDto) => {
    setInactivateDialog(formula)
    setReplacementId('')
  }

  const handleInactivateConfirm = async () => {
    if (!inactivateDialog) return
    setInactivating(true)
    try {
      await inactivateFormula({
        id: inactivateDialog.id,
        replacementId: replacementId || undefined,
      }).unwrap()
      toast.success('Formula inactivated')
      setInactivateDialog(null)
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to inactivate formula')
    } finally {
      setInactivating(false)
    }
  }

  const needsReplacement = inactivateDialog?.isDefault
  const ActiveIcon = currentArea?.icon ?? ClipboardList

  return (
    <>
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
        {/* Breadcrumbs */}
        <div className="mb-8">
          <nav className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-5">
            <Link to="/hr/settings/system" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              System Settings
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-600 dark:text-slate-300">Score Formula Settings</span>
          </nav>

          {/* Header */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center shrink-0">
                <SlidersHorizontal size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Score Formula Settings</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Configure scoring formulas for performance evaluation modules.
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <div className={`w-2 h-2 rounded-full ${activeFormulas.length > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{activeFormulas.length} Active</span>
              </div>
              {defaultFormula && (
                <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <Star size={14} className="text-amber-500" />
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300 truncate max-w-[140px]">{defaultFormula.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Area Tabs */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <div className="px-6 pt-5 pb-1">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Evaluation Module</p>
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                {AREAS.map((key) => {
                  const cfg = areaConfig[key]
                  const isActive = area === key
                  const Icon = cfg.icon
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setArea(key)}
                      className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex-1 justify-center ${
                        isActive
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon size={15} />
                      <span className="hidden sm:inline">{cfg.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentArea?.accentBg ?? 'bg-slate-100'} ${currentArea?.accentText ?? 'text-slate-500'}`}>
                <ActiveIcon size={15} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">{currentArea?.label} Formulas</h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {formulas.length} {formulas.length === 1 ? 'formula' : 'formulas'} · {activeFormulas.length} active
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#2463eb]/30 hover:shadow-xl hover:shadow-[#2463eb]/40 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              <Plus size={16} />
              Create Formula
            </button>
          </div>

          {/* Formulas List Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm overflow-hidden">
            {/* Column Headers */}
            {!isLoading && formulas.length > 0 && (
              <div className="grid grid-cols-[1fr_1.5fr_80px_60px_100px_80px] items-center gap-4 px-6 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Name</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Description</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Default</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Created</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</span>
              </div>
            )}

            {/* Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {isLoading && (
                <div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-5 px-6 py-4 animate-pulse">
                      <div className="flex-1">
                        <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                      </div>
                      <div className="flex-[1.5]">
                        <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800 rounded" />
                      </div>
                      <div className="w-20">
                        <div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto" />
                      </div>
                      <div className="w-16">
                        <div className="h-5 w-5 bg-slate-100 dark:bg-slate-800 rounded mx-auto" />
                      </div>
                      <div className="w-24">
                        <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded mx-auto" />
                      </div>
                      <div className="w-20" />
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && formulas.length === 0 && (
                <div className="py-20 text-center">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <SlidersHorizontal size={24} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">No formulas configured</p>
                  <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
                    Click "Create Formula" to add one for {currentArea?.label}.
                  </p>
                </div>
              )}

              {formulas.map((f) => (
                <div
                  key={f.id}
                  className={`grid grid-cols-[1fr_1.5fr_80px_60px_100px_80px] items-center gap-4 px-6 py-4 group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${f.active ? '' : 'opacity-50'}`}
                >
                  {/* Name */}
                  <div className="min-w-0">
                    <span className={`text-sm truncate block ${f.isDefault ? 'font-black text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                      {f.name}
                      {f.isDefault && (
                        <Star size={12} className="inline-block ml-1.5 text-amber-500 -mt-0.5" fill="currentColor" />
                      )}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="min-w-0">
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
                      {f.description || <span className="italic text-slate-300 dark:text-slate-600">No description</span>}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      f.active
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {f.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Default */}
                  <div className="text-center">
                    {f.isDefault ? (
                      <Star size={16} className="text-amber-500 inline-block" fill="currentColor" />
                    ) : (
                      <Star size={16} className="text-slate-200 dark:text-slate-700 inline-block" />
                    )}
                  </div>

                  {/* Created */}
                  <div className="text-center">
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tabular-nums">
                      {new Date(f.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    {f.active && !f.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(f.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all active:scale-90"
                        title="Set as default"
                      >
                        <Star size={14} />
                      </button>
                    )}
                    {f.active && (
                      <button
                        type="button"
                        onClick={() => handleEdit(f)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 dark:text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-90"
                        title="Edit formula"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                    {f.active && (
                      <button
                        type="button"
                        onClick={() => handleInactivateClick(f)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-90"
                        title="Inactivate formula"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Formula Builder Dialog */}
      <FormulaBuilderDialog
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onSave={handleSave}
        formula={editingFormula}
        area={area}
      />

      {/* Inactivate Confirmation Modal */}
      {inactivateDialog && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !inactivating && setInactivateDialog(null)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-slate-900/25 border border-slate-200 dark:border-slate-700 z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 text-center">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-3xl flex items-center justify-center mx-auto mb-5">
                <AlertTriangle size={32} strokeWidth={2} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Inactivate Formula</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                {needsReplacement
                  ? `"${inactivateDialog.name}" is the current default formula. Select an active formula to become the new default before inactivating.`
                  : `Are you sure you want to inactivate "${inactivateDialog.name}"?`}
              </p>
            </div>

            {needsReplacement && (
              <div className="px-8 pb-4">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">
                  Replacement Formula
                </label>
                <select
                  value={replacementId}
                  onChange={(e) => setReplacementId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-red-400 dark:focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="">Select a replacement...</option>
                  {activeFormulas
                    .filter((f) => f.id !== inactivateDialog.id)
                    .map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>
              </div>
            )}

            <div className="p-8 pt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleInactivateConfirm}
                disabled={inactivating || (needsReplacement && !replacementId)}
                className="w-full py-3.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {inactivating ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {inactivating ? 'Inactivating...' : 'Confirm Inactivation'}
              </button>
              <button
                type="button"
                onClick={() => setInactivateDialog(null)}
                disabled={inactivating}
                className="w-full py-3.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
            <button
              type="button"
              onClick={() => !inactivating && setInactivateDialog(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
