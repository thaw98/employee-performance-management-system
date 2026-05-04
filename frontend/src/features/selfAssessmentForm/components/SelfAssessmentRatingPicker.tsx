import { Star } from 'lucide-react';
import type { SelfAssessmentRatingSystem } from '../api/selfAssessmentFormApi';
import { getRatingOptions } from '../ratingSystem';

const TICKS_1_10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const STARS_1_5 = [1, 2, 3, 4, 5] as const;

export interface SelfAssessmentRatingPickerProps {
  title?: string;
  /** Omit header + divider (e.g. when the question line is already shown above). */
  compact?: boolean;
  ratingSystem: SelfAssessmentRatingSystem | null | undefined;
  yesNoAnswer: string | null | undefined;
  value: number | null | undefined;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

function TenPointScaleWireframe({
  allowed,
  value,
  onChange,
  disabled,
}: {
  allowed: number[];
  value: number | null | undefined;
  onChange: (rating: number) => void;
  disabled: boolean;
}) {
  const inactive = disabled || allowed.length === 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-5 dark:border-slate-600 dark:bg-slate-900/40">
      <div className="relative pt-1 pb-2">
        <div className="grid grid-cols-10 gap-0">
          {TICKS_1_10.map((n) => {
            const isAllowed = allowed.includes(n);
            const isSelected = value === n;
            return (
              <div key={n} className="flex flex-col items-center">
                <button
                  type="button"
                  disabled={inactive || !isAllowed}
                  aria-label={`Rate ${n} out of 10`}
                  aria-pressed={isSelected}
                  onClick={() => onChange(n)}
                  className={`flex min-h-[2rem] min-w-[1.75rem] flex-col items-center justify-end pb-1 text-xs font-semibold transition-colors sm:text-sm ${
                    inactive || !isAllowed
                      ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                      : isSelected
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <span>{n}</span>
                  <span className="mt-0.5 block h-2 w-px bg-current opacity-80" aria-hidden />
                </button>
              </div>
            );
          })}
        </div>

        <div className="relative mx-1 mt-1 min-h-[3.5rem] pb-1">
          <div className="absolute inset-x-0 top-2 h-0.5 rounded-full bg-slate-300 dark:bg-slate-600" />
          {value != null && allowed.includes(value) && (
            <>
              <div
                className="absolute top-2 z-[1] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-500 bg-slate-50 dark:bg-slate-900"
                style={{ left: `${((value - 0.5) / 10) * 100}%` }}
                aria-hidden
              />
              <div
                className="absolute top-[calc(0.5rem+10px)] z-[1] h-4 w-0.5 -translate-x-1/2 rounded-full bg-emerald-500"
                style={{ left: `${((value - 0.5) / 10) * 100}%` }}
                aria-hidden
              />
              <p
                className="absolute top-[calc(0.5rem+26px)] text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-300"
                style={{
                  left: `${((value - 0.5) / 10) * 100}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                {value}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-between border-t border-slate-200 pt-3 text-xs font-medium text-slate-500 dark:border-slate-600 dark:text-slate-400">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}

function FiveStarWireframe({
  allowed,
  value,
  onChange,
  disabled,
}: {
  allowed: number[];
  value: number | null | undefined;
  onChange: (rating: number) => void;
  disabled: boolean;
}) {
  const inactive = disabled || allowed.length === 0;
  const displayNum = value != null && allowed.includes(value) ? value : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-5 dark:border-slate-600 dark:bg-slate-900/40">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5" role="group" aria-label="Rating out of 5">
          {STARS_1_5.map((star) => {
            const isAllowed = allowed.includes(star);
            const filled = displayNum != null && star <= displayNum;
            return (
              <button
                key={star}
                type="button"
                disabled={inactive || !isAllowed}
                aria-label={`${star} out of 5 stars`}
                aria-pressed={filled}
                onClick={() => onChange(star)}
                className={`rounded-lg p-1 transition-colors ${
                  inactive || !isAllowed
                    ? 'cursor-not-allowed opacity-35'
                    : 'hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
                }`}
              >
                <Star
                  className={`h-8 w-8 sm:h-9 sm:w-9 ${
                    filled
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-transparent text-slate-400 dark:text-slate-500'
                  }`}
                  strokeWidth={1.75}
                />
              </button>
            );
          })}
        </div>
        <span className="text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
          ({displayNum != null ? `${displayNum}/5` : '—/5'})
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Tap to rate</p>
    </div>
  );
}

export function SelfAssessmentRatingPicker({
  title,
  compact,
  ratingSystem,
  yesNoAnswer,
  value,
  onChange,
  disabled = false,
}: SelfAssessmentRatingPickerProps) {
  const system: SelfAssessmentRatingSystem = ratingSystem === 'TEN_POINT' ? 'TEN_POINT' : 'FIVE_POINT';
  const allowed = getRatingOptions(system, yesNoAnswer);
  const pickerDisabled = disabled || !yesNoAnswer;

  const body =
    system === 'TEN_POINT' ? (
      <TenPointScaleWireframe allowed={allowed} value={value} onChange={onChange} disabled={pickerDisabled} />
    ) : (
      <FiveStarWireframe allowed={allowed} value={value} onChange={onChange} disabled={pickerDisabled} />
    );

  if (compact) {
    return body;
  }

  return (
    <div className="space-y-3">
      {title ? (
        <>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
          <div className="h-px w-full bg-slate-200 dark:bg-slate-600" />
        </>
      ) : null}
      {body}
    </div>
  );
}
