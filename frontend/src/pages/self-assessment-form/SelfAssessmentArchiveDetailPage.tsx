import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Archive, Loader2, FileText, Clock, AlertCircle, User } from 'lucide-react';
import { useGetArchiveDetailQuery } from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

interface ArchiveDetailPageProps {
  basePath: string;
}

export const SelfAssessmentArchiveDetailPage: React.FC<ArchiveDetailPageProps> = ({ basePath }) => {
  const navigate = useNavigate();
  const archiveListPath = `${basePath}/archive`;
  const { archiveId } = useParams<{ archiveId: string }>();
  const numericId = Number(archiveId);

  const { data: snapshot, isLoading, error } = useGetArchiveDetailQuery(numericId, {
    skip: !numericId,
  });

  let parsedSnapshot: Record<string, unknown> | null = null;
  if (snapshot?.formSnapshot) {
    try {
      parsedSnapshot = JSON.parse(snapshot.formSnapshot);
    } catch {
      parsedSnapshot = null;
    }
  }

  const answers = React.useMemo(() => {
    if (!parsedSnapshot) return [];
    const raw = (parsedSnapshot as Record<string, unknown>).answers;
    return Array.isArray(raw) ? raw : [];
  }, [parsedSnapshot]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-slate-400" />
        <span className="ml-3 text-slate-500 dark:text-slate-400">Loading archive detail...</span>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={40} className="text-red-400 mb-3" />
        <p className="text-lg font-semibold text-slate-900 dark:text-white">Archive Not Found</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">The requested archive snapshot could not be loaded.</p>
        <button
          onClick={() => navigate(archiveListPath)}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
        >
          <ArrowLeft size={16} />
          Back to Archive
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(archiveListPath)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/20">
          <Archive size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Archived Self-Assessment</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Snapshot of rejected form for {snapshot.employeeName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-lg dark:border-slate-700/60 dark:bg-slate-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <User size={18} />
            Employee Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Name</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">{snapshot.employeeName}</span>
            </div>
            {snapshot.employeeStaffNo && (
              <div className="flex justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Staff No</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{snapshot.employeeStaffNo}</span>
              </div>
            )}
            {snapshot.departmentName && (
              <div className="flex justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Department</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{snapshot.departmentName}</span>
              </div>
            )}
            {snapshot.positionName && (
              <div className="flex justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Position</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{snapshot.positionName}</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-lg dark:border-slate-700/60 dark:bg-slate-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <FileText size={18} />
            Form Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Template</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">{snapshot.templateTitle}</span>
            </div>
            {snapshot.cycleName && (
              <div className="flex justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Cycle</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{snapshot.cycleName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Archived Status</span>
              <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {snapshot.archivedStatus?.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Original Form ID</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">#{snapshot.originalFormId}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-lg dark:border-slate-700/60 dark:bg-slate-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <AlertCircle size={18} />
            Rejection Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Rejected By</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">{snapshot.hrUserName || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Archived At</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">{formatDateTime(snapshot.archivedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Retake Deadline</span>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">{formatDate(snapshot.retakeDeadline)}</span>
            </div>
            <div className="mt-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">Rejection Reason</span>
              <p className="mt-1 text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                {snapshot.rejectionReason}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-lg dark:border-slate-700/60 dark:bg-slate-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <Clock size={18} />
            Scores
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Total Score</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">{snapshot.totalScore ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Manager Revised Score</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">{snapshot.managerRevisedTotalScore ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Final Approved Score</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">{snapshot.finalApprovedTotalScore ?? '-'}</span>
            </div>
            {snapshot.ratingCategory && (
              <div className="flex justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Rating Category</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{snapshot.ratingCategory}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {answers.length > 0 && (
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-lg dark:border-slate-700/60 dark:bg-slate-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <FileText size={18} />
            Archived Answers ({answers.length})
          </h2>
          <div className="space-y-4">
            {answers.map((answer: Record<string, unknown>, idx: number) => (
              <div
                key={typeof answer.answerId === 'number' ? answer.answerId : idx}
                className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-700/40 dark:bg-slate-700/20"
              >
                <p className="mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  Q{typeof answer.sortOrder === 'number' ? answer.sortOrder : idx + 1}
                </p>
                <p className="mb-3 text-sm font-medium text-slate-900 dark:text-white">
                  {typeof answer.questionText === 'string' ? answer.questionText : '-'}
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Yes/No: </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {typeof answer.yesNoAnswer === 'string' ? answer.yesNoAnswer : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Rating: </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {answer.rating != null ? String(answer.rating) : '-'}
                    </span>
                  </div>
                  {typeof answer.remarks === 'string' && answer.remarks && (
                    <div className="col-span-2">
                      <span className="text-slate-500 dark:text-slate-400">Remarks: </span>
                      <span className="text-slate-700 dark:text-slate-300">{answer.remarks}</span>
                    </div>
                  )}
                  {typeof answer.managerProposedRating === 'number' && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Manager Proposed Rating: </span>
                      <span className="font-medium text-slate-900 dark:text-white">{answer.managerProposedRating}</span>
                    </div>
                  )}
                  {typeof answer.finalApprovedRating === 'number' && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Final Approved Rating: </span>
                      <span className="font-medium text-slate-900 dark:text-white">{answer.finalApprovedRating}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelfAssessmentArchiveDetailPage;
