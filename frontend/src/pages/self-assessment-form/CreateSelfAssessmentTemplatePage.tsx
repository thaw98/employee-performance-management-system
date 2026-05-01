import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useGetDepartmentsQuery } from '../../features/department/api/departmentApi';
import { useGetPositionsByDepartmentQuery } from '../../features/position/api/positionApi';
import { useCreateTemplateMutation } from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';

interface QuestionFormData {
  title: string;
  questions: { questionText: string }[];
}

export const CreateSelfAssessmentTemplatePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);

  const { data: departmentsResponse } = useGetDepartmentsQuery();
  const departments = departmentsResponse?.data || [];

  const { data: positionsResponse } = useGetPositionsByDepartmentQuery(selectedDepartmentId!, {
    skip: !selectedDepartmentId,
  });

  const positions = (positionsResponse?.data || []).map((pos: any) => ({
    id: pos.id ?? pos.positionId,
    name: pos.name ?? pos.positionName,
  }));

  const [createTemplate, { isLoading: isCreating }] = useCreateTemplateMutation();

  const { register, control, handleSubmit } = useForm<QuestionFormData>({
    defaultValues: {
      title: '',
      questions: [{ questionText: '' }],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'questions',
  });

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
      toast.error('Please add at least one assessment subject');
      return;
    }

    const questions = data.questions
      .filter(q => q.questionText.trim())
      .map((q, index) => ({
        questionText: q.questionText,
        sortOrder: index,
      }));

    try {
      await createTemplate({
        title: data.title.trim(),
        departmentId: selectedDepartmentId,
        positionId: selectedPositionId,
        questions,
      }).unwrap();

      toast.success('Template created successfully');
      navigate('/hr/self-assessment/forms');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create template');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/hr/self-assessment/forms')}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Forms
        </button>
      </div>

      <div className="max-w-4xl bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Form</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
          Create a self-assessment template for a specific department and position
        </p>

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
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Assessment Subject
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
                    placeholder={`Assessment Subject ${index + 1}`}
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
              Add Assessment Subject
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              <Save size={16} />
              Create Template
            </button>
            <button
              type="button"
              onClick={() => navigate('/hr/self-assessment/forms')}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
