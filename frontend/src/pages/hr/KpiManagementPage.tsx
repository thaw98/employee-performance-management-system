// src/pages/hr/KpiManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { toast } from 'react-hot-toast';
import {
  Plus, Trash2, Save, X, AlertCircle, Search,
  ArrowRight, Target, Layout, Sparkles,
  ChevronRight, ListFilter, CheckCircle2, Info,
  TrendingUp, TrendingDown, ChevronDown, User, Users,
  Lock, Unlock, Eye, History, FileCheck, Menu,
  ChevronLeft, Upload, Download, AlertTriangle,
  Edit2, Check, RefreshCw, Clock
} from 'lucide-react';
import { kpiManagementApi } from '../../services/kpiManagementApi';
import type { PositionKpi, Position, KpiCategory, Employee } from '../../types/kpiManagement';
import { clsx } from 'clsx';

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', minWeight: 20, maxWeight: 35, color: 'text-rose-600 bg-rose-50 border-rose-100' },
  high: { label: 'High', minWeight: 10, maxWeight: 15, color: 'text-amber-600 bg-amber-50 border-amber-100' },
  medium: { label: 'Medium', minWeight: 10, maxWeight: 10, color: 'text-sky-600 bg-sky-50 border-sky-100' },
  low: { label: 'Low', minWeight: 5, maxWeight: 5, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
};

const DEFAULT_CATEGORIES = [
  'Operations', 'Asset Management', 'Compliance Management', 'Delivery Performance',
  'Quality Assurance', 'Financial Management', 'Stakeholder Satisfaction',
  'Team Performance', 'Innovation', 'Customer Service', 'Sales Performance',
  'Operational Efficiency', 'Code Quality', 'System Design', 'Leadership',
  'Reporting', 'Accuracy', 'Talent Acquisition', 'HR Operations'
];

type ManagementMode = 'position' | 'employee';

interface RevisionHistory {
  id: number;
  previousKpi: string;
  previousTarget: string;
  previousWeight: number;
  revisedBy: number;
  revisedByName?: string;
  revisionNote: string;
  revisedAt: string;
}

export const KpiManagementPage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();

  const [mode, setMode] = useState<ManagementMode>('employee');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [positions, setPositions] = useState<Position[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [kpis, setKpis] = useState<PositionKpi[]>([]);

  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [editingActual, setEditingActual] = useState<number | null>(null);

  // Revision Modal States
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [selectedKpiForRevision, setSelectedKpiForRevision] = useState<PositionKpi | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  // Weight Validation Modal States
  const [showWeightValidation, setShowWeightValidation] = useState(false);
  const [weightValidationResult, setWeightValidationResult] = useState<{ totalWeight: number; isValid: boolean; message: string } | null>(null);

  // Revision History Modal States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [revisionHistory, setRevisionHistory] = useState<RevisionHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const empId = params.get('employeeId');
    if (empId) {
      setMode('employee');
      handleSelect(parseInt(empId));
    }
  }, [location, employees]);

  useEffect(() => {
    if (selectedId) {
      if (mode === 'position') fetchPositionKpis();
      else fetchEmployeeKpis();
    } else {
      setKpis([]);
    }
  }, [selectedId, mode]);

  const handleSelect = (id: number) => {
    setSelectedId(id);
    setValidationError(null);
    setIsSidebarOpen(false);
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [posRes, empRes, catRes] = await Promise.all([
        kpiManagementApi.getPositions(),
        kpiManagementApi.getEmployees(),
        kpiManagementApi.getCategories()
      ]);
      setPositions(posRes.data.data || []);
      setEmployees(empRes.data.data || []);
      if (catRes.data.data && catRes.data.data.length > 0) {
        setCategories(catRes.data.data.map((c: KpiCategory) => c.name));
      }
    } catch (error) {
      toast.error('Failed to load initial data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPositionKpis = async () => {
    if (!selectedId) return;
    setIsLoading(true);
    try {
      const res = await kpiManagementApi.getPositionKpis(selectedId);
      if (res.data.data && res.data.data.length > 0) {
        setKpis(res.data.data);
      } else {
        setKpis([{
          positionId: selectedId,
          kpiName: '',
          category: '',
          target: '',
          unit: '',
          weight: 0,
          priorityLevel: 'medium',
          logicDirection: 'higher'
        }]);
      }
    } catch (error) {
      console.error('Failed to fetch position KPIs', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployeeKpis = async () => {
    if (!selectedId) return;
    setIsLoading(true);
    try {
      const res = await kpiManagementApi.getEmployeeKpis(selectedId);
      if (res.data.data && res.data.data.length > 0) {
        setKpis(res.data.data);
      } else {
        setKpis([]);
      }
    } catch (error) {
      console.error('Failed to fetch employee KPIs', error);
      toast.error('Failed to load employee KPIs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRevisionHistory = async (assignmentId: number) => {
    setIsLoadingHistory(true);
    try {
      const res = await kpiManagementApi.getRevisionHistory(assignmentId);
      setRevisionHistory(res.data.data || []);
      setShowHistoryModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load revision history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const addKpiRow = () => {
    if (!selectedId) {
      toast.error(`Please select an employee first`);
      return;
    }
    setKpis([
      ...kpis,
      {
        positionId: mode === 'position' ? selectedId : (selectedItem as Employee)?.position?.id || 0,
        kpiName: '',
        category: '',
        target: '',
        unit: '',
        weight: 0,
        priorityLevel: 'medium',
        logicDirection: 'higher',
        actualValue: undefined
      }
    ]);
    setValidationError(null);
  };

  const removeKpiRow = (index: number) => {
    const newKpis = [...kpis];
    const removed = newKpis.splice(index, 1)[0];
    setKpis(newKpis);
    if (removed.id && mode === 'position') {
      kpiManagementApi.deletePositionKpi(removed.id).catch(console.error);
    }
    setValidationError(null);
  };

  const updateKpi = (index: number, field: keyof PositionKpi, value: any) => {
    const newKpis = [...kpis];
    newKpis[index] = { ...newKpis[index], [field]: value };

    if (mode === 'position' && field === 'weight') {
      const weight = value;
      if (weight >= 20 && weight <= 35) newKpis[index].priorityLevel = 'critical';
      else if (weight >= 10 && weight <= 15) newKpis[index].priorityLevel = 'high';
      else if (weight === 10) newKpis[index].priorityLevel = 'medium';
      else if (weight === 5) newKpis[index].priorityLevel = 'low';
    }

    setKpis(newKpis);
    setValidationError(null);
  };

  const getTotalWeight = () => kpis.reduce((sum, kpi) => sum + (kpi.weight || 0), 0);
  const getTotalScore = () => kpis.reduce((sum, kpi) => sum + (kpi.weightedScore || 0), 0);

  const validateKpis = (): boolean => {
    for (let i = 0; i < kpis.length; i++) {
      const kpi = kpis[i];
      if (!kpi.kpiName?.trim()) {
        setValidationError(`Row ${i + 1}: KPI name is required`);
        return false;
      }
      if (!kpi.category?.trim()) {
        setValidationError(`Row ${i + 1}: Category is required for "${kpi.kpiName}"`);
        return false;
      }
      if (!kpi.target?.trim()) {
        setValidationError(`Row ${i + 1}: Target is required for "${kpi.kpiName}"`);
        return false;
      }
      if (!kpi.weight || kpi.weight <= 0) {
        setValidationError(`Row ${i + 1}: Weight is required and must be greater than 0 for "${kpi.kpiName}"`);
        return false;
      }
      if (kpi.weight > 100) {
        setValidationError(`Row ${i + 1}: Weight cannot exceed 100% for "${kpi.kpiName}"`);
        return false;
      }
    }

    const totalWeight = getTotalWeight();
    if (totalWeight !== 100) {
      setValidationError(`Total KPI weight must equal 100%. Current total: ${totalWeight}%`);
      return false;
    }

    return true;
  };

  const handleValidateWeights = async () => {
    if (kpis.length === 0) {
      toast.error('No KPIs to validate');
      return;
    }

    try {
      const validationData = kpis.map(kpi => ({
        kpiName: kpi.kpiName,
        category: kpi.category,
        target: kpi.target,
        unit: kpi.unit,
        weight: kpi.weight,
        priorityLevel: kpi.priorityLevel,
        logicDirection: kpi.logicDirection
      }));

      const res = await kpiManagementApi.validateKpiWeights(validationData);
      setWeightValidationResult(res.data);
      setShowWeightValidation(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Validation failed');
    }
  };

  const handleSave = async (isFinal: boolean) => {
    if (!selectedId) return;

    if (!validateKpis()) {
      toast.error(validationError || 'Validation failed');
      return;
    }

    setIsSaving(true);
    try {
      if (mode === 'position') {
        await kpiManagementApi.savePositionKpis({ positionId: selectedId, kpis, isFinal });
        toast.success('Position KPI roadmap saved successfully');
        fetchPositionKpis();
      } else {
        await kpiManagementApi.updateActualValues(selectedId, kpis);
        toast.success(isFinal ? 'KPIs submitted successfully!' : 'KPIs saved as draft');
        fetchEmployeeKpis();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to save';
      toast.error(errorMsg);
      setValidationError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateActual = async (index: number, actualValue: number | undefined) => {
    if (!selectedId) return;
    const kpi = kpis[index];
    if (!kpi.assignmentId) {
      toast.error('Cannot update actual: KPI record not saved yet');
      return;
    }

    try {
      const res = await kpiManagementApi.updateKpiActual(kpi.assignmentId, actualValue?.toString() || '', kpi.remarks);
      const updatedKpi = {
        ...kpi,
        actualValue,
        score: res.data.data?.score,
        weightedScore: res.data.data?.weightedScore
      };
      const newKpis = [...kpis];
      newKpis[index] = updatedKpi;
      setKpis(newKpis);
      toast.success('Actual value updated successfully');
      setEditingActual(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update actual value');
    }
  };

  const handleReviseKpi = async () => {
    if (!selectedKpiForRevision || !selectedKpiForRevision.assignmentId) return;

    setIsSubmittingRevision(true);
    try {
      const revisionData = {
        kpiName: selectedKpiForRevision.kpiName,
        category: selectedKpiForRevision.category,
        target: selectedKpiForRevision.target,
        unit: selectedKpiForRevision.unit,
        weight: selectedKpiForRevision.weight,
        priorityLevel: selectedKpiForRevision.priorityLevel,
        logicDirection: selectedKpiForRevision.logicDirection,
        revisionNote: revisionNote
      };

      await kpiManagementApi.reviseKpi(selectedKpiForRevision.assignmentId, revisionData);
      toast.success('KPI revised successfully');
      setShowRevisionModal(false);
      setSelectedKpiForRevision(null);
      setRevisionNote('');
      fetchEmployeeKpis();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to revise KPI');
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  const handleLockKpis = async () => {
    if (!selectedId) return;

    if (!window.confirm('Are you sure you want to lock these KPIs? Locked KPIs cannot be modified.')) {
      return;
    }

    setIsSaving(true);
    try {
      await kpiManagementApi.lockEmployeeKpis(selectedId);
      toast.success('KPIs locked successfully');
      fetchEmployeeKpis();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to lock KPIs');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await kpiManagementApi.createCategory(newCategory);
      setCategories([...categories, newCategory]);
      setNewCategory('');
      setShowCategoryModal(false);
      toast.success('Category added successfully');
    } catch (error) {
      toast.error('Failed to add category');
    }
  };

  const selectedItem = mode === 'position'
    ? positions.find(p => p.id === selectedId)
    : employees.find(e => e.id === selectedId);

  const filteredPositions = positions.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEmployees = employees.filter(e =>
    e.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isKpiLocked = kpis.some(k => k.isLocked);
  const totalWeight = getTotalWeight();
  const isWeightValid = totalWeight === 100;

  return (
    <div className="h-[calc(100vh-4rem)] bg-[#f8fafc] text-slate-800 font-sans flex overflow-hidden">

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">

        {/* Workspace Header */}
        <div className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-6">
            {selectedId ? (
              <div className="animate-fade-in-up">
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                  {mode === 'position' ? (selectedItem as Position)?.name : (selectedItem as Employee)?.employeeName}
                </h1>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className={clsx("w-2 h-2 rounded-full", mode === 'position' ? "bg-teal-500" : "bg-indigo-500")}></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {mode === 'employee' ? 'Employee KPI Configuration' : 'Position KPI Template'}
                  </span>
                  {isKpiLocked && (
                    <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[8px] font-black uppercase tracking-wider">
                      Locked
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <h1 className="text-xl font-black text-slate-300 uppercase tracking-widest">KPI Management</h1>
            )}
          </div>

          <div className="flex items-center gap-3">
            {validationError && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-2xl text-xs font-bold">
                <AlertTriangle size={16} />
                {validationError}
              </div>
            )}

            {selectedId && kpis.length > 0 && (
              <button
                onClick={handleValidateWeights}
                className="px-4 py-2.5 text-xs font-black bg-purple-50 text-purple-600 rounded-2xl hover:bg-purple-100 transition-all uppercase tracking-widest"
              >
                Validate Weight
              </button>
            )}

            {selectedId && mode === 'employee' && !isKpiLocked && kpis.length > 0 && (
              <>
                <button
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                  className="px-5 py-2.5 text-xs font-black bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={isSaving || !isWeightValid}
                  className={clsx(
                    "px-5 py-2.5 text-xs font-black bg-indigo-600 text-white rounded-2xl transition-all uppercase tracking-widest disabled:opacity-50",
                    !isWeightValid && "cursor-not-allowed"
                  )}
                  title={!isWeightValid ? `Total weight must be 100% (currently ${totalWeight}%)` : ''}
                >
                  Submit KPI
                </button>
              </>
            )}

            {selectedId && mode === 'employee' && !isKpiLocked && kpis.length > 0 && (
              <button
                onClick={handleLockKpis}
                disabled={isSaving}
                className="px-5 py-2.5 text-xs font-black bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-100 transition-all uppercase tracking-widest flex items-center gap-2"
              >
                <Lock size={14} />
                Lock Record
              </button>
            )}

            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2.5 text-xs font-black bg-teal-50 text-teal-600 rounded-2xl hover:bg-teal-100 transition-all uppercase tracking-widest"
            >
              + Add Category
            </button>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={clsx(
                "p-3 bg-slate-50 text-slate-900 rounded-2xl transition-all shadow-sm active:scale-95",
                isSidebarOpen ? "bg-slate-200" : "hover:bg-slate-100"
              )}
              title="Toggle Registry Sidebar"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-auto p-10 bg-[#fcfcfd]">
          {selectedId ? (
            <div className="max-w-[1600px] mx-auto space-y-10">

              {/* Weight Validation Banner */}
              {mode === 'employee' && kpis.length > 0 && !isWeightValid && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex items-center gap-3">
                  <AlertCircle className="text-amber-500" size={20} />
                  <div>
                    <p className="font-bold text-amber-700 text-sm">Weight Validation Required</p>
                    <p className="text-amber-600 text-xs">
                      Total KPI weight is {totalWeight}%. Must equal 100% before submission.
                      {totalWeight < 100 ? ` Add ${100 - totalWeight}% more weight.` : ` Reduce by ${totalWeight - 100}%.`}
                    </p>
                  </div>
                </div>
              )}

              {/* KPI Table */}
              <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 divide-x divide-slate-200 border-b-2 border-slate-200">
                        <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-slate-900 text-left w-80">KPI Name *</th>
                        <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-slate-900 text-left w-48">Category *</th>
                        <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-slate-900 text-left w-40">Target *</th>
                        <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-slate-900 text-left w-40">Unit</th>
                        <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-slate-900 text-left w-40 bg-amber-50/30">Actual</th>
                        <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-slate-900 text-left w-32">Weight (%) *</th>
                        <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-slate-900 text-left w-32">Score (%)</th>
                        <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-slate-900 text-left w-40">Weighted Score</th>
                        <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-slate-900 text-center w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {kpis.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-12 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <Target size={48} className="text-slate-300" />
                              <p className="text-slate-400 font-medium">No KPIs configured for this employee</p>
                              <button
                                onClick={addKpiRow}
                                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold flex items-center gap-2"
                              >
                                <Plus size={16} /> Add First KPI
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        kpis.map((kpi, idx) => (
                          <tr key={idx} className="divide-x divide-slate-200 hover:bg-slate-50 transition-colors">
                            <td className="p-0">
                              <textarea
                                className="w-full p-4 bg-transparent outline-none resize-none font-bold text-slate-700 min-h-[60px] block"
                                value={kpi.kpiName}
                                disabled={isKpiLocked}
                                onChange={(e) => updateKpi(idx, 'kpiName', e.target.value)}
                                placeholder="Enter KPI name..."
                              />
                            </td>
                            <td className="p-0">
                              <select
                                className="w-full h-[60px] px-4 bg-transparent outline-none font-semibold text-slate-600"
                                value={kpi.category}
                                disabled={isKpiLocked}
                                onChange={(e) => updateKpi(idx, 'category', e.target.value)}
                              >
                                <option value="">Select category...</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </td>
                            <td className="p-0">
                              <input
                                className="w-full h-[60px] px-4 text-left bg-transparent outline-none font-bold text-slate-800"
                                value={kpi.target}
                                disabled={isKpiLocked}
                                onChange={(e) => updateKpi(idx, 'target', e.target.value)}
                                placeholder="e.g., 95% or Complete 5 projects"
                              />
                            </td>
                            <td className="p-0">
                              <input
                                className="w-full h-[60px] px-4 text-left bg-transparent outline-none font-semibold text-slate-400 italic"
                                value={kpi.unit}
                                disabled={isKpiLocked}
                                onChange={(e) => updateKpi(idx, 'unit', e.target.value)}
                                placeholder="e.g., %, hours, projects"
                              />
                            </td>
                            <td className="p-0 bg-amber-50/10">
                              {editingActual === idx ? (
                                <input
                                  className="w-full h-[60px] px-4 text-left bg-amber-50 outline-none font-black text-indigo-600"
                                  type="number"
                                  step="any"
                                  value={kpi.actualValue || ''}
                                  autoFocus
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateKpi(idx, 'actualValue', val === '' ? undefined : parseFloat(val));
                                  }}
                                  onBlur={() => {
                                    handleUpdateActual(idx, kpi.actualValue);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleUpdateActual(idx, kpi.actualValue);
                                    }
                                    if (e.key === 'Escape') {
                                      setEditingActual(null);
                                    }
                                  }}
                                />
                              ) : (
                                <div
                                  className="w-full h-[60px] px-4 flex items-center justify-between cursor-pointer hover:bg-amber-100/30 transition-colors"
                                  onClick={() => !isKpiLocked && kpi.assignmentId && setEditingActual(idx)}
                                >
                                  <span className={clsx(
                                    "font-black",
                                    kpi.actualValue ? "text-indigo-600" : "text-slate-300"
                                  )}>
                                    {kpi.actualValue || '—'}
                                  </span>
                                  {!isKpiLocked && kpi.assignmentId && (
                                    <Edit2 size={14} className="text-slate-300 hover:text-indigo-500" />
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-0">
                              <input
                                className="w-full h-[60px] px-4 text-left bg-transparent outline-none font-black text-teal-600"
                                type="number"
                                step="5"
                                min="0"
                                max="100"
                                value={kpi.weight || ''}
                                disabled={isKpiLocked}
                                onChange={(e) => updateKpi(idx, 'weight', parseFloat(e.target.value) || 0)}
                                placeholder="0-100"
                              />
                            </td>
                            <td className="px-4 py-2 text-left font-black text-slate-900 bg-slate-50/50">
                              {kpi.score ? kpi.score.toFixed(2) : '-'}
                            </td>
                            <td className="px-4 py-2 text-left font-black text-indigo-600 bg-indigo-50/30">
                              {kpi.weightedScore ? kpi.weightedScore.toFixed(2) : '-'}
                            </td>
                            <td className="px-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {kpi.assignmentId && (
                                  <button
                                    onClick={() => fetchRevisionHistory(kpi.assignmentId!)}
                                    className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                                    title="View Revision History"
                                  >
                                    <History size={16} />
                                  </button>
                                )}
                                {!isKpiLocked && kpi.assignmentId && (
                                  <button
                                    onClick={() => {
                                      setSelectedKpiForRevision(kpi);
                                      setRevisionNote('');
                                      setShowRevisionModal(true);
                                    }}
                                    className="p-2 text-slate-400 hover:text-amber-500 transition-colors"
                                    title="Revise KPI"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                )}
                                {!isKpiLocked && (
                                  <button
                                    onClick={() => removeKpiRow(idx)}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Delete KPI"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}

                      {/* Add Row Button */}
                      {!isKpiLocked && kpis.length > 0 && (
                        <tr className="bg-white">
                          <td colSpan={9} className="p-4">
                            <button onClick={addKpiRow} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-teal-500 hover:text-teal-700 transition-colors">
                              <Plus size={14} /> Add Another KPI
                            </button>
                          </td>
                        </tr>
                      )}

                      {/* Totals Row */}
                      {kpis.length > 0 && (
                        <tr className="bg-slate-50 border-t-2 border-slate-200">
                          <td colSpan={5} className="px-4 py-4 text-right font-black text-slate-700 uppercase text-xs tracking-wider">
                            Totals:
                          </td>
                          <td className="px-4 py-4 text-left">
                            <div className={clsx(
                              "text-xl font-black",
                              isWeightValid ? "text-teal-600" : "text-amber-500"
                            )}>
                              {totalWeight}%
                            </div>
                            {!isWeightValid && (
                              <div className="text-[9px] text-amber-500 mt-1">
                                {totalWeight < 100 ? `Need +${100 - totalWeight}%` : `Excess -${totalWeight - 100}%`}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest">
                            Total Score
                          </td>
                          <td className="px-4 py-4 text-left bg-slate-900 text-teal-400">
                            <div className="text-[9px] font-black uppercase opacity-50 mb-1">Aggregated Value</div>
                            <div className="text-xl font-black">{getTotalScore().toFixed(2)}</div>
                          </td>
                          <td className="px-4 py-4"></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Logic Direction Configuration */}
              {kpis.length > 0 && (
                <div className="flex flex-wrap gap-10 pb-12">
                  <div className="flex-1 space-y-4">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-l-4 border-teal-500 pl-4">Performance Logic Direction</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {kpis.map((kpi, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm group">
                          <span className="text-xs font-bold text-slate-500 truncate max-w-[200px]">
                            {kpi.kpiName || `KPI ${idx + 1}`}
                          </span>
                          <div className="flex bg-slate-50 p-1 rounded-xl">
                            <button
                              onClick={() => updateKpi(idx, 'logicDirection', 'higher')}
                              className={clsx(
                                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all",
                                kpi.logicDirection === 'higher' ? "bg-white text-teal-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
                              )}
                            >
                              Higher is Better
                            </button>
                            <button
                              onClick={() => updateKpi(idx, 'logicDirection', 'lower')}
                              className={clsx(
                                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all",
                                kpi.logicDirection === 'lower' ? "bg-white text-rose-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
                              )}
                            >
                              Lower is Better
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-10 text-center animate-fade-in-up">
              <div className="p-10 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <Target size={80} className="text-slate-200 animate-pulse mx-auto" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Select an Employee</h3>
                <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2 leading-relaxed uppercase text-[10px] tracking-widest">
                  Select an employee from the registry to define their KPIs
                </p>
              </div>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="px-10 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-2xl hover:scale-105 transition-all active:scale-95"
              >
                Open Employee Registry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 mb-4">Add New Category</h3>
            <input
              type="text"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-teal-500 font-medium"
              placeholder="Category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-xl font-bold"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {showRevisionModal && selectedKpiForRevision && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[500px] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900">Revise KPI</h3>
              <button onClick={() => setShowRevisionModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-slate-500 block mb-1">KPI Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-amber-500 outline-none"
                  value={selectedKpiForRevision.kpiName}
                  onChange={(e) => setSelectedKpiForRevision({ ...selectedKpiForRevision, kpiName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase text-slate-500 block mb-1">Category *</label>
                <select
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-amber-500 outline-none"
                  value={selectedKpiForRevision.category}
                  onChange={(e) => setSelectedKpiForRevision({ ...selectedKpiForRevision, category: e.target.value })}
                >
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase text-slate-500 block mb-1">Target *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-amber-500 outline-none"
                    value={selectedKpiForRevision.target}
                    onChange={(e) => setSelectedKpiForRevision({ ...selectedKpiForRevision, target: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-slate-500 block mb-1">Unit</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-amber-500 outline-none"
                    value={selectedKpiForRevision.unit}
                    onChange={(e) => setSelectedKpiForRevision({ ...selectedKpiForRevision, unit: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase text-slate-500 block mb-1">Weight (%) *</label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-amber-500 outline-none"
                    value={selectedKpiForRevision.weight}
                    onChange={(e) => setSelectedKpiForRevision({ ...selectedKpiForRevision, weight: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-slate-500 block mb-1">Logic Direction</label>
                  <select
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-amber-500 outline-none"
                    value={selectedKpiForRevision.logicDirection}
                    onChange={(e) => setSelectedKpiForRevision({ ...selectedKpiForRevision, logicDirection: e.target.value as 'higher' | 'lower' })}
                  >
                    <option value="higher">Higher is Better</option>
                    <option value="lower">Lower is Better</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-black uppercase text-slate-500 block mb-1">Revision Note *</label>
                <textarea
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-amber-500 outline-none"
                  rows={3}
                  placeholder="Explain why this KPI is being revised..."
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRevisionModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleReviseKpi}
                disabled={isSubmittingRevision || !revisionNote.trim()}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-xl font-bold disabled:opacity-50"
              >
                {isSubmittingRevision ? 'Saving...' : 'Save Revision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weight Validation Modal */}
      {showWeightValidation && weightValidationResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              {weightValidationResult.isValid ? (
                <CheckCircle2 size={32} className="text-emerald-500" />
              ) : (
                <AlertCircle size={32} className="text-amber-500" />
              )}
              <h3 className="text-lg font-black text-slate-900">Weight Validation</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-500">Total Weight:</span>
                <span className={clsx("font-bold", weightValidationResult.isValid ? "text-emerald-600" : "text-amber-600")}>
                  {weightValidationResult.totalWeight}%
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="text-sm text-slate-600">{weightValidationResult.message}</p>
              </div>
            </div>
            <button
              onClick={() => setShowWeightValidation(false)}
              className="w-full mt-6 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Revision History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[600px] shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900">Revision History</h3>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            {isLoadingHistory ? (
              <div className="text-center py-8">
                <RefreshCw size={32} className="animate-spin mx-auto text-slate-300" />
              </div>
            ) : revisionHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Clock size={32} className="mx-auto mb-2 opacity-30" />
                <p>No revision history available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {revisionHistory.map((revision, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        Revision #{revisionHistory.length - idx}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(revision.revisedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                      <div>
                        <span className="text-slate-400 text-[9px] uppercase">Previous KPI</span>
                        <p className="font-medium">{revision.previousKpi}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[9px] uppercase">Previous Target</span>
                        <p className="font-medium">{revision.previousTarget}</p>
                      </div>
                    </div>
                    <div className="mb-2">
                      <span className="text-slate-400 text-[9px] uppercase">Previous Weight</span>
                      <p className="font-medium">{revision.previousWeight}%</p>
                    </div>
                    {revision.revisionNote && (
                      <div className="bg-slate-50 p-2 rounded-lg mt-2">
                        <span className="text-slate-400 text-[9px] uppercase">Revision Note</span>
                        <p className="text-xs text-slate-600">{revision.revisionNote}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsible Sidebar (Right) */}
      <div className={clsx(
        "bg-white border-l border-slate-200 transition-all duration-500 ease-in-out flex flex-col z-30 shadow-[-10px_0_30px_rgba(0,0,0,0.05)]",
        isSidebarOpen ? "w-96 translate-x-0" : "w-0 translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-100 min-w-[384px]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-xl tracking-tighter text-slate-900">Employee Registry</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search employees..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-w-[384px]">
          {filteredEmployees.map((employee) => (
            <button
              key={employee.id}
              onClick={() => handleSelect(employee.id)}
              className={clsx(
                "w-full text-left p-4 rounded-2xl transition-all duration-300 group relative",
                selectedId === employee.id
                  ? "bg-slate-900 text-white shadow-2xl scale-[1.02] z-10"
                  : "hover:bg-slate-50 text-slate-600"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm truncate">{employee.employeeName}</div>
                  <div className={clsx(
                    "text-[10px] font-black uppercase tracking-widest mt-1",
                    selectedId === employee.id ? "text-teal-400" : "text-slate-400"
                  )}>
                    {employee.position?.name || 'Unassigned'} • {employee.employeeId}
                  </div>
                </div>
                {selectedId === employee.id && (
                  <Check size={16} className="text-teal-400" />
                )}
              </div>
            </button>
          ))}
          {filteredEmployees.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">No employees found</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default KpiManagementPage;