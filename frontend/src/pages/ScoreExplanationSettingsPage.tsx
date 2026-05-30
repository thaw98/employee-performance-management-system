import { useMemo, useState } from 'react'
import { Edit3, Loader2, Save, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  useGetScoreExplanationsQuery,
  useUpdateScoreExplanationMutation,
  type ScoreExplanation,
  type ScoreExplanationModule,
} from '../features/scoreExplanation/scoreExplanationApi'

const modules: Array<{ key: ScoreExplanationModule; label: string }> = [
  { key: 'SELF_ASSESSMENT', label: 'Self Assessment' },
  { key: 'APPRAISAL', label: 'Appraisal' },
  { key: 'FEEDBACK_360', label: '360 Feedback' },
]

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
      toast.success('Score explanation updated.')
      setEditing(null)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update score explanation.')
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Score Explanation Settings</h1>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          Manage score bands used across performance modules.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {modules.map((module) => (
          <button
            key={module.key}
            type="button"
            onClick={() => setActiveModule(module.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
              activeModule === module.key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            {module.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              {['Score', 'Explanation Title', 'Explanation Details', 'Action'].map((heading) => (
                <th key={heading} className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-500">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center"><Loader2 className="mx-auto animate-spin text-blue-600" /></td></tr>
            ) : rows.map((row) => (
              <tr key={row.id}>
                <td className="px-5 py-4 text-sm font-black text-slate-900 dark:text-white">{row.minScore}-{row.maxScore}</td>
                <td className="px-5 py-4 text-sm font-bold text-slate-700 dark:text-slate-200">{row.title}</td>
                <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{row.details}</td>
                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/50" onClick={() => !isSaving && setEditing(null)} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Edit Score Explanation</h2>
              <button type="button" onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            <div className="grid gap-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <label className="text-xs font-bold text-slate-500">Min Score<input type="number" value={form.minScore} onChange={(e) => setForm({ ...form, minScore: Number(e.target.value) })} className="mt-1 w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800" /></label>
                <label className="text-xs font-bold text-slate-500">Max Score<input type="number" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) })} className="mt-1 w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800" /></label>
              </div>
              <label className="text-xs font-bold text-slate-500">Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800" /></label>
              <label className="text-xs font-bold text-slate-500">Details<textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} rows={3} className="mt-1 w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800" /></label>
              <label className="text-xs font-bold text-slate-500">Reason for Change<textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} className="mt-1 w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800" /></label>
              <div>
                <p className="mb-2 text-xs font-bold text-slate-500">Apply To Modules</p>
                <div className="flex flex-wrap gap-3">
                  {modules.map((module) => (
                    <label key={module.key} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                      <input type="checkbox" checked={form.applyToModules.includes(module.key)} onChange={() => toggleModule(module.key)} />
                      {module.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 px-6 py-4">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button>
              <button type="button" onClick={save} disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-black text-white disabled:opacity-60">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
