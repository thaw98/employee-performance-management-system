import { useGetActiveReviewCyclesQuery, useGetReviewCyclesQuery } from '../../features/reviewCycle/api/reviewCycleApi';

export function formatCycleDate(iso: string) {
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return iso;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function cycleTypeLabel(type: string) {
  const t = type.replace(/_/g, ' ').toLowerCase();
  return t.replace(/\b\w/g, (c) => c.toUpperCase());
}

function cycleStatusLabel(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === 'ACTIVE') return 'Active';
  if (normalized === 'UPCOMING') return 'Upcoming';
  if (normalized === 'CLOSED') return 'Closed';
  return cycleTypeLabel(status);
}

function cycleStatusClass(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === 'ACTIVE') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
  }
  if (normalized === 'UPCOMING') {
    return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300';
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
}

type SelfAssessmentReviewCycleInfoProps = {
  className?: string;
  /** Use inside an existing card row (no outer border/background). */
  variant?: 'card' | 'inline';
};

/** Shows the current employee-submission review cycle (active when available; otherwise sensible fallbacks). */
export function SelfAssessmentReviewCycleInfo({ className, variant = 'card' }: SelfAssessmentReviewCycleInfoProps) {
  const { data: activeCycles = [], isLoading: cyclesLoading } = useGetActiveReviewCyclesQuery();
  const { data: reviewCycles = [], isLoading: allCyclesLoading } = useGetReviewCyclesQuery({
    requiresEmployeeSubmission: true,
  });

  const activeSubmissionCycle = activeCycles.find((c) => c.requiresEmployeeSubmission) ?? null;
  const submissionCycle =
    activeSubmissionCycle ??
    reviewCycles.find((c) => c.status?.toUpperCase() === 'UPCOMING') ??
    [...reviewCycles].reverse().find((c) => c.status?.toUpperCase() === 'CLOSED') ??
    activeCycles[0] ??
    null;

  const innerBase = 'flex-1 text-sm text-slate-700 dark:text-slate-200 sm:min-w-0';
  const innerClass =
    variant === 'inline' && className ? `${innerBase} ${className}`.trim() : innerBase;

  const inner = (
    <div className={innerClass}>
      <span className="font-semibold text-slate-900 dark:text-white">Current review cycle</span>
      <span className="mx-1.5 text-slate-400">·</span>
      {cyclesLoading || allCyclesLoading ? (
        <span className="text-slate-500">Loading…</span>
      ) : submissionCycle ? (
        <>
          <span className="text-slate-900 dark:text-white">{submissionCycle.name}</span>
          <span className="text-slate-500 dark:text-slate-400">
            {' '}
            ({submissionCycle.yearLabel}, {cycleTypeLabel(submissionCycle.cycleType)})
          </span>
          <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
            {formatCycleDate(submissionCycle.startDate)} – {formatCycleDate(submissionCycle.endDate)}
            {submissionCycle.status ? (
              <span
                className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${cycleStatusClass(
                  submissionCycle.status
                )}`}
              >
                {cycleStatusLabel(submissionCycle.status)}
              </span>
            ) : null}
          </span>
        </>
      ) : (
        <span className="text-slate-500">
          No active, upcoming, or closed submission cycle is available. Generate cycles in System Settings if needed.
        </span>
      )}
    </div>
  );

  if (variant === 'inline') {
    return inner;
  }

  const outerClass = [
    'rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-600 dark:bg-slate-800/50',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={outerClass}>{inner}</div>;
}
