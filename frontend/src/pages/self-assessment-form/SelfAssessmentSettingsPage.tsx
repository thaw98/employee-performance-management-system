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

type RatingOption = {
  value: SelfAssessmentRatingSystem;
  title: string;
  subtitle: string;
  description: string;
  recommended?: boolean;
  icon: React.ElementType;
  gradient: string;
  lightBg: string;
  lightIcon: string;
  ring: string;
  features: string[];
};

const ratingOptions: RatingOption[] = [
  {
    value: 'FIVE_POINT',
    title: 'Standard Scale',
    subtitle: '1 – 5 Rating',
    description:
      'A streamlined five-point rating system ideal for quick, focused evaluations. Best suited for organizations that prefer simplicity and speed.',
    recommended: true,
    icon: Gauge,
    gradient: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    lightIcon: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-500/20',
    features: [
      'Faster to complete',
      'Clear tier differentiation',
      'Industry standard',
    ],
  },
  {
    value: 'TEN_POINT',
    title: 'Detailed Scale',
    subtitle: '1 – 10 Rating',
    description:
      'A granular ten-point scale that provides deeper insight into performance nuances. Ideal for detailed reviews requiring finer score distinctions.',
    icon: BarChart3,
    gradient: 'from-violet-500 to-purple-600',
    lightBg: 'bg-violet-50 dark:bg-violet-950/30',
    lightIcon: 'text-violet-600 dark:text-violet-400',
    ring: 'ring-violet-500/20',
    features: [
      'Greater score precision',
      'Nuanced feedback',
      'Advanced analytics',
    ],
  },
];

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

  useEffect(() => {
    if (data?.ratingSystem) {
      setRatingSystem(data.ratingSystem);
    }
  }, [data?.ratingSystem]);

  const isDirty = data?.ratingSystem != null && data.ratingSystem !== ratingSystem;

  const handleSave = async () => {
    try {
      await updateSettings({ ratingSystem }).unwrap();
      toast.success('Self-assessment settings saved');
    } catch (saveError) {
      toast.error(
        getErrorMessage(saveError, 'Failed to save self-assessment settings'),
      );
    }
  };

  const selectedOption = ratingOptions.find((o) => o.value === ratingSystem)!;

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
        <span className="text-[#5D5FEF] dark:text-[#8b8ef7] font-medium">
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/25">
              <Settings2 size={22} className="text-white" />
            </div>
            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-[9px] font-bold text-white shadow-sm">
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
          <div className="absolute inset-0 bg-gradient-to-r from-[#5D5FEF]/[0.03] via-transparent to-[#5D5FEF]/[0.03] dark:from-[#5D5FEF]/[0.05] dark:via-transparent dark:to-[#5D5FEF]/[0.05]" />
          <div className="relative">
            <SelfAssessmentReviewCycleInfo variant="inline" />
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
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#5D5FEF] border-t-transparent" />
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
              {/* Rating Option Cards */}
              <div className="grid gap-5 md:grid-cols-2">
                {ratingOptions.map((option) => {
                  const checked = ratingSystem === option.value;
                  const Icon = option.icon;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => setRatingSystem(option.value)}
                      className={`group relative overflow-hidden rounded-2xl border-2 p-0 text-left transition-all duration-300 ${
                        checked
                          ? 'border-[#5D5FEF] bg-gradient-to-br from-[#5D5FEF]/[0.03] to-[#7C7EF5]/[0.01] shadow-lg shadow-[#5D5FEF]/10 dark:border-[#5D5FEF] dark:from-[#5D5FEF]/10 dark:to-[#7C7EF5]/5 dark:shadow-[#5D5FEF]/5'
                          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-800/60 dark:hover:border-slate-600'
                      }`}
                    >
                      {/* Selection indicator glow */}
                      {checked && (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#5D5FEF]/[0.05] to-transparent dark:from-[#5D5FEF]/[0.10]" />
                      )}

                      <div className="relative p-5">
                        {/* Top row: icon + title + badge */}
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                              checked
                                ? 'bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/25'
                                : `${option.lightBg} ring-1 ${option.ring}`
                            }`}
                          >
                            <Icon
                              size={20}
                              className={`transition-colors ${
                                checked ? 'text-white' : option.lightIcon
                              }`}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                {option.title}
                              </h3>
                              {option.recommended && (
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    checked
                                      ? 'bg-[#5D5FEF]/15 text-[#5D5FEF] dark:bg-[#5D5FEF]/25 dark:text-[#8b8ef7]'
                                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                  }`}
                                >
                                  <Sparkles size={9} />
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                              {option.subtitle}
                            </p>
                          </div>
                          {/* Radio circle */}
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                              checked
                                ? 'border-[#5D5FEF] bg-[#5D5FEF] dark:border-[#8b8ef7] dark:bg-[#8b8ef7]'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {checked && (
                              <div className="h-2.5 w-2.5 rounded-full bg-white" />
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="mt-3.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                          {option.description}
                        </p>

                        {/* Features list */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {option.features.map((feature) => (
                            <span
                              key={feature}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                checked
                                  ? 'bg-[#5D5FEF]/10 text-[#5D5FEF] dark:bg-[#5D5FEF]/20 dark:text-[#8b8ef7]'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300'
                              }`}
                            >
                              <CheckCircle2 size={11} />
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
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
                  Existing assigned forms retain the rating system that was
                  active when they were created. This setting only affects new
                  templates going forward.
                </p>
              </div>

              {/* Action bar */}
              <div
                className={`mt-6 flex flex-wrap items-center gap-3 rounded-xl border px-5 py-4 transition-all duration-300 ${
                  isDirty
                    ? 'border-[#5D5FEF]/20 bg-gradient-to-r from-[#5D5FEF]/[0.03] to-transparent dark:border-[#5D5FEF]/30 dark:from-[#5D5FEF]/[0.06]'
                    : 'border-slate-200/60 bg-slate-50/50 dark:border-slate-700/40 dark:bg-slate-800/30'
                }`}
              >
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isFetching || !isDirty}
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#5D5FEF] to-[#7C7EF5] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#5D5FEF]/25 transition-all hover:shadow-xl hover:shadow-[#5D5FEF]/30 hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:brightness-100"
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
                      data?.ratingSystem && setRatingSystem(data.ratingSystem)
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
