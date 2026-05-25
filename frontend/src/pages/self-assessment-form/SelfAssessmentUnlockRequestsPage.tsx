import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, KeyRound, MessageSquare, Search, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useGetSelfAssessmentUnlockRequestsQuery,
  useRejectSelfAssessmentUnlockRequestMutation,
  useUnlockSelfAssessmentRequestMutation,
  SELF_ASSESSMENT_UNLOCK_HR_APPROVE_REASON_OPTIONS,
  SELF_ASSESSMENT_UNLOCK_REASON_OPTIONS,
  SELF_ASSESSMENT_UNLOCK_REJECT_REASON_OPTIONS,
  type SelfAssessmentUnlockHrApproveReasonCode,
  type SelfAssessmentUnlockHrRejectReasonCode,
  type SelfAssessmentUnlockRequestDto,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { formatDateDayMonthYear } from '../../utils/dateUtils';

const employeeReasonLabel = (value?: string | null) =>
  SELF_ASSESSMENT_UNLOCK_REASON_OPTIONS.find((r) => r.value === value)?.label ?? value ?? 'Other';

const hrApproveReasonLabel = (value?: string | null) =>
  SELF_ASSESSMENT_UNLOCK_HR_APPROVE_REASON_OPTIONS.find((r) => r.value === value)?.label
  ?? SELF_ASSESSMENT_UNLOCK_REASON_OPTIONS.find((r) => r.value === value)?.label
  ?? value
  ?? 'Other';

const hrRejectReasonLabel = (value?: string | null) =>
  SELF_ASSESSMENT_UNLOCK_REJECT_REASON_OPTIONS.find((r) => r.value === value)?.label ?? value ?? 'Other';

const fmt = (value?: string | null) => (value ? formatDateDayMonthYear(value) : 'N/A');

export const SelfAssessmentUnlockRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data = [], isLoading, refetch } = useGetSelfAssessmentUnlockRequestsQuery();
  const [unlockRequest, { isLoading: isUnlocking }] = useUnlockSelfAssessmentRequestMutation();
  const [rejectRequest] = useRejectSelfAssessmentUnlockRequestMutation();
  const [selected, setSelected] = useState<SelfAssessmentUnlockRequestDto | null>(null);
  const [mode, setMode] = useState<'unlock' | 'reject' | 'viewReason' | null>(null);
  const [unlockReasonCode, setUnlockReasonCode] = useState<SelfAssessmentUnlockHrApproveReasonCode | ''>('');
  const [rejectReasonCode, setRejectReasonCode] = useState<SelfAssessmentUnlockHrRejectReasonCode | ''>('');
  const [reasonText, setReasonText] = useState('');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((item) =>
      !q ||
      [item.employeeName, item.employeeNumber, item.formTitle, item.cycleName, item.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [data, query]);

  const closeModal = () => {
    setSelected(null);
    setMode(null);
    setUnlockReasonCode('');
    setRejectReasonCode('');
    setReasonText('');
  };

  const submitDecision = async () => {
    if (!selected || !mode) return;

    if (mode === 'unlock') {
      if (!unlockReasonCode) return;
      if (unlockReasonCode === 'OTHER' && !reasonText.trim()) {
        toast.error('Please enter HR reason details');
        return;
      }
      try {
        await unlockRequest({
          requestId: selected.id,
          request: {
            reasonCode: unlockReasonCode,
            reasonText: unlockReasonCode === 'OTHER' ? reasonText.trim() : null,
          },
        }).unwrap();
        toast.success('Form unlocked');
        closeModal();
        refetch();
      } catch (error: any) {
        toast.error(error?.data?.message || 'Failed to unlock form');
      }
      return;
    }

    if (!rejectReasonCode) return;
    if (rejectReasonCode === 'OTHER' && !reasonText.trim()) {
      toast.error('Please enter reason details');
      return;
    }

    try {
      await rejectRequest({
        requestId: selected.id,
        request: {
          reasonCode: rejectReasonCode,
          reasonText: rejectReasonCode === 'OTHER' ? reasonText.trim() : null,
        },
      }).unwrap();
      toast.success('Unlock request rejected');
      closeModal();
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to resolve request');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Unlock Requests</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review employee requests to edit submitted self-assessments.</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-indigo-100 focus:border-indigo-400 focus:ring-4 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            placeholder="Search requests"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Form</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Manager Deadline</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={7}>Loading requests...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={7}>No unlock requests found.</td></tr>
              ) : rows.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                    {item.employeeName || 'N/A'}
                    <div className="text-xs font-medium text-slate-500">{item.employeeNumber || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/hr/self-assessment/reviews/${item.formId}`, { state: { formId: item.formId } })}
                      className="text-left text-slate-700 transition-colors hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400"
                    >
                      <span className="font-medium underline-offset-2 hover:underline">
                        {item.formTitle || 'Self Assessment Form'}
                      </span>
                      <div className="text-xs text-slate-500">{item.cycleName || 'N/A'}</div>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {employeeReasonLabel(item.reasonCode)}
                    {item.reasonText && <div className="mt-1 max-w-xs text-xs text-slate-500">{item.reasonText}</div>}
                    {item.status === 'UNLOCKED' && item.hrReasonCode && (
                      <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400">
                        HR approval: {hrApproveReasonLabel(item.hrReasonCode)}
                        {item.hrReasonText && ` — ${item.hrReasonText}`}
                      </div>
                    )}
                    {item.status === 'REJECTED' && item.hrReasonCode && (
                      <div className="mt-2 text-xs text-rose-600 dark:text-rose-400">
                        HR rejection: {hrRejectReasonLabel(item.hrReasonCode)}
                        {item.hrReasonText && ` — ${item.hrReasonText}`}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmt(item.managerReviewDeadlineDate)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmt(item.requestedAt)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        title="View unlock reason"
                        onClick={() => { setSelected(item); setMode('viewReason'); }}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
                      >
                        <MessageSquare size={18} />
                      </button>
                      {item.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            title="Unlock form"
                            onClick={() => { setSelected(item); setMode('unlock'); }}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                          >
                            <KeyRound size={18} />
                          </button>
                          <button
                            type="button"
                            title="Reject request"
                            onClick={() => { setSelected(item); setMode('reject'); }}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {mode === 'unlock' ? 'Unlock Form' : mode === 'reject' ? 'Reject Request' : 'Unlock Reason'}
            </h2>
            {mode === 'viewReason' ? (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Requested by{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {selected.requestedByName || selected.employeeName || 'Employee'}
                  </span>
                  {selected.requestedAt ? ` on ${fmt(selected.requestedAt)}` : ''}.
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Reason category</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {employeeReasonLabel(selected.reasonCode)}
                  </p>
                  {selected.reasonText ? (
                    <>
                      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Details</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                        {selected.reasonText}
                      </p>
                    </>
                  ) : selected.reasonCode === 'OTHER' ? (
                    <p className="mt-4 text-sm italic text-slate-500 dark:text-slate-400">No additional details provided.</p>
                  ) : null}
                </div>
              </div>
            ) : mode === 'unlock' ? (
              <div className="mt-5 space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Unlock the self-assessment for <span className="font-semibold">{selected.employeeName || 'this employee'}</span>.
                  The resubmission deadline will be set to the manager review deadline
                  {selected.managerReviewDeadlineDate ? ` (${fmt(selected.managerReviewDeadlineDate)})` : ''}.
                </p>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">HR reason</label>
                  <select
                    value={unlockReasonCode}
                    onChange={(e) => {
                      const value = e.target.value as SelfAssessmentUnlockHrApproveReasonCode | '';
                      setUnlockReasonCode(value);
                      if (value !== 'OTHER') setReasonText('');
                    }}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="">Select a reason...</option>
                    {SELF_ASSESSMENT_UNLOCK_HR_APPROVE_REASON_OPTIONS.map((reason) => (
                      <option key={reason.value} value={reason.value}>{reason.label}</option>
                    ))}
                  </select>
                </div>
                {unlockReasonCode === 'OTHER' && (
                  <textarea
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    placeholder="Enter details..."
                  />
                )}
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Rejection reason</label>
                  <select
                    value={rejectReasonCode}
                    onChange={(e) => {
                      const value = e.target.value as SelfAssessmentUnlockHrRejectReasonCode | '';
                      setRejectReasonCode(value);
                      if (value !== 'OTHER') setReasonText('');
                    }}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="">Select a reason...</option>
                    {SELF_ASSESSMENT_UNLOCK_REJECT_REASON_OPTIONS.map((reason) => (
                      <option key={reason.value} value={reason.value}>{reason.label}</option>
                    ))}
                  </select>
                </div>
                {rejectReasonCode === 'OTHER' && (
                  <textarea
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    placeholder="Enter details..."
                  />
                )}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={isUnlocking}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold dark:border-slate-700 dark:text-slate-200 disabled:opacity-50"
              >
                {mode === 'viewReason' ? 'Close' : 'Cancel'}
              </button>
              {mode !== 'viewReason' && (
                <button
                  type="button"
                  onClick={submitDecision}
                  disabled={
                    isUnlocking
                    || (mode === 'unlock' && (!unlockReasonCode || (unlockReasonCode === 'OTHER' && !reasonText.trim())))
                    || (mode === 'reject' && (!rejectReasonCode || (rejectReasonCode === 'OTHER' && !reasonText.trim())))
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <CheckCircle2 size={16} /> Confirm
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
