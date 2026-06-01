import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarRange,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  Layers,
  Plus,
  Send,
  Users,
  Sparkles,
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Eye,
  X,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  List,
  LayoutGrid,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGetActiveReviewCyclesQuery } from '../../features/reviewCycle/api/reviewCycleApi';
import {
  useGetActiveCycleFormsForHrQuery,
  useGetAllTemplatesQuery,
  useSetTemplateDeadlineMutation,
  type SelfAssessmentFormTemplateDto,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { SelfAssessmentReviewCycleInfo, formatCycleDate } from './SelfAssessmentReviewCycleInfo';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { PaginationBar } from '../../components/common/PaginationBar';

function formatDate(iso?: string | null) {
  if (!iso) return '-';
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return iso;
  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** US-style display under date inputs (e.g. 04/01/2026) */
function formatSlashDate(iso: string) {
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return iso;
  const [y, m, d] = parts;
  return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`;
}

export const SelfAssessmentAssignmentsPage: React.FC = () => {
  const { data: activeCycles = [] } = useGetActiveReviewCyclesQuery();
  const {
    data: allTemplates = [],
    isLoading: templatesLoading,
    isError: templatesError,
  } = useGetAllTemplatesQuery();
  const { data: activeCycleForms } = useGetActiveCycleFormsForHrQuery();
  const [deadlineModalTemplate, setDeadlineModalTemplate] = useState<SelfAssessmentFormTemplateDto | null>(null);
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEmployeeDeadline, setModalEmployeeDeadline] = useState('');
  const [modalManagerDeadline, setModalManagerDeadline] = useState('');
  const [setTemplateDeadline, { isLoading: isSettingDeadline }] = useSetTemplateDeadlineMutation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deadlineTab, setDeadlineTab] = useState<'all' | 'not-assigned' | 'assigned'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const activeSubmissionCycle = activeCycles.find((cycle) => cycle.requiresEmployeeSubmission) ?? null;

  useEffect(() => {
    if (!deadlineModalTemplate || !activeSubmissionCycle) return;
    const start = activeSubmissionCycle.startDate ?? '';
    const end = activeSubmissionCycle.endDate ?? '';
    setModalStartDate(start);
    setModalEmployeeDeadline(end);
    setModalManagerDeadline(end);
  }, [deadlineModalTemplate, activeSubmissionCycle]);

  const closeDeadlineModal = () => setDeadlineModalTemplate(null);

  const managerReviewMinDate = modalEmployeeDeadline || activeSubmissionCycle?.startDate || '';

  const validateModalDates = (): string | null => {
    if (!activeSubmissionCycle) return 'No active employee-submission review cycle is available';
    if (!modalStartDate || !modalEmployeeDeadline || !modalManagerDeadline) {
      return 'Please select start date, employee deadline, and manager review deadline';
    }
    if (modalStartDate > modalEmployeeDeadline) {
      return 'Employee deadline cannot be earlier than the start date.';
    }
    if (modalEmployeeDeadline > modalManagerDeadline) {
      return 'Manager review deadline cannot be earlier than the employee deadline.';
    }
    const cycleStartDate = activeSubmissionCycle.startDate;
    const cycleEndDate = activeSubmissionCycle.endDate;
    if (
      [modalStartDate, modalEmployeeDeadline, modalManagerDeadline].some(
        (date) => date < cycleStartDate || date > cycleEndDate
      )
    ) {
      return 'Start date, employee deadline, and manager deadline must be within the active cycle';
    }
    return null;
  };

  const handleSetDeadlineSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!deadlineModalTemplate) return;
    const validationError = validateModalDates();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    try {
      const result = await setTemplateDeadline({
        templateId: deadlineModalTemplate.id,
        request: {
          startDate: modalStartDate,
          deadlineDate: modalEmployeeDeadline,
          managerReviewDeadlineDate: modalManagerDeadline,
        },
      }).unwrap();
      toast.success(
        result.createdCount > 0
          ? 'Self-assessment forms assigned successfully'
          : 'No new self-assessment forms were assigned'
      );
      closeDeadlineModal();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message ?? 'Failed to set deadline');
    }
  };

  const existingTemplatesForActiveCycle = useMemo(() => {
    if (!activeSubmissionCycle) return [];
    return allTemplates
      .filter((t) => t.isActive && t.reviewCycleId === activeSubmissionCycle.id)
      .slice()
      .sort((a, b) => {
        const byDept = a.departmentName.localeCompare(b.departmentName);
        if (byDept !== 0) return byDept;
        return a.positionName.localeCompare(b.positionName);
      });
  }, [allTemplates, activeSubmissionCycle]);

  const uniqueDepartments = useMemo(
    () => new Set(existingTemplatesForActiveCycle.map((t) => t.departmentName)).size,
    [existingTemplatesForActiveCycle]
  );
  const uniquePositions = useMemo(
    () => new Set(existingTemplatesForActiveCycle.map((t) => t.positionName)).size,
    [existingTemplatesForActiveCycle]
  );

  const deadlineTabCounts = useMemo(() => {
    const all = existingTemplatesForActiveCycle.length;
    const assigned = existingTemplatesForActiveCycle.filter((t) => t.isAssignedToDeadline).length;
    const notAssigned = all - assigned;
    return { all, assigned, notAssigned };
  }, [existingTemplatesForActiveCycle]);

  const filteredTemplates = useMemo(() => {
    if (deadlineTab === 'assigned') return existingTemplatesForActiveCycle.filter((t) => t.isAssignedToDeadline);
    if (deadlineTab === 'not-assigned') return existingTemplatesForActiveCycle.filter((t) => !t.isAssignedToDeadline);
    return existingTemplatesForActiveCycle;
  }, [existingTemplatesForActiveCycle, deadlineTab]);

  const assignmentStartDateByTemplateId = useMemo(() => {
    const map = new Map<number, string>();
    const forms = activeCycleForms?.forms ?? [];

    forms.forEach((form) => {
      if (!form.templateId || !form.startDate) return;
      const existing = map.get(form.templateId);
      if (!existing || form.startDate < existing) {
        map.set(form.templateId, form.startDate);
      }
    });

    return map;
  }, [activeCycleForms?.forms]);
  const summaryCards = [
    {
      label: 'Templates',
      value: existingTemplatesForActiveCycle.length,
      icon: Layers,
      lightBg: 'bg-violet-50 dark:bg-violet-950/30',
      lightIcon: 'text-violet-600 dark:text-violet-400',
      ring: 'ring-violet-500/20',
      bgGlow: 'bg-violet-500/10',
    },
    {
      label: 'Departments',
      value: uniqueDepartments,
      icon: Users,
      lightBg: 'bg-sky-50 dark:bg-sky-950/30',
      lightIcon: 'text-sky-600 dark:text-sky-400',
      ring: 'ring-sky-500/20',
      bgGlow: 'bg-sky-500/10',
    },
    {
      label: 'Positions',
      value: uniquePositions,
      icon: ClipboardList,
      lightBg: 'bg-amber-50 dark:bg-amber-950/30',
      lightIcon: 'text-amber-600 dark:text-amber-400',
      ring: 'ring-amber-500/20',
      bgGlow: 'bg-amber-500/10',
    },

  ];

  type ColumnMeta = { thClassName?: string; tdClassName?: string };

  const columns = useMemo<ColumnDef<SelfAssessmentFormTemplateDto, unknown>[]>(() => {
    const cols: Array<ColumnDef<SelfAssessmentFormTemplateDto, unknown>> = [
      {
        id: 'template',
        header: 'Template',
        accessorFn: (row) => row.title,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb]/10 to-[#1d4ed8]/5 text-[#2463eb] dark:from-[#2463eb]/20 dark:to-[#1d4ed8]/10 dark:text-[#60a5fa]">
              <FileText size={16} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900 dark:text-white max-w-[240px]">
                {row.original.title}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 lg:hidden">
                Start: {formatDate(assignmentStartDateByTemplateId.get(row.original.id) ?? null)}
              </p>
            </div>
          </div>
        ),
        meta: { thClassName: 'px-5 py-3.5 text-left', tdClassName: 'px-5 py-4' } satisfies ColumnMeta,
      },
      {
        id: 'department',
        header: 'Department',
        accessorFn: (row) => row.departmentName,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Users size={12} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 text-xs font-medium truncate max-w-[140px]">
              {row.original.departmentName}
            </span>
          </div>
        ),
        meta: { thClassName: 'px-5 py-3.5 text-left', tdClassName: 'px-5 py-4' } satisfies ColumnMeta,
      },
      {
        id: 'position',
        header: 'Position',
        accessorFn: (row) => row.positionName,
        cell: ({ row }) => row.original.positionName,
        meta: {
          thClassName: 'px-5 py-3.5 text-left hidden md:table-cell',
          tdClassName: 'px-5 py-4 text-xs font-medium text-slate-600 dark:text-slate-300 hidden md:table-cell truncate max-w-[130px]',
        } satisfies ColumnMeta,
      },
      {
        id: 'questions',
        header: 'Questions',
        accessorFn: (row) => row.questions.length,
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold tabular-nums text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
            <Sparkles size={10} className="text-violet-500 dark:text-violet-400" />
            {row.original.questions.length}
          </span>
        ),
        meta: { thClassName: 'px-5 py-3.5 text-left hidden lg:table-cell', tdClassName: 'px-5 py-4 hidden lg:table-cell' } satisfies ColumnMeta,
      },
      {
        id: 'ratingSystem',
        header: 'Rating System',
        accessorFn: (row) => row.ratingSystem,
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            {row.original.ratingSystem === 'TEN_POINT' ? '10-Point' : '5-Point'}
          </span>
        ),
        meta: { thClassName: 'px-5 py-3.5 text-left hidden lg:table-cell', tdClassName: 'px-5 py-4 hidden lg:table-cell' } satisfies ColumnMeta,
      },
      {
        id: 'startDate',
        header: 'Start Date',
        accessorFn: (row) => assignmentStartDateByTemplateId.get(row.id) ?? '',
        cell: ({ row }) => (
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {formatDate(assignmentStartDateByTemplateId.get(row.original.id) ?? null)}
          </span>
        ),
        meta: { thClassName: 'px-5 py-3.5 text-left hidden lg:table-cell', tdClassName: 'px-5 py-4 hidden lg:table-cell' } satisfies ColumnMeta,
      },
      {
        id: 'deadlineAssignment',
        header: 'Deadline Assignment',
        accessorFn: (row) => (row.isAssignedToDeadline ? 'assigned' : 'not-assigned'),
        enableSorting: false,
        cell: ({ row }) =>
          row.original.isAssignedToDeadline ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              Already assigned
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
              Not assigned
            </span>
          ),
        meta: { thClassName: 'px-5 py-3.5 text-left hidden lg:table-cell', tdClassName: 'px-5 py-4 hidden lg:table-cell' } satisfies ColumnMeta,
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.isAssignedToDeadline ? (
            <Link
              to={`/hr/self-assessment/assignments/${row.original.id}/assigned-employees`}
              className="group/btn inline-flex items-center gap-1.5 rounded-xl bg-[#2463eb]/[0.06] px-3.5 py-2 text-xs font-semibold text-[#2463eb] transition-all hover:bg-[#2463eb]/[0.12] dark:bg-[#2463eb]/10 dark:text-[#60a5fa] dark:hover:bg-[#2463eb]/20"
            >
              <Eye size={13} />
              View
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setDeadlineModalTemplate(row.original)}
              className="group/btn inline-flex items-center gap-1.5 rounded-xl bg-[#2463eb]/[0.06] px-3.5 py-2 text-xs font-semibold text-[#2463eb] transition-all hover:bg-[#2463eb]/[0.12] dark:bg-[#2463eb]/10 dark:text-[#60a5fa] dark:hover:bg-[#2463eb]/20"
            >
              <CalendarDays size={13} />
              Assign Deadline
            </button>
          ),
        meta: { thClassName: 'px-5 py-3.5 text-right', tdClassName: 'px-5 py-4 text-right' } satisfies ColumnMeta,
      },
    ];
    return cols;
  }, [assignmentStartDateByTemplateId]);

  const assignmentTable = useReactTable({
    data: filteredTemplates,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
    initialState: { pagination: { pageSize: 10 } },
  });

  useEffect(() => {
    if (assignmentTable.getState().pagination.pageIndex > 0) {
      assignmentTable.setPageIndex(0);
    }
  }, [filteredTemplates.length, assignmentTable]);

  if (templatesLoading) {
    return (
      <div className="min-h-screen px-6 py-6 md:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-80 rounded-lg bg-slate-200 dark:bg-slate-700" />
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
        <span className="text-[#2463eb] dark:text-[#60a5fa] font-medium">Home</span>
        <ChevronDown size={10} className="-rotate-90 opacity-50" />
        <span>Self Assessment</span>
        <ChevronDown size={10} className="-rotate-90 opacity-50" />
        <span className="font-semibold text-slate-700 dark:text-slate-200">Assignments</span>
      </nav>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] shadow-lg shadow-[#2463eb]/25">
              <Send size={22} className="text-white" />
            </div>
            {existingTemplatesForActiveCycle.length > 0 && (
              <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-[9px] font-bold text-white shadow-sm">
                {existingTemplatesForActiveCycle.length}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Self-Assessment Assignments
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 max-w-lg">
              Review active templates for the current cycle, then assign forms to employees
            </p>
          </div>
        </div>
        {activeSubmissionCycle ? (
          <Link
            to="/hr/self-assessment/assign-forms"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#2463eb]/25 transition-all hover:shadow-xl hover:-translate-y-0.5 hover:shadow-[#2463eb]/30"
          >
            <Send size={16} />
            Assign Forms
            <ArrowRight size={14} className="opacity-0 -ml-2 transition-all group-hover:opacity-100 group-hover:ml-0" />
          </Link>
        ) : (
          <span
            className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-200 px-5 py-2.5 text-sm font-bold text-slate-400 dark:bg-slate-700 dark:text-slate-500"
            title="No active employee-submission review cycle"
          >
            <Send size={16} />
            Assign Forms
          </span>
        )}
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
                  {activeSubmissionCycle ? card.value : '—'}
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
          <div className="absolute inset-0 bg-gradient-to-r from-[#2463eb]/[0.03] via-transparent to-[#2463eb]/[0.03] dark:from-[#2463eb]/[0.05] dark:via-transparent dark:to-[#2463eb]/[0.05]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] shadow-md shadow-[#2463eb]/20">
                <CalendarRange className="h-4 w-4 text-white" aria-hidden />
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">Assignment Cycle</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                  {activeSubmissionCycle ? (
                    <span className="font-medium text-[#2463eb] dark:text-[#60a5fa]">
                      {activeSubmissionCycle.name}
                    </span>
                  ) : (
                    <span className="text-slate-400">No active employee-submission cycle</span>
                  )}
                </div>
                {activeSubmissionCycle && (
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                    {formatDate(activeSubmissionCycle.startDate)} — {formatDate(activeSubmissionCycle.endDate)}
                  </p>
                )}
              </div>
            </div>
            <div className="hidden sm:block sm:h-8 sm:w-px sm:shrink-0 sm:bg-gradient-to-b sm:from-transparent sm:via-slate-200 sm:to-transparent dark:sm:via-slate-700" />
            <SelfAssessmentReviewCycleInfo
              variant="inline"
              primaryColor="#2463eb"
              primaryColorDark="#1d4ed8"
            />
          </div>
        </div>
      </div>

      {/* Templates Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        {/* Card Header */}
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-700/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb]/10 to-[#1d4ed8]/5 dark:from-[#2463eb]/20 dark:to-[#1d4ed8]/10">
              <ClipboardList size={18} className="text-[#2463eb] dark:text-[#60a5fa]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cycle Templates</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Active templates for the current employee-submission review cycle
              </p>
            </div>
          </div>
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
            <Link
              to="/hr/self-assessment/templates/create"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Plus size={14} />
              New Template
            </Link>
            <Link
              to="/hr/self-assessment/templates"
              className="group/link inline-flex items-center gap-1.5 rounded-xl bg-[#2463eb]/[0.06] px-3.5 py-2 text-xs font-semibold text-[#2463eb] transition-all hover:bg-[#2463eb]/[0.12] dark:bg-[#2463eb]/10 dark:text-[#60a5fa] dark:hover:bg-[#2463eb]/20"
            >
              Manage Templates
              <ChevronRight size={14} className="transition-transform group-hover/link:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Deadline Assignment Tabs */}
        {activeSubmissionCycle && !templatesError && existingTemplatesForActiveCycle.length > 0 && (
          <div className="border-b border-slate-100 px-6 pb-4 pt-2 dark:border-slate-700/60">
            <div
              role="tablist"
              aria-label="Deadline assignment status filter"
              className="inline-flex rounded-xl border border-slate-200 bg-slate-50/50 p-1 dark:border-slate-700 dark:bg-slate-800/60"
            >
              {([
                { id: 'all' as const, label: 'All', icon: Layers, count: deadlineTabCounts.all },
                { id: 'not-assigned' as const, label: 'Not Assigned', icon: AlertCircle, count: deadlineTabCounts.notAssigned },
                { id: 'assigned' as const, label: 'Already Assigned', icon: CheckCircle, count: deadlineTabCounts.assigned },
              ]).map((tab) => {
                const Icon = tab.icon;
                const isActive = deadlineTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setDeadlineTab(tab.id);
                      assignmentTable.setPageIndex(0);
                    }}
                    className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#2463eb] text-white shadow-sm shadow-[#2463eb]/20'
                        : 'text-slate-500 hover:bg-white hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                    <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-500 dark:bg-slate-600 dark:text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!activeSubmissionCycle ? (
          <div className="flex flex-col items-center justify-center py-24 px-4">
            <div className="relative mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700/60">
                <CalendarRange size={36} className="text-slate-300 dark:text-slate-500" />
              </div>
              <div className="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25">
                <AlertCircle size={14} className="text-white" />
              </div>
            </div>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">No active review cycle</p>
            <p className="mt-1.5 max-w-sm text-center text-sm text-slate-400 dark:text-slate-500">
              Templates will appear here once an employee-submission review cycle is active
            </p>
          </div>
        ) : templatesError ? (
          <div className="flex flex-col items-center justify-center py-24 px-4">
            <div className="relative mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10">
                <AlertCircle size={36} className="text-red-400 dark:text-red-500" />
              </div>
            </div>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">Failed to load templates</p>
            <p className="mt-1.5 max-w-sm text-center text-sm text-slate-400 dark:text-slate-500">
              Could not load templates. Try refreshing the page.
            </p>
          </div>
        ) : existingTemplatesForActiveCycle.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4">
            <div className="relative mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700/60">
                <FileText size={36} className="text-slate-300 dark:text-slate-500" />
              </div>
              <div className="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] shadow-lg shadow-[#2463eb]/25">
                <Plus size={14} className="text-white" />
              </div>
            </div>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">No templates for this cycle</p>
            <p className="mt-1.5 max-w-sm text-center text-sm text-slate-400 dark:text-slate-500">
              No active templates are linked to{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{activeSubmissionCycle.name}</span>.
              Create one to get started.
            </p>
            <Link
              to="/hr/self-assessment/templates/create"
              className="group mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#2463eb]/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              <Plus size={16} />
              Create Template
              <ArrowRight size={14} className="opacity-0 -ml-2 transition-all group-hover:opacity-100 group-hover:ml-0" />
            </Link>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700/60">
              {deadlineTab === 'assigned' ? (
                <CheckCircle size={28} className="text-slate-300 dark:text-slate-500" />
              ) : (
                <AlertCircle size={28} className="text-slate-300 dark:text-slate-500" />
              )}
            </div>
            <p className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-200">
              {deadlineTab === 'assigned'
                ? 'No templates with assigned deadlines'
                : 'All templates have deadlines assigned'}
            </p>
            <button
              type="button"
              onClick={() => setDeadlineTab('all')}
              className="mt-3 text-xs font-semibold text-[#2463eb] hover:underline dark:text-[#60a5fa]"
            >
              View all templates
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">
            {assignmentTable.getRowModel().rows.map((row) => {
              const t = row.original;
              return (
                <div
                  key={row.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700/60 dark:bg-slate-800/80"
                >
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#2463eb]/5 blur-2xl transition-all duration-500 group-hover:scale-150 dark:bg-[#2463eb]/10" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb]/10 to-[#1d4ed8]/5 text-[#2463eb] dark:from-[#2463eb]/20 dark:to-[#1d4ed8]/10 dark:text-[#60a5fa]">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900 dark:text-white">{t.title}</p>
                          <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {t.departmentName} &middot; {t.positionName}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold tabular-nums text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                        <Sparkles size={10} className="text-violet-500 dark:text-violet-400" />
                        {t.questions.length} Qs
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {t.ratingSystem === 'TEN_POINT' ? '10-Point' : '5-Point'}
                      </span>
                      {t.isAssignedToDeadline ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          Already assigned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                          Not assigned
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Start: {formatDate(assignmentStartDateByTemplateId.get(t.id) ?? null)}
                      </span>
                      {t.isAssignedToDeadline ? (
                        <Link
                          to={`/hr/self-assessment/assignments/${t.id}/assigned-employees`}
                          className="group/btn inline-flex items-center gap-1.5 rounded-xl bg-[#2463eb]/[0.06] px-3 py-1.5 text-xs font-semibold text-[#2463eb] transition-all hover:bg-[#2463eb]/[0.12] dark:bg-[#2463eb]/10 dark:text-[#60a5fa] dark:hover:bg-[#2463eb]/20"
                        >
                          <Eye size={13} />
                          View
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeadlineModalTemplate(t)}
                          className="group/btn inline-flex items-center gap-1.5 rounded-xl bg-[#2463eb]/[0.06] px-3 py-1.5 text-xs font-semibold text-[#2463eb] transition-all hover:bg-[#2463eb]/[0.12] dark:bg-[#2463eb]/10 dark:text-[#60a5fa] dark:hover:bg-[#2463eb]/20"
                        >
                          <CalendarDays size={13} />
                          Assign Deadline
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                {assignmentTable.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-slate-50/40 dark:from-slate-800/60 dark:to-slate-800/30 dark:border-slate-700/60"
                  >
                    {headerGroup.headers.map((header) => {
                      const meta = header.column.columnDef.meta as ColumnMeta | undefined;
                      const canSort = header.column.getCanSort();
                      const sorted = header.column.getIsSorted();
                      return (
                        <th
                          key={header.id}
                          scope="col"
                          className={`${meta?.thClassName ?? 'px-5 py-3.5 text-left'} text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ${
                            canSort ? 'select-none cursor-pointer hover:text-slate-600 dark:hover:text-slate-300' : ''
                          }`}
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        >
                          <div className={`flex items-center gap-1 ${(meta?.thClassName ?? '').includes('text-right') ? 'justify-end' : ''}`}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === 'asc' ? ' ▲' : sorted === 'desc' ? ' ▼' : ''}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-100/80 dark:divide-slate-700/40">
                {assignmentTable.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="group transition-all duration-200 hover:bg-[#2463eb]/[0.02] dark:hover:bg-[#2463eb]/[0.04]"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
                      return (
                        <td key={cell.id} className={meta?.tdClassName ?? 'px-5 py-4'}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeSubmissionCycle && !templatesError && filteredTemplates.length > 0 && (
        <PaginationBar
          pageIndex={assignmentTable.getState().pagination.pageIndex}
          pageSize={assignmentTable.getState().pagination.pageSize}
          pageCount={assignmentTable.getPageCount() || 1}
          totalItems={filteredTemplates.length}
          itemLabel="templates"
          rowsPerPageOptions={[5, 10, 20, 50]}
          onPageIndexChange={(next) => assignmentTable.setPageIndex(next)}
          onPageSizeChange={(nextSize) => assignmentTable.setPageSize(nextSize)}
        />
      )}

      {/* Bulk Assignment Rules Card */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '360ms' }}>
        <div className="relative px-6 py-5">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 via-transparent to-emerald-50/30 dark:from-emerald-900/10 dark:via-transparent dark:to-emerald-900/5" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/20">
              <Send size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bulk Assignment Rules</h3>
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Employees are assigned only when they are <span className="font-semibold text-slate-700 dark:text-slate-300">active</span>, <span className="font-semibold text-slate-700 dark:text-slate-300">non-probation</span>, have an <span className="font-semibold text-slate-700 dark:text-slate-300">active user account</span>, and have a matching active template for the current cycle. Existing active-cycle forms are skipped. Use{' '}
                <Link to="/hr/self-assessment/assign-forms" className="font-semibold text-[#2463eb] hover:underline dark:text-[#60a5fa]">
                  Assign Self-Assessment Forms
                </Link>{' '}
                to run an assignment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {deadlineModalTemplate &&
        activeSubmissionCycle &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
              onClick={closeDeadlineModal}
              aria-hidden="true"
            />
            <div
              className="fixed inset-0 z-[110] flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="configure-deadlines-title"
            >
            <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700/60 dark:bg-slate-800">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-700/60">
                <div className="min-w-0">
                  <h2
                    id="configure-deadlines-title"
                    className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white"
                  >
                    Configure Deadlines
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Set milestone dates for each stage of the review process
                  </p>
                  <p className="mt-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                    {deadlineModalTemplate.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDeadlineModal}
                  className="shrink-0 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSetDeadlineSubmit} className="p-6">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 p-4 dark:border-slate-700/60 dark:from-slate-800 dark:to-slate-800/50">
                    <label
                      htmlFor="modal-start-date"
                      className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400"
                    >
                      Start Date
                    </label>
                    <div className="relative">
                      <input
                        id="modal-start-date"
                        type="date"
                        value={modalStartDate}
                        min={activeSubmissionCycle.startDate}
                        max={activeSubmissionCycle.endDate}
                        onChange={(event) => setModalStartDate(event.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm font-medium text-slate-900 shadow-sm focus:border-[#2463eb] focus:outline-none focus:ring-2 focus:ring-[#2463eb]/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      />
                      <CalendarDays
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{formatSlashDate(modalStartDate)}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 p-4 dark:border-slate-700/60 dark:from-slate-800 dark:to-slate-800/50">
                    <label
                      htmlFor="modal-employee-deadline"
                      className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400"
                    >
                      Employee Deadline
                    </label>
                    <div className="relative">
                      <input
                        id="modal-employee-deadline"
                        type="date"
                        value={modalEmployeeDeadline}
                        min={activeSubmissionCycle.startDate}
                        max={activeSubmissionCycle.endDate}
                        onChange={(event) => setModalEmployeeDeadline(event.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm font-medium text-slate-900 shadow-sm focus:border-[#2463eb] focus:outline-none focus:ring-2 focus:ring-[#2463eb]/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      />
                      <CalendarDays
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                      {formatSlashDate(modalEmployeeDeadline)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 p-4 dark:border-slate-700/60 dark:from-slate-800 dark:to-slate-800/50">
                    <label
                      htmlFor="modal-manager-deadline"
                      className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400"
                    >
                      Manager Review
                    </label>
                    <div className="relative">
                      <input
                        id="modal-manager-deadline"
                        type="date"
                        value={modalManagerDeadline}
                        min={managerReviewMinDate || activeSubmissionCycle.startDate}
                        max={activeSubmissionCycle.endDate}
                        onChange={(event) => setModalManagerDeadline(event.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm font-medium text-slate-900 shadow-sm focus:border-[#2463eb] focus:outline-none focus:ring-2 focus:ring-[#2463eb]/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      />
                      <CalendarDays
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{formatSlashDate(modalManagerDeadline)}</p>
                  </div>
                </div>

                {activeSubmissionCycle.endDate && (
                  <div className="mt-5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-800/40">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Final approval
                    </p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                      HR final approval uses the active review cycle end date:{' '}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatCycleDate(activeSubmissionCycle.endDate)}.
                      </span>
                    </p>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeDeadlineModal}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSettingDeadline}
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#2463eb]/25 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
                  >
                    {isSettingDeadline ? 'Saving…' : 'Assign Deadline'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          </>,
          document.body
        )}
    </div>
  );
};
