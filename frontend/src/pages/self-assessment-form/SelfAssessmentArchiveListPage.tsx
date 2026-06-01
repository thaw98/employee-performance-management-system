import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Search, Eye, ChevronLeft, ChevronRight, Loader2, FileText } from 'lucide-react';
import { useGetArchiveListQuery } from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import type { SelfAssessmentArchiveSnapshotDto } from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';

const filterControlClass =
  'w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all focus:border-[#2463eb] focus:outline-none focus:ring-2 focus:ring-[#2463eb]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-[#2463eb]';

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

interface ArchiveListPageProps {
  basePath: string;
  readOnly?: boolean;
}

export const SelfAssessmentArchiveListPage: React.FC<ArchiveListPageProps> = ({ basePath }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isFetching } = useGetArchiveListQuery({
    page,
    size,
    search: debouncedSearch || undefined,
  });

  const snapshots = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const handleViewDetail = (snapshot: SelfAssessmentArchiveSnapshotDto) => {
    navigate(`${basePath}/archive/${snapshot.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/20">
          <Archive size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Archive Self-Assessment</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">View rejected self-assessment snapshots</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by employee, template, reason..."
            className={`${filterControlClass} pl-10`}
          />
        </div>
        {(isFetching) && (
          <Loader2 size={16} className="animate-spin text-slate-400" />
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-lg dark:border-slate-700/60 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/80 dark:border-slate-700/60 dark:bg-slate-700/30">
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Employee</th>
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Template</th>
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Cycle</th>
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Archived Status</th>
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Rejected By</th>
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Retake Deadline</th>
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Archived At</th>
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    <Loader2 size={20} className="mx-auto animate-spin mb-2" />
                    Loading archive...
                  </td>
                </tr>
              ) : snapshots.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 opacity-40" />
                    No archived self-assessments found.
                  </td>
                </tr>
              ) : (
                snapshots.map((snapshot) => (
                  <tr
                    key={snapshot.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">{snapshot.employeeName}</div>
                      {snapshot.employeeStaffNo && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">{snapshot.employeeStaffNo}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{snapshot.templateTitle}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{snapshot.cycleName || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        {snapshot.archivedStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{snapshot.hrUserName || '-'}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{formatDate(snapshot.retakeDeadline)}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{formatDateTime(snapshot.archivedAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewDetail(snapshot)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-all"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200/60 bg-slate-50/50 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-700/20">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {page * size + 1} to {Math.min((page + 1) * size, totalElements)} of {totalElements}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelfAssessmentArchiveListPage;
