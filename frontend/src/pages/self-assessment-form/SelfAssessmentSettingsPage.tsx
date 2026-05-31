import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  RefreshCcw,
  Save,
  Settings2,
  ChevronDown,
  Gauge,
  ShieldCheck,
  FileText,
  Sparkles,
  RotateCcw,
  Info,
  ArrowRight,
  CircleDot,
  Zap,
  BarChart3,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useGetSelfAssessmentSettingsQuery,
  useUpdateSelfAssessmentSettingsMutation,
  type SelfAssessmentRatingSystem,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { SelfAssessmentReviewCycleInfo } from './SelfAssessmentReviewCycleInfo';
import {
  getRatingOptions,
  RATING_SYSTEM_OPTIONS,
  getYesMinRatingOptions,
  getRatingSystemMax,
  getDefaultYesMinRating,
  normalizeYesMinRating,
} from '../../features/selfAssessmentForm/ratingSystem';

const SETTINGS_PRIMARY = '#2463eb';
const SETTINGS_PRIMARY_DARK = '#1d4ed8';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { message?: string } }).data;
    if (typeof data?.message === 'string') {
      return data.message;
    }
  }
  return fallback;
};

export const SelfAssessmentSettingsPage: React.FC = () => {
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetSelfAssessmentSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] =
    useUpdateSelfAssessmentSettingsMutation();
  const [ratingSystem, setRatingSystem] = useState<SelfAssessmentRatingSystem>(
    'FIVE_POINT',
  );
  const [tenPointYesMinRating, setTenPointYesMinRating] = useState(5);
  const [fivePointYesMinRating, setFivePointYesMinRating] = useState(3);
  const [yesMinRating, setYesMinRating] = useState<number | null>(null);
  const [includeYesNo, setIncludeYesNo] = useState(true);

  useEffect(() => {
    if (data?.ratingSystem) {
      setRatingSystem(data.ratingSystem);
      setTenPointYesMinRating(data.tenPointYesMinRating ?? 5);
      setFivePointYesMinRating(data.fivePointYesMinRating ?? 3);
      setYesMinRating(data.yesMinRating ?? null);
      setIncludeYesNo(data.includeYesNo ?? true);
    }
  }, [data?.ratingSystem, data?.tenPointYesMinRating, data?.fivePointYesMinRating, data?.yesMinRating, data?.includeYesNo]);

  const isRatingScaleEditable = data?.ratingSystemEditable ?? true;
  const ratingScaleLockReason =
    data?.ratingSystemLockReason ??
    'Templates already assigned to a deadline keep their existing rating scale.';

  const effectiveYesMinRating = yesMinRating != null
    ? normalizeYesMinRating(ratingSystem, yesMinRating)
    : getDefaultYesMinRating(ratingSystem);

  const isDirty =
    data?.ratingSystem != null &&
    (data.ratingSystem !== ratingSystem
      || (data.tenPointYesMinRating ?? 5) !== tenPointYesMinRating
      || (data.fivePointYesMinRating ?? 3) !== fivePointYesMinRating
      || ((data.yesMinRating ?? null) ?? getDefaultYesMinRating(data.ratingSystem)) !== effectiveYesMinRating
      || (data.includeYesNo ?? true) !== includeYesNo);

  const handleSave = async () => {
    try {
      await updateSettings({
        ratingSystem,
        tenPointYesMinRating,
        fivePointYesMinRating,
        yesMinRating: effectiveYesMinRating,
        includeYesNo,
      }).unwrap();
      toast.success('Self-assessment settings saved');
    } catch (saveError) {
      toast.error(
        getErrorMessage(saveError, 'Failed to save self-assessment settings'),
      );
    }
  };

  const infoCards = [
    {
      icon: ShieldCheck,
      label: 'Scope',
      value: 'New Templates Only',
      detail: 'Applies to templates created after saving',
      gradient: 'from-sky-500 to-blue-600',
      bgGlow: 'bg-sky-500/10',
      lightBg: 'bg-sky-50 dark:bg-sky-950/30',
      lightIcon: 'text-sky-600 dark:text-sky-400',
      ring: 'ring-sky-500/20',
    },
    {
      icon: FileText,
      label: 'Existing Forms',
      value: 'Unaffected',
      detail: 'Previously created forms keep their scale',
      gradient: 'from-amber-500 to-orange-600',
      bgGlow: 'bg-amber-500/10',
      lightBg: 'bg-amber-50 dark:bg-amber-950/30',
      lightIcon: 'text-amber-600 dark:text-amber-400',
      ring: 'ring-amber-500/20',
    },
    {
      icon: Zap,
      label: 'Effect',
      value: 'Immediate',
      detail: 'Changes take effect on next template creation',
      gradient: 'from-emerald-500 to-teal-600',
      bgGlow: 'bg-emerald-500/10',
      lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      lightIcon: 'text-emerald-600 dark:text-emerald-400',
      ring: 'ring-emerald-500/20',
    },
  ];

  return (
    <div className="min-h-screen px-6 py-6 md:px-8 animate-fade-in">
      {/* ─── Breadcrumb ─── */}
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <span className="text-[#2463eb] dark:text-[#60a5fa] font-medium">
          Home
        </span>
        <ChevronDown size={10} className="-rotate-90 opacity-50" />
        <span>Self Assessment</span>
        <ChevronDown size={10} className="-rotate-90 opacity-50" />
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          Settings
        </span>
      </nav>

      {/* ─── Header ─── */}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] shadow-lg shadow-[#2463eb]/25">
              <Settings2 size={22} className="text-white" />
            </div>
            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] text-[9px] font-bold text-white shadow-sm">
              <Sparkles size={10} />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Self Assessment Settings
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 max-w-lg">
              Configure global defaults for self-assessment templates. Rating
              settings apply to newly created templates only.
            </p>
          </div>
        </div>
        {data?.ratingSystem && !isDirty && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-sm">
              <CheckCircle2 size={14} aria-hidden />
              All changes saved
            </span>
          </div>
        )}
      </div>

      {/* ─── Review Cycle Info Banner ─── */}
      <div
        className="mb-6 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up"
        style={{ animationDelay: '60ms' }}
      >
        <div className="relative px-5 py-4">
          <div className="absolute inset-0 bg-gradient-to-r from-[#2463eb]/[0.03] via-transparent to-[#2463eb]/[0.03] dark:from-[#2463eb]/[0.05] dark:via-transparent dark:to-[#2463eb]/[0.05]" />
          <div className="relative">
            <SelfAssessmentReviewCycleInfo
              variant="inline"
              primaryColor={SETTINGS_PRIMARY}
              primaryColorDark={SETTINGS_PRIMARY_DARK}
            />
          </div>
        </div>
      </div>

      {/* ─── Info Cards ─── */}
      <div
        className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 animate-fade-in-up"
        style={{ animationDelay: '120ms' }}
      >
        {infoCards.map((card) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700/60 dark:bg-slate-800/80"
          >
            <div
              className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${card.bgGlow} blur-2xl transition-all duration-500 group-hover:scale-150`}
            />
            <div className="relative flex items-start gap-3.5">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.lightBg} ring-1 ${card.ring}`}
              >
                <card.icon size={18} className={card.lightIcon} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {card.label}
                </p>
                <p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                  {card.value}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {card.detail}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Rating Scale Selection Card ─── */}
      <div
        className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up"
        style={{ animationDelay: '180ms' }}
      >
        {/* Card Header */}
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-700/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700/60">
              <Gauge size={18} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Global Rating Scale
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Choose the default rating system for new self-assessment
                templates
              </p>
            </div>
          </div>
          {isDirty && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300">
              <CircleDot size={12} className="animate-pulse" />
              Unsaved changes
            </span>
          )}
        </div>

        {/* Card Body */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-slate-50/80 px-5 py-8 dark:border-slate-700/60 dark:bg-slate-900/30">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2463eb] border-t-transparent" />
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Loading settings…
                </p>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  Fetching your current configuration
                </p>
              </div>
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-6 dark:border-red-900/50 dark:bg-red-950/30">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40">
                  <RefreshCcw size={16} className="text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-800 dark:text-red-200">
                    Failed to load settings
                  </p>
                  <p className="mt-0.5 text-xs text-red-600/80 dark:text-red-300/80">
                    {getErrorMessage(
                      error,
                      'Could not load self-assessment settings.',
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 transition dark:border-red-900/50 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40"
                  >
                    <RefreshCcw size={14} aria-hidden />
                    Retry
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Global Rating Scale Dropdown */}
              <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/20">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <label
                      htmlFor="globalRatingScale"
                      className="text-sm font-bold text-slate-900 dark:text-white"
                    >
                      Global Rating Scale
                    </label>
                    <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      Select the rating scale used for new self-assessment templates.
                    </p>
                  </div>
                  <select
                    id="globalRatingScale"
                    value={ratingSystem}
                    onChange={(event) => setRatingSystem(event.target.value as SelfAssessmentRatingSystem)}
                    disabled={!isRatingScaleEditable || isSaving}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition focus:border-[#2463eb] focus:outline-none focus:ring-2 focus:ring-[#2463eb]/20 disabled:cursor-not-allowed disabled:opacity-60 md:w-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {RATING_SYSTEM_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Current selection info */}
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <BarChart3 size={14} className="text-[#2463eb]" />
                  <span>
                    {getRatingSystemMax(ratingSystem)}-point scale · Ratings from 1 to {getRatingSystemMax(ratingSystem)}
                  </span>
                </div>
              </div>

              {/* Tip banner */}
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200/60 bg-slate-50/80 px-4 py-3.5 dark:border-slate-700/40 dark:bg-slate-800/40">
                <Info
                  size={16}
                  className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500"
                />
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    Note:
                  </span>{' '}
                  Changing the global rating scale updates unassigned templates
                  in the active review cycle to stay consistent. Templates
                  already assigned to a deadline keep their existing scale.
                </p>
              </div>
              {!isRatingScaleEditable && (
                <div className="mt-3 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 dark:border-amber-800/50 dark:bg-amber-950/30">
                  <Info
                    size={16}
                    className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                  />
                  <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                    {ratingScaleLockReason}
                  </p>
                </div>
              )}

              {/* Include Yes/No Toggle */}
              <div className="mt-6 rounded-xl border border-slate-200/60 bg-white px-4 py-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/20">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <label className="text-sm font-bold text-slate-900 dark:text-white">
                      Include Yes/No Responses
                    </label>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      When enabled, employees first answer "Yes" or "No" for each question before selecting a rating.
                      When disabled, only the numeric rating scale is used. This setting applies to new templates and
                      unassigned active-cycle templates only.
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={includeYesNo}
                      onChange={(e) => setIncludeYesNo(e.target.checked)}
                      disabled={isSaving}
                      className="peer sr-only"
                    />
                    <div className="h-7 w-12 rounded-full bg-slate-300 after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition-all after:content-[''] peer-checked:bg-[#2463eb] peer-checked:after:translate-x-full peer-disabled:opacity-60 dark:bg-slate-600 dark:peer-checked:bg-[#60a5fa]" />
                    <span className="ml-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {includeYesNo ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Yes Threshold - generic, shown only when includeYesNo is enabled */}
              {includeYesNo && (
                <div className="mt-5 rounded-xl border border-slate-200/60 bg-white px-4 py-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/20">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <label
                        htmlFor="yesMinRating"
                        className="text-sm font-bold text-slate-900 dark:text-white"
                      >
                        Yes Threshold
                      </label>
                      <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        Choose the lowest rating that counts as Yes. Ratings below it count as No.
                      </p>
                    </div>
                    <select
                      id="yesMinRating"
                      value={effectiveYesMinRating}
                      onChange={(event) => setYesMinRating(Number(event.target.value))}
                      disabled={!isRatingScaleEditable || isSaving}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition focus:border-[#2463eb] focus:outline-none focus:ring-2 focus:ring-[#2463eb]/20 disabled:cursor-not-allowed disabled:opacity-60 md:w-52 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    >
                      {getYesMinRatingOptions(ratingSystem).map((rating) => (
                        <option key={rating} value={rating}>
                          {rating} and above
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/80 px-3 py-2 dark:border-emerald-800/40 dark:bg-emerald-950/20">
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Yes scores
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-800 dark:text-emerald-200">
                        {getRatingOptions(ratingSystem, 'Yes', tenPointYesMinRating, fivePointYesMinRating, true, effectiveYesMinRating).join(', ')}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-rose-200/60 bg-rose-50/80 px-3 py-2 dark:border-rose-800/40 dark:bg-rose-950/20">
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        No scores
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-rose-800 dark:text-rose-200">
                        {getRatingOptions(ratingSystem, 'No', tenPointYesMinRating, fivePointYesMinRating, true, effectiveYesMinRating).join(', ')}
                      </dd>
                    </div>
                  </div>
                </div>
              )}

              {/* Rating scale preview when Yes/No is disabled */}
              {!includeYesNo && (
                <div className="mt-5 rounded-xl border border-slate-200/60 bg-white px-4 py-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/20">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Rating scale preview</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Employees select one score from the full 1–{getRatingSystemMax(ratingSystem)} scale. Yes/No is not used.
                  </p>
                  <div className="mt-4 rounded-lg border border-slate-200/60 bg-slate-50/80 px-3 py-2 dark:border-slate-700/40 dark:bg-slate-800/40">
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Available scores
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                      {getRatingOptions(ratingSystem, null, tenPointYesMinRating, fivePointYesMinRating, false, effectiveYesMinRating).join(', ')}
                    </dd>
                  </div>
                </div>
              )}

              {/* Action bar */}
              <div
                className={`mt-6 flex flex-wrap items-center gap-3 rounded-xl border px-5 py-4 transition-all duration-300 ${
                  isDirty
                    ? 'border-[#2463eb]/20 bg-gradient-to-r from-[#2463eb]/[0.03] to-transparent dark:border-[#2463eb]/30 dark:from-[#2463eb]/[0.06]'
                    : 'border-slate-200/60 bg-slate-50/50 dark:border-slate-700/40 dark:bg-slate-800/30'
                }`}
              >
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isFetching || !isDirty}
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#2463eb]/25 transition-all hover:shadow-xl hover:shadow-[#2463eb]/30 hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:brightness-100"
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save size={16} strokeWidth={2.5} />
                      Save Settings
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>
                {isDirty && (
                  <button
                    type="button"
                    onClick={() =>
                      data?.ratingSystem && (
                        setRatingSystem(data.ratingSystem),
                        setTenPointYesMinRating(data.tenPointYesMinRating ?? 5),
                        setFivePointYesMinRating(data.fivePointYesMinRating ?? 3),
                        setYesMinRating(data.yesMinRating ?? null),
                        setIncludeYesNo(data.includeYesNo ?? true)
                      )
                    }
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <RotateCcw size={14} />
                    Reset
                  </button>
                )}
                {isDirty && (
                  <span className="ml-auto text-xs font-medium text-amber-600 dark:text-amber-400">
                    You have unsaved changes
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
