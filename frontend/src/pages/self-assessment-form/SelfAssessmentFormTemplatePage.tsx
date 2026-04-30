import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetDepartmentsQuery } from '../../features/department/api/departmentApi';
import { useGetPositionsByDepartmentQuery } from '../../features/position/api/positionApi';
import {
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useGetAllTemplatesQuery,
  useGetTemplateByIdQuery,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { toast } from 'react-hot-toast';

interface QuestionFormData {
  questions: { questionText: string }[];
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
  const { data: editingTemplate, refetch: refetchTemplate } = useGetTemplateByIdQuery(editingTemplateId!, {
    skip: !editingTemplateId,
  });

  const [createTemplate, { isLoading: isCreating }] = useCreateTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateTemplateMutation();

  const { register, control, handleSubmit, reset, setValue, watch } = useForm<QuestionFormData>({
    defaultValues: {
      questions: [{ questionText: '' }],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'questions',
  });

  const onSubmit = async (data: QuestionFormData) => {
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
            departmentId: selectedDepartmentId,
            positionId: selectedPositionId,
            isActive,
            questions,
          },
        }).unwrap();
        toast.success('Template updated successfully');
      } else {
        await createTemplate({
          departmentId: selectedDepartmentId,
          positionId: selectedPositionId,
          questions,
        }).unwrap();
        toast.success('Template created successfully');
      }

      reset({ questions: [{ questionText: '' }] });
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
    refetchTemplate();
  };

  React.useEffect(() => {
    if (editingTemplate) {
      setSelectedDepartmentId(editingTemplate.departmentId);
      setSelectedPositionId(editingTemplate.positionId);
      setIsActive(editingTemplate.isActive);
      reset({
        questions: editingTemplate.questions.map(q => ({ questionText: q.questionText })),
      });
    }
  }, [editingTemplate, reset]);

  const handleCancelEdit = () => {
    setEditingTemplateId(null);
    reset({ questions: [{ questionText: '' }] });
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
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Existing Forms
          </h2>

          <div className="space-y-3">
            {allTemplates && allTemplates.length > 0 ? (
              allTemplates.map((template: any) => (
                <div
                  key={template.id}
                  className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">
                        {template.departmentName} - {template.positionName}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {template.questions?.length || 0} questions
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${template.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEdit(template.id)}
                      className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
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

            <div className="space-y-4 mb-6">
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

            <form onSubmit={handleSubmit(onSubmit)}>
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
          </div>
        </div>
      )}
    </div>
  );
};