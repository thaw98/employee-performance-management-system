import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CalendarRange,
  Layers3,
  Search,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useGetDepartmentsQuery } from '../../features/department/api/departmentApi';
import { useGetEmployeesQuery, type EmployeeListItem } from '../../features/hrEmployeeList/hrEmployeeApi';
import { useGetPositionsQuery } from '../../features/position/api/positionApi';
import { useGetActiveReviewCyclesQuery } from '../../features/reviewCycle/api/reviewCycleApi';
import {
  useAssignSelfAssessmentFormsMutation,
  type SelfAssessmentAssignmentMode,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { AudienceCard, createCountBadge, formatEmployeeCount } from './SelfAssessmentAudienceCard';
import { formatCycleDate, SelfAssessmentReviewCycleInfo } from './SelfAssessmentReviewCycleInfo';

const normalizeLookupKey = (value: unknown) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const employeeIsActive = (employee: EmployeeListItem) => {
  if (employee.employeeActiveStatus) {
    return employee.employeeActiveStatus === 'ACTIVE';
  }
  return employee.employmentStatus !== 'Resigned' && employee.employmentStatus !== 'Terminated';
};

function toggleId(values: number[], id: number) {
  return values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
}

function SelectionPanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="h-5 w-1 shrink-0 rounded-full bg-[#5D5FEF]" aria-hidden />
      <h3 className="text-xs font-bold uppercase tracking-wide text-blue-950 dark:text-white">{children}</h3>
    </div>
  );
}

export const AssignSelfAssessmentFormsPage: React.FC = () => {
  const navigate = useNavigate();
  const [assignmentMode, setAssignmentMode] = useState<SelfAssessmentAssignmentMode>('DEPARTMENTS');
  const [departmentIds, setDepartmentIds] = useState<number[]>([]);
  const [positionIds, setPositionIds] = useState<number[]>([]);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [managerReviewDeadlineDate, setManagerReviewDeadlineDate] = useState('');
  const [finalApprovalDeadlineDate, setFinalApprovalDeadlineDate] = useState('');
  const [positionSearchQuery, setPositionSearchQuery] = useState('');

  const { data: activeCycles = [] } = useGetActiveReviewCyclesQuery();
  const { data: departmentsResponse } = useGetDepartmentsQuery();
  const { data: positionsResponse } = useGetPositionsQuery({ page: 0, size: 500, status: 'Active' });
  const { data: employeesResponse } = useGetEmployeesQuery({
    page: 0,
    size: 10000,
    sortBy: 'employeeId',
    sortDir: 'asc',
  });
  const [assignForms, { isLoading: isAssigning }] = useAssignSelfAssessmentFormsMutation();

  const activeSubmissionCycle = activeCycles.find((cycle) => cycle.requiresEmployeeSubmission) ?? null;

  useEffect(() => {
    if (!activeSubmissionCycle) return;
    const end = activeSubmissionCycle.endDate ?? '';
    setDeadlineDate(end);
    setManagerReviewDeadlineDate(end);
    setFinalApprovalDeadlineDate(end);
  }, [activeSubmissionCycle]);

  const departments = departmentsResponse?.data ?? [];
  const positions = positionsResponse?.data?.content ?? [];

  const activeEmployees = useMemo(
    () => (employeesResponse?.data?.content ?? []).filter(employeeIsActive),
    [employeesResponse?.data?.content]
  );

  const departmentById = useMemo(() => {
    const map = new Map<number, string>();
    departments.forEach((d) => map.set(d.departmentId, d.departmentName));
    return map;
  }, [departments]);

  const departmentIdByName = useMemo(
    () =>
      new Map(
        departments
          .map((d) => [normalizeLookupKey(d.departmentName), d.departmentId] as const)
          .filter(([name]) => name)
      ),
    [departments]
  );

  const positionById = useMemo(() => {
    const map = new Map<number, string>();
    positions.forEach((p) => map.set(p.positionId, p.positionName));
    return map;
  }, [positions]);

  const positionIdByName = useMemo(
    () =>
      new Map(
        positions
          .map((p) => [normalizeLookupKey(p.positionName), p.positionId] as const)
          .filter(([name]) => name)
      ),
    [positions]
  );

  const departmentAudienceCount = useMemo(
    () =>
      activeEmployees.filter((employee) =>
        departmentIds.some((id) => departmentById.get(id) === employee.departmentName)
      ).length,
    [activeEmployees, departmentById, departmentIds]
  );

  const positionAudienceCount = useMemo(
    () =>
      activeEmployees.filter((employee) =>
        positionIds.some((id) => positionById.get(id) === employee.positionName)
      ).length,
    [activeEmployees, positionById, positionIds]
  );

  const hybridAudienceCount = useMemo(
    () =>
      activeEmployees.filter((employee) => {
        const did = departmentIdByName.get(normalizeLookupKey(employee.departmentName));
        const pid = positionIdByName.get(normalizeLookupKey(employee.positionName));
        if (!did || !pid) return false;
        return departmentIds.includes(did) && positionIds.includes(pid);
      }).length,
    [activeEmployees, departmentIdByName, departmentIds, positionIdByName, positionIds]
  );

  const employeeCountByDepartmentId = useMemo(() => {
    const map = new Map<number, number>();
    departments.forEach((d) => {
      const name = departmentById.get(d.departmentId);
      const n = name ? activeEmployees.filter((e) => e.departmentName === name).length : 0;
      map.set(d.departmentId, n);
    });
    return map;
  }, [departments, departmentById, activeEmployees]);

  const employeeCountByPositionId = useMemo(() => {
    const map = new Map<number, number>();
    positions.forEach((p) => {
      const name = positionById.get(p.positionId);
      const n = name ? activeEmployees.filter((e) => e.positionName === name).length : 0;
      map.set(p.positionId, n);
    });
    return map;
  }, [positions, positionById, activeEmployees]);

  const filteredPositions = useMemo(() => {
    const q = normalizeLookupKey(positionSearchQuery);
    if (!q) return positions;
    return positions.filter((p) => normalizeLookupKey(p.positionName).includes(q));
  }, [positions, positionSearchQuery]);

  const cycleStart = activeSubmissionCycle?.startDate ?? '';
  const cycleEnd = activeSubmissionCycle?.endDate ?? '';
  /** ISO dates sort chronologically; manager/final must not be earlier than the prior stage. */
  const managerReviewMinDate = deadlineDate || cycleStart;
  const finalApprovalMinDate = managerReviewDeadlineDate || cycleStart;

  const selectedSummary = useMemo(() => {
    if (assignmentMode === 'DEPARTMENTS') return `${departmentIds.length} department${departmentIds.length === 1 ? '' : 's'}`;
    if (assignmentMode === 'POSITIONS') return `${positionIds.length} position${positionIds.length === 1 ? '' : 's'}`;
    if (assignmentMode === 'HYBRID') {
      return `${departmentIds.length} department${departmentIds.length === 1 ? '' : 's'} and ${positionIds.length} position${positionIds.length === 1 ? '' : 's'}`;
    }
    return 'All eligible employees';
  }, [assignmentMode, departmentIds.length, positionIds.length]);

  const validate = () => {
    if (!activeSubmissionCycle) return 'No active employee-submission review cycle is available';
    if (assignmentMode === 'DEPARTMENTS' && departmentIds.length === 0) return 'Please select at least one department';
    if (assignmentMode === 'POSITIONS' && positionIds.length === 0) return 'Please select at least one position';
    if (assignmentMode === 'HYBRID' && (departmentIds.length === 0 || positionIds.length === 0)) {
      return 'Please select at least one department and one position';
    }
    if (!deadlineDate || !managerReviewDeadlineDate || !finalApprovalDeadlineDate) return 'Please select all deadlines';
    if (deadlineDate > managerReviewDeadlineDate) {
      return 'Manager review deadline cannot be earlier than the employee deadline.';
    }
    if (managerReviewDeadlineDate > finalApprovalDeadlineDate) {
      return 'Final approval deadline cannot be earlier than the manager review deadline.';
    }
    const { startDate, endDate } = activeSubmissionCycle;
    if ([deadlineDate, managerReviewDeadlineDate, finalApprovalDeadlineDate].some((date) => date < startDate || date > endDate)) {
      return 'All deadlines must be within the active cycle';
    }
    return null;
  };

  const handleAssign = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      const result = await assignForms({
        assignmentMode,
        departmentIds,
        positionIds,
        deadlineDate,
        managerReviewDeadlineDate,
        finalApprovalDeadlineDate,
      }).unwrap();
      toast.success(
        `Created ${result.createdCount}; skipped ${result.skippedExistingCount} existing and ${result.skippedNoTemplateCount} without templates.`,
      );
      navigate('/hr/self-assessment/assignments');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to assign self-assessment forms');
    }
  };

  const showDepartments = assignmentMode === 'DEPARTMENTS' || assignmentMode === 'HYBRID';
  const showPositions = assignmentMode === 'POSITIONS' || assignmentMode === 'HYBRID';

  const selectAllDepartments = () => setDepartmentIds(departments.map((d) => d.departmentId));
  const clearDepartments = () => setDepartmentIds([]);
  const selectAllFilteredPositions = () =>
    setPositionIds((current) => {
      const next = new Set(current);
      filteredPositions.forEach((p) => next.add(p.positionId));
      return [...next];
    });
  const clearPositions = () => setPositionIds([]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          to="/hr/self-assessment/assignments"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          <ArrowLeft size={16} aria-hidden />
          Back to assignments overview
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Assign Self-Assessment Forms</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Choose departments and positions, set deadlines, and create forms for the active review cycle.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-600 dark:bg-slate-800/50">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
            <CalendarRange className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Assignment cycle</span>
              {activeSubmissionCycle ? (
                <>
                  <span className="mx-1.5 text-slate-400">·</span>
                  <span>{activeSubmissionCycle.name}</span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                    {formatCycleDate(activeSubmissionCycle.startDate)} - {formatCycleDate(activeSubmissionCycle.endDate)}
                  </span>
                </>
              ) : (
                <span className="ml-1.5 text-slate-500">No active employee-submission cycle</span>
              )}
            </div>
          </div>
          <div className="hidden sm:block sm:h-10 sm:w-px sm:shrink-0 sm:bg-slate-200 dark:sm:bg-slate-600" />
          <SelfAssessmentReviewCycleInfo variant="inline" />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/40">
            <p className="font-semibold text-slate-900 dark:text-white">
              {activeSubmissionCycle ? `${activeSubmissionCycle.name} (${activeSubmissionCycle.code})` : 'No active cycle'}
            </p>
            {activeSubmissionCycle ? (
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                {formatCycleDate(activeSubmissionCycle.startDate)} - {formatCycleDate(activeSubmissionCycle.endDate)}
              </p>
            ) : null}
          </div>

          <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/20">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Audience Type Selection
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Choose who should receive this self-assessment assignment. Forms are only created when a matching active
                  template exists for each employee.
                </p>
              </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-3">
              <AudienceCard
                value="DEPARTMENTS"
                selected={assignmentMode === 'DEPARTMENTS'}
                title="Specific Departments Only"
                description={['Select one or more departments', 'All positions in selected departments']}
                icon={<Building2 size={18} />}
                badge={createCountBadge(departmentAudienceCount)}
                onSelect={setAssignmentMode}
              />
              <AudienceCard
                value="POSITIONS"
                selected={assignmentMode === 'POSITIONS'}
                title="Specific Positions Only (Across All Departments)"
                description={['Select one or more job titles', 'Employees with these positions in ANY department']}
                icon={<BriefcaseBusiness size={18} />}
                badge={createCountBadge(positionAudienceCount)}
                onSelect={setAssignmentMode}
              />
              <AudienceCard
                value="HYBRID"
                selected={assignmentMode === 'HYBRID'}
                title="Hybrid (Departments + Specific Positions)"
                description={['Most flexible option', 'Select department AND specific positions within']}
                icon={<Layers3 size={18} />}
                badge={createCountBadge(hybridAudienceCount)}
                onSelect={setAssignmentMode}
              />
            </div>
          </section>

          {showDepartments && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-900/40">
              <SelectionPanelTitle>SELECT DEPARTMENTS</SelectionPanelTitle>
              <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-700">
                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                  {departments.map((department) => {
                    const empCount = employeeCountByDepartmentId.get(department.departmentId) ?? 0;
                    return (
                      <li key={department.departmentId}>
                        <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80">
                          <input
                            type="checkbox"
                            checked={departmentIds.includes(department.departmentId)}
                            onChange={() => setDepartmentIds((current) => toggleId(current, department.departmentId))}
                            className="h-4 w-4 shrink-0 rounded border-slate-300 text-[#5D5FEF] focus:ring-[#5D5FEF]"
                          />
                          <span className="min-w-0 flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                            {department.departmentName}
                          </span>
                          <span className="shrink-0 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-blue-900 dark:bg-sky-950/50 dark:text-sky-200">
                            {formatEmployeeCount(empCount)}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <BarChart3 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span>
                    Selected:{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {departmentIds.length} department{departmentIds.length === 1 ? '' : 's'}
                    </span>{' '}
                    /{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatEmployeeCount(departmentAudienceCount)}
                    </span>
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={selectAllDepartments}
                    className="rounded-lg border-2 border-[#5D5FEF] px-3 py-1.5 text-sm font-medium text-[#4F52D9] hover:bg-[#5D5FEF]/10 dark:border-[#7C7EF5] dark:text-[#A5A7FA]"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={clearDepartments}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            </div>
          )}

          {showPositions && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-900/40">
              <SelectionPanelTitle>SELECT POSITIONS (ACROSS ALL DEPARTMENTS)</SelectionPanelTitle>
              <div className="relative mb-3">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  type="search"
                  value={positionSearchQuery}
                  onChange={(e) => setPositionSearchQuery(e.target.value)}
                  placeholder="Search positions..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#5D5FEF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5D5FEF] dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
                />
              </div>
              <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-700">
                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredPositions.map((position) => {
                    const empCount = employeeCountByPositionId.get(position.positionId) ?? 0;
                    return (
                      <li key={position.positionId}>
                        <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80">
                          <input
                            type="checkbox"
                            checked={positionIds.includes(position.positionId)}
                            onChange={() => setPositionIds((current) => toggleId(current, position.positionId))}
                            className="h-4 w-4 shrink-0 rounded border-slate-300 text-[#5D5FEF] focus:ring-[#5D5FEF]"
                          />
                          <span className="min-w-0 flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                            {position.positionName}
                          </span>
                          {empCount > 0 ? (
                            <span className="shrink-0 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-blue-900 dark:bg-sky-950/50 dark:text-sky-200">
                              {formatEmployeeCount(empCount)}
                            </span>
                          ) : (
                            <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">0 employees</span>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
              {filteredPositions.length === 0 ? (
                <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">No positions match your search.</p>
              ) : null}
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <BarChart3 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span>
                    Selected:{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {positionIds.length} position{positionIds.length === 1 ? '' : 's'}
                    </span>{' '}
                    /{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatEmployeeCount(positionAudienceCount)}
                    </span>
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={selectAllFilteredPositions}
                    className="rounded-lg border-2 border-[#5D5FEF] px-3 py-1.5 text-sm font-medium text-[#4F52D9] hover:bg-[#5D5FEF]/10 dark:border-[#7C7EF5] dark:text-[#A5A7FA]"
                  >
                    Select all{positionSearchQuery.trim() ? ' visible' : ''}
                  </button>
                  <button
                    type="button"
                    onClick={clearPositions}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Employee Deadline</label>
              <input
                type="date"
                value={deadlineDate}
                min={cycleStart}
                max={cycleEnd}
                onChange={(event) => setDeadlineDate(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Manager Review</label>
              <input
                type="date"
                value={managerReviewDeadlineDate}
                min={managerReviewMinDate}
                max={cycleEnd}
                onChange={(event) => setManagerReviewDeadlineDate(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Final Approval</label>
              <input
                type="date"
                value={finalApprovalDeadlineDate}
                min={finalApprovalMinDate}
                max={cycleEnd}
                onChange={(event) => setFinalApprovalDeadlineDate(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
            Target: <span className="font-semibold text-slate-900 dark:text-white">{selectedSummary}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-slate-600 sm:flex-row sm:justify-end">
          <Link
            to="/hr/self-assessment/assignments"
            className="inline-flex justify-center rounded-lg border border-slate-300 px-4 py-2 text-center text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleAssign}
            disabled={isAssigning || !activeSubmissionCycle}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <CalendarCheck size={16} />
            {isAssigning ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
};
