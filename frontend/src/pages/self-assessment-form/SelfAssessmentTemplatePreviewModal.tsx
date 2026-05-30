import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import type { SelfAssessmentRatingSystem } from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { getRatingOptions, ratingSystemLabels } from '../../features/selfAssessmentForm/ratingSystem';

export interface SelfAssessmentTemplatePreviewQuestion {
  questionText: string;
}

interface SelfAssessmentTemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  departmentLabel?: string | null;
  positionLabel?: string | null;
  audienceLabels?: string[];
  reviewCycleLabel?: string | null;
  reviewCycleDetail?: string | null;
  ratingSystem?: SelfAssessmentRatingSystem | null;
  tenPointYesMinRating?: number | null;
  fivePointYesMinRating?: number | null;
  questions: SelfAssessmentTemplatePreviewQuestion[];
}

export const SelfAssessmentTemplatePreviewModal: React.FC<SelfAssessmentTemplatePreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  departmentLabel,
  positionLabel,
  audienceLabels = [],
  reviewCycleLabel,
  reviewCycleDetail,
  ratingSystem,
  tenPointYesMinRating,
  fivePointYesMinRating,
  questions,
}) => {
  const visibleQuestions = useMemo(
    () => questions.map((question) => question.questionText.trim()).filter(Boolean),
    [questions],
  );
  const normalizedRatingSystem = ratingSystem === 'TEN_POINT' ? 'TEN_POINT' : 'FIVE_POINT';
  const yesRatings = getRatingOptions(normalizedRatingSystem, 'Yes', tenPointYesMinRating, fivePointYesMinRating);
  const noRatings = getRatingOptions(normalizedRatingSystem, 'No', tenPointYesMinRating, fivePointYesMinRating);
  const displayTitle = title.trim() || 'Untitled Template';
  const displayAudience = audienceLabels.filter((label) => label.trim());

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="self-assessment-template-preview-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-700">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#2463eb] dark:text-[#60a5fa]">
              Self-Assessment Preview
            </p>
            <h2
              id="self-assessment-template-preview-title"
              className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white"
            >
              {displayTitle}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              {departmentLabel ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {departmentLabel}
                </span>
              ) : null}
              {positionLabel ? (
                <span className="rounded-full bg-[#2463eb]/10 px-3 py-1 text-[#2463eb] dark:bg-[#2463eb]/20 dark:text-[#60a5fa]">
                  {positionLabel}
                </span>
              ) : null}
              {reviewCycleLabel ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {reviewCycleLabel}
                </span>
              ) : null}
            </div>
            {reviewCycleDetail ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{reviewCycleDetail}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/30">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Rating System
              </p>
              <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                {ratingSystemLabels[normalizedRatingSystem]}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 dark:border-emerald-800/40 dark:bg-emerald-950/20">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Yes Scores
              </p>
              <p className="mt-1 text-sm font-bold tabular-nums text-emerald-800 dark:text-emerald-200">
                {yesRatings.join(', ')}
              </p>
            </div>
            <div className="rounded-xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 dark:border-rose-800/40 dark:bg-rose-950/20">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                No Scores
              </p>
              <p className="mt-1 text-sm font-bold tabular-nums text-rose-800 dark:text-rose-200">
                {noRatings.join(', ')}
              </p>
            </div>
          </div>

          {displayAudience.length > 0 ? (
            <div className="mb-5 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900/20">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Audience
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {displayAudience.map((label, index) => (
                  <span
                    key={`${label}-${index}`}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {visibleQuestions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center dark:border-slate-600 dark:bg-slate-900/30">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                No questions to preview yet
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Add at least one question and it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleQuestions.map((questionText, index) => (
                <section
                  key={`${questionText}-${index}`}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/30"
                >
                  <div className="flex items-start gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/60">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#2463eb] text-sm font-bold text-white shadow-sm">
                      {index + 1}
                    </span>
                    <p className="pt-1 text-sm font-semibold leading-relaxed text-slate-900 dark:text-white">
                      {questionText}
                    </p>
                  </div>
                  <div className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_1fr]">
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Answer
                      </p>
                      <div className="flex gap-2">
                        {['Yes', 'No'].map((answer) => (
                          <label
                            key={answer}
                            className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500"
                          >
                            <input type="radio" disabled className="h-4 w-4" />
                            {answer}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Rating
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {[...yesRatings, ...noRatings].map((rating) => (
                          <span
                            key={rating}
                            className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-bold tabular-nums text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500"
                          >
                            {rating}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Remarks
                      </p>
                      <textarea
                        disabled
                        rows={2}
                        placeholder="Employee remarks will appear here"
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm text-slate-500 placeholder:text-slate-400 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
