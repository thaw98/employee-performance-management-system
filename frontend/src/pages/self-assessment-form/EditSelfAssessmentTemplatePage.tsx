import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { ArrowLeft, BookMarked, BookOpen, CalendarRange, Plus, Save, Search, Trash2, Undo2, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetDepartmentsQuery } from '../../features/department/api/departmentApi';
import { useGetPositionsByDepartmentQuery } from '../../features/position/api/positionApi';
import {
  useCreateQuestionBankItemMutation,
  useGetTemplateByIdQuery,
  useGetQuestionBankQuery,
  useUpdateTemplateMutation,
  type SelfAssessmentRatingSystem,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { ratingSystemLabels } from '../../features/selfAssessmentForm/ratingSystem';

interface QuestionFormData {
  title: string;
  questions: {
    questionId?: number;
    questionText: string;
    canEdit?: boolean;
    canDeactivate?: boolean;
    canHighlight?: boolean;
    isManagerAdded?: boolean;
  }[];
}

export const EditSelfAssessmentTemplatePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const isManager = user?.roleId === 2;
  const routeBase = isManager ? '/manager/self-assessment/templates' : '/hr/self-assessment/templates';
  const { templateId: templateIdParam } = useParams<{ templateId: string }>();
  const templateId = templateIdParam ? Number(templateIdParam) : NaN;
  const idValid = Number.isFinite(templateId) && templateId > 0;

  const [selectedDepartmentId, setSelectedDepartmentId] = React.useState<number | null>(null);
  const [selectedPositionId, setSelectedPositionId] = React.useState<number | null>(null);
  const [isActive, setIsActive] = React.useState(true);
  const [ratingSystem, setRatingSystem] = React.useState<SelfAssessmentRatingSystem>('FIVE_POINT');
  const [isQuestionBankOpen, setIsQuestionBankOpen] = React.useState(false);
  const [questionBankSearch, setQuestionBankSearch] = React.useState('');

  const { data: departmentsResponse } = useGetDepartmentsQuery();
  const departments = departmentsResponse?.data || [];

  const { data: positionsResponse } = useGetPositionsByDepartmentQuery(selectedDepartmentId!, {
    skip: !selectedDepartmentId,
  });
  const positions = (positionsResponse?.data || [])
    .map((pos: { id?: number; positionId?: number; name?: string; positionName?: string }) => ({
      id: pos.id ?? pos.positionId,
      name: pos.name ?? pos.positionName,
    }))
    .filter((pos): pos is { id: number; name: string } => pos.id != null && !!pos.name);

  const {
    currentData: loadedTemplate,
    refetch: refetchTemplate,
    isLoading: isTemplateLoading,
    isFetching: isTemplateFetching,
    isError: isTemplateError,
    error: templateQueryError,
  } = useGetTemplateByIdQuery(templateId, {
    skip: !idValid,
  });

  const templateReady =
    idValid && loadedTemplate != null && loadedTemplate.id === templateId;
  const isLocked = loadedTemplate?.isLocked === true;
  const isReadOnlyTemplate = isLocked || isManager;
  const showTemplateLoader =
    idValid && !templateReady && (isTemplateLoading || isTemplateFetching) && !isTemplateError;

  const [updateTemplate, { isLoading: isUpdating }] = useUpdateTemplateMutation();
  const [createQuestionBankItem, { isLoading: isSavingToQuestionBank }] =
    useCreateQuestionBankItemMutation();

  const { data: questionBank = [], isLoading: isQuestionBankLoading } = useGetQuestionBankQuery(
    { includeInactive: false },
    { skip: !isQuestionBankOpen }
  );

  const filteredQuestionBank = questionBank.filter((question) =>
    question.questionText.toLowerCase().includes(questionBankSearch.trim().toLowerCase())
  );

  const { register, control, handleSubmit, reset, watch, getValues } = useForm<QuestionFormData>({
    defaultValues: {
      title: '',
      questions: [{ questionText: '' }],
    },
  });

  const watchedQuestions = watch('questions');

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'questions',
  });

  useEffect(() => {
    if (!templateReady || !loadedTemplate) {
      return;
    }
    const qs = loadedTemplate.questions?.length
      ? loadedTemplate.questions.map((q) => ({
          questionId: q.id,
          questionText: q.questionText,
          canEdit: q.canEdit,
          canDeactivate: q.canDeactivate,
          canHighlight: q.canHighlight,
          isManagerAdded: q.isManagerAdded,
        }))
      : [{ questionText: '' }];
    setSelectedDepartmentId(loadedTemplate.departmentId);
    setSelectedPositionId(loadedTemplate.positionId);
    setIsActive(loadedTemplate.isActive);
    setRatingSystem(loadedTemplate.ratingSystem);
    reset({
      title: loadedTemplate.title || '',
      questions: qs,
    });
  }, [templateReady, loadedTemplate, reset]);

  const onSubmit = async (data: QuestionFormData) => {
    if (!idValid) return;
    if (isReadOnlyTemplate) {
      toast.error(isLocked ? 'This template is locked because forms have been assigned' : 'Managers cannot edit templates');
      return;
    }

    if (!isManager && !data.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!isManager && (!selectedDepartmentId || !selectedPositionId)) {
      toast.error('Please select department and position');
      return;
    }

    if (data.questions.length === 0 || data.questions.every((q) => !q.questionText.trim())) {
      toast.error('Please add at least one question');
      return;
    }

    const questions = data.questions
      .filter((q) => q.questionText.trim())
      .map((q, index) => ({
        ...(q.questionId != null ? { id: q.questionId } : {}),
        questionText: q.questionText.trim(),
        sortOrder: index,
      }));

    try {
      await updateTemplate({
        id: templateId,
        request: {
          title: isManager && loadedTemplate ? loadedTemplate.title : data.title.trim(),
          departmentId: isManager && loadedTemplate ? loadedTemplate.departmentId : selectedDepartmentId!,
          positionId: isManager && loadedTemplate ? loadedTemplate.positionId : selectedPositionId!,
          isActive: isManager && loadedTemplate ? loadedTemplate.isActive : isActive,
          questions,
          ratingSystem,
        },
      }).unwrap();
      toast.success('Template updated successfully');
      navigate(routeBase);
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'data' in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(message || 'Failed to save template');
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0 && (!isManager || (fields[index]?.canEdit && fields[index - 1]?.canEdit))) {
      move(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < fields.length - 1 && (!isManager || (fields[index]?.canEdit && fields[index + 1]?.canEdit))) {
      move(index, index + 1);
    }
  };

  const handleUseBankQuestion = (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed) {
      return;
    }
    const existing = getValues('questions') ?? [];
    const key = trimmed.toLowerCase();
    if (existing.some((q) => q.questionText.trim().toLowerCase() === key)) {
      toast.error('This question is already in the form');
      return;
    }
    append({ questionText: trimmed, canEdit: true, canDeactivate: true });
    setIsQuestionBankOpen(false);
    setQuestionBankSearch('');
    toast.success('Question added to form');
  };

  const handleSaveQuestionToBank = async (index: number) => {
    const text = getValues(`questions.${index}.questionText`).trim();
    if (!text) {
      toast.error('Enter question text before saving to the Question Bank');
      return;
    }
    try {
      await createQuestionBankItem({ questionText: text, isActive: true }).unwrap();
      toast.success('Question saved to Question Bank');
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'data' in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(message || 'Could not save to Question Bank');
    }
  };

  const goBack = () => navigate(routeBase);

  if (!idValid) {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Templates
        </button>
        <p className="mt-6 text-center text-sm text-red-600 dark:text-red-400">Invalid template link.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Templates
        </button>
      </div>

      <div className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
	        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Template</h1>
	        {templateReady ? (
	          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
	            {isManager
	              ? 'Manager access is read-only.'
	              : isLocked
	                ? 'This template has assigned forms and is read-only.'
	                : 'Removing a question soft-deletes it for new assignments; forms already set with a deadline keep their snapshot.'}
	          </p>
	        ) : null}

        {templateReady && loadedTemplate ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-600 dark:bg-slate-800/50">
            <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
              <CalendarRange className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">Review cycle</span>
                <p className="mt-1 text-slate-700 dark:text-slate-300">
                  {loadedTemplate.reviewCycleName?.trim()
                    ? loadedTemplate.reviewCycleName
                    : 'Not set (legacy template created before review cycle was stored)'}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {showTemplateLoader ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500 dark:text-slate-400">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            <p className="text-sm">Loading template…</p>
          </div>
        ) : isTemplateError ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
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
          <form className="mt-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
	                <input
	                  {...register('title')}
	                  type="text"
	                  placeholder="Template title"
	                  readOnly={isReadOnlyTemplate}
	                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 read-only:bg-slate-100 read-only:text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:read-only:bg-slate-900/50 dark:read-only:text-slate-400"
	                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Rating system</label>
                <select
                  value={ratingSystem}
                  onChange={(e) => setRatingSystem(e.target.value as SelfAssessmentRatingSystem)}
                  disabled={isReadOnlyTemplate}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  <option value="FIVE_POINT">{ratingSystemLabels.FIVE_POINT}</option>
                  <option value="TEN_POINT">{ratingSystemLabels.TEN_POINT}</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
                <select
	                  value={selectedDepartmentId || ''}
	                  onChange={(e) => {
	                    setSelectedDepartmentId(e.target.value ? Number(e.target.value) : null);
	                    setSelectedPositionId(null);
	                  }}
	                  disabled={isReadOnlyTemplate}
	                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.departmentId} value={dept.departmentId}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Position</label>
                <select
	                  value={selectedPositionId || ''}
	                  onChange={(e) => setSelectedPositionId(e.target.value ? Number(e.target.value) : null)}
	                  disabled={!selectedDepartmentId || isReadOnlyTemplate}
	                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Select Position</option>
                  {selectedDepartmentId && positions.length === 0 && (
                    <option value="" disabled>
                      No active positions for this department
                    </option>
                  )}
                  {positions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
	                  id="isActive"
	                  checked={isActive}
	                  onChange={(e) => setIsActive(e.target.checked)}
	                  disabled={isReadOnlyTemplate}
	                  className="h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Active Template
                </label>
              </div>
            </div>

            <div className="mb-4">
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Questions</label>
	                {!isReadOnlyTemplate && (
	                  <button
	                    type="button"
	                    onClick={() => setIsQuestionBankOpen(true)}
	                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
	                  >
	                    <BookOpen size={16} />
	                    Use from Question Bank
	                  </button>
	                )}
              </div>

              <div className="space-y-2">
	                {fields.map((field, index) => {
	                  const canEditRow = !isReadOnlyTemplate && field.canEdit !== false;
	                  const canDeactivateRow = !isReadOnlyTemplate && field.canDeactivate !== false;
	                  const canMoveUp = !isReadOnlyTemplate && index > 0 && (!isManager || (canEditRow && fields[index - 1]?.canEdit));
	                  const canMoveDown = !isReadOnlyTemplate && index < fields.length - 1 && (!isManager || (canEditRow && fields[index + 1]?.canEdit));
	                  return (
	                  <div
	                    key={field.id}
	                    className={`flex flex-wrap items-center gap-2 rounded-lg border px-2 py-2 ${
	                      field.canHighlight
	                        ? 'border-amber-300 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/20'
	                        : 'border-transparent'
	                    }`}
	                  >
	                    <button
	                      type="button"
	                      onClick={() => handleMoveUp(index)}
	                      disabled={!canMoveUp}
	                      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    >
                      <span className="text-xs">▲</span>
                    </button>
	                    <button
	                      type="button"
	                      onClick={() => handleMoveDown(index)}
	                      disabled={!canMoveDown}
	                      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    >
                      <span className="text-xs">▼</span>
                    </button>
                    <input
	                      {...register(`questions.${index}.questionText` as const)}
	                      placeholder={`Question ${index + 1}`}
	                      readOnly={!canEditRow}
	                      className="min-w-48 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 read-only:bg-slate-100 read-only:text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:read-only:bg-slate-900/50 dark:read-only:text-slate-400"
	                    />
	                    {field.canHighlight || field.isManagerAdded ? (
	                      <span className="inline-flex shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
	                        Manager added
	                      </span>
	                    ) : null}
	                    {!isReadOnlyTemplate && (
	                      <button
	                        type="button"
	                        onClick={() => void handleSaveQuestionToBank(index)}
	                        disabled={isSavingToQuestionBank}
	                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-950/70"
	                        title="Save this question text to the Question Bank"
	                      >
	                        <BookMarked size={14} />
	                        Save to Question Bank
	                      </button>
	                    )}
	                    {fields.length > 1 && canDeactivateRow && (
	                      <button
	                        type="button"
	                        onClick={() => remove(index)}
                        className="rounded p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={16} />
	                      </button>
	                    )}
	                  </div>
	                  );
	                })}
              </div>

              {!isReadOnlyTemplate && (
              <button
                type="button"
	                onClick={() => append({ questionText: '', canEdit: true, canDeactivate: true, isManagerAdded: isManager })}
                className="mt-3 flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                <Plus size={16} />
                Add Question
              </button>
              )}
            </div>

            {templateReady && loadedTemplate ? (
              (() => {
                const restoredIds = new Set(
                  (watchedQuestions ?? [])
                    .map((row) => row.questionId)
                    .filter((id): id is number => typeof id === 'number'),
                );
                const pendingRestore = isReadOnlyTemplate ? [] : (loadedTemplate.deletedQuestions ?? []).filter((d) => !restoredIds.has(d.id) && d.canEdit);
                if (pendingRestore.length === 0) return null;
                return (
                  <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Removed questions</p>
                    <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-300/90">
                      Restoring adds the question back for new assignments. Existing assigned forms are unchanged.
                    </p>
                    <ul className="mt-3 space-y-2">
                      {pendingRestore.map((q) => (
                        <li
                          key={q.id}
                          className="flex items-start justify-between gap-3 rounded-md border border-amber-200/80 bg-white/90 px-3 py-2 text-sm dark:border-amber-900/50 dark:bg-slate-900/40"
                        >
                          <span className="text-slate-800 dark:text-slate-200">{q.questionText}</span>
                          <button
                            type="button"
	                            onClick={() => append({
	                              questionId: q.id,
	                              questionText: q.questionText,
	                              canEdit: q.canEdit,
	                              canDeactivate: q.canDeactivate,
	                              canHighlight: q.canHighlight,
	                              isManagerAdded: q.isManagerAdded,
	                            })}
                            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-emerald-600 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                          >
                            <Undo2 size={14} />
                            Restore
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()
            ) : null}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isUpdating || isReadOnlyTemplate}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Save size={16} />
                Update Template
              </button>
              <button
                type="button"
                onClick={goBack}
                className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {isQuestionBankOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Use from Question Bank</h2>
              <button
                type="button"
                onClick={() => setIsQuestionBankOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                aria-label="Close question bank"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                value={questionBankSearch}
                onChange={(event) => setQuestionBankSearch(event.target.value)}
                type="text"
                placeholder="Search active questions"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
              {isQuestionBankLoading ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Loading questions...
                </div>
              ) : filteredQuestionBank.length > 0 ? (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredQuestionBank.map((question) => (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => handleUseBankQuestion(question.questionText)}
                      className="block w-full px-4 py-3 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700/60"
                    >
                      {question.questionText}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No active questions found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
