import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { toast } from 'react-hot-toast';
import { 
  Plus, Trash2, Save, X, AlertCircle, Search, 
  ArrowRight, Target, Layout, Sparkles,
  ChevronRight, ListFilter, CheckCircle2, Info,
  TrendingUp, TrendingDown, ChevronDown, User,
  Lock, Unlock, Eye, History, FileCheck, Menu,
  ChevronLeft
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

export const KpiManagementPage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();
  
  const [mode, setMode] = useState<ManagementMode>('position');
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
    setIsSidebarOpen(false); // Auto hide sidebar on selection
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
        setKpis([{ positionId: selectedId, kpiName: '', category: '', target: '', unit: '', weight: 0, priorityLevel: 'medium', logicDirection: 'higher' }]);
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
      setKpis(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch employee KPIs', error);
      toast.error('Failed to load employee KPIs');
    } finally {
      setIsLoading(false);
    }
  };

  const addKpiRow = () => {
    if (!selectedId) {
      toast.error(`Please select a ${mode} first`);
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
        logicDirection: 'higher' 
      }
    ]);
  };

  const removeKpiRow = (index: number) => {
    const newKpis = [...kpis];
    const removed = newKpis.splice(index, 1)[0];
    setKpis(newKpis);
    if (removed.id && mode === 'position') {
      kpiManagementApi.deletePositionKpi(removed.id).catch(console.error);
    }
  };

  const updateKpi = (index: number, field: keyof PositionKpi, value: any) => {
    const newKpis = [...kpis];
    newKpis[index] = { ...newKpis[index], [field]: value };
    
    if (mode === 'position') {
      newKpis[index].positionId = selectedId!;
      if (field === 'weight') {
        const weight = value;
        if (weight >= 20 && weight <= 35) newKpis[index].priorityLevel = 'critical';
        else if (weight >= 10 && weight <= 15) newKpis[index].priorityLevel = 'high';
        else if (weight === 10) newKpis[index].priorityLevel = 'medium';
        else if (weight === 5) newKpis[index].priorityLevel = 'low';
      }
    }

    setKpis(newKpis);
  };

  const getTotalWeight = () => kpis.reduce((sum, kpi) => sum + (kpi.weight || 0), 0);
  const getTotalScore = () => kpis.reduce((sum, kpi) => sum + (kpi.weightedScore || 0), 0);

  const handleSave = async (isFinal: boolean) => {
    if (!selectedId) return;
    setIsLoading(true);
    try {
      if (mode === 'position') {
        await kpiManagementApi.savePositionKpis({ positionId: selectedId, kpis, isFinal });
        toast.success('Position roadmap updated successfully');
        fetchPositionKpis();
      } else {
        await kpiManagementApi.updateActualValues(selectedId, kpis);
        toast.success('Appraisal scores updated');
        fetchEmployeeKpis();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLock = async () => {
    if (!selectedId) return;
    setIsLoading(true);
    try {
      await kpiManagementApi.lockEmployeeKpis(selectedId);
      toast.success('Performance record locked');
      fetchEmployeeKpis();
    } catch (error) {
      toast.error('Locking failed');
    } finally {
      setIsLoading(false);
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

  return (
    <div className="h-[calc(100vh-4rem)] bg-[#f8fafc] text-slate-800 font-sans flex overflow-hidden">
      
      {/* Main Workspace Area (Now on Left) */}
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
                     Performance Architecture {mode === 'employee' && isKpiLocked && '— (Locked Entry)'}
                   </span>
                </div>
              </div>
            ) : (
              <h1 className="text-xl font-black text-slate-300 uppercase tracking-widest">Global Framework Modeler</h1>
            )}
          </div>

          <div className="flex items-center gap-3">
            {selectedId && mode === 'employee' && !isKpiLocked && (
               <button onClick={handleLock} className="px-5 py-2.5 text-xs font-black bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-100 transition-all uppercase tracking-widest">
                 Lock Record
               </button>
            )}
            
            {selectedId && (
              <button 
                onClick={() => handleSave(true)}
                disabled={isLoading || (mode === 'employee' && isKpiLocked)}
                className="px-8 py-2.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-teal-600 transition-all shadow-xl disabled:opacity-30 flex items-center gap-2"
              >
                <Save size={16} />
                Persist Changes
              </button>
            )}

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
              
              {/* Spreadsheet Style Table */}
              <div className="bg-white border-2 border-slate-200 rounded-none overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 divide-x divide-slate-200 border-b-2 border-slate-200">
                        <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-slate-900 text-center w-64">KPI</th>
                        <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-slate-900 text-center w-48">Category</th>
                        <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-slate-900 text-center w-32">Target</th>
                        <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-slate-900 text-center w-48">Unit</th>
                        <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-slate-900 text-center w-32 bg-amber-50/30">Actual</th>
                        <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-slate-900 text-center w-32">Weight (%)</th>
                        <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-slate-900 text-center w-32">Score (%)</th>
                        <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-slate-900 text-center w-40">Weighted Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {kpis.map((kpi, idx) => (
                        <tr key={idx} className="divide-x divide-slate-200 hover:bg-slate-50 transition-colors">
                          <td className="p-0">
                            <textarea 
                              className="w-full p-4 bg-transparent outline-none resize-none font-bold text-slate-700 min-h-[60px] block"
                              value={kpi.kpiName}
                              disabled={isKpiLocked}
                              onChange={(e) => updateKpi(idx, 'kpiName', e.target.value)}
                              placeholder="Metric definition..."
                            />
                          </td>
                          <td className="p-0">
                            <input 
                              list="category-list"
                              className="w-full h-[60px] p-4 bg-transparent outline-none font-semibold text-slate-600"
                              value={kpi.category}
                              disabled={isKpiLocked}
                              onChange={(e) => updateKpi(idx, 'category', e.target.value)}
                              placeholder="Classification..."
                            />
                            <datalist id="category-list">
                              {categories.map(c => <option key={c} value={c} />)}
                            </datalist>
                          </td>
                          <td className="p-0">
                            <input 
                              className="w-full h-[60px] px-4 py-2 text-center bg-transparent outline-none font-bold text-slate-800"
                              value={kpi.target}
                              disabled={isKpiLocked}
                              onChange={(e) => updateKpi(idx, 'target', e.target.value)}
                              placeholder="90%"
                            />
                          </td>
                          <td className="p-0">
                             <input 
                              className="w-full h-[60px] px-4 py-2 text-center bg-transparent outline-none font-semibold text-slate-400 italic"
                              value={kpi.unit}
                              disabled={isKpiLocked}
                              onChange={(e) => updateKpi(idx, 'unit', e.target.value)}
                              placeholder="% requests"
                            />
                          </td>
                          <td className="p-0 bg-amber-50/10">
                            <input 
                              className="w-full h-[60px] px-4 py-2 text-center bg-transparent outline-none font-black text-indigo-600"
                              type="number"
                              value={kpi.actualValue || ''}
                              disabled={isKpiLocked}
                              onChange={(e) => updateKpi(idx, 'actualValue', parseFloat(e.target.value) || 0)}
                              placeholder="Entry"
                            />
                          </td>
                          <td className="p-0">
                            <input 
                              className="w-full h-[60px] px-4 py-2 text-center bg-transparent outline-none font-black text-teal-600"
                              type="number"
                              value={kpi.weight || ''}
                              disabled={isKpiLocked}
                              onChange={(e) => updateKpi(idx, 'weight', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="px-4 py-2 text-center font-black text-slate-900 bg-slate-50/50">
                             {(kpi.score || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-center font-black text-indigo-600 bg-indigo-50/30">
                             {(kpi.weightedScore || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      
                      {/* Control Row */}
                      <tr className="bg-white divide-x divide-slate-100">
                        <td colSpan={5} className="p-4">
                           <button onClick={addKpiRow} disabled={isKpiLocked} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-teal-500 hover:text-teal-700 transition-colors">
                             <Plus size={14} /> Append New Row
                           </button>
                        </td>
                        <td className="px-4 py-4 text-center bg-slate-50 border-l-2 border-slate-200">
                           <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Total Weight</div>
                           <div className={clsx("text-lg font-black", getTotalWeight() === 100 ? "text-teal-600" : "text-amber-500")}>
                             {getTotalWeight()}%
                           </div>
                        </td>
                        <td className="px-4 py-4 text-center font-black text-slate-400 bg-white uppercase text-[10px] tracking-widest">
                           Total Score
                        </td>
                        <td className="px-4 py-4 text-center bg-slate-900 text-teal-400">
                           <div className="text-[9px] font-black uppercase opacity-50 mb-1">Aggregated Value</div>
                           <div className="text-xl font-black">{getTotalScore().toFixed(2)}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Logic Configuration */}
              <div className="flex flex-wrap gap-10 pb-12">
                 <div className="flex-1 space-y-4">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-l-4 border-teal-500 pl-4">Optimization Logic</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {kpis.map((kpi, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm group">
                             <span className="text-xs font-bold text-slate-500 truncate max-w-[200px]">
                               {kpi.kpiName || `Metric ${idx + 1}`}
                             </span>
                             <div className="flex bg-slate-50 p-1 rounded-xl">
                               <button 
                                 onClick={() => updateKpi(idx, 'logicDirection', 'higher')}
                                 className={clsx("px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all", kpi.logicDirection === 'higher' ? "bg-white text-teal-500 shadow-sm" : "opacity-30")}
                               >Higher</button>
                               <button 
                                 onClick={() => updateKpi(idx, 'logicDirection', 'lower')}
                                 className={clsx("px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all", kpi.logicDirection === 'lower' ? "bg-white text-rose-500 shadow-sm" : "opacity-30")}
                               >Lower</button>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-10 text-center animate-fade-in-up">
              <div className="p-10 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <Target size={80} className="text-slate-200 animate-pulse mx-auto" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Selection Required</h3>
                <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2 leading-relaxed uppercase text-[10px] tracking-widest">
                  Initialize the workspace by selecting an entity from the registry.
                </p>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="px-10 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-2xl hover:scale-105 transition-all active:scale-95"
              >
                Access Registry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Sidebar (Now on Right) */}
      <div className={clsx(
        "bg-white border-l border-slate-200 transition-all duration-500 ease-in-out flex flex-col z-30 shadow-[-10px_0_30px_rgba(0,0,0,0.05)]",
        isSidebarOpen ? "w-85 translate-x-0" : "w-0 translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-100 min-w-[320px]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-xl tracking-tighter text-slate-900">Registry</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl">
               <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
            <button 
              onClick={() => { setMode('position'); setSelectedId(null); }}
              className={clsx(
                "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                mode === 'position' ? "bg-white text-teal-600 shadow-lg" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Positions
            </button>
            <button 
              onClick={() => { setMode('employee'); setSelectedId(null); }}
              className={clsx(
                "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                mode === 'employee' ? "bg-white text-indigo-600 shadow-lg" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Employees
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder={`Find ${mode}...`}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-w-[320px]">
          {(mode === 'position' ? filteredPositions : filteredEmployees).map((item: any) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={clsx(
                "w-full text-left p-4 rounded-2xl transition-all duration-300 group relative",
                selectedId === item.id 
                  ? "bg-slate-900 text-white shadow-2xl scale-[1.02] z-10" 
                  : "hover:bg-slate-50 text-slate-600"
              )}
            >
              <div className="font-bold text-sm truncate">{mode === 'position' ? item.name : item.employeeName}</div>
              <div className={clsx(
                "text-[10px] font-black uppercase tracking-widest mt-1 opacity-50",
                selectedId === item.id ? "text-teal-400" : "text-slate-400"
              )}>
                {mode === 'position' ? (item.department?.name || 'General') : (item.position?.name || 'Unassigned')}
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default KpiManagementPage;
