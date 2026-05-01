import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Save, X, CalendarRange } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetDepartmentsQuery } from '../../features/department/api/departmentApi';
import { useGetPositionsByDepartmentQuery } from '../../features/position/api/positionApi';
import { useGetTimeSettingsQuery } from '../../features/feedback/api/feedbackApi';
import { useGetActiveReviewCyclesQuery, useGetReviewCyclesQuery } from '../../features/reviewCycle/api/reviewCycleApi';
import {
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useGetAllTemplatesQuery,
  useGetTemplateByIdQuery,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { toast } from 'react-hot-toast';

interface QuestionFormData {
  title: string;
  questions: { questionText: string }[];
}

function formatCycleDate(iso: string) {
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return iso;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function cycleTypeLabel(type: string) {
  const t = type.replace(/_/g, ' ').toLowerCase();
  return t.replace(/\b\w/g, (c) => c.toUpperCase());
}

function cycleStatusLabel(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === 'ACTIVE') return 'Active';
  if (normalized === 'UPCOMING') return 'Upcoming';
  if (normalized === 'CLOSED') return 'Closed';
  return cycleTypeLabel(status);
}

function cycleStatusClass(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === 'ACTIVE') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
  }
  if (normalized === 'UPCOMING') {
    return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300';
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
}

export const SelfAssessmentFormTemplatePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);

  const { data: departmentsResponse } = useGetDepartmentsQuery();
  const departments = departmentsResponse?.data || [];

  const { data: positionsResponse } = useGetPositionsByDepartmentQuery(selectedDepartmentId!, {
    skip: !selectedDepartmentId,
  });
  const positions = (positionsResponse?.data || []).map((pos: any) => ({
    id: pos.id ?? pos.positionId,
    name: pos.name ?? pos.positionName,
  }));

  const { data: allTemplates } = useGetAllTemplatesQuery();
  const { data: timeSettings, isLoading: timeSettingsLoading } = useGetTimeSettingsQuery();
  const { data: activeCycles = [], isLoading: cyclesLoading } = useGetActiveReviewCyclesQuery();
  const { data: reviewCycles = [], isLoading: allCyclesLoading } = useGetReviewCyclesQuery({
    requiresEmployeeSubmission: true,
  });

  const submissionCycle =
    activeCycles.find((c) => c.requiresEmployeeSubmission) ??
    reviewCycles.find((c) => c.status?.toUpperCase() === 'UPCOMING') ??
    [...reviewCycles].reverse().find((c) => c.status?.toUpperCase() === 'CLOSED') ??
    activeCycles[0] ??
    null;

  const displayDuration =
    timeSettings?.duration === 'Both' ? '6 Months & 1 Year (combined)' : timeSettings?.duration;

  const {
    currentData: loadedTemplate,
    refetch: refetchTemplate,
    isLoading: isTemplateLoading,
    isFetching: isTemplateFetching,
    isError: isTemplateError,
    error: templateQueryError,
  } = useGetTemplateByIdQuery(editingTemplateId!, {
    skip: !editingTemplateId,
  });

  const templateReady =
    editingTemplateId != null &&
    loadedTemplate != null &&
    loadedTemplate.id === editingTemplateId;
  const showTemplateLoader =
    editingTemplateId != null &&
    !templateReady &&
    (isTemplateLoading || isTemplateFetching) &&
    !isTemplateError;

  const [createTemplate, { isLoading: isCreating }] = useCreateTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateTemplateMutation();

  const { register, control, handleSubmit, reset } = useForm<QuestionFormData>({
    defaultValues: {
      title: '',
      questions: [{ questionText: '' }],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'questions',
  });

  const onSubmit = async (data: QuestionFormData) => {
    if (!data.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!selectedDepartmentId || !selectedPositionId) {
      toast.error('Please select department and position');
      return;
    }

    if (data.questions.length === 0 || data.questions.every(q => !q.questionText.trim())) {
      toast.error('Please add at least one question');
      return;
    }

    const questions = data.questions
      .filter(q => q.questionText.trim())
      .map((q, index) => ({
        questionText: q.questionText,
        sortOrder: index,
      }));

    try {
      if (editingTemplateId) {
        await updateTemplate({
          id: editingTemplateId,
          request: {
            title: data.title.trim(),
            departmentId: selectedDepartmentId,
            positionId: selectedPositionId,
            isActive,
            questions,
          },
        }).unwrap();
        toast.success('Template updated successfully');
      } else {
        await createTemplate({
          title: data.title.trim(),
          departmentId: selectedDepartmentId,
          positionId: selectedPositionId,
          questions,
        }).unwrap();
        toast.success('Template created successfully');
      }

      reset({ title: '', questions: [{ questionText: '' }] });
      setSelectedDepartmentId(null);
      setSelectedPositionId(null);
      setEditingTemplateId(null);
      setIsActive(true);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to save template');
    }
  };

  const handleEdit = (templateId: number) => {
    setEditingTemplateId(templateId);
  };

  React.useEffect(() => {
    if (!templateReady || !loadedTemplate) {
      return;
    }
    const qs = loadedTemplate.questions?.length
      ? loadedTemplate.questions.map((q) => ({ questionText: q.questionText }))
      : [{ questionText: '' }];
    setSelectedDepartmentId(loadedTemplate.departmentId);
    setSelectedPositionId(loadedTemplate.positionId);
    setIsActive(loadedTemplate.isActive);
    reset({
      title: loadedTemplate.title || '',
      questions: qs,
    });
  }, [templateReady, loadedTemplate, reset]);

  const handleCancelEdit = () => {
    setEditingTemplateId(null);
    reset({ title: '', questions: [{ questionText: '' }] });
    setSelectedDepartmentId(null);
    setSelectedPositionId(null);
    setIsActive(true);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      move(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < fields.length - 1) {
      move(index, index + 1);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Self Assessment Form</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Create and manage self-assessment forms for each department and position
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/hr/self-assessment/forms/create')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus size={16} />
            Create New Form
          </button>
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
            <div className="flex-1 text-sm text-slate-700 dark:text-slate-200 sm:min-w-0">
              <span className="font-semibold text-slate-900 dark:text-white">Current review cycle</span>
              <span className="mx-1.5 text-slate-400">·</span>
              {cyclesLoading || allCyclesLoading ? (
                <span className="text-slate-500">Loading…</span>
              ) : submissionCycle ? (
                <>
                  <span className="text-slate-900 dark:text-white">{submissionCycle.name}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {' '}
                    ({submissionCycle.yearLabel}, {cycleTypeLabel(submissionCycle.cycleType)})
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {formatCycleDate(submissionCycle.startDate)} – {formatCycleDate(submissionCycle.endDate)}
                    {submissionCycle.status ? (
                      <span className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${cycleStatusClass(submissionCycle.status)}`}>
                        {cycleStatusLabel(submissionCycle.status)}
                      </span>
                    ) : null}
                  </span>
                </>
              ) : (
                <span className="text-slate-500">
                  No active, upcoming, or closed submission cycle is available. Generate cycles in System Settings if needed.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Existing Forms
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
                      Questions
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
                  {allTemplates.map((template: any) => (
                    <tr key={template.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {template.title?.trim() ? template.title : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{template.departmentName}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{template.positionName}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{template.questions?.length ?? 0}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex text-xs px-2 py-0.5 rounded-full ${template.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}
                        >
                          {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleEdit(template.id)}
                          className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
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

      {editingTemplateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editingTemplateId ? 'Edit Form' : 'Create New Form'}
              </h2>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {showTemplateLoader ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500 dark:text-slate-400">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                <p className="text-sm">Loading template…</p>
              </div>
            ) : isTemplateError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {(templateQueryError as { data?: { message?: string } })?.data?.message ??
                    'Could not load this template. Please try again.'}
                </p>
                <button
                  type="button"
                  onClick={() => refetchTemplate()}
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Retry
                </button>
              </div>
            ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  {...register('title')}
                  type="text"
                  placeholder="Form title"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={selectedDepartmentId || ''}
                  onChange={(e) => {
                    setSelectedDepartmentId(e.target.value ? Number(e.target.value) : null);
                    setSelectedPositionId(null);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Position
                </label>
                <select
                  value={selectedPositionId || ''}
                  onChange={(e) => setSelectedPositionId(e.target.value ? Number(e.target.value) : null)}
                  disabled={!selectedDepartmentId}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">Select Position</option>
                  {selectedDepartmentId && positions.length === 0 && (
                    <option value="" disabled>No active positions for this department</option>
                  )}
                  {positions.map((pos: any) => (
                    <option key={pos.id} value={pos.id}>{pos.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Active Template
                </label>
              </div>
            </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Questions
                </label>

                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      >
                        <span className="text-xs">▲</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === fields.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      >
                        <span className="text-xs">▼</span>
                      </button>
                      <input
                        {...register(`questions.${index}.questionText` as const)}
                        placeholder={`Question ${index + 1}`}
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                      />
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => append({ questionText: '' })}
                  className="mt-3 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                >
                  <Plus size={16} />
                  Add Question
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Save size={16} />
                  {editingTemplateId ? 'Update Template' : 'Create Template'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
