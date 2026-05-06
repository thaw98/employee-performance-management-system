import React, { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PenLine,
  Loader2,
  ChevronDown,
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
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  FileCheck2,
  Edit3,
  Hourglass,
} from 'lucide-react';
import {
  useGetReviewFormsQuery,
  useGetHrReviewFormsQuery,
  useGetAllFormsForHrQuery,
  useGetFormByIdQuery,
  useManagerReviewMutation,
  useHrApproveManagerReviewMutation,
  useHrRejectManagerReviewMutation,
  useHrApproveFormMutation,
  useHrReopenFormMutation,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { getRatingOptions, isRatingValidForAnswer } from '../../features/selfAssessmentForm/ratingSystem';
import { SelfAssessmentRatingPicker } from '../../features/selfAssessmentForm/components/SelfAssessmentRatingPicker';
import { useGetDefaultSignatureQuery } from '../../features/user/userApi';
import { resolveMediaSrc } from '../../utils/mediaUrl';
import { formatDateDayMonthYear, formatDateTimeWithSeconds } from '../../utils/dateUtils';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
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
  if (s === 'APPROVED' || s === 'COMPLETED') {
    return {
      label: 'Approved',
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
      cardAccent: 'border-l-emerald-500',
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

export const SelfAssessmentFormReviewPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const isHr = user?.roleId === 1;

  const initialFormId = typeof location.state === 'object'
    && location.state !== null
    && 'formId' in location.state
    && typeof location.state.formId === 'number'
    ? location.state.formId
    : null;
  const [selectedFormId, setSelectedFormId] = useState<number | null>(initialFormId);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [managerComments, setManagerComments] = useState('');
  const [adjustments, setAdjustments] = useState<ManagerAdjustment[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: managerForms, isLoading: managerFormsLoading } = useGetReviewFormsQuery();
  const { data: hrForms, isLoading: hrFormsLoading } = useGetHrReviewFormsQuery();
  const { data: allForms, isLoading: allFormsLoading } = useGetAllFormsForHrQuery();
  const { data: selectedForm, refetch: refetchForm } = useGetFormByIdQuery(selectedFormId!, {
    skip: !selectedFormId,
  });

  const [managerReview, { isLoading: isManagerReviewing }] = useManagerReviewMutation();
  const [hrApproveManagerReview, { isLoading: isHrApproving }] = useHrApproveManagerReviewMutation();
  const [hrRejectManagerReview, { isLoading: isHrRejecting }] = useHrRejectManagerReviewMutation();
  const [hrApproveForm, { isLoading: isApproving }] = useHrApproveFormMutation();
  const [hrReopenForm, { isLoading: isReopening }] = useHrReopenFormMutation();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalMode, setApprovalMode] = useState<'adjustment' | 'final'>('final');

  const { data: defaultSigResponse, isLoading: isDefaultSigLoading } = useGetDefaultSignatureQuery(undefined, {
    skip: !isHr,
  });
  const defaultSignature = defaultSigResponse?.data ?? null;
  const hasDefaultSignature = Boolean(defaultSignature);

  const forms = isHr ? (selectedFormId ? allForms : hrForms) : managerForms;
  const isLoading = isHr ? (selectedFormId ? allFormsLoading : hrFormsLoading) : managerFormsLoading;

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

  const submittedCount = useMemo(
    () => (forms ?? []).filter((f: any) => {
      const s = (f.status ?? '').toUpperCase();
      return s === 'SUBMITTED' || s === 'EMPLOYEE_SUBMITTED';
    }).length,
    [forms],
  );
  const reviewedCount = useMemo(
    () => (forms ?? []).filter((f: any) => (f.status ?? '').toUpperCase() === 'MANAGER_REVIEWED').length,
    [forms],
  );
  const approvedCount = useMemo(
    () => (forms ?? []).filter((f: any) => {
      const s = (f.status ?? '').toUpperCase();
      return s === 'APPROVED' || s === 'COMPLETED';
    }).length,
    [forms],
  );
  const totalCount = (forms ?? []).length;

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

  const handleHrRejectAdjustment = async () => {
    if (!selectedFormId || !rejectReason.trim() || !hasDefaultSignature) {
      toast.error('Enter a rejection reason and set a default signature in Signature Settings.');
      return;
    }

    try {
      await hrRejectManagerReview({
        formId: selectedFormId,
        request: { rejectionReason: rejectReason },
      }).unwrap();
      toast.success('Manager adjustments rejected');
      setShowRejectModal(false);
      setRejectReason('');
      refetchForm();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to reject adjustments');
    }
  };

  const handleConfirmApproval = () => {
    if (approvalMode === 'adjustment') {
      handleHrApproveAdjustment();
      return;
    }
    handleHrApproveForm();
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

  if (isLoading) {
    return (
      <div className="min-h-screen px-6 py-6 md:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-72 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-96 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-800" />
            <div className="lg:col-span-2 h-96 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      label: 'Total Pending',
      value: totalCount,
      icon: FileText,
      lightBg: 'bg-blue-50 dark:bg-blue-950/30',
      lightIcon: 'text-blue-600 dark:text-blue-400',
      ring: 'ring-blue-500/20',
      bgGlow: 'bg-blue-500/10',
    },
    {
      label: 'Awaiting Review',
      value: submittedCount,
      icon: Hourglass,
      lightBg: 'bg-sky-50 dark:bg-sky-950/30',
      lightIcon: 'text-sky-600 dark:text-sky-400',
      ring: 'ring-sky-500/20',
      bgGlow: 'bg-sky-500/10',
    },
    {
      label: 'Manager Reviewed',
      value: reviewedCount,
      icon: ClipboardCheck,
      lightBg: 'bg-amber-50 dark:bg-amber-950/30',
      lightIcon: 'text-amber-600 dark:text-amber-400',
      ring: 'ring-amber-500/20',
      bgGlow: 'bg-amber-500/10',
    },
    {
      label: 'Approved',
      value: approvedCount,
      icon: CheckCircle2,
      lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      lightIcon: 'text-emerald-600 dark:text-emerald-400',
      ring: 'ring-emerald-500/20',
      bgGlow: 'bg-emerald-500/10',
    },
  ];

  const selectedStatusConfig = selectedForm ? getStatusConfig(selectedForm.status) : null;
  const SelectedStatusIcon = selectedStatusConfig?.icon ?? FileText;

  return (
    <div className="min-h-screen px-6 py-6 md:px-8 animate-fade-in">
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <span className="text-[#5D5FEF] dark:text-[#8b8ef7] font-medium">Home</span>
        <ChevronDown size={10} className="-rotate-90 opacity-50" />
        <span>Self Assessment</span>
        <ChevronDown size={10} className="-rotate-90 opacity-50" />
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {isHr ? 'HR Compliance Review' : 'Manager Review'}
        </span>
      </nav>

      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/25">
              <ShieldCheck size={22} className="text-white" />
            </div>
            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-[9px] font-bold text-white shadow-sm">
              {totalCount}
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {isHr ? 'HR Compliance Review' : 'Manager Review'}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 max-w-lg">
              {isHr
                ? 'Review and approve self-assessment forms with final authority'
                : 'Review self-assessment forms submitted by your team members'}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card, i) => (
          <div
            key={card.label}
            className="animate-fade-in-up group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700/60 dark:bg-slate-800/80"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${card.bgGlow} blur-2xl transition-all duration-500 group-hover:scale-150`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                  {card.value}
                </p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.lightBg} ring-1 ${card.ring}`}>
                <card.icon size={18} className={card.lightIcon} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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

        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          {selectedForm ? (
            <>
              <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '280ms' }}>
                <div className="relative border-b border-slate-100 dark:border-slate-700/60">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#5D5FEF]/[0.02] via-transparent to-[#5D5FEF]/[0.02] dark:from-[#5D5FEF]/[0.04] dark:via-transparent dark:to-[#5D5FEF]/[0.04]" />
                  <div className="relative px-6 py-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/20">
                          <User size={20} className="text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                            {selectedForm.employee?.employeeName}
                          </h2>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Building2 size={13} />
                              {selectedForm.employee?.departmentName}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <ClipboardCheck size={13} />
                              {selectedForm.employee?.positionName}
                            </span>
                          </div>
                          {selectedForm.assessmentDate && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                              <Clock size={12} />
                              Assessment: {formatDateDayMonthYear(selectedForm.assessmentDate)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${selectedStatusConfig?.bg} ${selectedStatusConfig?.text}`}>
                          <SelectedStatusIcon size={13} />
                          {selectedStatusConfig?.label}
                        </span>
                        {selectedForm.totalScore !== null && (
                          <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5">
                            <Star size={14} className="text-amber-500 fill-amber-500" />
                            <span className="text-sm font-extrabold tabular-nums text-amber-700 dark:text-amber-400">
                              {selectedForm.totalScore.toFixed(1)}%
                            </span>
                            {selectedForm.ratingCategory && (
                              <>
                                <span className="h-3 w-px bg-amber-300 dark:bg-amber-700" />
                                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                  {selectedForm.ratingCategory}
                                </span>
                              </>
                            )}
                          </div>
                        )}
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
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {selectedForm.answers?.length ?? 0} questions
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedForm.answers?.map((answer: any, index: number) => (
                      <div
                        key={answer.id}
                        className="group relative rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-slate-300/80 hover:shadow-sm dark:border-slate-700/60 dark:bg-slate-800/40 dark:hover:border-slate-600/80"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/60">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Q{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2.5">
                              {answer.questionText}
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 dark:bg-slate-700/40">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Response</span>
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
                                <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 dark:bg-amber-900/20">
                                  <Star size={12} className="text-amber-500 fill-amber-500" />
                                  <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{answer.rating}</span>
                                </div>
                              )}
                            </div>
                            {answer.remarks && (
                              <div className="mt-2.5 rounded-lg bg-slate-50/80 px-3 py-2 dark:bg-slate-700/30">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 font-semibold uppercase tracking-wider">Remarks</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{answer.remarks}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {answer.managerProposedYesNo && (
                          <div className="mt-3 ml-10 rounded-xl border border-amber-200/80 bg-amber-50/50 p-3.5 dark:border-amber-700/60 dark:bg-amber-900/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Edit3 size={13} className="text-amber-600 dark:text-amber-400" />
                              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                Manager Adjustment
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <div className="inline-flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 dark:bg-slate-800/60">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">From</span>
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                  {answer.yesNoAnswer} ({answer.rating})
                                </span>
                              </div>
                              <div className="flex items-center text-slate-300 dark:text-slate-600">
                                <ArrowLeft size={12} className="rotate-180" />
                              </div>
                              <div className="inline-flex items-center gap-2 rounded-lg bg-amber-100 px-2.5 py-1.5 dark:bg-amber-800/40">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">To</span>
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                  {answer.managerProposedYesNo} ({answer.managerProposedRating})
                                </span>
                              </div>
                            </div>
                            {answer.managerProposedComment && (
                              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 italic">
                                "{answer.managerProposedComment}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedForm.employeeRemarks && (
                  <div className="mx-6 mb-5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-700/60 dark:bg-slate-700/20">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare size={14} className="text-slate-500 dark:text-slate-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Employee Remarks</h4>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{selectedForm.employeeRemarks}</p>
                  </div>
                )}

                {selectedForm.managerComments && (
                  <div className="mx-6 mb-5 rounded-xl border border-blue-200/80 bg-blue-50/50 p-4 dark:border-blue-700/60 dark:bg-blue-900/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={14} className="text-blue-600 dark:text-blue-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Manager Comments</h4>
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
              </div>

              {!isHr && selectedForm.status === 'SUBMITTED' && (
                <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '320ms' }}>
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
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className={`relative flex h-5 w-9 items-center rounded-full transition-colors ${showAdjustments ? 'bg-[#5D5FEF]' : 'bg-slate-300 dark:bg-slate-600'}`}>
                          <div className={`absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${showAdjustments ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Propose Adjustments
                          </span>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Adjust individual answers with your proposed rating and required comment
                          </p>
                        </div>
                      </label>
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
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                              );
                            })()}
                          </div>
                        ))}
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

              {isHr && selectedForm.status === 'MANAGER_REVIEWED' && (
                <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '320ms' }}>
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
                          Signature Settings
                        </Link>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 mb-3">
                        All HR actions will be signed with your default signature.
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

                    {selectedForm.answers?.some((a: any) => a.managerProposedYesNo) && (
                      <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-700/60 dark:bg-amber-900/20">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle size={15} className="text-amber-600 dark:text-amber-400" />
                          <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                            Manager adjustments pending your review
                          </p>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          <button
                            onClick={() => {
                              setApprovalMode('adjustment');
                              setShowApprovalModal(true);
                            }}
                            disabled={isDefaultSigLoading || !hasDefaultSignature}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/20 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            <ThumbsUp size={16} />
                            Approve Adjustments
                          </button>
                          <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={isDefaultSigLoading || !hasDefaultSignature}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-red-500 to-red-600 shadow-md shadow-red-500/20 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            <ThumbsDown size={16} />
                            Reject Adjustments
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 flex-wrap pt-2">
                      <button
                        onClick={() => {
                          setApprovalMode('final');
                          setShowApprovalModal(true);
                        }}
                        disabled={isDefaultSigLoading || !hasDefaultSignature}
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/25 hover:shadow-xl hover:shadow-[#5D5FEF]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <CheckCircle2 size={16} />
                        Final Approval
                      </button>
                      <button
                        onClick={() => handleHrReopenForm()}
                        disabled={isReopening || isDefaultSigLoading || !hasDefaultSignature}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-amber-500/20 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {isReopening ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                        Reopen for Employee
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-white py-24 px-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '280ms' }}>
              <div className="relative mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700/60">
                  <Eye size={36} className="text-slate-300 dark:text-slate-500" />
                </div>
                <div className="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/25">
                  <FileText size={14} className="text-white" />
                </div>
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">Select a form to review</p>
              <p className="mt-1.5 max-w-sm text-center text-sm text-slate-400 dark:text-slate-500">
                Choose a self-assessment form from the queue to view its details and take action
              </p>
            </div>
          )}
        </div>
      </div>

      {showApprovalModal && (
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
                ? 'You are about to approve the manager\'s proposed adjustments. This will update the employee\'s answers accordingly.'
                : 'You are about to give final approval to this self-assessment form. This will finalize the assessment.'}
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
                onClick={handleConfirmApproval}
                disabled={isHrApproving || isApproving || isDefaultSigLoading || !hasDefaultSignature}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isHrApproving || isApproving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-6 shadow-2xl dark:border-slate-700/60 dark:bg-slate-800 animate-fade-in-up">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                <XCircle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reject Adjustments</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Provide a clear reason for the rejection</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Please explain why you are rejecting the manager's proposed adjustments.
            </p>
            <div className="mb-4">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className={`${filterControlClass} resize-none`}
                placeholder="Explain your reasoning..."
              />
            </div>
            <div className="mb-5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-700/60 dark:bg-slate-700/20">
              <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <PenLine size={12} />
                Your default signature will be recorded for this action.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleHrRejectAdjustment}
                disabled={isHrRejecting || isDefaultSigLoading || !hasDefaultSignature || !rejectReason.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-red-500 to-red-600 shadow-md shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isHrRejecting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <XCircle size={16} />
                )}
                Reject Adjustments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
