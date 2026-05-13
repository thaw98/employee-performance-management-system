import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  X,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Inbox,
  Users,
  BarChart3,
  ArrowUpDown,
  LayoutList,
  Filter,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import {
  useGetReviewFormsQuery,
  useGetHrReviewFormsQuery,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { PaginationBar } from '../../components/common/PaginationBar';

type StatusKey = 'SUBMITTED' | 'MANAGER_REVIEWED' | 'APPROVED' | 'REJECTED' | 'OTHER';
type SortField = 'name' | 'department' | 'position' | 'status' | 'score';
type SortDir = 'asc' | 'desc';

/** Turns API enum strings like PENDING_HR_CALIBRATION_REVIEW into readable words (no underscores). */
function humanizeStatusLabel(status: string): string {
  const raw = (status ?? '').trim();
  if (!raw) return 'Unknown';
  return raw
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function getStatusConfig(status: string) {
  const s = (status ?? '').toUpperCase();
  if (s === 'SUBMITTED' || s === 'EMPLOYEE_SUBMITTED') {
    return {
      key: 'SUBMITTED' as StatusKey,
      label: 'Submitted',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
      dot: 'bg-blue-500',
      icon: Clock,
      accent: 'border-l-blue-500',
      ring: 'ring-blue-500/20',
    };
  }
  if (s === 'MANAGER_REVIEWED') {
    return {
      key: 'MANAGER_REVIEWED' as StatusKey,
      label: 'Manager Reviewed',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
      dot: 'bg-amber-500',
      icon: AlertCircle,
      accent: 'border-l-amber-500',
      ring: 'ring-amber-500/20',
    };
  }
  if (s === 'APPROVED' || s === 'COMPLETED') {
    return {
      key: 'APPROVED' as StatusKey,
      label: 'Approved',
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
      accent: 'border-l-emerald-500',
      ring: 'ring-emerald-500/20',
    };
  }
  if (s === 'REJECTED') {
    return {
      key: 'REJECTED' as StatusKey,
      label: 'Rejected',
      bg: 'bg-red-50 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
      dot: 'bg-red-500',
      icon: AlertCircle,
      accent: 'border-l-red-500',
      ring: 'ring-red-500/20',
    };
  }
  return {
    key: 'OTHER' as StatusKey,
    label: humanizeStatusLabel(status),
    bg: 'bg-slate-100 dark:bg-slate-700/60',
    text: 'text-slate-600 dark:text-slate-300',
    dot: 'bg-slate-400',
    icon: FileText,
    accent: 'border-l-slate-400',
    ring: 'ring-slate-500/20',
  };
}

const STATUS_TABS: { key: StatusKey | 'ALL'; label: string; icon: React.ElementType }[] = [
  { key: 'ALL', label: 'All', icon: LayoutList },
  { key: 'SUBMITTED', label: 'Submitted', icon: Clock },
  { key: 'MANAGER_REVIEWED', label: 'Reviewed', icon: AlertCircle },
  { key: 'APPROVED', label: 'Approved', icon: CheckCircle2 },
  { key: 'REJECTED', label: 'Rejected', icon: AlertCircle },
];

function getInitials(name: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const AVATAR_COLORS = [
  'from-indigo-400 to-indigo-600',
  'from-violet-400 to-violet-600',
  'from-blue-400 to-blue-600',
  'from-cyan-400 to-cyan-600',
  'from-teal-400 to-teal-600',
  'from-emerald-400 to-emerald-600',
  'from-amber-400 to-amber-600',
  'from-rose-400 to-rose-600',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const SelfAssessmentFormQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const isHr = user?.roleId === 1;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<StatusKey | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

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
  const rejectedCount = useMemo(
    () => (forms ?? []).filter((f: any) => (f.status ?? '').toUpperCase() === 'REJECTED').length,
    [forms],
  );
  const totalCount = (forms ?? []).length;

  const filteredForms = useMemo(() => {
    let result = forms ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((form: any) => {
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
    }
    if (activeTab !== 'ALL') {
      result = result.filter((form: any) => {
        const cfg = getStatusConfig(form.status);
        return cfg.key === activeTab;
      });
    }
    result = [...result].sort((a: any, b: any) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'name':
          return ((a.employee?.employeeName ?? '')).localeCompare((b.employee?.employeeName ?? '')) * dir;
        case 'department':
          return ((a.employee?.departmentName ?? '')).localeCompare((b.employee?.departmentName ?? '')) * dir;
        case 'position':
          return ((a.employee?.positionName ?? '')).localeCompare((b.employee?.positionName ?? '')) * dir;
        case 'status':
          return ((a.status ?? '')).localeCompare((b.status ?? '')) * dir;
        case 'score':
          return ((a.totalScore ?? -1) - (b.totalScore ?? -1)) * dir;
        default:
          return 0;
      }
    });
    return result;
  }, [forms, searchQuery, activeTab, sortField, sortDir]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(filteredForms.length / pageSize)),
    [filteredForms.length, pageSize],
  );

  useEffect(() => {
    setPageIndex(0);
  }, [searchQuery, activeTab, sortField, sortDir]);

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(0, pageCount - 1));
    }
  }, [pageIndex, pageCount]);

  const paginatedForms = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredForms.slice(start, start + pageSize);
  }, [filteredForms, pageIndex, pageSize]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={() => toggleSort(field)}
      className={`group inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider transition-colors no-underline ${
        sortField === field
          ? 'text-[#5D5FEF] dark:text-[#8b8ef7]'
          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
      }`}
    >
      {children}
      <ArrowUpDown
        size={10}
        className={`transition-opacity ${sortField === field ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}
      />
    </button>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen px-6 py-6 md:px-8">
        <div className="animate-pulse space-y-6">
          <div className="flex gap-4">
            <div className="h-14 w-14 rounded-2xl bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-2 pt-1">
              <div className="h-7 w-56 rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-80 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
          <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-6 md:px-8 animate-fade-in">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <span className="text-[#5D5FEF] dark:text-[#8b8ef7] font-medium">Home</span>
        <ChevronRight size={10} className="opacity-50" />
        <span>Self Assessment</span>
        <ChevronRight size={10} className="opacity-50" />
        <span className="font-semibold text-slate-700 dark:text-slate-200">Form Queue</span>
      </nav>

      <div className="mb-8 flex items-center gap-5">
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/20">
            <ShieldCheck size={26} className="text-white" />
          </div>
          <div className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-[10px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            {totalCount}
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Form Queue
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review and manage submitted self-assessment forms
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-slate-100/80 dark:bg-slate-700/30" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Total Forms
              </p>
              <p className="mt-2 text-3xl font-black tabular-nums text-slate-900 dark:text-white">
                {totalCount}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400">
              <Inbox size={18} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50/80 to-white p-5 shadow-sm dark:border-blue-900/30 dark:from-blue-900/20 dark:to-slate-800/80">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-blue-100/60 dark:bg-blue-800/10" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500/80 dark:text-blue-400/80">
                Awaiting Review
              </p>
              <p className="mt-2 text-3xl font-black tabular-nums text-slate-900 dark:text-white">
                {submittedCount}
              </p>
              {totalCount > 0 && (
                <p className="mt-1 text-[10px] font-semibold text-blue-600/70 dark:text-blue-400/60">
                  {Math.round((submittedCount / totalCount) * 100)}% of total
                </p>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              <Clock size={18} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-amber-100/80 bg-gradient-to-br from-amber-50/80 to-white p-5 shadow-sm dark:border-amber-900/30 dark:from-amber-900/20 dark:to-slate-800/80">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-amber-100/60 dark:bg-amber-800/10" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80 dark:text-amber-400/80">
                Reviewed
              </p>
              <p className="mt-2 text-3xl font-black tabular-nums text-slate-900 dark:text-white">
                {reviewedCount}
              </p>
              {totalCount > 0 && (
                <p className="mt-1 text-[10px] font-semibold text-amber-600/70 dark:text-amber-400/60">
                  {Math.round((reviewedCount / totalCount) * 100)}% of total
                </p>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
              <Users size={18} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/80 to-white p-5 shadow-sm dark:border-emerald-900/30 dark:from-emerald-900/20 dark:to-slate-800/80">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-emerald-100/60 dark:bg-emerald-800/10" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80 dark:text-emerald-400/80">
                Approved
              </p>
              <p className="mt-2 text-3xl font-black tabular-nums text-slate-900 dark:text-white">
                {approvedCount}
              </p>
              {totalCount > 0 && (
                <p className="mt-1 text-[10px] font-semibold text-emerald-600/70 dark:text-emerald-400/60">
                  {Math.round((approvedCount / totalCount) * 100)}% of total
                </p>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>
      </div>

      {managerErrorMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/70 dark:bg-amber-900/30 dark:text-amber-200">
          <AlertCircle size={16} className="shrink-0" />
          <span>{managerErrorMessage}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
        <div className="border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#5D5FEF]/10 to-[#7C7EF5]/10 dark:from-[#5D5FEF]/20 dark:to-[#7C7EF5]/20">
                <BarChart3 size={16} className="text-[#5D5FEF] dark:text-[#8b8ef7]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Review Queue</h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {filteredForms.length} of {totalCount} forms
                </p>
              </div>
            </div>
            <div className="relative w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                type="search"
                placeholder="Search by name, dept, position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 px-3.5 py-2 pl-9 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-[#5D5FEF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 dark:border-slate-600 dark:bg-slate-900/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#5D5FEF] dark:focus:bg-slate-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-600 dark:hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 px-5 pb-3">
            <Filter size={12} className="mr-1 text-slate-400 dark:text-slate-500" />
            {STATUS_TABS.map((tab) => {
              const count =
                tab.key === 'ALL'
                  ? totalCount
                  : tab.key === 'SUBMITTED'
                    ? submittedCount
                    : tab.key === 'MANAGER_REVIEWED'
                      ? reviewedCount
                      : tab.key === 'APPROVED'
                        ? approvedCount
                        : rejectedCount;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                    isActive
                      ? 'bg-[#5D5FEF]/10 text-[#5D5FEF] dark:bg-[#5D5FEF]/20 dark:text-[#8b8ef7]'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200'
                  }`}
                >
                  <tab.icon size={12} />
                  {tab.label}
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${
                      isActive
                        ? 'bg-[#5D5FEF]/20 text-[#5D5FEF] dark:bg-[#5D5FEF]/30 dark:text-[#8b8ef7]'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden md:block">
          <div className="grid grid-cols-[1fr_0.7fr_0.7fr_0.5fr_0.4fr_40px] items-center gap-4 border-b border-slate-100 bg-slate-50/50 px-5 py-2.5 dark:border-slate-700/60 dark:bg-slate-900/30">
            <SortHeader field="name">Employee</SortHeader>
            <SortHeader field="department">Department</SortHeader>
            <SortHeader field="position">Position</SortHeader>
            <SortHeader field="status">Status</SortHeader>
            <SortHeader field="score">Score</SortHeader>
            <span />
          </div>
        </div>

        <div className="max-h-[calc(100vh-460px)] overflow-y-auto">
          {filteredForms && filteredForms.length > 0 ? (
            paginatedForms.map((form: any, index: number) => {
              const cfg = getStatusConfig(form.status);
              const StatusIcon = cfg.icon;
              const name = form.employee?.employeeName ?? 'Unknown';
              const initials = getInitials(name);
              const colorGrad = getAvatarColor(name);
              return (
                <button
                  key={form.id}
                  type="button"
                  onClick={() => navigate(
                    isHr
                      ? `/hr/self-assessment/reviews/${form.id}`
                      : `/manager/self-assessment-forms/reviews/${form.id}`,
                    { state: { formId: form.id } },
                  )}
                  className="group w-full text-left transition-all duration-150 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 border-b border-slate-50 last:border-b-0 dark:border-slate-700/30"
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_0.7fr_0.7fr_0.5fr_0.4fr_40px] items-center gap-3 md:gap-4 px-5 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${colorGrad} text-xs font-bold text-white shadow-sm`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#5D5FEF] dark:group-hover:text-[#8b8ef7] transition-colors">
                          {name}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 md:hidden">
                          {form.employee?.departmentName} &middot; {form.employee?.positionName}
                        </p>
                      </div>
                    </div>

                    <p className="hidden md:block truncate text-sm text-slate-600 dark:text-slate-300">
                      {form.employee?.departmentName ?? '-'}
                    </p>

                    <p className="hidden md:block truncate text-sm text-slate-500 dark:text-slate-400">
                      {form.employee?.positionName ?? '-'}
                    </p>

                    <div className="hidden md:flex min-w-0">
                      <span
                        className={`inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}
                      >
                        <StatusIcon size={11} className="shrink-0" />
                        <span className="truncate">{cfg.label}</span>
                      </span>
                    </div>

                    <div className="hidden md:block">
                      {form.totalScore !== null && form.totalScore !== undefined ? (
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#5D5FEF] to-[#7C7EF5] transition-all"
                              style={{ width: `${Math.min(form.totalScore, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200">
                            {form.totalScore?.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-600">-</span>
                      )}
                    </div>

                    <ChevronRight
                      size={16}
                      className="hidden md:block text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#5D5FEF] dark:text-slate-600 dark:group-hover:text-[#8b8ef7]"
                    />
                  </div>

                  <div className="flex md:hidden items-center gap-3 px-5 pb-3 min-w-0">
                    <span
                      className={`inline-flex min-w-0 max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}
                    >
                      <StatusIcon size={10} className="shrink-0" />
                      <span className="truncate">{cfg.label}</span>
                    </span>
                    {form.totalScore !== null && form.totalScore !== undefined && (
                      <span className="text-[11px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                        Score: {form.totalScore?.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700/60">
                <Inbox size={28} className="text-slate-300 dark:text-slate-500" />
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {searchQuery ? 'No forms match your search' : 'No forms to review'}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {searchQuery ? 'Try adjusting your search or filter criteria' : 'Forms will appear here when employees submit assessments'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveTab('ALL');
                  }}
                  className="mt-3 text-xs font-semibold text-[#5D5FEF] hover:underline dark:text-[#8b8ef7]"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {filteredForms.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-700/60">
            <PaginationBar
              className="mt-0"
              pageIndex={pageIndex}
              pageSize={pageSize}
              pageCount={pageCount}
              totalItems={filteredForms.length}
              itemLabel="forms"
              rowsPerPageOptions={[5, 10, 20, 50]}
              onPageIndexChange={setPageIndex}
              onPageSizeChange={(nextSize) => {
                setPageSize(nextSize);
                setPageIndex(0);
              }}
            />
            {activeTab !== 'ALL' && (
              <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                Filtered by{' '}
                <span className="font-semibold text-[#5D5FEF] dark:text-[#8b8ef7]">
                  {STATUS_TABS.find((t) => t.key === activeTab)?.label}
                </span>
                {' '}
                ({filteredForms.length} of {totalCount} forms)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
