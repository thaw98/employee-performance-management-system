import { memo } from 'react'
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  UserX,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type EmployeeStatsCardKey = 'Total' | 'Active' | 'Inactive' | 'Probation' | 'Permanent'

export interface EmployeeStatsCounts {
  total: number
  active: number
  inactive: number
  probation: number
  permanent: number
}

interface EmployeeStatsCardsProps {
  counts: EmployeeStatsCounts
  isLoading?: boolean
  selectedStatus?: string
  onSelectStatus: (status?: EmployeeStatsCardKey) => void
}

type StatCardConfig = {
  key: EmployeeStatsCardKey
  label: string
  description: string
  countKey: keyof EmployeeStatsCounts
  icon: LucideIcon
  tone: string
  iconTone: string
  accent: string
  selectedBg: string
  selectedBorder: string
  selectedShadow: string
  selectedRing: string
}

const STAT_CARDS: StatCardConfig[] = [
  {
    key: 'Total',
    label: 'Total',
    description: 'All employee records',
    countKey: 'total',
    icon: Users,
    tone: 'from-violet-500/10 to-violet-500/5',
    iconTone: 'bg-violet-100 text-violet-600',
    accent: 'bg-violet-500',
    selectedBg: 'bg-gradient-to-br from-violet-50 to-white',
    selectedBorder: 'border-violet-300',
    selectedShadow: 'shadow-violet-100/80',
    selectedRing: 'ring-violet-500/25',
  },
  {
    key: 'Active',
    label: 'Active',
    description: 'Currently employed',
    countKey: 'active',
    icon: CheckCircle2,
    tone: 'from-emerald-500/10 to-emerald-500/5',
    iconTone: 'bg-emerald-100 text-emerald-600',
    accent: 'bg-emerald-500',
    selectedBg: 'bg-gradient-to-br from-emerald-50 to-white',
    selectedBorder: 'border-emerald-300',
    selectedShadow: 'shadow-emerald-100/80',
    selectedRing: 'ring-emerald-500/25',
  },
  {
    key: 'Inactive',
    label: 'Inactive',
    description: 'Resigned or terminated',
    countKey: 'inactive',
    icon: UserX,
    tone: 'from-slate-500/10 to-slate-500/5',
    iconTone: 'bg-slate-100 text-slate-600',
    accent: 'bg-slate-500',
    selectedBg: 'bg-gradient-to-br from-slate-50 to-white',
    selectedBorder: 'border-slate-300',
    selectedShadow: 'shadow-slate-100/80',
    selectedRing: 'ring-slate-500/25',
  },
  {
    key: 'Probation',
    label: 'Probation',
    description: 'On probation period',
    countKey: 'probation',
    icon: Clock,
    tone: 'from-amber-500/10 to-amber-500/5',
    iconTone: 'bg-amber-100 text-amber-600',
    accent: 'bg-amber-500',
    selectedBg: 'bg-gradient-to-br from-amber-50 to-white',
    selectedBorder: 'border-amber-300',
    selectedShadow: 'shadow-amber-100/80',
    selectedRing: 'ring-amber-500/25',
  },
  {
    key: 'Permanent',
    label: 'Permanent',
    description: 'Confirmed staff',
    countKey: 'permanent',
    icon: BadgeCheck,
    tone: 'from-blue-500/10 to-blue-500/5',
    iconTone: 'bg-blue-100 text-blue-600',
    accent: 'bg-blue-600',
    selectedBg: 'bg-gradient-to-br from-blue-50 to-white',
    selectedBorder: 'border-blue-300',
    selectedShadow: 'shadow-blue-100/80',
    selectedRing: 'ring-blue-500/25',
  },
]

function formatShare(value: number, total: number): string | null {
  if (total <= 0 || value <= 0) return null
  const pct = Math.round((value / total) * 100)
  return `${pct}% of total`
}

function EmployeeStatsCards({
  counts,
  isLoading = false,
  selectedStatus,
  onSelectStatus,
}: EmployeeStatsCardsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {STAT_CARDS.map((card, index) => {
        const Icon = card.icon
        const isSelected = selectedStatus === card.key
        const value = counts[card.countKey]
        const shareLabel =
          card.key !== 'Total' ? formatShare(value, counts.total) : null

        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelectStatus(isSelected ? undefined : card.key)}
            className={`animate-fade-in-up group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              isSelected
                ? `${card.selectedBg} ${card.selectedBorder} shadow-md ${card.selectedShadow} ring-2 ${card.selectedRing}`
                : 'border-slate-200/80 bg-white shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md'
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
            aria-pressed={isSelected}
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 ${card.accent} transition-opacity duration-200 ${
                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
              }`}
            />

            <div
              className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${card.tone} transition-transform duration-300 group-hover:scale-110`}
            />

            <div className="relative flex items-center gap-3">
              <div
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${card.iconTone}`}
              >
                <Icon size={20} strokeWidth={2.25} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs font-bold uppercase tracking-wide text-slate-500">
                    {card.label}
                  </p>
                  {isSelected && (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
                      Filter
                    </span>
                  )}
                </div>

                {isLoading ? (
                  <div className="mt-1.5 h-8 w-14 animate-pulse rounded-md bg-slate-100" />
                ) : (
                  <p className="mt-0.5 text-2xl font-black tabular-nums leading-none text-slate-900">
                    {value.toLocaleString()}
                  </p>
                )}

                <p className="mt-1 truncate text-[11px] font-medium text-slate-400">
                  {shareLabel ?? card.description}
                </p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default memo(EmployeeStatsCards)
