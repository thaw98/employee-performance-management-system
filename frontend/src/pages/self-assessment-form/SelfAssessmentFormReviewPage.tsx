import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PenLine,
  Loader2,
  Search,
  X,
  User,
  Building2,
  Clock,
  ShieldCheck,
  MessageSquare,
  ClipboardCheck,
  Send,
  Eye,
  RotateCcw,
  ArrowLeft,
  SlidersHorizontal,
  Star,
  Sparkles,
  FileCheck2,
  Edit3,
  Hourglass,
  FileDown,
  BarChart3,
  CalendarDays,
  ListChecks,
  TrendingUp,
  ChevronRight,
  BadgeCheck,
  ThumbsUp,
  ThumbsDown,
  KeyRound,
} from 'lucide-react';
import {
  useGetReviewFormsQuery,
  useGetHrReviewFormsQuery,
  useGetAllFormsForHrQuery,
  useGetFormByIdQuery,
  useManagerReviewMutation,
  useManagerRequestRetakeMutation,
  useHrRequestRetakeMutation,
  useManagerApproveRetakeMutation,
  useManagerForceChangeRetakeMutation,
  useHrReturnDisputedReviewMutation,
  useHrApproveManagerReviewMutation,
  useHrRejectManagerReviewMutation,
  useHrApproveFormMutation,
  useHrReopenFormMutation,
  useHrReturnBackMutation,
  useUnlockSelfAssessmentRequestMutation,
  SELF_ASSESSMENT_UNLOCK_HR_APPROVE_REASON_OPTIONS,
  type SelfAssessmentUnlockHrApproveReasonCode,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { getRatingOptions, isRatingValidForAnswer } from '../../features/selfAssessmentForm/ratingSystem';
import { SelfAssessmentSignatureGrid } from '../../features/selfAssessmentForm/components/SelfAssessmentSignatureGrid';
import { YesNoRatingDisplay } from '../../features/selfAssessmentForm/components/YesNoRatingDisplay';
import { exportSelfAssessmentReviewPdf } from '../../features/selfAssessmentForm/exportSelfAssessmentReviewPdf';
import { useGetDefaultSignatureQuery } from '../../features/user/userApi';
import { resolveMediaSrc } from '../../utils/mediaUrl';
import { formatDateDayMonthYear, formatDateTimeWithSeconds } from '../../utils/dateUtils';
import { RemarkCommentHeader } from '../../features/selfAssessmentForm/components/RemarkCommentHeader';
import { useSelector } from 'react-redux';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import type { RootState } from '../../app/store';

function getStatusConfig(status: string) {
  const s = status.toUpperCase();
  if (s === 'NOT_STARTED') {
    return {
      label: 'Not Started',
      bg: 'bg-slate-100 dark:bg-slate-700/60',
      text: 'text-slate-600 dark:text-slate-300',
      dot: 'bg-slate-400',
      icon: Edit3,
      cardAccent: 'border-l-slate-400',
    };
  }
  if (s === 'DRAFT') {
    return {
      label: 'Draft',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
      dot: 'bg-amber-500',
      icon: Edit3,
      cardAccent: 'border-l-amber-500',
    };
  }
  if (s === 'SUBMITTED' || s === 'EMPLOYEE_SUBMITTED') {
    return {
      label: 'Submitted',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
      dot: 'bg-blue-500',
      icon: Send,
      cardAccent: 'border-l-blue-500',
    };
  }
  if (s === 'MANAGER_REVIEWED') {
    return {
      label: 'Manager Reviewed',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
      dot: 'bg-amber-500',
      icon: ClipboardCheck,
      cardAccent: 'border-l-amber-500',
    };
  }
  if (s === 'APPROVED' || s === 'COMPLETED' || s === 'FINALIZED_LOCKED') {
    return {
      label: s === 'FINALIZED_LOCKED' ? 'Finalized' : 'Approved',
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
      cardAccent: 'border-l-emerald-500',
    };
  }
  if (s === 'PENDING_MANAGER_REVIEW') {
    return {
      label: 'Pending Manager Review',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
      dot: 'bg-blue-500',
      icon: Send,
      cardAccent: 'border-l-blue-500',
    };
  }
  if (s === 'PENDING_EMPLOYEE_REVIEW') {
    return {
      label: 'Pending Employee Review',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
      dot: 'bg-amber-500',
      icon: Hourglass,
      cardAccent: 'border-l-amber-500',
    };
  }
  if (s === 'PENDING_EMPLOYEE_RETAKE') {
    return {
      label: 'Pending Employee Retake',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
      dot: 'bg-amber-500',
      icon: RotateCcw,
      cardAccent: 'border-l-amber-500',
    };
  }
  if (s === 'PENDING_RETAKE_MANAGER_REVIEW') {
    return {
      label: 'Pending Retake Review',
      bg: 'bg-sky-50 dark:bg-sky-900/30',
      text: 'text-sky-700 dark:text-sky-400',
      dot: 'bg-sky-500',
      icon: ClipboardCheck,
      cardAccent: 'border-l-sky-500',
    };
  }
  if (s === 'PENDING_FINAL_APPROVAL') {
    return {
      label: 'Pending Final Approval',
      bg: 'bg-sky-50 dark:bg-sky-900/30',
      text: 'text-sky-700 dark:text-sky-400',
      dot: 'bg-sky-500',
      icon: ShieldCheck,
      cardAccent: 'border-l-sky-500',
    };
  }
  if (s === 'PENDING_HR_CALIBRATION_REVIEW') {
    return {
      label: 'HR Calibration Review',
      bg: 'bg-orange-50 dark:bg-orange-900/30',
      text: 'text-orange-700 dark:text-orange-400',
      dot: 'bg-orange-500',
      icon: AlertCircle,
      cardAccent: 'border-l-orange-500',
    };
  }
  if (s === 'RETURNED_BY_HR') {
    return {
      label: 'Returned by HR',
      bg: 'bg-rose-50 dark:bg-rose-900/30',
      text: 'text-rose-700 dark:text-rose-400',
      dot: 'bg-rose-500',
      icon: RotateCcw,
      cardAccent: 'border-l-rose-500',
    };
  }
  if (s === 'REOPENED') {
    return {
      label: 'Reopened',
      bg: 'bg-purple-50 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-400',
      dot: 'bg-purple-500',
      icon: RotateCcw,
      cardAccent: 'border-l-purple-500',
    };
  }
  if (s === 'REJECTED') {
    return {
      label: 'Rejected',
      bg: 'bg-red-50 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
      dot: 'bg-red-500',
      icon: XCircle,
      cardAccent: 'border-l-red-500',
    };
  }
  if (s === 'NOT_SUBMITTED') {
    return {
      label: 'NOT SUBMITTED',
      bg: 'bg-red-50 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
      dot: 'bg-red-500',
      icon: XCircle,
      cardAccent: 'border-l-red-500',
    };
  }
  return {
    label: status,
    bg: 'bg-slate-100 dark:bg-slate-700/60',
    text: 'text-slate-600 dark:text-slate-300',
    dot: 'bg-slate-400',
    icon: FileText,
    cardAccent: 'border-l-slate-400',
  };
}

const filterControlClass =
  'w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all focus:border-[#2463eb] focus:outline-none focus:ring-2 focus:ring-[#2463eb]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-[#2463eb]';

const HR_ADJUSTMENT_REJECTION_REASONS = [
  'Adjustment not supported by evidence',
  'Adjustment inconsistent with employee self-rating',
  'Adjustment exceeds calibration guidelines',
  'Manager comment insufficient or unclear',
  'Requires manager revision before approval',
] as const;

const HR_ADJUSTMENT_REJECTION_OTHER = 'Other';

const HR_RETURN_BACK_REASONS = [
  'Incomplete or missing manager ratings',
  'Manager comments insufficient or unclear',
  'Ratings inconsistent with employee self-assessment',
  'Evidence does not support proposed adjustments',
  'Requires revision before HR approval',
] as const;

const HR_RETURN_BACK_OTHER = 'Others';

function ScoreBar({ value, max = 100, color = '#2463eb', label }: { value: number; max?: number; color?: string; label?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full">
      {label && <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">{label}</p>}
      <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-700/80 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function ManagerReviewDeadlineDisplay({ date }: { date: string | null }) {
  if (!date) return null;

  const parts = date.split('-').map(Number);
  const deadline = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const isOverdue = Boolean(deadline && deadline < now);
  const isToday = Boolean(deadline && deadline.getTime() === now.getTime());
  const isSoon = Boolean(
    deadline && !isOverdue && !isToday && (deadline.getTime() - now.getTime()) < 7 * 86400000,
  );

  const containerClass = isOverdue
    ? 'border-red-200/70 bg-red-50/50 dark:border-red-800/50 dark:bg-red-900/20'
    : isToday || isSoon
      ? 'border-amber-200/70 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-900/20'
      : 'border-blue-200/70 bg-blue-50/40 dark:border-blue-800/50 dark:bg-blue-900/20';

  const textClass = isOverdue
    ? 'text-red-700 dark:text-red-300'
    : isToday || isSoon
      ? 'text-amber-700 dark:text-amber-300'
      : 'text-blue-700 dark:text-blue-300';

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 ${containerClass}`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
        isOverdue
          ? 'bg-red-100 dark:bg-red-900/40'
          : isToday || isSoon
            ? 'bg-amber-100 dark:bg-amber-900/40'
            : 'bg-blue-100 dark:bg-blue-900/40'
      }`}>
        {isOverdue ? (
          <AlertCircle size={18} className="text-red-600 dark:text-red-400" />
        ) : (
          <Clock size={18} className={isToday || isSoon ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'} />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Manager Review Deadline
        </p>
        <p className={`text-sm font-bold ${textClass}`}>
          {formatDateDayMonthYear(date)}
          {isOverdue && <span className="ml-2 text-xs font-semibold uppercase tracking-wide">Overdue</span>}
          {isToday && !isOverdue && <span className="ml-2 text-xs font-semibold uppercase tracking-wide">Due today</span>}
          {isSoon && !isToday && !isOverdue && <span className="ml-2 text-xs font-semibold uppercase tracking-wide">Due soon</span>}
        </p>
      </div>
    </div>
  );
}

export const SelfAssessmentFormReviewPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { formId: formIdParam } = useParams<{ formId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isHr = user?.roleId === 1;
  const isEmployeeDetail = location.pathname.startsWith('/employee/self-assessment-forms') || user?.roleId === 3 || user?.roleId === 4;
  const isManagerView = !isHr && !isEmployeeDetail;
  const reviewQueuePath = isHr
    ? '/hr/self-assessment/review-queue'
    : isEmployeeDetail
      ? '/employee/self-assessment-forms/history'
      : '/manager/self-assessment-forms/review-queue';
  const pageTitle = isEmployeeDetail ? 'Self Assessment Detail' : isHr ? 'HR Compliance Review' : 'Manager Review';
  const pageDescription = isEmployeeDetail
    ? 'View your submitted self-assessment details and review history.'
    : isHr
      ? 'Review and approve self-assessment forms with final authority'
      : 'Review self-assessment forms submitted by your team members';
  const backLabel = isEmployeeDetail ? 'Back to History' : 'Back to Review Queue';

  const parsedFormIdFromUrl = formIdParam ? Number(formIdParam) : null;
  const urlFormId = parsedFormIdFromUrl && Number.isFinite(parsedFormIdFromUrl) ? parsedFormIdFromUrl : null;
  const initialFormId = typeof location.state === 'object'
    && location.state !== null
    && 'formId' in location.state
    && typeof location.state.formId === 'number'
    ? location.state.formId
    : null;
  const [selectedFormId, setSelectedFormId] = useState<number | null>(urlFormId ?? initialFormId);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [managerComments, setManagerComments] = useState('');
  const [retakeComments, setRetakeComments] = useState<Record<number, string>>({});
  const [hrReturnReasonType, setHrReturnReasonType] = useState<string>(HR_RETURN_BACK_REASONS[0]);
  const [hrReturnCustomReason, setHrReturnCustomReason] = useState('');
  const [rejectReasonType, setRejectReasonType] = useState<string>(HR_ADJUSTMENT_REJECTION_REASONS[0]);
  const [rejectReason, setRejectReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockReasonCode, setUnlockReasonCode] = useState<SelfAssessmentUnlockHrApproveReasonCode | ''>('');
  const [unlockReasonText, setUnlockReasonText] = useState('');
  const [showForceChangeModal, setShowForceChangeModal] = useState(false);
  const [forceChangeAnswers, setForceChangeAnswers] = useState<Record<number, {
    yesNoAnswer: string;
    rating: number | null;
    reason: string;
  }>>({});

  const { data: managerForms, isLoading: managerFormsLoading, error: managerFormsError, refetch: refetchManagerForms } = useGetReviewFormsQuery(undefined, {
    skip: isHr || isEmployeeDetail,
  });
  const { data: hrForms, isLoading: hrFormsLoading, refetch: refetchHrForms } = useGetHrReviewFormsQuery(undefined, {
    skip: !isHr || Boolean(selectedFormId),
  });
  const { data: allForms, isLoading: allFormsLoading, refetch: refetchAllForms } = useGetAllFormsForHrQuery(undefined, {
    skip: !isHr || !selectedFormId,
  });
  const { data: selectedForm, isLoading: selectedFormLoading, refetch: refetchForm } = useGetFormByIdQuery(selectedFormId!, {
    skip: !selectedFormId,
  });

  useEffect(() => {
    if (urlFormId != null) {
      setSelectedFormId(urlFormId);
    }
  }, [urlFormId]);

  useEffect(() => {
    const refreshToken = (location.state as { notificationRefreshToken?: number } | null)?.notificationRefreshToken;
    if (!refreshToken || !selectedFormId) {
      return;
    }

    void refetchForm();
    if (isHr) {
      void (selectedFormId ? refetchAllForms() : refetchHrForms());
    } else if (!isEmployeeDetail) {
      void refetchManagerForms();
    }
  }, [
    location.state,
    selectedFormId,
    refetchForm,
    refetchManagerForms,
    refetchHrForms,
    refetchAllForms,
    isHr,
    isEmployeeDetail,
  ]);

  const [managerReview, { isLoading: isApprovingReview }] = useManagerReviewMutation();
  const [managerRequestRetake, { isLoading: isRequestingRetake }] = useManagerRequestRetakeMutation();
  const [hrRequestRetake, { isLoading: isRequestingHrRetake }] = useHrRequestRetakeMutation();
  const [managerApproveRetake, { isLoading: isApprovingRetake }] = useManagerApproveRetakeMutation();
  const [managerForceChangeRetake, { isLoading: isForceChangingRetake }] = useManagerForceChangeRetakeMutation();
  const [hrReturnDisputedReview, { isLoading: isHrReturningDispute }] = useHrReturnDisputedReviewMutation();
  const [hrReturnBack, { isLoading: isHrReturningBack }] = useHrReturnBackMutation();
  const [hrApproveManagerReview, { isLoading: isHrApproving }] = useHrApproveManagerReviewMutation();
  const [hrRejectManagerReview, { isLoading: isHrRejecting }] = useHrRejectManagerReviewMutation();
  const [hrApproveForm, { isLoading: isApproving }] = useHrApproveFormMutation();
  const [hrReopenForm, { isLoading: isReopening }] = useHrReopenFormMutation();
  const [unlockSelfAssessmentRequest, { isLoading: isUnlocking }] = useUnlockSelfAssessmentRequestMutation();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showHrReturnModal, setShowHrReturnModal] = useState(false);
  const [showManagerApproveModal, setShowManagerApproveModal] = useState(false);
  const [showManagerApproveRetakeModal, setShowManagerApproveRetakeModal] = useState(false);
  const [showManagerRetakeModal, setShowManagerRetakeModal] = useState(false);
  const [approvalMode, setApprovalMode] = useState<'adjustment' | 'final'>('final');
  const { data: defaultSigResponse, isLoading: isDefaultSigLoading } = useGetDefaultSignatureQuery(undefined, {
    skip: isEmployeeDetail,
  });
  const defaultSignature = defaultSigResponse?.data ?? null;
  const hasDefaultSignature = Boolean(defaultSignature);
  const isMissingDefaultSignature = !isDefaultSigLoading && !hasDefaultSignature;
  const portalRoot = typeof document !== 'undefined' ? document.body : null;
  const isManagerSelfAssessment = selectedForm?.employee?.roleId === 2;
  const isRetakeRequesting = isRequestingRetake || isRequestingHrRetake;
  const canHrRequestManagerRetake = isHr
    && isManagerSelfAssessment
    && selectedForm?.status === 'PENDING_FINAL_APPROVAL'
    && !selectedForm.retakeRequestUsed;
  const canHrScheduleManagerMeeting = isHr
    && isManagerSelfAssessment
    && selectedForm?.status === 'PENDING_FINAL_APPROVAL'
    && Boolean(selectedForm.retakeSubmittedAt);
  const canHrReturnBack = isHr
    && !isEmployeeDetail
    && (selectedForm?.status === 'PENDING_FINAL_APPROVAL'
      || selectedForm?.status === 'PENDING_HR_CALIBRATION_REVIEW');
  const isManagerReviewActionable = selectedForm?.status === 'SUBMITTED'
    || selectedForm?.status === 'PENDING_MANAGER_REVIEW'
    || selectedForm?.status === 'RETURNED_BY_HR';

  const forms = isEmployeeDetail ? [] : isHr ? (selectedFormId ? allForms : hrForms) : managerForms;
  const isLoading = selectedFormLoading || (isEmployeeDetail ? false : isHr ? (selectedFormId ? allFormsLoading : hrFormsLoading) : managerFormsLoading);
  const managerErrorMessage = !isHr && !isEmployeeDetail && managerFormsError && typeof managerFormsError === 'object' && 'data' in managerFormsError
    ? (managerFormsError as any)?.data?.message || 'Unable to load review forms for this manager account.'
    : null;

  const filteredForms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return forms ?? [];
    return (forms ?? []).filter((form: any) => {
      const hay = [
        form.employee?.employeeName,
        form.employee?.departmentName,
        form.employee?.positionName,
        form.title,
        form.status,
        form.employee?.employeeId,
      ]
        .join('\n')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [forms, searchQuery]);

  const canHrReopenForEmployee = useMemo(() => {
    const s = (selectedForm?.status ?? '').toUpperCase();
    return s === 'APPROVED' || s === 'COMPLETED' || s === 'FINALIZED_LOCKED';
  }, [selectedForm?.status]);
  const pendingUnlockRequest = selectedForm?.pendingUnlockRequest ?? null;
  const canHrUnlockPendingRequest = isHr && !isEmployeeDetail && pendingUnlockRequest?.status === 'PENDING';

  const hasPendingManagerAdjustments = useMemo(
    () => selectedForm?.answers?.some(
      (a) => a.managerProposedYesNo && a.hrAdjustmentApproved == null,
    ) ?? false,
    [selectedForm?.answers],
  );

  useEffect(() => {
    if (selectedForm?.status !== 'PENDING_RETAKE_MANAGER_REVIEW') {
      setForceChangeAnswers({});
      return;
    }
    const next: Record<number, { yesNoAnswer: string; rating: number | null; reason: string }> = {};
    selectedForm.answers
      .filter(answer => answer.retakeRequested)
      .forEach(answer => {
        next[answer.id] = {
          yesNoAnswer: answer.finalApprovedYesNo ?? answer.retakeYesNoAnswer ?? answer.yesNoAnswer ?? '',
          rating: answer.finalApprovedRating ?? answer.retakeRating ?? answer.rating ?? null,
          reason: answer.managerForceChangeReason ?? '',
        };
      });
    setForceChangeAnswers(next);
  }, [selectedForm?.id, selectedForm?.status, selectedForm?.answers]);

  const handleRetakeCommentChange = (answerId: number, comment: string) => {
    setRetakeComments(prev => ({ ...prev, [answerId]: comment }));
  };

  const handleToggleRetakeQuestion = (answerId: number, checked: boolean) => {
    setRetakeComments(prev => {
      const next = { ...prev };
      if (checked) {
        next[answerId] = next[answerId] ?? '';
      } else {
        delete next[answerId];
      }
      return next;
    });
  };

  const requireManagerReviewComments = () => {
    if (!managerComments.trim()) {
      toast.error('Comments are required');
      return false;
    }
    return true;
  };

  const handleApproveReview = async () => {
    if (!selectedFormId) return;
    if (!requireManagerReviewComments()) return;
    if (!hasDefaultSignature) {
      toast.error('Set a default signature in Signature Settings before approving.');
      return;
    }

    try {
      await managerReview({
        formId: selectedFormId,
        request: {
          comments: managerComments.trim(),
          adjustments: [],
        },
      }).unwrap();
      toast.success('Review approved. HR has been notified for final approval.');
      setShowManagerApproveModal(false);
      setManagerComments('');
      setRetakeComments({});
      setShowAdjustments(false);
      refetchForm();
      if (!isEmployeeDetail) {
        void refetchManagerForms();
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to approve review');
    }
  };

  const buildRetakeRequests = () =>
    Object.entries(retakeComments).map(([answerId, comment]) => ({
      answerId: Number(answerId),
      comment: comment.trim(),
    }));

  const openManagerRetakeModal = () => {
    if (!requireManagerReviewComments()) return;
    const retakeRequests = buildRetakeRequests();
    if (retakeRequests.length === 0) {
      toast.error('Select at least one question for retake');
      return;
    }
    if (retakeRequests.some((r) => !r.comment)) {
      toast.error('Add a warning comment for each selected question');
      return;
    }
    setShowManagerRetakeModal(true);
  };

  const handleSubmitRetakeRequest = async () => {
    if (!selectedFormId) return;
    if (!requireManagerReviewComments()) return;
    if (!hasDefaultSignature) {
      toast.error('Set a default signature in Signature Settings before requesting a retake.');
      return;
    }

    const retakeRequests = buildRetakeRequests();
    if (retakeRequests.length === 0) {
      toast.error('Select at least one question for retake');
      return;
    }
    if (retakeRequests.some((r) => !r.comment)) {
      toast.error('Add a warning comment for each selected question');
      return;
    }

    try {
      if (isHr && isManagerSelfAssessment) {
        await hrRequestRetake({
          formId: selectedFormId,
          request: { comments: managerComments.trim(), retakeRequests },
        }).unwrap();
      } else {
        await managerRequestRetake({
          formId: selectedFormId,
          request: { comments: managerComments.trim(), retakeRequests },
        }).unwrap();
      }
      toast.success(isHr && isManagerSelfAssessment
        ? 'Retake requested. The manager has been notified.'
        : 'Retake requested. The employee has been notified.');
      setShowManagerRetakeModal(false);
      setManagerComments('');
      setRetakeComments({});
      setShowAdjustments(false);
      refetchForm();
      if (!isEmployeeDetail) {
        void refetchManagerForms();
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to request retake');
    }
  };

  const handleManagerApproveRetake = async () => {
    if (!selectedFormId) return;
    try {
      await managerApproveRetake({ formId: selectedFormId, request: { comments: managerComments || undefined } }).unwrap();
      toast.success('Retake approved');
      setShowManagerApproveRetakeModal(false);
      refetchForm();
      if (!isEmployeeDetail) {
        void refetchManagerForms();
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to approve retake');
    }
  };

  const handleForceChangeAnswer = (
    answerId: number,
    patch: Partial<{ yesNoAnswer: string; rating: number | null; reason: string }>,
  ) => {
    setForceChangeAnswers(prev => ({
      ...prev,
      [answerId]: {
        yesNoAnswer: prev[answerId]?.yesNoAnswer ?? '',
        rating: prev[answerId]?.rating ?? null,
        reason: prev[answerId]?.reason ?? '',
        ...patch,
      },
    }));
  };

  const hasForceChangeDifference = (answer: any) => {
    const current = forceChangeAnswers[answer.id];
    if (!current) return false;
    return current.yesNoAnswer !== (answer.retakeYesNoAnswer ?? '')
      || current.rating !== (answer.retakeRating ?? null);
  };

  const handleManagerForceChangeRetake = async () => {
    if (!selectedFormId || !selectedForm) return;
    const flaggedAnswers = selectedForm.answers.filter(answer => answer.retakeRequested);
    if (flaggedAnswers.length === 0) {
      toast.error('No warned questions are available for manager override');
      return;
    }

    const answers = flaggedAnswers.map(answer => {
      const finalValue = forceChangeAnswers[answer.id];
      return {
        answerId: answer.id,
        finalYesNoAnswer: finalValue?.yesNoAnswer ?? '',
        finalRating: finalValue?.rating ?? null,
        reason: finalValue?.reason?.trim() || null,
      };
    });

    if (answers.some(answer => !answer.finalYesNoAnswer || answer.finalRating == null)) {
      toast.error('Choose a final answer and rating for every warned question');
      return;
    }
    if (flaggedAnswers.some(answer => {
      const finalValue = forceChangeAnswers[answer.id];
      return finalValue
        && !isRatingValidForAnswer(selectedForm.ratingSystem, finalValue.yesNoAnswer, finalValue.rating, selectedForm.tenPointYesMinRating);
    })) {
      toast.error('Choose a valid rating for each final answer');
      return;
    }
    if (flaggedAnswers.some(answer => hasForceChangeDifference(answer) && !forceChangeAnswers[answer.id]?.reason.trim())) {
      toast.error('Add a reason for each changed warned question');
      return;
    }

    try {
      await managerForceChangeRetake({
        formId: selectedFormId,
        request: {
          answers: answers.map(answer => ({
            answerId: answer.answerId,
            finalYesNoAnswer: answer.finalYesNoAnswer,
            finalRating: answer.finalRating ?? 0,
            reason: answer.reason,
          })),
          comments: managerComments || undefined,
        },
      }).unwrap();
      toast.success('Manager override sent to HR for final approval');
      setShowForceChangeModal(false);
      refetchForm();
      if (!isEmployeeDetail) {
        void refetchManagerForms();
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to send manager override');
    }
  };

  const handleScheduleMeeting = () => {
    if (!selectedForm) return;
    const basePath = isHr ? '/hr/meetings' : '/manager/meetings';
    const params = new URLSearchParams({
      section: 'schedule',
      employeeId: String(selectedForm.employee?.id ?? ''),
    });
    navigate(`${basePath}?${params.toString()}`, {
      state: { employeeId: selectedForm.employee?.id, formId: selectedForm.id },
    });
  };

  const resolvedHrReturnReason =
    hrReturnReasonType === HR_RETURN_BACK_OTHER ? hrReturnCustomReason.trim() : hrReturnReasonType;

  const handleHrReturnDisputedReview = async () => {
    if (!selectedFormId || !resolvedHrReturnReason) {
      toast.error('Select a return reason before sending back to the manager.');
      return;
    }

    try {
      await hrReturnDisputedReview({
        formId: selectedFormId,
        request: { reason: resolvedHrReturnReason },
      }).unwrap();
      toast.success('Review returned to manager for revision');
      setHrReturnReasonType(HR_RETURN_BACK_REASONS[0]);
      setHrReturnCustomReason('');
      refetchForm();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to return review to manager');
    }
  };

  const resetHrReturnModal = () => {
    setHrReturnReasonType(HR_RETURN_BACK_REASONS[0]);
    setHrReturnCustomReason('');
    setShowHrReturnModal(false);
  };

  const handleHrReturnBack = async () => {
    if (!selectedFormId || !resolvedHrReturnReason) {
      toast.error(
        hrReturnReasonType === HR_RETURN_BACK_OTHER
          ? 'Enter a custom return reason before sending back to the manager.'
          : 'Select a return reason before sending back to the manager.',
      );
      return;
    }

    try {
      await hrReturnBack({
        formId: selectedFormId,
        request: {
          returnReason: resolvedHrReturnReason,
        },
      }).unwrap();
      toast.success('Form returned to manager');
      resetHrReturnModal();
      refetchForm();
      void refetchHrForms();
      void refetchAllForms();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to return form to manager');
    }
  };

  const handleHrApproveAdjustment = async () => {
    if (!selectedFormId || !hasDefaultSignature) {
      toast.error('Set a default signature in Signature Settings before approving.');
      return;
    }

    try {
      await hrApproveManagerReview({
        formId: selectedFormId,
        request: {},
      }).unwrap();
      toast.success('Manager adjustments approved');
      setShowApprovalModal(false);
      refetchForm();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to approve adjustments');
    }
  };

  const resetRejectModal = () => {
    setRejectReasonType(HR_ADJUSTMENT_REJECTION_REASONS[0]);
    setRejectReason('');
    setShowRejectModal(false);
  };

  const resolvedRejectReason =
    rejectReasonType === HR_ADJUSTMENT_REJECTION_OTHER ? rejectReason.trim() : rejectReasonType;

  const handleHrRejectAdjustment = async () => {
    if (!selectedFormId || !resolvedRejectReason || !hasDefaultSignature) {
      toast.error(
        rejectReasonType === HR_ADJUSTMENT_REJECTION_OTHER
          ? 'Enter a custom rejection reason and set a default signature in Signature Settings.'
          : 'Select a rejection reason and set a default signature in Signature Settings.',
      );
      return;
    }

    try {
      await hrRejectManagerReview({
        formId: selectedFormId,
        request: { rejectionReason: resolvedRejectReason },
      }).unwrap();
      toast.success('Manager adjustments rejected');
      resetRejectModal();
      refetchForm();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to reject adjustments');
    }
  };

  const handleConfirmApproval = () => {
    if (approvalMode === 'adjustment') {
      void handleHrApproveAdjustment();
      return;
    }
    void handleHrApproveForm();
  };

  const handleHrApproveForm = async () => {
    if (!selectedFormId || !hasDefaultSignature) {
      toast.error('Set a default signature in Signature Settings before approving.');
      return;
    }

    try {
      await hrApproveForm({
        formId: selectedFormId,
        request: {},
      }).unwrap();
      toast.success('Form approved');
      setShowApprovalModal(false);
      refetchForm();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to approve form');
    }
  };

  const handleHrReopenForm = async () => {
    if (!selectedFormId || !hasDefaultSignature) {
      toast.error('Set a default signature in Signature Settings before reopening.');
      return;
    }

    try {
      await hrReopenForm({
        formId: selectedFormId,
        request: {},
      }).unwrap();
      toast.success('Form reopened for employee revision');
      refetchForm();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to reopen form');
    }
  };

  const closeUnlockModal = () => {
    setShowUnlockModal(false);
    setUnlockReasonCode('');
    setUnlockReasonText('');
  };

  const handleHrUnlockRequest = async () => {
    if (!pendingUnlockRequest || !unlockReasonCode) {
      toast.error('Select an HR reason');
      return;
    }
    if (unlockReasonCode === 'OTHER' && !unlockReasonText.trim()) {
      toast.error('Enter HR reason details');
      return;
    }

    try {
      await unlockSelfAssessmentRequest({
        requestId: pendingUnlockRequest.id,
        request: {
          reasonCode: unlockReasonCode,
          reasonText: unlockReasonCode === 'OTHER' ? unlockReasonText.trim() : null,
        },
      }).unwrap();
      toast.success('Form unlocked');
      closeUnlockModal();
      refetchForm();
      if (isHr) {
        void (selectedFormId ? refetchAllForms() : refetchHrForms());
      }
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'data' in error
        ? (error as { data?: { message?: string } }).data?.message
        : undefined;
      toast.error(message || 'Failed to unlock form');
    }
  };

  const handleExportPdf = async () => {
    if (!selectedForm) return;

    try {
      setIsExportingPdf(true);
      await exportSelfAssessmentReviewPdf(selectedForm);
      toast.success('PDF exported');
    } catch {
      toast.error('Failed to export PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const timelineSteps = useMemo(() => {
    if (!selectedForm) return [];
    const steps: { label: string; date?: string; done: boolean; active: boolean }[] = [];
    const s = (selectedForm.status ?? '').toUpperCase();
    steps.push({ label: 'Created', done: true, active: false });
    if (selectedForm.createdDate) {
      steps[0].date = formatDateTimeWithSeconds(selectedForm.createdDate);
    }
    const hasSubmitted = ['SUBMITTED', 'EMPLOYEE_SUBMITTED', 'PENDING_MANAGER_REVIEW', 'MANAGER_REVIEWED', 'PENDING_EMPLOYEE_REVIEW', 'PENDING_FINAL_APPROVAL', 'PENDING_HR_CALIBRATION_REVIEW', 'RETURNED_BY_HR', 'APPROVED', 'COMPLETED', 'FINALIZED_LOCKED'].includes(s);
    steps.push({
      label: 'Employee Submitted',
      done: hasSubmitted,
      active: s === 'SUBMITTED' || s === 'EMPLOYEE_SUBMITTED',
      date: selectedForm.submittedDate ? formatDateTimeWithSeconds(selectedForm.submittedDate) : undefined,
    });
    const hasMgrReview = ['MANAGER_REVIEWED', 'PENDING_EMPLOYEE_REVIEW', 'PENDING_FINAL_APPROVAL', 'PENDING_HR_CALIBRATION_REVIEW', 'RETURNED_BY_HR', 'APPROVED', 'COMPLETED', 'FINALIZED_LOCKED'].includes(s);
    steps.push({
      label: 'Manager Review',
      done: hasMgrReview,
      active: s === 'MANAGER_REVIEWED' || s === 'PENDING_MANAGER_REVIEW',
      date: selectedForm.managerSignatureDate ? formatDateTimeWithSeconds(selectedForm.managerSignatureDate) : undefined,
    });
    const hasFinal = ['APPROVED', 'COMPLETED', 'FINALIZED_LOCKED'].includes(s);
    steps.push({
      label: 'HR Final Approval',
      done: hasFinal,
      active: s === 'PENDING_FINAL_APPROVAL' || s === 'PENDING_HR_CALIBRATION_REVIEW',
      date: selectedForm.hrFinalSignatureDate ? formatDateTimeWithSeconds(selectedForm.hrFinalSignatureDate) : undefined,
    });
    return steps;
  }, [selectedForm]);

  if (isLoading) {
    return (
      <div className="min-h-screen px-6 py-6 md:px-10">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-9 w-80 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  const selectedStatusConfig = selectedForm ? getStatusConfig(selectedForm.status) : null;
  const SelectedStatusIcon = selectedStatusConfig?.icon ?? FileText;

  return (
    <div className="min-h-screen px-6 py-6 md:px-10 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate(reviewQueuePath)}
        className="group mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#2463eb] dark:text-slate-400 dark:hover:text-[#60a5fa]"
      >
        <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
        {backLabel}
      </button>

      <nav className="mb-5 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <Link to={isHr ? '/hr/dashboard' : isEmployeeDetail ? '/employee/dashboard' : '/manager/dashboard'} className="text-[#2463eb] dark:text-[#60a5fa] font-medium hover:underline">Home</Link>
        <ChevronRight size={10} className="opacity-50" />
        <span>Self Assessment</span>
        <ChevronRight size={10} className="opacity-50" />
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {pageTitle}
        </span>
        {selectedForm && (
          <>
            <ChevronRight size={10} className="opacity-50" />
            <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[140px]">
              {selectedForm.employee?.employeeName}
            </span>
          </>
        )}
      </nav>

      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] shadow-lg shadow-[#2463eb]/20">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {pageTitle}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 max-w-lg">
              {pageDescription}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {canHrUnlockPendingRequest && (
            <button
              type="button"
              onClick={() => setShowUnlockModal(true)}
              disabled={isUnlocking}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {isUnlocking ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
              Unlock
            </button>
          )}
          {selectedForm && (
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-3.5 py-2 text-sm font-bold text-white shadow-md shadow-[#2463eb]/25 transition hover:shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none dark:shadow-[#2463eb]/15"
            >
              {isExportingPdf ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
              Export PDF
            </button>
          )}
          {!isEmployeeDetail && (
            <button
              type="button"
              onClick={() => navigate(reviewQueuePath)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <FileText size={14} />
Review Submissions
            </button>
          )}
        </div>
      </div>

      {managerErrorMessage && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/70 dark:bg-amber-900/30 dark:text-amber-200">
          {managerErrorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {selectedFormId === -1 && (
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700/60">
                  <Sparkles size={18} className="text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Forms Queue</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {filteredForms.length} form{(filteredForms ?? []).length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 pt-4 pb-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  type="search"
                  placeholder="Search forms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${filterControlClass} pl-10 text-sm py-2`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="px-3 pb-4 pt-2 space-y-1.5 max-h-[calc(100vh-380px)] overflow-y-auto">
              {filteredForms && filteredForms.length > 0 ? (
                filteredForms.map((form: any, index: number) => {
                  const cfg = getStatusConfig(form.status);
                  const isActive = selectedFormId === form.id;
                  return (
                    <button
                      key={form.id}
                      type="button"
                      onClick={() => setSelectedFormId(form.id)}
                      className={`group w-full text-left rounded-xl border-l-[3px] p-3.5 transition-all duration-200 animate-fade-in-up ${
                        isActive
                          ? 'border-l-[#2463eb] bg-[#2463eb]/[0.04] shadow-sm dark:bg-[#2463eb]/[0.08]'
                          : 'border-l-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/40'
                      }`}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            isActive
                              ? 'bg-[#2463eb]/10 text-[#2463eb] dark:bg-[#2463eb]/20 dark:text-[#60a5fa]'
                              : 'bg-slate-100 text-slate-400 dark:bg-slate-700/60 dark:text-slate-500'
                          }`}>
                            <User size={13} />
                          </div>
                          <div className="min-w-0">
                            <p className={`truncate text-sm font-semibold max-w-[140px] ${
                              isActive
                                ? 'text-[#2463eb] dark:text-[#60a5fa]'
                                : 'text-slate-900 dark:text-white'
                            }`}>
                              {form.employee?.employeeName}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pl-9">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="mt-1.5 pl-9">
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                          {form.employee?.departmentName} &middot; {form.employee?.positionName}
                        </p>
                      </div>
                      {form.totalScore !== null && (
                        <div className="mt-1.5 pl-9 flex items-center gap-1.5">
                          <Star size={10} className="text-amber-500 fill-amber-500" />
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            {form.totalScore?.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700/60">
                    <FileText size={22} className="text-slate-300 dark:text-slate-500" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {searchQuery ? 'No forms match your search' : 'No forms to review'}
                  </p>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-xs font-semibold text-[#2463eb] dark:text-[#60a5fa] hover:underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        <div className={selectedFormId === -1 ? 'lg:col-span-8 xl:col-span-9 space-y-5' : 'lg:col-span-12 space-y-5'}>
          {selectedForm ? (
            <>
              {isManagerView && selectedForm.managerReviewDeadlineDate && (
                <ManagerReviewDeadlineDisplay date={selectedForm.managerReviewDeadlineDate} />
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
                <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                      <ListChecks size={15} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Questions</span>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{selectedForm.answers?.length ?? 0}</p>
                </div>

                <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30">
                      <Star size={15} className="text-amber-500" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Self Score</span>
                  </div>
                  {selectedForm.totalScore != null ? (
                    <div>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{selectedForm.totalScore.toFixed(1)}%</p>
                      <div className="mt-1.5">
                        <ScoreBar value={selectedForm.totalScore} color="#f59e0b" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-2xl font-extrabold text-slate-300 dark:text-slate-600">&mdash;</p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-900/30">
                      <TrendingUp size={15} className="text-orange-500" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Mgr Revised</span>
                  </div>
                  {selectedForm.managerRevisedTotalScore != null ? (
                    <div>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{selectedForm.managerRevisedTotalScore.toFixed(1)}%</p>
                      <div className="mt-1.5">
                        <ScoreBar value={selectedForm.managerRevisedTotalScore} color="#f97316" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-2xl font-extrabold text-slate-300 dark:text-slate-600">&mdash;</p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                      <BadgeCheck size={15} className="text-emerald-500" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Final Score</span>
                  </div>
                  {selectedForm.finalApprovedTotalScore != null ? (
                    <div>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{selectedForm.finalApprovedTotalScore.toFixed(1)}%</p>
                      <div className="mt-1.5">
                        <ScoreBar value={selectedForm.finalApprovedTotalScore} color="#10b981" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-2xl font-extrabold text-slate-300 dark:text-slate-600">&mdash;</p>
                  )}
                </div>
              </div>

              {selectedForm.totalScore != null && (
                <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 size={15} className="text-[#2463eb] dark:text-[#60a5fa]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Score Comparison</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-24 text-xs font-semibold text-amber-600 dark:text-amber-400">Self</span>
                      <div className="flex-1">
                        <ScoreBar value={selectedForm.totalScore} color="#f59e0b" />
                      </div>
                      <span className="w-14 text-right text-sm font-bold tabular-nums text-slate-700 dark:text-slate-200">{selectedForm.totalScore.toFixed(1)}%</span>
                    </div>
                    {selectedForm.managerRevisedTotalScore != null && (
                      <div className="flex items-center gap-3">
                        <span className="w-24 text-xs font-semibold text-orange-600 dark:text-orange-400">Manager</span>
                        <div className="flex-1">
                          <ScoreBar value={selectedForm.managerRevisedTotalScore} color="#f97316" />
                        </div>
                        <span className="w-14 text-right text-sm font-bold tabular-nums text-slate-700 dark:text-slate-200">{selectedForm.managerRevisedTotalScore.toFixed(1)}%</span>
                      </div>
                    )}
                    {selectedForm.finalApprovedTotalScore != null && (
                      <div className="flex items-center gap-3">
                        <span className="w-24 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Final</span>
                        <div className="flex-1">
                          <ScoreBar value={selectedForm.finalApprovedTotalScore} color="#10b981" />
                        </div>
                        <span className="w-14 text-right text-sm font-bold tabular-nums text-slate-700 dark:text-slate-200">{selectedForm.finalApprovedTotalScore.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                  {selectedForm.ratingCategory && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/30">
                      <Star size={13} className="text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Rating Category</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedForm.ratingCategory}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={17} className="text-[#2463eb] dark:text-[#60a5fa]" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Review Timeline</h3>
                </div>
                <div className="flex items-center">
                  {timelineSteps.map((step, i) => (
                    <React.Fragment key={step.label}>
                      <div className="flex flex-col items-center min-w-0">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                          step.done
                            ? 'border-emerald-500 bg-emerald-500'
                            : step.active
                              ? 'border-[#2463eb] bg-[#2463eb]/10 dark:bg-[#2463eb]/20'
                              : 'border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800'
                        }`}>
                          {step.done ? (
                            <CheckCircle2 size={15} className="text-white" />
                          ) : step.active ? (
                            <div className="h-2.5 w-2.5 rounded-full bg-[#2463eb]" />
                          ) : (
                            <div className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                          )}
                        </div>
                        <p className={`mt-2 text-xs font-bold text-center leading-snug ${
                          step.done ? 'text-emerald-600 dark:text-emerald-400' : step.active ? 'text-[#2463eb] dark:text-[#60a5fa]' : 'text-slate-400 dark:text-slate-500'
                        }`}>
                          {step.label}
                        </p>
                        {step.date && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug text-center px-0.5">{step.date}</p>
                        )}
                      </div>
                      {i < timelineSteps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${
                          step.done ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-slate-200 dark:bg-slate-700'
                        }`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {(selectedForm.employeeRemarks || selectedForm.overallRemarks || selectedForm.managerComments || selectedForm.employeeDisputedAt || selectedForm.hrReviewReason || selectedForm.hrReturnComments || (!isHr && !isEmployeeDetail && selectedForm.status === 'PENDING_RETAKE_MANAGER_REVIEW')) && (
                <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '140ms' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare size={15} className="text-[#2463eb] dark:text-[#60a5fa]" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Remarks & Comments</h3>
                  </div>
                  <div className="space-y-3">
                    {(selectedForm.hrReviewReason || selectedForm.hrReturnComments) && (
                      <div className="rounded-xl border border-orange-200/70 bg-orange-50/40 p-4 dark:border-orange-700/50 dark:bg-orange-900/15">
                        <RemarkCommentHeader
                          title={selectedForm.status === 'RETURNED_BY_HR' ? 'HR Return Reason' : 'HR Remarks'}
                          dateTime={selectedForm.hrReviewReasonAt}
                          titleClassName="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400"
                          dateClassName="text-xs font-semibold tabular-nums text-orange-700 dark:text-orange-300"
                          leading={<ShieldCheck size={13} className="text-orange-500 dark:text-orange-400" />}
                        />
                        {selectedForm.hrReviewReason && (
                          <p className="text-sm text-orange-700 dark:text-orange-200 leading-relaxed">{selectedForm.hrReviewReason}</p>
                        )}
                        {selectedForm.hrReturnComments && (
                          <p className="mt-2 text-sm text-orange-700 dark:text-orange-200 leading-relaxed">
                            <span className="font-bold">Comments:</span> {selectedForm.hrReturnComments}
                          </p>
                        )}
                      </div>
                    )}
                    {selectedForm.employeeRemarks && (
                      <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 dark:border-slate-700/50 dark:bg-slate-800/30">
                        <RemarkCommentHeader
                          title="Employee Remarks"
                          dateTime={selectedForm.submittedDate ?? selectedForm.employeeSignatureDate}
                          leading={<User size={13} className="text-slate-400" />}
                        />
                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{selectedForm.employeeRemarks}</p>
                      </div>
                    )}
                    {selectedForm.overallRemarks && (
                      <div className="rounded-xl border border-violet-200/70 bg-violet-50/40 p-4 dark:border-violet-700/50 dark:bg-violet-900/15">
                        <RemarkCommentHeader
                          title="Overall Remarks"
                          dateTime={selectedForm.submittedDate ?? selectedForm.employeeSignatureDate}
                          titleClassName="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400"
                          dateClassName="text-xs font-semibold tabular-nums text-violet-700 dark:text-violet-300"
                          leading={<MessageSquare size={13} className="text-violet-500 dark:text-violet-400" />}
                        />
                        <p className="text-sm text-violet-800 dark:text-violet-100 leading-relaxed">{selectedForm.overallRemarks}</p>
                      </div>
                    )}
                    {selectedForm.managerComments && (
                      <div className="rounded-xl border border-blue-200/70 bg-blue-50/40 p-4 dark:border-blue-700/50 dark:bg-blue-900/15">
                        <RemarkCommentHeader
                          title="Manager Comments"
                          dateTime={selectedForm.managerSignatureDate}
                          titleClassName="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400"
                          dateClassName="text-xs font-semibold tabular-nums text-blue-700 dark:text-blue-300"
                          leading={<ClipboardCheck size={13} className="text-blue-500 dark:text-blue-400" />}
                        />
                        {selectedForm.managerName && (
                          <p className="mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500">by {selectedForm.managerName}</p>
                        )}
                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{selectedForm.managerComments}</p>
                      </div>
                    )}
                    {selectedForm.employeeDisputedAt && (
                      <div className="rounded-xl border border-rose-200/70 bg-rose-50/40 p-4 dark:border-rose-700/50 dark:bg-rose-900/15">
                        <RemarkCommentHeader
                          title="Employee Dispute"
                          dateTime={selectedForm.employeeDisputedAt}
                          titleClassName="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400"
                          dateClassName="text-xs font-semibold tabular-nums text-rose-700 dark:text-rose-300"
                          leading={<AlertCircle size={13} className="text-rose-500 dark:text-rose-400" />}
                        />
                        <p className="text-sm text-rose-700 dark:text-rose-200 leading-relaxed">{selectedForm.employeeDisputeReason}</p>
                      </div>
                    )}
                    {!isHr && !isEmployeeDetail && selectedForm.status === 'PENDING_RETAKE_MANAGER_REVIEW' && (
                      <div className="overflow-hidden rounded-xl border border-emerald-200/70 bg-emerald-50/30 dark:border-emerald-700/50 dark:bg-emerald-900/15">
                        <div className="flex items-center gap-3 border-b border-emerald-100 px-4 py-3 dark:border-emerald-800/50">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 shadow-md shadow-emerald-500/20">
                            <ClipboardCheck size={16} className="text-white" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Review Retake</h4>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Approve the submitted retake or schedule a meeting</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-3 p-4">
	                          <button
	                            type="button"
	                            onClick={handleScheduleMeeting}
	                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/60"
	                          >
	                            <CalendarDays size={16} />
	                            Schedule Meeting
	                          </button>
	                          <button
	                            type="button"
	                            onClick={() => setShowForceChangeModal(true)}
	                            className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-bold text-amber-800 transition-all hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-200 dark:hover:bg-amber-900/35"
	                          >
	                            <PenLine size={16} />
	                            Manager Override
	                          </button>
	                          <button
                            type="button"
                            onClick={() => setShowManagerApproveRetakeModal(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl"
                          >
                            <CheckCircle2 size={16} />
                            Approve
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-[#2463eb]/18 bg-white shadow-sm dark:border-[#60a5fa]/28 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
                <div className="relative border-b border-slate-100 dark:border-slate-700/60">
                  <div className="relative px-6 py-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 border border-slate-200/80 dark:border-slate-600/60">
                          <User size={20} className="text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                            {selectedForm.employee?.employeeName}
                          </h2>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Building2 size={13} />
                              {selectedForm.employee?.departmentName}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <ClipboardCheck size={13} />
                              {selectedForm.employee?.positionName}
                            </span>
                            {selectedForm.assessmentDate && (
                              <span className="flex items-center gap-1.5">
                                <CalendarDays size={13} />
                                {formatDateDayMonthYear(selectedForm.assessmentDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${selectedStatusConfig?.bg} ${selectedStatusConfig?.text}`}>
                          <SelectedStatusIcon size={13} />
                          {selectedStatusConfig?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2463eb]/10 dark:bg-[#2463eb]/20">
                      <FileCheck2 size={16} className="text-[#2463eb] dark:text-[#60a5fa]" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Assessment Answers</h3>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-700/60 dark:text-slate-400">
                      {selectedForm.answers?.length ?? 0} questions
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedForm.answers?.map((answer: any, index: number) => (
                      <div
                        key={answer.id}
                        className="group relative rounded-xl border border-[#2463eb]/22 bg-white p-4 transition-all hover:border-[#2463eb]/40 hover:shadow-sm dark:border-[#60a5fa]/32 dark:bg-slate-900/40 dark:hover:border-[#60a5fa]/50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-[#2463eb]/18 dark:border-[#60a5fa]/28 dark:bg-slate-800/60">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2.5 leading-relaxed">
                              {answer.questionText}
                            </p>
                            <div className="flex flex-wrap items-center gap-2.5">
                              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-1.5 dark:border-slate-700/40 dark:bg-slate-800/50">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Response</span>
                                <span className={`h-3.5 w-px bg-slate-200 dark:bg-slate-700`} />
                                <span className={`text-sm font-bold ${
                                  answer.yesNoAnswer === 'Yes'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : answer.yesNoAnswer === 'No'
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-slate-500 dark:text-slate-400'
                                }`}>
                                  {answer.yesNoAnswer || '-'}
                                </span>
                              </div>
                              {answer.rating != null && (
                                <div className="inline-flex items-center gap-2 rounded-lg border border-amber-200/55 bg-amber-50/80 px-3 py-1.5 dark:border-amber-600/45 dark:bg-amber-900/20">
                                  <Star size={12} className="text-amber-500 fill-amber-500" />
                                  <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{answer.rating}</span>
                                </div>
                              )}
                            </div>
                            {answer.remarks && (
                              <div className="mt-2.5 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 dark:border-slate-700/40 dark:bg-slate-800/30">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Remarks</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{answer.remarks}</p>
                              </div>
                            )}
                          </div>
                        </div>

	                        {answer.managerProposedYesNo && (
	                          <div className="mt-3 ml-10 rounded-xl border border-amber-300/50 bg-amber-50/40 p-3.5 dark:border-amber-600/40 dark:bg-amber-900/15">
                            <div className="flex items-center gap-2 mb-2">
                              <Edit3 size={13} className="text-amber-600 dark:text-amber-400" />
                              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                Manager Revised Score
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-1.5 dark:border-slate-700/60 dark:bg-slate-800/60">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Employee</span>
                                <YesNoRatingDisplay yesNo={answer.yesNoAnswer} rating={answer.rating} size="sm" />
                              </div>
                              <div className="flex items-center text-slate-300 dark:text-slate-600">
                                <ArrowLeft size={12} className="rotate-180" />
                              </div>
                              <div className="inline-flex items-center gap-2 rounded-lg border border-amber-300/55 bg-amber-100/80 px-2.5 py-1.5 dark:border-amber-600/45 dark:bg-amber-800/30">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Manager</span>
                                <YesNoRatingDisplay
                                  yesNo={answer.managerProposedYesNo}
                                  rating={answer.managerProposedRating}
                                  size="sm"
                                />
                              </div>
                              {answer.finalApprovedYesNo && (
                                <>
                                  <div className="flex items-center text-slate-300 dark:text-slate-600">
                                    <ArrowLeft size={12} className="rotate-180" />
                                  </div>
                                  <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/50 bg-emerald-100/80 px-2.5 py-1.5 dark:border-emerald-600/45 dark:bg-emerald-800/30">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Final</span>
                                    <YesNoRatingDisplay
                                      yesNo={answer.finalApprovedYesNo}
                                      rating={answer.finalApprovedRating}
                                      size="sm"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                            {answer.managerProposedComment && (
                              <p className="mt-3 border-l-4 border-slate-400 pl-3 text-base font-semibold leading-relaxed text-slate-800 dark:border-slate-500 dark:text-slate-200">
                                &ldquo;{answer.managerProposedComment}&rdquo;
                              </p>
                            )}
	                          </div>
	                        )}
	                        {answer.retakeRequested && (
	                          <div className="mt-3 ml-10 rounded-xl border border-sky-300/50 bg-sky-50/50 p-3.5 dark:border-sky-700/50 dark:bg-sky-900/15">
	                            <div className="mb-2 flex items-center gap-2">
	                              <RotateCcw size={13} className="text-sky-600 dark:text-sky-400" />
	                              <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
	                                Retake Review
	                              </span>
	                            </div>
	                            <div className="flex flex-wrap gap-2.5">
	                              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-1.5 dark:border-slate-700/60 dark:bg-slate-800/60">
	                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Original</span>
	                                <YesNoRatingDisplay yesNo={answer.yesNoAnswer} rating={answer.rating} size="sm" />
	                              </div>
	                              <div className="inline-flex items-center gap-2 rounded-lg border border-sky-300/55 bg-sky-100/80 px-2.5 py-1.5 dark:border-sky-600/45 dark:bg-sky-800/30">
	                                <span className="text-[10px] font-bold uppercase tracking-widest text-sky-700 dark:text-sky-300">Retake</span>
	                                <YesNoRatingDisplay yesNo={answer.retakeYesNoAnswer} rating={answer.retakeRating} size="sm" />
	                              </div>
	                              {answer.finalApprovedYesNo && (
	                                <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/50 bg-emerald-100/80 px-2.5 py-1.5 dark:border-emerald-600/45 dark:bg-emerald-800/30">
	                                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Final</span>
	                                  <YesNoRatingDisplay yesNo={answer.finalApprovedYesNo} rating={answer.finalApprovedRating} size="sm" />
	                                </div>
	                              )}
	                            </div>
	                            {answer.retakeRequestComment && (
	                              <p className="mt-3 text-sm font-semibold leading-relaxed text-sky-900 dark:text-sky-100">
	                                {isManagerSelfAssessment ? 'HR warning' : 'Manager warning'}: {answer.retakeRequestComment}
	                              </p>
	                            )}
		                            {answer.retakeReason && (
		                              <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
		                                {isManagerSelfAssessment ? 'Manager reason' : 'Employee reason'}: {answer.retakeReason}
		                              </p>
		                            )}
		                            {answer.managerForceChangeReason && (
		                              <p className="mt-2 text-sm font-semibold leading-relaxed text-amber-800 dark:text-amber-200">
			                                Manager override reason: {answer.managerForceChangeReason}
		                              </p>
		                            )}
		                          </div>
	                        )}
                        {!answer.managerProposedYesNo && answer.finalApprovedYesNo && (
                          <div className="mt-3 ml-10 rounded-xl border border-emerald-300/50 bg-emerald-50/40 p-3 dark:border-emerald-600/40 dark:bg-emerald-900/15">
                            <div className="inline-flex items-center gap-2.5 rounded-lg border border-emerald-300/50 bg-emerald-100/80 px-3 py-2 dark:border-emerald-600/45 dark:bg-emerald-800/30">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Final Approved</span>
                              <span className="h-3.5 w-px bg-emerald-300/70 dark:bg-emerald-600/50" aria-hidden />
                              <YesNoRatingDisplay
                                yesNo={answer.finalApprovedYesNo}
                                rating={answer.finalApprovedRating}
                                size="sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>


                <div className="border-t border-slate-100 px-6 py-5 dark:border-slate-700/60">
                  <SelfAssessmentSignatureGrid
                    employeeName={selectedForm.employee?.employeeName}
                    managerName={selectedForm.managerName}
                    employeeSignatureData={selectedForm.employeeSignatureData}
                    employeeSignatureDate={selectedForm.employeeSignatureDate}
                    managerSignatureData={selectedForm.managerSignatureData}
                    managerSignatureDate={selectedForm.managerSignatureDate}
                    hrSignatureData={selectedForm.hrSignatureData}
                    hrSignatureDate={selectedForm.hrSignatureDate}
                    hrFinalSignatureData={selectedForm.hrFinalSignatureData}
                    hrFinalSignatureDate={selectedForm.hrFinalSignatureDate}
                    hrName={selectedForm.hrName}
                    isManagerSelfAssessment={isManagerSelfAssessment}
                  />
                </div>
              </div>

              {!isHr && !isEmployeeDetail && isManagerReviewActionable && (
                <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-700/60">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/20">
                      <PenLine size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Submit Your Review</h3>
	                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Approve the employee&apos;s answers, or request a one-time retake for selected questions
                      </p>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        <MessageSquare size={13} />
                        Comments <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={managerComments}
                        onChange={(e) => setManagerComments(e.target.value)}
                        rows={4}
                        required
                        className={`${filterControlClass} resize-none`}
                        placeholder="Share your assessment of this employee's self-evaluation..."
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-700/60 dark:bg-slate-700/20">
                      <button
                        type="button"
                        onClick={() => setShowAdjustments((prev) => !prev)}
                        aria-pressed={showAdjustments}
                        className="flex w-full items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2463eb]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"
                      >
                        <div className={`relative flex h-5 w-9 items-center rounded-full transition-colors ${showAdjustments ? 'bg-[#2463eb]' : 'bg-slate-300 dark:bg-slate-600'}`}>
                          <div className={`absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${showAdjustments ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
	                            Request Retake
                          </span>
                          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
	                            Select questions and add a warning comment for each retake request
                          </p>
                        </div>
                      </button>
                    </div>

                    {showAdjustments && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal size={14} className="text-amber-600 dark:text-amber-400" />
                          <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
	                            Retake Requests
                          </p>
                        </div>
                        {selectedForm.answers?.map((answer: any, index: number) => (
                          <div
                            key={answer.id}
                            className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-800/40"
                          >
                            {(() => {
	                              const isSelected = Object.prototype.hasOwnProperty.call(retakeComments, answer.id);
                              return (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-700/60 text-[10px] font-bold text-slate-500 dark:text-slate-400">Q{index + 1}</span>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{answer.questionText}</p>
                                  </div>
                                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-700/60 dark:bg-slate-700/20">
                                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                        Current Answer
                                      </p>
                                      <div className="flex flex-wrap items-center gap-3">
                                        <div className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 dark:bg-slate-800/70">
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Yes/No</span>
                                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                            {answer.yesNoAnswer || '-'}
                                          </span>
                                        </div>
                                        <div className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 dark:bg-slate-800/70">
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Rating</span>
                                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                            {answer.rating ?? '-'}
                                          </span>
                                        </div>
                                      </div>
                                      {answer.remarks && (
                                        <div className="mt-3 rounded-lg bg-white px-3 py-2 dark:bg-slate-800/70">
                                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                            Employee Comment
                                          </p>
                                          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                                            {answer.remarks}
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    <div className="space-y-3 rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5 dark:border-amber-700/60 dark:bg-amber-900/20">
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
	                                        Retake Warning
	                                      </p>
	                                      <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
	                                        <input
	                                          type="checkbox"
	                                          checked={isSelected}
	                                          onChange={(e) => handleToggleRetakeQuestion(answer.id, e.target.checked)}
	                                          className="h-4 w-4 rounded border-slate-300 text-[#2463eb] focus:ring-[#2463eb]"
	                                        />
	                                        Request employee retake for this question
	                                      </label>
	                                      <div>
	                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
	                                          Warning Comment <span className="text-red-500">*</span>
	                                        </label>
	                                        <textarea
	                                          value={retakeComments[answer.id] || ''}
	                                          onChange={(e) => handleRetakeCommentChange(answer.id, e.target.value)}
	                                          disabled={!isSelected}
	                                          rows={3}
	                                          className={filterControlClass}
	                                          placeholder="Explain what the employee should revisit"
	                                        />
	                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ))}
                        {selectedForm.employeeRemarks && (
                          <div className="rounded-xl border border-violet-200/80 bg-violet-50/50 p-4 dark:border-violet-700/60 dark:bg-violet-900/20">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-700 dark:text-violet-400">
                              Overall Employee Remarks
                            </p>
                            <p className="mt-1 text-sm text-violet-900 dark:text-violet-100">
                              {selectedForm.employeeRemarks}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/40">
                      <button
                        type="button"
                        onClick={() => {
                          setManagerComments('');
	                          setRetakeComments({});
                          setShowAdjustments(false);
                        }}
                        className="px-5 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!requireManagerReviewComments()) return;
                          setShowManagerApproveModal(true);
                        }}
                        disabled={showAdjustments}
                        title={showAdjustments ? 'Turn off Request Retake to approve' : 'Approve employee answers'}
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <CheckCircle2 size={16} />
                        Approve
                      </button>
                      <button
                        type="button"
	                        onClick={openManagerRetakeModal}
	                        disabled={!showAdjustments}
                        title={!showAdjustments ? 'Enable Request Retake to select questions' : undefined}
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] shadow-lg shadow-[#2463eb]/25 hover:shadow-xl hover:shadow-[#2463eb]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
	                        <Send size={16} />
	                        Request Retake
                      </button>
                    </div>
                  </div>
                </div>
	              )}

	              {isHr && !isEmployeeDetail && (selectedForm.status === 'PENDING_FINAL_APPROVAL' || selectedForm.status === 'PENDING_HR_CALIBRATION_REVIEW') && (
                <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-700/60">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] shadow-md shadow-[#2463eb]/20">
                      <ShieldCheck size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">HR Actions</h3>
	                      <p className="text-xs text-slate-400 dark:text-slate-500">Finalize manager-approved self-assessments or return them for revision</p>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-700/60 dark:bg-slate-700/20">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <PenLine size={14} className="text-[#2463eb] dark:text-[#60a5fa]" />
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            Your Default Signature
                          </p>
                        </div>
                        <Link
                          to="/hr/settings/signature"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2463eb] dark:text-[#60a5fa] hover:underline"
                        >
                          <PenLine size={12} />
                          {isMissingDefaultSignature ? 'Create Default Signature' : 'Signature Settings'}
                        </Link>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 mb-3">
	                        Final approval uses your default signature.
                      </p>
                      <div className="flex items-center justify-center min-h-[72px] rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/80 px-3 py-2">
                        {isDefaultSigLoading ? (
                          <Loader2 className="animate-spin text-slate-400" size={24} />
                        ) : defaultSignature ? (
                          <img
                            src={resolveMediaSrc(defaultSignature.signatureData)}
                            alt="Your default signature"
                            className="max-h-14 max-w-full object-contain"
                          />
                        ) : (
                          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                            No default signature set. Open Signature Settings to create one.
                          </p>
                        )}
                      </div>
                    </div>

                    {hasPendingManagerAdjustments && (
                      <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 dark:border-amber-700/60 dark:bg-amber-950/20">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-200 dark:bg-amber-800">
                            <AlertCircle size={14} className="text-amber-700 dark:text-amber-300" />
                          </div>
                          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                            Manager has proposed adjustments. Please approve or reject them.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setApprovalMode('adjustment');
                              setShowApprovalModal(true);
                            }}
                            disabled={isDefaultSigLoading || !hasDefaultSignature}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:from-emerald-700 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <ThumbsUp size={16} />
                            Approve Adjustments
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectReasonType(HR_ADJUSTMENT_REJECTION_REASONS[0]);
                              setRejectReason('');
                              setShowRejectModal(true);
                            }}
                            disabled={isDefaultSigLoading || !hasDefaultSignature}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-red-500/20 transition-all hover:from-red-700 hover:to-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <ThumbsDown size={16} />
                            Reject Adjustments
                          </button>
                        </div>
                      </div>
                    )}

	                    {false && (
                      <div className="rounded-xl border border-rose-200/80 bg-rose-50/50 p-4 dark:border-rose-700/60 dark:bg-rose-900/20">
                        <div className="mb-3 flex items-center gap-2">
                          <AlertCircle size={15} className="text-rose-600 dark:text-rose-400" />
                          <p className="text-sm font-bold text-rose-800 dark:text-rose-300">
                            Disputed review awaiting HR decision
                          </p>
                        </div>
                        <div className="space-y-3">
	                          {selectedForm?.employeeDisputeReason && (
                            <div className="rounded-lg bg-white/70 px-3 py-2 dark:bg-slate-800/60">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 dark:text-rose-300">
                                Employee Dispute Reason
                              </p>
                              <p className="mt-1 text-sm text-rose-900 dark:text-rose-100">
	                                {selectedForm?.employeeDisputeReason}
                              </p>
                            </div>
                          )}
                          <div>
                            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-300">
                              HR Reason for Manager Revision <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={hrReturnReasonType}
                              onChange={(e) => {
                                setHrReturnReasonType(e.target.value);
                                if (e.target.value !== HR_RETURN_BACK_OTHER) {
                                  setHrReturnCustomReason('');
                                }
                              }}
                              className={filterControlClass}
                            >
                              {HR_RETURN_BACK_REASONS.map((reason) => (
                                <option key={reason} value={reason}>
                                  {reason}
                                </option>
                              ))}
                              <option value={HR_RETURN_BACK_OTHER}>{HR_RETURN_BACK_OTHER}</option>
                            </select>
                          </div>
                          {hrReturnReasonType === HR_RETURN_BACK_OTHER && (
                            <div>
                              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-300">
                                Custom Reason <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                value={hrReturnCustomReason}
                                onChange={(e) => setHrReturnCustomReason(e.target.value)}
                                rows={3}
                                className={`${filterControlClass} resize-none`}
                                placeholder="Explain what the manager must revise..."
                              />
                            </div>
                          )}
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={handleHrReturnDisputedReview}
                              disabled={isHrReturningDispute || !resolvedHrReturnReason}
                              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-amber-500/20 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              {isHrReturningDispute ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                              Send Back to Manager
                            </button>
                            <button
                              onClick={() => {
                                setApprovalMode('final');
                                setShowApprovalModal(true);
                              }}
                              disabled={isDefaultSigLoading || !hasDefaultSignature}
                              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/20 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <CheckCircle2 size={16} />
                              Final Approval
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {canHrRequestManagerRetake && (
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-700/60 dark:bg-slate-700/20">
                        <button
                          type="button"
                          onClick={() => setShowAdjustments((prev) => !prev)}
                          aria-pressed={showAdjustments}
                          className="flex w-full items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2463eb]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"
                        >
                          <div className={`relative flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${showAdjustments ? 'bg-[#2463eb]' : 'bg-slate-300 dark:bg-slate-600'}`}>
                            <div className={`absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${showAdjustments ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                              Request Retake
                            </span>
                            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                              Select questions and add a warning comment for each retake request
                            </p>
                          </div>
                        </button>
                      </div>
                    )}

                    {canHrRequestManagerRetake && showAdjustments && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal size={14} className="text-amber-600 dark:text-amber-400" />
                          <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            Retake Requests
                          </p>
                        </div>
                        {selectedForm.answers?.map((answer: any, index: number) => {
                          const isSelected = Object.prototype.hasOwnProperty.call(retakeComments, answer.id);
                          return (
                            <div key={answer.id} className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-800/40">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-700/60 text-[10px] font-bold text-slate-500 dark:text-slate-400">Q{index + 1}</span>
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{answer.questionText}</p>
                                </div>
                                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => handleToggleRetakeQuestion(answer.id, e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-[#2463eb] focus:ring-[#2463eb]"
                                  />
                                  Request manager retake for this question
                                </label>
                                <div>
                                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                    Warning Comment <span className="text-red-500">*</span>
                                  </label>
                                  <textarea
                                    value={retakeComments[answer.id] || ''}
                                    onChange={(e) => handleRetakeCommentChange(answer.id, e.target.value)}
                                    disabled={!isSelected}
                                    rows={3}
                                    className={filterControlClass}
                                    placeholder="Explain what the manager should revisit"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/40">
                        {canHrScheduleManagerMeeting && (
                          <button
                            type="button"
                            onClick={handleScheduleMeeting}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/60 transition-all"
                          >
                            <CalendarDays size={16} />
                            Schedule Meeting
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowHrReturnModal(true)}
                          disabled={!canHrReturnBack || isHrReturningBack}
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-amber-500/20 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {isHrReturningBack ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                          Return Back
                        </button>
                        <button
                          onClick={() => {
                            setApprovalMode('final');
                            setShowApprovalModal(true);
                          }}
                          disabled={selectedForm.status !== 'PENDING_FINAL_APPROVAL' || isDefaultSigLoading || !hasDefaultSignature || showAdjustments}
                          title={showAdjustments ? 'Turn off Request Retake to approve' : 'Approve and finalize'}
                          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] shadow-lg shadow-[#2463eb]/25 hover:shadow-xl hover:shadow-[#2463eb]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <CheckCircle2 size={16} />
                          Finalize and Lock
                        </button>
                        {canHrRequestManagerRetake && (
                          <button
                            type="button"
                            onClick={openManagerRetakeModal}
                            disabled={!showAdjustments || isRetakeRequesting}
                            title={!showAdjustments ? 'Enable Request Retake to select questions' : undefined}
                            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] shadow-lg shadow-[#2463eb]/25 hover:shadow-xl hover:shadow-[#2463eb]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            <Send size={16} />
                            Request Retake
                          </button>
                        )}
                        {canHrReopenForEmployee && (
                          <button
                            onClick={() => handleHrReopenForm()}
                            disabled={isReopening || isDefaultSigLoading || !hasDefaultSignature}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-amber-500/20 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            {isReopening ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                            Reopen for Employee
                          </button>
                        )}
                      </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-white py-24 px-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '280ms' }}>
              <div className="relative mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700/60 border border-slate-200/60 dark:border-slate-700/60">
                  <Eye size={36} className="text-slate-300 dark:text-slate-500" />
                </div>
                <div className="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] shadow-lg shadow-[#2463eb]/25">
                  <FileText size={14} className="text-white" />
                </div>
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {isEmployeeDetail ? 'No self-assessment detail selected' : 'Select a form to review'}
              </p>
              <p className="mt-1.5 max-w-sm text-center text-sm text-slate-400 dark:text-slate-500">
                {isEmployeeDetail
                  ? 'Open a history record to view its read-only details.'
                  : 'Choose a self-assessment form from the dedicated Form Queue page to review details and take action'}
              </p>
              {!isEmployeeDetail && (
                <button
                  type="button"
                  onClick={() => navigate(reviewQueuePath)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#2463eb]/[0.06] px-4 py-2 text-sm font-semibold text-[#2463eb] transition hover:bg-[#2463eb]/[0.12] dark:bg-[#2463eb]/10 dark:text-[#60a5fa] dark:hover:bg-[#2463eb]/20"
                >
                  Open Review Submissions
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {((!isHr && !isEmployeeDetail) || (isHr && isManagerSelfAssessment)) && showManagerRetakeModal && portalRoot && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isRetakeRequesting && setShowManagerRetakeModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-6 shadow-2xl dark:border-slate-700/60 dark:bg-slate-800 animate-fade-in-up">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
                <Send size={20} className="text-[#2463eb] dark:text-[#60a5fa]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Retake Request</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {isHr && isManagerSelfAssessment ? 'The manager will be notified' : 'The employee will be notified'}
                </p>
              </div>
            </div>
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
              You are requesting a one-time retake from
              {' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                {selectedForm?.employee?.employeeName ?? (isHr && isManagerSelfAssessment ? 'this manager' : 'this employee')}
              </span>
              {' '}
              for {buildRetakeRequests().length} selected question{buildRetakeRequests().length === 1 ? '' : 's'}.
              {isHr && isManagerSelfAssessment ? ' The manager' : ' The employee'} will receive a notification to update only the warned questions.
            </p>
            <div className="mb-5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-700/60 dark:bg-slate-700/20">
              <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <PenLine size={12} />
                Your default signature will be recorded for this action.
              </p>
              {isMissingDefaultSignature && (
                <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  No default signature set.{' '}
                  <Link to={isHr ? '/hr/settings/signature' : '/manager/settings/signature'} className="text-[#2463eb] underline">
                    Open Signature Settings
                  </Link>
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowManagerRetakeModal(false)}
                disabled={isRetakeRequesting}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSubmitRetakeRequest()}
                disabled={isRetakeRequesting || isDefaultSigLoading || !hasDefaultSignature}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] shadow-lg shadow-[#2463eb]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isRetakeRequesting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Confirm Retake
              </button>
            </div>
          </div>
        </div>
      , portalRoot)}

      {!isHr && !isEmployeeDetail && showForceChangeModal && portalRoot && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isForceChangingRetake && setShowForceChangeModal(false)}
          />
          <div className="relative max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-2xl dark:border-slate-700/60 dark:bg-slate-800 animate-fade-in-up">
            <div className="border-b border-slate-200/70 px-6 py-5 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <PenLine size={20} className="text-amber-700 dark:text-amber-300" />
                </div>
                <div>
	                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Manager Override Retake</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Final values are recorded separately. Second-attempt answers will not be replaced.
                  </p>
                </div>
              </div>
            </div>
            <div className="max-h-[62vh] space-y-3 overflow-y-auto px-6 py-5">
              {selectedForm?.answers
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((answer, index) => {
                  const editable = answer.retakeRequested;
                  const current = forceChangeAnswers[answer.id] ?? {
                    yesNoAnswer: answer.retakeYesNoAnswer ?? answer.yesNoAnswer ?? '',
                    rating: answer.retakeRating ?? answer.rating ?? null,
                    reason: answer.managerForceChangeReason ?? '',
                  };
                  const changed = editable && hasForceChangeDifference(answer);
                  const ratingOptions = getRatingOptions(
                    selectedForm.ratingSystem,
                    current.yesNoAnswer,
                    selectedForm.tenPointYesMinRating,
                  );

                  return (
                    <div
                      key={answer.id}
                      className={`rounded-xl border p-4 ${
                        editable
                          ? 'border-amber-300/70 bg-amber-50/40 dark:border-amber-700/60 dark:bg-amber-900/15'
                          : 'border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/30'
                      }`}
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-relaxed text-slate-900 dark:text-white">{answer.questionText}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Retake</span>
                              <YesNoRatingDisplay yesNo={answer.retakeYesNoAnswer ?? answer.yesNoAnswer} rating={answer.retakeRating ?? answer.rating} size="sm" />
                            </div>
                            {!editable && (
                              <span className="inline-flex items-center rounded-lg bg-slate-200/70 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                Read-only
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {editable ? (
                        <div className="grid gap-3 md:grid-cols-[10rem_1fr]">
                          <label className="space-y-1">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Final answer</span>
                            <select
                              value={current.yesNoAnswer}
                              onChange={(event) => handleForceChangeAnswer(answer.id, {
                                yesNoAnswer: event.target.value,
                                rating: null,
                              })}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                            >
                              <option value="">Select</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </label>
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Final rating</span>
                            <div className="flex flex-wrap gap-2">
                              {ratingOptions.map(rating => (
                                <button
                                  key={rating}
                                  type="button"
                                  onClick={() => handleForceChangeAnswer(answer.id, { rating })}
                                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold transition-colors ${
                                    current.rating === rating
                                      ? 'border-amber-600 bg-amber-600 text-white'
                                      : 'border-slate-300 bg-white text-slate-700 hover:border-amber-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200'
                                  }`}
                                >
                                  {rating}
                                </button>
                              ))}
                            </div>
                          </div>
                          {changed && (
                            <label className="space-y-1 md:col-span-2">
                              <span className="text-xs font-bold text-amber-800 dark:text-amber-200">Reason for changed final value</span>
                              <textarea
                                value={current.reason}
                                onChange={(event) => handleForceChangeAnswer(answer.id, { reason: event.target.value })}
                                rows={3}
                                className="w-full resize-none rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-amber-700 dark:bg-slate-900 dark:text-slate-100"
                                placeholder="Explain why the final value differs from the employee's retake answer"
                              />
                            </label>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200/70 px-6 py-4 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setShowForceChangeModal(false)}
                disabled={isForceChangingRetake}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleManagerForceChangeRetake()}
                disabled={isForceChangingRetake}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-amber-500/20 transition-all disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isForceChangingRetake ? <Loader2 size={16} className="animate-spin" /> : <PenLine size={16} />}
	                Confirm Manager Override
              </button>
            </div>
          </div>
        </div>
      , portalRoot)}

      {!isHr && !isEmployeeDetail && showManagerApproveRetakeModal && portalRoot && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isApprovingRetake && setShowManagerApproveRetakeModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-6 shadow-2xl dark:border-slate-700/60 dark:bg-slate-800 animate-fade-in-up">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Retake Approval</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">This will notify HR for final approval</p>
              </div>
            </div>
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
              You are approving
              {' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                {selectedForm?.employee?.employeeName ?? 'this employee'}
              </span>
              &apos;s submitted retake answers. The form will move to HR for final approval.
            </p>
            <div className="mb-5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-700/60 dark:bg-slate-700/20">
              <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <PenLine size={12} />
                Your default signature will be recorded for this action.
              </p>
              {isMissingDefaultSignature && (
                <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  No default signature set.{' '}
                  <Link to="/manager/settings/signature" className="text-[#2463eb] underline">
                    Open Signature Settings
                  </Link>
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowManagerApproveRetakeModal(false)}
                disabled={isApprovingRetake}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleManagerApproveRetake()}
                disabled={isApprovingRetake || isDefaultSigLoading || !hasDefaultSignature}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isApprovingRetake ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      , portalRoot)}

      {!isHr && !isEmployeeDetail && showManagerApproveModal && portalRoot && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isApprovingReview && setShowManagerApproveModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-6 shadow-2xl dark:border-slate-700/60 dark:bg-slate-800 animate-fade-in-up">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Approval</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">This will notify HR for final approval</p>
              </div>
            </div>
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
              You are approving
              {' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                {selectedForm?.employee?.employeeName ?? 'this employee'}
              </span>
              &apos;s self-assessment. Active HR users will receive a notification to complete final approval.
            </p>
            <div className="mb-5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-700/60 dark:bg-slate-700/20">
              <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <PenLine size={12} />
                Your default signature will be recorded for this action.
              </p>
              {isMissingDefaultSignature && (
                <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  No default signature set.{' '}
                  <Link to="/manager/settings/signature" className="text-[#2463eb] underline">
                    Open Signature Settings
                  </Link>
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowManagerApproveModal(false)}
                disabled={isApprovingReview}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleApproveReview()}
                disabled={isApprovingReview || isDefaultSigLoading || !hasDefaultSignature}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isApprovingReview ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      , portalRoot)}

      {isHr && !isEmployeeDetail && showApprovalModal && portalRoot && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowApprovalModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-6 shadow-2xl dark:border-slate-700/60 dark:bg-slate-800 animate-fade-in-up">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Approval</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              {approvalMode === 'adjustment'
                ? 'You are about to approve the manager\'s proposed adjustments. The adjusted scores will be applied as the final approved values.'
                : 'You are about to give final approval to this self-assessment form. The assessment will be finalized and the form will be locked.'}
            </p>
            {approvalMode !== 'adjustment' && (
              <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
                No further edits will be allowed unless HR reopens the form.
              </p>
            )}
            <div className="mb-5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-700/60 dark:bg-slate-700/20">
              <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <PenLine size={12} />
                Your default signature will be recorded for this action.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={(approvalMode === 'adjustment' ? isHrApproving : isApproving) || isDefaultSigLoading || !hasDefaultSignature}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {(approvalMode === 'adjustment' ? isHrApproving : isApproving) ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                {approvalMode === 'adjustment' ? 'Approve Adjustments' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      , portalRoot)}

      {isHr && !isEmployeeDetail && showHrReturnModal && portalRoot && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isHrReturningBack && resetHrReturnModal()}
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-2xl dark:border-slate-700/60 dark:bg-slate-800 animate-fade-in-up">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <RotateCcw size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Return Back</h3>
                  <p className="text-sm text-amber-50">Send this self-assessment back to the manager</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Return Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={hrReturnReasonType}
                  onChange={(e) => {
                    setHrReturnReasonType(e.target.value);
                    if (e.target.value !== HR_RETURN_BACK_OTHER) {
                      setHrReturnCustomReason('');
                    }
                  }}
                  className={filterControlClass}
                >
                  {HR_RETURN_BACK_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                  <option value={HR_RETURN_BACK_OTHER}>{HR_RETURN_BACK_OTHER}</option>
                </select>
              </div>
              {hrReturnReasonType === HR_RETURN_BACK_OTHER && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Custom Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={hrReturnCustomReason}
                    onChange={(e) => setHrReturnCustomReason(e.target.value)}
                    rows={4}
                    className={`${filterControlClass} resize-none`}
                    placeholder="Explain what the manager must revise..."
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetHrReturnModal}
                  disabled={isHrReturningBack}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleHrReturnBack()}
                  disabled={isHrReturningBack || !resolvedHrReturnReason}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isHrReturningBack ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                  Return Back
                </button>
              </div>
            </div>
          </div>
        </div>
      , portalRoot)}

      {canHrUnlockPendingRequest && showUnlockModal && portalRoot && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isUnlocking && closeUnlockModal()} />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-2xl dark:border-slate-700/60 dark:bg-slate-800 animate-fade-in-up">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <KeyRound size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Unlock Self-Assessment</h3>
                  <p className="text-sm text-indigo-100">
                    {pendingUnlockRequest?.requestedByName || selectedForm?.employee?.employeeName || 'Requester'} asked to edit this form
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Unlock this self-assessment so the employee can edit and resubmit.
                The resubmission deadline will be set to the manager review deadline
                {pendingUnlockRequest?.managerReviewDeadlineDate
                  ? ` (${formatDateDayMonthYear(pendingUnlockRequest.managerReviewDeadlineDate)})`
                  : ''}.
              </p>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  HR Reason
                </label>
                <select
                  value={unlockReasonCode}
                  onChange={(e) => {
                    const value = e.target.value as SelfAssessmentUnlockHrApproveReasonCode | '';
                    setUnlockReasonCode(value);
                    if (value !== 'OTHER') setUnlockReasonText('');
                  }}
                  className={filterControlClass}
                >
                  <option value="">Select a reason...</option>
                  {SELF_ASSESSMENT_UNLOCK_HR_APPROVE_REASON_OPTIONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>
              {unlockReasonCode === 'OTHER' && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Reason Details
                  </label>
                  <textarea
                    value={unlockReasonText}
                    onChange={(e) => setUnlockReasonText(e.target.value)}
                    rows={4}
                    className={`${filterControlClass} resize-none`}
                    placeholder="Explain why this form is being unlocked..."
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeUnlockModal}
                  disabled={isUnlocking}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleHrUnlockRequest()}
                  disabled={
                    isUnlocking
                    || !unlockReasonCode
                    || (unlockReasonCode === 'OTHER' && !unlockReasonText.trim())
                  }
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isUnlocking ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  Unlock
                </button>
              </div>
            </div>
          </div>
        </div>
      , portalRoot)}

      {showRejectModal && portalRoot && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetRejectModal} />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-2xl dark:border-slate-700/60 dark:bg-slate-800 animate-fade-in-up">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <XCircle size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Reject Adjustments</h3>
                  <p className="text-sm text-red-100">Provide a reason for rejection</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Please provide a reason for rejecting the manager&apos;s proposed adjustments.
              </p>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Rejection Reason
                </label>
                <select
                  value={rejectReasonType}
                  onChange={(e) => {
                    setRejectReasonType(e.target.value);
                    if (e.target.value !== HR_ADJUSTMENT_REJECTION_OTHER) {
                      setRejectReason('');
                    }
                  }}
                  className={filterControlClass}
                >
                  {HR_ADJUSTMENT_REJECTION_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                  <option value={HR_ADJUSTMENT_REJECTION_OTHER}>{HR_ADJUSTMENT_REJECTION_OTHER}</option>
                </select>
              </div>
              {rejectReasonType === HR_ADJUSTMENT_REJECTION_OTHER && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Custom Reason
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                    className={`${filterControlClass} resize-none`}
                    placeholder="Explain why the adjustments are being rejected..."
                  />
                </div>
              )}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-700/60 dark:bg-slate-700/20">
                <p className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <PenLine size={12} className="mt-0.5 shrink-0" />
                  Your default signature will be recorded for this action.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetRejectModal}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleHrRejectAdjustment}
                  disabled={isHrRejecting || isDefaultSigLoading || !hasDefaultSignature || !resolvedRejectReason}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-red-600 to-rose-600 shadow-md shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isHrRejecting ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                  Reject Adjustments
                </button>
              </div>
            </div>
          </div>
        </div>
      , portalRoot)}
    </div>
  );
};
