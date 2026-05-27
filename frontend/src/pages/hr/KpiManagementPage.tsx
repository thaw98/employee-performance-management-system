import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, AlertCircle, CheckCircle2, Target, User, Users, X, ClipboardList, Download, FolderOpen, ChevronDown } from 'lucide-react';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { MonthYearPicker } from '../../components/common/MonthYearPicker';
import { EmployeeAutocomplete } from '../../components/common/EmployeeAutocomplete';
import { useGetEmployeesQuery } from '../../features/hrEmployeeList/hrEmployeeApi';
import { useGetDepartmentsQuery } from '../../features/department/api/departmentApi';
import { useGetPositionsByDepartmentQuery } from '../../features/position/api/positionApi';
import {
  useGetKpisByEmployeeQuery,
  useSetupKpisMutation,
  useGetPositionKpisQuery,
  useSetupPositionKpisMutation,
  useGetDepartmentKpisQuery,
  useSetupDepartmentKpisMutation
} from '../../features/kpi/kpiApi';
import { useGetDepartmentByIdQuery } from '../../features/department/api/departmentApi';
import { useGetCategoriesQuery, useAddCategoryMutation } from '../../features/kpi/kpiCategoryApi';
import {
  useGetKpiTemplatesQuery,
  useCreateKpiTemplateMutation
} from '../../features/kpi/kpiTemplateApi';
import { toast } from 'react-hot-toast';

const getCurrentMonthValue = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
};

const formatMonthYear = (monthValue: string) => {
  if (!monthValue) return '';
  const [year, month] = monthValue.split('-');
  if (!year || !month) return monthValue;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const isMonthInPast = (monthValue: string) => {
  if (!monthValue) return false;
  const [year, month] = monthValue.split('-').map(Number);
  const selected = new Date(year, month - 1, 1);
  const now = new Date();
  const current = new Date(now.getFullYear(), now.getMonth(), 1);
  return selected < current;
};

export const KpiManagementPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialEmpId = searchParams.get('employeeId');

  const [mode, setMode] = useState<'individual' | 'position' | 'department'>('individual');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(initialEmpId ? Number(initialEmpId) : null);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [selectedPosId, setSelectedPosId] = useState<number | null>(null);
  const [deptQuery, setDeptQuery] = useState('');
  const [posQuery, setPosQuery] = useState('');
  const [periodMonth, setPeriodMonth] = useState(getCurrentMonthValue());
  const currentMonthValue = getCurrentMonthValue();
  const selectedPeriodLabel = formatMonthYear(periodMonth);
  const [kpis, setKpis] = useState<any[]>([]);

  useEffect(() => {
    if (initialEmpId) {
      setSelectedEmployeeId(Number(initialEmpId));
      setMode('individual');
    }
  }, [initialEmpId]);

  // Individual Mode Data
  const { data: employeesResponse } = useGetEmployeesQuery({ size: 1000 });
  const employees = employeesResponse?.data?.content || [];

  const { data: existingKpis, refetch: refetchKpis } = useGetKpisByEmployeeQuery(
    { employeeId: selectedEmployeeId!, period: selectedPeriodLabel },
    { skip: mode !== 'individual' || !selectedEmployeeId }
  );

  // Position Mode Data
  const { data: deptsResponse } = useGetDepartmentsQuery();
  const departments = deptsResponse?.data || [];

  const { data: positionsResponse } = useGetPositionsByDepartmentQuery(selectedDeptId!, { skip: !selectedDeptId });
  const positions = positionsResponse?.data || [];
  const selectedDepartment = useMemo(
    () => departments.find((dept: any) => dept.departmentId === selectedDeptId) ?? null,
    [departments, selectedDeptId]
  );
  const selectedPosition = useMemo(
    () => positions.find((pos: any) => pos.positionId === selectedPosId) ?? null,
    [positions, selectedPosId]
  );
  const filteredDepartments = useMemo(() => {
    const query = deptQuery.trim().toLowerCase();
    if (!query) return departments;
    return departments.filter((dept: any) => dept.departmentName.toLowerCase().includes(query));
  }, [departments, deptQuery]);
  const filteredPositions = useMemo(() => {
    const query = posQuery.trim().toLowerCase();
    if (!query) return positions;
    return positions.filter((pos: any) => pos.positionName.toLowerCase().includes(query));
  }, [positions, posQuery]);

  const { data: existingPosKpis, refetch: refetchPosKpis } = useGetPositionKpisQuery(
    { departmentId: selectedDeptId!, positionId: selectedPosId!, period: selectedPeriodLabel },
    { skip: mode !== 'position' || !selectedDeptId || !selectedPosId }
  );

  const { data: deptDetailResponse } = useGetDepartmentByIdQuery(selectedDeptId!, { skip: (mode !== 'department' && mode !== 'position') || !selectedDeptId });
  const selectedDeptDetail = deptDetailResponse?.data;

  const { data: existingDeptKpis, refetch: refetchDeptKpis } = useGetDepartmentKpisQuery(
    { departmentId: selectedDeptId!, period: selectedPeriodLabel },
    { skip: mode !== 'department' || !selectedDeptId }
  );

  const [setupKpis, { isLoading: isSavingInd }] = useSetupKpisMutation();
  const [setupPosKpis, { isLoading: isSavingPos }] = useSetupPositionKpisMutation();
  const [setupDeptKpis, { isLoading: isSavingDept }] = useSetupDepartmentKpisMutation();
  const { data: categories = [] } = useGetCategoriesQuery();
  const [addCategory] = useAddCategoryMutation();

  // Manual Category Logic
  const [newCategoryRows, setNewCategoryRows] = useState<Record<number, boolean>>({});
  const [tempCategoryValues, setTempCategoryValues] = useState<Record<number, string>>({});

  const handleAddNewCategory = async (idx: number) => {
    const name = tempCategoryValues[idx];
    if (!name || !name.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }

    try {
      await addCategory({ name: name.trim() }).unwrap();
      handleInputChange(idx, 'category', name.trim());
      setNewCategoryRows(prev => ({ ...prev, [idx]: false }));
      toast.success(`Category "${name}" added and selected`);
    } catch (err) {
      toast.error('Failed to add category');
    }
  };

  // Template Logic
  const { data: templates = [] } = useGetKpiTemplatesQuery({
    type: mode === 'individual' ? 'INDIVIDUAL' : mode === 'position' ? 'POSITION' : 'DEPARTMENT',
    departmentId: selectedDeptId || undefined,
    positionId: selectedPosId || undefined
  });
  const [createTemplate] = useCreateKpiTemplateMutation();
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const loadTemplate = (template: any) => {
    const templateKpis = template.items.map((item: any) => {
      const base = mode === 'individual' ? {
        employeeId: selectedEmployeeId!,
        actual: '',
        score: 0,
        weightedScore: 0,
        status: 'DRAFT'
      } : mode === 'position' ? {
        departmentId: selectedDeptId!,
        positionId: selectedPosId!
      } : {
        departmentId: selectedDeptId!
      };

      const [year, month] = periodMonth.split('-').map(Number);
      return {
        ...base,
        name: item.name,
        category: item.category,
        target: item.target,
        unit: item.unit,
        weight: item.weight,
        period: selectedPeriodLabel,
        year,
        month,
        periodLabel: selectedPeriodLabel
      };
    });
    setKpis(templateKpis);
    setShowTemplates(false);
    toast.success(`Loaded template: ${template.name}`);
  };

  const openSaveTemplateModal = () => {
    if (kpis.length === 0) {
      toast.error('No KPIs to save as template');
      return;
    }
    setTemplateNameInput('');
    setShowSaveTemplateModal(true);
  };

  const closeSaveTemplateModal = () => {
    if (isSavingTemplate) return;
    setShowSaveTemplateModal(false);
    setTemplateNameInput('');
  };

  const handleSaveTemplateConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const templateName = templateNameInput.trim();
    if (!templateName) {
      toast.error('Template name is required');
      return;
    }

    setIsSavingTemplate(true);
    try {
      await createTemplate({
        name: templateName,
        type: mode === 'individual' ? 'INDIVIDUAL' : mode === 'position' ? 'POSITION' : 'DEPARTMENT',
        departmentId: selectedDeptId || undefined,
        positionId: selectedPosId || undefined,
        items: kpis.map(k => ({
          name: k.name,
          category: k.category,
          target: k.target,
          unit: k.unit,
          weight: k.weight
        }))
      }).unwrap();
      toast.success('Template saved successfully');
      setShowSaveTemplateModal(false);
      setTemplateNameInput('');
    } catch (err) {
      toast.error('Failed to save template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const isSaving = isSavingInd || isSavingPos || isSavingDept;

  const isAlreadyDefined = mode === 'individual'
    ? (existingKpis && existingKpis.length > 0)
    : mode === 'position'
      ? (existingPosKpis && existingPosKpis.length > 0)
      : (existingDeptKpis && existingDeptKpis.length > 0);

  useEffect(() => {
    if (mode === 'individual') {
      if (existingKpis && existingKpis.length > 0) {
        setKpis(existingKpis);
      } else {
        setKpis([]);
      }
    } else if (mode === 'position') {
      if (existingPosKpis && existingPosKpis.length > 0) {
        setKpis(existingPosKpis);
      } else {
        setKpis([]);
      }
    } else if (mode === 'department') {
      if (existingDeptKpis && existingDeptKpis.length > 0) {
        setKpis(existingDeptKpis);
      } else {
        setKpis([]);
      }
    }
  }, [existingKpis, existingPosKpis, existingDeptKpis, mode]);

  const addKpiRow = () => {
    if (mode === 'individual' && !selectedEmployeeId) {
      toast.error('Please select an employee first');
      return;
    }
    if (mode === 'position' && (!selectedDeptId || !selectedPosId)) {
      toast.error('Please select department and position first');
      return;
    }
    if (mode === 'department' && !selectedDeptId) {
      toast.error('Please select department first');
      return;
    }

    const newKpi = mode === 'individual' ? {
      employeeId: selectedEmployeeId!,
      name: '',
      category: '',
      target: '',
      unit: '',
      actual: '',
      weight: 0,
      score: 0,
      weightedScore: 0,
      period: selectedPeriodLabel,
      year: Number(periodMonth.split('-')[0]),
      month: Number(periodMonth.split('-')[1]),
      periodLabel: selectedPeriodLabel,
      status: 'DRAFT'
    } : mode === 'position' ? {
      departmentId: selectedDeptId!,
      positionId: selectedPosId!,
      name: '',
      category: '',
      target: '',
      unit: '',
      weight: 0,
      period: selectedPeriodLabel,
      year: Number(periodMonth.split('-')[0]),
      month: Number(periodMonth.split('-')[1]),
      periodLabel: selectedPeriodLabel
    } : {
      departmentId: selectedDeptId!,
      name: '',
      category: '',
      target: '',
      unit: '',
      weight: 0,
      period: selectedPeriodLabel,
      year: Number(periodMonth.split('-')[0]),
      month: Number(periodMonth.split('-')[1]),
      periodLabel: selectedPeriodLabel
    };
    setKpis([...kpis, newKpi]);
  };

  const removeKpiRow = (index: number) => {
    const newKpis = [...kpis];
    newKpis.splice(index, 1);
    setKpis(newKpis);
  };

  const handleInputChange = (index: number, field: string, value: any) => {
    const newKpis = [...kpis];
    (newKpis[index] as any)[field] = value;

    if (mode === 'individual' && (field === 'weight' || field === 'score')) {
      const weight = Number(newKpis[index].weight) || 0;
      const score = Number(newKpis[index].score) || 0;
      newKpis[index].weightedScore = (score * weight) / 100;
    }

    setKpis(newKpis);
  };

  const totalWeight = kpis.reduce((sum, kpi) => sum + (Number(kpi.weight) || 0), 0);
  const totalScore = mode === 'individual' ? kpis.reduce((sum, kpi) => sum + (Number(kpi.weightedScore) || 0), 0) : null;

  const handleSave = async () => {
    if (mode === 'individual' && !selectedEmployeeId) {
      toast.error('Please select an employee');
      return;
    }
    if (mode === 'position' && (!selectedDeptId || !selectedPosId)) {
      toast.error('Please select department and position');
      return;
    }
    if (mode === 'department' && !selectedDeptId) {
      toast.error('Please select department');
      return;
    }

    if (kpis.length === 0) {
      toast.error('Please add at least one KPI');
      return;
    }

    const invalidKpis = kpis.filter(kpi => !kpi.name || !kpi.category || !kpi.target || !kpi.weight);
    if (invalidKpis.length > 0) {
      toast.error('Please fill in all required fields (Name, Category, Target, Weight)');
      return;
    }

    if (isMonthInPast(periodMonth)) {
      toast.error('Cannot create KPI setup for past months. Please choose current or a future month.');
      return;
    }

    if (totalWeight !== 100) {
      toast.error(`Total weight must be 100%. Current total: ${totalWeight}%`);
      return;
    }

    try {
      const periodPayload = {
        period: selectedPeriodLabel,
        year: Number(periodMonth.split('-')[0]),
        month: Number(periodMonth.split('-')[1]),
        periodLabel: selectedPeriodLabel
      };

      if (mode === 'individual') {
        await setupKpis(kpis.map(k => ({ ...k, employeeId: selectedEmployeeId, ...periodPayload }))).unwrap();
        toast.success('Individual KPI setup saved successfully');
        refetchKpis();
      } else if (mode === 'position') {
        await setupPosKpis(kpis.map(k => ({ ...k, departmentId: selectedDeptId, positionId: selectedPosId, ...periodPayload }))).unwrap();
        toast.success('Position KPIs saved and applied to all employees');
        refetchPosKpis();
      } else if (mode === 'department') {
        await setupDeptKpis(kpis.map(k => ({ ...k, departmentId: selectedDeptId, ...periodPayload }))).unwrap();
        toast.success('Department KPIs saved successfully');
        refetchDeptKpis();
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to save KPI setup');
    }
  };

  return (
    <div className="kpi-management-theme space-y-6">
      {/* Mode Switcher & Category Management */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setMode('individual')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${mode === 'individual' ? 'bg-white text-[#2463eb] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <User size={14} /> Individual
          </button>
          <button
            onClick={() => setMode('position')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${mode === 'position' ? 'bg-white text-[#2463eb] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <Users size={14} /> Same Position
          </button>
          <button
            onClick={() => setMode('department')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${mode === 'department' ? 'bg-white text-[#2463eb] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <Target size={14} /> Same Department
          </button>
        </div>
        <button
          onClick={() => navigate('/hr/kpi-categories')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#eff6ff] hover:bg-[#dbeafe] text-[#1d4ed8] rounded-xl text-xs font-black transition-all uppercase tracking-widest border border-[#bfdbfe]"
        >
          <FolderOpen size={16} /> Manage Categories
        </button>
      </div>

      <div className="flex flex-col md:flex-col md:items-start justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            {mode === 'individual' ? 'Individual KPI Modeler' : mode === 'position' ? 'Same Position KPI Setup' : 'Department KPI Setup'}
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {mode === 'individual'
              ? 'Define performance targets and weights for specific employees.'
              : mode === 'position'
                ? 'Setup universal KPIs for all employees in a specific position/department.'
                : 'Define performance targets and weights for the department entity.'}
          </p>
          {selectedDeptDetail && (mode === 'department' || mode === 'position') && (
            <div className="flex items-center gap-4 mt-2">
              <div className="bg-[#eff6ff] px-3 py-1 rounded-full border border-[#bfdbfe]">
                <span className="text-[10px] font-black text-[#2463eb] uppercase">Manager: </span>
                <span className="text-xs font-bold text-slate-700">{selectedDeptDetail.managerName || 'Not Assigned'}</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {mode === 'individual' ? (
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</span>
              <EmployeeAutocomplete
                employees={employees}
                value={selectedEmployeeId}
                onChange={setSelectedEmployeeId}
                placeholder="Search employee…"
                variant="inline"
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dept</span>
                <div className="relative min-w-[180px]">
                  <Combobox
                    value={selectedDepartment}
                    onChange={(dept: any | null) => {
                      setSelectedDeptId(dept ? dept.departmentId : null);
                      setSelectedPosId(null);
                    }}
                    nullable
                  >
                    <ComboboxInput
                      className="w-full min-w-[180px] border-0 bg-transparent py-0 pr-6 pl-0 text-sm font-bold text-slate-900 focus:ring-0 outline-none placeholder:font-medium placeholder:text-slate-400"
                      displayValue={(dept: any | null) => dept?.departmentName ?? ''}
                      onChange={(e) => setDeptQuery(e.target.value)}
                      placeholder="Select Department"
                      autoComplete="off"
                    />
                    <ComboboxButton className="absolute inset-y-0 right-0 flex items-center text-slate-400">
                      <ChevronDown size={14} aria-hidden />
                    </ComboboxButton>
                    <ComboboxOptions
                      anchor="bottom start"
                      className="z-50 mt-1 max-h-60 w-(--anchor-width) min-w-[220px] overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg focus:outline-none"
                    >
                      {filteredDepartments.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-slate-500">No departments found</div>
                      ) : (
                        filteredDepartments.map((dept: any) => (
                          <ComboboxOption
                            key={dept.departmentId}
                            value={dept}
                            className="cursor-pointer px-3 py-2 text-sm text-slate-800 data-focus:bg-[#eff6ff] data-selected:font-semibold data-selected:text-[#1d4ed8]"
                          >
                            {dept.departmentName}
                          </ComboboxOption>
                        ))
                      )}
                    </ComboboxOptions>
                  </Combobox>
                </div>
              </div>
              {mode === 'position' && (
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pos</span>
                  <div className="relative min-w-[180px]">
                    <Combobox
                      value={selectedPosition}
                      onChange={(pos: any | null) => setSelectedPosId(pos ? pos.positionId : null)}
                      disabled={!selectedDeptId}
                      nullable
                    >
                      <ComboboxInput
                        className="w-full min-w-[180px] border-0 bg-transparent py-0 pr-6 pl-0 text-sm font-bold text-slate-900 focus:ring-0 outline-none placeholder:font-medium placeholder:text-slate-400 disabled:text-slate-400"
                        displayValue={(pos: any | null) => pos?.positionName ?? ''}
                        onChange={(e) => setPosQuery(e.target.value)}
                        placeholder="Select Position"
                        autoComplete="off"
                      />
                      <ComboboxButton className="absolute inset-y-0 right-0 flex items-center text-slate-400">
                        <ChevronDown size={14} aria-hidden />
                      </ComboboxButton>
                      <ComboboxOptions
                        anchor="bottom start"
                        className="z-50 mt-1 max-h-60 w-(--anchor-width) min-w-[220px] overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg focus:outline-none"
                      >
                        {filteredPositions.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-slate-500">No positions found</div>
                        ) : (
                          filteredPositions.map((pos: any) => (
                            <ComboboxOption
                              key={pos.positionId}
                              value={pos}
                              className="cursor-pointer px-3 py-2 text-sm text-slate-800 data-focus:bg-[#eff6ff] data-selected:font-semibold data-selected:text-[#1d4ed8]"
                            >
                              {pos.positionName}
                            </ComboboxOption>
                          ))
                        )}
                      </ComboboxOptions>
                    </Combobox>
                  </div>
                </div>
              )}
            </>
          )}
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</span>
            <MonthYearPicker value={periodMonth} onChange={setPeriodMonth} />
            <span className="text-[10px] text-slate-500">{selectedPeriodLabel}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">
              {mode === 'individual' ? 'Individual KPI Setup' : mode === 'position' ? 'Position Template Setup' : 'Department Template Setup'}
            </h3>
            {totalWeight === 100 ? (
              <span className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-200 uppercase tracking-tighter">
                <CheckCircle2 size={12} /> Valid Weight (100%)
              </span>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full border border-amber-200 uppercase tracking-tighter">
                <AlertCircle size={12} /> Total Weight: {totalWeight}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => !isAlreadyDefined && setShowTemplates(!showTemplates)}
                disabled={isAlreadyDefined}
                className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-black transition-all uppercase tracking-widest shadow-sm ${isAlreadyDefined
                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <ClipboardList size={16} /> Load Template
              </button>
              
              {showTemplates && !isAlreadyDefined && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-3 bg-slate-50 border-b border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Templates</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {templates.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs font-bold">No templates found for this selection.</div>
                    ) : (
                      templates.map((t: any) => (
                        <button
                          key={t.id}
                          onClick={() => loadTemplate(t)}
                          className="w-full text-left p-4 hover:bg-[#eff6ff] border-b border-slate-50 last:border-0 transition-colors group"
                        >
                          <p className="text-sm font-bold text-slate-900 group-hover:text-[#2463eb]">{t.name}</p>
                          <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase">{t.items.length} KPI Items</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={addKpiRow}
              disabled={isAlreadyDefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-lg uppercase tracking-widest ${isAlreadyDefined
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-[#2463eb] hover:bg-[#1d4ed8] text-white shadow-[#dbeafe]'
                }`}
            >
              <Plus size={16} /> Add KPI Item
            </button>
          </div>
        </div>

        {isAlreadyDefined && (
          <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-amber-900 uppercase tracking-tight">KPIs Already Defined</p>
              <p className="text-xs font-bold text-amber-700/80">
                Performance targets for this period are already locked. You cannot define new items or modify existing ones on this page.
              </p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="py-4 px-6 w-1/4">KPI Name</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Target</th>
                <th className="py-4 px-6">Unit</th>
                {mode === 'individual' && <th className="py-4 px-6">Actual</th>}
                <th className="py-4 px-6 text-center">Weight (%)</th>
                {mode === 'individual' && <th className="py-4 px-6 text-center">Score (%)</th>}
                {mode === 'individual' && <th className="py-4 px-6 text-right">Weighted Score</th>}
                <th className="py-4 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {kpis.map((kpi, idx) => (
                <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                  <td className="py-3 px-6">
                    <input
                      type="text"
                      className={`w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#dbeafe] outline-none ${isAlreadyDefined ? 'cursor-not-allowed opacity-70' : ''}`}
                      placeholder="e.g., Sales Target"
                      value={kpi.name}
                      readOnly={isAlreadyDefined}
                      onChange={(e) => handleInputChange(idx, 'name', e.target.value)}
                    />
                  </td>
                  <td className="py-3 px-6">
                    {newCategoryRows[idx] ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className="flex-1 bg-white border border-[#bfdbfe] rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#dbeafe]"
                          placeholder="New category..."
                          value={tempCategoryValues[idx] || ''}
                          onChange={(e) => setTempCategoryValues({ ...tempCategoryValues, [idx]: e.target.value })}
                          autoFocus
                        />
                        <button
                          onClick={() => handleAddNewCategory(idx)}
                          className="p-1.5 bg-[#2463eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
                          title="Save Category"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={() => setNewCategoryRows({ ...newCategoryRows, [idx]: false })}
                          className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                          title="Cancel"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <select
                        className={`w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#dbeafe] outline-none ${isAlreadyDefined ? 'cursor-not-allowed opacity-70' : ''}`}
                        value={kpi.category}
                        disabled={isAlreadyDefined}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW') {
                            setNewCategoryRows({ ...newCategoryRows, [idx]: true });
                          } else {
                            handleInputChange(idx, 'category', e.target.value);
                          }
                        }}
                      >
                        <option value="">Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                        <option value="ADD_NEW" className="text-[#2463eb] font-black">+ Add New Category...</option>
                      </select>
                    )}
                  </td>
                  <td className="py-3 px-6">
                    <input
                      type="text"
                      className={`w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#dbeafe] outline-none ${isAlreadyDefined ? 'cursor-not-allowed opacity-70' : ''}`}
                      placeholder="90%"
                      value={kpi.target}
                      readOnly={isAlreadyDefined}
                      onChange={(e) => handleInputChange(idx, 'target', e.target.value)}
                    />
                  </td>
                  <td className="py-3 px-6">
                    <input
                      type="text"
                      className={`w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#dbeafe] outline-none ${isAlreadyDefined ? 'cursor-not-allowed opacity-70' : ''}`}
                      placeholder="Rate"
                      value={kpi.unit}
                      readOnly={isAlreadyDefined}
                      onChange={(e) => handleInputChange(idx, 'unit', e.target.value)}
                    />
                  </td>
                  {mode === 'individual' && (
                    <td className="py-3 px-6">
                      <input
                        type="text"
                        className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#dbeafe] outline-none"
                        placeholder="Actual"
                        value={kpi.actual}
                        onChange={(e) => handleInputChange(idx, 'actual', e.target.value)}
                      />
                    </td>
                  )}
                  <td className="py-3 px-6 text-center">
                    <input
                      type="number"
                      className={`w-20 bg-slate-50 border-none rounded-lg px-3 py-2 text-sm font-black text-[#2463eb] text-center focus:ring-2 focus:ring-[#dbeafe] outline-none ${isAlreadyDefined ? 'cursor-not-allowed opacity-70' : ''}`}
                      value={kpi.weight}
                      readOnly={isAlreadyDefined}
                      onChange={(e) => handleInputChange(idx, 'weight', Number(e.target.value))}
                    />
                  </td>
                  {mode === 'individual' && (
                    <td className="py-3 px-6 text-center">
                      <input
                        type="number"
                        className="w-20 bg-slate-50 border-none rounded-lg px-3 py-2 text-sm font-black text-emerald-600 text-center focus:ring-2 focus:ring-emerald-200 outline-none"
                        value={kpi.score}
                        onChange={(e) => handleInputChange(idx, 'score', Number(e.target.value))}
                      />
                    </td>
                  )}
                  {mode === 'individual' && (
                    <td className="py-3 px-6 text-right font-black text-slate-900 text-sm">
                      {(Number(kpi.weightedScore) || 0).toFixed(2)}
                    </td>
                  )}
                  <td className="py-3 px-6 text-center">
                    <button
                      onClick={() => !isAlreadyDefined && removeKpiRow(idx)}
                      disabled={isAlreadyDefined}
                      className={`p-2 rounded-lg transition-all ${isAlreadyDefined ? 'text-slate-200 cursor-not-allowed' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {kpis.length === 0 && (
                <tr>
                  <td colSpan={mode === 'individual' ? 9 : 6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <Target size={32} />
                      </div>
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No KPI Items Defined</p>
                      <button
                        onClick={addKpiRow}
                        className="text-[#2463eb] font-black text-xs uppercase tracking-widest hover:underline mt-2"
                      >
                        + Create First Item
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50/50 border-t border-slate-100">
              <tr className="font-black text-slate-900">
                <td colSpan={mode === 'individual' ? 5 : 4} className="py-6 px-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Totals
                </td>
                <td className="py-6 px-6 text-center text-lg font-black text-[#2463eb]">
                  {totalWeight}%
                </td>
                {mode === 'individual' && (
                  <>
                    <td className="py-6 px-6 text-center text-slate-400">-</td>
                    <td className="py-6 px-6 text-right text-2xl font-black text-[#1d4ed8]">
                      {totalScore?.toFixed(2)}
                    </td>
                  </>
                )}
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          onClick={() => !isAlreadyDefined && setKpis([])}
          disabled={isAlreadyDefined}
          className={`px-6 py-3 border rounded-2xl text-xs font-black transition-all uppercase tracking-widest ${isAlreadyDefined
              ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
        >
          Reset Setup
        </button>
        <button
          onClick={openSaveTemplateModal}
          disabled={isAlreadyDefined}
          className={`flex items-center gap-2 px-6 py-3 border rounded-2xl text-xs font-black transition-all uppercase tracking-widest ${isAlreadyDefined
              ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
              : 'bg-white border-slate-200 text-[#2463eb] hover:bg-[#eff6ff]'
            }`}
        >
          <FolderOpen size={18} /> Save as Template
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || totalWeight !== 100 || isAlreadyDefined}
          className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-xs font-black transition-all shadow-xl uppercase tracking-widest ${isSaving || totalWeight !== 100 || isAlreadyDefined
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
            : 'bg-[#2463eb] hover:bg-[#1d4ed8] text-white shadow-[#dbeafe]'
            }`}
        >
          {isSaving ? 'Processing...' : (
            <>
              <Save size={18} />
              {mode === 'individual' ? 'Finalize Individual KPI' : 'Save & Apply to All Employees'}
            </>
          )}
        </button>
      </div>

      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="Close save template dialog"
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
            onClick={closeSaveTemplateModal}
          />
          <div
            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-template-title"
          >
            <button
              type="button"
              onClick={closeSaveTemplateModal}
              disabled={isSavingTemplate}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#eff6ff] text-[#2463eb]">
              <FolderOpen size={20} />
            </div>
            <h2 id="save-template-title" className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Save as Template
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Enter a name for this template so you can load it later.
            </p>
            <form onSubmit={handleSaveTemplateConfirm} className="mt-5">
              <label htmlFor="template-name" className="sr-only">
                Template name
              </label>
              <input
                id="template-name"
                type="text"
                autoFocus
                value={templateNameInput}
                onChange={(e) => setTemplateNameInput(e.target.value)}
                placeholder="e.g., Sales Team Q1"
                disabled={isSavingTemplate}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-colors focus:border-[#bfdbfe] focus:ring-2 focus:ring-[#dbeafe] disabled:cursor-not-allowed disabled:opacity-70"
              />
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeSaveTemplateModal}
                  disabled={isSavingTemplate}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTemplate || !templateNameInput.trim()}
                  className="rounded-xl bg-[#2463eb] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-[#dbeafe] transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  {isSavingTemplate ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
