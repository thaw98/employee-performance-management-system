import React, { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCcw, Save, Settings2 } from 'lucide-react';
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
  description: string;
  recommended?: boolean;
};

const ratingOptions: RatingOption[] = [
  {
    value: 'FIVE_POINT',
    title: '1-5 Scale (Standard)',
    description: 'Uses the standard five-point score range for new self-assessment templates.',
    recommended: true,
  },
  {
    value: 'TEN_POINT',
    title: '0-10 Scale (Detailed)',
    description: 'Uses the detailed ten-point score range for new self-assessment templates.',
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
  const { data, isLoading, isFetching, isError, error, refetch } = useGetSelfAssessmentSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSelfAssessmentSettingsMutation();
  const [ratingSystem, setRatingSystem] = useState<SelfAssessmentRatingSystem>('FIVE_POINT');

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
      toast.error(getErrorMessage(saveError, 'Failed to save self-assessment settings'));
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Settings2 size={22} aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Self Assessment Settings</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Rating settings apply to newly created templates.
            </p>
          </div>
        </div>
      </div>

      <SelfAssessmentReviewCycleInfo />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Global Rating Scale</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Existing assigned forms keep the rating system stored when they were created.
            </p>
          </div>
          {data?.ratingSystem ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 size={14} aria-hidden />
              Current default saved
            </span>
          ) : null}
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            Loading settings...
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-5 dark:border-red-900/50 dark:bg-red-950/30">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {getErrorMessage(error, 'Could not load self-assessment settings.')}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              <RefreshCcw size={16} aria-hidden />
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              {ratingOptions.map((option) => {
                const checked = ratingSystem === option.value;
                return (
                  <label
                    key={option.value}
                    className={`relative flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                      checked
                        ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/15 dark:border-emerald-500 dark:bg-emerald-950/25'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="ratingSystem"
                      value={option.value}
                      checked={checked}
                      onChange={() => setRatingSystem(option.value)}
                      className="mt-1 h-4 w-4 shrink-0 accent-emerald-600"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{option.title}</span>
                        {option.recommended ? (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                            Recommended
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{option.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isFetching || !isDirty}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={16} aria-hidden />
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
              {isDirty ? (
                <button
                  type="button"
                  onClick={() => data?.ratingSystem && setRatingSystem(data.ratingSystem)}
                  disabled={isSaving}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Reset
                </button>
              ) : null}
            </div>
          </>
        )}
      </section>
    </div>
  );
};
