import React, { useEffect, useMemo, useState } from 'react';
import { Plus, CalendarRange, Search } from 'lucide-react';
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Self Assessment Template</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isManager
                ? 'Review HR templates for your department and manage your added questions'
                : 'Create and manage self-assessment templates for each department and position'}
            </p>
          </div>
          {!isManager && (
            <button
              type="button"
              onClick={() => navigate('/hr/self-assessment/templates/create')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <Plus size={16} />
              Create New Template
            </button>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-600 dark:bg-slate-800/50">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
              <CalendarRange className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">Review duration setting</span>
                <span className="mx-1.5 text-slate-400">·</span>
                {timeSettingsLoading ? (
                  <span className="text-slate-500">Loading…</span>
                ) : displayDuration ? (
                  <span>{displayDuration}</span>
                ) : (
                  <span className="text-slate-500">Not configured</span>
                )}
                {timeSettings?.yearType ? (
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Year type: {timeSettings.yearType}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="hidden sm:block sm:h-10 sm:w-px sm:shrink-0 sm:bg-slate-200 dark:sm:bg-slate-600" />
            <SelfAssessmentReviewCycleInfo variant="inline" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Existing Templates
          </h2>

          {allTemplates.length > 0 ? (
            <>
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
                <div className="min-w-[min(100%,220px)] flex-1">
                  <label htmlFor="sa-template-search" className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
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
                      className={`${filterControlClass} pl-9`}
                    />
                  </div>
                </div>
                <div className="min-w-[140px]">
                  <label htmlFor="sa-template-cycle" className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Review cycle
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
                <div className="min-w-[160px]">
                  <label htmlFor="sa-template-dept" className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Department
                  </label>
                  <select
                    id="sa-template-dept"
                    value={departmentFilter}
                    onChange={(e) => {
                      setDepartmentFilter(e.target.value);
                    }}
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
                <div className="min-w-[160px]">
                  <label htmlFor="sa-template-position" className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
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
                {(searchQuery.trim() !== '' ||
                  cyclePhaseFilter !== 'all' ||
                  departmentFilter !== '' ||
                  positionFilter !== '') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCyclePhaseFilter('all');
                      setDepartmentFilter('');
                      setPositionFilter('');
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 lg:mb-0"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                {filteredTemplates.length > 0 ? (
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                      Title
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                      Department
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                      Position
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                      Review cycle
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                      Questions
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                      Rating
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                  {filteredTemplates.map((template) => (
                    <tr key={template.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {template.title?.trim() ? template.title : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{template.departmentName}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{template.positionName}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[220px]">
                        {template.reviewCycleName?.trim() ? template.reviewCycleName : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{template.questions?.length ?? 0}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {ratingSystemLabels[template.ratingSystem]}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className={`inline-flex text-xs px-2 py-0.5 rounded-full ${template.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}
                          >
                            {template.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                              template.isLocked
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/35 dark:text-blue-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                            }`}
                            title={
                              template.isLocked
                                ? 'At least one self-assessment form has been created from this template'
                                : 'No forms assigned yet for this template'
                            }
                          >
                            {template.isLocked ? 'Assigned' : 'Not assigned'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => navigate(`${routeBase}/${template.id}/edit`)}
                            className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            {template.isLocked || isManager ? 'View' : 'Edit'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400 px-4">
                    No templates match your filters.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-slate-200 py-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400 px-4">
              No templates created yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
