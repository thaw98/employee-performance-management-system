import { CalendarRange, Clock, AlertCircle } from 'lucide-react';
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
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  }
  if (normalized === 'UPCOMING') {
    return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300';
  }
  return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
}

type SelfAssessmentReviewCycleInfoProps = {
  className?: string;
  variant?: 'card' | 'inline';
};

export function SelfAssessmentReviewCycleInfo({
  className,
  variant = 'card',
}: SelfAssessmentReviewCycleInfoProps) {
  const { data: activeCycles = [], isLoading: cyclesLoading } =
    useGetActiveReviewCyclesQuery();
  const { data: reviewCycles = [], isLoading: allCyclesLoading } =
    useGetReviewCyclesQuery({ requiresEmployeeSubmission: true });

  const activeSubmissionCycle =
    activeCycles.find((c) => c.requiresEmployeeSubmission) ?? null;
  const submissionCycle =
    activeSubmissionCycle ??
    reviewCycles.find((c) => c.status?.toUpperCase() === 'UPCOMING') ??
    [...reviewCycles]
      .reverse()
      .find((c) => c.status?.toUpperCase() === 'CLOSED') ??
    activeCycles[0] ??
    null;

  const isActive = submissionCycle?.status?.toUpperCase() === 'ACTIVE';
  const isUpcoming = submissionCycle?.status?.toUpperCase() === 'UPCOMING';

  const inner = (
    <div className="flex-1 min-w-0">
      {cyclesLoading || allCyclesLoading ? (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5D5FEF]/10 dark:bg-[#5D5FEF]/20">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5D5FEF]/30 border-t-[#5D5FEF]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Loading review cycle…
            </p>
          </div>
        </div>
      ) : submissionCycle ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          {/* Cycle icon + name */}
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md ${
                isActive
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20'
                  : isUpcoming
                    ? 'bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-500/20'
                    : 'bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-[#5D5FEF]/20'
              }`}
            >
              <CalendarRange className="h-4 w-4 text-white" aria-hidden />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {submissionCycle.name}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cycleStatusClass(submissionCycle.status)}`}
                >
                  {cycleStatusLabel(submissionCycle.status)}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {submissionCycle.yearLabel},{' '}
                {cycleTypeLabel(submissionCycle.cycleType)}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block sm:h-8 sm:w-px sm:shrink-0 sm:bg-gradient-to-b sm:from-transparent sm:via-slate-200 sm:to-transparent dark:sm:via-slate-700" />

          {/* Dates */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Clock size={13} className="shrink-0" />
            <span>
              {formatCycleDate(submissionCycle.startDate)} —{' '}
              {formatCycleDate(submissionCycle.endDate)}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <AlertCircle size={16} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No review cycle configured
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create cycles in System Settings to enable self-assessments.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  if (variant === 'inline') {
    return inner;
  }

  const outerClass = [
    'rounded-2xl border border-slate-200/60 bg-white px-5 py-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={outerClass}>{inner}</div>;
}
