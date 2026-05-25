import React from 'react';

export type SelfAssessmentAudienceAccent = 'legacy' | 'blue';

const accentStyles = {
  legacy: {
    badgeGradient: 'from-[#5D5FEF]/10 to-[#7C7EF5]/10',
    badgeGradientDark: 'dark:from-[#5D5FEF]/20 dark:to-[#7C7EF5]/20',
    badgeText: 'text-[#5D5FEF] dark:text-[#8b8ef7]',
    selectedCard:
      'border-[#5D5FEF]/40 bg-[#5D5FEF]/[0.04] shadow-md shadow-[#5D5FEF]/10 ring-1 ring-[#5D5FEF]/20 -translate-y-0.5 dark:border-[#5D5FEF] dark:bg-[#5D5FEF]/10 dark:shadow-none dark:ring-[#5D5FEF]/30',
    selectedOverlay:
      'from-[#5D5FEF]/[0.03] to-[#7C7EF5]/[0.02] dark:from-[#5D5FEF]/[0.05] dark:to-[#7C7EF5]/[0.03]',
    selectedIcon: 'from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/25',
    selectedTitle: 'text-[#4F52D9] dark:text-white',
    checkIcon: 'from-[#5D5FEF] to-[#7C7EF5] shadow-[#5D5FEF]/20',
  },
  blue: {
    badgeGradient: 'from-[#2463eb]/10 to-[#1d4ed8]/10',
    badgeGradientDark: 'dark:from-[#2463eb]/20 dark:to-[#1d4ed8]/20',
    badgeText: 'text-[#2463eb] dark:text-[#60a5fa]',
    selectedCard:
      'border-[#2463eb]/40 bg-[#2463eb]/[0.04] shadow-md shadow-[#2463eb]/10 ring-1 ring-[#2463eb]/20 -translate-y-0.5 dark:border-[#2463eb] dark:bg-[#2463eb]/10 dark:shadow-none dark:ring-[#2463eb]/30',
    selectedOverlay:
      'from-[#2463eb]/[0.03] to-[#1d4ed8]/[0.02] dark:from-[#2463eb]/[0.05] dark:to-[#1d4ed8]/[0.03]',
    selectedIcon: 'from-[#2463eb] to-[#1d4ed8] shadow-lg shadow-[#2463eb]/25',
    selectedTitle: 'text-[#1d4ed8] dark:text-white',
    checkIcon: 'from-[#2463eb] to-[#1d4ed8] shadow-[#2463eb]/20',
  },
} as const;

export const formatEmployeeCount = (count: number) => `${count} ${count === 1 ? 'employee' : 'employees'}`;

export const createCountBadge = (
  count: number,
  accent: SelfAssessmentAudienceAccent = 'legacy',
): React.ReactNode => {
  if (count <= 0) return null;
  const styles = accentStyles[accent];
  return (
    <span
      className={`shrink-0 rounded-full bg-gradient-to-r ${styles.badgeGradient} px-2.5 py-0.5 text-[11px] font-bold tabular-nums ${styles.badgeText} ${styles.badgeGradientDark}`}
    >
      {count} employees
    </span>
  );
};

export interface AudienceCardProps<T extends string> {
  value: T;
  selected: boolean;
  title: string;
  description: string[];
  icon: React.ReactNode;
  badge?: React.ReactNode;
  onSelect: (value: T) => void;
  accent?: SelfAssessmentAudienceAccent;
}

export function AudienceCard<T extends string>({
  value,
  selected,
  title,
  description,
  icon,
  badge,
  onSelect,
  accent = 'legacy',
}: AudienceCardProps<T>) {
  const styles = accentStyles[accent];

  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`group relative w-full rounded-2xl border p-4 text-left transition-all duration-300 ${
        selected
          ? styles.selectedCard
          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-700/60 dark:bg-slate-800/60 dark:hover:border-slate-600'
      }`}
    >
      {selected && (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${styles.selectedOverlay} rounded-2xl`}
        />
      )}
      <div className="relative flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
            selected
              ? `bg-gradient-to-br ${styles.selectedIcon} text-white`
              : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/80 group-hover:scale-105 dark:bg-slate-700 dark:text-slate-400 dark:group-hover:bg-slate-600'
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-sm font-bold leading-snug ${
                selected ? styles.selectedTitle : 'text-slate-800 dark:text-slate-100'
              }`}
            >
              {title}
            </h3>
            {selected && (
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${styles.checkIcon} shadow-sm`}
              >
                <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <div className="mt-1.5 flex flex-col gap-0.5">
            {description.map((line) => (
              <span key={line} className="text-xs text-slate-500 dark:text-slate-400">
                {line}
              </span>
            ))}
          </div>
          {badge && <div className="mt-2.5">{badge}</div>}
        </div>
      </div>
    </button>
  );
}
