import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarRange, Eye, FileText } from 'lucide-react';
import { useGetActiveCycleFormsForHrQuery } from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';

function formatDate(iso?: string | null) {
  if (!iso) return '-';
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return iso;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export const SelfAssessmentActiveFormsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetActiveCycleFormsForHrQuery();
  const forms = data?.forms ?? [];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Assigned Self-Assessment Forms</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Active-cycle forms created from template deadlines
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-600 dark:bg-slate-800/50">
        <div className="flex items-start gap-2 text-sm">
          <CalendarRange className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          {data?.activeCycle ? (
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                {data.activeCycle.name} ({data.activeCycle.code})
              </p>
              <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                {formatDate(data.activeCycle.startDate)} - {formatDate(data.activeCycle.endDate)}
              </p>
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">
              {isError ? 'No active employee-submission review cycle is available.' : 'No active cycle found.'}
            </p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        {forms.length > 0 ? (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Title</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Employee</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Department</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Position</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Employee Deadline</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Manager Review</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Final Approval</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {forms.map((form) => (
                <tr key={form.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{form.title}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{form.employee.employeeName}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{form.employee.departmentName}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{form.employee.positionName}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(form.deadlineDate)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(form.managerReviewDeadlineDate)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(form.finalApprovalDeadlineDate)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      {form.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => navigate('/hr/self-assessment/reviews', { state: { formId: form.id } })}
                      className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                    >
                      <Eye size={15} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <FileText className="mx-auto mb-3 h-10 w-10 text-slate-400" />
            No assigned forms for the active cycle
          </div>
        )}
      </div>
    </div>
  );
};
