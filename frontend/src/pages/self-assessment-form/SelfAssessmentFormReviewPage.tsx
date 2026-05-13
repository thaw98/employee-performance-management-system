import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';
import {
  useGetReviewFormsQuery,
  useGetHrReviewFormsQuery,
  useGetAllFormsForHrQuery,
  useGetFormByIdQuery,
  useManagerReviewMutation,
  useHrReturnDisputedReviewMutation,
  useHrApproveFormMutation,
  useHrReopenFormMutation,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { getRatingOptions, isRatingValidForAnswer } from '../../features/selfAssessmentForm/ratingSystem';
import { SelfAssessmentRatingPicker } from '../../features/selfAssessmentForm/components/SelfAssessmentRatingPicker';
import { exportSelfAssessmentReviewPdf } from '../../features/selfAssessmentForm/exportSelfAssessmentReviewPdf';
import { useGetDefaultSignatureQuery } from '../../features/user/userApi';
import { resolveMediaSrc } from '../../utils/mediaUrl';
import { formatDateDayMonthYear, formatDateTimeWithSeconds } from '../../utils/dateUtils';
import { useSelector } from 'react-redux';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import type { RootState } from '../../app/store';

interface ManagerAdjustment {
  answerId: number;
  proposedYesNo: string;
  proposedRating: number;
  comment: string;
}

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
  'w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all focus:border-[#5D5FEF] focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-[#5D5FEF]';

function ScoreBar({ value, max = 100, color = '#5D5FEF', label }: { value: number; max?: number; color?: string; label?: string }) {
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

export const SelfAssessmentFormReviewPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { formId: formIdParam } = useParams<{ formId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isHr = user?.roleId === 1;
  const isEmployeeDetail = location.pathname.startsWith('/employee/self-assessment-forms') || user?.roleId === 3 || user?.roleId === 4;
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
  const [adjustments, setAdjustments] = useState<ManagerAdjustment[]>([]);
  const [hrReturnReason, setHrReturnReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const { data: managerForms, isLoading: managerFormsLoading, error: managerFormsError } = useGetReviewFormsQuery(undefined, {
    skip: isHr || isEmployeeDetail,
  });
  const { data: hrForms, isLoading: hrFormsLoading } = useGetHrReviewFormsQuery(undefined, {
    skip: !isHr || Boolean(selectedFormId),
  });
  const { data: allForms, isLoading: allFormsLoading } = useGetAllFormsForHrQuery(undefined, {
    skip: !isHr || !selectedFormId,
  });
  const { data: selectedForm, isLoading: selectedFormLoading, refetch: refetchForm } = useGetFormByIdQuery(selectedFormId!, {
    skip: !selectedFormId,
  });

  const [managerReview, { isLoading: isManagerReviewing }] = useManagerReviewMutation();
  const [hrReturnDisputedReview, { isLoading: isHrReturningDispute }] = useHrReturnDisputedReviewMutation();
  const [hrApproveForm, { isLoading: isApproving }] = useHrApproveFormMutation();
  const [hrReopenForm, { isLoading: isReopening }] = useHrReopenFormMutation();

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const { data: defaultSigResponse, isLoading: isDefaultSigLoading } = useGetDefaultSignatureQuery(undefined, {
    skip: !isHr || isEmployeeDetail,
  });
  const defaultSignature = defaultSigResponse?.data ?? null;
  const hasDefaultSignature = Boolean(defaultSignature);
  const isMissingDefaultSignature = !isDefaultSigLoading && !hasDefaultSignature;
  const portalRoot = typeof document !== 'undefined' ? document.body : null;

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

  const handleManagerAdjustmentChange = (answerId: number, field: keyof ManagerAdjustment, value: string | number) => {
    setAdjustments(prev => {
      const existing = prev.find(a => a.answerId === answerId);
      const nextValue: Partial<ManagerAdjustment> =
        field === 'proposedYesNo'
          ? {
              proposedYesNo: String(value),
              ...(existing?.proposedRating
                && !isRatingValidForAnswer(
                  selectedForm?.ratingSystem,
                  String(value),
                  existing.proposedRating,
                  selectedForm?.tenPointYesMinRating,
                )
                ? { proposedRating: 0 }
                : {}),
            }
          : field === 'proposedRating'
            ? { proposedRating: Number(value) }
            : { comment: String(value) };
      if (existing) {
        return prev.map(a => a.answerId === answerId ? { ...a, ...nextValue } : a);
      } else {
        return [...prev, { answerId, proposedYesNo: '', proposedRating: 0, comment: '', ...nextValue } as ManagerAdjustment];
      }
    });
  };

  const handleSubmitManagerReview = async () => {
    if (!selectedFormId) return;

    if (adjustments.length > 0) {
      const missingComments = adjustments.filter(a => !a.comment.trim());
      if (missingComments.length > 0) {
        toast.error('All adjustments must have a comment');
        return;
      }
      const invalidRatings = adjustments.filter(
        a => a.proposedYesNo && a.proposedRating && !isRatingValidForAnswer(
          selectedForm?.ratingSystem,
          a.proposedYesNo,
          a.proposedRating,
          selectedForm?.tenPointYesMinRating,
        )
      );
      if (invalidRatings.length > 0) {
        toast.error('One or more proposed ratings do not match the selected response');
        return;
      }
    }

    try {
      await managerReview({
        formId: selectedFormId,
        request: {
          comments: managerComments,
          adjustments: adjustments.filter(a => a.proposedYesNo && a.proposedRating),
        },
      }).unwrap();
      toast.success('Review submitted successfully');
      setManagerComments('');
      setAdjustments([]);
      setShowAdjustments(false);
      refetchForm();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to submit review');
    }
  };

  const handleHrReturnDisputedReview = async () => {
    if (!selectedFormId || !hrReturnReason.trim()) {
      toast.error('Enter an HR reason before sending back to the manager.');
      return;
    }

    try {
      await hrReturnDisputedReview({
        formId: selectedFormId,
        request: { reason: hrReturnReason.trim() },
      }).unwrap();
      toast.success('Review returned to manager for revision');
      setHrReturnReason('');
      refetchForm();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to return review to manager');
    }
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
    const hasSubmitted = ['SUBMITTED', 'EMPLOYEE_SUBMITTED', 'PENDING_MANAGER_REVIEW', 'MANAGER_REVIEWED', 'PENDING_EMPLOYEE_REVIEW', 'PENDING_FINAL_APPROVAL', 'PENDING_HR_CALIBRATION_REVIEW', 'APPROVED', 'COMPLETED', 'FINALIZED_LOCKED'].includes(s);
    steps.push({
      label: 'Employee Submitted',
      done: hasSubmitted,
      active: s === 'SUBMITTED' || s === 'EMPLOYEE_SUBMITTED',
      date: selectedForm.submittedDate ? formatDateTimeWithSeconds(selectedForm.submittedDate) : undefined,
    });
    const hasMgrReview = ['MANAGER_REVIEWED', 'PENDING_EMPLOYEE_REVIEW', 'PENDING_FINAL_APPROVAL', 'PENDING_HR_CALIBRATION_REVIEW', 'APPROVED', 'COMPLETED', 'FINALIZED_LOCKED'].includes(s);
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
        className="group mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#5D5FEF] dark:text-slate-400 dark:hover:text-[#8b8ef7]"
      >
        <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
        {backLabel}
      </button>

      <nav className="mb-5 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <Link to={isHr ? '/hr/dashboard' : isEmployeeDetail ? '/employee/dashboard' : '/manager/dashboard'} className="text-[#5D5FEF] dark:text-[#8b8ef7] font-medium hover:underline">Home</Link>
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
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/20">
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
          {selectedForm && (
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#5D5FEF] to-[#7C7EF5] px-3.5 py-2 text-sm font-bold text-white shadow-md shadow-[#5D5FEF]/25 transition hover:shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none dark:shadow-[#5D5FEF]/15"
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
              Form Queue
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
                          ? 'border-l-[#5D5FEF] bg-[#5D5FEF]/[0.04] shadow-sm dark:bg-[#5D5FEF]/[0.08]'
                          : 'border-l-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/40'
                      }`}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            isActive
                              ? 'bg-[#5D5FEF]/10 text-[#5D5FEF] dark:bg-[#5D5FEF]/20 dark:text-[#8b8ef7]'
                              : 'bg-slate-100 text-slate-400 dark:bg-slate-700/60 dark:text-slate-500'
                          }`}>
                            <User size={13} />
                          </div>
                          <div className="min-w-0">
                            <p className={`truncate text-sm font-semibold max-w-[140px] ${
                              isActive
                                ? 'text-[#5D5FEF] dark:text-[#8b8ef7]'
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
                      className="mt-2 text-xs font-semibold text-[#5D5FEF] dark:text-[#8b8ef7] hover:underline"
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
                    <BarChart3 size={15} className="text-[#5D5FEF] dark:text-[#8b8ef7]" />
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
                  <Clock size={17} className="text-[#5D5FEF] dark:text-[#8b8ef7]" />
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
                              ? 'border-[#5D5FEF] bg-[#5D5FEF]/10 dark:bg-[#5D5FEF]/20'
                              : 'border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800'
                        }`}>
                          {step.done ? (
                            <CheckCircle2 size={15} className="text-white" />
                          ) : step.active ? (
                            <div className="h-2.5 w-2.5 rounded-full bg-[#5D5FEF]" />
                          ) : (
                            <div className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                          )}
                        </div>
                        <p className={`mt-2 text-xs font-bold text-center leading-snug ${
                          step.done ? 'text-emerald-600 dark:text-emerald-400' : step.active ? 'text-[#5D5FEF] dark:text-[#8b8ef7]' : 'text-slate-400 dark:text-slate-500'
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

              <div className="overflow-hidden rounded-2xl border border-[#5D5FEF]/18 bg-white shadow-sm dark:border-[#8b8ef7]/28 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5D5FEF]/10 dark:bg-[#5D5FEF]/20">
                      <FileCheck2 size={16} className="text-[#5D5FEF] dark:text-[#8b8ef7]" />
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
                        className="group relative rounded-xl border border-[#5D5FEF]/22 bg-white p-4 transition-all hover:border-[#5D5FEF]/40 hover:shadow-sm dark:border-[#8b8ef7]/32 dark:bg-slate-900/40 dark:hover:border-[#8b8ef7]/50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-[#5D5FEF]/18 dark:border-[#8b8ef7]/28 dark:bg-slate-800/60">
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
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                  {answer.yesNoAnswer} ({answer.rating})
                                </span>
                              </div>
                              <div className="flex items-center text-slate-300 dark:text-slate-600">
                                <ArrowLeft size={12} className="rotate-180" />
                              </div>
                              <div className="inline-flex items-center gap-2 rounded-lg border border-amber-300/55 bg-amber-100/80 px-2.5 py-1.5 dark:border-amber-600/45 dark:bg-amber-800/30">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Manager</span>
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                  {answer.managerProposedYesNo} ({answer.managerProposedRating})
                                </span>
                              </div>
                              {answer.finalApprovedYesNo && (
                                <>
                                  <div className="flex items-center text-slate-300 dark:text-slate-600">
                                    <ArrowLeft size={12} className="rotate-180" />
                                  </div>
                                  <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/50 bg-emerald-100/80 px-2.5 py-1.5 dark:border-emerald-600/45 dark:bg-emerald-800/30">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Final</span>
                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                      {answer.finalApprovedYesNo} ({answer.finalApprovedRating})
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                            {answer.managerProposedComment && (
                              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic border-l-2 border-amber-400/70 dark:border-amber-500/60 pl-2.5">
                                "{answer.managerProposedComment}"
                              </p>
                            )}
                          </div>
                        )}
                        {!answer.managerProposedYesNo && answer.finalApprovedYesNo && (
                          <div className="mt-3 ml-10 rounded-xl border border-emerald-300/50 bg-emerald-50/40 p-3 dark:border-emerald-600/40 dark:bg-emerald-900/15">
                            <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/50 bg-emerald-100/80 px-2.5 py-1.5 dark:border-emerald-600/45 dark:bg-emerald-800/30">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Final Approved</span>
                              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                {answer.finalApprovedYesNo} ({answer.finalApprovedRating})
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {(selectedForm.employeeRemarks || selectedForm.overallRemarks || selectedForm.managerComments || selectedForm.employeeDisputedAt || selectedForm.hrReviewReason) && (
                  <div className="border-t border-slate-100 dark:border-slate-700/60">
                    <div className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-4">
                        <MessageSquare size={15} className="text-[#5D5FEF] dark:text-[#8b8ef7]" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Remarks & Comments</h3>
                      </div>
                      <div className="space-y-3">
                        {selectedForm.employeeRemarks && (
                          <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 dark:border-slate-700/50 dark:bg-slate-800/30">
                            <div className="flex items-center gap-2 mb-2">
                              <User size={13} className="text-slate-400" />
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Employee Remarks</h4>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{selectedForm.employeeRemarks}</p>
                          </div>
                        )}
                        {selectedForm.overallRemarks && (
                          <div className="rounded-xl border border-violet-200/70 bg-violet-50/40 p-4 dark:border-violet-700/50 dark:bg-violet-900/15">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare size={13} className="text-violet-500 dark:text-violet-400" />
                              <h4 className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Overall Remarks</h4>
                            </div>
                            <p className="text-sm text-violet-800 dark:text-violet-100 leading-relaxed">{selectedForm.overallRemarks}</p>
                          </div>
                        )}
                        {selectedForm.managerComments && (
                          <div className="rounded-xl border border-blue-200/70 bg-blue-50/40 p-4 dark:border-blue-700/50 dark:bg-blue-900/15">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <ClipboardCheck size={13} className="text-blue-500 dark:text-blue-400" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Manager Comments</h4>
                              </div>
                              {selectedForm.managerName && (
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                  by {selectedForm.managerName}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{selectedForm.managerComments}</p>
                            {selectedForm.managerSignatureDate && (
                              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                                <Clock size={11} />
                                Signed on {formatDateTimeWithSeconds(selectedForm.managerSignatureDate)}
                              </p>
                            )}
                          </div>
                        )}
                        {selectedForm.employeeDisputedAt && (
                          <div className="rounded-xl border border-rose-200/70 bg-rose-50/40 p-4 dark:border-rose-700/50 dark:bg-rose-900/15">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle size={13} className="text-rose-500 dark:text-rose-400" />
                              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Employee Dispute</h4>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                {formatDateTimeWithSeconds(selectedForm.employeeDisputedAt)}
                              </span>
                            </div>
                            <p className="text-sm text-rose-700 dark:text-rose-200 leading-relaxed">{selectedForm.employeeDisputeReason}</p>
                          </div>
                        )}
                        {selectedForm.hrReviewReason && (
                          <div className="rounded-xl border border-orange-200/70 bg-orange-50/40 p-4 dark:border-orange-700/50 dark:bg-orange-900/15">
                            <div className="flex items-center gap-2 mb-2">
                              <ShieldCheck size={13} className="text-orange-500 dark:text-orange-400" />
                              <h4 className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">HR Remarks</h4>
                            </div>
                            <p className="text-sm text-orange-700 dark:text-orange-200 leading-relaxed">{selectedForm.hrReviewReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!isHr && !isEmployeeDetail && (selectedForm.status === 'SUBMITTED' || selectedForm.status === 'PENDING_MANAGER_REVIEW') && (
                <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-700/60">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/20">
                      <PenLine size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Submit Your Review</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Provide feedback and optionally propose adjustments</p>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        <MessageSquare size={13} />
                        Comments
                      </label>
                      <textarea
                        value={managerComments}
                        onChange={(e) => setManagerComments(e.target.value)}
                        rows={4}
                        className={`${filterControlClass} resize-none`}
                        placeholder="Share your assessment of this employee's self-evaluation..."
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-700/60 dark:bg-slate-700/20">
                      <button
                        type="button"
                        onClick={() => setShowAdjustments((prev) => !prev)}
                        aria-pressed={showAdjustments}
                        className="flex w-full items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5D5FEF]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"
                      >
                        <div className={`relative flex h-5 w-9 items-center rounded-full transition-colors ${showAdjustments ? 'bg-[#5D5FEF]' : 'bg-slate-300 dark:bg-slate-600'}`}>
                          <div className={`absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${showAdjustments ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Propose Adjustments
                          </span>
                          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                            Adjust individual answers with your proposed rating and required comment
                          </p>
                        </div>
                      </button>
                    </div>

                    {showAdjustments && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal size={14} className="text-amber-600 dark:text-amber-400" />
                          <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            Adjustment Proposals
                          </p>
                        </div>
                        {selectedForm.answers?.map((answer: any, index: number) => (
                          <div
                            key={answer.id}
                            className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-800/40"
                          >
                            {(() => {
                              const currentAdjustment = adjustments.find(a => a.answerId === answer.id);
                              const proposedYesNo = currentAdjustment?.proposedYesNo || '';
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
                                        Proposed Adjustment
                                      </p>
                                      <div>
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Proposed Yes/No</label>
                                        <select
                                          value={proposedYesNo}
                                          onChange={(e) => handleManagerAdjustmentChange(answer.id, 'proposedYesNo', e.target.value)}
                                          className={`${filterControlClass} py-2`}
                                        >
                                          <option value="">Select</option>
                                          <option value="Yes">Yes</option>
                                          <option value="No">No</option>
                                        </select>
                                      </div>
                                      <div className="min-w-0">
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Proposed Rating</label>
                                        {(() => {
                                          const pr = currentAdjustment?.proposedRating;
                                          const allowed = getRatingOptions(
                                            selectedForm?.ratingSystem,
                                            proposedYesNo,
                                            selectedForm?.tenPointYesMinRating,
                                          );
                                          const ratingValue =
                                            pr && pr > 0 && allowed.includes(pr) ? pr : null;
                                          return (
                                            <SelfAssessmentRatingPicker
                                              compact
                                              fivePointVariant="numeric"
                                              ratingSystem={selectedForm?.ratingSystem}
                                              tenPointYesMinRating={selectedForm?.tenPointYesMinRating}
                                              yesNoAnswer={proposedYesNo || null}
                                              value={ratingValue}
                                              onChange={(r) => handleManagerAdjustmentChange(answer.id, 'proposedRating', r)}
                                              disabled={!proposedYesNo}
                                            />
                                          );
                                        })()}
                                      </div>
                                      <div>
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                          Comment <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                          type="text"
                                          value={adjustments.find(a => a.answerId === answer.id)?.comment || ''}
                                          onChange={(e) => handleManagerAdjustmentChange(answer.id, 'comment', e.target.value)}
                                          className={filterControlClass}
                                          placeholder="Reason for adjustment"
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

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/40">
                      <button
                        onClick={() => {
                          setManagerComments('');
                          setAdjustments([]);
                          setShowAdjustments(false);
                        }}
                        className="px-5 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all"
                      >
                        Reset
                      </button>
                      <button
                        onClick={handleSubmitManagerReview}
                        disabled={isManagerReviewing}
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/25 hover:shadow-xl hover:shadow-[#5D5FEF]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {isManagerReviewing ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                        Submit Review
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isHr && !isEmployeeDetail && (selectedForm.status === 'MANAGER_REVIEWED' || selectedForm.status === 'PENDING_FINAL_APPROVAL' || selectedForm.status === 'PENDING_HR_CALIBRATION_REVIEW') && (
                <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-700/60">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-md shadow-[#5D5FEF]/20">
                      <ShieldCheck size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">HR Actions</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Approve, reject adjustments, or finalize the assessment</p>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-700/60 dark:bg-slate-700/20">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <PenLine size={14} className="text-[#5D5FEF] dark:text-[#8b8ef7]" />
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            Your Default Signature
                          </p>
                        </div>
                        <Link
                          to="/hr/settings/signature"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5D5FEF] dark:text-[#8b8ef7] hover:underline"
                        >
                          <PenLine size={12} />
                          {isMissingDefaultSignature ? 'Create Default Signature' : 'Signature Settings'}
                        </Link>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 mb-3">
                        Final approvals and adjustment decisions use your default signature.
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

                    {selectedForm.status === 'PENDING_HR_CALIBRATION_REVIEW' && (
                      <div className="rounded-xl border border-rose-200/80 bg-rose-50/50 p-4 dark:border-rose-700/60 dark:bg-rose-900/20">
                        <div className="mb-3 flex items-center gap-2">
                          <AlertCircle size={15} className="text-rose-600 dark:text-rose-400" />
                          <p className="text-sm font-bold text-rose-800 dark:text-rose-300">
                            Disputed review awaiting HR decision
                          </p>
                        </div>
                        <div className="space-y-3">
                          {selectedForm.employeeDisputeReason && (
                            <div className="rounded-lg bg-white/70 px-3 py-2 dark:bg-slate-800/60">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 dark:text-rose-300">
                                Employee Dispute Reason
                              </p>
                              <p className="mt-1 text-sm text-rose-900 dark:text-rose-100">
                                {selectedForm.employeeDisputeReason}
                              </p>
                            </div>
                          )}
                          <div>
                            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-300">
                              HR Reason for Manager Revision <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={hrReturnReason}
                              onChange={(e) => setHrReturnReason(e.target.value)}
                              rows={3}
                              className={`${filterControlClass} resize-none`}
                              placeholder="Explain what the manager must revise..."
                            />
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={handleHrReturnDisputedReview}
                              disabled={isHrReturningDispute || !hrReturnReason.trim()}
                              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-amber-500/20 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              {isHrReturningDispute ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                              Send Back to Manager
                            </button>
                            <button
                              onClick={() => setShowApprovalModal(true)}
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

                    {selectedForm.status !== 'PENDING_HR_CALIBRATION_REVIEW' && (
                      <div className="flex gap-3 flex-wrap pt-2">
                        <button
                          onClick={() => setShowApprovalModal(true)}
                          disabled={isDefaultSigLoading || !hasDefaultSignature}
                          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/25 hover:shadow-xl hover:shadow-[#5D5FEF]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <CheckCircle2 size={16} />
                          Final Approval
                        </button>
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
                    )}
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
                <div className="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/25">
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
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#5D5FEF]/[0.06] px-4 py-2 text-sm font-semibold text-[#5D5FEF] transition hover:bg-[#5D5FEF]/[0.12] dark:bg-[#5D5FEF]/10 dark:text-[#8b8ef7] dark:hover:bg-[#5D5FEF]/20"
                >
                  Open Form Queue
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showApprovalModal && portalRoot && createPortal(
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
              You are about to give final approval to this self-assessment form. This will finalize the assessment.
            </p>
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
                onClick={handleHrApproveForm}
                disabled={isApproving || isDefaultSigLoading || !hasDefaultSignature}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isApproving ? (
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
    </div>
  );
};
