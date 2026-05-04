import React from 'react';

export const formatEmployeeCount = (count: number) => `${count} ${count === 1 ? 'employee' : 'employees'}`;

export const createCountBadge = (count: number): React.ReactNode =>
  count > 0 ? (
    <span className="shrink-0 rounded-full bg-[#5D5FEF]/10 px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-[#5D5FEF] dark:bg-[#5D5FEF]/20 dark:text-[#8b8ef7]">
      {count}
    </span>
  ) : null;

export interface AudienceCardProps<T extends string> {
  value: T;
  selected: boolean;
  title: string;
  description: string[];
  icon: React.ReactNode;
  badge?: React.ReactNode;
  onSelect: (value: T) => void;
}

export function AudienceCard<T extends string>({
  value,
  selected,
  title,
  description,
  icon,
  badge,
  onSelect,
}: AudienceCardProps<T>) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`group relative w-full rounded-xl border p-4 text-left transition-all duration-200 ${
        selected
          ? 'border-[#5D5FEF] bg-[#5D5FEF]/[0.04] shadow-sm shadow-[#5D5FEF]/10 ring-1 ring-[#5D5FEF]/20 dark:border-[#5D5FEF] dark:bg-[#5D5FEF]/10 dark:shadow-none dark:ring-[#5D5FEF]/30'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
            selected
              ? 'bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] text-white shadow-md shadow-[#5D5FEF]/25'
              : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:group-hover:bg-slate-600'
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-sm font-bold leading-snug ${
                selected ? 'text-[#4F52D9] dark:text-white' : 'text-slate-800 dark:text-slate-100'
              }`}
            >
              {title}
            </h3>
            {badge}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            {description.map((line) => (
              <span key={line} className="text-xs text-slate-500 dark:text-slate-400">
                {line}
              </span>
            ))}
          </div>
        </div>
      </div>
      {selected && (
        <div className="absolute right-3 top-3">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#5D5FEF]">
            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
    </button>
  );
}
