import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useRhfAutosave, withRetry, type SaveResult, type Transport } from 'react-hook-form-autosave';
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
  Building2,
  Briefcase,
  Lock,
  MessageSquare,
  ClipboardCheck,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Scale,
} from 'lucide-react';
import {
  useGetMyFormStatusQuery,
  useGetMyCurrentFormQuery,
  useSaveDraftMutation,
  useSubmitFormMutation,
  useEmployeeAcknowledgeMutation,
  useEmployeeDisputeMutation,
  type SaveDraftRequest,
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

const toSaveDraftRequest = (
  data: AnswerFormData,
  overallRemarks: string | null | undefined,
): SaveDraftRequest => ({
  answers: data.answers.map((a) => ({
    id: a.id,
    yesNoAnswer: a.yesNoAnswer,
    rating: a.rating,
    remarks: a.remarks,
  })),
  employeeRemarks: data.employeeRemarks,
  overallRemarks: overallRemarks ?? null,
});

function StatusBadge({ status }: { status: string | undefined | null }) {
  if (!status) return null;

  const config: Record<string, { bg: string; text: string; dot: string; icon: React.ReactNode }> = {
    DRAFT: {
      bg: 'bg-amber-50 ring-amber-200 dark:bg-amber-900/20 dark:ring-amber-800/60',
      text: 'text-amber-800 dark:text-amber-300',
      dot: 'bg-amber-500',
      icon: <FolderOpen size={13} />,
    },
    SUBMITTED: {
      bg: 'bg-sky-50 ring-sky-200 dark:bg-sky-900/20 dark:ring-sky-800/60',
      text: 'text-sky-800 dark:text-sky-300',
      dot: 'bg-sky-500',
      icon: <Send size={13} />,
    },
    PENDING_MANAGER_REVIEW: {
      bg: 'bg-sky-50 ring-sky-200 dark:bg-sky-900/20 dark:ring-sky-800/60',
      text: 'text-sky-800 dark:text-sky-300',
      dot: 'bg-sky-500',
      icon: <Send size={13} />,
    },
    PENDING_EMPLOYEE_REVIEW: {
      bg: 'bg-amber-50 ring-amber-200 dark:bg-amber-900/20 dark:ring-amber-800/60',
      text: 'text-amber-800 dark:text-amber-300',
      dot: 'bg-amber-500',
      icon: <Scale size={13} />,
    },
    PENDING_FINAL_APPROVAL: {
      bg: 'bg-blue-50 ring-blue-200 dark:bg-blue-900/20 dark:ring-blue-800/60',
      text: 'text-blue-800 dark:text-blue-300',
      dot: 'bg-blue-500',
      icon: <ClipboardCheck size={13} />,
    },
    PENDING_HR_CALIBRATION_REVIEW: {
      bg: 'bg-orange-50 ring-orange-200 dark:bg-orange-900/20 dark:ring-orange-800/60',
      text: 'text-orange-800 dark:text-orange-300',
      dot: 'bg-orange-500',
      icon: <AlertTriangle size={13} />,
    },
    FINALIZED_LOCKED: {
      bg: 'bg-emerald-50 ring-emerald-200 dark:bg-emerald-900/20 dark:ring-emerald-800/60',
      text: 'text-emerald-800 dark:text-emerald-300',
      dot: 'bg-emerald-500',
      icon: <CheckCircle2 size={13} />,
    },
    APPROVED: {
      bg: 'bg-emerald-50 ring-emerald-200 dark:bg-emerald-900/20 dark:ring-emerald-800/60',
      text: 'text-emerald-800 dark:text-emerald-300',
      dot: 'bg-emerald-500',
      icon: <CheckCircle2 size={13} />,
    },
    REOPENED: {
      bg: 'bg-violet-50 ring-violet-200 dark:bg-violet-900/20 dark:ring-violet-800/60',
      text: 'text-violet-800 dark:text-violet-300',
      dot: 'bg-violet-500',
      icon: <ArrowRight size={13} />,
    },
    NOT_SUBMITTED: {
      bg: 'bg-slate-50 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700',
      text: 'text-slate-700 dark:text-slate-300',
      dot: 'bg-slate-400',
      icon: <Clock size={13} />,
    },
    NOT_STARTED: {
      bg: 'bg-slate-50 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700',
      text: 'text-slate-700 dark:text-slate-300',
      dot: 'bg-slate-400',
      icon: <Clock size={13} />,
    },
  };

  const c = config[status] ?? {
    bg: 'bg-slate-50 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700',
    text: 'text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-400',
    icon: <FileText size={13} />,
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset ${c.bg} ${c.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.icon}
      {status.replace('_', ' ')}
    </span>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200/70 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p className="mt-0.5 wrap-break-word text-sm font-semibold leading-snug text-slate-800 dark:text-slate-100">
          {value}
        </p>
      </div>
    </div>
  );
}

function formatNameCode(name?: string | null, code?: string | null) {
  const displayName = name?.trim();
  const displayCode = code?.trim();

  if (!displayName || displayName === 'N/A') {
    return 'N/A';
  }

  return displayCode ? `${displayName} (${displayCode})` : displayName;
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
      ? 'bg-amber-50/70 ring-amber-200 dark:bg-amber-900/15 dark:ring-amber-800'
      : 'bg-white ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700';

  const iconWrap =
    variant === 'warning'
      ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 dark:from-amber-900/40 dark:to-amber-800/30 dark:text-amber-300'
      : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 dark:from-slate-700 dark:to-slate-800 dark:text-slate-300';

  const titleColor =
    variant === 'warning'
      ? 'text-amber-900 dark:text-amber-100'
      : 'text-slate-800 dark:text-slate-100';

  const msgColor =
    variant === 'warning'
      ? 'text-amber-700 dark:text-amber-300'
      : 'text-slate-500 dark:text-slate-400';

  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <div className={`w-full max-w-md rounded-3xl p-12 text-center shadow-sm ring-1 ring-inset ${styles}`}>
        <div
          className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl shadow-sm ${iconWrap}`}
        >
          {icon}
        </div>
        <h2 className={`text-xl font-bold tracking-tight ${titleColor}`}>{title}</h2>
        {message && (
          <p className={`mt-3 text-sm leading-relaxed ${msgColor}`}>{message}</p>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);
  const complete = pct === 100;
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={15} className={complete ? 'text-emerald-600' : 'text-slate-400'} />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Completion Progress
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-bold tabular-nums text-slate-900 dark:text-white">
            {pct}%
          </span>
          <span className="text-[11px] font-medium tabular-nums text-slate-400 dark:text-slate-500">
            ({current}/{total})
          </span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/60">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            complete
              ? 'bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-400'
              : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
          }`}
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
    <div className="inline-flex rounded-xl bg-slate-100 p-1 ring-1 ring-inset ring-slate-200 dark:bg-slate-900/60 dark:ring-slate-700">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('Yes')}
        className={`min-w-[88px] rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
          value === 'Yes'
            ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600/30'
            : disabled
              ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
              : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('No')}
        className={`min-w-[88px] rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
          value === 'No'
            ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-600/30'
            : disabled
              ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
              : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
        }`}
      >
        No
      </button>
    </div>
  );
}

export const MySelfAssessmentFormPage: React.FC = () => {
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const { data: formStatus, isLoading: statusLoading } = useGetMyFormStatusQuery();
  const shouldLoadForm = Boolean(
    formStatus?.isEligible && formStatus?.hasActiveTemplate && formStatus?.status !== 'NOT_ASSIGNED',
  );
  const { data: formData, isLoading: formLoading, refetch } = useGetMyCurrentFormQuery(undefined, {
    skip: !shouldLoadForm,
  });

  const [saveDraft] = useSaveDraftMutation();
  const [submitForm, { isLoading: isSubmitting }] = useSubmitFormMutation();
  const [employeeAcknowledge, { isLoading: isAcknowledging }] = useEmployeeAcknowledgeMutation();
  const [employeeDispute, { isLoading: isDisputing }] = useEmployeeDisputeMutation();

  const form = useForm<AnswerFormData>({
    defaultValues: {
      answers: [],
      employeeRemarks: '',
    },
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
  } = form;

  const isReadOnly = formData?.status !== 'DRAFT' && formData?.status !== 'REOPENED';
  const editsBlockedByDeadline = Boolean(formStatus?.deadlinePassed && formStatus?.status !== 'REOPENED');
  const autosaveDisabled = statusLoading || formLoading || !formData || isReadOnly || editsBlockedByDeadline;

  const draftTransport = useMemo<Transport>(() => {
    const transport: Transport = async (payload) => {
      try {
        await saveDraft(payload as unknown as SaveDraftRequest).unwrap();
        return { ok: true };
      } catch (error: any) {
        return {
          ok: false,
          error: new Error(error?.data?.message || 'Failed to save draft'),
        } satisfies SaveResult;
      }
    };

    return withRetry(transport, { maxRetries: 3 });
  }, [saveDraft]);

  const autosave = useRhfAutosave<AnswerFormData>({
    form,
    transport: draftTransport,
    config: {
      debounceMs: 2000,
      maxRetries: 3,
      debug: false,
    },
    validateBeforeSave: 'none',
    selectPayload: (values) => values,
    shouldSave: ({ isDirty, dirtyFields }) =>
      !autosaveDisabled && (isDirty || Object.keys(dirtyFields).length > 0),
    mapPayload: () => toSaveDraftRequest(form.getValues(), formData?.overallRemarks),
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
  const tenPointYesMinRating = formData?.tenPointYesMinRating ?? 5;

  const answeredCount =
    watchAnswers?.filter((a) => (a.yesNoAnswer === 'Yes' || a.yesNoAnswer === 'No') && a.rating != null)
      .length ?? 0;

  const totalCount = formData?.answers?.length ?? 0;
  const isSubmissionComplete = totalCount > 0 && answeredCount === totalCount;

  const handleYesNoChange = (index: number, value: string, currentRating: number | null) => {
    setValue(`answers.${index}.yesNoAnswer`, value, { shouldDirty: true, shouldTouch: true });
    if (isRatingValidForAnswer(ratingSystem, value, currentRating, tenPointYesMinRating)) {
      setValue(`answers.${index}.rating`, currentRating, { shouldDirty: true, shouldTouch: true });
    } else {
      setValue(`answers.${index}.rating`, null as any, { shouldDirty: true, shouldTouch: true });
    }
  };

  const onSaveNow = useCallback(async () => {
    try {
      const result = await autosave.flush();
      if (!result?.ok) {
        toast.error(result?.error?.message || 'Failed to save draft');
        return;
      }
      refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save draft');
    }
  }, [autosave, refetch]);

  const onSubmitForm = async (data: AnswerFormData) => {
    try {
      const incompleteAnswers = data.answers.filter(
        (a) => (a.yesNoAnswer !== 'Yes' && a.yesNoAnswer !== 'No') || a.rating == null,
      );
      if (incompleteAnswers.length > 0) {
        toast.error('Each question requires both a Yes/No response and a rating');
        setShowSubmitConfirm(false);
        return;
      }

      if (autosave.hasPendingChanges) {
        await autosave.flush();
      }

      await submitForm(toSaveDraftRequest(data, formData?.overallRemarks)).unwrap();
      toast.success('Form submitted successfully');
      setShowSubmitConfirm(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to submit form');
    }
  };

  const onAcknowledge = async () => {
    if (!formData?.id) return;
    try {
      await employeeAcknowledge(formData.id).unwrap();
      toast.success('You have acknowledged the manager review');
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to acknowledge');
    }
  };

  const onDispute = async () => {
    if (!formData?.id) return;
    if (!disputeReason.trim()) {
      toast.error('Please provide a reason for your dispute');
      return;
    }
    try {
      await employeeDispute({ formId: formData.id, request: { disputeReason: disputeReason.trim() } }).unwrap();
      toast.success('Your dispute has been submitted to HR');
      setShowDisputeModal(false);
      setDisputeReason('');
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to submit dispute');
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
    return <StateCard variant="warning" icon={<AlertTriangle size={32} />} title="Not Eligible" message={formStatus?.message} />;
  }

  if (formStatus?.deadlinePassed && formStatus?.status !== 'REOPENED') {
    return (
      <StateCard
        icon={<Clock size={32} />}
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
    return <StateCard icon={<FileText size={32} />} title="No Form Available" message={formStatus?.message} />;
  }

  if (formStatus?.status === 'NOT_ASSIGNED') {
    return <StateCard icon={<FileText size={32} />} title="No Assigned Form" message={formStatus?.message} />;
  }

  const departmentDisplay = formatNameCode(formData?.employee?.departmentName, formData?.employee?.departmentCode);
  const positionDisplay = formatNameCode(formData?.employee?.positionName, formData?.employee?.positionCode);
  const saveStatus = autosave.isSaving
    ? 'Saving...'
    : autosave.lastError
      ? 'Save failed'
      : autosave.hasPendingChanges
        ? 'Unsaved changes'
        : 'All changes saved';
  const saveStatusTone = autosave.isSaving
    ? 'text-sky-700 dark:text-sky-400'
    : autosave.lastError
      ? 'text-rose-700 dark:text-rose-400'
      : autosave.hasPendingChanges
        ? 'text-amber-700 dark:text-amber-400'
        : 'text-slate-500 dark:text-slate-400';
  const saveStatusDot = autosave.isSaving
    ? 'animate-pulse bg-sky-500'
    : autosave.lastError
      ? 'bg-rose-500'
      : autosave.hasPendingChanges
        ? 'animate-pulse bg-amber-500'
        : 'bg-emerald-500';

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-32">
      {/* ───── Hero Header ───── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/40 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-emerald-950/20">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-100/0 blur-3xl dark:from-emerald-900/20" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-gradient-to-tr from-sky-100/40 to-transparent blur-3xl dark:from-sky-900/10" />

        <div className="relative px-7 pt-7 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 ring-1 ring-white/40 dark:ring-emerald-400/20">
                <ClipboardCheck size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
                    Performance Review
                  </span>
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-[26px]">
                  My Self Assessment
                </h1>
                {formData?.title && (
                  <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                    {formData.title}
                  </p>
                )}
              </div>
            </div>
            <StatusBadge status={formData?.status} />
          </div>
        </div>

        {/* Metadata strip */}
        {(formData?.employee || formData?.cycleName || formData?.deadlineDate || formData?.assessmentDate || formData?.totalScore != null) && (
          <div className="relative grid grid-cols-1 divide-y divide-slate-200/70 border-t border-slate-200/70 bg-white/60 backdrop-blur-sm sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800/30">
            {formData?.employee && (
              <MetaItem icon={<Building2 size={17} />} label="Department" value={departmentDisplay} />
            )}
            {formData?.employee && (
              <MetaItem icon={<Briefcase size={17} />} label="Position" value={positionDisplay} />
            )}
            {formData?.cycleName && (
              <MetaItem icon={<FolderOpen size={17} />} label="Cycle" value={formData.cycleName} />
            )}
            {formData?.deadlineDate && (
              <MetaItem
                icon={<Calendar size={17} />}
                label="Deadline"
                value={formatDateDayMonthYear(formData.deadlineDate)}
              />
            )}
            {formData?.assessmentDate && (
              <MetaItem
                icon={<Clock size={17} />}
                label="Assessment Date"
                value={formatDateDayMonthYear(formData.assessmentDate)}
              />
            )}
            {formData?.totalScore != null && (
              <MetaItem
                icon={<BarChart3 size={17} />}
                label="Score"
                value={`${formData.totalScore.toFixed(1)}% · ${formData.ratingCategory}`}
              />
            )}
          </div>
        )}
      </div>

      {/* ───── Progress ───── */}
      {totalCount > 0 && !isReadOnly && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
          <ProgressBar current={answeredCount} total={totalCount} />
        </div>
      )}

      {/* ───── Read-only Banner ───── */}
      {isReadOnly && formData?.status !== 'PENDING_EMPLOYEE_REVIEW' && (
        <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 px-5 py-4 dark:border-sky-800/60 dark:from-sky-900/20 dark:to-blue-900/15">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
            <Lock size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-sky-900 dark:text-sky-200">Read-only mode</p>
            <p className="mt-0.5 text-xs text-sky-700 dark:text-sky-300/80">
              This form cannot be modified in its current status.
            </p>
          </div>
        </div>
      )}

      {/* ───── Pending Employee Review Panel ───── */}
      {formData?.status === 'PENDING_EMPLOYEE_REVIEW' && (
        <div className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/40 shadow-sm dark:border-amber-800/60 dark:from-amber-900/20 dark:to-orange-900/10">
          <div className="flex items-center gap-3 border-b border-amber-200/70 bg-amber-100/60 px-5 py-3.5 dark:border-amber-800/50 dark:bg-amber-900/30">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
              <Scale size={15} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Manager Review Completed</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">Please review the updated scores and respond before your performance discussion.</p>
            </div>
          </div>
          {formData.managerRevisedTotalScore != null && (
            <div className="grid grid-cols-2 gap-px border-b border-amber-200/60 bg-amber-200/30 dark:border-amber-800/40 dark:bg-amber-900/20">
              <div className="bg-amber-50/80 px-5 py-3 dark:bg-amber-950/30">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Your Self Score</p>
                <p className="mt-0.5 text-lg font-bold text-amber-900 dark:text-amber-100">
                  {formData.totalScore?.toFixed(1)}%
                </p>
              </div>
              <div className="bg-amber-50/80 px-5 py-3 dark:bg-amber-950/30">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Manager Revised Score</p>
                <p className="mt-0.5 text-lg font-bold text-amber-900 dark:text-amber-100">
                  {formData.managerRevisedTotalScore.toFixed(1)}%
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-end gap-3 px-5 py-4">
            <button
              type="button"
              onClick={() => setShowDisputeModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 shadow-sm transition-all hover:bg-rose-50 dark:border-rose-800/60 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-900/20"
            >
              <ThumbsDown size={14} />
              Dispute
            </button>
            <button
              type="button"
              onClick={onAcknowledge}
              disabled={isAcknowledging}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition-all hover:-translate-y-px hover:shadow-lg disabled:opacity-50"
            >
              <ThumbsUp size={14} />
              {isAcknowledging ? 'Acknowledging…' : 'Acknowledge'}
            </button>
          </div>
        </div>
      )}

      {/* ───── Questions ───── */}
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <div className="space-y-4">
          {formData?.answers &&
            formData.answers.map((answer, index) => {
              const yn = watchAnswers?.[index]?.yesNoAnswer;
              const rating = watchAnswers?.[index]?.rating;
              const isAnswered = (yn === 'Yes' || yn === 'No') && rating != null;
              return (
                <div
                  key={answer.id}
                  className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md dark:bg-slate-800/60 ${
                    isAnswered
                      ? 'border-emerald-200/70 dark:border-emerald-800/50'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {/* Question header */}
                  <div className="flex items-start gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-6 py-4 dark:border-slate-700 dark:from-slate-800/80 dark:to-slate-800/40">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold tabular-nums shadow-sm ring-1 ring-inset transition-all ${
                        isAnswered
                          ? 'bg-emerald-600 text-white ring-emerald-700/30'
                          : 'bg-white text-slate-600 ring-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-600'
                      }`}
                    >
                      {isAnswered ? <CheckCircle2 size={16} /> : index + 1}
                    </span>
                    <div className="min-w-0 flex-1 pt-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                        Question {index + 1} of {totalCount}
                      </p>
                      <p className="mt-1 text-[15px] font-semibold leading-snug text-slate-800 dark:text-slate-100">
                        {answer.questionText}
                      </p>
                    </div>
                  </div>

                  {/* Question body */}
                  <div className="space-y-6 px-6 py-6">
                    {/* Yes / No */}
                    <div>
                      <label className="mb-2.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        Your Response (required)
                      </label>
                      <YesNoToggle
                        value={watchAnswers?.[index]?.yesNoAnswer}
                        onChange={(v) => handleYesNoChange(index, v, watchAnswers?.[index]?.rating)}
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* Rating */}
                    <div>
                      <label className="mb-2.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        Rating (required)
                      </label>
                      <Controller
                        name={`answers.${index}.rating`}
                        control={control}
                        render={({ field }) => (
                          <SelfAssessmentRatingPicker
                            fivePointVariant="numeric"
                            ratingSystem={ratingSystem}
                            tenPointYesMinRating={tenPointYesMinRating}
                            yesNoAnswer={watchAnswers?.[index]?.yesNoAnswer}
                            value={field.value}
                            onChange={(rating) => {
                              const yn2 = watchAnswers?.[index]?.yesNoAnswer ?? null;
                              if (!isRatingValidForAnswer(ratingSystem, yn2, rating, tenPointYesMinRating)) {
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
                      <label className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        <MessageSquare size={12} />
                        Remarks
                        <span className="font-medium normal-case tracking-normal text-slate-400 dark:text-slate-500">
                          (optional)
                        </span>
                      </label>
                      <textarea
                        {...register(`answers.${index}.remarks` as const)}
                        disabled={isReadOnly}
                        rows={2}
                        placeholder="Add any remarks for this question…"
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100/60 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900/40 dark:text-white dark:placeholder-slate-500 dark:focus:border-emerald-500 dark:focus:bg-slate-900 dark:focus:ring-emerald-900/40"
                      />
                    </div>
                  </div>

                  {/* Score Revisions */}
                  {(answer.managerProposedYesNo || answer.finalApprovedYesNo) && (
                    <div className="border-t border-amber-200/70 bg-gradient-to-br from-amber-50/80 to-orange-50/40 px-6 py-5 dark:border-amber-800/60 dark:from-amber-900/15 dark:to-orange-900/10">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-200/70 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          <AlertTriangle size={12} />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-300">
                          Score Revisions
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 dark:border-slate-600 dark:bg-slate-800/80">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Employee Self Score
                          </span>
                          <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">
                            {answer.yesNoAnswer}{' '}
                            <span className="font-medium text-slate-400 dark:text-slate-500">
                              ({answer.rating})
                            </span>
                          </p>
                        </div>
                        <div className="rounded-xl border border-amber-300/70 bg-white px-3.5 py-3 ring-1 ring-amber-200/50 dark:border-amber-700/60 dark:bg-amber-950/30 dark:ring-amber-900/30">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            Manager Revised Score
                          </span>
                          <p className="mt-1 text-sm font-bold text-amber-800 dark:text-amber-200">
                            {answer.managerProposedYesNo ? (
                              <>
                                {answer.managerProposedYesNo}{' '}
                                <span className="font-medium text-amber-500">
                                  ({answer.managerProposedRating})
                                </span>
                              </>
                            ) : (
                              <span className="font-medium text-slate-400 dark:text-slate-500">—</span>
                            )}
                          </p>
                        </div>
                        <div className={`rounded-xl border px-3.5 py-3 ${answer.finalApprovedYesNo ? 'border-emerald-300/70 bg-white ring-1 ring-emerald-200/50 dark:border-emerald-700/60 dark:bg-emerald-950/30 dark:ring-emerald-900/30' : 'border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800/80'}`}>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${answer.finalApprovedYesNo ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                            Final Approved Score
                          </span>
                          <p className="mt-1 text-sm font-bold text-emerald-800 dark:text-emerald-200">
                            {answer.finalApprovedYesNo ? (
                              <>
                                {answer.finalApprovedYesNo}{' '}
                                <span className="font-medium text-emerald-500">
                                  ({answer.finalApprovedRating})
                                </span>
                              </>
                            ) : (
                              <span className="font-medium text-slate-400 dark:text-slate-500">—</span>
                            )}
                          </p>
                        </div>
                      </div>
                      {answer.managerProposedComment && (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 dark:border-slate-600 dark:bg-slate-800/80">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Manager Comment
                          </span>
                          <p className="mt-1 text-sm leading-snug text-slate-600 dark:text-slate-300">
                            {answer.managerProposedComment}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          {/* ───── Additional Remarks ───── */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
            <div className="flex items-start gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-6 py-4 dark:border-slate-700 dark:from-slate-800/80 dark:to-slate-800/40">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-sm">
                <Sparkles size={16} />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  Closing Reflection
                </p>
                <p className="mt-1 text-[15px] font-semibold text-slate-800 dark:text-slate-100">
                  Additional Remarks
                </p>
              </div>
            </div>
            <div className="px-6 py-6">
              <textarea
                {...register('employeeRemarks')}
                disabled={isReadOnly}
                rows={4}
                placeholder="Share any additional thoughts, context, or feedback you'd like to include…"
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100/60 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900/40 dark:text-white dark:placeholder-slate-500 dark:focus:border-emerald-500 dark:focus:bg-slate-900 dark:focus:ring-emerald-900/40"
              />
            </div>
          </div>
        </div>

        {/* ───── Sticky Action Bar ───── */}
        {!isReadOnly && (
          <div className="fixed bottom-0 left-64 right-0 z-40 border-t border-slate-200 bg-white/85 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/85">
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
              <div className="hidden items-center gap-2.5 sm:flex">
                <span className={`h-2 w-2 rounded-full ${saveStatusDot}`} />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  <span className={saveStatusTone}>{saveStatus}</span>
                </p>
                <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="font-bold tabular-nums text-slate-700 dark:text-slate-200">
                    {answeredCount}
                  </span>
                  /{totalCount} answered
                </p>
              </div>
              <div className="flex flex-1 items-center justify-end gap-3 sm:flex-initial">
                <button
                  type="button"
                  onClick={onSaveNow}
                  disabled={autosave.isSaving || !autosave.hasPendingChanges}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-px hover:bg-slate-50 hover:shadow disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:disabled:hover:bg-slate-800"
                >
                  <Save size={15} />
                  {autosave.isSaving ? 'Saving...' : 'Save Now'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(true)}
                  disabled={isSubmitting || !isSubmissionComplete}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 ring-1 ring-emerald-600/20 transition-all hover:-translate-y-px hover:shadow-lg hover:shadow-emerald-500/30 disabled:translate-y-0 disabled:opacity-50"
                >
                  <Send size={15} />
                  Submit Assessment
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* ───── Dispute Modal ───── */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
                  <ThumbsDown size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                    Dispute Manager Review
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This will be escalated to HR for review
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowDisputeModal(false); setDisputeReason(''); }}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Reason for Dispute <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={4}
                placeholder="Explain why you disagree with the manager's revised scores…"
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-100/60 dark:border-slate-600 dark:bg-slate-900/40 dark:text-white dark:placeholder-slate-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/40">
              <button
                onClick={() => { setShowDisputeModal(false); setDisputeReason(''); }}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={onDispute}
                disabled={isDisputing || !disputeReason.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-rose-700 disabled:opacity-50"
              >
                <Scale size={15} />
                {isDisputing ? 'Submitting…' : 'Submit Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───── Confirmation Modal ───── */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                  <Send size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                    Confirm Submission
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Are you ready to submit your completed self-assessment?
              </p>
              <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3.5 dark:border-amber-800/60 dark:bg-amber-900/15">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-sm leading-snug font-medium text-amber-800 dark:text-amber-200">
                  Your assessment will be shared with your manager and you will not be able to make any changes.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/40">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit(onSubmitForm)}
                disabled={isSubmitting || !isSubmissionComplete}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition-all hover:shadow-lg hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
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
