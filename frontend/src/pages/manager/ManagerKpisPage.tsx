import React, { useState, useEffect } from 'react';
import { Target, X, Save, AlertCircle, CheckCircle2, History, Calendar } from 'lucide-react';
import { useGetManagerTeamQuery, useGetLatestKpisByEmployeeQuery, useUpdateManagerKpiActualsMutation, useGetEmployeeKpiHistoryQuery, type Kpi } from '../../features/kpi/kpiApi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const KpiEditModal = ({ employee, onClose }: { employee: any, onClose: () => void }) => {
  const { data: kpis, isLoading } = useGetLatestKpisByEmployeeQuery(employee.id);
  const [updateKpis, { isLoading: isUpdating }] = useUpdateManagerKpiActualsMutation();
  const [editedKpis, setEditedKpis] = useState<Kpi[]>([]);

  useEffect(() => {
    if (kpis) {
      setEditedKpis(kpis.map(k => ({...k})));
    }
  }, [kpis]);

  const handleChange = (index: number, field: keyof Kpi, value: any) => {
    const updated = [...editedKpis];
    const kpi = { ...updated[index], [field]: value };

    // Auto-calculate if actual value changed
    if (field === 'actual') {
      const actualStr = String(value || '');
      const targetStr = String(kpi.target || '');
      const weight = Number(kpi.weight || 0);

      const actualNum = parseFloat(actualStr.replace(/[^0-9.]/g, ''));
      const targetNum = parseFloat(targetStr.replace(/[^0-9.]/g, ''));

      if (!isNaN(actualNum) && !isNaN(targetNum) && targetNum !== 0) {
        // Basic calculation: (Actual / Target) * 100
        const score = (actualNum / targetNum) * 100;
        kpi.score = Number(score.toFixed(2));
        kpi.weightedScore = Number(((score * weight) / 100).toFixed(2));
      } else {
        kpi.score = 0;
        kpi.weightedScore = 0;
      }
    }

    updated[index] = kpi;
    setEditedKpis(updated);
  };

  const handleSave = async (status: 'DRAFT' | 'SUBMITTED') => {
    if (status === 'SUBMITTED') {
      const missingActuals = editedKpis.some(k => !k.actual || !k.actual.trim());
      if (missingActuals) {
        toast.error('All KPIs must have an actual value before submitting');
        return;
      }
    }

    try {
      const kpisWithStatus = editedKpis.map(k => ({ ...k, status }));
      await updateKpis({ employeeId: employee.id, kpis: kpisWithStatus }).unwrap();
      toast.success(status === 'DRAFT' ? 'KPIs saved as draft' : 'KPIs submitted successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.data?.message || `Failed to ${status === 'DRAFT' ? 'save draft' : 'submit'} KPIs`);
    }
  };

  const totalWeightedScore = editedKpis.reduce((acc, kpi) => acc + (kpi.weightedScore || 0), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <h2 className="text-xl font-black text-slate-900">Update KPI Actuals</h2>
               {editedKpis[0]?.status === 'DRAFT' && (
                 <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full uppercase tracking-widest">Draft</span>
               )}
            </div>
            <p className="text-sm font-medium text-slate-500">Employee: <span className="font-bold text-slate-900">{employee.name}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Weight Breakdown Visualization */}
        {!isLoading && editedKpis.length > 0 && (
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>KPI Weight Distribution</span>
              <span>Total Score: {totalWeightedScore.toFixed(2)}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
              {editedKpis.map((kpi, idx) => (
                <div 
                  key={kpi.id} 
                  className="h-full border-r border-white/20 last:border-0"
                  style={{ 
                    width: `${kpi.weight}%`,
                    backgroundColor: ['#0855BF', '#10B981', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6'][idx % 7]
                  }}
                />
              ))}
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-0 bg-white">
          {isLoading ? (
            <div className="flex justify-center items-center h-40"><div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div></div>
          ) : editedKpis.length === 0 ? (
            <div className="text-center text-slate-500 py-10 font-medium">No KPIs found for this employee.</div>
          ) : (
            <div className="min-w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                    <th className="py-4 px-6 border-r border-slate-200">KPI</th>
                    <th className="py-4 px-4 border-r border-slate-200">Category</th>
                    <th className="py-4 px-4 text-center border-r border-slate-200">Target</th>
                    <th className="py-4 px-4 text-center border-r border-slate-200">Unit</th>
                    <th className="py-4 px-4 text-center border-r border-slate-200">Actual</th>
                    <th className="py-4 px-4 text-center border-r border-slate-200">Weight (%)</th>
                    <th className="py-4 px-4 text-center border-r border-slate-200">Score (%)</th>
                    <th className="py-4 px-6 text-right">Weighted Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {editedKpis.map((kpi, idx) => (
                    <tr key={kpi.id || idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-6 border-r border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{kpi.name}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{kpi.category}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center border-r border-slate-100">
                        <span className="text-xs font-bold text-slate-700">{kpi.target}</span>
                      </td>
                      <td className="py-4 px-4 text-center text-[10px] font-black text-slate-400 border-r border-slate-100 uppercase">{kpi.unit}</td>
                      <td className="py-4 px-2 border-r border-slate-100">
                        <div className="relative">
                          <input 
                            type="text" 
                            value={kpi.actual || ''} 
                            onChange={(e) => handleChange(idx, 'actual', e.target.value)}
                            className="w-full px-3 py-2 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 transition-all text-center shadow-sm"
                            placeholder="—"
                          />
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center border-r border-slate-100">
                         <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600">
                          {kpi.weight}%
                        </span>
                      </td>
                      <td className="py-4 px-2 border-r border-slate-100">
                        <input 
                          type="number" 
                          min="0" max="100"
                          value={kpi.score || ''} 
                          onChange={(e) => handleChange(idx, 'score', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 transition-all text-center shadow-sm"
                        />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-black text-slate-900 tracking-tight">
                            {kpi.weightedScore || '0.00'}
                          </span>
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Contribution</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/50 border-t-2 border-slate-200">
                    <td colSpan={7} className="py-4 px-6 text-right text-xs font-black text-slate-900 uppercase tracking-widest border-r border-slate-200">Total Score</td>
                    <td className="py-4 px-6 text-right text-sm font-black text-blue-600 tracking-tight bg-blue-50/30">
                      {totalWeightedScore.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => handleSave('DRAFT')}
            disabled={isUpdating || editedKpis.length === 0}
            className="px-5 py-2.5 bg-slate-100 text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200"
          >
            {isUpdating ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div> : <Save size={16} />}
            Save as Draft
          </button>
          <button 
            onClick={() => handleSave('SUBMITTED')}
            disabled={isUpdating || editedKpis.length === 0}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Target size={16} />}
            Submit KPIs
          </button>
        </div>
      </div>
    </div>
  );
};

const KpiHistoryModal = ({ employee, onClose }: { employee: any, onClose: () => void }) => {
  const [periodFilter, setPeriodFilter] = useState('');
  const { data: historyData, isLoading } = useGetEmployeeKpiHistoryQuery({ employeeId: employee.id, period: periodFilter || undefined });

  const renderStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'SUBMITTED' || s === 'ACTIVE') {
      return (
        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-widest flex items-center gap-1 w-fit">
          <CheckCircle2 size={10} /> {status}
        </span>
      );
    }
    if (s === 'DRAFT') {
      return (
        <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[10px] font-black rounded-full border border-slate-100 uppercase tracking-widest flex items-center gap-1 w-fit">
           {status}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full border border-amber-100 uppercase tracking-widest flex items-center gap-1 w-fit">
        <AlertCircle size={10} /> {status}
      </span>
    );
  };

  const groups: Record<string, Kpi[]> = {};
  if (historyData) {
    historyData.forEach(item => {
      const monthYear = item.createdDate ? format(new Date(item.createdDate), 'MMMM yyyy') : 'Unknown Date';
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(item);
    });
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <History className="text-indigo-600" size={24} />
               <h2 className="text-xl font-black text-slate-900">KPI History</h2>
            </div>
            <p className="text-sm font-medium text-slate-500">Employee: <span className="font-bold text-slate-900">{employee.name}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
          <div className="relative w-64">
             <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               placeholder="Filter by period (e.g. 2026-2027)" 
               value={periodFilter}
               onChange={(e) => setPeriodFilter(e.target.value)}
               className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-800 shadow-sm"
             />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-0 bg-white">
          {isLoading ? (
            <div className="flex justify-center items-center h-40"><div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div></div>
          ) : !historyData || historyData.length === 0 ? (
            <div className="text-center text-slate-500 py-10 font-medium">No history records found for this employee.</div>
          ) : (
            <div className="min-w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                    <th className="py-4 px-6 border-r border-slate-200">Period</th>
                    <th className="py-4 px-6 border-r border-slate-200">KPI Name</th>
                    <th className="py-4 px-4 border-r border-slate-200">Target</th>
                    <th className="py-4 px-4 text-center border-r border-slate-200">Actual</th>
                    <th className="py-4 px-4 text-center border-r border-slate-200">Score (%)</th>
                    <th className="py-4 px-6 border-r border-slate-200">Status</th>
                    <th className="py-4 px-6">Record Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(groups).map(([month, items]) => (
                    <React.Fragment key={month}>
                      <tr className="bg-slate-50/80 group">
                        <td colSpan={7} className="py-2.5 px-6 border-y border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-indigo-600 text-white rounded-md flex items-center justify-center shadow-sm">
                               <Calendar size={12} />
                            </div>
                            <span className="font-black text-slate-800 text-[10px] uppercase tracking-widest">{month}</span>
                            <span className="h-px bg-slate-200 flex-1 mx-4"></span>
                            <span className="px-2 py-0.5 bg-white border border-slate-200 text-[9px] font-black text-slate-400 rounded-full uppercase">
                              {items.length} Records
                            </span>
                          </div>
                        </td>
                      </tr>
                      {items.map((kpi, idx) => (
                        <tr key={kpi.id || idx} className={`hover:bg-slate-50/50 transition-colors group ${kpi.recordStatus === 'Archived' ? 'opacity-60 grayscale-[0.2]' : ''}`}>
                          <td className="py-4 px-6 border-r border-slate-100 font-bold text-slate-900 text-sm">
                            {kpi.period}
                          </td>
                          <td className="py-4 px-6 border-r border-slate-100">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{kpi.name}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{kpi.category}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 border-r border-slate-100">
                            <span className="text-xs font-bold text-slate-700">{kpi.target} {kpi.unit}</span>
                          </td>
                          <td className="py-4 px-4 text-center border-r border-slate-100">
                            <span className="text-xs font-bold text-slate-900">{kpi.actual || '-'}</span>
                          </td>
                          <td className="py-4 px-4 text-center border-r border-slate-100">
                             <span className="text-xs font-black text-emerald-600">{kpi.score || '-'}</span>
                          </td>
                          <td className="py-4 px-6 border-r border-slate-100">
                            {renderStatusBadge(kpi.status || 'SUBMITTED')}
                          </td>
                          <td className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase">
                            {kpi.createdDate ? format(new Date(kpi.createdDate), 'dd MMM yyyy') : '-'}
                            <div className={`mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border w-fit ${kpi.recordStatus === 'Active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                              {kpi.recordStatus}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function ManagerKpisPage() {
  const { data: teamData, isLoading: isTeamLoading } = useGetManagerTeamQuery();
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedHistoryEmployee, setSelectedHistoryEmployee] = useState<any>(null);

  const teamMembers = teamData ? [...teamData]
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    .map((emp, idx) => ({
      id: emp.id,
      name: emp.name,
      role: emp.role,
      status: emp.status || 'ACTIVE',
      score: 0,
      initial: emp.name ? emp.name.charAt(0) : 'U',
      color: ['bg-amber-100 text-amber-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-purple-100 text-purple-700'][idx % 4]
    })) : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Team KPIs</h1>
          <p className="text-slate-500 font-medium">Update KPI actual values for your direct reports</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-slate-900">Direct Reports</h3>
            <p className="text-xs font-bold text-slate-400">Select an employee to enter their actuals</p>
          </div>
        </div>

        <div className="space-y-4">
          {isTeamLoading ? (
             <div className="flex justify-center items-center h-20"><div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div></div>
          ) : teamMembers.length === 0 ? (
            <p className="text-sm text-slate-500 font-medium text-center py-4">No team members found.</p>
          ) : teamMembers.map((member) => (
            <div 
              key={member.id} 
              onClick={() => setSelectedEmployee(member)}
              className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-24 transition-all hover:shadow-md cursor-pointer border border-transparent hover:border-slate-200 group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${member.color} rounded-full flex items-center justify-center font-black text-xs`}>
                  {member.initial}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 leading-none mb-1 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{member.name}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{member.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {member.status === 'PENDING' ? (
                  <span className="px-2.5 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full border border-rose-100 uppercase tracking-widest flex items-center gap-1.5 w-fit shadow-sm">
                    <AlertCircle size={10} />
                    NOT DEFINED
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-widest flex items-center gap-1.5 w-fit shadow-sm">
                    <CheckCircle2 size={10} />
                    DEFINED
                  </span>
                )}
                <div className="text-right flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedHistoryEmployee(member); }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    title="View KPI History"
                  >
                    <History size={18} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedEmployee(member); }}
                    className="flex items-center gap-2 text-blue-600 text-xs font-bold p-2 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    Update Actuals <Target size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedEmployee && (
        <KpiEditModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
      )}
      {selectedHistoryEmployee && (
        <KpiHistoryModal employee={selectedHistoryEmployee} onClose={() => setSelectedHistoryEmployee(null)} />
      )}
    </div>
  );
}
