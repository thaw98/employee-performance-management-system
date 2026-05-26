import React, { useMemo } from 'react';
import { ArrowLeft, CalendarRange, ChevronDown, Eye, FileText, Users } from 'lucide-react';
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
  if (status.toUpperCase() === 'RETURNED_BY_HR') {
    return 'Returned by HR';
  }
  return status
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

/** Tailwind classes aligned with SelfAssessmentActiveFormsPage status chips. */
function formStatusBadgeClasses(status: string): { pill: string; dot: string } {
  const s = status.toUpperCase();
  if (s === 'NOT_SUBMITTED' || s === 'NOT_STARTED') {
    return {
      pill: 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300',
      dot: 'bg-slate-400',
    };
  }
  if (s === 'DRAFT') {
    return {
      pill: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      dot: 'bg-amber-500',
    };
  }
  if (s === 'SUBMITTED' || s === 'EMPLOYEE_SUBMITTED') {
    return {
      pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      dot: 'bg-blue-500',
    };
  }
  if (s === 'MANAGER_REVIEW' || s === 'IN_MANAGER_REVIEW' || s === 'PENDING_MANAGER_REVIEW') {
    return {
      pill: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      dot: 'bg-indigo-500',
    };
  }
  if (s === 'MANAGER_COMPLETED' || s === 'MANAGER_APPROVED' || s === 'MANAGER_REVIEWED') {
    return {
      pill: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      dot: 'bg-purple-500',
    };
  }
  if (s === 'PENDING_EMPLOYEE_REVIEW') {
    return {
      pill: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
      dot: 'bg-sky-500',
    };
  }
  if (s === 'PENDING_FINAL_APPROVAL') {
    return {
      pill: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
      dot: 'bg-violet-500',
    };
  }
  if (s === 'RETURNED_BY_HR') {
    return {
      pill: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
      dot: 'bg-rose-500',
    };
  }
  if (
    s === 'HR_REVIEW' ||
    s === 'PENDING_HR_REVIEW' ||
    s === 'IN_HR_REVIEW' ||
    s === 'PENDING_HR_CALIBRATION_REVIEW'
  ) {
    return {
      pill: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      dot: 'bg-orange-500',
    };
  }
  if (s === 'HR_APPROVED' || s === 'APPROVED' || s === 'COMPLETED') {
    return {
      pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      dot: 'bg-emerald-500',
    };
  }
  if (s === 'FINALIZED_LOCKED') {
    return {
      pill: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
      dot: 'bg-teal-500',
    };
  }
  if (s === 'REJECTED') {
    return {
      pill: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      dot: 'bg-red-500',
    };
  }
  if (s === 'REOPENED') {
    return {
      pill: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
      dot: 'bg-cyan-500',
    };
  }
  return {
    pill: 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300',
    dot: 'bg-slate-400',
  };
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
      <nav className="mb-2 flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500">
        <span className="text-[#2463eb] dark:text-[#60a5fa] font-medium">Home</span>
        <ChevronDown size={12} className="-rotate-90 opacity-50" />
        <span>Self Assessment</span>
        <ChevronDown size={12} className="-rotate-90 opacity-50" />
        <Link to="/hr/self-assessment/assignments" className="font-medium text-slate-500 hover:text-[#2463eb] dark:text-slate-400">
          Assignments
        </Link>
        <ChevronDown size={12} className="-rotate-90 opacity-50" />
        <span className="font-semibold text-slate-700 dark:text-slate-200">Assigned Employees</span>
      </nav>

      <div className="mb-6">
        <Link
          to="/hr/self-assessment/assignments"
          className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Back to Assignments
        </Link>
      </div>

      {hasError ? (
        <div className="rounded-2xl border border-red-100 bg-white px-6 py-16 text-center shadow-sm dark:border-red-900/40 dark:bg-slate-800">
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100">Unable to load assigned employees</p>
          <p className="mt-1 text-base text-slate-500 dark:text-slate-400">Try refreshing the page.</p>
        </div>
      ) : !template ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100">Template not found</p>
          <p className="mt-1 text-base text-slate-500 dark:text-slate-400">The selected self-assessment template is no longer available.</p>
        </div>
      ) : (
        <>
          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
            <div className="relative px-6 py-5">
              <div className="absolute inset-0 bg-gradient-to-r from-[#2463eb]/[0.04] via-transparent to-[#2463eb]/[0.03] dark:from-[#2463eb]/[0.07]" />
              <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] shadow-lg shadow-[#2463eb]/25">
                    <Users size={26} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      Assigned Employees
                    </h1>
                    <p className="mt-1 text-base font-medium text-slate-600 dark:text-slate-300">{template.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      {template.departmentName} / {template.positionName}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-base sm:min-w-80">
                  <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900/40">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Employees</p>
                    <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{assignedForms.length}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900/40">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Cycle</p>
                    <p className="mt-2 truncate text-base font-bold text-slate-900 dark:text-white">
                      {activeCycleForms?.activeCycle?.name ?? template.reviewCycleName ?? '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-700/60">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb]/10 to-[#1d4ed8]/5 dark:from-[#2463eb]/20 dark:to-[#1d4ed8]/10">
                <FileText size={20} className="text-[#2463eb] dark:text-[#60a5fa]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Current-Cycle Forms</h2>
                <p className="text-sm text-slate-400 dark:text-slate-500">Employees assigned through this template</p>
              </div>
            </div>

            {assignedForms.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <CalendarRange size={40} className="mx-auto text-slate-300 dark:text-slate-500" />
                <p className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-100">No current-cycle employees found</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  This template is marked assigned, but no matching form rows were returned for this department and position.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-widest text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5 text-left">Employee</th>
                      <th className="px-4 py-3.5 text-left">Staff No.</th>
                      <th className="px-4 py-3.5 text-left">Department</th>
                      <th className="px-4 py-3.5 text-left">Position</th>
                      <th className="px-4 py-3.5 text-left">Assigned date</th>
                      <th className="px-4 py-3.5 text-left">Start date</th>
                      <th className="px-4 py-3.5 text-left">Employee deadline</th>
                      <th className="px-4 py-3.5 text-left">Manager review deadline</th>
                      <th className="px-4 py-3.5 text-left">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {assignedForms.map((form) => {
                      const statusBadge = formStatusBadgeClasses(form.status);
                      return (
                        <tr key={form.id} className="text-slate-600 dark:text-slate-300">
                          <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
                            {form.employee.employeeName || '-'}
                          </td>
                          <td className="px-4 py-3.5 tabular-nums">{form.employee.employeeId || '-'}</td>
                          <td className="px-4 py-3.5">{form.employee.departmentName || '-'}</td>
                          <td className="px-4 py-3.5">{form.employee.positionName || '-'}</td>
                          <td className="px-4 py-3.5">{formatAssignedDate(form.assignedAt)}</td>
                          <td className="px-4 py-3.5">{formatDate(form.startDate)}</td>
                          <td className="px-4 py-3.5">{formatDate(form.deadlineDate)}</td>
                          <td className="px-4 py-3.5">{formatDate(form.managerReviewDeadlineDate)}</td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge.pill}`}
                            >
                              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusBadge.dot}`} />
                              {formatStatus(form.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <Link
                              to={`/hr/self-assessment/reviews/${form.id}`}
                              className="group/btn inline-flex items-center gap-1.5 rounded-xl bg-[#2463eb]/[0.06] px-3.5 py-2 text-xs font-semibold text-[#2463eb] transition-all hover:bg-[#2463eb]/[0.12] dark:bg-[#2463eb]/10 dark:text-[#60a5fa] dark:hover:bg-[#2463eb]/20"
                            >
                              <Eye size={13} />
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
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
