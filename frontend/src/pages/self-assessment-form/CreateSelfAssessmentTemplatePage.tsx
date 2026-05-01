import React, { useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ChartColumn,
  ChevronDown,
  ChevronUp,
  Layers3,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useGetDepartmentsQuery } from '../../features/department/api/departmentApi';
import { useGetPositionsByDepartmentQuery } from '../../features/position/api/positionApi';
import { useGetEmployeesQuery, type EmployeeListItem } from '../../features/hrEmployeeList/hrEmployeeApi';
import {
  useCreateTemplateMutation,
  useGetQuestionBankQuery,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';

interface QuestionFormData {
  title: string;
  questions: { questionText: string }[];
}

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
  /** `null` = all positions in the selected department */
  positionId: number | null;
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

const formatEmployeeCount = (count: number) => `${count} ${count === 1 ? 'employee' : 'employees'}`;

const createCountBadge = (count: number): React.ReactNode =>
  count > 0 ? (
    <span className="shrink-0 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-blue-900 dark:bg-sky-950/50 dark:text-sky-200">
      {formatEmployeeCount(count)}
    </span>
  ) : null;

interface AudienceCardProps {
  value: AudienceType;
  selected: boolean;
  title: string;
  description: string[];
  icon: React.ReactNode;
  badge?: React.ReactNode;
  onSelect: (value: AudienceType) => void;
}

const AudienceCard: React.FC<AudienceCardProps> = ({
  value,
  selected,
  title,
  description,
  icon,
  badge,
  onSelect,
}) => (
  <button
    type="button"
    onClick={() => onSelect(value)}
    className={`w-full rounded-xl border p-4 text-left transition ${
      selected
        ? 'border-2 border-[#5D5FEF] bg-[#5D5FEF]/[0.07] shadow-sm dark:border-[#7C7EF5] dark:bg-[#5D5FEF]/15'
        : 'border border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600'
    }`}
  >
    <div className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? 'border-[#5D5FEF]' : 'border-slate-300 dark:border-slate-500'
        }`}
        aria-hidden
      >
        <span
          className={`h-2.5 w-2.5 rounded-full ${selected ? 'bg-[#5D5FEF]' : 'bg-transparent'}`}
        />
      </span>
      <div className="flex min-w-0 flex-1 gap-3">
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            selected
              ? 'bg-[#5D5FEF]/15 text-[#4F52D9] dark:bg-[#5D5FEF]/25 dark:text-[#A5A7FA]'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
          }`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3
              className={`text-sm font-bold ${selected ? 'text-blue-950 dark:text-white' : 'text-slate-900 dark:text-white'}`}
            >
              {title}
            </h3>
            {badge ? (
              <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                {badge}
              </div>
            ) : null}
          </div>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs marker:text-slate-300 dark:marker:text-slate-600">
            {description.map((line) => (
              <li key={line} className="text-slate-500 dark:text-slate-400">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </button>
);

interface HybridRuleRowProps {
  rule: HybridRule;
  departments: DepartmentOption[];
  onDepartmentChange: (ruleId: string, departmentId: number | null) => void;
  onPositionChange: (ruleId: string, positionId: number | null) => void;
  onRemove: (ruleId: string) => void;
  canRemove: boolean;
}

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

  const selectFocus =
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#5D5FEF] focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/25 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-[#5D5FEF] dark:disabled:bg-slate-900';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Department"
        value={rule.departmentId ?? ''}
        onChange={(event) => {
          const value = event.target.value;
          onDepartmentChange(rule.id, value ? Number(value) : null);
        }}
        className={`min-w-[140px] flex-1 ${selectFocus}`}
      >
        <option value="">Select department</option>
        {departments.map((department) => (
          <option key={department.id} value={department.id}>
            {department.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Position"
        value={rule.positionId === null || rule.positionId === undefined ? '' : String(rule.positionId)}
        disabled={!rule.departmentId}
        onChange={(event) => {
          const value = event.target.value;
          onPositionChange(rule.id, value ? Number(value) : null);
        }}
        className={`min-w-[160px] flex-1 ${selectFocus}`}
      >
        <option value="">All Positions</option>
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
      <button
        type="button"
        onClick={() => onRemove(rule.id)}
        disabled={!canRemove}
        className="shrink-0 rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-950/40"
        aria-label="Remove rule"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export const CreateSelfAssessmentTemplatePage: React.FC = () => {
  const navigate = useNavigate();
  const [audienceType, setAudienceType] = useState<AudienceType>('hybrid');
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<number[]>([]);
  const [selectedGlobalPositionIds, setSelectedGlobalPositionIds] = useState<number[]>([]);
  const [hybridRules, setHybridRules] = useState<HybridRule[]>(() => [
    { id: createHybridRuleId(), departmentId: null, positionId: null },
  ]);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
  const [questionBankSearch, setQuestionBankSearch] = useState('');
  const [positionAudienceSearch, setPositionAudienceSearch] = useState('');

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

  /** Active employees per global position id + distinct department names (for position-only audience UI). */
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

  const [createTemplate, { isLoading: isCreating }] = useCreateTemplateMutation();
  const { data: questionBank = [], isLoading: isQuestionBankLoading } = useGetQuestionBankQuery(
    { includeInactive: false },
    { skip: !isQuestionBankOpen }
  );

  const filteredQuestionBank = questionBank.filter((question) =>
    question.questionText.toLowerCase().includes(questionBankSearch.trim().toLowerCase())
  );

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
      rules.map((rule) => (rule.id === ruleId ? { ...rule, departmentId, positionId: null } : rule))
    );
  };

  const updateHybridRulePosition = (ruleId: string, positionId: number | null) => {
    setHybridRules((rules) =>
      rules.map((rule) => (rule.id === ruleId ? { ...rule, positionId } : rule))
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

  const handleUseBankQuestion = (questionText: string) => {
    append({ questionText });
    setIsQuestionBankOpen(false);
    setQuestionBankSearch('');
    toast.success('Question added to form');
  };

  const onSubmit = async (data: QuestionFormData) => {
    if (!data.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!validateAudience()) {
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

    const targetPairs = getTargetPairs();
    if (targetPairs.length === 0) {
      toast.error('No active employees match the selected audience');
      return;
    }

    const uniqueTargetPairs = Array.from(
      new Map(targetPairs.map((pair) => [`${pair.departmentId}-${pair.positionId}`, pair])).values()
    );

    try {
      let createdCount = 0;
      const failures: string[] = [];

      for (const pair of uniqueTargetPairs) {
        try {
          await createTemplate({
            title: data.title.trim(),
            departmentId: pair.departmentId,
            positionId: pair.positionId,
            questions,
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
      navigate('/hr/self-assessment/forms');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to create template'));
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

      <div className="max-w-5xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Form</h1>
        <p className="mt-1 mb-6 text-sm text-slate-500 dark:text-slate-400">
          Create a self-assessment template for the employees who should receive it
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Title
              </label>
              <input
                {...register('title')}
                type="text"
                placeholder="Form title"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/20">
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Audience Type Selection
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Choose who should receive this self-assessment form.
                  </p>
                </div>
              </div>

              <div className="grid w-full grid-cols-1 gap-3">
                <AudienceCard
                  value="all"
                  selected={audienceType === 'all'}
                  title="All Employees (Company-wide)"
                  description={[
                    'All active employees in the company will receive this form',
                    ...(allCount > 0 ? [`Total: ${formatEmployeeCount(allCount)}`] : []),
                  ]}
                  icon={<Users size={18} />}
                  badge={createCountBadge(allCount)}
                  onSelect={setAudienceType}
                />
                <AudienceCard
                  value="departments"
                  selected={audienceType === 'departments'}
                  title="Specific Departments Only"
                  description={[
                    'Select one or more departments',
                    'All positions in selected departments',
                  ]}
                  icon={<Building2 size={18} />}
                  badge={createCountBadge(departmentCount)}
                  onSelect={setAudienceType}
                />
                <AudienceCard
                  value="positions"
                  selected={audienceType === 'positions'}
                  title="Specific Positions Only (Across All Departments)"
                  description={[
                    'Select one or more job titles',
                    'Employees with these positions in ANY department',
                  ]}
                  icon={<BriefcaseBusiness size={18} />}
                  badge={createCountBadge(positionCount)}
                  onSelect={setAudienceType}
                />
                <AudienceCard
                  value="hybrid"
                  selected={audienceType === 'hybrid'}
                  title="Hybrid (Departments + Specific Positions)"
                  description={[
                    'Most flexible option',
                    'Select department AND specific positions within',
                  ]}
                  icon={<Layers3 size={18} />}
                  badge={createCountBadge(hybridCount)}
                  onSelect={setAudienceType}
                />
              </div>

              {audienceType === 'departments' && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-5 w-1 shrink-0 rounded-full bg-[#5D5FEF]" aria-hidden />
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                      Select Departments
                    </h3>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600">
                    {departments.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        No departments available
                      </p>
                    ) : (
                      <ul
                        className={`divide-y divide-slate-200 dark:divide-slate-600 ${
                          departments.length > 5
                            ? 'max-h-55 overflow-y-auto overscroll-y-contain'
                            : ''
                        }`}
                      >
                        {departments.map((department) => {
                          const empCount = employeeCountByDepartmentId.get(department.id) ?? 0;
                          const checked = selectedDepartmentIds.includes(department.id);
                          return (
                            <li key={department.id}>
                              <label className="flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-700/40">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleDepartment(department.id)}
                                  className="h-4 w-4 shrink-0 rounded border-slate-400 accent-[#5D5FEF] focus:ring-2 focus:ring-[#5D5FEF]/40 focus:ring-offset-0 dark:border-slate-500"
                                />
                                <span className="min-w-0 flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                                  {department.name}
                                </span>
                                {empCount > 0 ? (
                                  <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
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

                  <p className="mt-3 flex items-center gap-2 text-sm font-medium text-[#5D5FEF]">
                    <ChartColumn size={18} strokeWidth={2} className="shrink-0 opacity-90" aria-hidden />
                    <span>
                      Selected:{' '}
                      <span className="font-semibold tabular-nums">{selectedDepartmentIds.length}</span> departments /{' '}
                      <span className="font-semibold tabular-nums">{selectedDepartmentEmployeeTotal}</span> employees
                    </span>
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDepartmentIds(departments.map((d) => d.id))}
                      disabled={departments.length === 0}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDepartmentIds([])}
                      disabled={selectedDepartmentIds.length === 0}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}

              {audienceType === 'positions' && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-5 w-1 shrink-0 rounded-full bg-[#5D5FEF]" aria-hidden />
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                      Select Positions (Across All Departments)
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
                      className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#5D5FEF] focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/25 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-900/40">
                    {filteredPositionsForAudience.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        {positions.length === 0 ? 'No positions available' : 'No positions match your search'}
                      </p>
                    ) : (
                      <ul
                        className={`divide-y divide-slate-200 dark:divide-slate-600 dark:bg-slate-900/20 ${
                          filteredPositionsForAudience.length > 5
                            ? 'max-h-55 overflow-y-auto overscroll-y-contain'
                            : ''
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
                              <label className="flex cursor-pointer items-start gap-3 bg-white px-4 py-3 transition hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/50">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleGlobalPosition(position.id)}
                                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-400 accent-[#5D5FEF] focus:ring-2 focus:ring-[#5D5FEF]/40 focus:ring-offset-0 dark:border-slate-500"
                                />
                                <span className="min-w-0 flex-1 text-sm leading-snug">
                                  <span className="font-medium text-slate-900 dark:text-slate-100">{position.name}</span>
                                  {checked && acrossLabel ? (
                                    <span className="text-slate-500 dark:text-slate-400"> {acrossLabel}</span>
                                  ) : null}
                                </span>
                                {!checked && empCount > 0 ? (
                                  <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
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

                  <p className="mt-3 flex items-center gap-2 text-sm font-medium text-[#5D5FEF]">
                    <ChartColumn size={18} strokeWidth={2} className="shrink-0 opacity-90" aria-hidden />
                    <span>
                      Selected:{' '}
                      <span className="font-semibold tabular-nums">{selectedGlobalPositionIds.length}</span> positions /{' '}
                      <span className="font-semibold tabular-nums">{selectedGlobalPositionEmployeeTotal}</span>{' '}
                      employees
                    </span>
                  </p>
                </div>
              )}

              {audienceType === 'hybrid' && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-4 flex flex-wrap items-baseline gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-1 shrink-0 rounded-full bg-[#5D5FEF]" aria-hidden />
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-100">
                        Hybrid Rules
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">(Most Flexible)</span>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-900/30">
                    <div className="space-y-3">
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
                      className="mt-4 text-sm font-semibold text-[#5D5FEF] hover:text-[#4d50e0] dark:text-[#8b8ef7] dark:hover:text-[#a5a7fa]"
                    >
                      + Add Rule
                    </button>
                  </div>

                  <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-4 dark:border-sky-900/60 dark:bg-sky-950/40">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-[#5D5FEF] dark:text-[#8b8ef7]">
                      Summary
                    </h4>
                    {hybridSummary.lines.length === 0 ? (
                      <p className="mt-2 font-mono text-sm text-slate-600 dark:text-slate-400">
                        Add rules above to preview matched employees.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-2 font-mono text-sm text-slate-800 dark:text-slate-200">
                        {hybridSummary.lines.map((line, index) => (
                          <li key={`${line.label}-${index}`}>
                            <span>{line.label}</span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {' '}
                              : {line.rawCount} {line.rawCount === 1 ? 'employee' : 'employees'}
                              {line.showDedupe ? (
                                <span> (but minus duplicates = {line.newCount} new)</span>
                              ) : null}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-4 border-t border-sky-200 pt-3 text-sm font-semibold text-slate-900 dark:border-sky-800 dark:text-slate-100">
                      Total unique employees:{' '}
                      <span className="tabular-nums">{hybridSummary.totalUnique}</span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="mb-4">
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Question
              </label>
              <button
                type="button"
                onClick={() => setIsQuestionBankOpen(true)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                <BookOpen size={16} />
                Use from Question Bank
              </button>
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    aria-label="Move question up"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === fields.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    aria-label="Move question down"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <input
                    {...register(`questions.${index}.questionText` as const)}
                    placeholder={`Question ${index + 1}`}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="rounded p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      aria-label="Remove question"
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
              className="mt-3 flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              <Plus size={16} />
              Add Question
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Save size={16} />
              Create Template
            </button>
            <button
              type="button"
              onClick={() => navigate('/hr/self-assessment/forms')}
              className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
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
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
