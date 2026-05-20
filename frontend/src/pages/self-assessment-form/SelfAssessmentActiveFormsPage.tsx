import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Eye,
  Search,
  X,
  ChevronDown,
  CalendarRange,
  ClipboardList,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  Filter,
  Building2,
  User,
  ShieldCheck,
  CalendarCheck,
  List,
  LayoutGrid,
  Send,
  Edit3,
  Hourglass,
  RotateCcw,
  Lock,
  LockOpen,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import type { RootState } from '../../app/store';
import {
  type FormListDto,
  useGetActiveCycleFormsForHrQuery,
  useGetActiveCycleFormsForManagerQuery,
  useHrUnlockRetakeMutation,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { PaginationBar } from '../../components/common/PaginationBar';
import { SelfAssessmentReviewCycleInfo } from './SelfAssessmentReviewCycleInfo';

function formatDate(iso?: string | null) {
  if (!iso) return '-';
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return iso;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

type StatusFilter = 'all' | string;

function getStatusConfig(status: string) {
  const s = status.toUpperCase();
  if (s === 'NOT_SUBMITTED') {
    return {
      label: 'Not Submitted',
      bg: 'bg-slate-100 dark:bg-slate-700/60',
      text: 'text-slate-600 dark:text-slate-300',
      dot: 'bg-slate-400',
      icon: Edit3,
      cardAccent: 'border-l-slate-400',
    };
  }
  if (s === 'NOT_STARTED') {
    return {
      label: 'Not Started',
      bg: 'bg-slate-100 dark:bg-slate-700/60',
      text: 'text-slate-600 dark:text-slate-300',
      dot: 'bg-slate-400',
      icon: Edit3,
      cardAccent: 'border-l-slate-400',
    };
  }
  if (s === 'DRAFT') {
    return {
      label: 'Draft',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
      dot: 'bg-amber-500',
      icon: Edit3,
      cardAccent: 'border-l-amber-500',
    };
  }
  if (s === 'SUBMITTED' || s === 'EMPLOYEE_SUBMITTED') {
    return {
      label: 'Submitted',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
      dot: 'bg-blue-500',
      icon: Send,
      cardAccent: 'border-l-blue-500',
    };
  }
  if (s === 'MANAGER_REVIEW' || s === 'IN_MANAGER_REVIEW' || s === 'PENDING_MANAGER_REVIEW') {
    return {
      label: 'Manager Review',
      bg: 'bg-indigo-100 dark:bg-indigo-900/30',
      text: 'text-indigo-700 dark:text-indigo-400',
      dot: 'bg-indigo-500',
      icon: Hourglass,
      cardAccent: 'border-l-indigo-500',
    };
  }
  if (s === 'MANAGER_COMPLETED' || s === 'MANAGER_APPROVED' || s === 'MANAGER_REVIEWED') {
    return {
      label: s === 'MANAGER_REVIEWED' ? 'Manager Reviewed' : 'Manager Completed',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-400',
      dot: 'bg-purple-500',
      icon: CheckCircle2,
      cardAccent: 'border-l-purple-500',
    };
  }
  if (s === 'PENDING_EMPLOYEE_REVIEW') {
    return {
      label: 'Pending Employee',
      bg: 'bg-sky-100 dark:bg-sky-900/30',
      text: 'text-sky-700 dark:text-sky-400',
      dot: 'bg-sky-500',
      icon: User,
      cardAccent: 'border-l-sky-500',
    };
  }
  if (s === 'PENDING_FINAL_APPROVAL') {
    return {
      label: 'Pending Final Approval',
      bg: 'bg-violet-100 dark:bg-violet-900/30',
      text: 'text-violet-700 dark:text-violet-400',
      dot: 'bg-violet-500',
      icon: Clock,
      cardAccent: 'border-l-violet-500',
    };
  }
  if (
    s === 'HR_REVIEW' ||
    s === 'PENDING_HR_REVIEW' ||
    s === 'IN_HR_REVIEW' ||
    s === 'PENDING_HR_CALIBRATION_REVIEW'
  ) {
    return {
      label: s === 'PENDING_HR_CALIBRATION_REVIEW' ? 'HR Calibration' : 'HR Review',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-700 dark:text-orange-400',
      dot: 'bg-orange-500',
      icon: ShieldCheck,
      cardAccent: 'border-l-orange-500',
    };
  }
  if (s === 'HR_APPROVED' || s === 'APPROVED' || s === 'COMPLETED') {
    return {
      label: 'Approved',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
      cardAccent: 'border-l-emerald-500',
    };
  }
  if (s === 'FINALIZED_LOCKED') {
    return {
      label: 'Finalized',
      bg: 'bg-teal-100 dark:bg-teal-900/30',
      text: 'text-teal-700 dark:text-teal-400',
      dot: 'bg-teal-500',
      icon: Lock,
      cardAccent: 'border-l-teal-500',
    };
  }
  if (s === 'REJECTED') {
    return {
      label: 'Rejected',
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
      dot: 'bg-red-500',
      icon: AlertCircle,
      cardAccent: 'border-l-red-500',
    };
  }
  if (s === 'REOPENED') {
    return {
      label: 'Reopened',
      bg: 'bg-cyan-100 dark:bg-cyan-900/30',
      text: 'text-cyan-700 dark:text-cyan-400',
      dot: 'bg-cyan-500',
      icon: RotateCcw,
      cardAccent: 'border-l-cyan-500',
    };
  }
  return {
    label: status,
    bg: 'bg-slate-100 dark:bg-slate-700/60',
    text: 'text-slate-600 dark:text-slate-300',
    dot: 'bg-slate-400',
    icon: FileText,
    cardAccent: 'border-l-slate-400',
  };
}

function getDeadlineState(date: string | null) {
  if (!date) {
    return { deadline: null as Date | null, isOverdue: false, isToday: false, isSoon: false };
  }
  const parts = date.split('-').map(Number);
  const deadline = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const isOverdue = Boolean(deadline && deadline < now);
  const isToday = Boolean(deadline && deadline.getTime() === now.getTime());
  const isSoon = Boolean(
    deadline && !isOverdue && !isToday && deadline.getTime() - now.getTime() < 7 * 86400000,
  );
  return { deadline, isOverdue, isToday, isSoon };
}

function DeadlineIndicator({ date }: { date: string | null }) {
  if (!date) return <span className="text-slate-300 dark:text-slate-600">-</span>;
  const { isOverdue, isToday, isSoon } = getDeadlineState(date);

  return (
    <div className="flex items-center gap-1.5">
      {isOverdue ? (
        <AlertCircle size={11} className="shrink-0 text-red-500" />
      ) : isToday ? (
        <Clock size={11} className="shrink-0 text-amber-500" />
      ) : isSoon ? (
        <Clock size={11} className="shrink-0 text-amber-400" />
      ) : (
        <CalendarCheck size={11} className="shrink-0 text-slate-400 dark:text-slate-500" />
      )}
      <span className={`text-xs font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : isToday ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>
        {formatDate(date)}
      </span>
    </div>
  );
}

function ManagerReviewDeadlineCell({ date }: { date: string | null }) {
  if (!date) {
    return <span className="text-xs text-slate-400 dark:text-slate-500">Not set</span>;
  }

  const { isOverdue, isToday, isSoon } = getDeadlineState(date);
  const statusLabel = isOverdue ? 'Overdue' : isToday ? 'Due today' : isSoon ? 'Due soon' : null;
  const containerClass = isOverdue
    ? 'border-red-200/80 bg-red-50/90 dark:border-red-800/60 dark:bg-red-900/25'
    : isToday || isSoon
      ? 'border-amber-200/80 bg-amber-50/90 dark:border-amber-800/60 dark:bg-amber-900/25'
      : 'border-blue-200/70 bg-blue-50/70 dark:border-blue-800/50 dark:bg-blue-900/20';
  const textClass = isOverdue
    ? 'text-red-700 dark:text-red-300'
    : isToday || isSoon
      ? 'text-amber-700 dark:text-amber-300'
      : 'text-blue-700 dark:text-blue-300';

  return (
    <div className={`inline-flex min-w-[9.5rem] flex-col gap-1 rounded-lg border px-2.5 py-2 ${containerClass}`}>
      <div className="flex items-center gap-1.5">
        {isOverdue ? (
          <AlertCircle size={12} className="shrink-0 text-red-600 dark:text-red-400" />
        ) : (
          <Clock size={12} className={`shrink-0 ${isToday || isSoon ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`} />
        )}
        <span className={`text-xs font-bold ${textClass}`}>{formatDate(date)}</span>
      </div>
      {statusLabel && (
        <span className={`text-[10px] font-bold uppercase tracking-wide ${textClass}`}>{statusLabel}</span>
      )}
    </div>
  );
}

const filterControlClass =
  'w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all focus:border-[#5D5FEF] focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-[#5D5FEF]';

function canHrUnlockRetake(form: FormListDto, roleId?: number | null) {
  if (roleId !== 1) return false;
  const status = form.status.toUpperCase();
  if (status === 'PENDING_RETAKE_MANAGER_REVIEW') return true;
  return status === 'PENDING_FINAL_APPROVAL'
    && form.employee.roleId === 2
    && Boolean(form.retakeSubmittedAt);
}

export const SelfAssessmentActiveFormsPage: React.FC = () => {
  const navigate = useNavigate();
  const roleId = useSelector((state: RootState) => state.auth.user?.roleId);
  const isManager = roleId === 2;
  const hrFormsQuery = useGetActiveCycleFormsForHrQuery(undefined, { skip: isManager });
  const managerFormsQuery = useGetActiveCycleFormsForManagerQuery(undefined, { skip: !isManager });
  const { data, isLoading, isError } = isManager ? managerFormsQuery : hrFormsQuery;
  const forms = useMemo(() => data?.forms ?? [], [data]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [unlockTarget, setUnlockTarget] = useState<FormListDto | null>(null);
  const [hrUnlockRetake, { isLoading: isUnlockingRetake }] = useHrUnlockRetakeMutation();

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    for (const f of forms) {
      set.add(f.status);
    }
    return [...set].sort();
  }, [forms]);

  const filteredForms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return forms.filter((form) => {
      if (statusFilter !== 'all' && form.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        form.title,
        form.employee.employeeName,
        form.employee.departmentName,
        form.employee.positionName,
        form.status,
        form.cycleName ?? '',
      ]
        .join('\n')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [forms, searchQuery, statusFilter]);

  useEffect(() => {
    setPageIndex(0);
  }, [searchQuery, statusFilter]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(filteredForms.length / pageSize)),
    [filteredForms.length, pageSize]
  );

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(0, pageCount - 1));
    }
  }, [pageIndex, pageCount]);

  const paginatedForms = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredForms.slice(start, start + pageSize);
  }, [filteredForms, pageIndex, pageSize]);

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const viewForm = (formId: number) => {
    if (isManager) {
      navigate(`/manager/self-assessment-forms/reviews/${formId}`);
      return;
    }
    navigate('/hr/self-assessment/reviews', { state: { formId } });
  };

  const handleConfirmUnlockRetake = async () => {
    if (!unlockTarget) return;
    try {
      await hrUnlockRetake({ formId: unlockTarget.id }).unwrap();
      toast.success('Retake unlocked for editing');
      setUnlockTarget(null);
      await (isManager ? managerFormsQuery.refetch() : hrFormsQuery.refetch());
    } catch (error: unknown) {
      const message = typeof error === 'object'
        && error !== null
        && 'data' in error
        && typeof (error as { data?: { message?: unknown } }).data?.message === 'string'
        ? (error as { data: { message: string } }).data.message
        : 'Failed to unlock retake';
      toast.error(message);
    }
  };

  const totalCount = forms.length;
  const submittedCount = forms.filter((f) => {
    const s = f.status.toUpperCase();
    return s === 'SUBMITTED' || s === 'EMPLOYEE_SUBMITTED';
  }).length;
  const inReviewCount = forms.filter((f) => {
    const s = f.status.toUpperCase();
    return s === 'MANAGER_REVIEW' || s === 'IN_MANAGER_REVIEW' || s === 'PENDING_MANAGER_REVIEW' || s === 'HR_REVIEW' || s === 'PENDING_HR_REVIEW' || s === 'IN_HR_REVIEW' || s === 'MANAGER_COMPLETED' || s === 'MANAGER_APPROVED';
  }).length;
  const completedCount = forms.filter((f) => {
    const s = f.status.toUpperCase();
    return s === 'HR_APPROVED' || s === 'APPROVED' || s === 'COMPLETED';
  }).length;

  const summaryCards = [
    {
      label: 'Total Forms',
      value: totalCount,
      icon: ClipboardList,
      lightBg: 'bg-blue-50 dark:bg-blue-950/30',
      lightIcon: 'text-blue-600 dark:text-blue-400',
      ring: 'ring-blue-500/20',
      bgGlow: 'bg-blue-500/10',
    },
    {
      label: 'Submitted',
      value: submittedCount,
      icon: Send,
      lightBg: 'bg-sky-50 dark:bg-sky-950/30',
      lightIcon: 'text-sky-600 dark:text-sky-400',
      ring: 'ring-sky-500/20',
      bgGlow: 'bg-sky-500/10',
    },
    {
      label: 'In Review',
      value: inReviewCount,
      icon: Hourglass,
      lightBg: 'bg-amber-50 dark:bg-amber-950/30',
      lightIcon: 'text-amber-600 dark:text-amber-400',
      ring: 'ring-amber-500/20',
      bgGlow: 'bg-amber-500/10',
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: CheckCircle2,
      lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      lightIcon: 'text-emerald-600 dark:text-emerald-400',
      ring: 'ring-emerald-500/20',
      bgGlow: 'bg-emerald-500/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen px-6 py-6 md:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-72 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-96 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
          <div className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-6 md:px-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <span className="text-[#5D5FEF] dark:text-[#8b8ef7] font-medium">Home</span>
        <ChevronDown size={10} className="-rotate-90 opacity-50" />
        <span>Self Assessment</span>
        <ChevronDown size={10} className="-rotate-90 opacity-50" />
        <span className="font-semibold text-slate-700 dark:text-slate-200">Assigned Forms</span>
      </nav>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/25">
              <FileText size={22} className="text-white" />
            </div>
            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-[9px] font-bold text-white shadow-sm">
              {totalCount}
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {isManager ? 'Team Assigned Self-Assessment Forms' : 'Assigned Self-Assessment Forms'}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 max-w-lg">
              {isManager
                ? 'Monitor active-cycle self-assessment forms assigned to your team'
                : 'Monitor and review active-cycle self-assessment forms assigned to employees'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card, i) => (
          <div
            key={card.label}
            className="animate-fade-in-up group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700/60 dark:bg-slate-800/80"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${card.bgGlow} blur-2xl transition-all duration-500 group-hover:scale-150`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                  {card.value}
                </p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.lightBg} ring-1 ${card.ring}`}>
                <card.icon size={18} className={card.lightIcon} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Cycle Info Banner */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
        <div className="relative px-5 py-4">
          <div className="absolute inset-0 bg-gradient-to-r from-[#5D5FEF]/[0.03] via-transparent to-[#5D5FEF]/[0.03] dark:from-[#5D5FEF]/[0.05] dark:via-transparent dark:to-[#5D5FEF]/[0.05]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-md shadow-[#5D5FEF]/20">
                <CalendarRange className="h-4 w-4 text-white" aria-hidden />
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">Active Cycle</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                  {data?.activeCycle ? (
                    <span className="font-medium text-[#5D5FEF] dark:text-[#8b8ef7]">
                      {data.activeCycle.name} ({data.activeCycle.code})
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      {isError ? 'No active review cycle available' : 'No active cycle found'}
                    </span>
                  )}
                </div>
                {data?.activeCycle && (
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                    {formatDate(data.activeCycle.startDate)} - {formatDate(data.activeCycle.endDate)}
                  </p>
                )}
              </div>
            </div>
            <div className="hidden sm:block sm:h-8 sm:w-px sm:shrink-0 sm:bg-gradient-to-b sm:from-transparent sm:via-slate-200 sm:to-transparent dark:sm:via-slate-700" />
            <SelfAssessmentReviewCycleInfo variant="inline" />
          </div>
        </div>
      </div>

      {/* Main Forms Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        {/* Card Header */}
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-700/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700/60">
              <Sparkles size={18} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Forms</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {filteredForms.length} of {forms.length} form{forms.length !== 1 ? 's' : ''}
                {hasActiveFilters && (
                  <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-[#5D5FEF]/10 px-2 py-0.5 text-[10px] font-bold text-[#5D5FEF] dark:bg-[#5D5FEF]/20 dark:text-[#8b8ef7]">
                    <Filter size={9} />
                    Filtered
                  </span>
                )}
              </p>
            </div>
          </div>

          {forms.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    viewMode === 'table'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <List size={13} />
                  Table
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid size={13} />
                  Grid
                </button>
              </div>
            </div>
          )}
        </div>

        {forms.length > 0 ? (
          <div className="p-6">
            {/* Search + Filter Bar */}
            <div className="mb-6">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                  <input
                    id="sa-forms-search"
                    type="search"
                    placeholder="Search by title, employee, department, or position..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${filterControlClass} pl-11`}
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
                <button
                  type="button"
                  onClick={() => setExpandedFilters(!expandedFilters)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                    expandedFilters || hasActiveFilters
                      ? 'border-[#5D5FEF]/30 bg-[#5D5FEF]/[0.04] text-[#5D5FEF] dark:border-[#5D5FEF]/40 dark:bg-[#5D5FEF]/10 dark:text-[#8b8ef7]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500'
                  } shadow-sm`}
                >
                  <SlidersHorizontal size={15} />
                  Filters
                  {hasActiveFilters && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5D5FEF] text-[10px] font-bold text-white">
                      {[searchQuery.trim() !== '', statusFilter !== 'all'].filter(Boolean).length}
                    </span>
                  )}
                  <ChevronDown size={13} className={`transition-transform ${expandedFilters ? 'rotate-180' : ''}`} />
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  >
                    <X size={13} />
                    Clear
                  </button>
                )}
              </div>

              {expandedFilters && (
                <div className="mt-3 grid gap-3 sm:grid-cols-3 animate-fade-in">
                  <div>
                    <label htmlFor="sa-forms-status" className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Status
                    </label>
                    <select
                      id="sa-forms-status"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className={filterControlClass}
                    >
                      <option value="all">All statuses</option>
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {getStatusConfig(s).label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                {filteredForms.length > 0 ? (
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-slate-50/40 dark:from-slate-800/60 dark:to-slate-800/30 dark:border-slate-700/60">
                        <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Form
                        </th>
                        <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Employee
                        </th>
                        <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 hidden md:table-cell">
                          Department
                        </th>
                        <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 hidden lg:table-cell">
                          Position
                        </th>
                        <th
                          scope="col"
                          className={`px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ${
                            isManager ? 'hidden lg:table-cell' : 'hidden xl:table-cell'
                          }`}
                        >
                          Employee Deadline
                        </th>
                        <th
                          scope="col"
                          className={`px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ${
                            isManager ? '' : 'hidden xl:table-cell'
                          }`}
                        >
                          {isManager ? 'Manager Review Deadline' : 'Manager Review'}
                        </th>

                        <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Status
                        </th>
                        <th scope="col" className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80 dark:divide-slate-700/40">
                      {paginatedForms.map((form, index) => {
                        const statusCfg = getStatusConfig(form.status);
                        return (
                          <tr
                            key={form.id}
                            className="group transition-all duration-200 hover:bg-[#5D5FEF]/[0.02] dark:hover:bg-[#5D5FEF]/[0.04]"
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#5D5FEF]/10 to-[#7C7EF5]/5 text-[#5D5FEF] dark:from-[#5D5FEF]/20 dark:to-[#7C7EF5]/10 dark:text-[#8b8ef7]">
                                  <FileText size={16} />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-900 dark:text-white max-w-[220px]">
                                    {form.title?.trim() ? form.title : '\u2014'}
                                  </p>
                                  {form.assessmentDate && (
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                      Assessed: {formatDate(form.assessmentDate)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-600">
                                  <User size={12} className="text-slate-500 dark:text-slate-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white max-w-[160px]">
                                    {form.employee.employeeName}
                                  </p>
                                  <p className="truncate text-[11px] text-slate-400 dark:text-slate-500 max-w-[160px]">
                                    {form.employee.employeeId}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 hidden md:table-cell">
                              <div className="flex items-center gap-1.5">
                                <Building2 size={12} className="text-slate-400 dark:text-slate-500" />
                                <span className="text-slate-600 dark:text-slate-300 text-xs font-medium truncate max-w-[140px]">
                                  {form.employee.departmentName}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-xs font-medium text-slate-600 dark:text-slate-300 hidden lg:table-cell truncate max-w-[130px]">
                              {form.employee.positionName}
                            </td>
                            <td className={`px-5 py-4 ${isManager ? 'hidden lg:table-cell' : 'hidden xl:table-cell'}`}>
                              <DeadlineIndicator date={form.deadlineDate} />
                            </td>
                            <td className={`px-5 py-4 ${isManager ? '' : 'hidden xl:table-cell'}`}>
                              {isManager ? (
                                <ManagerReviewDeadlineCell date={form.managerReviewDeadlineDate} />
                              ) : (
                                <DeadlineIndicator date={form.managerReviewDeadlineDate} />
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                                {statusCfg.label}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="inline-flex items-center justify-end gap-2">
                                {canHrUnlockRetake(form, roleId) && (
                                  <button
                                    type="button"
                                    onClick={() => setUnlockTarget(form)}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30"
                                  >
                                    <LockOpen size={13} />
                                    Unlock
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => viewForm(form.id)}
                                  className="group/btn inline-flex items-center gap-1.5 rounded-xl bg-[#5D5FEF]/[0.06] px-3.5 py-2 text-xs font-semibold text-[#5D5FEF] transition-all hover:bg-[#5D5FEF]/[0.12] dark:bg-[#5D5FEF]/10 dark:text-[#8b8ef7] dark:hover:bg-[#5D5FEF]/20"
                                >
                                  <Eye size={13} />
                                  View
                                  <ArrowRight size={11} className="opacity-0 transition-all -ml-1 group-hover/btn:opacity-100 group-hover/btn:ml-0" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-4">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700/60">
                      <Search size={28} className="text-slate-300 dark:text-slate-500" />
                    </div>
                    <p className="text-base font-bold text-slate-700 dark:text-slate-300">No forms match your filters</p>
                    <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Try adjusting your search or filter criteria</p>
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <X size={14} />
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <>
                {filteredForms.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {paginatedForms.map((form, index) => {
                      const statusCfg = getStatusConfig(form.status);
                      const StatusIcon = statusCfg.icon;
                      return (
                        <div
                          key={form.id}
                          className={`group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up border-l-[3px] ${statusCfg.cardAccent}`}
                          style={{ animationDelay: `${index * 40}ms` }}
                        >
                          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#5D5FEF]/[0.03] blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-[#5D5FEF]/[0.06] dark:bg-[#5D5FEF]/[0.05] dark:group-hover:bg-[#5D5FEF]/[0.10]" />

                          <div className="relative">
                            {/* Card Header */}
                            <div className="mb-4 flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#5D5FEF]/10 to-[#7C7EF5]/5 text-[#5D5FEF] dark:from-[#5D5FEF]/20 dark:to-[#7C7EF5]/10 dark:text-[#8b8ef7]">
                                  <FileText size={18} />
                                </div>
                                <div className="min-w-0">
                                  <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                    {form.title?.trim() ? form.title : '\u2014'}
                                  </h3>
                                  <div className="mt-1 flex items-center gap-1.5">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text}`}>
                                      <StatusIcon size={9} />
                                      {statusCfg.label}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Employee Info */}
                            <div className="mb-3 flex items-center gap-2.5 rounded-xl bg-slate-50/80 px-3 py-2.5 dark:bg-slate-700/30">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5D5FEF]/15 to-[#7C7EF5]/10 dark:from-[#5D5FEF]/25 dark:to-[#7C7EF5]/15">
                                <User size={14} className="text-[#5D5FEF] dark:text-[#8b8ef7]" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{form.employee.employeeName}</p>
                                <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">{form.employee.employeeId}</p>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs">
                                <Building2 size={12} className="shrink-0 text-slate-400 dark:text-slate-500" />
                                <span className="truncate text-slate-600 dark:text-slate-300 font-medium">{form.employee.departmentName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <ClipboardList size={12} className="shrink-0" />
                                <span className="truncate">{form.employee.positionName}</span>
                              </div>
                            </div>

                            {/* Deadlines */}
                            {isManager ? (
                              <div className="mt-3 space-y-2">
                                <div className="rounded-lg border border-blue-200/60 bg-blue-50/40 px-3 py-2.5 dark:border-blue-800/50 dark:bg-blue-900/20">
                                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-700/80 dark:text-blue-300/80">
                                    Manager Review Deadline
                                  </p>
                                  <ManagerReviewDeadlineCell date={form.managerReviewDeadlineDate} />
                                </div>
                                <div className="rounded-lg bg-slate-50/80 px-2.5 py-2 dark:bg-slate-700/30">
                                  <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                    Employee Deadline
                                  </p>
                                  <DeadlineIndicator date={form.deadlineDate} />
                                </div>
                              </div>
                            ) : (
                              <div className="mt-3 grid grid-cols-3 gap-2">
                                <div className="rounded-lg bg-slate-50/80 px-2.5 py-2 dark:bg-slate-700/30">
                                  <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Deadline</p>
                                  <DeadlineIndicator date={form.deadlineDate} />
                                </div>
                                <div className="rounded-lg bg-slate-50/80 px-2.5 py-2 dark:bg-slate-700/30">
                                  <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Manager</p>
                                  <DeadlineIndicator date={form.managerReviewDeadlineDate} />
                                </div>
                                <div className="rounded-lg bg-slate-50/80 px-2.5 py-2 dark:bg-slate-700/30">
                                  <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Final</p>
                                  <DeadlineIndicator date={form.finalApprovalDeadlineDate} />
                                </div>
                              </div>
                            )}

                            {/* Action */}
                            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700/40">
                              {canHrUnlockRetake(form, roleId) && (
                                <button
                                  type="button"
                                  onClick={() => setUnlockTarget(form)}
                                  className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-700 transition-all hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30"
                                >
                                  <LockOpen size={14} />
                                  Unlock Retake
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => viewForm(form.id)}
                                className="group/btn flex w-full items-center justify-center gap-2 rounded-xl bg-[#5D5FEF]/[0.06] px-4 py-2.5 text-xs font-bold text-[#5D5FEF] transition-all hover:bg-[#5D5FEF]/[0.12] dark:bg-[#5D5FEF]/10 dark:text-[#8b8ef7] dark:hover:bg-[#5D5FEF]/20"
                              >
                                <Eye size={14} />
                                View Form
                                <ArrowRight size={12} className="transition-transform group-hover/btn:translate-x-0.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-4">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700/60">
                      <Search size={28} className="text-slate-300 dark:text-slate-500" />
                    </div>
                    <p className="text-base font-bold text-slate-700 dark:text-slate-300">No forms match your filters</p>
                    <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Try adjusting your search or filter criteria</p>
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <X size={14} />
                      Clear all filters
                    </button>
                  </div>
                )}
              </>
            )}

            {filteredForms.length > 0 && (
              <PaginationBar
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
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-4">
            <div className="relative mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700/60">
                <FileText size={36} className="text-slate-300 dark:text-slate-500" />
              </div>
              <div className="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/25">
                <Users size={14} className="text-white" />
              </div>
            </div>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">No assigned forms for the active cycle</p>
            <p className="mt-1.5 max-w-sm text-center text-sm text-slate-400 dark:text-slate-500">
              {isError
                ? 'Unable to load forms. Please try again later.'
                : isManager
                  ? 'Active-cycle forms assigned to your team will appear here'
                  : 'Assign self-assessment forms to employees to see them here'}
            </p>
          </div>
        )}
      </div>
      {unlockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="Close unlock retake confirmation"
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
            onClick={() => !isUnlockingRetake && setUnlockTarget(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-300">
              <LockOpen size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Unlock Retake</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              This clears only the submitted retake answers for {unlockTarget.employee.employeeName}. The original self-assessment, selected retake questions, warning comments, signatures, comments, deadlines, and assignment details will stay unchanged.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              The employee or manager must edit and resubmit the same retake before the next approval step can continue.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isUnlockingRetake}
                onClick={() => setUnlockTarget(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUnlockingRetake}
                onClick={handleConfirmUnlockRetake}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
              >
                <LockOpen size={15} />
                {isUnlockingRetake ? 'Unlocking...' : 'Unlock Retake'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
