import React, { useState, useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import {
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Send,
  Save,
  X,
  ArrowRight,
  Calendar,
  BarChart3,
  FolderOpen,
  Lock,
  MessageSquare,
} from 'lucide-react';
import {
  useGetMyFormStatusQuery,
  useGetMyCurrentFormQuery,
  useSaveDraftMutation,
  useSubmitFormMutation,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { isRatingValidForAnswer } from '../../features/selfAssessmentForm/ratingSystem';
import { SelfAssessmentRatingPicker } from '../../features/selfAssessmentForm/components/SelfAssessmentRatingPicker';
import { formatDateDayMonthYear } from '../../utils/dateUtils';

interface AnswerFormData {
  answers: {
    id: number;
    yesNoAnswer: string | null;
    rating: number | null;
    remarks: string | null;
  }[];
  employeeRemarks: string | null;
}

function StatusBadge({ status }: { status: string | undefined | null }) {
  if (!status) return null;

  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    DRAFT: {
      bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-400',
      icon: <FolderOpen size={14} />,
    },
    SUBMITTED: {
      bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-400',
      icon: <Send size={14} />,
    },
    APPROVED: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-400',
      icon: <CheckCircle2 size={14} />,
    },
    REOPENED: {
      bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
      text: 'text-purple-700 dark:text-purple-400',
      icon: <ArrowRight size={14} />,
    },
    NOT_SUBMITTED: {
      bg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      text: 'text-slate-600 dark:text-slate-400',
      icon: <Clock size={14} />,
    },
  };

  const c = config[status] ?? {
    bg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    text: 'text-slate-600 dark:text-slate-400',
    icon: <FileText size={14} />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${c.bg} ${c.text}`}
    >
      {c.icon}
      {status.replace('_', ' ')}
    </span>
  );
}

function InfoCard({
  icon,
  label,
  value,
  className = '',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60 ${className}`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
}

function StateCard({
  icon,
  title,
  message,
  variant = 'neutral',
}: {
  icon: React.ReactNode;
  title: string;
  message?: string | null;
  variant?: 'neutral' | 'warning';
}) {
  const styles =
    variant === 'warning'
      ? 'bg-amber-50 dark:bg-amber-900/15 border-amber-200 dark:border-amber-800'
      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700';

  const iconWrap =
    variant === 'warning'
      ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
      : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400';

  const titleColor =
    variant === 'warning'
      ? 'text-amber-900 dark:text-amber-100'
      : 'text-slate-700 dark:text-slate-200';

  const msgColor =
    variant === 'warning'
      ? 'text-amber-700 dark:text-amber-300'
      : 'text-slate-500 dark:text-slate-400';

  return (
    <div className="flex min-h-[320px] items-center justify-center p-6">
      <div className={`w-full max-w-md rounded-2xl border p-10 text-center ${styles}`}>
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${iconWrap}`}
        >
          {icon}
        </div>
        <h2 className={`text-lg font-bold ${titleColor}`}>{title}</h2>
        {message && (
          <p className={`mt-2 text-sm leading-relaxed ${msgColor}`}>{message}</p>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Progress
        </span>
        <span className="text-xs font-bold tabular-nums text-slate-800 dark:text-slate-200">
          {current}/{total} answered
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function YesNoToggle({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200 p-1 dark:border-slate-600">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('Yes')}
        className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
          value === 'Yes'
            ? 'bg-emerald-600 text-white shadow-sm'
            : disabled
              ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('No')}
        className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
          value === 'No'
            ? 'bg-rose-600 text-white shadow-sm'
            : disabled
              ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
        }`}
      >
        No
      </button>
    </div>
  );
}

export const MySelfAssessmentFormPage: React.FC = () => {
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const { data: formStatus, isLoading: statusLoading } = useGetMyFormStatusQuery();
  const shouldLoadForm = Boolean(
    formStatus?.isEligible && formStatus?.hasActiveTemplate && formStatus?.status !== 'NOT_ASSIGNED',
  );
  const { data: formData, isLoading: formLoading, refetch } = useGetMyCurrentFormQuery(undefined, {
    skip: !shouldLoadForm,
  });

  const [saveDraft, { isLoading: isSaving }] = useSaveDraftMutation();
  const [submitForm, { isLoading: isSubmitting }] = useSubmitFormMutation();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isDirty },
  } = useForm<AnswerFormData>({
    defaultValues: {
      answers: [],
      employeeRemarks: '',
    },
  });

  useEffect(() => {
    if (formData?.answers) {
      reset({
        answers: formData.answers.map((a) => ({
          id: a.id,
          yesNoAnswer: a.yesNoAnswer,
          rating: a.rating,
          remarks: a.remarks || '',
        })),
        employeeRemarks: formData.employeeRemarks || '',
      });
    }
  }, [formData, reset]);

  const watchAnswers = watch('answers');
  const ratingSystem = formData?.ratingSystem ?? 'FIVE_POINT';

  const answeredCount = useMemo(() => {
    if (!watchAnswers) return 0;
    return watchAnswers.filter((a) => a.yesNoAnswer === 'Yes' || a.yesNoAnswer === 'No').length;
  }, [watchAnswers]);

  const totalCount = formData?.answers?.length ?? 0;

  const handleYesNoChange = (index: number, value: string, currentRating: number | null) => {
    setValue(`answers.${index}.yesNoAnswer`, value);
    if (isRatingValidForAnswer(ratingSystem, value, currentRating)) {
      setValue(`answers.${index}.rating`, currentRating);
    } else {
      setValue(`answers.${index}.rating`, null as any);
    }
  };

  const onSaveDraft = async (data: AnswerFormData) => {
    try {
      await saveDraft({
        answers: data.answers.map((a) => ({
          id: a.id,
          yesNoAnswer: a.yesNoAnswer,
          rating: a.rating,
          remarks: a.remarks,
        })),
        employeeRemarks: data.employeeRemarks,
        overallRemarks: formData?.overallRemarks ?? null,
      }).unwrap();
      toast.success('Draft saved successfully');
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to save draft');
    }
  };

  const onSubmitForm = async (data: AnswerFormData) => {
    try {
      await submitForm({
        answers: data.answers.map((a) => ({
          id: a.id,
          yesNoAnswer: a.yesNoAnswer,
          rating: a.rating,
          remarks: a.remarks,
        })),
        employeeRemarks: data.employeeRemarks,
        overallRemarks: formData?.overallRemarks ?? null,
      }).unwrap();
      toast.success('Form submitted successfully');
      setShowSubmitConfirm(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to submit form');
    }
  };

  if (statusLoading || formLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-emerald-200 border-t-emerald-600" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading form…</p>
        </div>
      </div>
    );
  }

  if (!formStatus?.isEligible) {
    return <StateCard variant="warning" icon={<AlertTriangle size={28} />} title="Not Eligible" message={formStatus?.message} />;
  }

  if (formStatus?.deadlinePassed && formStatus?.status !== 'REOPENED') {
    return (
      <StateCard
        icon={<Clock size={28} />}
        title="Deadline Passed"
        message={
          formStatus?.status === 'NOT_SUBMITTED'
            ? 'Your draft was marked as not submitted because the deadline has passed.'
            : 'The deadline for this self-assessment cycle has passed.'
        }
      />
    );
  }

  if (!formStatus?.hasActiveTemplate) {
    return <StateCard icon={<FileText size={28} />} title="No Form Available" message={formStatus?.message} />;
  }

  if (formStatus?.status === 'NOT_ASSIGNED') {
    return <StateCard icon={<FileText size={28} />} title="No Assigned Form" message={formStatus?.message} />;
  }

  const isReadOnly = formData?.status !== 'DRAFT' && formData?.status !== 'REOPENED';

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-28">
      {/* ───── Header ───── */}
      <div className="space-y-5">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                My Self Assessment
              </h1>
              {formData?.title && (
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {formData.title}
                </p>
              )}
            </div>
            <StatusBadge status={formData?.status} />
          </div>
        </div>

        {/* ───── Metadata Grid ───── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {formData?.cycleName && (
            <InfoCard icon={<FolderOpen size={16} />} label="Cycle" value={formData.cycleName} />
          )}
          {formData?.deadlineDate && (
            <InfoCard
              icon={<Calendar size={16} />}
              label="Deadline"
              value={formatDateDayMonthYear(formData.deadlineDate)}
            />
          )}
          {formData?.assessmentDate && (
            <InfoCard
              icon={<Clock size={16} />}
              label="Assessment Date"
              value={formatDateDayMonthYear(formData.assessmentDate)}
            />
          )}
          {formData?.totalScore != null && (
            <InfoCard
              icon={<BarChart3 size={16} />}
              label="Score"
              value={`${formData.totalScore.toFixed(1)}% · ${formData.ratingCategory}`}
            />
          )}
        </div>

        {/* ───── Progress ───── */}
        {totalCount > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60">
            <ProgressBar current={answeredCount} total={totalCount} />
          </div>
        )}

        {/* ───── Read-only Banner ───── */}
        {isReadOnly && (
          <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3.5 dark:border-blue-800 dark:bg-blue-900/15">
            <Lock size={18} className="shrink-0 text-blue-500" />
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              This form is read-only. You cannot make changes in its current status.
            </p>
          </div>
        )}
      </div>

      {/* ───── Questions ───── */}
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <div className="space-y-5">
          {formData?.answers &&
            formData.answers.map((answer, index) => (
              <div
                key={answer.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/60"
              >
                {/* Question header */}
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-3.5 dark:border-slate-700 dark:bg-slate-800/40">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold leading-snug text-slate-800 dark:text-slate-200">
                    {answer.questionText}
                  </p>
                </div>

                {/* Question body */}
                <div className="space-y-5 px-6 py-5">
                  {/* Yes / No */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Response
                    </label>
                    <YesNoToggle
                      value={watchAnswers?.[index]?.yesNoAnswer}
                      onChange={(v) => handleYesNoChange(index, v, watchAnswers?.[index]?.rating)}
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Rating
                    </label>
                    <Controller
                      name={`answers.${index}.rating`}
                      control={control}
                      render={({ field }) => (
                        <SelfAssessmentRatingPicker
                          title={answer.questionText}
                          fivePointVariant="numeric"
                          ratingSystem={ratingSystem}
                          yesNoAnswer={watchAnswers?.[index]?.yesNoAnswer}
                          value={field.value}
                          onChange={(rating) => {
                            const yn = watchAnswers?.[index]?.yesNoAnswer ?? null;
                            if (!isRatingValidForAnswer(ratingSystem, yn, rating)) {
                              toast.error('Rating does not match the selected response');
                              return;
                            }
                            field.onChange(rating);
                          }}
                          disabled={isReadOnly}
                        />
                      )}
                    />
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <MessageSquare size={12} />
                      Remarks <span className="font-normal normal-case tracking-normal">(optional)</span>
                    </label>
                    <textarea
                      {...register(`answers.${index}.remarks` as const)}
                      disabled={isReadOnly}
                      rows={2}
                      placeholder="Add any remarks for this question…"
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/40"
                    />
                  </div>
                </div>

                {/* Manager Proposed Adjustment */}
                {answer.managerProposedYesNo && (
                  <div className="border-t border-amber-200 bg-amber-50/60 px-6 py-4 dark:border-amber-800 dark:bg-amber-900/10">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Manager Proposed Adjustment
                    </p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800/60">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Original
                        </span>
                        <p className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {answer.yesNoAnswer}{' '}
                          <span className="text-slate-400 dark:text-slate-500">({answer.rating})</span>
                        </p>
                      </div>
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-900/20">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          Proposed
                        </span>
                        <p className="mt-0.5 text-sm font-semibold text-amber-700 dark:text-amber-300">
                          {answer.managerProposedYesNo}{' '}
                          <span className="text-amber-400 dark:text-amber-500">
                            ({answer.managerProposedRating})
                          </span>
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800/60">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Comment
                        </span>
                        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                          {answer.managerProposedComment || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

          {/* ───── Additional Remarks ───── */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/60">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-3.5 dark:border-slate-700 dark:bg-slate-800/40">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-sm font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                <MessageSquare size={16} />
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Additional Remarks
              </p>
            </div>
            <div className="px-6 py-5">
              <textarea
                {...register('employeeRemarks')}
                disabled={isReadOnly}
                rows={4}
                placeholder="Share any additional thoughts, context, or feedback you'd like to include…"
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/40"
              />
            </div>
          </div>
        </div>

        {/* ───── Sticky Action Bar ───── */}
        {!isReadOnly && (
          <div className="fixed bottom-0 left-64 right-0 z-40 border-t border-slate-200 bg-white/80 backdrop-blur-lg dark:border-slate-700 dark:bg-slate-900/80">
            <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3.5">
              <div className="hidden sm:block">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isDirty ? (
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      You have unsaved changes
                    </span>
                  ) : (
                    'All changes saved'
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSubmit(onSaveDraft)}
                  disabled={isSaving || !isDirty}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Save size={15} />
                  {isSaving ? 'Saving…' : 'Save Draft'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md disabled:opacity-50"
                >
                  <Send size={15} />
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* ───── Confirmation Modal ───── */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <Send size={18} className="text-emerald-700 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Submission</h3>
              </div>
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Are you ready to submit your completed self-assessment?
              </p>
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/15">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Your assessment will be shared with your manager and you will not be able to make any
                  changes.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/50">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit(onSubmitForm)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700"
              >
                <CheckCircle2 size={16} />
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
