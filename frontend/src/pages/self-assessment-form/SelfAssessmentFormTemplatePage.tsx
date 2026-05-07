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
  ArrowRight,
  Sparkles,
  LayoutGrid,
  List,
  ChevronDown,
  Copy,
  BookOpen,
  Unlock,
  Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetTimeSettingsQuery } from '../../features/feedback/api/feedbackApi';
import { useGetReviewCyclesQuery } from '../../features/reviewCycle/api/reviewCycleApi';
import { SelfAssessmentReviewCycleInfo } from './SelfAssessmentReviewCycleInfo';
import {
  useDeleteCopiedTemplateMutation,
  useCopyTemplateMutation,
  useGetAllTemplatesQuery,
  useGetCopiedTemplateQuery,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
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
  'w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all focus:border-[#5D5FEF] focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-[#5D5FEF]';

export const SelfAssessmentFormTemplatePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const isManager = user?.roleId === 2;
  const routeBase = isManager ? '/manager/self-assessment/templates' : '/hr/self-assessment/templates';
  const [searchQuery, setSearchQuery] = useState('');
  const [cyclePhaseFilter, setCyclePhaseFilter] = useState<CyclePhaseFilter>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [copyingTemplateId, setCopyingTemplateId] = useState<number | null>(null);

  const { data: allTemplates = [] } = useGetAllTemplatesQuery();
  const { data: copiedTemplate } = useGetCopiedTemplateQuery(undefined, { skip: isManager });
  const [copyTemplate, { isLoading: isCopyingTemplate }] = useCopyTemplateMutation();
  const [deleteCopiedTemplate, { isLoading: isClearingCopiedTemplate }] = useDeleteCopiedTemplateMutation();
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
  const unassignedCount = allTemplates.filter((t) => !t.isLocked).length;

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    cyclePhaseFilter !== 'all' ||
    departmentFilter !== '' ||
    positionFilter !== '';

  const clearAllFilters = () => {
    setSearchQuery('');
    setCyclePhaseFilter('all');
    setDepartmentFilter('');
    setPositionFilter('');
  };

  const handleDuplicateTemplate = async (templateId: number) => {
    setCopyingTemplateId(templateId);
    try {
      await copyTemplate(templateId).unwrap();
      toast.success('Template duplicated. Continue when ready.');
    } catch {
      toast.error('Could not duplicate template');
    } finally {
      setCopyingTemplateId(null);
    }
  };

  const handleContinueCopiedTemplate = () => {
    navigate('/hr/self-assessment/templates/create?fromCopiedTemplate=true');
  };

  const handleClearCopiedTemplate = async () => {
    try {
      await deleteCopiedTemplate().unwrap();
      toast.success('Duplicate draft cleared');
    } catch {
      toast.error('Could not clear duplicate draft');
    }
  };

  const summaryCards = [
    {
      label: 'Total Templates',
      value: allTemplates.length,
      icon: FileText,
      gradient: 'from-blue-500 to-indigo-600',
      bgGlow: 'bg-blue-500/10',
      lightBg: 'bg-blue-50 dark:bg-blue-950/30',
      lightIcon: 'text-blue-600 dark:text-blue-400',
      ring: 'ring-blue-500/20',
    },
    {
      label: 'Active',
      value: activeCount,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-600',
      bgGlow: 'bg-emerald-500/10',
      lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      lightIcon: 'text-emerald-600 dark:text-emerald-400',
      ring: 'ring-emerald-500/20',
    },
    {
      label: 'Assigned',
      value: assignedCount,
      icon: Lock,
      gradient: 'from-violet-500 to-purple-600',
      bgGlow: 'bg-violet-500/10',
      lightBg: 'bg-violet-50 dark:bg-violet-950/30',
      lightIcon: 'text-violet-600 dark:text-violet-400',
      ring: 'ring-violet-500/20',
    },
    {
      label: 'Unassigned',
      value: unassignedCount,
      icon: Unlock,
      gradient: 'from-amber-500 to-orange-600',
      bgGlow: 'bg-amber-500/10',
      lightBg: 'bg-amber-50 dark:bg-amber-950/30',
      lightIcon: 'text-amber-600 dark:text-amber-400',
      ring: 'ring-amber-500/20',
    },

  ];

  const getPhaseBadge = (template: typeof allTemplates[number]) => {
    if (template.reviewCycleId == null) return null;
    const phase = cyclePhaseById.get(template.reviewCycleId);
    if (phase === 'current') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      );
    }
    if (phase === 'upcoming') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
          Upcoming
        </span>
      );
    }
    if (phase === 'past') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-700 dark:text-slate-400">
          Past
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen px-6 py-6 md:px-8 animate-fade-in">
      {/* ─── Breadcrumb ─── */}
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <span className="text-[#5D5FEF] dark:text-[#8b8ef7] font-medium">Home</span>
        <ChevronDown size={10} className="-rotate-90 opacity-50" />
        <span>Self Assessment</span>
        <ChevronDown size={10} className="-rotate-90 opacity-50" />
        <span className="font-semibold text-slate-700 dark:text-slate-200">Templates</span>
      </nav>

      {/* ─── Header ─── */}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/25">
              <ClipboardList size={22} className="text-white" />
            </div>
            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-[9px] font-bold text-white shadow-sm">
              {allTemplates.length}
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Self Assessment Templates
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 max-w-lg">
              {isManager
                ? 'Review templates and manage your department-specific questions'
                : 'Create, configure, and manage self-assessment templates across departments'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isManager && (
            <button
              type="button"
              onClick={() => navigate('/hr/self-assessment/settings')}
              className="group inline-flex items-center gap-2.5 rounded-xl border-2 border-[#5D5FEF]/30 bg-white px-5 py-2.5 text-sm font-bold text-[#5D5FEF] shadow-sm transition-all hover:border-[#5D5FEF]/50 hover:bg-[#5D5FEF]/5 hover:shadow-md active:scale-[0.97] dark:border-[#5D5FEF]/40 dark:bg-slate-800 dark:text-[#8b8ef7] dark:hover:bg-[#5D5FEF]/10"
            >
              <Settings size={16} strokeWidth={2.5} />
              Settings
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(`${routeBase.replace('/templates', '/question-bank')}`)}
            className="group inline-flex items-center gap-2.5 rounded-xl border-2 border-[#5D5FEF]/30 bg-white px-5 py-2.5 text-sm font-bold text-[#5D5FEF] shadow-sm transition-all hover:border-[#5D5FEF]/50 hover:bg-[#5D5FEF]/5 hover:shadow-md active:scale-[0.97] dark:border-[#5D5FEF]/40 dark:bg-slate-800 dark:text-[#8b8ef7] dark:hover:bg-[#5D5FEF]/10"
          >
            <BookOpen size={16} strokeWidth={2.5} />
            Question Bank
          </button>
          {!isManager && (
            <button
              type="button"
              onClick={() => navigate('/hr/self-assessment/templates/create')}
              className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#5D5FEF] to-[#7C7EF5] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#5D5FEF]/25 transition-all hover:shadow-xl hover:shadow-[#5D5FEF]/30 hover:brightness-110 active:scale-[0.97]"
            >
              <Plus size={16} strokeWidth={2.5} />
              Create Template
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Summary Cards ─── */}
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

      {/* ─── Review Cycle Info Banner ─── */}
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
                  <span className="font-bold text-slate-900 dark:text-white">Review Duration</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                  {timeSettingsLoading ? (
                    <span className="text-slate-400 animate-pulse">Loading...</span>
                  ) : displayDuration ? (
                    <span className="font-medium text-[#5D5FEF] dark:text-[#8b8ef7]">{displayDuration}</span>
                  ) : (
                    <span className="text-slate-400">Not configured</span>
                  )}
                </div>
                {timeSettings?.yearType && (
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                    Year type: {timeSettings.yearType}
                  </p>
                )}
              </div>
            </div>
            <div className="hidden sm:block sm:h-8 sm:w-px sm:shrink-0 sm:bg-gradient-to-b sm:from-transparent sm:via-slate-200 sm:to-transparent dark:sm:via-slate-700" />
            <SelfAssessmentReviewCycleInfo variant="inline" />
          </div>
        </div>
      </div>

      {/* ─── Templates Main Card ─── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        {/* Card Header */}
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-700/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700/60">
              <Sparkles size={18} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Templates</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {filteredTemplates.length} of {allTemplates.length} template{allTemplates.length !== 1 ? 's' : ''}
                {hasActiveFilters && (
                  <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-[#5D5FEF]/10 px-2 py-0.5 text-[10px] font-bold text-[#5D5FEF] dark:bg-[#5D5FEF]/20 dark:text-[#8b8ef7]">
                    <Filter size={9} />
                    Filtered
                  </span>
                )}
              </p>
            </div>
          </div>

          {allTemplates.length > 0 && (
            <div className="flex items-center gap-2">
              {/* View Toggle */}
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

        {!isManager && copiedTemplate && (
          <div className="border-b border-slate-100 bg-[#5D5FEF]/[0.03] px-6 py-4 dark:border-slate-700/60 dark:bg-[#5D5FEF]/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#5D5FEF] shadow-sm ring-1 ring-[#5D5FEF]/15 dark:bg-slate-800 dark:text-[#8b8ef7] dark:ring-[#5D5FEF]/25">
                  <Copy size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Continue copied template</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    {copiedTemplate.title?.trim() ? copiedTemplate.title : 'Untitled template'} is ready to review as a new template.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={handleClearCopiedTemplate}
                  disabled={isClearingCopiedTemplate}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <X size={13} />
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleContinueCopiedTemplate}
                  className="group inline-flex items-center gap-1.5 rounded-xl bg-[#5D5FEF] px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-[#5D5FEF]/20 transition-all hover:bg-[#5153dc] active:scale-[0.98] dark:bg-[#6f72f4] dark:hover:bg-[#6265e8]"
                >
                  Continue
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {allTemplates.length > 0 ? (
          <div className="p-6">
            {/* ─── Search + Filter Bar ─── */}
            <div className="mb-6">
              {/* Primary search row */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <input
                    id="sa-template-search"
                    type="search"
                    placeholder="Search templates by title, department, position, or cycle..."
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
                      {[searchQuery.trim() !== '', cyclePhaseFilter !== 'all', departmentFilter !== '', positionFilter !== ''].filter(Boolean).length}
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

              {/* Expanded Filters */}
              {expandedFilters && (
                <div className="mt-3 grid gap-3 sm:grid-cols-3 animate-fade-in">
                  <div>
                    <label htmlFor="sa-template-cycle" className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Review Cycle
                    </label>
                    <select
                      id="sa-template-cycle"
                      value={cyclePhaseFilter}
                      onChange={(e) => setCyclePhaseFilter(e.target.value as CyclePhaseFilter)}
                      className={filterControlClass}
                    >
                      <option value="all">All cycles</option>
                      <option value="current">Current cycle</option>
                      <option value="past">Past cycles</option>
                      <option value="upcoming">Upcoming cycles</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="sa-template-dept" className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Department
                    </label>
                    <select
                      id="sa-template-dept"
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className={filterControlClass}
                    >
                      <option value="">All departments</option>
                      {departmentOptions.map(([id, name]) => (
                        <option key={id} value={String(id)}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="sa-template-position" className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Position
                    </label>
                    <select
                      id="sa-template-position"
                      value={positionFilter}
                      onChange={(e) => setPositionFilter(e.target.value)}
                      className={filterControlClass}
                    >
                      <option value="">All positions</option>
                      {positionOptions.map(([id, name]) => (
                        <option key={id} value={String(id)}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* ─── Table View ─── */}
            {viewMode === 'table' && (
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                {filteredTemplates.length > 0 ? (
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
                          Review Cycle
                        </th>
                        <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 hidden lg:table-cell">
                          Rating
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
                      {filteredTemplates.map((template, index) => (
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
                                <p className="truncate font-semibold text-slate-900 dark:text-white max-w-[220px]">
                                  {template.title?.trim() ? template.title : '\u2014'}
                                </p>
                                {template.reviewCycleName && (
                                  <p className="truncate text-[11px] text-slate-400 dark:text-slate-500 max-w-[220px] md:hidden">
                                    {template.reviewCycleName}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <Building2 size={12} className="text-slate-400 dark:text-slate-500" />
                              <span className="text-slate-600 dark:text-slate-300 text-xs font-medium">{template.departmentName}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs font-medium text-slate-600 dark:text-slate-300 hidden md:table-cell">
                            {template.positionName}
                          </td>
                          <td className="px-5 py-4 hidden lg:table-cell">
                            <div className="flex items-center gap-2">
                              {template.reviewCycleName?.trim() ? (
                                <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[160px]">{template.reviewCycleName}</span>
                              ) : (
                                <span className="text-xs text-slate-300 dark:text-slate-600">{'\u2014'}</span>
                              )}
                              {getPhaseBadge(template)}
                            </div>
                          </td>

                          <td className="px-5 py-4 hidden lg:table-cell">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                              <SlidersHorizontal size={10} />
                              {ratingSystemLabels[template.ratingSystem]}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  template.isActive
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${template.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                {template.isActive ? 'Active' : 'Inactive'}
                              </span>
                              {template.isLocked && (
                                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" title="At least one self-assessment form has been created from this template">
                                  <Lock size={8} />
                                  Assigned
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {!isManager && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => void handleDuplicateTemplate(template.id)}
                                    disabled={isCopyingTemplate && copyingTemplateId === template.id}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-white"
                                  >
                                    <Copy size={13} />
                                    {isCopyingTemplate && copyingTemplateId === template.id ? 'Duplicating...' : 'Duplicate'}
                                  </button>
                                </>
                              )}
<button
                                type="button"
                                onClick={() => navigate(`${routeBase}/${template.id}/edit`)}
                                className={`group/btn inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                                  template.isLocked
                                    ? 'border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-200'
                                    : 'bg-[#5D5FEF]/[0.06] text-[#5D5FEF] hover:bg-[#5D5FEF]/[0.12] dark:bg-[#5D5FEF]/10 dark:text-[#8b8ef7] dark:hover:bg-[#5D5FEF]/20'
                                }`}
                              >
                                {template.isLocked ? (
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
                                <ArrowRight size={11} className="opacity-0 transition-all -ml-1 group-hover/btn:opacity-100 group-hover/btn:ml-0" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-4">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700/60">
                      <Search size={28} className="text-slate-300 dark:text-slate-500" />
                    </div>
                    <p className="text-base font-bold text-slate-700 dark:text-slate-300">No templates match your filters</p>
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

            {/* ─── Grid View ─── */}
            {viewMode === 'grid' && (
              <>
                {filteredTemplates.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredTemplates.map((template, index) => (
                      <div
                        key={template.id}
                        className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up"
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
                                  {template.title?.trim() ? template.title : '\u2014'}
                                </h3>
                                <div className="mt-1 flex items-center gap-1.5">
                                  {getPhaseBadge(template)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2 text-xs">
                              <Building2 size={12} className="shrink-0 text-slate-400 dark:text-slate-500" />
                              <span className="truncate text-slate-600 dark:text-slate-300 font-medium">{template.departmentName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-bold text-slate-400 dark:text-slate-500">P</span>
                              <span className="truncate">{template.positionName}</span>
                            </div>
                            {template.reviewCycleName?.trim() && (
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <CalendarRange size={12} className="shrink-0" />
                                <span className="truncate">{template.reviewCycleName}</span>
                              </div>
                            )}
                          </div>

                          {/* Tags */}
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100/80 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                              <ClipboardList size={9} />
                              {template.questions?.length ?? 0} Q{((template.questions?.length ?? 0) !== 1 ? 's' : '')}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100/80 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                              <SlidersHorizontal size={9} />
                              {ratingSystemLabels[template.ratingSystem]}
                            </span>
                            {template.isActive ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100/80 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <CheckCircle2 size={9} />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100/80 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-700/60 dark:text-slate-400">
                                Inactive
                              </span>
                            )}
                            {template.isLocked && (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-violet-100/80 px-2 py-1 text-[10px] font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                                <Lock size={9} />
                                Assigned
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-700/40">
                            {!isManager && (
                              <div className="grid grid-cols-1 gap-2">
                                <button
                                  type="button"
                                  onClick={() => void handleDuplicateTemplate(template.id)}
                                  disabled={isCopyingTemplate && copyingTemplateId === template.id}
                                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/60"
                                >
                                  <Copy size={14} />
                                  {isCopyingTemplate && copyingTemplateId === template.id ? 'Duplicating...' : 'Duplicate'}
                                </button>
                              </div>
                            )}
<button
                              type="button"
                              onClick={() => navigate(`${routeBase}/${template.id}/edit`)}
                              className={`group/btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                                template.isLocked
                                  ? 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700/60'
                                  : 'bg-[#5D5FEF]/[0.06] text-[#5D5FEF] hover:bg-[#5D5FEF]/[0.12] dark:bg-[#5D5FEF]/10 dark:text-[#8b8ef7] dark:hover:bg-[#5D5FEF]/20'
                              }`}
                            >
                              {template.isLocked ? (
                                <>
                                  <Eye size={14} />
                                  View Template
                                </>
                              ) : (
                                <>
                                  <Pencil size={14} />
                                  Edit Template
                                </>
                              )}
                              <ArrowRight size={12} className="transition-transform group-hover/btn:translate-x-0.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-4">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700/60">
                      <Search size={28} className="text-slate-300 dark:text-slate-500" />
                    </div>
                    <p className="text-base font-bold text-slate-700 dark:text-slate-300">No templates match your filters</p>
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
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-4">
            <div className="relative mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700/60">
                <ClipboardList size={36} className="text-slate-300 dark:text-slate-500" />
              </div>
              <div className="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/25">
                <Plus size={14} className="text-white" />
              </div>
            </div>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">No templates created yet</p>
            <p className="mt-1.5 max-w-sm text-center text-sm text-slate-400 dark:text-slate-500">
              Get started by creating your first self-assessment template for a department and position
            </p>
            {!isManager && (
              <button
                type="button"
                onClick={() => navigate('/hr/self-assessment/templates/create')}
                className="group mt-6 inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#5D5FEF] to-[#7C7EF5] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#5D5FEF]/25 transition-all hover:shadow-xl hover:shadow-[#5D5FEF]/30 hover:brightness-110 active:scale-[0.97]"
              >
                <Plus size={16} strokeWidth={2.5} />
                Create Your First Template
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
