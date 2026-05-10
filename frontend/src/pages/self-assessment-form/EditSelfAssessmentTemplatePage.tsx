import React, { useEffect } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useForm, useFieldArray, type UseFormRegister } from 'react-hook-form';
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  Building2,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  FileEdit,
  GripVertical,
  Lock,
  Pencil,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Undo2,
  UserCheck,
  X,
} from 'lucide-react';
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
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { useGetReviewCyclesQuery } from '../../features/reviewCycle/api/reviewCycleApi';
import { formatCycleDate } from './SelfAssessmentReviewCycleInfo';

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

interface EditQuestionRowShellProps {
  leading: React.ReactNode;
  index: number;
  register: UseFormRegister<QuestionFormData>;
  fieldsLength: number;
  canEditRow: boolean;
  canDeactivateRow: boolean;
  isManagerQ: boolean;
  isQuestionEditorReadOnly: boolean;
  onRemove: (index: number) => void;
  onSaveToBank: (index: number) => void;
  isSavingToQuestionBank: boolean;
  outerRef?: React.Ref<HTMLDivElement>;
  outerStyle?: React.CSSProperties;
  outerExtraClassName?: string;
}

const EditQuestionRowShell: React.FC<EditQuestionRowShellProps> = ({
  leading,
  index,
  register,
  fieldsLength,
  canEditRow,
  canDeactivateRow,
  isManagerQ,
  isQuestionEditorReadOnly,
  onRemove,
  onSaveToBank,
  isSavingToQuestionBank,
  outerRef,
  outerStyle,
  outerExtraClassName,
}) => (
  <div
    ref={outerRef}
    style={outerStyle}
    className={`group flex items-center gap-2 rounded-xl border p-2.5 transition-all ${
      isManagerQ
        ? 'border-amber-200/80 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-950/15'
        : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white hover:shadow-sm dark:border-slate-700/50 dark:bg-slate-900/30 dark:hover:border-slate-600 dark:hover:bg-slate-800/60'
    } ${outerExtraClassName ?? ''}`}
  >
    {leading}

    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
        isManagerQ
          ? 'bg-amber-200/80 text-amber-700 dark:bg-amber-800/40 dark:text-amber-300'
          : 'bg-slate-200/80 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
      }`}
    >
      {index + 1}
    </span>

    <input
      {...register(`questions.${index}.questionText` as const)}
      placeholder={`Question ${index + 1}`}
      readOnly={!canEditRow}
      className={`min-w-0 flex-1 rounded-lg border-0 bg-transparent px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 read-only:cursor-default read-only:focus:ring-0 dark:text-white dark:placeholder:text-slate-500 dark:read-only:text-slate-400`}
    />

    {isManagerQ && (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
        <UserCheck size={10} />
        Manager
      </span>
    )}

    {!isQuestionEditorReadOnly && canEditRow && (
      <button
        type="button"
        onClick={() => void onSaveToBank(index)}
        disabled={isSavingToQuestionBank}
        className="shrink-0 rounded-lg p-1.5 text-slate-400 opacity-0 transition-all hover:bg-emerald-50 hover:text-emerald-600 group-hover:opacity-100 disabled:opacity-30 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400"
        title="Save to Question Bank"
      >
        <BookMarked size={15} />
      </button>
    )}

    {fieldsLength > 1 && canDeactivateRow && (
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="shrink-0 rounded-lg p-1.5 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        aria-label="Remove question"
      >
        <Trash2 size={15} />
      </button>
    )}
  </div>
);

interface SortableEditQuestionRowProps {
  fieldId: string;
  index: number;
  register: UseFormRegister<QuestionFormData>;
  fieldsLength: number;
  canEditRow: boolean;
  canDeactivateRow: boolean;
  isManagerQ: boolean;
  onRemove: (index: number) => void;
  onSaveToBank: (index: number) => void;
  isSavingToQuestionBank: boolean;
}

const SortableEditQuestionRow: React.FC<SortableEditQuestionRowProps> = ({
  fieldId,
  index,
  register,
  fieldsLength,
  canEditRow,
  canDeactivateRow,
  isManagerQ,
  onRemove,
  onSaveToBank,
  isSavingToQuestionBank,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: fieldId,
    disabled: !canEditRow,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  const grip = canEditRow ? (
    <button
      type="button"
      className="shrink-0 cursor-grab touch-none rounded-md p-1 text-slate-400 transition-all hover:bg-slate-200 hover:text-slate-600 active:cursor-grabbing dark:hover:bg-slate-700 dark:hover:text-slate-300"
      {...attributes}
      {...listeners}
      aria-label="Drag to reorder question"
    >
      <GripVertical size={18} />
    </button>
  ) : (
    <span className="inline-flex w-[26px] shrink-0 justify-center" aria-hidden />
  );

  return (
    <EditQuestionRowShell
      leading={grip}
      index={index}
      register={register}
      fieldsLength={fieldsLength}
      canEditRow={canEditRow}
      canDeactivateRow={canDeactivateRow}
      isManagerQ={isManagerQ}
      isQuestionEditorReadOnly={false}
      onRemove={onRemove}
      onSaveToBank={onSaveToBank}
      isSavingToQuestionBank={isSavingToQuestionBank}
      outerRef={setNodeRef}
      outerStyle={style}
      outerExtraClassName={
        isDragging ? 'opacity-90 shadow-lg ring-2 ring-[#5D5FEF]/25 dark:ring-[#5D5FEF]/20' : ''
      }
    />
  );
};

const inputBase =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-[#5D5FEF] focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 read-only:cursor-default read-only:bg-slate-50 read-only:text-slate-500 read-only:shadow-none read-only:focus:ring-0 dark:read-only:bg-slate-900/50 dark:read-only:text-slate-400';

const selectBase =
  'w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 shadow-sm transition-all focus:border-[#5D5FEF] focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-[#5D5FEF] dark:disabled:bg-slate-900';

const StepBadge: React.FC<{ step: number; label: string; icon: React.ReactNode }> = ({ step, label, icon }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] text-white shadow-md shadow-[#5D5FEF]/25 dark:shadow-[#5D5FEF]/15">
      {icon}
    </div>
    <div>
      <span className="text-[11px] font-bold uppercase tracking-widest text-[#5D5FEF] dark:text-[#8b8ef7]">
        Step {step}
      </span>
      <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{label}</h2>
    </div>
  </div>
);

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
  const isTemplateDetailsReadOnly = isLocked || isManager;
  const isQuestionEditorReadOnly = isLocked;
  const showTemplateLoader =
    idValid && !templateReady && (isTemplateLoading || isTemplateFetching) && !isTemplateError;

  const [updateTemplate, { isLoading: isUpdating }] = useUpdateTemplateMutation();
  const [createQuestionBankItem, { isLoading: isSavingToQuestionBank }] =
    useCreateQuestionBankItemMutation();

  const { data: questionBank = [], isLoading: isQuestionBankLoading } = useGetQuestionBankQuery(
    { includeInactive: false },
    { skip: !isQuestionBankOpen }
  );
  const { data: reviewCycles = [] } = useGetReviewCyclesQuery();

  const filteredQuestionBank = questionBank.filter((question) =>
    question.questionText.toLowerCase().includes(questionBankSearch.trim().toLowerCase())
  );
  const selectedReviewCycle = React.useMemo(() => {
    if (!loadedTemplate?.reviewCycleId) {
      return null;
    }
    return reviewCycles.find((cycle) => cycle.id === loadedTemplate.reviewCycleId) ?? null;
  }, [loadedTemplate?.reviewCycleId, reviewCycles]);
  const selectedReviewCycleDurationDays = React.useMemo(() => {
    if (!selectedReviewCycle) {
      return null;
    }
    const start = new Date(`${selectedReviewCycle.startDate}T00:00:00Z`);
    const end = new Date(`${selectedReviewCycle.endDate}T00:00:00Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return null;
    }
    const oneDayMs = 24 * 60 * 60 * 1000;
    return Math.floor((end.getTime() - start.getTime()) / oneDayMs) + 1;
  }, [selectedReviewCycle]);

  const { register, control, handleSubmit, reset, watch, getValues, setValue } = useForm<QuestionFormData>({
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

  const questionDragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleQuestionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    move(oldIndex, newIndex);
  };

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
    reset({
      title: loadedTemplate.title || '',
      questions: qs,
    });
  }, [templateReady, loadedTemplate, reset]);

  const onSubmit = async (data: QuestionFormData) => {
    if (!idValid) return;
    if (isQuestionEditorReadOnly) {
      toast.error('This template is locked because forms have been assigned');
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
    const firstEmptyIndex = existing.findIndex((q) => !q.questionText.trim());
    if (firstEmptyIndex !== -1) {
      setValue(`questions.${firstEmptyIndex}.questionText`, trimmed, { shouldDirty: true, shouldValidate: true });
    } else {
      append({ questionText: trimmed, canEdit: true, canDeactivate: true, isManagerAdded: isManager });
    }
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
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={goBack}
            className="group mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
            Back to Templates
          </button>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 bg-red-50/80 px-6 py-16 dark:border-red-800/50 dark:bg-red-950/20">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-400">
              <X size={28} />
            </div>
            <p className="text-center text-base font-semibold text-red-700 dark:text-red-300">
              Invalid template link
            </p>
            <p className="text-center text-sm text-red-500/80 dark:text-red-400/70">
              The template ID in the URL is not valid.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 animate-fade-in-up">
          <button
            type="button"
            onClick={goBack}
            className="group mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
            Back to Templates
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/20">
                <FileEdit size={20} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Edit Template
                  </h1>
                  {templateReady && isLocked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      <Lock size={10} />
                      Locked
                    </span>
                  )}
                  {templateReady && isManager && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                      <ShieldCheck size={10} />
                      Manager
                    </span>
                  )}
                  {templateReady && !isQuestionEditorReadOnly && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      <Pencil size={10} />
                      Editing
                    </span>
                  )}
                </div>
                {templateReady ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {isManager
                      ? isLocked
                        ? 'This template has assigned forms and is read-only.'
                        : 'Template details are HR-controlled; you can manage your own questions.'
                      : isLocked
                        ? 'This template has assigned forms and is read-only.'
                        : 'Removing a question soft-deletes it for new assignments; existing forms keep their snapshot.'}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    Loading template details...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Review Cycle Info */}
        {templateReady && loadedTemplate && (
          <div
            className="mb-5 animate-fade-in-up overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/90"
            style={{ animationDelay: '50ms' }}
          >
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-md shadow-emerald-500/20">
                <CalendarRange size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Review Cycle
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {loadedTemplate.reviewCycleName?.trim()
                    ? loadedTemplate.reviewCycleName
                    : 'Not set (legacy template)'}
                </p>
                {selectedReviewCycle && (
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {formatCycleDate(selectedReviewCycle.startDate)} - {formatCycleDate(selectedReviewCycle.endDate)}
                    {selectedReviewCycleDurationDays != null
                      ? ` (${selectedReviewCycleDurationDays} day${selectedReviewCycleDurationDays === 1 ? '' : 's'})`
                      : ''}
                  </p>
                )}
              </div>
              {loadedTemplate.departmentName && (
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    <Building2 size={12} />
                    {loadedTemplate.departmentName}
                  </span>
                  {loadedTemplate.positionName && (
                    <span className="rounded-full bg-[#5D5FEF]/10 px-3 py-1 text-xs font-semibold text-[#5D5FEF] dark:bg-[#5D5FEF]/20 dark:text-[#8b8ef7]">
                      {loadedTemplate.positionName}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {showTemplateLoader && (
          <div
            className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-6 py-20 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/90 animate-fade-in-up"
            style={{ animationDelay: '50ms' }}
          >
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#5D5FEF]" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading template...</p>
          </div>
        )}

        {/* Error State */}
        {isTemplateError && (
          <div
            className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-200/80 bg-red-50/80 px-6 py-16 animate-fade-in-up dark:border-red-800/50 dark:bg-red-950/20"
            style={{ animationDelay: '50ms' }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-400">
              <X size={28} />
            </div>
            <p className="text-center text-base font-semibold text-red-700 dark:text-red-300">
              {(templateQueryError as { data?: { message?: string } })?.data?.message ??
                'Could not load this template. Please try again.'}
            </p>
            <button
              type="button"
              onClick={() => refetchTemplate()}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5D5FEF] to-[#7C7EF5] px-5 py-2 text-sm font-bold text-white shadow-lg shadow-[#5D5FEF]/25 transition-all hover:shadow-xl hover:brightness-110"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Form */}
        {!showTemplateLoader && !isTemplateError && (
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* ─── Step 1: Template Details ─── */}
            <div
              className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/90 animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              <div className="mb-5">
                <StepBadge step={1} label="Template Details" icon={<FileEdit size={17} />} />
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Title
                  </label>
                  <input
                    {...register('title')}
                    type="text"
                    placeholder="e.g. Q1 Performance Self-Evaluation"
                    readOnly={isTemplateDetailsReadOnly}
                    className={inputBase}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Department
                    </label>
                    <select
                      value={selectedDepartmentId || ''}
                      onChange={(e) => {
                        setSelectedDepartmentId(e.target.value ? Number(e.target.value) : null);
                        setSelectedPositionId(null);
                      }}
                      disabled={isTemplateDetailsReadOnly}
                      className={selectBase}
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
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Position
                    </label>
                    <select
                      value={selectedPositionId || ''}
                      onChange={(e) => setSelectedPositionId(e.target.value ? Number(e.target.value) : null)}
                      disabled={!selectedDepartmentId || isTemplateDetailsReadOnly}
                      className={selectBase}
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
                </div>

                <div className="flex items-center gap-3">
                  <label htmlFor="isActive" className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      disabled={isTemplateDetailsReadOnly}
                      className="peer sr-only"
                    />
                    <div
                      className={`flex h-6 w-11 items-center rounded-full px-0.5 transition-all duration-200 ${
                        isActive
                          ? 'bg-[#5D5FEF]'
                          : 'bg-slate-300 dark:bg-slate-600'
                      } ${isTemplateDetailsReadOnly ? 'opacity-50' : ''}`}
                    >
                      <div
                        className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </label>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Active Template
                  </span>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      <CheckCircle2 size={10} />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Step 2: Questions ─── */}
            <div
              className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/90 animate-fade-in-up"
              style={{ animationDelay: '150ms' }}
            >
              <div className="mb-5 flex items-center justify-between">
                <StepBadge step={2} label="Questions" icon={<ClipboardList size={17} />} />
                {!isQuestionEditorReadOnly && (
                  <button
                    type="button"
                    onClick={() => setIsQuestionBankOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                  >
                    <BookOpen size={14} />
                    Question Bank
                  </button>
                )}
              </div>

              {isQuestionEditorReadOnly ? (
                <div className="space-y-2.5">
                  {fields.map((field, index) => {
                    const canEditRow = !isQuestionEditorReadOnly && field.canEdit !== false;
                    const canDeactivateRow = !isQuestionEditorReadOnly && field.canDeactivate !== false;
                    const isManagerQ = !!(field.canHighlight || field.isManagerAdded);
                    return (
                      <EditQuestionRowShell
                        key={field.id}
                        leading={null}
                        index={index}
                        register={register}
                        fieldsLength={fields.length}
                        canEditRow={canEditRow}
                        canDeactivateRow={canDeactivateRow}
                        isManagerQ={isManagerQ}
                        isQuestionEditorReadOnly={isQuestionEditorReadOnly}
                        onRemove={remove}
                        onSaveToBank={handleSaveQuestionToBank}
                        isSavingToQuestionBank={isSavingToQuestionBank}
                      />
                    );
                  })}
                </div>
              ) : (
                <DndContext
                  sensors={questionDragSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleQuestionDragEnd}
                >
                  <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2.5">
                      {fields.map((field, index) => {
                        const canEditRow = field.canEdit !== false;
                        const canDeactivateRow = field.canDeactivate !== false;
                        const isManagerQ = !!(field.canHighlight || field.isManagerAdded);
                        return (
                          <SortableEditQuestionRow
                            key={field.id}
                            fieldId={field.id}
                            index={index}
                            register={register}
                            fieldsLength={fields.length}
                            canEditRow={canEditRow}
                            canDeactivateRow={canDeactivateRow}
                            isManagerQ={isManagerQ}
                            onRemove={remove}
                            onSaveToBank={handleSaveQuestionToBank}
                            isSavingToQuestionBank={isSavingToQuestionBank}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {!isQuestionEditorReadOnly && (
                <button
                  type="button"
                  onClick={() => append({ questionText: '', canEdit: true, canDeactivate: true, isManagerAdded: isManager })}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500 transition-all hover:border-[#5D5FEF] hover:bg-[#5D5FEF]/[0.03] hover:text-[#5D5FEF] dark:border-slate-600 dark:hover:border-[#5D5FEF] dark:hover:text-[#8b8ef7]"
                >
                  <Plus size={15} />
                  Add Question
                </button>
              )}
            </div>

            {/* ─── Removed Questions ─── */}
            {templateReady && loadedTemplate ? (
              (() => {
                const restoredIds = new Set(
                  (watchedQuestions ?? [])
                    .map((row) => row.questionId)
                    .filter((id): id is number => typeof id === 'number'),
                );
                const pendingRestore = isQuestionEditorReadOnly ? [] : (loadedTemplate.deletedQuestions ?? []).filter((d) => !restoredIds.has(d.id) && d.canEdit);
                if (pendingRestore.length === 0) return null;
                return (
                  <div
                    className="mb-5 overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 to-amber-50/40 shadow-sm dark:border-amber-800/40 dark:from-amber-950/20 dark:to-amber-950/10 animate-fade-in-up"
                    style={{ animationDelay: '200ms' }}
                  >
                    <div className="flex items-center gap-3 border-b border-amber-200/60 px-5 py-3.5 dark:border-amber-800/30">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-200/80 text-amber-700 dark:bg-amber-800/40 dark:text-amber-300">
                        <Undo2 size={15} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">Removed Questions</h3>
                        <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70">
                          Restoring adds the question back for new assignments. Existing forms are unchanged.
                        </p>
                      </div>
                    </div>
                    <div className="p-4">
                      <ul className="space-y-2">
                        {pendingRestore.map((q) => (
                          <li
                            key={q.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/60 bg-white/90 px-4 py-3 dark:border-amber-800/30 dark:bg-slate-900/40"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                                <Trash2 size={10} />
                              </span>
                              <span className="text-sm text-slate-800 dark:text-slate-200 truncate">{q.questionText}</span>
                            </div>
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
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                            >
                              <Undo2 size={12} />
                              Restore
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })()
            ) : null}

            {/* ─── Actions ─── */}
            {!isQuestionEditorReadOnly && (
              <div
                className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end animate-fade-in-up"
                style={{ animationDelay: '250ms' }}
              >
                <button
                  type="button"
                  onClick={goBack}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5D5FEF] to-[#7C7EF5] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#5D5FEF]/25 transition-all hover:shadow-xl hover:shadow-[#5D5FEF]/30 hover:brightness-110 disabled:opacity-50 disabled:shadow-none dark:shadow-[#5D5FEF]/15"
                >
                  {isUpdating ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {isQuestionEditorReadOnly && (
              <div
                className="flex justify-end animate-fade-in-up"
                style={{ animationDelay: '250ms' }}
              >
                <button
                  type="button"
                  onClick={goBack}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Go Back
                </button>
              </div>
            )}
          </form>
        )}

        {/* ─── Question Bank Modal ─── */}
        {isQuestionBankOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="animate-scale-in w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                    <BookOpen size={16} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Question Bank</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuestionBankOpen(false)}
                  className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                  aria-label="Close question bank"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <div className="relative mb-4">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={questionBankSearch}
                    onChange={(event) => setQuestionBankSearch(event.target.value)}
                    type="text"
                    placeholder="Search questions..."
                    className={`${inputBase} pl-10`}
                  />
                </div>

                <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-600">
                  {isQuestionBankLoading ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-slate-400">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#5D5FEF]" />
                      Loading questions...
                    </div>
                  ) : filteredQuestionBank.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredQuestionBank.map((question) => (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() => handleUseBankQuestion(question.questionText)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-all hover:bg-[#5D5FEF]/[0.04] dark:hover:bg-[#5D5FEF]/10"
                        >
                          <Plus size={14} className="shrink-0 text-[#5D5FEF] dark:text-[#8b8ef7]" />
                          <span className="text-slate-800 dark:text-slate-100">{question.questionText}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                      No active questions found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
