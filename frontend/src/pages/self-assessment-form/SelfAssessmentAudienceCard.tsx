import React from 'react';

export const formatEmployeeCount = (count: number) => `${count} ${count === 1 ? 'employee' : 'employees'}`;

export const createCountBadge = (count: number): React.ReactNode =>
  count > 0 ? (
    <span className="shrink-0 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-blue-900 dark:bg-sky-950/50 dark:text-sky-200">
      {formatEmployeeCount(count)}
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
      className={`w-full rounded-xl border p-4 text-left transition ${
        selected
          ? 'border-2 border-[#5D5FEF] bg-[#5D5FEF]/[0.07] shadow-sm dark:border-[#7C7EF5] dark:bg-[#5D5FEF]/15'
          : 'border border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? 'border-[#5D5FEF]' : 'border-slate-300 dark:border-slate-500'
          }`}
          aria-hidden
        >
          <span className={`h-2.5 w-2.5 rounded-full ${selected ? 'bg-[#5D5FEF]' : 'bg-transparent'}`} />
        </span>
        <div className="flex min-w-0 flex-1 gap-3">
          <span
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              selected
                ? 'bg-[#5D5FEF]/15 text-[#4F52D9] dark:bg-[#5D5FEF]/25 dark:text-[#A5A7FA]'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3
                className={`text-sm font-bold ${selected ? 'text-blue-950 dark:text-white' : 'text-slate-900 dark:text-white'}`}
              >
                {title}
              </h3>
              {badge ? (
                <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">{badge}</div>
              ) : null}
            </div>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs marker:text-slate-300 dark:marker:text-slate-600">
              {description.map((line) => (
                <li key={line} className="text-slate-500 dark:text-slate-400">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </button>
  );
}
