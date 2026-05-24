import { Star } from 'lucide-react';
import type { SelfAssessmentRatingSystem } from '../api/selfAssessmentFormApi';
import { getRatingOptions } from '../ratingSystem';

const STARS_1_5 = [1, 2, 3, 4, 5] as const;
/** Five-point scale shown high → low (5 … 1). */
const NUMERIC_5_TO_1 = [5, 4, 3, 2, 1] as const;
/** Ten-point scale shown high → low (10 … 1). */
const NUMERIC_10_TO_1 = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as const;

export interface SelfAssessmentRatingPickerProps {
  title?: string;
  /** Omit header + divider (e.g. when the question line is already shown above). */
  compact?: boolean;
  /** Five-point UI: star buttons vs numeric 5–1 (ten-point unchanged). */
  fivePointVariant?: 'stars' | 'numeric';
  ratingSystem: SelfAssessmentRatingSystem | null | undefined;
  tenPointYesMinRating?: number | null;
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
      <div className="flex flex-wrap items-center gap-2 sm:gap-3" role="group" aria-label="Rating out of 10">
        {NUMERIC_10_TO_1.map((n) => {
          const isAllowed = allowed.includes(n);
          const isSelected = value === n;
          return (
            <button
              key={n}
              type="button"
              disabled={inactive || !isAllowed}
              aria-label={`Rate ${n} out of 10`}
              aria-pressed={isSelected}
              onClick={() => onChange(n)}
              className={`flex min-h-[2.5rem] min-w-[2.5rem] items-center justify-center rounded-lg border-2 text-base font-bold tabular-nums transition-colors sm:min-h-[2.75rem] sm:min-w-[2.75rem] sm:text-lg ${
                inactive || !isAllowed
                  ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-600'
                  : isSelected
                    ? 'border-[#2463eb] bg-[#2463eb] text-white shadow-sm dark:border-[#60a5fa] dark:bg-[#2463eb]'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-[#2463eb] hover:bg-[#eff6ff] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-[#2463eb]/60 dark:hover:bg-[#1e3a8a]/40'
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <span className="mt-3 block text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
        Selected: {value != null && allowed.includes(value) ? `${value}/10` : '—'}
      </span>
      <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-xs font-medium text-slate-500 dark:border-slate-600 dark:text-slate-400">
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

function FivePointNumericWireframe({
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
      <div className="flex flex-wrap items-center gap-2 sm:gap-3" role="group" aria-label="Rating out of 5">
        {NUMERIC_5_TO_1.map((n) => {
          const isAllowed = allowed.includes(n);
          const isSelected = displayNum === n;
          return (
            <button
              key={n}
              type="button"
              disabled={inactive || !isAllowed}
              aria-label={`Rate ${n} out of 5`}
              aria-pressed={isSelected}
              onClick={() => onChange(n)}
              className={`flex min-h-[2.5rem] min-w-[2.5rem] items-center justify-center rounded-lg border-2 text-base font-bold tabular-nums transition-colors sm:min-h-[2.75rem] sm:min-w-[2.75rem] sm:text-lg ${
                inactive || !isAllowed
                  ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-600'
                  : isSelected
                    ? 'border-[#2463eb] bg-[#2463eb] text-white shadow-sm dark:border-[#60a5fa] dark:bg-[#2463eb]'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-[#2463eb] hover:bg-[#eff6ff] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-[#2463eb]/60 dark:hover:bg-[#1e3a8a]/40'
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <span className="mt-3 block text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
        Selected: {displayNum != null ? `${displayNum}/5` : '—'}
      </span>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tap a number to rate</p>
    </div>
  );
}

export function SelfAssessmentRatingPicker({
  title,
  compact,
  fivePointVariant = 'stars',
  ratingSystem,
  tenPointYesMinRating,
  yesNoAnswer,
  value,
  onChange,
  disabled = false,
}: SelfAssessmentRatingPickerProps) {
  const system: SelfAssessmentRatingSystem = ratingSystem === 'TEN_POINT' ? 'TEN_POINT' : 'FIVE_POINT';
  const allowed = getRatingOptions(system, yesNoAnswer, tenPointYesMinRating);
  const pickerDisabled = disabled || !yesNoAnswer;

  const body =
    system === 'TEN_POINT' ? (
      <TenPointScaleWireframe allowed={allowed} value={value} onChange={onChange} disabled={pickerDisabled} />
    ) : fivePointVariant === 'numeric' ? (
      <FivePointNumericWireframe allowed={allowed} value={value} onChange={onChange} disabled={pickerDisabled} />
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
