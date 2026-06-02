import { Grid2X2, Table2 } from 'lucide-react'

export type ViewMode = 'table' | 'grid'

interface ViewModeToggleProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
  label?: string
}

export function ViewModeToggle({ value, onChange, label = 'View mode' }: ViewModeToggleProps) {
  return (
    <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label={label}>
      {[
        { value: 'table' as const, label: 'Table', icon: Table2 },
        { value: 'grid' as const, label: 'Grid', icon: Grid2X2 },
      ].map((option) => {
        const Icon = option.icon
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-black uppercase tracking-widest transition-all ${
              isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
            }`}
            aria-pressed={isActive}
          >
            <Icon size={16} />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
