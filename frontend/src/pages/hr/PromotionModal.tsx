import React, { useState } from 'react';
import { X, Rocket, Loader2, ClipboardCheck } from 'lucide-react';
import { useGetAvailablePositionsQuery, useProposePromotionMutation } from '../../features/performanceReport/performanceReportApi';

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  employeeName: string;
  currentPosition: string | null;
  departmentName: string | null;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  currentPosition,
  departmentName,
}) => {
  const { data: positions = [], isLoading: isLoadingPositions } = useGetAvailablePositionsQuery(employeeId, {
    skip: !isOpen,
  });

  const [proposePromotion, { isLoading: isSubmitting }] = useProposePromotionMutation();

  const [selectedPositionId, setSelectedPositionId] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPositionId) {
      setError('Please select a target position');
      return;
    }
    if (!effectiveDate) {
      setError('Please select an effective date');
      return;
    }

    setError('');
    try {
      await proposePromotion({
        employeeId,
        newPositionId: Number(selectedPositionId),
        effectiveDate,
        remarks: remarks || undefined,
      }).unwrap();
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to submit promotion proposal');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="text-indigo-600 dark:text-indigo-400" size={20} />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Propose Promotion</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
              <ClipboardCheck size={24} className="animate-bounce" />
            </div>
            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">Proposal Submitted!</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Promotion proposal has been successfully submitted to the Department Head for approval.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Employee details card */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800 text-sm space-y-2">
              <div>
                <span className="text-slate-400">Employee:</span>{' '}
                <strong className="text-slate-700 dark:text-slate-300">{employeeName}</strong>
              </div>
              <div>
                <span className="text-slate-400">Current Position:</span>{' '}
                <strong className="text-slate-700 dark:text-slate-300">{currentPosition || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-400">Department:</span>{' '}
                <strong className="text-slate-700 dark:text-slate-300">{departmentName || 'N/A'}</strong>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Position Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                Target Position <span className="text-red-500">*</span>
              </label>
              {isLoadingPositions ? (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                  <Loader2 size={16} className="animate-spin" />
                  Loading positions...
                </div>
              ) : (
                <select
                  required
                  value={selectedPositionId}
                  onChange={(e) => setSelectedPositionId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
                >
                  <option value="">Select Target Position</option>
                  {positions.map((pos) => (
                    <option key={pos.positionId} value={pos.positionId}>
                      {pos.positionName} {pos.levelCodeName ? `(${pos.levelCodeName})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Effective Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                Effective Date <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
              />
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                Proposal Remarks / Reason
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Specify the justification or remarks for this promotion proposal..."
                rows={3}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedPositionId}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Rocket size={16} />
                    Submit Proposal
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
