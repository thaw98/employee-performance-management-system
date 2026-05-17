import { Check, Star, X } from 'lucide-react';

type YesNoRatingDisplayProps = {
  yesNo: string | null | undefined;
  rating: number | null | undefined;
  size?: 'sm' | 'md';
  emptyLabel?: string;
};

export function YesNoRatingDisplay({
  yesNo,
  rating,
  size = 'md',
  emptyLabel = '—',
}: YesNoRatingDisplayProps) {
  if (!yesNo && rating == null) {
    return (
      <span className={`font-medium text-slate-400 dark:text-slate-500 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        {emptyLabel}
      </span>
    );
  }

  const yesNoSize = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  const ratingSize = size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
  const yesNoIconSize = size === 'sm' ? 12 : 14;
  const starSize = size === 'sm' ? 10 : 11;
  const gap = size === 'sm' ? 'gap-1' : 'gap-1.5';

  const isYes = yesNo === 'Yes';
  const isNo = yesNo === 'No';

  return (
    <div className={`inline-flex flex-wrap items-center ${gap}`}>
      {yesNo && (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-bold ring-1 ${yesNoSize} ${
            isYes
              ? 'bg-emerald-100 text-emerald-700 ring-emerald-200/80 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-700/50'
              : isNo
                ? 'bg-red-100 text-red-700 ring-red-200/80 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-700/50'
                : 'bg-slate-100 text-slate-600 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600/50'
          }`}
        >
          {isYes ? (
            <Check size={yesNoIconSize} strokeWidth={3} aria-hidden />
          ) : isNo ? (
            <X size={yesNoIconSize} strokeWidth={3} aria-hidden />
          ) : null}
          {yesNo}
        </span>
      )}
      {rating != null && (
        <span
          className={`inline-flex items-center gap-1 rounded-md border border-amber-200/60 bg-amber-50 font-bold text-amber-700 dark:border-amber-600/45 dark:bg-amber-900/25 dark:text-amber-300 ${ratingSize}`}
        >
          <Star size={starSize} className="shrink-0 fill-amber-500 text-amber-500" aria-hidden />
          <span className="tabular-nums">{rating}</span>
        </span>
      )}
    </div>
  );
}
