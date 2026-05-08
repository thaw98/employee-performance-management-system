import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  ChevronDown,
  Search,
  X,
  User,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import {
  useGetReviewFormsQuery,
  useGetHrReviewFormsQuery,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';

function getStatusConfig(status: string) {
  const s = (status ?? '').toUpperCase();
  if (s === 'SUBMITTED' || s === 'EMPLOYEE_SUBMITTED') {
    return { label: 'Submitted', bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' };
  }
  if (s === 'MANAGER_REVIEWED') {
    return { label: 'Manager Reviewed', bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' };
  }
  if (s === 'APPROVED' || s === 'COMPLETED') {
    return { label: 'Approved', bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' };
  }
  if (s === 'REJECTED') {
    return { label: 'Rejected', bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' };
  }
  return { label: status, bg: 'bg-slate-100 dark:bg-slate-700/60', text: 'text-slate-600 dark:text-slate-300', dot: 'bg-slate-400' };
}

const filterControlClass =
  'w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all focus:border-[#5D5FEF] focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-[#5D5FEF]';

export const SelfAssessmentFormQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const isHr = user?.roleId === 1;
  const [searchQuery, setSearchQuery] = useState('');

  const { data: managerForms, isLoading: managerFormsLoading, error: managerFormsError } = useGetReviewFormsQuery(undefined, {
    skip: isHr,
  });
  const { data: hrForms, isLoading: hrFormsLoading } = useGetHrReviewFormsQuery(undefined, {
    skip: !isHr,
  });

  const forms = isHr ? hrForms : managerForms;
  const isLoading = isHr ? hrFormsLoading : managerFormsLoading;
  const managerErrorMessage = !isHr && managerFormsError && typeof managerFormsError === 'object' && 'data' in managerFormsError
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

  if (isLoading) {
    return (
      <div className="min-h-screen px-6 py-6 md:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-72 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-96 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-6 md:px-8 animate-fade-in">
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <span className="text-[#5D5FEF] dark:text-[#8b8ef7] font-medium">Home</span>
        <ChevronDown size={10} className="-rotate-90 opacity-50" />
        <span>Self Assessment</span>
        <ChevronDown size={10} className="-rotate-90 opacity-50" />
        <span className="font-semibold text-slate-700 dark:text-slate-200">Form Queue</span>
      </nav>

      <div className="mb-8 flex items-start gap-4">
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/25">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-[9px] font-bold text-white shadow-sm">
            {totalCount}
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Form Queue</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 max-w-lg">
            Select a submitted self-assessment form and open it on the review page
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Total Pending</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{totalCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Awaiting Review</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{submittedCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Manager Reviewed</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{reviewedCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Approved</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{approvedCount}</p>
        </div>
      </div>

      {managerErrorMessage && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/70 dark:bg-amber-900/30 dark:text-amber-200">
          {managerErrorMessage}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700/60">
              <Sparkles size={18} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Forms Queue</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {filteredForms.length} form{filteredForms.length !== 1 ? 's' : ''}
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
              return (
                <button
                  key={form.id}
                  type="button"
                  onClick={() => navigate(isHr ? '/hr/self-assessment/reviews' : '/manager/self-assessment-forms/reviews', { state: { formId: form.id } })}
                  className="group w-full text-left rounded-xl border-l-[3px] border-l-transparent p-3.5 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/40"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-700/60 dark:text-slate-500">
                        <User size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold max-w-[220px] text-slate-900 dark:text-white">
                          {form.employee?.employeeName}
                        </p>
                      </div>
                    </div>
                    {form.totalScore !== null && (
                      <div className="flex items-center gap-1.5">
                        <Star size={10} className="text-amber-500 fill-amber-500" />
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          {form.totalScore?.toFixed(1)}%
                        </span>
                      </div>
                    )}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
