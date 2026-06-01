import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  ChevronDown,
  Eye,
  FileWarning,
  Filter,
  Search,
  Send,
  SlidersHorizontal,
  UserCheck,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetActiveReviewCyclesQuery } from '../../features/reviewCycle/api/reviewCycleApi';
import {
  type CoverageEmployeeRow,
  useGetAssignmentCoverageQuery,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { PaginationBar } from '../../components/common/PaginationBar';
import { SelfAssessmentReviewCycleInfo } from './SelfAssessmentReviewCycleInfo';

type CoverageTab = 'assigned' | 'left-to-assign';
type StatusFilter = 'all' | 'unassigned' | 'no-template';

const filterControlClass =
  'w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all focus:border-[#2463eb] focus:outline-none focus:ring-2 focus:ring-[#2463eb]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-[#2463eb]';

function formatAssignedDate(value?: string | null) {
  if (!value) return '-';

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString('en-GB');
}

function filterCoverageRows(
  rows: CoverageEmployeeRow[],
  opts: {
    search: string;
    departmentFilter: string;
    positionFilter: string;
    statusFilter: StatusFilter;
    tab: CoverageTab;
  }
): CoverageEmployeeRow[] {
  const q = opts.search.trim().toLowerCase();

  return rows.filter((row) => {
    if (opts.departmentFilter !== 'all' && row.departmentName !== opts.departmentFilter) return false;
    if (opts.positionFilter !== 'all' && row.positionName !== opts.positionFilter) return false;

    if (opts.tab === 'left-to-assign' && opts.statusFilter !== 'all') {
      if (opts.statusFilter === 'no-template' && row.unassignedReason !== 'NO_MATCHING_TEMPLATE') return false;
      if (opts.statusFilter === 'unassigned' && row.unassignedReason === 'NO_MATCHING_TEMPLATE') return false;
    }

    if (!q) return true;

    return (
      row.employeeName.toLowerCase().includes(q) ||
      row.employeeCode.toLowerCase().includes(q) ||
      (row.departmentName ?? '').toLowerCase().includes(q) ||
      (row.positionName ?? '').toLowerCase().includes(q) ||
      (row.managerName ?? '').toLowerCase().includes(q) ||
      (row.templateTitle ?? '').toLowerCase().includes(q)
    );
  });
}

export const SelfAssessmentAssignmentCoveragePage: React.FC = () => {
  const { data: activeCycles = [] } = useGetActiveReviewCyclesQuery();
  const { data: coverageData, isLoading: coverageLoading } = useGetAssignmentCoverageQuery();
  const [coverageTab, setCoverageTab] = useState<CoverageTab>('assigned');
  const [coverageSearch, setCoverageSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const activeSubmissionCycle = activeCycles.find((cycle) => cycle.requiresEmployeeSubmission) ?? null;

  const baseRows = useMemo(() => {
    if (!coverageData) return [];
    return coverageTab === 'assigned' ? coverageData.assignedEmployees : coverageData.unassignedEmployees;
  }, [coverageData, coverageTab]);

  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of baseRows) {
      if (row.departmentName) set.add(row.departmentName);
    }
    return [...set].sort();
  }, [baseRows]);

  const positionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of baseRows) {
      if (row.positionName) set.add(row.positionName);
    }
    return [...set].sort();
  }, [baseRows]);

  const filteredRows = useMemo(
    () =>
      filterCoverageRows(baseRows, {
        search: coverageSearch,
        departmentFilter,
        positionFilter,
        statusFilter,
        tab: coverageTab,
      }),
    [baseRows, coverageSearch, departmentFilter, positionFilter, statusFilter, coverageTab]
  );

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(filteredRows.length / pageSize)),
    [filteredRows.length, pageSize]
  );

  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, pageIndex, pageSize]);

  const hasActiveFilters =
    coverageSearch.trim() !== '' ||
    departmentFilter !== 'all' ||
    positionFilter !== 'all' ||
    statusFilter !== 'all';

  const activeFilterCount = [
    coverageSearch.trim() !== '',
    departmentFilter !== 'all',
    positionFilter !== 'all',
    statusFilter !== 'all',
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setCoverageSearch('');
    setDepartmentFilter('all');
    setPositionFilter('all');
    setStatusFilter('all');
  };

  useEffect(() => {
    setPageIndex(0);
  }, [coverageTab, coverageSearch, departmentFilter, positionFilter, statusFilter]);

  useEffect(() => {
    setDepartmentFilter('all');
    setPositionFilter('all');
    setStatusFilter('all');
  }, [coverageTab]);

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(0, pageCount - 1));
    }
  }, [pageIndex, pageCount]);

  if (coverageLoading) {
    return (
      <div className="min-h-screen px-6 py-6 md:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-80 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-96 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => (
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
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <span className="text-[#2463eb] dark:text-[#60a5fa] font-medium">Home</span>
        <ChevronDown size={10} className="-rotate-90 opacity-50" />
        <span>Self Assessment</span>
        <ChevronDown size={10} className="-rotate-90 opacity-50" />
        <span className="font-semibold text-slate-700 dark:text-slate-200">Assignment Coverage</span>
      </nav>

      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] shadow-lg shadow-[#2463eb]/25">
            <BarChart3 size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Assignment Coverage
            </h1>
            <p className="mt-0.5 max-w-lg text-sm text-slate-500 dark:text-slate-400">
              Employee-level view of who is assigned vs. left to assign for the current cycle
            </p>
          </div>
        </div>
        {activeSubmissionCycle && (
          <Link
            to="/hr/self-assessment/assign-forms"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#2463eb]/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#2463eb]/30"
          >
            <Send size={16} />
            Assign Forms
          </Link>
        )}
      </div>

      {activeSubmissionCycle && (
        <div className="mb-6">
          <SelfAssessmentReviewCycleInfo
            variant="inline"
            primaryColor="#2463eb"
            primaryColorDark="#1d4ed8"
          />
        </div>
      )}

      {!activeSubmissionCycle ? (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 px-6 py-8 text-center dark:border-amber-800/40 dark:bg-amber-950/20">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            No active employee-submission review cycle is available.
          </p>
        </div>
      ) : !coverageData || coverageData.eligibleCount === 0 ? (
        <div className="rounded-2xl border border-slate-200/60 bg-white px-6 py-12 text-center shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700/60">
            <Users size={28} className="text-slate-300 dark:text-slate-500" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-200">No eligible employees</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            There are no eligible employees for assignment coverage in the current cycle.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
            {([
              { label: 'Eligible', value: coverageData.eligibleCount, icon: Users, lightBg: 'bg-sky-50 dark:bg-sky-950/30', lightIcon: 'text-sky-600 dark:text-sky-400', ring: 'ring-sky-500/20', bgGlow: 'bg-sky-500/10' },
              { label: 'Assigned', value: coverageData.assignedCount, icon: UserCheck, lightBg: 'bg-emerald-50 dark:bg-emerald-950/30', lightIcon: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20', bgGlow: 'bg-emerald-500/10' },
              { label: 'Left to Assign', value: coverageData.leftToAssignCount, icon: UserX, lightBg: 'bg-amber-50 dark:bg-amber-950/30', lightIcon: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/20', bgGlow: 'bg-amber-500/10' },
              { label: 'No Template', value: coverageData.noTemplateCount, icon: FileWarning, lightBg: 'bg-red-50 dark:bg-red-950/30', lightIcon: 'text-red-600 dark:text-red-400', ring: 'ring-red-500/20', bgGlow: 'bg-red-500/10' },
              { label: 'Coverage', value: `${coverageData.coveragePercent}%`, icon: BarChart3, lightBg: 'bg-violet-50 dark:bg-violet-950/30', lightIcon: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-500/20', bgGlow: 'bg-violet-500/10' },
            ]).map((card, i) => (
              <div
                key={card.label}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-800/80"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full ${card.bgGlow} blur-2xl transition-all duration-500 group-hover:scale-150`} />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      {card.label}
                    </p>
                    <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                      {card.value}
                    </p>
                  </div>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.lightBg} ring-1 ${card.ring}`}>
                    <card.icon size={14} className={card.lightIcon} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
            <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700/60">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div
                    role="tablist"
                    aria-label="Coverage tab"
                    className="inline-flex rounded-xl border border-slate-200 bg-slate-50/50 p-1 dark:border-slate-700 dark:bg-slate-800/60"
                  >
                    {([
                      { id: 'assigned' as const, label: 'Assigned', icon: UserCheck, count: coverageData.assignedCount },
                      { id: 'left-to-assign' as const, label: 'Left to Assign', icon: UserX, count: coverageData.leftToAssignCount },
                    ]).map((tab) => {
                      const Icon = tab.icon;
                      const isActive = coverageTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => setCoverageTab(tab.id)}
                          className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-[#2463eb] text-white shadow-sm shadow-[#2463eb]/20'
                              : 'text-slate-500 hover:bg-white hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white'
                          }`}
                        >
                          <Icon size={14} />
                          {tab.label}
                          <span
                            className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums ${
                              isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-500 dark:bg-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {filteredRows.length} of {baseRows.length} employee{baseRows.length !== 1 ? 's' : ''}
                    {hasActiveFilters && (
                      <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-[#2463eb]/10 px-2 py-0.5 text-[10px] font-bold text-[#2463eb] dark:bg-[#2463eb]/20 dark:text-[#60a5fa]">
                        <Filter size={9} />
                        Filtered
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={coverageSearch}
                      onChange={(e) => setCoverageSearch(e.target.value)}
                      placeholder="Search by name, ID, dept, position, manager..."
                      className={`${filterControlClass} py-2 pl-9 pr-9 text-xs font-medium`}
                    />
                    {coverageSearch && (
                      <button
                        type="button"
                        onClick={() => setCoverageSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                        aria-label="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedFilters(!expandedFilters)}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all shadow-sm ${
                      expandedFilters || hasActiveFilters
                        ? 'border-[#2463eb]/30 bg-[#2463eb]/[0.04] text-[#2463eb] dark:border-[#2463eb]/40 dark:bg-[#2463eb]/10 dark:text-[#60a5fa]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <SlidersHorizontal size={14} />
                    Filters
                    {hasActiveFilters && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2463eb] text-[10px] font-bold text-white">
                        {activeFilterCount}
                      </span>
                    )}
                    <ChevronDown size={12} className={`transition-transform ${expandedFilters ? 'rotate-180' : ''}`} />
                  </button>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    >
                      <X size={13} />
                      Clear
                    </button>
                  )}
                </div>

                {expandedFilters && (
                  <div className={`grid gap-3 animate-fade-in ${coverageTab === 'left-to-assign' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                    <div>
                      <label htmlFor="coverage-dept-filter" className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Department
                      </label>
                      <select
                        id="coverage-dept-filter"
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className={filterControlClass}
                      >
                        <option value="all">All departments</option>
                        {departmentOptions.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="coverage-pos-filter" className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Position
                      </label>
                      <select
                        id="coverage-pos-filter"
                        value={positionFilter}
                        onChange={(e) => setPositionFilter(e.target.value)}
                        className={filterControlClass}
                      >
                        <option value="all">All positions</option>
                        {positionOptions.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    </div>
                    {coverageTab === 'left-to-assign' && (
                      <div>
                        <label htmlFor="coverage-status-filter" className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Status
                        </label>
                        <select
                          id="coverage-status-filter"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                          className={filterControlClass}
                        >
                          <option value="all">All statuses</option>
                          <option value="unassigned">Unassigned</option>
                          <option value="no-template">No Template</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {filteredRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-16">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700/60">
                  {hasActiveFilters ? (
                    <Search size={28} className="text-slate-300 dark:text-slate-500" />
                  ) : coverageTab === 'assigned' ? (
                    <UserCheck size={28} className="text-slate-300 dark:text-slate-500" />
                  ) : (
                    <UserX size={28} className="text-slate-300 dark:text-slate-500" />
                  )}
                </div>
                <p className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-200">
                  {hasActiveFilters
                    ? 'No employees match your search or filters'
                    : coverageTab === 'assigned'
                      ? 'No assigned employees'
                      : 'All employees have been assigned'}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <X size={14} />
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-slate-50/40 dark:border-slate-700/60 dark:from-slate-800/60 dark:to-slate-800/30">
                        <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Employee
                        </th>
                        <th className="hidden px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 md:table-cell">
                          Department
                        </th>
                        <th className="hidden px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 lg:table-cell">
                          Position
                        </th>
                        <th className="hidden px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 lg:table-cell">
                          Manager
                        </th>
                        <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Status
                        </th>
                        <th className="hidden px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 lg:table-cell">
                          Template
                        </th>
                        <th className="hidden px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 lg:table-cell">
                          Assigned Date
                        </th>
                        <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80 dark:divide-slate-700/40">
                      {paginatedRows.map((row) => (
                        <tr
                          key={row.employeeId}
                          className="group transition-all duration-200 hover:bg-[#2463eb]/[0.02] dark:hover:bg-[#2463eb]/[0.04]"
                        >
                          <td className="px-5 py-3">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{row.employeeName}</p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500">{row.employeeCode}</p>
                            </div>
                          </td>
                          <td className="hidden px-5 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 md:table-cell">
                            {row.departmentName ?? '-'}
                          </td>
                          <td className="hidden px-5 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 lg:table-cell">
                            {row.positionName ?? '-'}
                          </td>
                          <td className="hidden px-5 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 lg:table-cell">
                            {row.managerName ?? '-'}
                          </td>
                          <td className="px-5 py-3">
                            {row.assignmentStatus === 'ASSIGNED' ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <UserCheck size={10} />
                                Assigned
                              </span>
                            ) : row.unassignedReason === 'NO_MATCHING_TEMPLATE' ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                <FileWarning size={10} />
                                No Template
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                <UserX size={10} />
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="hidden max-w-[180px] truncate px-5 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 lg:table-cell">
                            {row.templateTitle ?? '-'}
                          </td>
                          <td className="hidden px-5 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 lg:table-cell">
                            {formatAssignedDate(row.assignedDate)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {row.assignmentStatus === 'ASSIGNED' ? (
                              <Link
                                to="/hr/self-assessment/forms"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2463eb]/[0.06] px-3 py-1.5 text-xs font-semibold text-[#2463eb] transition-all hover:bg-[#2463eb]/[0.12] dark:bg-[#2463eb]/10 dark:text-[#60a5fa] dark:hover:bg-[#2463eb]/20"
                              >
                                <Eye size={13} />
                                View Forms
                              </Link>
                            ) : (
                              <Link
                                to="/hr/self-assessment/assign-forms"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2463eb]/[0.06] px-3 py-1.5 text-xs font-semibold text-[#2463eb] transition-all hover:bg-[#2463eb]/[0.12] dark:bg-[#2463eb]/10 dark:text-[#60a5fa] dark:hover:bg-[#2463eb]/20"
                              >
                                <Send size={13} />
                                Assign
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-700/60">
                  <PaginationBar
                    className="mt-0 rounded-none border-0 shadow-none dark:bg-transparent"
                    pageIndex={pageIndex}
                    pageSize={pageSize}
                    pageCount={pageCount}
                    totalItems={filteredRows.length}
                    itemLabel="employees"
                    rowsPerPageOptions={[5, 10, 20, 50]}
                    onPageIndexChange={setPageIndex}
                    onPageSizeChange={(nextSize) => {
                      setPageSize(nextSize);
                      setPageIndex(0);
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
