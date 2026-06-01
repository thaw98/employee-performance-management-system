export const BAND_NAMES: Record<number, string> = {
  1: 'Outstanding',
  2: 'Good',
  3: 'Meet Requirement',
  4: 'Need Improvement',
  5: 'Unsatisfactory',
}

export function getScoreColor(min: number, max: number) {
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

export function scoreColorBySortOrder(sortOrder: number) {
  if (sortOrder === 1) return getScoreColor(86, 100)
  if (sortOrder === 2) return getScoreColor(71, 85)
  if (sortOrder === 3) return getScoreColor(60, 70)
  if (sortOrder === 4) return getScoreColor(40, 59)
  return getScoreColor(0, 39)
}

export function ScoreScaleBar({ bands, height }: { bands: Array<{ minScore: number; maxScore: number; title: string }>; height?: string }) {
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
