import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useRhfAutosave, withRetry, type SaveResult, type Transport } from 'react-hook-form-autosave';
import { toast } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
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
  RotateCcw,
  KeyRound,
} from 'lucide-react';
import { RemarkCommentHeader } from '../../features/selfAssessmentForm/components/RemarkCommentHeader';
import { YesNoRatingDisplay } from '../../features/selfAssessmentForm/components/YesNoRatingDisplay';
import {
  useGetMyFormStatusQuery,
  useGetMyCurrentFormQuery,
  useSaveDraftMutation,
  useSubmitFormMutation,
  useEmployeeAcknowledgeMutation,
  useEmployeeDisputeMutation,
  useEmployeeRetakeSubmitMutation,
  useRequestSelfAssessmentUnlockMutation,
  type SaveDraftRequest,
  type SelfAssessmentUnlockReasonCode,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { useGetDefaultSignatureQuery } from '../../features/user/userApi';
import { isRatingValidForAnswer } from '../../features/selfAssessmentForm/ratingSystem';
import { SelfAssessmentRatingPicker } from '../../features/selfAssessmentForm/components/SelfAssessmentRatingPicker';
import { SelfAssessmentSignatureGrid } from '../../features/selfAssessmentForm/components/SelfAssessmentSignatureGrid';
import {
  InlineDefaultSignaturePad,
  type InlineDefaultSignaturePadHandle,
} from '../../components/signature/InlineDefaultSignaturePad';
import { formatDateDayMonthYear } from '../../utils/dateUtils';

interface AnswerFormData {
  answers: {
    id: number;
    yesNoAnswer: string | null;
    rating: number | null;
	    remarks: string | null;
	    retakeReason?: string | null;
  }[];
  employeeRemarks: string | null;
}

const SELF_ASSESSMENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  NOT_STARTED: 'Not Started',
  NOT_SUBMITTED: 'Not Submitted',
  SUBMITTED: 'Submitted',
  REOPENED: 'Reopened',
  PENDING_MANAGER_REVIEW: 'Pending Manager Review',
  PENDING_EMPLOYEE_REVIEW: 'Pending Employee Review',
  PENDING_EMPLOYEE_RETAKE: 'Pending Employee Retake',
  PENDING_RETAKE_MANAGER_REVIEW: 'Pending Retake Manager Review',
  PENDING_FINAL_APPROVAL: 'Pending Final Approval',
  PENDING_HR_CALIBRATION_REVIEW: 'Pending HR Calibration',
  RETURNED_BY_HR: 'Returned by HR',
  MANAGER_REVIEWED: 'Manager Reviewed',
  APPROVED: 'Approved',
  FINALIZED_LOCKED: 'Finalized Locked',
};

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
	    PENDING_EMPLOYEE_RETAKE: {
	      bg: 'bg-amber-50 ring-amber-200 dark:bg-amber-900/20 dark:ring-amber-800/60',
	      text: 'text-amber-800 dark:text-amber-300',
	      dot: 'bg-amber-500',
	      icon: <RotateCcw size={13} />,
	    },
	    PENDING_RETAKE_MANAGER_REVIEW: {
	      bg: 'bg-sky-50 ring-sky-200 dark:bg-sky-900/20 dark:ring-sky-800/60',
	      text: 'text-sky-800 dark:text-sky-300',
	      dot: 'bg-sky-500',
	      icon: <ClipboardCheck size={13} />,
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
    RETURNED_BY_HR: {
      bg: 'bg-rose-50 ring-rose-200 dark:bg-rose-900/20 dark:ring-rose-800/60',
      text: 'text-rose-800 dark:text-rose-300',
      dot: 'bg-rose-500',
      icon: <RotateCcw size={13} />,
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
      {SELF_ASSESSMENT_STATUS_LABELS[status] ?? status.replace(/_/g, ' ')}
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

const DISPUTE_CATEGORY_OTHER = 'other';

const UNLOCK_REASON_OPTIONS: { value: SelfAssessmentUnlockReasonCode; label: string }[] = [
  { value: 'TYPO_COMMENT', label: 'Typo or comment correction' },
  { value: 'WRONG_RATING', label: 'Wrong rating selected' },
  { value: 'INCOMPLETE_ANSWER', label: 'Incomplete answer' },
  { value: 'WRONG_ANSWER', label: 'Wrong answer selected' },
  { value: 'OTHER', label: 'Other' },
];

const DISPUTE_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'disagree_revised_scores', label: 'I disagree with the revised scores' },
  { value: 'inaccurate_manager_feedback', label: "The manager's feedback is inaccurate or incomplete" },
  { value: 'totals_or_calculation', label: 'Totals or score calculation look incorrect' },
  { value: DISPUTE_CATEGORY_OTHER, label: 'Other' },
];

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
          <ClipboardCheck size={15} className={complete ? 'text-[#2463eb]' : 'text-slate-400'} />
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
              ? 'bg-gradient-to-r from-[#2463eb] via-[#2463eb] to-[#3b82f6]'
              : 'bg-gradient-to-r from-[#2463eb] to-[#3b82f6]'
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
            ? 'bg-[#2463eb] text-white shadow-sm ring-1 ring-[#2463eb]/30'
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
  const location = useLocation();
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showRetakeSubmitConfirm, setShowRetakeSubmitConfirm] = useState(false);
  const [showAcknowledgeConfirm, setShowAcknowledgeConfirm] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockReasonCode, setUnlockReasonCode] = useState<SelfAssessmentUnlockReasonCode | ''>('');
  const [unlockReasonText, setUnlockReasonText] = useState('');
  const [disputeCategory, setDisputeCategory] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [hasPadDrawing, setHasPadDrawing] = useState(false);
  const [needsInlineSignature, setNeedsInlineSignature] = useState(false);
  const [isSavingInlineSignature, setIsSavingInlineSignature] = useState(false);
  const inlineSignaturePadRef = useRef<InlineDefaultSignaturePadHandle>(null);
  const { data: defaultSigResponse, isLoading: isDefaultSigLoading } = useGetDefaultSignatureQuery();
  const hasDefaultSignature = Boolean(defaultSigResponse?.data?.signatureData);

  useEffect(() => {
    if (!showSubmitConfirm) {
      setHasPadDrawing(false);
      setNeedsInlineSignature(false);
      return;
    }
    if (!isDefaultSigLoading && !hasDefaultSignature) {
      setNeedsInlineSignature(true);
    }
  }, [showSubmitConfirm, isDefaultSigLoading, hasDefaultSignature]);

  const { data: formStatus, isLoading: statusLoading, refetch: refetchStatus } = useGetMyFormStatusQuery();
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
  const [employeeRetakeSubmit, { isLoading: isSubmittingRetake }] = useEmployeeRetakeSubmitMutation();
  const [requestUnlock, { isLoading: isRequestingUnlock }] = useRequestSelfAssessmentUnlockMutation();

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

  const watchAnswers = watch('answers');
  const employeeRemarksLen = String(useWatch({ control, name: 'employeeRemarks' }) ?? '').length;

  const isRetakeMode = formData?.status === 'PENDING_EMPLOYEE_RETAKE';
  const isReadOnly = formData?.status !== 'DRAFT' && formData?.status !== 'REOPENED' && !isRetakeMode;
  const pendingUnlockRequest = formData?.pendingUnlockRequest ?? null;
  const canAskHrToUnlock = formData?.status === 'PENDING_MANAGER_REVIEW';
  const deadlineBlocksDraftWork = Boolean(
    formStatus?.deadlinePassed
      && (formStatus?.status === 'DRAFT' || formStatus?.status === 'NOT_SUBMITTED'),
  );
  const editsBlockedByDeadline = deadlineBlocksDraftWork;
  const autosaveDisabled = statusLoading || formLoading || !formData || isReadOnly || isRetakeMode || editsBlockedByDeadline;

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
	          retakeReason: a.retakeReason || '',
	        })),
        employeeRemarks: formData.employeeRemarks || '',
      });
    }
  }, [formData, reset]);

  useEffect(() => {
    const refreshToken = (location.state as { notificationRefreshToken?: number } | null)?.notificationRefreshToken;
    if (!refreshToken) {
      return;
    }
    refetchStatus();
    if (shouldLoadForm) {
      refetch();
    }
  }, [location.state, refetch, refetchStatus, shouldLoadForm]);

  const ratingSystem = formData?.ratingSystem ?? 'FIVE_POINT';
  const tenPointYesMinRating = formData?.tenPointYesMinRating ?? 5;

  const answeredCount =
    watchAnswers?.filter((a) => (a.yesNoAnswer === 'Yes' || a.yesNoAnswer === 'No') && a.rating != null)
      .length ?? 0;

	  const totalCount = formData?.answers?.length ?? 0;
	  const retakeCount = formData?.answers?.filter(a => a.retakeRequested).length ?? 0;
  const isSubmissionComplete = totalCount > 0 && answeredCount === totalCount;
  const serverDisplayScore =
    formData?.finalApprovedTotalScore
    ?? formData?.managerRevisedTotalScore
    ?? formData?.totalScore
    ?? null;
  const displayedScore = isReadOnly ? serverDisplayScore : null;
  const displayedScoreCategory = formData?.ratingCategory ?? null;

  const showMetadataStrip =
    Boolean(formData?.employee)
    || Boolean(formData?.cycleName)
    || Boolean(formData?.deadlineDate)
    || Boolean(formData?.assessmentDate)
    || displayedScore != null
    || (!isReadOnly && totalCount > 0);

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

  const handleConfirmRetakeSubmit = () => {
    void handleSubmit(
      onRetakeSubmit,
      () => {
        toast.error('Please complete all warned questions before submitting.');
      },
    )();
  };

  const handleConfirmSubmit = async () => {
    try {
      if (needsInlineSignature && !hasDefaultSignature) {
        const pad = inlineSignaturePadRef.current;
        if (!pad) {
          toast.error('Signature pad is not ready. Please try again.');
          return;
        }
        setIsSavingInlineSignature(true);
        const saved = await pad.saveAsDefault();
        if (!saved) return;
      }

      await handleSubmit(
        onSubmitForm,
        () => {
          toast.error('Please complete all questions before submitting.');
        },
      )();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to submit form';
      toast.error(message);
    } finally {
      setIsSavingInlineSignature(false);
    }
  };

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

	  const onRetakeSubmit = async (data: AnswerFormData) => {
	    if (!formData?.id) return;
	    const retakeAnswers = formData.answers
	      .map((answer, index) => ({ answer, value: data.answers[index] }))
	      .filter(item => item.answer.retakeRequested);
	    if (retakeAnswers.length === 0) {
	      toast.error('No questions are marked for retake');
	      return;
	    }
	    const incomplete = retakeAnswers.some(({ value }) =>
	      (value?.yesNoAnswer !== 'Yes' && value?.yesNoAnswer !== 'No')
	      || value?.rating == null
	      || !value?.retakeReason?.trim(),
	    );
	    if (incomplete) {
	      toast.error('Each warned question requires Yes/No, rating, and reason');
	      return;
	    }
	    try {
	      await employeeRetakeSubmit({
	        formId: formData.id,
	        request: {
	          answers: retakeAnswers.map(({ answer, value }) => ({
	            answerId: answer.id,
	            yesNoAnswer: value.yesNoAnswer as string,
	            rating: value.rating as number,
	            reason: value.retakeReason?.trim() ?? '',
	          })),
	        },
	      }).unwrap();
	      toast.success('Retake submitted');
	      setShowRetakeSubmitConfirm(false);
	      refetch();
	    } catch (error: any) {
	      toast.error(error?.data?.message || 'Failed to submit retake');
	    }
		  };

  const onRequestUnlock = async () => {
    if (!formData?.id || !unlockReasonCode) return;
    if (unlockReasonCode === 'OTHER' && !unlockReasonText.trim()) {
      toast.error('Please explain the unlock reason');
      return;
    }
    try {
      await requestUnlock({
        formId: formData.id,
        request: {
          reasonCode: unlockReasonCode,
          reasonText: unlockReasonCode === 'OTHER' ? unlockReasonText.trim() : null,
        },
      }).unwrap();
      toast.success('Unlock request sent to HR');
      setShowUnlockModal(false);
      setUnlockReasonCode('');
      setUnlockReasonText('');
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to request unlock');
    }
  };

  const onAcknowledge = async () => {
    if (!formData?.id) return;
    try {
      await employeeAcknowledge(formData.id).unwrap();
      setShowAcknowledgeConfirm(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to acknowledge');
    }
  };

  const onDispute = async () => {
    if (!formData?.id) return;
    const optionLabel = DISPUTE_CATEGORY_OPTIONS.find((o) => o.value === disputeCategory)?.label;
    const disputeReasonPayload = disputeCategory === DISPUTE_CATEGORY_OTHER ? disputeReason.trim() : (optionLabel ?? '').trim();
    if (!disputeReasonPayload) {
      toast.error('Please provide a reason for your dispute');
      return;
    }
    try {
      await employeeDispute({ formId: formData.id, request: { disputeReason: disputeReasonPayload } }).unwrap();
      setShowDisputeModal(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to submit dispute');
    }
  };

  if (statusLoading || formLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#dbeafe] border-t-[#2463eb]" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading form…</p>
        </div>
      </div>
    );
  }

  if (!formStatus?.isEligible) {
    return <StateCard variant="warning" icon={<AlertTriangle size={32} />} title="Not Eligible" message={formStatus?.message} />;
  }

  if (deadlineBlocksDraftWork) {
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

  if (!formData) {
    return <StateCard icon={<FileText size={32} />} title="No Form Available" message={formStatus?.message} />;
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
        : 'bg-[#2463eb]';

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-32">
      {/* ───── Hero Header ───── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-[#eff6ff]/40 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-[#1e3a8a]/20">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-[#bfdbfe]/40 to-[#eff6ff]/0 blur-3xl dark:from-[#1e3a8a]/20" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-gradient-to-tr from-[#dbeafe]/40 to-transparent blur-3xl dark:from-[#1e3a8a]/10" />

        <div className="relative px-7 pt-7 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] text-white shadow-lg shadow-[#2463eb]/20 ring-1 ring-white/40 dark:ring-[#60a5fa]/20">
                <ClipboardCheck size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1d4ed8] dark:text-[#60a5fa]">
                    Performance Review
                  </span>
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-[26px]">
                  My Form
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
        {showMetadataStrip && (
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
            {displayedScore != null && (
              <MetaItem
                icon={<BarChart3 size={17} />}
                label={isReadOnly ? 'Final Score' : 'Total Mark'}
                value={`${displayedScore.toFixed(1)}%${displayedScoreCategory ? ` · ${displayedScoreCategory}` : ''}`}
              />
            )}
          </div>
        )}
      </div>

      {/* ───── Progress ───── */}
      {totalCount > 0 && !isReadOnly && !isRetakeMode && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
          <ProgressBar current={answeredCount} total={totalCount} />
        </div>
      )}

      {/* ───── Read-only Banner ───── */}
      {isRetakeMode && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800/60 dark:bg-amber-900/20">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <RotateCcw size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Retake requested</p>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300/90">
              Update the {retakeCount} warned question{retakeCount === 1 ? '' : 's'}. Other questions are read-only.
            </p>
          </div>
        </div>
      )}

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
      {canAskHrToUnlock && (
        <div className="flex flex-col gap-4 rounded-2xl border border-indigo-200 bg-indigo-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-indigo-800/60 dark:bg-indigo-900/20">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              <KeyRound size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-950 dark:text-indigo-100">
                {pendingUnlockRequest ? 'Unlock request pending' : 'Need to edit after submission?'}
              </p>
              <p className="mt-0.5 text-xs text-indigo-800 dark:text-indigo-300/90">
                {pendingUnlockRequest
                  ? 'HR has your request and will unlock or reject it.'
                  : 'Ask HR to reopen this form before your manager review starts.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={Boolean(pendingUnlockRequest)}
            onClick={() => setShowUnlockModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <KeyRound size={15} />
            Ask HR to Unlock
          </button>
        </div>
      )}

      {false && formData?.status === 'PENDING_EMPLOYEE_REVIEW' && (
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
	          {formData?.managerRevisedTotalScore != null && (
            <div className="grid grid-cols-2 gap-px border-b border-amber-200/60 bg-amber-200/30 dark:border-amber-800/40 dark:bg-amber-900/20">
              <div className="bg-amber-50/80 px-5 py-3 dark:bg-amber-950/30">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Your Self Score</p>
                <p className="mt-0.5 text-lg font-bold text-amber-900 dark:text-amber-100">
	                  {formData?.totalScore?.toFixed(1)}%
                </p>
              </div>
              <div className="bg-amber-50/80 px-5 py-3 dark:bg-amber-950/30">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Manager Revised Score</p>
                <p className="mt-0.5 text-lg font-bold text-amber-900 dark:text-amber-100">
	                  {formData?.managerRevisedTotalScore?.toFixed(1)}%
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
              onClick={() => setShowAcknowledgeConfirm(true)}
              disabled={isAcknowledging}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#dbeafe] transition-all hover:-translate-y-px hover:shadow-lg disabled:opacity-50"
            >
              <ThumbsUp size={14} />
              {isAcknowledging ? 'Acknowledging…' : 'Acknowledge'}
            </button>
          </div>
        </div>
      )}

      {(formData?.employeeRemarks || formData?.overallRemarks || formData?.managerComments || formData?.hrReviewReason || formData?.employeeDisputeReason) && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
          <div className="flex items-start gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-6 py-4 dark:border-slate-700 dark:from-slate-800/80 dark:to-slate-800/40">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] text-white shadow-sm">
              <MessageSquare size={16} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                Review Summary
              </p>
              <p className="mt-1 text-[15px] font-semibold text-slate-800 dark:text-slate-100">
                Remarks From Employee, Manager, and HR
              </p>
            </div>
          </div>
          <div className="space-y-3 px-6 py-5">
            {formData?.hrReviewReason && (
              <div className="rounded-xl border border-orange-200/80 bg-orange-50/60 px-4 py-3 dark:border-orange-700/60 dark:bg-orange-900/20">
                <RemarkCommentHeader
                  title="HR Remarks"
                  dateTime={formData.hrReviewReasonAt}
                  titleClassName="text-[10px] font-bold uppercase tracking-widest text-orange-700 dark:text-orange-300"
                  dateClassName="text-xs font-semibold tabular-nums text-orange-700 dark:text-orange-300"
                />
                <p className="text-sm leading-relaxed text-orange-900 dark:text-orange-100">
                  {formData.hrReviewReason}
                </p>
              </div>
            )}
            {formData?.employeeRemarks && (
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-700/20">
                <RemarkCommentHeader
                  title="Employee Remarks"
                  dateTime={formData.submittedDate ?? formData.employeeSignatureDate}
                  titleClassName="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400"
                />
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  {formData.employeeRemarks}
                </p>
              </div>
            )}
            {formData?.overallRemarks && (
              <div className="rounded-xl border border-violet-200/80 bg-violet-50/60 px-4 py-3 dark:border-violet-700/60 dark:bg-violet-900/20">
                <RemarkCommentHeader
                  title="Overall Remarks"
                  dateTime={formData.submittedDate ?? formData.employeeSignatureDate}
                  titleClassName="text-[10px] font-bold uppercase tracking-widest text-violet-700 dark:text-violet-300"
                  dateClassName="text-xs font-semibold tabular-nums text-violet-700 dark:text-violet-300"
                />
                <p className="text-sm leading-relaxed text-violet-900 dark:text-violet-100">
                  {formData.overallRemarks}
                </p>
              </div>
            )}
            {formData?.managerComments && (
              <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 px-4 py-3 dark:border-blue-700/60 dark:bg-blue-900/20">
                <RemarkCommentHeader
                  title="Manager Remarks"
                  dateTime={formData.managerSignatureDate}
                  titleClassName="text-[10px] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-300"
                  dateClassName="text-xs font-semibold tabular-nums text-blue-700 dark:text-blue-300"
                />
                <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
                  {formData.managerComments}
                </p>
              </div>
            )}
            {formData?.employeeDisputeReason && (
              <div className="rounded-xl border border-rose-200/80 bg-rose-50/60 px-4 py-3 dark:border-rose-700/60 dark:bg-rose-900/20">
                <RemarkCommentHeader
                  title="Employee Dispute"
                  dateTime={formData.employeeDisputedAt}
                  titleClassName="text-[10px] font-bold uppercase tracking-widest text-rose-700 dark:text-rose-300"
                  dateClassName="text-xs font-semibold tabular-nums text-rose-700 dark:text-rose-300"
                />
                <p className="text-sm leading-relaxed text-rose-900 dark:text-rose-100">
                  {formData.employeeDisputeReason}
                </p>
              </div>
            )}
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
              const canEditQuestion = !isReadOnly && (!isRetakeMode || answer.retakeRequested);
              return (
                <div
                  key={answer.id}
                  className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md dark:bg-slate-800/60 ${
                    isAnswered
                      ? 'border-[#bfdbfe]/70 dark:border-[#1e40af]/50'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {/* Question header */}
                  <div className="flex items-start gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-6 py-4 dark:border-slate-700 dark:from-slate-800/80 dark:to-slate-800/40">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold tabular-nums shadow-sm ring-1 ring-inset transition-all ${
                        isAnswered
                          ? 'bg-[#2463eb] text-white ring-[#1d4ed8]/30'
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
	                    {answer.retakeRequested && (
	                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/60 dark:bg-amber-900/20">
	                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">Manager Warning</p>
	                        <p className="mt-1 text-sm font-semibold text-amber-900 dark:text-amber-100">
	                          {answer.retakeRequestComment || 'Please retake this question.'}
	                        </p>
	                      </div>
	                    )}
                    {/* Yes / No */}
                    <div>
                      <label className="mb-2.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        Your Response (required)
                      </label>
                      <YesNoToggle
                        value={watchAnswers?.[index]?.yesNoAnswer}
                        onChange={(v) => handleYesNoChange(index, v, watchAnswers?.[index]?.rating)}
	                        disabled={!canEditQuestion}
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
	                            disabled={!canEditQuestion}
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
                      <Controller
                        name={`answers.${index}.remarks`}
                        control={control}
                        render={({ field }) => {
                          const remarksLen = String(field.value ?? '').length;
                          return (
                            <>
                              <textarea
                                {...field}
                                value={field.value ?? ''}
                                disabled={!canEditQuestion || isRetakeMode}
                                rows={2}
                                placeholder="Add any remarks for this question…"
                                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-[#2463eb] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#dbeafe]/60 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900/40 dark:text-white dark:placeholder-slate-500 dark:focus:border-[#2463eb] dark:focus:bg-slate-900 dark:focus:ring-[#1e3a8a]/40"
                              />
                              <div className="mt-1 flex items-start justify-end">
                                <span className="shrink-0 text-xs text-slate-400">{remarksLen}/500</span>
                              </div>
                            </>
                          );
                        }}
                      />
                    </div>
	                    {isRetakeMode && answer.retakeRequested && (
	                      <div>
	                        <label className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
	                          <MessageSquare size={12} />
	                          Retake Reason (required)
	                        </label>
	                        <textarea
	                          {...register(`answers.${index}.retakeReason` as const)}
	                          rows={3}
	                          placeholder="Explain your retake response..."
	                          className="w-full resize-none rounded-xl border border-amber-200 bg-amber-50/30 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-100/60 dark:border-amber-700/60 dark:bg-amber-900/10 dark:text-white dark:placeholder-slate-500"
	                        />
	                      </div>
	                    )}
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
                          <div className="mt-1.5">
                            <YesNoRatingDisplay yesNo={answer.yesNoAnswer} rating={answer.rating} />
                          </div>
                        </div>
                        <div className="rounded-xl border border-amber-300/70 bg-white px-3.5 py-3 ring-1 ring-amber-200/50 dark:border-amber-700/60 dark:bg-amber-950/30 dark:ring-amber-900/30">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            Manager Revised Score
                          </span>
                          <div className="mt-1.5">
                            <YesNoRatingDisplay
                              yesNo={answer.managerProposedYesNo}
                              rating={answer.managerProposedRating}
                            />
                          </div>
                        </div>
                        <div className={`rounded-xl border px-3.5 py-3 ${answer.finalApprovedYesNo ? 'border-emerald-300/70 bg-white ring-1 ring-emerald-200/50 dark:border-emerald-700/60 dark:bg-emerald-950/30 dark:ring-emerald-900/30' : 'border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800/80'}`}>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${answer.finalApprovedYesNo ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                            Final Approved Score
                          </span>
                          <div className="mt-1.5">
                            <YesNoRatingDisplay
                              yesNo={answer.finalApprovedYesNo}
                              rating={answer.finalApprovedRating}
                            />
                          </div>
                        </div>
                      </div>
                      {answer.managerProposedComment && (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 dark:border-slate-600 dark:bg-slate-800/80">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Manager Comment
                          </span>
                          <p className="mt-1.5 text-base font-semibold leading-relaxed text-slate-800 dark:text-slate-200">
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
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] text-white shadow-sm">
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
                disabled={isReadOnly || isRetakeMode}
                rows={4}
                placeholder="Share any additional thoughts, context, or feedback you'd like to include…"
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-[#2463eb] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#dbeafe]/60 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900/40 dark:text-white dark:placeholder-slate-500 dark:focus:border-[#2463eb] dark:focus:bg-slate-900 dark:focus:ring-[#1e3a8a]/40"
              />
              <div className="mt-1 flex items-start justify-end">
                <span className="shrink-0 text-xs text-slate-400">{employeeRemarksLen}/500</span>
              </div>
            </div>
          </div>

          {formData && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
              <div className="px-6 py-5">
                <SelfAssessmentSignatureGrid
                  employeeName={formData.employee?.employeeName}
                  managerName={formData.managerName}
                  employeeSignatureData={formData.employeeSignatureData}
                  employeeSignatureDate={formData.employeeSignatureDate}
                  managerSignatureData={formData.managerSignatureData}
                  managerSignatureDate={formData.managerSignatureDate}
                  hrSignatureData={formData.hrSignatureData}
                  hrSignatureDate={formData.hrSignatureDate}
                  hrFinalSignatureData={formData.hrFinalSignatureData}
                  hrFinalSignatureDate={formData.hrFinalSignatureDate}
                  hrName={formData.hrName}
                  isManagerSelfAssessment={formData.employee?.roleId === 2}
                />
              </div>
            </div>
          )}
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
	                {!isRetakeMode && (
	                <button
	                  type="button"
	                  onClick={onSaveNow}
	                  disabled={autosave.isSaving || !autosave.hasPendingChanges}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-px hover:bg-slate-50 hover:shadow disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:disabled:hover:bg-slate-800"
                >
	                  <Save size={15} />
	                  {autosave.isSaving ? 'Saving...' : 'Save Draft'}
	                </button>
	                )}
	                <button
	                  type="button"
	                  onClick={() => (isRetakeMode ? setShowRetakeSubmitConfirm(true) : setShowSubmitConfirm(true))}
	                  disabled={isRetakeMode ? isSubmittingRetake : (isSubmitting || !isSubmissionComplete)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#dbeafe] ring-1 ring-[#2463eb]/20 transition-all hover:-translate-y-px hover:shadow-lg hover:shadow-[#2463eb]/30 disabled:translate-y-0 disabled:opacity-50"
                >
                  <Send size={15} />
	                  {isRetakeMode ? 'Submit Retake' : 'Submit Assessment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                    Ask HR to Unlock
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">HR will review this request</p>
                </div>
              </div>
              <button
                onClick={() => setShowUnlockModal(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Reason <span className="text-rose-500">*</span>
                </label>
                <select
                  value={unlockReasonCode}
                  onChange={(e) => {
                    const value = e.target.value as SelfAssessmentUnlockReasonCode | '';
                    setUnlockReasonCode(value);
                    if (value !== 'OTHER') setUnlockReasonText('');
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-2.5 text-sm text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100/60 dark:border-slate-600 dark:bg-slate-900/40 dark:text-white"
                >
                  <option value="">Select a reason...</option>
                  {UNLOCK_REASON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {unlockReasonCode === 'OTHER' && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Details <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={unlockReasonText}
                    onChange={(e) => setUnlockReasonText(e.target.value)}
                    rows={4}
                    placeholder="Explain what needs to be corrected..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100/60 dark:border-slate-600 dark:bg-slate-900/40 dark:text-white dark:placeholder-slate-500"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/40">
              <button
                onClick={() => setShowUnlockModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={onRequestUnlock}
                disabled={isRequestingUnlock || !unlockReasonCode || (unlockReasonCode === 'OTHER' && !unlockReasonText.trim())}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700 disabled:opacity-50"
              >
                <KeyRound size={15} />
                {isRequestingUnlock ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                onClick={() => {
                  setShowDisputeModal(false);
                  setDisputeCategory('');
                  setDisputeReason('');
                }}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div>
                <label
                  htmlFor="dispute-category"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Dispute reason <span className="text-rose-500">*</span>
                </label>
                <select
                  id="dispute-category"
                  value={disputeCategory}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDisputeCategory(v);
                    if (v !== DISPUTE_CATEGORY_OTHER) {
                      setDisputeReason('');
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-2.5 text-sm text-slate-800 focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-100/60 dark:border-slate-600 dark:bg-slate-900/40 dark:text-white"
                >
                  <option value="">Select a reason…</option>
                  {DISPUTE_CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {disputeCategory === DISPUTE_CATEGORY_OTHER && (
                <div>
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
              )}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/40">
              <button
                onClick={() => {
                  setShowDisputeModal(false);
                  setDisputeCategory('');
                  setDisputeReason('');
                }}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={onDispute}
                disabled={
                  isDisputing ||
                  !disputeCategory ||
                  (disputeCategory === DISPUTE_CATEGORY_OTHER && !disputeReason.trim())
                }
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-rose-700 disabled:opacity-50"
              >
                <Scale size={15} />
                {isDisputing ? 'Submitting…' : 'Submit Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───── Acknowledge Confirmation Modal ───── */}
      {showAcknowledgeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eff6ff] text-[#2463eb] dark:bg-[#1e3a8a]/40 dark:text-[#60a5fa]">
                  <ThumbsUp size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                    Confirm Acknowledgement
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This confirms you agree with the manager review
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAcknowledgeConfirm(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Are you sure you want to acknowledge the manager's revised assessment?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/40">
              <button
                onClick={() => setShowAcknowledgeConfirm(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={onAcknowledge}
                disabled={isAcknowledging}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#dbeafe] transition-all hover:shadow-lg hover:shadow-[#2463eb]/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ThumbsUp size={16} />
                {isAcknowledging ? 'Acknowledging…' : 'Confirm Acknowledge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───── Retake Submit Confirmation Modal ───── */}
      {showRetakeSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] text-white shadow-md shadow-[#2463eb]/20">
                  <Send size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                    Confirm Retake Submission
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRetakeSubmitConfirm(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Are you sure you want to submit your retake responses? Your manager will be notified to review them.
              </p>
              <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3.5 dark:border-amber-800/60 dark:bg-amber-900/15">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-sm leading-snug font-medium text-amber-800 dark:text-amber-200">
                  You will not be able to edit your retake answers after submission.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/40">
              <button
                type="button"
                onClick={() => setShowRetakeSubmitConfirm(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRetakeSubmit}
                disabled={isSubmittingRetake}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#dbeafe] transition-all hover:shadow-lg hover:shadow-[#2463eb]/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                {isSubmittingRetake ? 'Submitting…' : 'Confirm Submit Retake'}
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
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] text-white shadow-md shadow-[#2463eb]/20">
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
              {needsInlineSignature && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3.5 dark:border-amber-800/60 dark:bg-amber-900/20">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    Default signature is required before submission.
                  </p>
                  <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                    Sign below. Your signature will be saved as your default when you confirm submission.
                  </p>
                  <InlineDefaultSignaturePad
                    ref={inlineSignaturePadRef}
                    onDrawingChange={setHasPadDrawing}
                    disabled={isSavingInlineSignature || isSubmitting}
                  />
                </div>
              )}
              <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3.5 dark:border-amber-800/60 dark:bg-amber-900/15">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-sm leading-snug font-medium text-amber-800 dark:text-amber-200">
                  Your assessment will be shared with your manager and you will not be able to make any changes.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/40">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={
                  isSubmitting
                  || isSavingInlineSignature
                  || !isSubmissionComplete
                  || isDefaultSigLoading
                  || (needsInlineSignature && !hasPadDrawing)
                }
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#dbeafe] transition-all hover:shadow-lg hover:shadow-[#2463eb]/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                {isSavingInlineSignature ? 'Saving signature…' : isSubmitting ? 'Submitting…' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
