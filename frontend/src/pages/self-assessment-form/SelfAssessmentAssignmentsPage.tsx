import React, { useMemo } from 'react';
import { CalendarRange, ChevronRight, ClipboardList, Send } from 'lucide-react';
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

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Self-Assessment Assignments</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review templates for the active cycle, then assign forms on a dedicated page
          </p>
        </div>
        {activeSubmissionCycle ? (
          <Link
            to="/hr/self-assessment/assign-forms"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
          >
            <Send size={16} aria-hidden />
            Assign Self-Assessment Forms
          </Link>
        ) : (
          <span
            className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white opacity-50"
            title="No active employee-submission review cycle"
          >
            <Send size={16} aria-hidden />
            Assign Self-Assessment Forms
          </span>
        )}
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

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200">
              <ClipboardList size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Existing templates for this cycle</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
                Active templates created for the current employee-submission review cycle. Bulk assignment only creates forms
                where a matching department and position template exists for this cycle (legacy templates without a cycle are
                handled separately on the server).
              </p>
            </div>
          </div>
          <Link
            to="/hr/self-assessment/templates"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Manage templates
            <ChevronRight size={16} aria-hidden />
          </Link>
        </div>

        {!activeSubmissionCycle ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            No active employee-submission review cycle. Templates for this page are listed once a cycle is active.
          </p>
        ) : templatesLoading ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading templates…</p>
        ) : templatesError ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">Could not load templates. Try refreshing the page.</p>
        ) : existingTemplatesForActiveCycle.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            No active templates are linked to{' '}
            <span className="font-medium text-slate-900 dark:text-white">{activeSubmissionCycle.name}</span>. Create a template
            for this cycle under{' '}
            <Link to="/hr/self-assessment/templates/create" className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
              Create template
            </Link>
            , selecting this review cycle.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Template</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Questions</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {existingTemplatesForActiveCycle.map((template) => (
                  <tr key={template.id} className="text-slate-700 dark:text-slate-200">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{template.title}</td>
                    <td className="px-4 py-3">{template.departmentName}</td>
                    <td className="px-4 py-3">{template.positionName}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-400">{template.questions.length}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/hr/self-assessment/templates/${template.id}/edit`}
                        className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Send size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Bulk assignment rules</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
              Employees are assigned only when they are active, non-probation, have an active user account, and have a matching
              active template for the current cycle. Existing active-cycle forms are skipped. Use{' '}
              <Link to="/hr/self-assessment/assign-forms" className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
                Assign Self-Assessment Forms
              </Link>{' '}
              to run an assignment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
