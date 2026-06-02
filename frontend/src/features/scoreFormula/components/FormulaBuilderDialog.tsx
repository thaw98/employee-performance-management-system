import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Loader2, Variable } from 'lucide-react'
import type { ScoreFormulaDto } from '../api/scoreFormulaApi'

interface FormulaBuilderDialogProps {
  open: boolean
  onClose: () => void
  onSave: (data: { name: string; description?: string; definition: string }) => Promise<void>
  formula?: ScoreFormulaDto | null
  area: string
}

interface ExpressionNode {
  numeratorSource: string
  denominatorFields: string[]
  scaleFactor: number
}

const INPUT_OPTIONS = [
  { value: 'SUM_RATINGS', label: 'Sum of Ratings' },
  { value: 'NUM_QUESTIONS', label: 'Number of Questions' },
  { value: 'MAX_RATING', label: 'Max Rating' },
]

const FIXED_NUMERATOR = 'SUM_RATINGS'

function parseDefinition(definition: string): ExpressionNode {
  try {
    const parsed = JSON.parse(definition)
    const expr = parsed.expression || parsed
    if (expr.type === 'multiply') {
      const scaleFactor = expr.right?.type === 'literal' ? expr.right.value : 100
      const divideNode = expr.left
      if (divideNode?.type === 'divide') {
        const numeratorSource = divideNode.left?.name || FIXED_NUMERATOR
        const multiplyNode = divideNode.right
        const denominatorFields: string[] = []
        if (multiplyNode?.type === 'multiply') {
          if (multiplyNode.left?.name) denominatorFields.push(multiplyNode.left.name)
          if (multiplyNode.right?.name) denominatorFields.push(multiplyNode.right.name)
        }
        return { numeratorSource, denominatorFields, scaleFactor }
      }
    }
  } catch {}
  return { numeratorSource: FIXED_NUMERATOR, denominatorFields: ['NUM_QUESTIONS', 'MAX_RATING'], scaleFactor: 100 }
}

function buildDefinition(node: ExpressionNode): string {
  const denominatorLeft = node.denominatorFields[0] || 'NUM_QUESTIONS'
  const denominatorRight = node.denominatorFields[1] || 'MAX_RATING'
  return JSON.stringify({
    expression: {
      type: 'multiply',
      left: {
        type: 'divide',
        left: { type: 'input', name: node.numeratorSource },
        right: {
          type: 'multiply',
          left: { type: 'input', name: denominatorLeft },
          right: { type: 'input', name: denominatorRight },
        },
      },
      right: { type: 'literal', value: node.scaleFactor },
    },
  })
}

export default function FormulaBuilderDialog({
  open,
  onClose,
  onSave,
  formula,
  area,
}: FormulaBuilderDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [expressionNode, setExpressionNode] = useState<ExpressionNode>({
    numeratorSource: FIXED_NUMERATOR,
    denominatorFields: ['NUM_QUESTIONS', 'MAX_RATING'],
    scaleFactor: 100,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (formula) {
      setName(formula.name)
      setDescription(formula.description ?? '')
      setExpressionNode(parseDefinition(formula.definition))
    } else {
      setName('')
      setDescription('')
      setExpressionNode({
        numeratorSource: FIXED_NUMERATOR,
        denominatorFields: ['NUM_QUESTIONS', 'MAX_RATING'],
        scaleFactor: 100,
      })
    }
  }, [formula, open])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        name,
        description,
        definition: buildDefinition(expressionNode),
      })
    } finally {
      setSaving(false)
    }
  }

  const canSave = name.trim().length > 0

  if (!open) return null

  const getInputLabel = (value: string) => INPUT_OPTIONS.find((o) => o.value === value)?.label ?? value

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !saving && onClose()} />
      <div className="relative my-auto w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-slate-900/25 border border-slate-200 dark:border-slate-700 z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/20">
              <Variable size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                {formula ? 'Edit Formula' : 'Create Formula'}
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                {area.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-6 pt-5 pb-2 space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
                Formula Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard Score Formula"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-amber-400 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 transition-all outline-none"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Describe what this formula calculates..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-amber-400 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 transition-all outline-none resize-none"
              />
            </div>

            {/* Formula Expression Preview */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
                Formula Expression
              </label>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-sm font-mono font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                  score = (
                  <span className="text-blue-600 dark:text-blue-400">{expressionNode.numeratorSource}</span>
                  {' / ('}
                  {expressionNode.denominatorFields.map((f, i) => (
                    <span key={f}>
                      {i > 0 && <span className="text-slate-400"> × </span>}
                      <span className="text-emerald-600 dark:text-emerald-400">{f}</span>
                    </span>
                  ))}
                  )) × <span className="text-amber-600 dark:text-amber-400">{expressionNode.scaleFactor}</span>
                </div>
              </div>
            </div>

            {/* Formula Configuration */}
            <div className="space-y-4">
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Configuration</p>
              </div>

              {/* Numerator */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
                  Numerator (Sum of)
                </label>
                <select
                  value={expressionNode.numeratorSource}
                  onChange={(e) =>
                    setExpressionNode((prev) => ({ ...prev, numeratorSource: e.target.value }))
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-amber-400 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 transition-all outline-none appearance-none cursor-pointer"
                >
                  {INPUT_OPTIONS.filter((o) => o.value === FIXED_NUMERATOR).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Denominator Fields */}
              <div className="grid grid-cols-2 gap-3">
                {expressionNode.denominatorFields.map((field, index) => (
                  <div key={index} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
                      Denominator Field {index + 1}
                    </label>
                    <select
                      value={field}
                      onChange={(e) => {
                        const newFields = [...expressionNode.denominatorFields]
                        newFields[index] = e.target.value
                        setExpressionNode((prev) => ({ ...prev, denominatorFields: newFields }))
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-amber-400 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 transition-all outline-none appearance-none cursor-pointer"
                    >
                      {INPUT_OPTIONS.filter((o) => o.value !== expressionNode.numeratorSource).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Scale Factor */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
                  Scale Factor (multiplier)
                </label>
                <input
                  type="number"
                  value={expressionNode.scaleFactor}
                  onChange={(e) =>
                    setExpressionNode((prev) => ({
                      ...prev,
                      scaleFactor: parseInt(e.target.value) || 100,
                    }))
                  }
                  className="w-full max-w-[160px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-amber-400 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex shrink-0 justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-[0.97] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="px-6 py-2.5 bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] text-white rounded-xl text-sm font-bold shadow-md shadow-[#2463eb]/20 hover:shadow-lg hover:shadow-[#2463eb]/30 transition-all flex items-center gap-2 active:scale-[0.97] disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : formula ? 'Update Formula' : 'Create Formula'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
