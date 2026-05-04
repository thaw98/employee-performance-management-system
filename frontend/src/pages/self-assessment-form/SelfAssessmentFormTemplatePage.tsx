import React, { useState } from 'react';
import { Plus, X, CalendarRange, CalendarCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetTimeSettingsQuery } from '../../features/feedback/api/feedbackApi';
import { useGetActiveReviewCyclesQuery } from '../../features/reviewCycle/api/reviewCycleApi';
import { formatCycleDate, SelfAssessmentReviewCycleInfo } from './SelfAssessmentReviewCycleInfo';
import {
  useGetAllTemplatesQuery,
  useSetTemplateDeadlineMutation,
  type SelfAssessmentFormTemplateDto,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { ratingSystemLabels } from '../../features/selfAssessmentForm/ratingSystem';
import { toast } from 'react-hot-toast';

export const SelfAssessmentFormTemplatePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const isManager = user?.roleId === 2;
  const routeBase = isManager ? '/manager/self-assessment/templates' : '/hr/self-assessment/templates';
  const [deadlineTemplate, setDeadlineTemplate] = useState<SelfAssessmentFormTemplateDto | null>(null);
  const [deadlineTitle, setDeadlineTitle] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');

  const { data: allTemplates, refetch: refetchTemplates } = useGetAllTemplatesQuery();
  const { data: timeSettings, isLoading: timeSettingsLoading } = useGetTimeSettingsQuery();
  const { data: activeCycles = [] } = useGetActiveReviewCyclesQuery();

  const activeSubmissionCycle = activeCycles.find((c) => c.requiresEmployeeSubmission) ?? null;

  const displayDuration =
    timeSettings?.duration === 'Both' ? '6 Months & 1 Year (combined)' : timeSettings?.duration;

  const [setTemplateDeadline, { isLoading: isSettingDeadline }] = useSetTemplateDeadlineMutation();

  const handleOpenDeadline = (template: SelfAssessmentFormTemplateDto) => {
    setDeadlineTemplate(template);
    setDeadlineTitle(template.title || '');
    setDeadlineDate(activeSubmissionCycle?.endDate || '');
  };

  const handleCloseDeadline = () => {
    setDeadlineTemplate(null);
    setDeadlineTitle('');
    setDeadlineDate('');
  };

  const handleConfirmDeadline = async () => {
    if (!deadlineTemplate) return;
    if (!activeSubmissionCycle) {
      toast.error('No active employee-submission review cycle is available');
      return;
    }
    if (!deadlineTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!deadlineDate) {
      toast.error('Please select a deadline');
      return;
    }

    try {
      const result = await setTemplateDeadline({
        templateId: deadlineTemplate.id,
        request: {
          title: deadlineTitle.trim(),
          deadlineDate,
        },
      }).unwrap();
      toast.success(`Assigned ${result.createdCount} form${result.createdCount === 1 ? '' : 's'}; skipped ${result.skippedCount}.`);
      handleCloseDeadline();
      refetchTemplates();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to set deadline');
    }
  };

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

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            {allTemplates && allTemplates.length > 0 ? (
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
                  {allTemplates.map((template) => {
                    const wrongCycleForDeadline =
                      !!activeSubmissionCycle &&
                      template.reviewCycleId != null &&
                      template.reviewCycleId !== activeSubmissionCycle.id;
                    const setDeadlineDisabled =
                      template.isLocked || !template.isActive || !activeSubmissionCycle || wrongCycleForDeadline;
                    const setDeadlineTitle = !activeSubmissionCycle
                      ? 'No active submission cycle'
                      : wrongCycleForDeadline
                        ? 'Template belongs to a different review cycle than the active one'
                        : undefined;
                    return (
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
                          {template.isLocked ? (
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              Read-only
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-3">
                          {!isManager && (
                            <button
                              type="button"
                              onClick={() => handleOpenDeadline(template)}
                              disabled={setDeadlineDisabled}
                              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400 dark:text-blue-400 dark:hover:text-blue-300"
                              title={template.isLocked ? 'Template already has assigned forms' : setDeadlineTitle}
                            >
                              <CalendarCheck size={15} />
                              Set Deadline
                            </button>
                          )}
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
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400 px-4">
                No templates created yet
              </div>
            )}
          </div>
        </div>
      </div>

      {deadlineTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Set Deadline</h2>
              <button
                type="button"
                onClick={handleCloseDeadline}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                aria-label="Close deadline modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Department</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{deadlineTemplate.departmentName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Position</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{deadlineTemplate.positionName}</p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                <input
                  type="text"
                  value={deadlineTitle}
                  onChange={(event) => setDeadlineTitle(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  placeholder="Assigned form title"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Deadline</label>
                <input
                  type="date"
                  value={deadlineDate}
                  min={activeSubmissionCycle?.startDate}
                  max={activeSubmissionCycle?.endDate}
                  onChange={(event) => setDeadlineDate(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseDeadline}
                className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeadline}
                disabled={isSettingDeadline || !activeSubmissionCycle}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <CalendarCheck size={16} />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
