import React, { useMemo, useState } from 'react';
import { CheckCircle2, KeyRound, Search, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useGetSelfAssessmentUnlockRequestsQuery,
  useRejectSelfAssessmentUnlockRequestMutation,
  useUnlockSelfAssessmentRequestMutation,
  type SelfAssessmentUnlockReasonCode,
  type SelfAssessmentUnlockRequestDto,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { formatDateDayMonthYear } from '../../utils/dateUtils';

const REASONS: { value: SelfAssessmentUnlockReasonCode; label: string }[] = [
  { value: 'TYPO_COMMENT', label: 'Typo or comment correction' },
  { value: 'WRONG_RATING', label: 'Wrong rating selected' },
  { value: 'INCOMPLETE_ANSWER', label: 'Incomplete answer' },
  { value: 'WRONG_ANSWER', label: 'Wrong answer selected' },
  { value: 'OTHER', label: 'Other' },
];

const reasonLabel = (value?: string | null) => REASONS.find((r) => r.value === value)?.label ?? 'Other';
const fmt = (value?: string | null) => (value ? formatDateDayMonthYear(value) : 'N/A');

export const SelfAssessmentUnlockRequestsPage: React.FC = () => {
  const { data = [], isLoading, refetch } = useGetSelfAssessmentUnlockRequestsQuery();
  const [unlockRequest] = useUnlockSelfAssessmentRequestMutation();
  const [rejectRequest] = useRejectSelfAssessmentUnlockRequestMutation();
  const [selected, setSelected] = useState<SelfAssessmentUnlockRequestDto | null>(null);
  const [mode, setMode] = useState<'unlock' | 'reject' | null>(null);
  const [reasonCode, setReasonCode] = useState<SelfAssessmentUnlockReasonCode | ''>('');
  const [reasonText, setReasonText] = useState('');
  const [deadline, setDeadline] = useState('');
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
    setReasonCode('');
    setReasonText('');
    setDeadline('');
  };

  const submitDecision = async () => {
    if (!selected || !mode || !reasonCode) return;
    if (reasonCode === 'OTHER' && !reasonText.trim()) {
      toast.error('Please enter reason details');
      return;
    }
    if (mode === 'unlock') {
      if (!deadline) {
        toast.error('Please set a resubmission deadline');
        return;
      }
      if (selected.managerReviewDeadlineDate && deadline >= selected.managerReviewDeadlineDate) {
        toast.error('Deadline must be before manager review deadline');
        return;
      }
    }
    try {
      const request = { reasonCode, reasonText: reasonCode === 'OTHER' ? reasonText.trim() : null };
      if (mode === 'unlock') {
        await unlockRequest({ requestId: selected.id, request: { ...request, unlockDeadline: deadline } }).unwrap();
        toast.success('Form unlocked');
      } else {
        await rejectRequest({ requestId: selected.id, request }).unwrap();
        toast.success('Unlock request rejected');
      }
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
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                    {item.formTitle || 'Self Assessment Form'}
                    <div className="text-xs text-slate-500">{item.cycleName || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {reasonLabel(item.reasonCode)}
                    {item.reasonText && <div className="mt-1 max-w-xs text-xs text-slate-500">{item.reasonText}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmt(item.managerReviewDeadlineDate)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmt(item.requestedAt)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setSelected(item); setMode('unlock'); }} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700">
                          <KeyRound size={14} /> Unlock
                        </button>
                        <button onClick={() => { setSelected(item); setMode('reject'); }} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/20">
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    )}
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
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{mode === 'unlock' ? 'Unlock Form' : 'Reject Request'}</h2>
            <div className="mt-5 space-y-4">
              {mode === 'unlock' && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Resubmission deadline</label>
                  <input type="date" value={deadline} max={selected.managerReviewDeadlineDate ? selected.managerReviewDeadlineDate : undefined} onChange={(e) => setDeadline(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                  <p className="mt-1 text-xs text-slate-500">Must be before {fmt(selected.managerReviewDeadlineDate)}.</p>
                </div>
              )}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">HR reason</label>
                <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value as SelfAssessmentUnlockReasonCode | '')} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                  <option value="">Select a reason...</option>
                  {REASONS.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}
                </select>
              </div>
              {reasonCode === 'OTHER' && (
                <textarea value={reasonText} onChange={(e) => setReasonText(e.target.value)} rows={4} className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" placeholder="Enter details..." />
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={closeModal} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold dark:border-slate-700 dark:text-slate-200">Cancel</button>
              <button onClick={submitDecision} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
                <CheckCircle2 size={16} /> Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
