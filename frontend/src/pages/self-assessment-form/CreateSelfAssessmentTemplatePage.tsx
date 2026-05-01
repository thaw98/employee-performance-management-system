import React, { useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  Building2,
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

const employeeIsActive = (employee: EmployeeListItem) => {
  if (employee.employeeActiveStatus) {
    return employee.employeeActiveStatus === 'ACTIVE';
  }

  return employee.employmentStatus !== 'Resigned' && employee.employmentStatus !== 'Terminated';
};

const formatEmployeeCount = (count: number) => `${count} ${count === 1 ? 'employee' : 'employees'}`;

const createCountBadge = (count: number) => (
  <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
    {formatEmployeeCount(count)}
  </span>
);

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
    className={`w-full rounded-lg border p-4 text-left transition ${
      selected
        ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 dark:border-emerald-400 dark:bg-emerald-500/10'
        : 'border-slate-200 bg-white hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-500/70'
    }`}
  >
    <div className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          selected ? 'border-emerald-500' : 'border-slate-300 dark:border-slate-500'
        }`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${selected ? 'bg-emerald-500' : 'bg-transparent'}`} />
      </span>
      <div className="flex min-w-0 flex-1 gap-3">
        <div className="flex min-w-0 flex-1 gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              selected
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
              {title.startsWith('Hybrid') && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                  Recommended
                </span>
              )}
            </div>
            <div className="mt-1 space-y-0.5">
              {description.map((line) => (
                <p key={line} className="text-xs text-slate-500 dark:text-slate-400">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
        {badge}
      </div>
    </div>
  </button>
);

interface HybridPositionSelectorProps {
  departmentId: number;
  departmentName: string;
  selectedPositionId: number | null;
  onChange: (departmentId: number, positionId: number | null) => void;
}

const HybridPositionSelector: React.FC<HybridPositionSelectorProps> = ({
  departmentId,
  departmentName,
  selectedPositionId,
  onChange,
}) => {
  const { data: positionsResponse } = useGetPositionsByDepartmentQuery(departmentId);
  const positions = (positionsResponse?.data || []).map(normalizePosition).filter((position) => position.id && position.name);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/30">
      <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
        {departmentName}
      </label>
      <select
        value={selectedPositionId || ''}
        onChange={(event) => onChange(departmentId, event.target.value ? Number(event.target.value) : null)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
      >
        <option value="">Select Position</option>
        {positions.length === 0 && (
          <option value="" disabled>No active positions for this department</option>
        )}
        {positions.map((position) => (
          <option key={position.id} value={position.id}>{position.name}</option>
        ))}
      </select>
    </div>
  );
};

export const CreateSelfAssessmentTemplatePage: React.FC = () => {
  const navigate = useNavigate();
  const [audienceType, setAudienceType] = useState<AudienceType>('hybrid');
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<number[]>([]);
  const [selectedGlobalPositionIds, setSelectedGlobalPositionIds] = useState<number[]>([]);
  const [hybridDepartmentIds, setHybridDepartmentIds] = useState<number[]>([]);
  const [hybridPositionByDepartment, setHybridPositionByDepartment] = useState<Record<number, number | null>>({});
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
  const [questionBankSearch, setQuestionBankSearch] = useState('');

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
    () => new Map(departments.map((department) => [department.name.toLowerCase(), department.id])),
    [departments]
  );
  const positionById = useMemo(() => new Map(positions.map((position) => [position.id, position])), [positions]);
  const positionIdByName = useMemo(
    () => new Map(positions.map((position) => [position.name.toLowerCase(), position.id])),
    [positions]
  );

  const activeEmployeePairs = useMemo(() => {
    const pairs = new Map<string, TargetPair>();

    activeEmployees.forEach((employee) => {
      const departmentId = departmentIdByName.get(employee.departmentName.toLowerCase());
      const positionId = positionIdByName.get(employee.positionName.toLowerCase());
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
  const positionCount = countEmployees((employee) =>
    selectedGlobalPositionIds.some((positionId) => positionById.get(positionId)?.name === employee.positionName)
  );
  const hybridCount = countEmployees((employee) =>
    hybridDepartmentIds.some((departmentId) => {
      const department = departmentById.get(departmentId);
      const position = positionById.get(hybridPositionByDepartment[departmentId] || 0);
      return department?.name === employee.departmentName && position?.name === employee.positionName;
    })
  );

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

  const toggleHybridDepartment = (departmentId: number) => {
    setHybridDepartmentIds((current) =>
      current.includes(departmentId) ? current.filter((id) => id !== departmentId) : [...current, departmentId]
    );
  };

  const handleHybridPositionChange = (departmentId: number, positionId: number | null) => {
    setHybridPositionByDepartment((current) => ({
      ...current,
      [departmentId]: positionId,
    }));
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

    return hybridDepartmentIds
      .map((departmentId) => {
        const department = departmentById.get(departmentId);
        const positionId = hybridPositionByDepartment[departmentId];
        const position = positionId ? positionById.get(positionId) : undefined;
        if (!department || !position) {
          return null;
        }
        return {
          departmentId: department.id,
          departmentName: department.name,
          positionId: position.id,
          positionName: position.name,
        };
      })
      .filter((pair): pair is TargetPair => pair !== null);
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
      const selectedPairs = hybridDepartmentIds.filter((departmentId) => hybridPositionByDepartment[departmentId]);
      if (selectedPairs.length === 0) {
        toast.error('Please select at least one department-position pair');
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

              <div className="grid gap-3 lg:grid-cols-2">
                <AudienceCard
                  value="all"
                  selected={audienceType === 'all'}
                  title="All Employees (Company-wide)"
                  description={[
                    'All active employees in the company will receive this form',
                    `Total: ${formatEmployeeCount(allCount)}`,
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
                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Departments
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {departments.map((department) => (
                      <label
                        key={department.id}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDepartmentIds.includes(department.id)}
                          onChange={() => toggleDepartment(department.id)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        {department.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {audienceType === 'positions' && (
                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Positions
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {positions.map((position) => (
                      <label
                        key={position.id}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGlobalPositionIds.includes(position.id)}
                          onChange={() => toggleGlobalPosition(position.id)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        {position.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {audienceType === 'hybrid' && (
                <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Departments
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {departments.map((department) => (
                        <label
                          key={department.id}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200"
                        >
                          <input
                            type="checkbox"
                            checked={hybridDepartmentIds.includes(department.id)}
                            onChange={() => toggleHybridDepartment(department.id)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          {department.name}
                        </label>
                      ))}
                    </div>
                  </div>

                  {hybridDepartmentIds.length > 0 && (
                    <div className="grid gap-3 md:grid-cols-2">
                      {hybridDepartmentIds.map((departmentId) => {
                        const department = departmentById.get(departmentId);
                        if (!department) {
                          return null;
                        }

                        return (
                          <HybridPositionSelector
                            key={department.id}
                            departmentId={department.id}
                            departmentName={department.name}
                            selectedPositionId={hybridPositionByDepartment[department.id] || null}
                            onChange={handleHybridPositionChange}
                          />
                        );
                      })}
                    </div>
                  )}
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
