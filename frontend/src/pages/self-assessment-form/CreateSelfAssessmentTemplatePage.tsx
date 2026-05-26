import React, { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray, type UseFormRegister } from 'react-hook-form';
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
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  ClipboardList,
  Crown,
  Eye,
  GripVertical,
  Layers3,
  Plus,
  Save,
  Search,
  Target,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { skipToken } from '@reduxjs/toolkit/query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useGetDepartmentsQuery } from '../../features/department/api/departmentApi';
import { useGetPositionsByDepartmentQuery } from '../../features/position/api/positionApi';
import { useGetEmployeesQuery, type EmployeeListItem } from '../../features/hrEmployeeList/hrEmployeeApi';
import {
  useCreateQuestionBankItemMutation,
  useCreateTemplateMutation,
  useCheckActiveTemplateConflictsMutation,
  useDeleteCopiedTemplateMutation,
  useGetCopiedTemplateQuery,
  useGetQuestionBankQuery,
  useGetSelfAssessmentSettingsQuery,
  type QuestionRequest,
  type SelfAssessmentRatingSystem,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { getRatingOptions, ratingSystemLabels } from '../../features/selfAssessmentForm/ratingSystem';
import { useGetReviewCyclesQuery } from '../../features/reviewCycle/api/reviewCycleApi';
import { formatCycleDate, SelfAssessmentReviewCycleInfo } from './SelfAssessmentReviewCycleInfo';
import { AudienceCard, createCountBadge, formatEmployeeCount } from './SelfAssessmentAudienceCard';
import { SelfAssessmentTemplatePreviewModal } from './SelfAssessmentTemplatePreviewModal';

interface QuestionFormData {
  title: string;
  questions: { questionText: string }[];
}

interface SortableQuestionRowProps {
  fieldId: string;
  index: number;
  register: UseFormRegister<QuestionFormData>;
  fieldsLength: number;
  onRemove: (index: number) => void;
  onSaveToBank: (index: number) => void;
  isSavingToBank: boolean;
  questionLength: number;
}

const SortableQuestionRow: React.FC<SortableQuestionRowProps> = ({
  fieldId,
  index,
  register,
  fieldsLength,
  onRemove,
  onSaveToBank,
  isSavingToBank,
  questionLength,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: fieldId,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm dark:border-slate-700/50 dark:bg-slate-900/30 dark:hover:border-slate-600 dark:hover:bg-slate-800/60 ${
        isDragging ? 'opacity-90 shadow-lg ring-2 ring-[#2463eb]/25 dark:ring-[#2463eb]/20' : ''
      }`}
    >
      <button
        type="button"
        className="shrink-0 touch-none cursor-grab rounded-md p-1 text-slate-400 transition-all hover:bg-slate-200 hover:text-slate-600 active:cursor-grabbing dark:hover:bg-slate-700 dark:hover:text-slate-300"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder question"
      >
        <GripVertical size={18} />
      </button>

      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-200/80 text-[11px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
        {index + 1}
      </span>

      <input
        {...register(`questions.${index}.questionText` as const)}
        placeholder={`Question ${index + 1}`}
        maxLength={100}
        className="min-w-0 flex-1 rounded-lg border-0 bg-transparent px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2463eb]/20 dark:text-white dark:placeholder:text-slate-500"
      />
      <span className="shrink-0 text-xs text-slate-400">
        {questionLength}/100
      </span>

      <button
        type="button"
        onClick={() => void onSaveToBank(index)}
        disabled={isSavingToBank}
        className="shrink-0 rounded-lg p-1.5 text-slate-400 opacity-0 transition-all hover:bg-emerald-50 hover:text-emerald-600 group-hover:opacity-100 disabled:opacity-30 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400"
        title="Save to Question Bank"
      >
        <BookMarked size={15} />
      </button>

      {fieldsLength > 1 && (
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
};

type AudienceType = 'all' | 'departments' | 'positions' | 'hybrid';

type DepartmentOption = {
  id: number;
  name: string;
};

type PositionOption = {
  id: number;
  name: string;
};

type TargetPair = {
  departmentId: number;
  departmentName: string;
  positionId: number;
  positionName: string;
};

type HybridRule = {
  id: string;
  departmentId: number | null;
  positionId: number | null;
  /** Fallback label when this dept is not in the HR departments list (e.g. inactive). */
  departmentLabel?: string | null;
  /** Fallback label when this position is not returned for the department yet. */
  positionLabel?: string | null;
};

const createHybridRuleId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `hr-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const normalizeDepartment = (department: unknown): DepartmentOption => {
  const source = isRecord(department) ? department : {};
  return {
    id: Number(source.departmentId ?? source.id),
    name: String(source.departmentName ?? source.name ?? ''),
  };
};

const normalizePosition = (position: unknown): PositionOption => {
  const source = isRecord(position) ? position : {};
  return {
    id: Number(source.positionId ?? source.id),
    name: String(source.positionName ?? source.name ?? ''),
  };
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!isRecord(error)) {
    return fallback;
  }

  const data = error.data;
  if (isRecord(data) && typeof data.message === 'string') {
    return data.message;
  }

  return fallback;
};

const normalizeLookupKey = (value: unknown) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const employeeIsActive = (employee: EmployeeListItem) => {
  if (employee.employeeActiveStatus) {
    return employee.employeeActiveStatus === 'ACTIVE';
  }

  return employee.employmentStatus !== 'Resigned' && employee.employmentStatus !== 'Terminated';
};

interface HybridRuleRowProps {
  rule: HybridRule;
  departments: DepartmentOption[];
  onDepartmentChange: (ruleId: string, departmentId: number | null) => void;
  onPositionChange: (ruleId: string, positionId: number | null) => void;
  onRemove: (ruleId: string) => void;
  canRemove: boolean;
}

const selectBase =
  'w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 shadow-sm transition-all focus:border-[#2463eb] focus:outline-none focus:ring-2 focus:ring-[#2463eb]/20 disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-[#2463eb] dark:disabled:bg-slate-900';

const inputBase =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-[#2463eb] focus:outline-none focus:ring-2 focus:ring-[#2463eb]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500';

const StepBadge: React.FC<{ step: number; label: string; icon: React.ReactNode }> = ({ step, label, icon }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] text-white shadow-md shadow-[#2463eb]/25 dark:shadow-[#2463eb]/15">
      {icon}
    </div>
    <div>
      <span className="text-[11px] font-bold uppercase tracking-widest text-[#2463eb] dark:text-[#60a5fa]">
        Step {step}
      </span>
      <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{label}</h2>
    </div>
  </div>
);

const HybridRuleRow: React.FC<HybridRuleRowProps> = ({
  rule,
  departments,
  onDepartmentChange,
  onPositionChange,
  onRemove,
  canRemove,
}) => {
  const deptQueryArg =
    rule.departmentId != null && rule.departmentId > 0 ? rule.departmentId : skipToken;
  const { data: positionsResponse } = useGetPositionsByDepartmentQuery(deptQueryArg);
  const rowPositions = useMemo(
    () => (positionsResponse?.data || []).map(normalizePosition).filter((p) => p.id && p.name),
    [positionsResponse?.data]
  );

  const deptSelectionMissing =
    rule.departmentId != null &&
    rule.departmentId > 0 &&
    !departments.some((d) => d.id === rule.departmentId);

  const positionSelectionMissing =
    rule.positionId != null &&
    rule.positionId > 0 &&
    !rowPositions.some((p) => p.id === rule.positionId);

  const departmentSelectValue =
    rule.departmentId != null && rule.departmentId > 0 ? String(rule.departmentId) : '';

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/50">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <div className="relative min-w-[160px] flex-1">
          <select
            aria-label="Department"
            value={departmentSelectValue}
            onChange={(event) => {
              const value = event.target.value;
              onDepartmentChange(rule.id, value ? Number(value) : null);
            }}
            className={selectBase}
          >
            <option value="">Select department</option>
            {deptSelectionMissing ? (
              <option value={String(rule.departmentId)}>
                {rule.departmentLabel?.trim() || `Department #${rule.departmentId}`}
              </option>
            ) : null}
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>
        <div className="relative min-w-[180px] flex-1">
          <select
            aria-label="Position"
            value={rule.positionId === null || rule.positionId === undefined ? '' : String(rule.positionId)}
            disabled={!rule.departmentId}
            onChange={(event) => {
              const value = event.target.value;
              onPositionChange(rule.id, value ? Number(value) : null);
            }}
            className={selectBase}
          >
            <option value="">All Positions</option>
            {positionSelectionMissing ? (
              <option value={String(rule.positionId)}>
                {rule.positionLabel?.trim() || `Position #${rule.positionId}`}
              </option>
            ) : null}
            {rowPositions.length === 0 && rule.departmentId ? (
              <option value="" disabled>
                No active positions for this department
              </option>
            ) : null}
            {rowPositions.map((position) => (
              <option key={position.id} value={position.id}>
                {position.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(rule.id)}
        disabled={!canRemove}
        className="shrink-0 rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-950/40 dark:hover:text-red-400"
        aria-label="Remove rule"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

function reviewCycleOptionSuffix(status: string | undefined) {
  const s = status?.toUpperCase() ?? '';
  if (s === 'ACTIVE') return 'Active';
  if (s === 'UPCOMING') return 'Upcoming';
  return s ? status : '';
}

export const CreateSelfAssessmentTemplatePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isPastingCopiedTemplate = searchParams.get('fromCopiedTemplate') === 'true';
  const [audienceType, setAudienceType] = useState<AudienceType>('hybrid');
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<number[]>([]);
  const [selectedGlobalPositionIds, setSelectedGlobalPositionIds] = useState<number[]>([]);
  const [hybridRules, setHybridRules] = useState<HybridRule[]>(() => [
    { id: createHybridRuleId(), departmentId: null, positionId: null },
  ]);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
  const [questionBankSearch, setQuestionBankSearch] = useState('');
  const [positionAudienceSearch, setPositionAudienceSearch] = useState('');
  const [selectedReviewCycleId, setSelectedReviewCycleId] = useState<number | null>(null);
  const [timelineMode, setTimelineMode] = useState<'REVIEW_CYCLE' | 'MANUAL'>('REVIEW_CYCLE');
  const [manualStartDate, setManualStartDate] = useState('');
  const [manualEndDate, setManualEndDate] = useState('');
  const [copiedSourceTitle, setCopiedSourceTitle] = useState<string | null>(null);
  const [copiedDeletedQuestions, setCopiedDeletedQuestions] = useState<QuestionRequest[]>([]);
  const [copiedRatingSystem, setCopiedRatingSystem] = useState<SelfAssessmentRatingSystem | undefined>(undefined);
  const [copiedTenPointYesMinRating, setCopiedTenPointYesMinRating] = useState<number | undefined>(undefined);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: reviewCycles = [], isLoading: reviewCyclesLoading } = useGetReviewCyclesQuery({
    requiresEmployeeSubmission: true,
  });

  const selectableReviewCycles = useMemo(() => {
    return reviewCycles
      .filter((c) => {
        const st = c.status?.toUpperCase();
        return st === 'ACTIVE' || st === 'UPCOMING';
      })
      .slice()
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [reviewCycles]);

  useEffect(() => {
    if (timelineMode === 'MANUAL') {
      return;
    }
    if (selectedReviewCycleId != null || selectableReviewCycles.length === 0) {
      return;
    }
    const activeFirst =
      selectableReviewCycles.find((c) => c.status?.toUpperCase() === 'ACTIVE') ?? selectableReviewCycles[0];
    setSelectedReviewCycleId(activeFirst.id);
  }, [selectableReviewCycles, selectedReviewCycleId, timelineMode]);
  const selectedReviewCycle = useMemo(
    () => selectableReviewCycles.find((cycle) => cycle.id === selectedReviewCycleId) ?? null,
    [selectableReviewCycles, selectedReviewCycleId]
  );

  const { data: departmentsResponse } = useGetDepartmentsQuery();
  const departments = useMemo(
    () => (departmentsResponse?.data || []).map(normalizeDepartment).filter((department) => department.id && department.name),
    [departmentsResponse?.data]
  );

  const { data: positionsResponse } = useGetPositionsByDepartmentQuery();
  const positions = useMemo(
    () => (positionsResponse?.data || []).map(normalizePosition).filter((position) => position.id && position.name),
    [positionsResponse?.data]
  );

  const { data: employeesResponse } = useGetEmployeesQuery({
    page: 0,
    size: 10000,
    sortBy: 'employeeId',
    sortDir: 'asc',
  });

  const activeEmployees = useMemo(
    () => (employeesResponse?.data?.content || []).filter(employeeIsActive),
    [employeesResponse?.data?.content]
  );

  const departmentById = useMemo(() => new Map(departments.map((department) => [department.id, department])), [departments]);
  const departmentIdByName = useMemo(
    () =>
      new Map(
        departments
          .map((department) => [normalizeLookupKey(department.name), department.id] as const)
          .filter(([name]) => name)
      ),
    [departments]
  );
  const positionById = useMemo(() => new Map(positions.map((position) => [position.id, position])), [positions]);
  const positionIdByName = useMemo(
    () =>
      new Map(
        positions
          .map((position) => [normalizeLookupKey(position.name), position.id] as const)
          .filter(([name]) => name)
      ),
    [positions]
  );

  const employeeCountByDepartmentId = useMemo(() => {
    const counts = new Map<number, number>();
    departments.forEach((department) => counts.set(department.id, 0));
    activeEmployees.forEach((employee) => {
      const departmentId = departmentIdByName.get(normalizeLookupKey(employee.departmentName));
      if (departmentId) {
        counts.set(departmentId, (counts.get(departmentId) ?? 0) + 1);
      }
    });
    return counts;
  }, [activeEmployees, departmentIdByName, departments]);

  const positionAudienceStats = useMemo(() => {
    const map = new Map<number, { count: number; departments: Set<string> }>();
    positions.forEach((position) => map.set(position.id, { count: 0, departments: new Set<string>() }));

    activeEmployees.forEach((employee) => {
      const positionId = positionIdByName.get(normalizeLookupKey(employee.positionName));
      if (!positionId || !map.has(positionId)) {
        return;
      }
      const entry = map.get(positionId)!;
      entry.count += 1;
      const deptName = typeof employee.departmentName === 'string' ? employee.departmentName.trim() : '';
      if (deptName) {
        entry.departments.add(deptName);
      }
    });

    const result = new Map<number, { count: number; departmentNames: string[] }>();
    map.forEach((entry, positionId) => {
      result.set(positionId, {
        count: entry.count,
        departmentNames: Array.from(entry.departments).sort((a, b) => a.localeCompare(b)),
      });
    });
    return result;
  }, [activeEmployees, positionIdByName, positions]);

  const filteredPositionsForAudience = useMemo(() => {
    const query = positionAudienceSearch.trim().toLowerCase();
    if (!query) {
      return positions;
    }
    return positions.filter((position) => position.name.toLowerCase().includes(query));
  }, [positions, positionAudienceSearch]);

  const activeEmployeePairs = useMemo(() => {
    const pairs = new Map<string, TargetPair>();

    activeEmployees.forEach((employee) => {
      const departmentName = normalizeLookupKey(employee.departmentName);
      const positionName = normalizeLookupKey(employee.positionName);
      if (!departmentName || !positionName) {
        return;
      }

      const departmentId = departmentIdByName.get(departmentName);
      const positionId = positionIdByName.get(positionName);
      if (!departmentId || !positionId) {
        return;
      }

      pairs.set(`${departmentId}-${positionId}`, {
        departmentId,
        departmentName: employee.departmentName,
        positionId,
        positionName: employee.positionName,
      });
    });

    return Array.from(pairs.values());
  }, [activeEmployees, departmentIdByName, positionIdByName]);

  const countEmployees = (predicate: (employee: EmployeeListItem) => boolean) =>
    activeEmployees.filter(predicate).length;

  const allCount = activeEmployees.length;
  const departmentCount = countEmployees((employee) =>
    selectedDepartmentIds.some((departmentId) => departmentById.get(departmentId)?.name === employee.departmentName)
  );

  const selectedDepartmentEmployeeTotal = useMemo(
    () =>
      selectedDepartmentIds.reduce((sum, id) => sum + (employeeCountByDepartmentId.get(id) ?? 0), 0),
    [selectedDepartmentIds, employeeCountByDepartmentId]
  );

  const selectedGlobalPositionEmployeeTotal = useMemo(
    () =>
      selectedGlobalPositionIds.reduce((sum, id) => sum + (positionAudienceStats.get(id)?.count ?? 0), 0),
    [selectedGlobalPositionIds, positionAudienceStats]
  );

  const positionCount = countEmployees((employee) =>
    selectedGlobalPositionIds.some((positionId) => positionById.get(positionId)?.name === employee.positionName)
  );

  const hybridPairsDeduped = useMemo(() => {
    const merged: TargetPair[] = [];
    const seen = new Set<string>();

    for (const rule of hybridRules) {
      if (!rule.departmentId) {
        continue;
      }

      if (rule.positionId == null) {
        activeEmployeePairs.forEach((pair) => {
          if (pair.departmentId !== rule.departmentId) {
            return;
          }
          const key = `${pair.departmentId}-${pair.positionId}`;
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(pair);
          }
        });
      } else {
        const pair = activeEmployeePairs.find(
          (p) => p.departmentId === rule.departmentId && p.positionId === rule.positionId
        );
        if (pair) {
          const key = `${pair.departmentId}-${pair.positionId}`;
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(pair);
          }
        }
      }
    }

    return merged;
  }, [hybridRules, activeEmployeePairs]);

  const hybridPairKeySet = useMemo(
    () => new Set(hybridPairsDeduped.map((p) => `${p.departmentId}-${p.positionId}`)),
    [hybridPairsDeduped]
  );

  const hybridCount = useMemo(
    () =>
      activeEmployees.filter((employee) => {
        const did = departmentIdByName.get(normalizeLookupKey(employee.departmentName));
        const pid = positionIdByName.get(normalizeLookupKey(employee.positionName));
        if (!did || !pid) {
          return false;
        }
        return hybridPairKeySet.has(`${did}-${pid}`);
      }).length,
    [activeEmployees, departmentIdByName, hybridPairKeySet, positionIdByName]
  );

  const hybridSummary = useMemo(() => {
    const cumulative = new Set<number>();
    const lines: { label: string; rawCount: number; newCount: number; showDedupe: boolean }[] = [];

    for (const rule of hybridRules) {
      if (!rule.departmentId) {
        continue;
      }

      const department = departmentById.get(rule.departmentId);
      if (!department) {
        continue;
      }

      const ids = new Set<number>();
      activeEmployees.forEach((employee) => {
        const did = departmentIdByName.get(normalizeLookupKey(employee.departmentName));
        const pid = positionIdByName.get(normalizeLookupKey(employee.positionName));
        if (!did || !pid || did !== rule.departmentId) {
          return;
        }
        if (rule.positionId != null && pid !== rule.positionId) {
          return;
        }
        ids.add(employee.employeeId);
      });

      const rawCount = ids.size;
      let newCount = 0;
      ids.forEach((employeeId) => {
        if (!cumulative.has(employeeId)) {
          newCount += 1;
        }
      });
      ids.forEach((employeeId) => cumulative.add(employeeId));

      const positionLabel =
        rule.positionId == null ? 'All Positions' : positionById.get(rule.positionId)?.name ?? '—';

      lines.push({
        label: `${department.name} -> ${positionLabel}`,
        rawCount,
        newCount,
        showDedupe: rawCount > newCount && rawCount > 0,
      });
    }

    return { lines, totalUnique: cumulative.size };
  }, [
    activeEmployees,
    departmentById,
    departmentIdByName,
    hybridRules,
    positionById,
    positionIdByName,
  ]);

  const {
    data: selfAssessmentSettings,
    isLoading: selfAssessmentSettingsLoading,
    isError: selfAssessmentSettingsError,
  } = useGetSelfAssessmentSettingsQuery();
  const previewRatingSystem = copiedRatingSystem ?? selfAssessmentSettings?.ratingSystem;
  const previewTenPointYesMinRating =
    copiedTenPointYesMinRating ?? selfAssessmentSettings?.tenPointYesMinRating;

  const [createTemplate, { isLoading: isCreating }] = useCreateTemplateMutation();
  const [checkActiveTemplateConflicts] = useCheckActiveTemplateConflictsMutation();
  const [deleteCopiedTemplate] = useDeleteCopiedTemplateMutation();
  const [createQuestionBankItem, { isLoading: isSavingToQuestionBank }] =
    useCreateQuestionBankItemMutation();
  const { data: copiedTemplate } = useGetCopiedTemplateQuery(undefined, {
    skip: !isPastingCopiedTemplate,
  });
  const { data: questionBank = [], isLoading: isQuestionBankLoading } = useGetQuestionBankQuery(
    { includeInactive: false },
    { skip: !isQuestionBankOpen }
  );

  const filteredQuestionBank = questionBank.filter((question) =>
    question.questionText.toLowerCase().includes(questionBankSearch.trim().toLowerCase())
  );

  const { register, control, handleSubmit, getValues, reset, setValue, watch } = useForm<QuestionFormData>({
    defaultValues: {
      title: '',
      questions: [{ questionText: '' }],
    },
  });
  const watchedTitle = watch('title');
  const watchedQuestions = watch('questions');

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'questions',
  });

  const questionDragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!isPastingCopiedTemplate || !copiedTemplate) {
      return;
    }
    reset({
      title: copiedTemplate.title,
      questions:
        copiedTemplate.questions.length > 0
          ? copiedTemplate.questions.map((question) => ({ questionText: question.questionText }))
          : [{ questionText: '' }],
    });
    setCopiedSourceTitle(copiedTemplate.title);
    setCopiedDeletedQuestions(
      copiedTemplate.deletedQuestions
        .filter((question) => question.questionText.trim())
        .map((question, index) => ({
          questionText: question.questionText,
          sortOrder: question.sortOrder ?? copiedTemplate.questions.length + index,
        }))
    );
    setCopiedRatingSystem(copiedTemplate.ratingSystem);
    setCopiedTenPointYesMinRating(copiedTemplate.tenPointYesMinRating);

    const copiedDeptId =
      typeof copiedTemplate.departmentId === 'number' && copiedTemplate.departmentId > 0
        ? copiedTemplate.departmentId
        : null;
    const copiedPosId =
      typeof copiedTemplate.positionId === 'number' && copiedTemplate.positionId > 0
        ? copiedTemplate.positionId
        : null;

    if (copiedDeptId != null) {
      setSelectedDepartmentIds([copiedDeptId]);
      setHybridRules([
        {
          id: createHybridRuleId(),
          departmentId: copiedDeptId,
          positionId: copiedPosId,
          departmentLabel: copiedTemplate.departmentName?.trim() || undefined,
          positionLabel: copiedTemplate.positionName?.trim() || undefined,
        },
      ]);
    }
    if (copiedPosId != null) {
      setSelectedGlobalPositionIds([copiedPosId]);
    }
  }, [copiedTemplate, isPastingCopiedTemplate, reset]);

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

  const toggleDepartment = (departmentId: number) => {
    setSelectedDepartmentIds((current) =>
      current.includes(departmentId) ? current.filter((id) => id !== departmentId) : [...current, departmentId]
    );
  };

  const toggleGlobalPosition = (positionId: number) => {
    setSelectedGlobalPositionIds((current) =>
      current.includes(positionId) ? current.filter((id) => id !== positionId) : [...current, positionId]
    );
  };

  const updateHybridRuleDepartment = (ruleId: string, departmentId: number | null) => {
    setHybridRules((rules) =>
      rules.map((rule) =>
        rule.id === ruleId
          ? { ...rule, departmentId, positionId: null, departmentLabel: undefined, positionLabel: undefined }
          : rule
      )
    );
  };

  const updateHybridRulePosition = (ruleId: string, positionId: number | null) => {
    setHybridRules((rules) =>
      rules.map((rule) =>
        rule.id === ruleId ? { ...rule, positionId, positionLabel: undefined } : rule
      )
    );
  };

  const addHybridRule = () => {
    setHybridRules((rules) => [...rules, { id: createHybridRuleId(), departmentId: null, positionId: null }]);
  };

  const removeHybridRule = (ruleId: string) => {
    setHybridRules((rules) => {
      const next = rules.filter((rule) => rule.id !== ruleId);
      return next.length > 0 ? next : [{ id: createHybridRuleId(), departmentId: null, positionId: null }];
    });
  };

  const getTargetPairs = (): TargetPair[] => {
    if (audienceType === 'all') {
      return activeEmployeePairs;
    }

    if (audienceType === 'departments') {
      return activeEmployeePairs.filter((pair) => selectedDepartmentIds.includes(pair.departmentId));
    }

    if (audienceType === 'positions') {
      return activeEmployeePairs.filter((pair) => selectedGlobalPositionIds.includes(pair.positionId));
    }

    return hybridPairsDeduped;
  };

  const previewAudienceLabels = useMemo(() => {
    if (audienceType === 'all') {
      return allCount > 0 ? [`All Employees (${formatEmployeeCount(allCount)})`] : ['All Employees'];
    }
    if (audienceType === 'departments') {
      return selectedDepartmentIds
        .map((id) => departmentById.get(id)?.name)
        .filter((name): name is string => !!name);
    }
    if (audienceType === 'positions') {
      return selectedGlobalPositionIds
        .map((id) => positionById.get(id)?.name)
        .filter((name): name is string => !!name);
    }
    return hybridRules
      .filter((rule) => rule.departmentId != null)
      .map((rule) => {
        const department = rule.departmentId ? departmentById.get(rule.departmentId)?.name ?? rule.departmentLabel : null;
        const position =
          rule.positionId == null ? 'All Positions' : positionById.get(rule.positionId)?.name ?? rule.positionLabel;
        return department ? `${department} / ${position ?? 'All Positions'}` : '';
      })
      .filter(Boolean);
  }, [
    allCount,
    audienceType,
    departmentById,
    hybridRules,
    positionById,
    selectedDepartmentIds,
    selectedGlobalPositionIds,
  ]);

  const previewPrimaryTarget = useMemo(() => {
    const pairs = getTargetPairs();
    return pairs[0] ?? null;
  }, [audienceType, activeEmployeePairs, hybridPairsDeduped, selectedDepartmentIds, selectedGlobalPositionIds]);

  const previewReviewCycleDetail =
    timelineMode === 'MANUAL' && manualStartDate && manualEndDate
      ? `${formatCycleDate(manualStartDate)} - ${formatCycleDate(manualEndDate)}`
      : selectedReviewCycle
        ? `${formatCycleDate(selectedReviewCycle.startDate)} - ${formatCycleDate(selectedReviewCycle.endDate)}`
        : null;

  const validateAudience = () => {
    if (audienceType === 'departments' && selectedDepartmentIds.length === 0) {
      toast.error('Please select at least one department');
      return false;
    }

    if (audienceType === 'positions' && selectedGlobalPositionIds.length === 0) {
      toast.error('Please select at least one position');
      return false;
    }

    if (audienceType === 'hybrid') {
      const hasCompleteRule = hybridRules.some((rule) => rule.departmentId != null);
      if (!hasCompleteRule) {
        toast.error('Please add at least one hybrid rule with a department');
        return false;
      }
    }

    return true;
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
      append({ questionText: trimmed });
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
      toast.error(getErrorMessage(error, 'Could not save to Question Bank'));
    }
  };

  const onSubmit = async (data: QuestionFormData) => {
    if (!data.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (copiedSourceTitle != null && data.title.trim() === copiedSourceTitle.trim()) {
      toast.error('Please edit the copied template title before creating a new template');
      return;
    }

    if (!validateAudience()) {
      return;
    }

    if (timelineMode === 'REVIEW_CYCLE' && selectedReviewCycleId == null) {
      toast.error(
        selectableReviewCycles.length === 0
          ? 'No active or upcoming employee-submission review cycle is available'
          : 'Please select a review cycle'
      );
      return;
    }
    if (timelineMode === 'MANUAL') {
      if (!manualStartDate || !manualEndDate) {
        toast.error('Please select manual start and end dates');
        return;
      }
      if (manualStartDate > manualEndDate) {
        toast.error('Manual end date cannot be earlier than the start date');
        return;
      }
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

    const targetPairs = getTargetPairs();
    if (targetPairs.length === 0) {
      toast.error('No active employees match the selected audience');
      return;
    }

    const uniqueTargetPairs = Array.from(
      new Map(targetPairs.map((pair) => [`${pair.departmentId}-${pair.positionId}`, pair])).values()
    );

    try {
      if (timelineMode === 'REVIEW_CYCLE') {
        const conflicts = await checkActiveTemplateConflicts({
          reviewCycleId: selectedReviewCycleId as number,
          targets: uniqueTargetPairs.map((pair) => ({
            departmentId: pair.departmentId,
            positionId: pair.positionId,
          })),
        }).unwrap();

        if (conflicts.length > 0) {
          const conflictLabels = conflicts
            .slice(0, 5)
            .map((conflict) => `${conflict.departmentName} / ${conflict.positionName}`)
            .join(', ');
          const remaining = conflicts.length > 5 ? `, and ${conflicts.length - 5} more` : '';
          toast.error(`Active template already exists for: ${conflictLabels}${remaining}`);
          return;
        }
      }

      let createdCount = 0;
      const failures: string[] = [];

      for (const pair of uniqueTargetPairs) {
        try {
          await createTemplate({
            title: data.title.trim(),
            departmentId: pair.departmentId,
            positionId: pair.positionId,
            questions,
            deletedQuestions: copiedDeletedQuestions,
            reviewCycleId: timelineMode === 'MANUAL' ? null : selectedReviewCycleId,
            timelineMode,
            manualStartDate: timelineMode === 'MANUAL' ? manualStartDate : null,
            manualEndDate: timelineMode === 'MANUAL' ? manualEndDate : null,
            ratingSystem: copiedRatingSystem,
            tenPointYesMinRating: copiedTenPointYesMinRating,
          }).unwrap();
          createdCount += 1;
        } catch (error: unknown) {
          failures.push(`${pair.departmentName} / ${pair.positionName}: ${getErrorMessage(error, 'Failed to create template')}`);
        }
      }

      if (createdCount === 0) {
        toast.error(failures[0] || 'Failed to create template');
        return;
      }

      if (failures.length > 0) {
        toast.error(`${createdCount} template(s) created, ${failures.length} skipped because they could not be created`);
      } else {
        toast.success(createdCount === 1 ? 'Template created successfully' : `${createdCount} templates created successfully`);
      }
      if (isPastingCopiedTemplate) {
        try {
          await deleteCopiedTemplate().unwrap();
        } catch {
          toast.error('Template created, but the duplicate draft could not be cleared');
        }
      }
      if (timelineMode === 'MANUAL') {
        navigate(
          `/hr/self-assessment/assignments/assign?timelineMode=MANUAL&manualStartDate=${manualStartDate}&manualEndDate=${manualEndDate}`
        );
      } else {
        navigate('/hr/self-assessment/templates');
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to create template'));
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 animate-fade-in-up">
          <button
            type="button"
            onClick={() => navigate('/hr/self-assessment/templates')}
            className="group mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
            Back to Templates
          </button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] shadow-lg shadow-[#2463eb]/20">
                  <ClipboardList size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Create New Template
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Build a self-assessment form and assign it to your target audience
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Review Cycle Banner */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <SelfAssessmentReviewCycleInfo primaryColor="#2463eb" primaryColorDark="#1d4ed8" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* ─── Step 1: Review Cycle & Details ─── */}
          <div
            className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/90 animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
          >
            <div className="mb-5">
              <StepBadge step={1} label="Cycle & Details" icon={<CalendarCheck size={17} />} />
            </div>

            <div className="space-y-5">
              {/* Timeline */}
              <div>
                <label
                  htmlFor="create-template-review-cycle"
                  className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Timeline
                </label>
                <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                  Templates are stored per review cycle, or as a manual date range when needed.
                </p>
                {reviewCyclesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#2463eb]" />
                    Loading review cycles...
                  </div>
                ) : selectableReviewCycles.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
	                    No active or upcoming employee-submission cycles found. Generate or adjust cycles in <Link to="/hr/settings/system/time" className="font-semibold underline">Time Settings</Link>, or{' '}
	                    <button type="button" onClick={() => setTimelineMode('MANUAL')} className="font-semibold underline">
	                      use Manual Entry
	                    </button>.
                  </div>
                ) : (
                  <select
                    id="create-template-review-cycle"
	                    value={timelineMode === 'MANUAL' ? 'MANUAL' : selectedReviewCycleId ?? ''}
                    onChange={(event) => {
                      const value = event.target.value;
	                      if (value === 'MANUAL') {
	                        setTimelineMode('MANUAL');
	                        setSelectedReviewCycleId(null);
	                      } else {
	                        setTimelineMode('REVIEW_CYCLE');
	                        setSelectedReviewCycleId(value ? Number(value) : null);
	                      }
                    }}
                    className="max-w-xl w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#2463eb] focus:outline-none focus:ring-1 focus:ring-[#2463eb] dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  >
                    {selectableReviewCycles.map((cycle) => {
                      const suffix = reviewCycleOptionSuffix(cycle.status);
                      return (
                        <option key={cycle.id} value={cycle.id}>
                          {cycle.name} ({cycle.yearLabel}) — {formatCycleDate(cycle.startDate)} –{' '}
                          {formatCycleDate(cycle.endDate)}
                          {suffix ? ` · ${suffix}` : ''}
                        </option>
                      );
                    })}
	                    <option value="MANUAL">Manual Entry (not recommended)</option>
	                  </select>
                )}
                {timelineMode === 'MANUAL' && (
                  <div className="mt-4 grid max-w-xl gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Start Date
                      </span>
                      <input
                        type="date"
                        value={manualStartDate}
                        onChange={(event) => setManualStartDate(event.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#2463eb] focus:outline-none focus:ring-1 focus:ring-[#2463eb] dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        End Date
                      </span>
                      <input
                        type="date"
                        value={manualEndDate}
                        min={manualStartDate || undefined}
                        onChange={(event) => setManualEndDate(event.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#2463eb] focus:outline-none focus:ring-1 focus:ring-[#2463eb] dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Rating Scale Info */}
              <div className="rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50/80 to-slate-50 p-4 dark:border-slate-600/50 dark:from-slate-900/60 dark:to-slate-800/60">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                    <Crown size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Rating Scale Preview</h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Employees answer Yes/No then pick a score. Matches{' '}
                      <Link
                        to="/hr/self-assessment/settings"
                        className="font-semibold text-[#2463eb] hover:underline dark:text-[#60a5fa]"
                      >
                        Self Assessment Settings
                      </Link>
                      .
                    </p>
                    {selfAssessmentSettingsLoading ? (
                      <p className="mt-2 text-xs text-slate-400">Loading...</p>
                    ) : selfAssessmentSettingsError ? (
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        Could not load settings. Server defaults will apply.
                      </p>
                    ) : previewRatingSystem ? (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Scale: <span className="text-slate-900 dark:text-white">{ratingSystemLabels[previewRatingSystem]}</span>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/80 px-3 py-2 dark:border-emerald-800/40 dark:bg-emerald-950/20">
                            <dt className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                              Yes — scores
                            </dt>
                            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-800 dark:text-emerald-200">
                              {getRatingOptions(
                                previewRatingSystem,
                                'Yes',
                                previewTenPointYesMinRating,
                              ).join(', ')}
                            </dd>
                          </div>
                          <div className="rounded-lg border border-rose-200/60 bg-rose-50/80 px-3 py-2 dark:border-rose-800/40 dark:bg-rose-950/20">
                            <dt className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                              No — scores
                            </dt>
                            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-rose-800 dark:text-rose-200">
                              {getRatingOptions(
                                previewRatingSystem,
                                'No',
                                previewTenPointYesMinRating,
                              ).join(', ')}
                            </dd>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Template Title
                </label>
                <div className="relative">
                  <input
                    {...register('title')}
                    type="text"
                    maxLength={50}
                    placeholder="e.g. Q1 Performance Self-Evaluation"
                    className={inputBase}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    {watchedTitle.length}/50
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Step 2: Audience ─── */}
          <div
            className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/90 animate-fade-in-up"
            style={{ animationDelay: '150ms' }}
          >
            <div className="mb-5">
              <StepBadge step={2} label="Target Audience" icon={<Target size={17} />} />
              <p className="mt-1.5 pl-12 text-sm text-slate-500 dark:text-slate-400">
                Choose who should receive this self-assessment template.
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              <AudienceCard
                value="all"
                selected={audienceType === 'all'}
                title="All Employees"
                description={[
                  'Company-wide distribution',
                  ...(allCount > 0 ? [`${formatEmployeeCount(allCount)} will receive`] : []),
                ]}
                icon={<Users size={18} />}
                badge={createCountBadge(allCount, 'blue')}
                onSelect={setAudienceType}
                accent="blue"
              />
              <AudienceCard
                value="departments"
                selected={audienceType === 'departments'}
                title="By Department"
                description={[
                  'Select specific departments',
                  'All positions within them',
                ]}
                icon={<Building2 size={18} />}
                badge={createCountBadge(departmentCount, 'blue')}
                onSelect={setAudienceType}
                accent="blue"
              />
              <AudienceCard
                value="positions"
                selected={audienceType === 'positions'}
                title="By Position"
                description={[
                  'Select specific job titles',
                  'Across any department',
                ]}
                icon={<BriefcaseBusiness size={18} />}
                badge={createCountBadge(positionCount, 'blue')}
                onSelect={setAudienceType}
                accent="blue"
              />
              <AudienceCard
                value="hybrid"
                selected={audienceType === 'hybrid'}
                title="Hybrid"
                description={[
                  'Most flexible option',
                  'Dept + position combos',
                ]}
                icon={<Layers3 size={18} />}
                badge={createCountBadge(hybridCount, 'blue')}
                onSelect={setAudienceType}
                accent="blue"
              />
            </div>

            {audienceType === 'departments' && (
              <div className="mt-5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 dark:border-slate-600/50 dark:bg-slate-900/30">
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#2463eb]/10 text-[#2463eb] dark:bg-[#2463eb]/20 dark:text-[#60a5fa]">
                    <Building2 size={14} />
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Select Departments
                  </h3>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600">
                  {departments.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      No departments available
                    </p>
                  ) : (
                    <ul
                      className={`divide-y divide-slate-100 bg-white dark:divide-slate-700 dark:bg-slate-800 ${
                        departments.length > 5 ? 'max-h-60 overflow-y-auto' : ''
                      }`}
                    >
                      {departments.map((department) => {
                        const empCount = employeeCountByDepartmentId.get(department.id) ?? 0;
                        const checked = selectedDepartmentIds.includes(department.id);
                        return (
                          <li key={department.id}>
                            <label
                              className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-all ${
                                checked
                                  ? 'bg-[#2463eb]/[0.04] dark:bg-[#2463eb]/10'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                              }`}
                            >
                              <div className="relative flex items-center">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleDepartment(department.id)}
                                  className="peer sr-only"
                                />
                                <div className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-slate-300 transition-all peer-checked:border-[#2463eb] peer-checked:bg-[#2463eb] dark:border-slate-500">
                                  <svg
                                    className={`h-3 w-3 text-white transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                              <span className="min-w-0 flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                                {department.name}
                              </span>
                              {empCount > 0 ? (
                                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                  {formatEmployeeCount(empCount)}
                                </span>
                              ) : null}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 rounded-lg bg-[#2463eb]/[0.06] px-3 py-1.5 text-sm font-semibold text-[#2463eb] dark:bg-[#2463eb]/15 dark:text-[#60a5fa]">
                    <span className="tabular-nums">{selectedDepartmentIds.length}</span> departments
                    <span className="text-[#2463eb]/40 dark:text-[#60a5fa]/40">|</span>
                    <span className="tabular-nums">{selectedDepartmentEmployeeTotal}</span> employees
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDepartmentIds(departments.map((d) => d.id))}
                      disabled={departments.length === 0}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDepartmentIds([])}
                      disabled={selectedDepartmentIds.length === 0}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

            {audienceType === 'positions' && (
              <div className="mt-5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 dark:border-slate-600/50 dark:bg-slate-900/30">
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#2463eb]/10 text-[#2463eb] dark:bg-[#2463eb]/20 dark:text-[#60a5fa]">
                    <BriefcaseBusiness size={14} />
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Select Positions
                  </h3>
                </div>

                <div className="relative mb-3">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={positionAudienceSearch}
                    onChange={(event) => setPositionAudienceSearch(event.target.value)}
                    placeholder="Search positions..."
                    className={`${inputBase} pl-9`}
                  />
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600">
                  {filteredPositionsForAudience.length === 0 ? (
                    <p className="bg-white px-4 py-8 text-center text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {positions.length === 0 ? 'No positions available' : 'No positions match your search'}
                    </p>
                  ) : (
                    <ul
                      className={`divide-y divide-slate-100 bg-white dark:divide-slate-700 dark:bg-slate-800 ${
                        filteredPositionsForAudience.length > 5 ? 'max-h-60 overflow-y-auto' : ''
                      }`}
                    >
                      {filteredPositionsForAudience.map((position) => {
                        const stats = positionAudienceStats.get(position.id);
                        const empCount = stats?.count ?? 0;
                        const deptNames = stats?.departmentNames ?? [];
                        const checked = selectedGlobalPositionIds.includes(position.id);
                        const acrossLabel =
                          deptNames.length > 0
                            ? empCount > 0
                              ? `(${empCount} ${empCount === 1 ? 'employee' : 'employees'} across ${deptNames.join(', ')})`
                              : ''
                            : empCount > 0
                              ? `(${formatEmployeeCount(empCount)})`
                              : '';

                        return (
                          <li key={position.id}>
                            <label
                              className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-all ${
                                checked
                                  ? 'bg-[#2463eb]/[0.04] dark:bg-[#2463eb]/10'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                              }`}
                            >
                              <div className="relative mt-0.5 flex items-center">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleGlobalPosition(position.id)}
                                  className="peer sr-only"
                                />
                                <div className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-slate-300 transition-all peer-checked:border-[#2463eb] peer-checked:bg-[#2463eb] dark:border-slate-500">
                                  <svg
                                    className={`h-3 w-3 text-white transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                              <span className="min-w-0 flex-1 text-sm leading-snug">
                                <span className="font-medium text-slate-900 dark:text-slate-100">{position.name}</span>
                                {checked && acrossLabel ? (
                                  <span className="text-slate-500 dark:text-slate-400"> {acrossLabel}</span>
                                ) : null}
                              </span>
                              {!checked && empCount > 0 ? (
                                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                  {formatEmployeeCount(empCount)}
                                </span>
                              ) : null}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#2463eb]/[0.06] px-3 py-1.5 text-sm font-semibold text-[#2463eb] dark:bg-[#2463eb]/15 dark:text-[#60a5fa]">
                  <span className="tabular-nums">{selectedGlobalPositionIds.length}</span> positions
                  <span className="text-[#2463eb]/40 dark:text-[#60a5fa]/40">|</span>
                  <span className="tabular-nums">{selectedGlobalPositionEmployeeTotal}</span> employees
                </div>
              </div>
            )}

            {audienceType === 'hybrid' && (
              <div className="mt-5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 dark:border-slate-600/50 dark:bg-slate-900/30">
                <div className="mb-4 flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#2463eb]/10 text-[#2463eb] dark:bg-[#2463eb]/20 dark:text-[#60a5fa]">
                    <Layers3 size={14} />
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Hybrid Rules
                  </h3>
                  <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                    Most Flexible
                  </span>
                </div>

                <div className="space-y-2.5">
                  {hybridRules.map((rule) => (
                    <HybridRuleRow
                      key={rule.id}
                      rule={rule}
                      departments={departments}
                      onDepartmentChange={updateHybridRuleDepartment}
                      onPositionChange={updateHybridRulePosition}
                      onRemove={removeHybridRule}
                      canRemove={hybridRules.length > 1}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addHybridRule}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#2463eb] transition-all hover:bg-[#2463eb]/[0.06] dark:text-[#60a5fa] dark:hover:bg-[#2463eb]/15"
                >
                  <Plus size={15} />
                  Add Rule
                </button>

                <div className="mt-4 rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-600/50 dark:bg-slate-800/60">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2463eb] dark:text-[#60a5fa]">
                    <Users size={13} />
                    Summary
                  </h4>
                  {hybridSummary.lines.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                      Add rules above to preview matched employees.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-1.5">
                      {hybridSummary.lines.map((line, index) => (
                        <li key={`${line.label}-${index}`} className="flex items-baseline gap-2 text-sm">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                            {line.label}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {line.rawCount} {line.rawCount === 1 ? 'emp' : 'emps'}
                            {line.showDedupe ? (
                              <span className="text-amber-600 dark:text-amber-400"> ({line.newCount} unique)</span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Total unique:</span>
                    <span className="rounded-lg bg-[#2463eb]/10 px-2.5 py-0.5 text-sm font-bold tabular-nums text-[#2463eb] dark:bg-[#2463eb]/20 dark:text-[#60a5fa]">
                      {hybridSummary.totalUnique}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── Step 3: Questions ─── */}
          <div
            className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/90 animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            <div className="mb-5 flex items-center justify-between">
              <StepBadge step={3} label="Questions" icon={<ClipboardList size={17} />} />
              <button
                type="button"
                onClick={() => setIsQuestionBankOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
              >
                <BookOpen size={14} />
                Question Bank
              </button>
            </div>

            <DndContext
              sensors={questionDragSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleQuestionDragEnd}
            >
              <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2.5">
                  {fields.map((field, index) => (
                    <SortableQuestionRow
                      key={field.id}
                      fieldId={field.id}
                      index={index}
                      register={register}
                      fieldsLength={fields.length}
                      onRemove={remove}
                      onSaveToBank={handleSaveQuestionToBank}
                      isSavingToBank={isSavingToQuestionBank}
                      questionLength={watchedQuestions[index]?.questionText?.length ?? 0}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <button
              type="button"
              onClick={() => append({ questionText: '' })}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500 transition-all hover:border-[#2463eb] hover:bg-[#2463eb]/[0.03] hover:text-[#2463eb] dark:border-slate-600 dark:hover:border-[#2463eb] dark:hover:text-[#60a5fa]"
            >
              <Plus size={15} />
              Add Question
            </button>
          </div>

          {/* ─── Actions ─── */}
          <div
            className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end animate-fade-in-up"
            style={{ animationDelay: '250ms' }}
          >
            <button
              type="button"
              onClick={() => navigate('/hr/self-assessment/templates')}
              className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2463eb]/30 bg-white px-6 py-2.5 text-sm font-bold text-[#2463eb] shadow-sm transition-all hover:bg-[#2463eb]/[0.04] dark:border-[#2463eb]/40 dark:bg-slate-800 dark:text-[#60a5fa] dark:hover:bg-[#2463eb]/15"
            >
              <Eye size={16} />
              Preview Template
            </button>
            <button
              type="submit"
	              disabled={isCreating || (timelineMode === 'REVIEW_CYCLE' && (selectableReviewCycles.length === 0 || selectedReviewCycleId == null))}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#2463eb]/25 transition-all hover:shadow-xl hover:shadow-[#2463eb]/30 hover:brightness-110 disabled:opacity-50 disabled:shadow-none dark:shadow-[#2463eb]/15"
            >
              {isCreating ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Save size={16} />
              )}
              {isCreating ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>

        <SelfAssessmentTemplatePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={watchedTitle ?? ''}
          departmentLabel={previewPrimaryTarget?.departmentName ?? null}
          positionLabel={previewPrimaryTarget?.positionName ?? null}
          audienceLabels={previewAudienceLabels}
          reviewCycleLabel={timelineMode === 'MANUAL' ? 'Manual Entry' : selectedReviewCycle?.name ?? null}
          reviewCycleDetail={previewReviewCycleDetail}
          ratingSystem={previewRatingSystem}
          tenPointYesMinRating={previewTenPointYesMinRating}
          questions={watchedQuestions ?? []}
        />

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
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#2463eb]" />
                      Loading questions...
                    </div>
                  ) : filteredQuestionBank.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredQuestionBank.map((question) => (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() => handleUseBankQuestion(question.questionText)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-all hover:bg-[#2463eb]/[0.04] dark:hover:bg-[#2463eb]/10"
                        >
                          <Plus size={14} className="shrink-0 text-[#2463eb] dark:text-[#60a5fa]" />
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
