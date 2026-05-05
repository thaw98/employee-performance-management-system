import React, { useMemo } from 'react';
import {
  CalendarRange,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  Layers,
  Pencil,
  Plus,
  Send,
  Users,
  Sparkles,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetActiveReviewCyclesQuery } from '../../features/reviewCycle/api/reviewCycleApi';
import { useGetAllTemplatesQuery } from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { SelfAssessmentReviewCycleInfo } from './SelfAssessmentReviewCycleInfo';

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

export const SelfAssessmentAssignmentsPage: React.FC = () => {
  const { data: activeCycles = [] } = useGetActiveReviewCyclesQuery();
  const {
    data: allTemplates = [],
    isLoading: templatesLoading,
    isError: templatesError,
  } = useGetAllTemplatesQuery();

  const activeSubmissionCycle = activeCycles.find((cycle) => cycle.requiresEmployeeSubmission) ?? null;

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
  const totalQuestions = useMemo(
    () => existingTemplatesForActiveCycle.reduce((sum, t) => sum + t.questions.length, 0),
    [existingTemplatesForActiveCycle]
  );

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
    {
      label: 'Total Questions',
      value: totalQuestions,
      icon: Sparkles,
      lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      lightIcon: 'text-emerald-600 dark:text-emerald-400',
      ring: 'ring-emerald-500/20',
      bgGlow: 'bg-emerald-500/10',
    },
  ];

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
        <span className="text-[#5D5FEF] dark:text-[#8b8ef7] font-medium">Home</span>
        <ChevronDown size={10} className="-rotate-90 opacity-50" />
        <span>Self Assessment</span>
        <ChevronDown size={10} className="-rotate-90 opacity-50" />
        <span className="font-semibold text-slate-700 dark:text-slate-200">Assignments</span>
      </nav>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/25">
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
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5D5FEF] to-[#7C7EF5] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#5D5FEF]/25 transition-all hover:shadow-xl hover:-translate-y-0.5 hover:shadow-[#5D5FEF]/30"
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
          <div className="absolute inset-0 bg-gradient-to-r from-[#5D5FEF]/[0.03] via-transparent to-[#5D5FEF]/[0.03] dark:from-[#5D5FEF]/[0.05] dark:via-transparent dark:to-[#5D5FEF]/[0.05]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-md shadow-[#5D5FEF]/20">
                <CalendarRange className="h-4 w-4 text-white" aria-hidden />
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">Assignment Cycle</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                  {activeSubmissionCycle ? (
                    <span className="font-medium text-[#5D5FEF] dark:text-[#8b8ef7]">
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
            <SelfAssessmentReviewCycleInfo variant="inline" />
          </div>
        </div>
      </div>

      {/* Templates Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        {/* Card Header */}
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-700/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-violet-800/20">
              <ClipboardList size={18} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cycle Templates</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Active templates for the current employee-submission review cycle
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/hr/self-assessment/templates/create"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Plus size={14} />
              New Template
            </Link>
            <Link
              to="/hr/self-assessment/templates"
              className="group/link inline-flex items-center gap-1.5 rounded-xl bg-[#5D5FEF]/[0.06] px-3.5 py-2 text-xs font-semibold text-[#5D5FEF] transition-all hover:bg-[#5D5FEF]/[0.12] dark:bg-[#5D5FEF]/10 dark:text-[#8b8ef7] dark:hover:bg-[#5D5FEF]/20"
            >
              Manage Templates
              <ChevronRight size={14} className="transition-transform group-hover/link:translate-x-0.5" />
            </Link>
          </div>
        </div>

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
              <div className="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/25">
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
              className="group mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5D5FEF] to-[#7C7EF5] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#5D5FEF]/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              <Plus size={16} />
              Create Template
              <ArrowRight size={14} className="opacity-0 -ml-2 transition-all group-hover:opacity-100 group-hover:ml-0" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-slate-50/40 dark:from-slate-800/60 dark:to-slate-800/30 dark:border-slate-700/60">
                  <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Template
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Department
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 hidden md:table-cell">
                    Position
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 hidden lg:table-cell">
                    Questions
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 hidden lg:table-cell">
                    Rating System
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 dark:divide-slate-700/40">
                {existingTemplatesForActiveCycle.map((template, index) => (
                  <tr
                    key={template.id}
                    className="group transition-all duration-200 hover:bg-[#5D5FEF]/[0.02] dark:hover:bg-[#5D5FEF]/[0.04]"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#5D5FEF]/10 to-[#7C7EF5]/5 text-[#5D5FEF] dark:from-[#5D5FEF]/20 dark:to-[#7C7EF5]/10 dark:text-[#8b8ef7]">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 dark:text-white max-w-[240px]">
                            {template.title}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="text-slate-600 dark:text-slate-300 text-xs font-medium truncate max-w-[140px]">
                          {template.departmentName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-slate-600 dark:text-slate-300 hidden md:table-cell truncate max-w-[130px]">
                      {template.positionName}
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold tabular-nums text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                        <Sparkles size={10} className="text-violet-500 dark:text-violet-400" />
                        {template.questions.length}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {template.ratingSystem === 'TEN_POINT' ? '10-Point' : '5-Point'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/hr/self-assessment/templates/${template.id}/edit`}
                        className="group/btn inline-flex items-center gap-1.5 rounded-xl bg-[#5D5FEF]/[0.06] px-3.5 py-2 text-xs font-semibold text-[#5D5FEF] transition-all hover:bg-[#5D5FEF]/[0.12] dark:bg-[#5D5FEF]/10 dark:text-[#8b8ef7] dark:hover:bg-[#5D5FEF]/20"
                      >
                        <Pencil size={13} />
                        Edit
                        <ArrowRight size={11} className="opacity-0 transition-all -ml-1 group-hover/btn:opacity-100 group-hover/btn:ml-0" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                <Link to="/hr/self-assessment/assign-forms" className="font-semibold text-[#5D5FEF] hover:underline dark:text-[#8b8ef7]">
                  Assign Self-Assessment Forms
                </Link>{' '}
                to run an assignment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
