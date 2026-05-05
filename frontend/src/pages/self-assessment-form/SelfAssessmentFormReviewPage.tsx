import React, { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PenLine,
  Loader2,
  Search,
  ArrowRight,
  Shield,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  User,
  Building2,
  Calendar,
  MessageSquare,
  Star,
  TrendingUp,
  Eye,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Sparkles,
  X,
  Filter,
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
  const s = status?.toUpperCase();
  if (s === 'SUBMITTED' || s === 'EMPLOYEE_SUBMITTED')
    return { label: 'Submitted', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500', border: 'border-blue-200 dark:border-blue-800', icon: Send };
  if (s === 'MANAGER_REVIEWED')
    return { label: 'Manager Reviewed', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-800', icon: ClipboardCheck };
  if (s === 'APPROVED' || s === 'COMPLETED')
    return { label: 'Approved', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-800', icon: CheckCircle2 };
  if (s === 'REOPENED')
    return { label: 'Reopened', bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500', border: 'border-purple-200 dark:border-purple-800', icon: RotateCcw };
  if (s === 'REJECTED')
    return { label: 'Rejected', bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500', border: 'border-red-200 dark:border-red-800', icon: XCircle };
  return { label: status || 'Draft', bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400', border: 'border-slate-200 dark:border-slate-700', icon: FileText };
}

function Send(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>;
}

function ScoreRing({ score, size = 56 }: { score: number | null; size?: number }) {
  if (score === null || score === undefined) return null;
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-500';
  const strokeColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="3" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={strokeColor} strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <span className={`absolute text-xs font-bold ${color}`}>
        {score.toFixed(0)}
      </span>
    </div>
  );
}

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    if (!forms || !searchQuery.trim()) return forms;
    const q = searchQuery.toLowerCase();
    return (forms as any[]).filter((form: any) =>
      form.employee?.employeeName?.toLowerCase().includes(q) ||
      form.employee?.departmentName?.toLowerCase().includes(q) ||
      form.employee?.positionName?.toLowerCase().includes(q) ||
      form.status?.toLowerCase().includes(q)
    );
  }, [forms, searchQuery]);

  const summaryStats = useMemo(() => {
    if (!forms) return { total: 0, submitted: 0, reviewed: 0, approved: 0 };
    const arr = forms as any[];
    return {
      total: arr.length,
      submitted: arr.filter(f => f.status === 'SUBMITTED').length,
      reviewed: arr.filter(f => f.status === 'MANAGER_REVIEWED').length,
      approved: arr.filter(f => f.status === 'APPROVED').length,
    };
  }, [forms]);

  const handleManagerAdjustmentChange = (answerId: number, field: keyof ManagerAdjustment, value: string | number) => {
    setAdjustments(prev => {
      const existing = prev.find(a => a.answerId === answerId);
      const nextValue: Partial<ManagerAdjustment> =
        field === 'proposedYesNo'
          ? {
              proposedYesNo: String(value),
              ...(existing?.proposedRating
                && !isRatingValidForAnswer(selectedForm?.ratingSystem, String(value), existing.proposedRating)
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
        a => a.proposedYesNo && a.proposedRating && !isRatingValidForAnswer(selectedForm?.ratingSystem, a.proposedYesNo, a.proposedRating)
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
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 dark:border-emerald-900"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-t-emerald-600 dark:border-t-emerald-400 absolute inset-0"></div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Loading review forms...</p>
        </div>
      </div>
    );
  }

  const selectedStatusConfig = selectedForm ? getStatusConfig(selectedForm.status) : null;

  return (
    <div className="min-h-screen">
      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isHr ? 'HR Compliance Review' : 'Manager Review'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isHr ? 'Review and approve self-assessment forms for compliance' : 'Review and assess self-assessment forms from your team'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        {[
          { label: 'Total Forms', value: summaryStats.total, icon: FileText, color: 'from-slate-500 to-slate-600', bgLight: 'bg-slate-50 dark:bg-slate-800/50', textColor: 'text-slate-700 dark:text-slate-200' },
          { label: 'Submitted', value: summaryStats.submitted, icon: Send, color: 'from-blue-500 to-blue-600', bgLight: 'bg-blue-50 dark:bg-blue-950/30', textColor: 'text-blue-700 dark:text-blue-400' },
          { label: 'Reviewed', value: summaryStats.reviewed, icon: ClipboardCheck, color: 'from-amber-500 to-amber-600', bgLight: 'bg-amber-50 dark:bg-amber-950/30', textColor: 'text-amber-700 dark:text-amber-400' },
          { label: 'Approved', value: summaryStats.approved, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600', bgLight: 'bg-emerald-50 dark:bg-emerald-950/30', textColor: 'text-emerald-700 dark:text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bgLight} rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-4 transition-all hover:shadow-md`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{stat.label}</span>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className={`flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-12' : 'w-80'}`}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden sticky top-6">
            <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {!sidebarCollapsed && 'Review Queue'}
                </h2>
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className={`w-4 h-4 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
                </button>
              </div>
              {!sidebarCollapsed && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search forms..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className={`overflow-y-auto ${sidebarCollapsed ? '' : 'max-h-[calc(100vh-280px)]'}`}>
              {filteredForms && filteredForms.length > 0 ? (
                filteredForms.map((form: any) => {
                  const config = getStatusConfig(form.status);
                  const isSelected = selectedFormId === form.id;
                  return (
                    <div
                      key={form.id}
                      onClick={() => setSelectedFormId(form.id)}
                      className={`px-4 py-3 cursor-pointer transition-all duration-200 border-l-[3px] ${
                        isSelected
                          ? `bg-emerald-50/80 dark:bg-emerald-950/30 border-l-emerald-500`
                          : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-l-slate-300 dark:hover:border-l-slate-600'
                      }`}
                    >
                      {sidebarCollapsed ? (
                        <div className="flex justify-center">
                          <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${isSelected ? 'from-emerald-500 to-teal-500' : 'from-slate-400 to-slate-500'} flex items-center justify-center shadow-sm`}>
                              <span className="text-xs font-bold text-white">
                                {form.employee?.employeeName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className={`text-sm font-semibold truncate ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                {form.employee?.employeeName}
                              </p>
                              <div className={`flex-shrink-0 w-2 h-2 rounded-full ${config.dot}`} />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-1.5">
                              {form.employee?.departmentName}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${config.bg} ${config.text}`}>
                                {config.label}
                              </span>
                              {form.totalScore !== null && form.totalScore !== undefined && (
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                  {form.totalScore.toFixed(0)}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-12 text-center">
                  {!sidebarCollapsed && (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                        <Filter className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {searchQuery ? 'No matching forms' : 'No forms to review'}
                      </p>
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline mt-1">
                          Clear search
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-5">
          {selectedForm && selectedStatusConfig ? (
            <>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden animate-fade-in-up">
                <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800/50 px-6 py-5 border-b border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <span className="text-lg font-bold text-white">
                          {selectedForm.employee?.employeeName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          {selectedForm.employee?.employeeName}
                        </h2>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                            <Building2 className="w-3.5 h-3.5" />
                            {selectedForm.employee?.departmentName}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                            <User className="w-3.5 h-3.5" />
                            {selectedForm.employee?.positionName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {selectedForm.totalScore !== null && selectedForm.totalScore !== undefined && (
                        <div className="flex items-center gap-3">
                          <ScoreRing score={selectedForm.totalScore} />
                          <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Score</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {selectedForm.totalScore.toFixed(1)}%
                              {selectedForm.ratingCategory && (
                                <span className="ml-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">({selectedForm.ratingCategory})</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${selectedStatusConfig.bg} ${selectedStatusConfig.text} border ${selectedStatusConfig.border}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${selectedStatusConfig.dot}`} />
                        {selectedStatusConfig.label}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4">
                  <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                    {selectedForm.assessmentDate && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">Assessment Date:</span>
                        {formatDateDayMonthYear(selectedForm.assessmentDate)}
                      </span>
                    )}
                    {selectedForm.templateName && (
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">Template:</span>
                        {selectedForm.templateName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Assessment Answers</h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      ({selectedForm.answers?.length || 0} questions)
                    </span>
                  </div>
                  {selectedForm.answers?.some((a: any) => a.managerProposedYesNo) && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Has Manager Adjustments
                    </span>
                  )}
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedForm.answers?.map((answer: any, index: number) => {
                    const hasAdjustment = Boolean(answer.managerProposedYesNo);
                    return (
                      <div key={answer.id} className={`px-6 py-5 transition-colors ${hasAdjustment ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''}`}>
                        <div className="flex gap-4">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            hasAdjustment
                              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white mb-3 leading-relaxed">
                              {answer.questionText}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Response</span>
                                <span className={`inline-flex items-center justify-center min-w-[52px] px-2.5 py-1 rounded-lg text-xs font-bold ${
                                  answer.yesNoAnswer === 'Yes'
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                }`}>
                                  {answer.yesNoAnswer || '-'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Rating</span>
                                <div className="flex items-center gap-1">
                                  <Star className={`w-4 h-4 ${answer.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{answer.rating || '-'}</span>
                                </div>
                              </div>
                            </div>
                            {answer.remarks && (
                              <div className="mt-2 flex items-start gap-2">
                                <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{answer.remarks}</p>
                              </div>
                            )}

                            {hasAdjustment && (
                              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/40 rounded-xl">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-5 h-5 rounded-md bg-amber-200 dark:bg-amber-800 flex items-center justify-center">
                                    <PenLine className="w-3 h-3 text-amber-700 dark:text-amber-300" />
                                  </div>
                                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Manager Adjustment</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                  <div className="bg-white/60 dark:bg-slate-900/40 rounded-lg p-3 border border-slate-200/40 dark:border-slate-700/40">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">Original</span>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                        answer.yesNoAnswer === 'Yes' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                      }`}>{answer.yesNoAnswer}</span>
                                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        <Star className="w-3 h-3 inline fill-amber-400 text-amber-400 mr-0.5" />{answer.rating}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="bg-white/60 dark:bg-slate-900/40 rounded-lg p-3 border border-amber-200/60 dark:border-amber-700/40">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-500 dark:text-amber-400 block mb-1">Proposed</span>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                        answer.managerProposedYesNo === 'Yes' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                      }`}>{answer.managerProposedYesNo}</span>
                                      <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                                        <Star className="w-3 h-3 inline fill-amber-400 text-amber-400 mr-0.5" />{answer.managerProposedRating}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {answer.managerProposedComment && (
                                  <div className="flex items-start gap-2 pt-2 border-t border-amber-200/40 dark:border-amber-700/30">
                                    <MessageSquare className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{answer.managerProposedComment}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedForm.employeeRemarks && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm p-6 animate-fade-in-up">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Employee Remarks</h4>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-9">{selectedForm.employeeRemarks}</p>
                </div>
              )}

              {selectedForm.managerComments && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200/60 dark:border-blue-700/30 shadow-sm p-6 animate-fade-in-up">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <ClipboardCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Manager Comments</h4>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-9">{selectedForm.managerComments}</p>
                  {selectedForm.managerSignatureDate && (
                    <div className="flex items-center gap-1.5 mt-3 pl-9 text-xs text-slate-400 dark:text-slate-500">
                      <PenLine className="w-3 h-3" />
                      Signed on {formatDateTimeWithSeconds(selectedForm.managerSignatureDate)}
                    </div>
                  )}
                </div>
              )}

              {!isHr && selectedForm.status === 'SUBMITTED' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden animate-fade-in-up">
                  <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800/50">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <PenLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Submit Your Review</h3>
                    </div>
                  </div>
                  <div className="p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Comments
                      </label>
                      <textarea
                        value={managerComments}
                        onChange={(e) => setManagerComments(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all resize-none placeholder:text-slate-400"
                        placeholder="Share your assessment observations..."
                      />
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setShowAdjustments(!showAdjustments)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          showAdjustments
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                        }`}
                      >
                        <PenLine className="w-4 h-4" />
                        {showAdjustments ? 'Hide Adjustments Panel' : 'Propose Adjustments'}
                      </button>
                    </div>

                    {showAdjustments && (
                      <div className="space-y-4">
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-700/30 rounded-xl p-4">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-amber-700 dark:text-amber-400">
                              For each answer you want to adjust, select the proposed Yes/No, rating, and provide a comment (all required).
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {selectedForm.answers?.map((answer: any, qIndex: number) => {
                            const currentAdjustment = adjustments.find(a => a.answerId === answer.id);
                            const proposedYesNo = currentAdjustment?.proposedYesNo || '';
                            return (
                              <div key={answer.id} className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/40 rounded-xl p-5">
                                <div className="flex items-start gap-3 mb-4">
                                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{qIndex + 1}</span>
                                  </div>
                                  <p className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed flex-1">{answer.questionText}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-10">
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Proposed Yes/No</label>
                                    <select
                                      value={proposedYesNo}
                                      onChange={(e) => handleManagerAdjustmentChange(answer.id, 'proposedYesNo', e.target.value)}
                                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                                    >
                                      <option value="">Select</option>
                                      <option value="Yes">Yes</option>
                                      <option value="No">No</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Proposed Rating</label>
                                    {(() => {
                                      const pr = currentAdjustment?.proposedRating;
                                      const allowed = getRatingOptions(selectedForm?.ratingSystem, proposedYesNo);
                                      const ratingValue = pr && pr > 0 && allowed.includes(pr) ? pr : null;
                                      return (
                                        <SelfAssessmentRatingPicker
                                          compact
                                          ratingSystem={selectedForm?.ratingSystem}
                                          yesNoAnswer={proposedYesNo || null}
                                          value={ratingValue}
                                          onChange={(r) => handleManagerAdjustmentChange(answer.id, 'proposedRating', r)}
                                          disabled={!proposedYesNo}
                                        />
                                      );
                                    })()}
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Comment (Required)</label>
                                    <input
                                      type="text"
                                      value={adjustments.find(a => a.answerId === answer.id)?.comment || ''}
                                      onChange={(e) => handleManagerAdjustmentChange(answer.id, 'comment', e.target.value)}
                                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                                      placeholder="Reason for adjustment"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={handleSubmitManagerReview}
                        disabled={isManagerReviewing}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold text-sm hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30"
                      >
                        {isManagerReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Submit Review
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isHr && selectedForm.status === 'MANAGER_REVIEWED' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden animate-fade-in-up">
                  <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800/50">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">HR Actions</h3>
                    </div>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/30 p-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            Signature for HR actions
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Approvals and reopen actions use your default signature from Signature Settings.
                          </p>
                        </div>
                        <Link
                          to="/hr/settings/signature"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-200/60 dark:border-emerald-700/30"
                        >
                          <PenLine size={12} />
                          Signature Settings
                        </Link>
                      </div>
                      <div className="flex items-center justify-center min-h-[80px] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 px-4 py-3">
                        {isDefaultSigLoading ? (
                          <Loader2 className="animate-spin text-slate-400" size={24} />
                        ) : defaultSignature ? (
                          <img
                            src={resolveMediaSrc(defaultSignature.signatureData)}
                            alt="Your default signature"
                            className="max-h-16 max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-center">
                            <PenLine className="w-5 h-5 text-slate-300 dark:text-slate-600 mx-auto mb-1" />
                            <p className="text-xs text-slate-400 dark:text-slate-500">No default signature set</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedForm.answers?.some((a: any) => a.managerProposedYesNo) && (
                      <div className="rounded-xl border border-amber-200/60 dark:border-amber-700/40 bg-amber-50/60 dark:bg-amber-950/20 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-md bg-amber-200 dark:bg-amber-800 flex items-center justify-center">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                          </div>
                          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                            Manager has proposed adjustments that require your review.
                          </p>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          <button
                            onClick={() => {
                              setApprovalMode('adjustment');
                              setShowApprovalModal(true);
                            }}
                            disabled={isDefaultSigLoading || !hasDefaultSignature}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 shadow-lg shadow-emerald-500/20 transition-all"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            Approve Adjustments
                          </button>
                          <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={isDefaultSigLoading || !hasDefaultSignature}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl text-sm font-semibold hover:from-red-700 hover:to-rose-700 disabled:opacity-50 shadow-lg shadow-red-500/20 transition-all"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            Reject Adjustments
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => {
                          setApprovalMode('final');
                          setShowApprovalModal(true);
                        }}
                        disabled={isDefaultSigLoading || !hasDefaultSignature}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 shadow-lg shadow-emerald-500/20 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Final Approval
                      </button>
                      <button
                        onClick={() => handleHrReopenForm()}
                        disabled={isReopening || isDefaultSigLoading || !hasDefaultSignature}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700 rounded-xl text-sm font-semibold hover:bg-amber-50 dark:hover:bg-amber-950/20 disabled:opacity-50 transition-all"
                      >
                        {isReopening ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                        Reopen for Employee
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm p-16 text-center animate-fade-in-up">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mx-auto mb-5">
                <Eye className="w-9 h-9 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Select a Form to Review</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Choose a form from the review queue on the left to view its details and take action.
              </p>
            </div>
          )}
        </div>
      </div>

      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-0 max-w-md mx-4 w-full overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Confirm Approval</h3>
                  <p className="text-sm text-emerald-100">This action will be recorded</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Are you sure you want to approve this form? This action will finalize the assessment.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex items-start gap-2">
                <PenLine className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your default signature from Signature Settings will be recorded for this action.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmApproval}
                  disabled={isHrApproving || isApproving || isDefaultSigLoading || !hasDefaultSignature}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  Confirm Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-0 max-w-md mx-4 w-full overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Reject Adjustments</h3>
                  <p className="text-sm text-red-100">Provide a reason for rejection</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Please provide a reason for rejecting the manager's proposed adjustments.
              </p>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all resize-none placeholder:text-slate-400"
                  placeholder="Explain why the adjustments are being rejected..."
                />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex items-start gap-2">
                <PenLine className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your default signature from Signature Settings will be recorded for this action.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleHrRejectAdjustment}
                  disabled={isHrRejecting || isDefaultSigLoading || !hasDefaultSignature}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl text-sm font-semibold hover:from-red-700 hover:to-rose-700 disabled:opacity-50 shadow-lg shadow-red-500/20 transition-all"
                >
                  Reject Adjustments
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
