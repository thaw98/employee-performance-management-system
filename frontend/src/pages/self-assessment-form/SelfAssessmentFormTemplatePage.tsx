import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  CalendarRange,
  Search,
  FileText,
  CheckCircle2,
  Lock,
  Building2,
  Eye,
  Pencil,
  SlidersHorizontal,
  X,
  ClipboardList,
  Filter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetTimeSettingsQuery } from '../../features/feedback/api/feedbackApi';
import { useGetReviewCyclesQuery } from '../../features/reviewCycle/api/reviewCycleApi';
import { SelfAssessmentReviewCycleInfo } from './SelfAssessmentReviewCycleInfo';
import { useGetAllTemplatesQuery } from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { ratingSystemLabels } from '../../features/selfAssessmentForm/ratingSystem';

type CyclePhaseFilter = 'all' | 'current' | 'past' | 'upcoming';

function todayIsoLocal(): string {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  const d = String(n.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function phaseForCycleDates(startDate: string, endDate: string, today: string): Exclude<CyclePhaseFilter, 'all'> {
  if (today < startDate) return 'upcoming';
  if (today > endDate) return 'past';
  return 'current';
}

const filterControlClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white';

export const SelfAssessmentFormTemplatePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const isManager = user?.roleId === 2;
  const routeBase = isManager ? '/manager/self-assessment/templates' : '/hr/self-assessment/templates';
  const [searchQuery, setSearchQuery] = useState('');
  const [cyclePhaseFilter, setCyclePhaseFilter] = useState<CyclePhaseFilter>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('');

  const { data: allTemplates = [] } = useGetAllTemplatesQuery();
  const { data: timeSettings, isLoading: timeSettingsLoading } = useGetTimeSettingsQuery();
  const { data: reviewCycles = [] } = useGetReviewCyclesQuery();

  const cyclePhaseById = useMemo(() => {
    const today = todayIsoLocal();
    const map = new Map<number, Exclude<CyclePhaseFilter, 'all'>>();
    for (const c of reviewCycles) {
      map.set(c.id, phaseForCycleDates(c.startDate, c.endDate, today));
    }
    return map;
  }, [reviewCycles]);

  const departmentOptions = useMemo(() => {
    const byId = new Map<number, string>();
    for (const t of allTemplates) {
      byId.set(t.departmentId, t.departmentName);
    }
    return [...byId.entries()].sort((a, b) =>
      a[1].localeCompare(b[1], undefined, { sensitivity: 'base' })
    );
  }, [allTemplates]);

  const positionOptions = useMemo(() => {
    const byId = new Map<number, string>();
    const deptId = departmentFilter ? Number(departmentFilter) : NaN;
    const restrictDept = Number.isFinite(deptId);
    for (const t of allTemplates) {
      if (restrictDept && t.departmentId !== deptId) continue;
      byId.set(t.positionId, t.positionName);
    }
    return [...byId.entries()].sort((a, b) =>
      a[1].localeCompare(b[1], undefined, { sensitivity: 'base' })
    );
  }, [allTemplates, departmentFilter]);

  useEffect(() => {
    if (!positionFilter) return;
    const pid = Number(positionFilter);
    if (!positionOptions.some(([id]) => id === pid)) {
      setPositionFilter('');
    }
  }, [positionFilter, positionOptions]);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allTemplates.filter((template) => {
      if (departmentFilter && Number(departmentFilter) !== template.departmentId) return false;
      if (positionFilter && Number(positionFilter) !== template.positionId) return false;

      if (cyclePhaseFilter !== 'all') {
        const cid = template.reviewCycleId;
        if (cid == null) return false;
        const phase = cyclePhaseById.get(cid);
        if (phase !== cyclePhaseFilter) return false;
      }

      if (!q) return true;
      const hay = [
        template.title,
        template.departmentName,
        template.positionName,
        template.reviewCycleName ?? '',
      ]
        .join('\n')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [
    allTemplates,
    searchQuery,
    departmentFilter,
    positionFilter,
    cyclePhaseFilter,
    cyclePhaseById,
  ]);

  const displayDuration =
    timeSettings?.duration === 'Both' ? '6 Months & 1 Year (combined)' : timeSettings?.duration;

  const activeCount = allTemplates.filter((t) => t.isActive).length;
  const assignedCount = allTemplates.filter((t) => t.isLocked).length;
  const uniqueDepts = new Set(allTemplates.map((t) => t.departmentId)).size;

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    cyclePhaseFilter !== 'all' ||
    departmentFilter !== '' ||
    positionFilter !== '';

  const summaryCards = [
    {
      label: 'Total Templates',
      value: allTemplates.length,
      icon: FileText,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-900/30',
      accent: 'border-l-blue-500',
    },
    {
      label: 'Active',
      value: activeCount,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
      accent: 'border-l-emerald-500',
    },
    {
      label: 'Assigned',
      value: assignedCount,
      icon: Lock,
      iconColor: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-50 dark:bg-violet-900/30',
      accent: 'border-l-violet-500',
    },
    {
      label: 'Departments',
      value: uniqueDepts,
      icon: Building2,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-900/30',
      accent: 'border-l-amber-500',
    },
  ];

  return (
    <div className="px-6 py-6 md:px-8 animate-fade-in">
      {/* ─── Breadcrumb ─── */}
      <div className="mb-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="text-emerald-700 dark:text-emerald-400">Home</span>
        <span>/</span>
        <span>Self Assessment</span>
        <span>/</span>
        <span className="font-medium text-slate-800 dark:text-white">Templates</span>
      </div>

      {/* ─── Header ─── */}
      <div className="mt-2 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Self Assessment Templates
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            {isManager
              ? 'Review HR templates for your department and manage your added questions'
              : 'Create and manage self-assessment templates for each department and position'}
          </p>
        </div>
        {!isManager && (
          <button
            type="button"
            onClick={() => navigate('/hr/self-assessment/templates/create')}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow active:scale-[0.97]"
          >
            <Plus size={16} strokeWidth={2.5} />
            Create Template
          </button>
        )}
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border border-l-4 ${card.accent} border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/80 transition hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}>
                <card.icon size={20} className={card.iconColor} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Review Cycle Info Banner ─── */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-4 dark:border-slate-700 dark:from-slate-800/60 dark:to-slate-800/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200">
            <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/40">
              <CalendarRange className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Review duration</span>
              <span className="mx-1.5 text-slate-300 dark:text-slate-600">|</span>
              {timeSettingsLoading ? (
                <span className="text-slate-400">Loading…</span>
              ) : displayDuration ? (
                <span className="text-slate-700 dark:text-slate-300">{displayDuration}</span>
              ) : (
                <span className="text-slate-400">Not configured</span>
              )}
              {timeSettings?.yearType ? (
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                  Year type: {timeSettings.yearType}
                </span>
              ) : null}
            </div>
          </div>
          <div className="hidden sm:block sm:h-10 sm:w-px sm:shrink-0 sm:bg-slate-200 dark:sm:bg-slate-700" />
          <SelfAssessmentReviewCycleInfo variant="inline" />
        </div>
      </div>

      {/* ─── Templates Table Card ─── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
        {/* Card header */}
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
              <ClipboardList size={16} className="text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">All Templates</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {filteredTemplates.length} of {allTemplates.length} template{allTemplates.length !== 1 ? 's' : ''}
                {hasActiveFilters ? ' (filtered)' : ''}
              </p>
            </div>
          </div>
          {allTemplates.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {hasActiveFilters
                  ? `${filteredTemplates.length} result${filteredTemplates.length !== 1 ? 's' : ''}`
                  : 'No filters applied'}
              </span>
            </div>
          )}
        </div>

        {allTemplates.length > 0 ? (
          <div className="p-6">
            {/* ─── Filter Bar ─── */}
            <div className="mb-5 rounded-lg border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/30">
              <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
                <div className="min-w-[min(100%,240px)] flex-1">
                  <label htmlFor="sa-template-search" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Search
                  </label>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    />
                    <input
                      id="sa-template-search"
                      type="search"
                      placeholder="Title, department, position, cycle…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`${filterControlClass} pl-9 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition`}
                    />
                  </div>
                </div>
                <div className="min-w-[150px]">
                  <label htmlFor="sa-template-cycle" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Review Cycle
                  </label>
                  <select
                    id="sa-template-cycle"
                    value={cyclePhaseFilter}
                    onChange={(e) => setCyclePhaseFilter(e.target.value as CyclePhaseFilter)}
                    className={`${filterControlClass} focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition`}
                  >
                    <option value="all">All cycles</option>
                    <option value="current">Current cycle</option>
                    <option value="past">Past cycles</option>
                    <option value="upcoming">Upcoming cycles</option>
                  </select>
                </div>
                <div className="min-w-[160px]">
                  <label htmlFor="sa-template-dept" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Department
                  </label>
                  <select
                    id="sa-template-dept"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className={`${filterControlClass} focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition`}
                  >
                    <option value="">All departments</option>
                    {departmentOptions.map(([id, name]) => (
                      <option key={id} value={String(id)}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-[160px]">
                  <label htmlFor="sa-template-position" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Position
                  </label>
                  <select
                    id="sa-template-position"
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    className={`${filterControlClass} focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition`}
                  >
                    <option value="">All positions</option>
                    {positionOptions.map(([id, name]) => (
                      <option key={id} value={String(id)}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCyclePhaseFilter('all');
                      setDepartmentFilter('');
                      setPositionFilter('');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  >
                    <X size={14} />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* ─── Table ─── */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              {filteredTemplates.length > 0 ? (
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Template
                      </th>
                      <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Department
                      </th>
                      <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Position
                      </th>
                      <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Review Cycle
                      </th>
                      <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                        Questions
                      </th>
                      <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Rating
                      </th>
                      <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Status
                      </th>
                      <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
                    {filteredTemplates.map((template) => (
                      <tr
                        key={template.id}
                        className="group transition-colors hover:bg-emerald-50/40 dark:hover:bg-slate-700/30"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                              <FileText size={15} />
                            </div>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {template.title?.trim() ? template.title : '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Building2 size={13} className="text-slate-400 dark:text-slate-500" />
                            {template.departmentName}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                          {template.positionName}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 max-w-[220px] truncate">
                          {template.reviewCycleName?.trim() ? template.reviewCycleName : (
                            <span className="text-slate-400 dark:text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                            {template.questions?.length ?? 0}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            <SlidersHorizontal size={11} />
                            {ratingSystemLabels[template.ratingSystem]}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                template.isActive
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {template.isActive && <CheckCircle2 size={11} />}
                              {template.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                template.isLocked
                                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                              }`}
                              title={
                                template.isLocked
                                  ? 'At least one self-assessment form has been created from this template'
                                  : 'No forms assigned yet for this template'
                              }
                            >
                              {template.isLocked && <Lock size={11} />}
                              {template.isLocked ? 'Assigned' : 'Not assigned'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`${routeBase}/${template.id}/edit`)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                              template.isLocked || isManager
                                ? 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'
                            }`}
                          >
                            {template.isLocked || isManager ? (
                              <>
                                <Eye size={13} />
                                View
                              </>
                            ) : (
                              <>
                                <Pencil size={13} />
                                Edit
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                    <Search size={24} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No templates match your filters</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Try adjusting your search or filter criteria</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCyclePhaseFilter('all');
                      setDepartmentFilter('');
                      setPositionFilter('');
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  >
                    <X size={12} />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
              <ClipboardList size={28} className="text-slate-400" />
            </div>
            <p className="text-base font-medium text-slate-700 dark:text-slate-300">No templates created yet</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Get started by creating your first self-assessment template
            </p>
            {!isManager && (
              <button
                type="button"
                onClick={() => navigate('/hr/self-assessment/templates/create')}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow active:scale-[0.97]"
              >
                <Plus size={16} strokeWidth={2.5} />
                Create Template
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
