import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FileText, CheckCircle2, XCircle, AlertCircle, PenLine, Loader2 } from 'lucide-react';
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {isHr ? 'HR Compliance Review' : 'Manager Review'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isHr ? 'Review and approve self-assessment forms' : 'Review self-assessment forms from your team'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Forms</h2>
          <div className="space-y-2">
            {forms && forms.length > 0 ? (
              forms.map((form: any) => (
                <div
                  key={form.id}
                  onClick={() => setSelectedFormId(form.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedFormId === form.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{form.employee?.employeeName}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{form.employee?.departmentName}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      form.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      form.status === 'MANAGER_REVIEWED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      form.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {form.status}
                    </span>
                  </div>
                  {form.totalScore !== null && (
                    <p className="text-sm mt-1 text-slate-600 dark:text-slate-300">
                      Score: {form.totalScore.toFixed(1)}%
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No forms to review
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedForm ? (
            <>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {selectedForm.employee?.employeeName}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {selectedForm.employee?.departmentName} - {selectedForm.employee?.positionName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      selectedForm.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      selectedForm.status === 'MANAGER_REVIEWED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      selectedForm.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      selectedForm.status === 'REOPENED' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {selectedForm.status}
                    </span>
                    {selectedForm.totalScore !== null && (
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Score: {selectedForm.totalScore.toFixed(1)}% ({selectedForm.ratingCategory})
                      </span>
                    )}
                  </div>
                </div>

                {selectedForm.assessmentDate && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Assessment date:</span>{' '}
                    {formatDateDayMonthYear(selectedForm.assessmentDate)}
                  </p>
                )}

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                  <h3 className="font-medium text-slate-900 dark:text-white mb-4">Answers</h3>
                  <div className="space-y-4">
                    {selectedForm.answers?.map((answer: any, index: number) => (
                      <div key={answer.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Q{index + 1}</span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{answer.questionText}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Response:</span>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{answer.yesNoAnswer || '-'}</p>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Rating:</span>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{answer.rating || '-'}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-500 dark:text-slate-400">Remarks:</span>
                            <p className="text-slate-600 dark:text-slate-300">{answer.remarks || '-'}</p>
                          </div>
                        </div>

                        {answer.managerProposedYesNo && (
                          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
                            <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">Manager Proposed Adjustment</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-slate-500 dark:text-slate-400">Original:</span>
                                <p className="font-medium text-slate-700 dark:text-slate-200">{answer.yesNoAnswer} ({answer.rating})</p>
                              </div>
                              <div>
                                <span className="text-slate-500 dark:text-slate-400">Proposed:</span>
                                <p className="font-medium text-amber-700 dark:text-amber-300">{answer.managerProposedYesNo} ({answer.managerProposedRating})</p>
                              </div>
                              <div className="col-span-2">
                                <span className="text-slate-500 dark:text-slate-400">Comment:</span>
                                <p className="text-slate-600 dark:text-slate-300">{answer.managerProposedComment}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedForm.employeeRemarks && (
                  <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Employee Remarks</h4>
                    <p className="text-slate-700 dark:text-slate-200">{selectedForm.employeeRemarks}</p>
                  </div>
                )}

                {selectedForm.managerComments && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Manager Comments</h4>
                    <p className="text-slate-700 dark:text-slate-200">{selectedForm.managerComments}</p>
                    {selectedForm.managerSignatureDate && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Signed on {formatDateTimeWithSeconds(selectedForm.managerSignatureDate)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {!isHr && selectedForm.status === 'SUBMITTED' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Submit Review</h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Comments
                    </label>
                    <textarea
                      value={managerComments}
                      onChange={(e) => setManagerComments(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="Add your comments..."
                    />
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showAdjustments}
                        onChange={(e) => setShowAdjustments(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Propose Adjustments
                      </span>
                    </label>
                  </div>

                  {showAdjustments && (
                    <div className="space-y-3 mb-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        For each answer you want to adjust, provide the proposed value and a comment (required).
                      </p>
                      {selectedForm.answers?.map((answer: any, index: number) => (
                        <div key={answer.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                          {(() => {
                            const currentAdjustment = adjustments.find(a => a.answerId === answer.id);
                            const proposedYesNo = currentAdjustment?.proposedYesNo || '';
                            return (
                            <>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Q{index + 1}: {answer.questionText}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Proposed Yes/No</label>
                              <select
                                value={proposedYesNo}
                                onChange={(e) => handleManagerAdjustmentChange(answer.id, 'proposedYesNo', e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm"
                              >
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </select>
                            </div>
                            <div className="md:col-span-1 min-w-0">
                              <label className="block text-xs text-slate-500 mb-1">Proposed Rating</label>
                              {(() => {
                                const pr = currentAdjustment?.proposedRating;
                                const allowed = getRatingOptions(selectedForm?.ratingSystem, proposedYesNo);
                                const ratingValue =
                                  pr && pr > 0 && allowed.includes(pr) ? pr : null;
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
                              <label className="block text-xs text-slate-500 mb-1">Comment (Required)</label>
                              <input
                                type="text"
                                value={adjustments.find(a => a.answerId === answer.id)?.comment || ''}
                                onChange={(e) => handleManagerAdjustmentChange(answer.id, 'comment', e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm"
                                placeholder="Reason for adjustment"
                              />
                            </div>
                          </div>
                          </>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleSubmitManagerReview}
                    disabled={isManagerReviewing}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Submit Review
                  </button>
                </div>
              )}

              {isHr && selectedForm.status === 'MANAGER_REVIEWED' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">HR Actions</h3>

                  <div className="mb-6 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40 p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          Signature for HR actions
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Approvals and reopen use your default signature from Signature Settings.
                        </p>
                      </div>
                      <Link
                        to="/hr/settings/signature"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
                      >
                        <PenLine size={14} />
                        Signature Settings
                      </Link>
                    </div>
                    <div className="mt-3 flex items-center justify-center min-h-[72px] rounded-md border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/80 px-3 py-2">
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
                          No default signature yet. Open Signature Settings to create one.
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedForm.answers?.some((a: any) => a.managerProposedYesNo) && (
                    <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-3">
                        Manager has proposed adjustments. Please approve or reject them.
                      </p>
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={() => {
                            setApprovalMode('adjustment');
                            setShowApprovalModal(true);
                          }}
                          disabled={isDefaultSigLoading || !hasDefaultSignature}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 size={16} />
                          Approve Adjustments
                        </button>
                        <button
                          onClick={() => setShowRejectModal(true)}
                          disabled={isDefaultSigLoading || !hasDefaultSignature}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          <XCircle size={16} />
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
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} />
                      Final Approval
                    </button>
                    <button
                      onClick={() => handleHrReopenForm()}
                      disabled={isReopening || isDefaultSigLoading || !hasDefaultSignature}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                    >
                      <AlertCircle size={16} />
                      Reopen for Employee
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-center">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">Select a form to view details</p>
            </div>
          )}
        </div>
      </div>

      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Confirm Approval</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Are you sure you want to approve this form? This action will finalize the assessment.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Your default signature from Signature Settings will be recorded for this action.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApproval}
                disabled={isHrApproving || isApproving || isDefaultSigLoading || !hasDefaultSignature}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Reject Adjustments</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Please provide a reason for rejecting the manager's proposed adjustments.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Rejection Reason
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Your default signature from Signature Settings will be recorded for this action.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleHrRejectAdjustment}
                disabled={isHrRejecting || isDefaultSigLoading || !hasDefaultSignature}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject Adjustments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
