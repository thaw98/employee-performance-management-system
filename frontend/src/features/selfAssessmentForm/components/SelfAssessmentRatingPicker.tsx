import { Star } from 'lucide-react';
import type { SelfAssessmentRatingSystem } from '../api/selfAssessmentFormApi';
import { getRatingOptions, getRatingSystemMax } from '../ratingSystem';

export interface SelfAssessmentRatingPickerProps {
  title?: string;
  compact?: boolean;
  fivePointVariant?: 'stars' | 'numeric';
  ratingSystem: SelfAssessmentRatingSystem | null | undefined;
  tenPointYesMinRating?: number | null;
  fivePointYesMinRating?: number | null;
  includeYesNo?: boolean;
  yesMinRating?: number | null;
  yesNoAnswer: string | null | undefined;
  value: number | null | undefined;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

function NumericScaleWireframe({
  max,
  allowed,
  value,
  onChange,
  disabled,
}: {
  max: number;
  allowed: number[];
  value: number | null | undefined;
  onChange: (rating: number) => void;
  disabled: boolean;
}) {
  const inactive = disabled || allowed.length === 0;
  const values = Array.from({ length: max }, (_, i) => max - i);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-5 dark:border-slate-600 dark:bg-slate-900/40">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3" role="group" aria-label={`Rating out of ${max}`}>
        {values.map((n) => {
          const isAllowed = allowed.includes(n);
          const isSelected = value === n;
          return (
            <button
              key={n}
              type="button"
              disabled={inactive || !isAllowed}
              aria-label={`Rate ${n} out of ${max}`}
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
        Selected: {value != null && allowed.includes(value) ? `${value}/${max}` : '—'}
      </span>
      <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-xs font-medium text-slate-500 dark:border-slate-600 dark:text-slate-400">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}

function StarScaleWireframe({
  max,
  allowed,
  value,
  onChange,
  disabled,
}: {
  max: number;
  allowed: number[];
  value: number | null | undefined;
  onChange: (rating: number) => void;
  disabled: boolean;
}) {
  const inactive = disabled || allowed.length === 0;
  const displayNum = value != null && allowed.includes(value) ? value : null;
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-5 dark:border-slate-600 dark:bg-slate-900/40">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5" role="group" aria-label={`Rating out of ${max}`}>
          {stars.map((star) => {
            const isAllowed = allowed.includes(star);
            const filled = displayNum != null && star <= displayNum;
            return (
              <button
                key={star}
                type="button"
                disabled={inactive || !isAllowed}
                aria-label={`${star} out of ${max} stars`}
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
          ({displayNum != null ? `${displayNum}/${max}` : `—/${max}`})
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Tap to rate</p>
    </div>
  );
}

export function SelfAssessmentRatingPicker({
  title,
  compact,
  fivePointVariant = 'stars',
  ratingSystem: ratingSystemProp,
  tenPointYesMinRating,
  fivePointYesMinRating,
  includeYesNo = true,
  yesMinRating,
  yesNoAnswer,
  value,
  onChange,
  disabled = false,
}: SelfAssessmentRatingPickerProps) {
  const system: SelfAssessmentRatingSystem = ratingSystemProp && ['TWO_POINT', 'THREE_POINT', 'FOUR_POINT', 'FIVE_POINT', 'SIX_POINT', 'SEVEN_POINT', 'TEN_POINT'].includes(ratingSystemProp)
    ? ratingSystemProp
    : 'FIVE_POINT'
  const allowed = getRatingOptions(system, yesNoAnswer, tenPointYesMinRating, fivePointYesMinRating, includeYesNo, yesMinRating);
  const pickerDisabled = disabled || (includeYesNo && !yesNoAnswer);
  const max = getRatingSystemMax(system);

  const useStars = max === 5 && fivePointVariant === 'stars';
  const body = useStars ? (
    <StarScaleWireframe max={max} allowed={allowed} value={value} onChange={onChange} disabled={pickerDisabled} />
  ) : (
    <NumericScaleWireframe max={max} allowed={allowed} value={value} onChange={onChange} disabled={pickerDisabled} />
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
