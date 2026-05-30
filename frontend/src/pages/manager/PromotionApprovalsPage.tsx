import { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  Calendar, 
  MessageSquare, 
  History, 
  ClipboardList,
  Loader2,
  Check,
  X,
  UserCheck
} from 'lucide-react';
import { 
  useGetPendingPromotionProposalsQuery, 
  useGetPromotionProposalsHistoryQuery, 
  useApprovePromotionProposalMutation, 
  useRejectPromotionProposalMutation 
} from '../../features/performanceReport/performanceReportApi';

export const PromotionApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const { data: pendingProposals = [], isLoading: isLoadingPending, refetch: refetchPending } = useGetPendingPromotionProposalsQuery();
  const { data: proposalsHistory = [], isLoading: isLoadingHistory, refetch: refetchHistory } = useGetPromotionProposalsHistoryQuery();

  const [approveProposal, { isLoading: isApproving }] = useApprovePromotionProposalMutation();
  const [rejectProposal, { isLoading: isRejecting }] = useRejectPromotionProposalMutation();

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleApprove = async (id: number) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await approveProposal(id).unwrap();
      setActionSuccess('Promotion proposal approved successfully.');
      refetchPending();
      refetchHistory();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err?.data?.message || 'Failed to approve proposal');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const handleReject = async (id: number) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await rejectProposal(id).unwrap();
      setActionSuccess('Promotion proposal rejected successfully.');
      refetchPending();
      refetchHistory();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err?.data?.message || 'Failed to reject proposal');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
            <Clock size={12} className="animate-pulse" /> Pending Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
            <CheckCircle size={12} /> Approved & Executed
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/50">
            <XCircle size={12} /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-200">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Promotion Approvals</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  Review and action promotion proposals submitted by HR for your department's members
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 w-fit self-start md:self-auto">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'pending'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/40 dark:border-slate-700/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <ClipboardList size={16} />
                Pending ({pendingProposals.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/40 dark:border-slate-700/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <History size={16} />
                History ({proposalsHistory.length})
              </button>
            </div>
          </div>

          {/* Action Status Toast alerts */}
          {(actionSuccess || actionError) && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              {actionSuccess && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400 rounded-xl text-sm font-semibold">
                  {actionSuccess}
                </div>
              )}
              {actionError && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 rounded-xl text-sm font-semibold">
                  {actionError}
                </div>
              )}
            </div>
          )}

          {/* Tab content */}
          {activeTab === 'pending' ? (
            isLoadingPending ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                <span>Loading pending proposals...</span>
              </div>
            ) : pendingProposals.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-12 text-center max-w-xl mx-auto space-y-4">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl flex items-center justify-center mx-auto text-indigo-500">
                  <Sparkles size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">No Pending Proposals</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  There are no pending promotion requests awaiting your decision at the moment. You'll be notified when HR proposes an eligible employee.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {pendingProposals.map((proposal) => (
                  <div 
                    key={proposal.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-5"
                  >
                    {/* Header of card */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                          {proposal.employeeName}
                        </h3>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Staff No: {proposal.staffNo || 'N/A'}
                        </p>
                      </div>
                      {renderStatusBadge(proposal.status)}
                    </div>

                    {/* Compare old/new positions */}
                    <div className="grid grid-cols-1 sm:grid-cols-7 items-center bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-sm gap-2">
                      <div className="sm:col-span-3 space-y-1">
                        <span className="text-xs font-bold text-slate-400 uppercase">Current Position</span>
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          {proposal.oldPositionName || 'N/A'}
                          <span className="block text-xs text-slate-400 font-medium">({proposal.departmentName})</span>
                        </div>
                      </div>
                      <div className="sm:col-span-1 flex justify-center text-indigo-500">
                        <ArrowRight className="rotate-90 sm:rotate-0" size={18} />
                      </div>
                      <div className="sm:col-span-3 space-y-1">
                        <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase">Target Position</span>
                        <div className="font-extrabold text-indigo-600 dark:text-indigo-400">
                          {proposal.targetPositionName}
                          <span className="block text-xs text-indigo-500 dark:text-indigo-400 font-bold">
                            ({proposal.targetDepartmentName || proposal.departmentName})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Calendar size={14} className="text-slate-400" />
                        <span>Effective Date: </span>
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{formatDate(proposal.effectiveDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <UserCheck size={14} className="text-slate-400" />
                        <span>Proposed By: </span>
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{proposal.requesterName}</span>
                      </div>
                    </div>

                    {/* Remarks */}
                    {proposal.remarks && (
                      <div className="bg-slate-50/50 dark:bg-slate-800/20 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800/40 text-xs text-slate-600 dark:text-slate-400 flex gap-2">
                        <MessageSquare size={14} className="mt-0.5 text-slate-400 flex-shrink-0" />
                        <div>
                          <span className="font-bold block text-slate-500 mb-0.5">Remarks / Reason:</span>
                          <span className="italic leading-relaxed">{proposal.remarks}</span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleReject(proposal.id)}
                        disabled={isApproving || isRejecting}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-red-600 hover:text-white border border-red-200 dark:border-red-900/50 hover:bg-red-600 hover:border-red-650 rounded-xl transition-all disabled:opacity-50"
                      >
                        <X size={15} />
                        Reject Proposal
                      </button>
                      <button
                        onClick={() => handleApprove(proposal.id)}
                        disabled={isApproving || isRejecting}
                        className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
                      >
                        <Check size={15} />
                        Approve & Promote
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                <span>Loading history...</span>
              </div>
            ) : proposalsHistory.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-12 text-center max-w-xl mx-auto space-y-4">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                  <History size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">No History Records</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  No promotion proposals have been actioned yet. Actions you take on proposals will be logged here.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50/75 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Promotion Stream</th>
                        <th className="px-6 py-4">Effective Date</th>
                        <th className="px-6 py-4">HR Proposer</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                      {proposalsHistory.map((proposal) => (
                        <tr key={proposal.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                          <td className="px-6 py-4.5">
                            <div>
                              <div className="font-bold text-slate-950 dark:text-slate-100">{proposal.employeeName}</div>
                              <div className="text-xs font-semibold text-slate-400 mt-0.5">Staff No: {proposal.staffNo}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4.5">
                            <div className="flex flex-col gap-0.5 text-xs font-semibold">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-500">{proposal.oldPositionName} ({proposal.departmentName})</span>
                                <ArrowRight size={12} className="text-slate-300" />
                                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{proposal.targetPositionName}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold">
                                to Department: {proposal.targetDepartmentName || proposal.departmentName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4.5 font-semibold text-slate-600 dark:text-slate-350">
                            {formatDate(proposal.effectiveDate)}
                          </td>
                          <td className="px-6 py-4.5 font-semibold text-slate-600 dark:text-slate-350">
                            {proposal.requesterName}
                          </td>
                          <td className="px-6 py-4.5">
                            {renderStatusBadge(proposal.status)}
                          </td>
                          <td className="px-6 py-4.5 text-xs text-slate-400 font-medium">
                            {proposal.updatedAt ? formatDateTime(proposal.updatedAt) : formatDateTime(proposal.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
