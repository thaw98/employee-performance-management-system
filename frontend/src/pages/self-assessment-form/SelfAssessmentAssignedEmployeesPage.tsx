import React, { useMemo } from 'react';
import { ArrowLeft, CalendarRange, ChevronDown, FileText, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import {
  useGetActiveCycleFormsForHrQuery,
  useGetAllTemplatesQuery,
  type FormListDto,
  type SelfAssessmentFormTemplateDto,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';

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

function formatAssignedDate(iso?: string | null) {
  if (!iso) return '-';
  return formatDate(iso.split('T')[0]);
}

function formatStatus(status: string) {
  return status
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function employeeLabel(form: FormListDto) {
  const name = form.employee.employeeName || form.employee.employeeId || '-';
  return form.employee.employeeName && form.employee.employeeId ? `${name} (${form.employee.employeeId})` : name;
}

function formMatchesTemplate(form: FormListDto, template: SelfAssessmentFormTemplateDto) {
  const employee = form.employee;
  const departmentMatches =
    employee.departmentId === template.departmentId ||
    (!employee.departmentId && employee.departmentName === template.departmentName);
  const positionMatches =
    employee.positionId === template.positionId ||
    (!employee.positionId && employee.positionName === template.positionName);

  return form.templateId === template.id && departmentMatches && positionMatches;
}

export const SelfAssessmentAssignedEmployeesPage: React.FC = () => {
  const { templateId: templateIdParam } = useParams<{ templateId: string }>();
  const templateId = Number(templateIdParam);
  const {
    data: allTemplates = [],
    isLoading: templatesLoading,
    isError: templatesError,
  } = useGetAllTemplatesQuery();
  const {
    data: activeCycleForms,
    isLoading: formsLoading,
    isError: formsError,
  } = useGetActiveCycleFormsForHrQuery();

  const template = useMemo(
    () => allTemplates.find((item) => item.id === templateId) ?? null,
    [allTemplates, templateId]
  );

  const assignedForms = useMemo(() => {
    if (!template) return [];
    return (activeCycleForms?.forms ?? []).filter((form) => formMatchesTemplate(form, template));
  }, [activeCycleForms?.forms, template]);

  const isLoading = templatesLoading || formsLoading;
  const hasError = templatesError || formsError || !Number.isFinite(templateId);

  if (isLoading) {
    return (
      <div className="min-h-screen px-6 py-6 md:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-80 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-6 md:px-8 animate-fade-in">
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <span className="text-[#5D5FEF] dark:text-[#8b8ef7] font-medium">Home</span>
        <ChevronDown size={10} className="-rotate-90 opacity-50" />
        <span>Self Assessment</span>
        <ChevronDown size={10} className="-rotate-90 opacity-50" />
        <Link to="/hr/self-assessment/assignments" className="font-medium text-slate-500 hover:text-[#5D5FEF] dark:text-slate-400">
          Assignments
        </Link>
        <ChevronDown size={10} className="-rotate-90 opacity-50" />
        <span className="font-semibold text-slate-700 dark:text-slate-200">Assigned Employees</span>
      </nav>

      <div className="mb-6">
        <Link
          to="/hr/self-assessment/assignments"
          className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Back to Assignments
        </Link>
      </div>

      {hasError ? (
        <div className="rounded-2xl border border-red-100 bg-white px-6 py-16 text-center shadow-sm dark:border-red-900/40 dark:bg-slate-800">
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">Unable to load assigned employees</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try refreshing the page.</p>
        </div>
      ) : !template ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">Template not found</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The selected self-assessment template is no longer available.</p>
        </div>
      ) : (
        <>
          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
            <div className="relative px-6 py-5">
              <div className="absolute inset-0 bg-gradient-to-r from-[#5D5FEF]/[0.04] via-transparent to-[#5D5FEF]/[0.03] dark:from-[#5D5FEF]/[0.07]" />
              <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/25">
                    <Users size={22} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      Assigned Employees
                    </h1>
                    <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">{template.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {template.departmentName} / {template.positionName}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-80">
                  <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900/40">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Employees</p>
                    <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">{assignedForms.length}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900/40">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Cycle</p>
                    <p className="mt-2 truncate text-sm font-bold text-slate-900 dark:text-white">
                      {activeCycleForms?.activeCycle?.name ?? template.reviewCycleName ?? '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-700/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-violet-800/20">
                <FileText size={18} className="text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Current-Cycle Forms</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">Employees assigned through this template</p>
              </div>
            </div>

            {assignedForms.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <CalendarRange size={36} className="mx-auto text-slate-300 dark:text-slate-500" />
                <p className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">No current-cycle employees found</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  This template is marked assigned, but no matching form rows were returned for this department and position.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Employee</th>
                      <th className="px-4 py-3 text-left">Department</th>
                      <th className="px-4 py-3 text-left">Position</th>
                      <th className="px-4 py-3 text-left">Assigned date</th>
                      <th className="px-4 py-3 text-left">Start date</th>
                      <th className="px-4 py-3 text-left">Employee deadline</th>
                      <th className="px-4 py-3 text-left">Manager review deadline</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {assignedForms.map((form) => (
                      <tr key={form.id} className="text-slate-600 dark:text-slate-300">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{employeeLabel(form)}</td>
                        <td className="px-4 py-3">{form.employee.departmentName || '-'}</td>
                        <td className="px-4 py-3">{form.employee.positionName || '-'}</td>
                        <td className="px-4 py-3">{formatAssignedDate(form.assignedAt)}</td>
                        <td className="px-4 py-3">{formatDate(form.startDate)}</td>
                        <td className="px-4 py-3">{formatDate(form.deadlineDate)}</td>
                        <td className="px-4 py-3">{formatDate(form.managerReviewDeadlineDate)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {formatStatus(form.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
