import React, { useMemo, useState } from 'react';
import { CalendarCheck, CalendarRange, Send, Users, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useGetDepartmentsQuery } from '../../features/department/api/departmentApi';
import { useGetPositionsQuery } from '../../features/position/api/positionApi';
import { useGetActiveReviewCyclesQuery } from '../../features/reviewCycle/api/reviewCycleApi';
import {
  useAssignSelfAssessmentFormsMutation,
  type SelfAssessmentAssignmentMode,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { formatCycleDate, SelfAssessmentReviewCycleInfo } from './SelfAssessmentReviewCycleInfo';

type AssignmentOption = {
  value: SelfAssessmentAssignmentMode;
  label: string;
  description: string;
};

const assignmentOptions: AssignmentOption[] = [
  { value: 'ALL_EMPLOYEES', label: 'All Employees', description: 'Eligible employees company-wide' },
  { value: 'DEPARTMENTS', label: 'Specific Departments', description: 'Eligible employees in selected departments' },
  { value: 'POSITIONS', label: 'Specific Positions', description: 'Eligible employees in selected positions' },
  { value: 'HYBRID', label: 'Hybrid', description: 'Employees matching selected departments and positions' },
];

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

function toggleId(values: number[], id: number) {
  return values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
}

export const SelfAssessmentAssignmentsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [assignmentMode, setAssignmentMode] = useState<SelfAssessmentAssignmentMode>('ALL_EMPLOYEES');
  const [departmentIds, setDepartmentIds] = useState<number[]>([]);
  const [positionIds, setPositionIds] = useState<number[]>([]);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [managerReviewDeadlineDate, setManagerReviewDeadlineDate] = useState('');
  const [finalApprovalDeadlineDate, setFinalApprovalDeadlineDate] = useState('');

  const { data: activeCycles = [] } = useGetActiveReviewCyclesQuery();
  const { data: departmentsResponse } = useGetDepartmentsQuery();
  const { data: positionsResponse } = useGetPositionsQuery({ page: 0, size: 500, status: 'Active' });
  const [assignForms, { isLoading: isAssigning }] = useAssignSelfAssessmentFormsMutation();

  const activeSubmissionCycle = activeCycles.find((cycle) => cycle.requiresEmployeeSubmission) ?? null;
  const departments = departmentsResponse?.data ?? [];
  const positions = positionsResponse?.data?.content ?? [];

  const selectedSummary = useMemo(() => {
    if (assignmentMode === 'ALL_EMPLOYEES') return 'All eligible employees';
    if (assignmentMode === 'DEPARTMENTS') return `${departmentIds.length} department${departmentIds.length === 1 ? '' : 's'}`;
    if (assignmentMode === 'POSITIONS') return `${positionIds.length} position${positionIds.length === 1 ? '' : 's'}`;
    return `${departmentIds.length} department${departmentIds.length === 1 ? '' : 's'} and ${positionIds.length} position${positionIds.length === 1 ? '' : 's'}`;
  }, [assignmentMode, departmentIds.length, positionIds.length]);

  const openModal = () => {
    setTitle('Self Assessment Form');
    setAssignmentMode('ALL_EMPLOYEES');
    setDepartmentIds([]);
    setPositionIds([]);
    setDeadlineDate(activeSubmissionCycle?.endDate ?? '');
    setManagerReviewDeadlineDate(activeSubmissionCycle?.endDate ?? '');
    setFinalApprovalDeadlineDate(activeSubmissionCycle?.endDate ?? '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!isAssigning) {
      setIsModalOpen(false);
    }
  };

  const validate = () => {
    if (!activeSubmissionCycle) return 'No active employee-submission review cycle is available';
    if (!title.trim()) return 'Please enter a title';
    if (assignmentMode === 'DEPARTMENTS' && departmentIds.length === 0) return 'Please select at least one department';
    if (assignmentMode === 'POSITIONS' && positionIds.length === 0) return 'Please select at least one position';
    if (assignmentMode === 'HYBRID' && (departmentIds.length === 0 || positionIds.length === 0)) {
      return 'Please select at least one department and one position';
    }
    if (!deadlineDate || !managerReviewDeadlineDate || !finalApprovalDeadlineDate) return 'Please select all deadlines';
    if (deadlineDate > managerReviewDeadlineDate || managerReviewDeadlineDate > finalApprovalDeadlineDate) {
      return 'Deadlines must be ordered from employee, manager review, then final approval';
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
        title: title.trim(),
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
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to assign self-assessment forms');
    }
  };

  const showDepartments = assignmentMode === 'DEPARTMENTS' || assignmentMode === 'HYBRID';
  const showPositions = assignmentMode === 'POSITIONS' || assignmentMode === 'HYBRID';

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Self-Assessment Assignments</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Assign active-cycle forms in bulk from matching department and position templates
          </p>
        </div>
        <button
          type="button"
          onClick={openModal}
          disabled={!activeSubmissionCycle}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={16} />
          Assign Forms
        </button>
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
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatDate(activeSubmissionCycle.startDate)} - {formatDate(activeSubmissionCycle.endDate)}
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

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Bulk Assignment Rules</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
              Employees are assigned only when they are active, non-probation, have an active user account, and have a matching active template for the current cycle.
              Existing active-cycle forms are skipped.
            </p>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Assign Self-Assessment Forms</h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                aria-label="Close assignment modal"
              >
                <X size={18} />
              </button>
            </div>

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

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  placeholder="Assigned form title"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Assignment Mode</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {assignmentOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setAssignmentMode(option.value)}
                      className={`rounded-lg border p-3 text-left transition ${
                        assignmentMode === option.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-100'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{option.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {showDepartments && (
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Departments</p>
                  <div className="grid max-h-44 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-700 sm:grid-cols-2">
                    {departments.map((department) => (
                      <label key={department.departmentId} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={departmentIds.includes(department.departmentId)}
                          onChange={() => setDepartmentIds((current) => toggleId(current, department.departmentId))}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{department.departmentName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {showPositions && (
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Positions</p>
                  <div className="grid max-h-44 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-700 sm:grid-cols-2">
                    {positions.map((position) => (
                      <label key={position.positionId} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={positionIds.includes(position.positionId)}
                          onChange={() => setPositionIds((current) => toggleId(current, position.positionId))}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{position.positionName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Employee Deadline</label>
                  <input
                    type="date"
                    value={deadlineDate}
                    min={activeSubmissionCycle?.startDate}
                    max={activeSubmissionCycle?.endDate}
                    onChange={(event) => setDeadlineDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Manager Review</label>
                  <input
                    type="date"
                    value={managerReviewDeadlineDate}
                    min={activeSubmissionCycle?.startDate}
                    max={activeSubmissionCycle?.endDate}
                    onChange={(event) => setManagerReviewDeadlineDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Final Approval</label>
                  <input
                    type="date"
                    value={finalApprovalDeadlineDate}
                    min={activeSubmissionCycle?.startDate}
                    max={activeSubmissionCycle?.endDate}
                    onChange={(event) => setFinalApprovalDeadlineDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                Target: <span className="font-semibold text-slate-900 dark:text-white">{selectedSummary}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssign}
                disabled={isAssigning || !activeSubmissionCycle}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <CalendarCheck size={16} />
                {isAssigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
