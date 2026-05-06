import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CalendarRange,
  ChevronDown,
  Clock,
  Layers3,
  Search,
  Send,
  Target,
  Users,
  Sparkles,
  CheckCircle2,
  AlertCircle,
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

function StepIndicator({ step, label, active }: { step: number; label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
          active
            ? 'bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] text-white shadow-md shadow-[#5D5FEF]/25'
            : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
        }`}
      >
        {step}
      </div>
      <span
        className={`text-xs font-bold uppercase tracking-wider transition-colors ${
          active ? 'text-[#5D5FEF] dark:text-[#8b8ef7]' : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        {label}
      </span>
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
  const managerReviewMinDate = deadlineDate || cycleStart;
  const finalApprovalMinDate = managerReviewDeadlineDate || cycleStart;

  const currentAudienceCount = useMemo(() => {
    if (assignmentMode === 'DEPARTMENTS') return departmentAudienceCount;
    if (assignmentMode === 'POSITIONS') return positionAudienceCount;
    if (assignmentMode === 'HYBRID') return hybridAudienceCount;
    return activeEmployees.length;
  }, [assignmentMode, departmentAudienceCount, positionAudienceCount, hybridAudienceCount, activeEmployees.length]);

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

  const summaryCards = [
    {
      label: 'Active Employees',
      value: activeEmployees.length,
      icon: Users,
      lightBg: 'bg-sky-50 dark:bg-sky-950/30',
      lightIcon: 'text-sky-600 dark:text-sky-400',
      ring: 'ring-sky-500/20',
      bgGlow: 'bg-sky-500/10',
    },
    {
      label: 'Departments',
      value: departments.length,
      icon: Building2,
      lightBg: 'bg-violet-50 dark:bg-violet-950/30',
      lightIcon: 'text-violet-600 dark:text-violet-400',
      ring: 'ring-violet-500/20',
      bgGlow: 'bg-violet-500/10',
    },
    {
      label: 'Positions',
      value: positions.length,
      icon: BriefcaseBusiness,
      lightBg: 'bg-amber-50 dark:bg-amber-950/30',
      lightIcon: 'text-amber-600 dark:text-amber-400',
      ring: 'ring-amber-500/20',
      bgGlow: 'bg-amber-500/10',
    },
    {
      label: 'Target Audience',
      value: currentAudienceCount,
      icon: Target,
      lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      lightIcon: 'text-emerald-600 dark:text-emerald-400',
      ring: 'ring-emerald-500/20',
      bgGlow: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="min-h-screen px-6 py-6 md:px-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <Link to="/hr/self-assessment/assignments" className="text-[#5D5FEF] dark:text-[#8b8ef7] font-medium hover:underline">
          Assignments
        </Link>
        <ChevronDown size={10} className="-rotate-90 opacity-50" />
        <span className="font-semibold text-slate-700 dark:text-slate-200">Assign Forms</span>
      </nav>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/25">
              <Send size={22} className="text-white" />
            </div>
            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-[9px] font-bold text-white shadow-sm">
              <Sparkles size={9} />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Assign Self-Assessment Forms
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 max-w-lg">
              Select your audience, configure deadlines, and distribute forms for the active review cycle
            </p>
          </div>
        </div>
        <Link
          to="/hr/self-assessment/assignments"
          className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Back to Assignments
        </Link>
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
                    {formatCycleDate(activeSubmissionCycle.startDate)} — {formatCycleDate(activeSubmissionCycle.endDate)}
                  </p>
                )}
              </div>
            </div>
            <div className="hidden sm:block sm:h-8 sm:w-px sm:shrink-0 sm:bg-gradient-to-b sm:from-transparent sm:via-slate-200 sm:to-transparent dark:sm:via-slate-700" />
            <SelfAssessmentReviewCycleInfo variant="inline" />
          </div>
        </div>
      </div>

      {/* Main Assignment Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        {/* Card Header */}
        <div className="relative border-b border-slate-100 px-6 py-5 dark:border-slate-700/60">
          <div className="absolute inset-0 bg-gradient-to-r from-[#5D5FEF]/[0.02] via-transparent to-[#5D5FEF]/[0.02] dark:from-[#5D5FEF]/[0.04] dark:via-transparent dark:to-[#5D5FEF]/[0.04]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-violet-800/20">
                <Send size={18} className="text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Assignment Configuration</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Define your audience and set deadlines for form distribution
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <StepIndicator step={1} label="Audience" active />
              <div className="h-px w-4 bg-slate-200 dark:bg-slate-700" />
              <StepIndicator step={2} label="Selection" active={showDepartments || showPositions} />
              <div className="h-px w-4 bg-slate-200 dark:bg-slate-700" />
              <StepIndicator step={3} label="Deadlines" active />
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Audience Type */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-md shadow-[#5D5FEF]/20">
                <Users size={14} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Choose Audience Type</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Select who should receive this self-assessment</p>
              </div>
            </div>
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
              <AudienceCard
                value="DEPARTMENTS"
                selected={assignmentMode === 'DEPARTMENTS'}
                title="Specific Departments"
                description={['All positions in selected departments', 'Best for department-wide reviews']}
                icon={<Building2 size={18} />}
                badge={createCountBadge(departmentAudienceCount)}
                onSelect={setAssignmentMode}
              />
              <AudienceCard
                value="POSITIONS"
                selected={assignmentMode === 'POSITIONS'}
                title="Specific Positions"
                description={['Across all departments', 'Role-based assessments']}
                icon={<BriefcaseBusiness size={18} />}
                badge={createCountBadge(positionAudienceCount)}
                onSelect={setAssignmentMode}
              />
              <AudienceCard
                value="HYBRID"
                selected={assignmentMode === 'HYBRID'}
                title="Hybrid Selection"
                description={['Departments + specific positions', 'Most flexible option']}
                icon={<Layers3 size={18} />}
                badge={createCountBadge(hybridAudienceCount)}
                onSelect={setAssignmentMode}
              />
            </div>
          </section>

          {/* Step 2: Selection Panels */}
          {showDepartments && (
            <section className="animate-fade-in-up">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-violet-800/20">
                    <Building2 size={14} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Select Departments</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Choose departments to include in this assignment
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllDepartments}
                    className="rounded-lg bg-[#5D5FEF]/[0.06] px-3 py-1.5 text-xs font-bold text-[#5D5FEF] transition-all hover:bg-[#5D5FEF]/[0.12] dark:bg-[#5D5FEF]/10 dark:text-[#8b8ef7] dark:hover:bg-[#5D5FEF]/20"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={clearDepartments}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="max-h-56 overflow-y-auto">
                  <ul className="divide-y divide-slate-100/80 dark:divide-slate-700/40">
                    {departments.map((department) => {
                      const empCount = employeeCountByDepartmentId.get(department.departmentId) ?? 0;
                      const isSelected = departmentIds.includes(department.departmentId);
                      return (
                        <li key={department.departmentId}>
                          <label
                            className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-all duration-200 ${
                              isSelected
                                ? 'bg-[#5D5FEF]/[0.04] dark:bg-[#5D5FEF]/[0.06]'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
                                isSelected
                                  ? 'border-[#5D5FEF] bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-sm shadow-[#5D5FEF]/20'
                                  : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
                              }`}
                            >
                              {isSelected && (
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => setDepartmentIds((current) => toggleId(current, department.departmentId))}
                              className="sr-only"
                            />
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-900/20 dark:to-sky-800/10">
                              <Building2 size={14} className="text-sky-600 dark:text-sky-400" />
                            </div>
                            <span className="min-w-0 flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {department.departmentName}
                            </span>
                            <span className="shrink-0 rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                              {formatEmployeeCount(empCount)}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Selected{' '}
                  <span className="font-bold text-slate-900 dark:text-white">{departmentIds.length}</span>{' '}
                  of {departments.length} departments —{' '}
                  <span className="font-bold text-[#5D5FEF] dark:text-[#8b8ef7]">
                    {formatEmployeeCount(departmentAudienceCount)}
                  </span>
                </span>
              </div>
            </section>
          )}

          {showPositions && (
            <section className="animate-fade-in-up">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20">
                    <BriefcaseBusiness size={14} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Select Positions</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Choose positions across all departments
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllFilteredPositions}
                    className="rounded-lg bg-[#5D5FEF]/[0.06] px-3 py-1.5 text-xs font-bold text-[#5D5FEF] transition-all hover:bg-[#5D5FEF]/[0.12] dark:bg-[#5D5FEF]/10 dark:text-[#8b8ef7] dark:hover:bg-[#5D5FEF]/20"
                  >
                    Select all{positionSearchQuery.trim() ? ' visible' : ''}
                  </button>
                  <button
                    type="button"
                    onClick={clearPositions}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="relative mb-3">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  type="search"
                  value={positionSearchQuery}
                  onChange={(e) => setPositionSearchQuery(e.target.value)}
                  placeholder="Search positions..."
                  className="w-full rounded-xl border border-slate-200/80 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#5D5FEF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800 dark:focus:border-[#5D5FEF]"
                />
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="max-h-56 overflow-y-auto">
                  {filteredPositions.length > 0 ? (
                    <ul className="divide-y divide-slate-100/80 dark:divide-slate-700/40">
                      {filteredPositions.map((position) => {
                        const empCount = employeeCountByPositionId.get(position.positionId) ?? 0;
                        const isSelected = positionIds.includes(position.positionId);
                        return (
                          <li key={position.positionId}>
                            <label
                              className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-all duration-200 ${
                                isSelected
                                  ? 'bg-[#5D5FEF]/[0.04] dark:bg-[#5D5FEF]/[0.06]'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <div
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
                                  isSelected
                                    ? 'border-[#5D5FEF] bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-sm shadow-[#5D5FEF]/20'
                                    : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
                                }`}
                              >
                                {isSelected && (
                                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => setPositionIds((current) => toggleId(current, position.positionId))}
                                className="sr-only"
                              />
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10">
                                <BriefcaseBusiness size={14} className="text-amber-600 dark:text-amber-400" />
                              </div>
                              <span className="min-w-0 flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {position.positionName}
                              </span>
                              {empCount > 0 ? (
                                <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                  {formatEmployeeCount(empCount)}
                                </span>
                              ) : (
                                <span className="shrink-0 text-[11px] font-medium text-slate-400 dark:text-slate-500">0 employees</span>
                              )}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700/60">
                        <Search size={20} className="text-slate-300 dark:text-slate-500" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No positions match your search</p>
                      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Try adjusting your search query</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Selected{' '}
                  <span className="font-bold text-slate-900 dark:text-white">{positionIds.length}</span>{' '}
                  of {positions.length} positions —{' '}
                  <span className="font-bold text-[#5D5FEF] dark:text-[#8b8ef7]">
                    {formatEmployeeCount(positionAudienceCount)}
                  </span>
                </span>
              </div>
            </section>
          )}

          {/* Step 3: Deadline Configuration */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/20">
                <Clock size={14} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Configure Deadlines</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Set milestone dates for each stage of the review process
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700/60 dark:from-slate-800 dark:to-slate-800/50">
                <div className="absolute -right-3 -top-3 h-12 w-12 rounded-full bg-sky-500/5 blur-xl dark:bg-sky-500/10" />
                <div className="relative">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-100 dark:bg-sky-900/30">
                      <Users size={11} className="text-sky-600 dark:text-sky-400" />
                    </div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Employee Deadline
                    </label>
                  </div>
                  <input
                    type="date"
                    value={deadlineDate}
                    min={cycleStart}
                    max={cycleEnd}
                    onChange={(event) => setDeadlineDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition-all focus:border-[#5D5FEF] focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-[#5D5FEF]"
                  />
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700/60 dark:from-slate-800 dark:to-slate-800/50">
                <div className="absolute -right-3 -top-3 h-12 w-12 rounded-full bg-violet-500/5 blur-xl dark:bg-violet-500/10" />
                <div className="relative">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-900/30">
                      <BarChart3 size={11} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Manager Review
                    </label>
                  </div>
                  <input
                    type="date"
                    value={managerReviewDeadlineDate}
                    min={managerReviewMinDate}
                    max={cycleEnd}
                    onChange={(event) => setManagerReviewDeadlineDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition-all focus:border-[#5D5FEF] focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-[#5D5FEF]"
                  />
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700/60 dark:from-slate-800 dark:to-slate-800/50">
                <div className="absolute -right-3 -top-3 h-12 w-12 rounded-full bg-emerald-500/5 blur-xl dark:bg-emerald-500/10" />
                <div className="relative">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                      <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Final Approval
                    </label>
                  </div>
                  <input
                    type="date"
                    value={finalApprovalDeadlineDate}
                    min={finalApprovalMinDate}
                    max={cycleEnd}
                    onChange={(event) => setFinalApprovalDeadlineDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition-all focus:border-[#5D5FEF] focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-[#5D5FEF]"
                  />
                </div>
              </div>
            </div>

            {!activeSubmissionCycle && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-2.5 dark:border-amber-800/40 dark:bg-amber-900/10">
                <AlertCircle size={14} className="shrink-0 text-amber-500 dark:text-amber-400" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  No active employee-submission review cycle found. Create one before assigning forms.
                </span>
              </div>
            )}
          </section>

          {/* Target Summary */}
          <div className="relative overflow-hidden rounded-xl border border-slate-200/60 bg-gradient-to-r from-[#5D5FEF]/[0.04] via-white to-[#5D5FEF]/[0.04] px-5 py-4 dark:border-slate-700/60 dark:from-[#5D5FEF]/[0.06] dark:via-slate-800 dark:to-[#5D5FEF]/[0.06]">
            <div className="absolute -left-2 -top-2 h-16 w-16 rounded-full bg-[#5D5FEF]/[0.06] blur-2xl dark:bg-[#5D5FEF]/[0.10]" />
            <div className="absolute -bottom-2 -right-2 h-16 w-16 rounded-full bg-[#5D5FEF]/[0.06] blur-2xl dark:bg-[#5D5FEF]/[0.10]" />
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-md shadow-[#5D5FEF]/20">
                  <Target size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Assignment Target
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedSummary}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Estimated reach:</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#5D5FEF]/10 to-[#7C7EF5]/10 px-3 py-1 text-sm font-extrabold text-[#5D5FEF] dark:from-[#5D5FEF]/20 dark:to-[#7C7EF5]/20 dark:text-[#8b8ef7]">
                  <Users size={13} />
                  {formatEmployeeCount(currentAudienceCount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="relative border-t border-slate-100 px-6 py-5 dark:border-slate-700/60">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50 dark:from-slate-800/50 dark:via-slate-800 dark:to-slate-800/50" />
          <div className="relative flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Forms will only be created for employees with matching active templates
            </p>
            <div className="flex items-center gap-3">
              <Link
                to="/hr/self-assessment/assignments"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleAssign}
                disabled={isAssigning || !activeSubmissionCycle}
                className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#5D5FEF] to-[#7C7EF5] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#5D5FEF]/25 transition-all hover:shadow-xl hover:shadow-[#5D5FEF]/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
              >
                <CalendarCheck size={16} />
                {isAssigning ? 'Assigning...' : 'Assign Forms'}
                {!isAssigning && (
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
