import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Target, ChevronLeft, Calendar, Building2, LayoutGrid, Award, ShieldCheck, FileEdit, Lock, Save, X } from 'lucide-react';
import { 
  useGetDepartmentKpisQuery,
  useUpdateDepartmentHrKpiActualsMutation,
  type DepartmentKpi 
} from '../../features/kpi/kpiApi';
import { useGetDepartmentByIdQuery } from '../../features/department/api/departmentApi';
import { toast } from 'react-hot-toast';

export const DepartmentKpiDetailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const departmentId = searchParams.get('departmentId');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-2027');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: deptResponse, isLoading: deptLoading } = useGetDepartmentByIdQuery(Number(departmentId), {
    skip: !departmentId
  });

  const { data: kpis, isLoading: kpisLoading, refetch } = useGetDepartmentKpisQuery(
    { departmentId: Number(departmentId), period: selectedPeriod },
    { skip: !departmentId }
  );

  const isLoading = deptLoading || kpisLoading;
  const department = deptResponse?.data;

  const totalWeight = kpis?.reduce((sum, k) => sum + (k.weight || 0), 0) || 0;
  const totalScore = kpis?.reduce((sum, k) => sum + (k.weightedScore || 0), 0) || 0;

  if (!departmentId) return <div className="p-10 text-center font-bold text-red-500 uppercase tracking-widest">No Department Selected</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Department KPI Detail</h1>
            <p className="text-slate-500 text-sm font-medium">Performance monitoring and KPI specifications for the department.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <Calendar size={16} className="text-slate-400" />
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-xs font-black text-slate-700 outline-none bg-transparent uppercase tracking-wider"
            >
              <option value="2026-2027">2026-2027</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-200 uppercase tracking-widest"
          >
            <Target size={16} /> Update Actuals
          </button>
          <button
            onClick={() => navigate(`/hr/kpi-management?departmentId=${departmentId}&mode=department`)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-200 uppercase tracking-widest"
          >
            <FileEdit size={16} /> Manage KPIs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:border-indigo-100 transition-all">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <Building2 size={28} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Department</p>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight truncate">{department?.departmentName || '...'}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:border-blue-100 transition-all">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <LayoutGrid size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">KPI Count</p>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{kpis?.length || 0} Defined</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:border-emerald-100 transition-all">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <Award size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Overall Score</p>
            <h3 className="text-lg font-black text-emerald-600 uppercase tracking-tight">{totalScore.toFixed(2)}%</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:border-amber-100 transition-all">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <ShieldCheck size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{kpis?.[0]?.status || 'NOT SET'}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-indigo-600">
              <Target size={20} />
            </div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Department Performance Records</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
                <th className="py-4 px-8">KPI Name & Category</th>
                <th className="py-4 px-6 text-center">Target</th>
                <th className="py-4 px-6 text-center">Actual</th>
                <th className="py-4 px-6 text-center">Unit</th>
                <th className="py-4 px-4 text-center">Weight (%)</th>
                <th className="py-4 px-4 text-center">Score (%)</th>
                <th className="py-4 px-8 text-right">Weighted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={7} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">Loading KPIs...</td></tr>
              ) : !kpis || kpis.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">No KPIs assigned for this period</td></tr>
              ) : kpis.map((kpi, idx) => (
                <tr key={kpi.id || idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-5 px-8">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{kpi.name}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{kpi.category}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center text-xs font-bold text-slate-700">{kpi.target}</td>
                  <td className="py-5 px-6 text-center">
                    <span className={`px-3 py-1 rounded-lg text-xs font-black ${kpi.actual ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-400'}`}>
                      {kpi.actual || '—'}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.unit}</td>
                  <td className="py-5 px-4 text-center text-xs font-bold text-slate-600">{kpi.weight}%</td>
                  <td className="py-5 px-4 text-center text-xs font-black text-emerald-600">{kpi.score?.toFixed(2) || '0.00'}%</td>
                  <td className="py-5 px-8 text-right font-black text-indigo-600 text-sm italic">{kpi.weightedScore?.toFixed(2) || '0.00'}</td>
                </tr>
              ))}
            </tbody>
            {kpis && kpis.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50/50 border-t-2 border-slate-200">
                  <td colSpan={6} className="py-5 px-8 text-right text-xs font-black text-slate-900 uppercase tracking-widest">Department Overall Score</td>
                  <td className="py-5 px-8 text-right text-sm font-black italic text-emerald-600 bg-emerald-50/30">
                    {totalScore.toFixed(2)}%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {isEditModalOpen && department && kpis && (
        <DepartmentKpiEditModal 
          department={department}
          kpis={kpis}
          onClose={() => {
            setIsEditModalOpen(false);
            void refetch();
          }}
        />
      )}
    </div>
  );
};

interface DepartmentKpiEditModalProps {
  department: any;
  kpis: DepartmentKpi[];
  onClose: () => void;
}

const DepartmentKpiEditModal: React.FC<DepartmentKpiEditModalProps> = ({ department, kpis, onClose }) => {
  const [editedKpis, setEditedKpis] = useState<DepartmentKpi[]>([]);
  const [updateKpis, { isLoading: isUpdating }] = useUpdateDepartmentHrKpiActualsMutation();

  useEffect(() => {
    if (kpis) {
      setEditedKpis(JSON.parse(JSON.stringify(kpis)));
    }
  }, [kpis]);

  const handleChange = (index: number, field: keyof DepartmentKpi, value: any) => {
    const updated = [...editedKpis];
    const kpi = { ...updated[index] };

    if (field === 'actual') {
      kpi.actual = value as string;
    } else if (field === 'score') {
      kpi.score = value as number;
    }

    // Auto-calculate if actual and target are numeric
    if (field === 'actual' || field === 'score') {
      const actualStr = String(kpi.actual || '0');
      const targetStr = String(kpi.target || '0');
      const weight = Number(kpi.weight || 0);

      const actualNum = parseFloat(actualStr.replace(/[^0-9.]/g, ''));
      const targetNum = parseFloat(targetStr.replace(/[^0-9.]/g, ''));

      if (field === 'actual') {
        if (!isNaN(actualNum) && !isNaN(targetNum) && targetNum !== 0) {
          const score = (actualNum / targetNum) * 100;
          kpi.score = Number(score.toFixed(2));
          kpi.weightedScore = Number(((score * weight) / 100).toFixed(2));
        } else {
          kpi.score = 0;
          kpi.weightedScore = 0;
        }
      } else if (field === 'score') {
        kpi.weightedScore = Number(((Number(value) * weight) / 100).toFixed(2));
      }
    }

    updated[index] = kpi;
    setEditedKpis(updated);
  };

  const handleSave = async (status: 'DRAFT' | 'SUBMITTED') => {
    try {
      const kpisWithStatus = editedKpis.map(k => ({ ...k, status }));
      await updateKpis({ departmentId: department.departmentId, kpis: kpisWithStatus }).unwrap();
      toast.success(status === 'DRAFT' ? 'KPIs saved as draft' : 'KPIs submitted successfully');
      onClose();
    } catch (err: any) {
      const errorMsg = typeof err.data === 'string' 
        ? err.data 
        : err.data?.message || `Failed to ${status === 'DRAFT' ? 'save draft' : 'submit'} KPIs`;
      toast.error(errorMsg);
    }
  };

  const totalWeightedScore = editedKpis.reduce((acc, kpi) => acc + (kpi.weightedScore || 0), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <Target size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Update Department Actuals</h2>
              <p className="text-sm font-medium text-slate-500">Department: <span className="font-black text-slate-800">{department.departmentName}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0 bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50/90 backdrop-blur-md text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                <th className="py-5 px-8 border-r border-slate-200/50">KPI Specification</th>
                <th className="py-5 px-4 text-center border-r border-slate-200/50">Target</th>
                <th className="py-5 px-4 text-center border-r border-slate-200/50">Unit</th>
                <th className="py-5 px-8 text-center border-r border-slate-200/50 bg-indigo-50/30 text-indigo-600">Actual Value</th>
                <th className="py-5 px-4 text-center border-r border-slate-200/50">Weight</th>
                <th className="py-5 px-8 text-center border-r border-slate-200/50 bg-emerald-50/30 text-emerald-600">Score (%)</th>
                <th className="py-5 px-8 text-right">Weighted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {editedKpis.map((kpi, idx) => (
                <tr key={kpi.id || idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-5 px-8 border-r border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{kpi.name}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{kpi.category}</span>
                    </div>
                  </td>
                  <td className="py-5 px-4 text-center border-r border-slate-100">
                    <span className="text-xs font-bold text-slate-700">{kpi.target}</span>
                  </td>
                  <td className="py-5 px-4 text-center text-[10px] font-black text-slate-400 border-r border-slate-100 uppercase tracking-widest">{kpi.unit}</td>
                  <td className="py-5 px-6 border-r border-slate-100 bg-indigo-50/10">
                    <input 
                      type="text" 
                      value={kpi.actual || ''} 
                      onChange={(e) => handleChange(idx, 'actual', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border-2 border-slate-100 rounded-xl text-xs font-black focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-center shadow-sm placeholder:text-slate-300"
                      placeholder="Enter actual..."
                    />
                  </td>
                  <td className="py-5 px-4 text-center border-r border-slate-100">
                     <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600">
                      {kpi.weight}%
                    </span>
                  </td>
                  <td className="py-5 px-6 border-r border-slate-100 bg-emerald-50/10">
                    <input 
                      type="number" 
                      min="0" max="100"
                      value={kpi.score || ''} 
                      onChange={(e) => handleChange(idx, 'score', parseFloat(e.target.value))}
                      className="w-full px-4 py-2.5 bg-white border-2 border-slate-100 rounded-xl text-xs font-black focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-center shadow-sm"
                    />
                  </td>
                  <td className="py-5 px-8 text-right font-black text-slate-900 tracking-tight italic">
                    {kpi.weightedScore?.toFixed(2) || '0.00'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td colSpan={6} className="py-6 px-8 text-right text-xs font-black text-slate-900 uppercase tracking-widest border-r border-slate-200">Total Department Score</td>
                <td className="py-6 px-8 text-right text-base font-black text-indigo-600 tracking-tight bg-indigo-50/30 italic">
                  {totalWeightedScore.toFixed(2)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="p-8 border-t border-slate-100 bg-white flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={() => handleSave('DRAFT')}
            disabled={isUpdating || editedKpis.length === 0}
            className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-slate-900 hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isUpdating ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div> : <Save size={18} />}
            Save Draft
          </button>
          <button 
            onClick={() => handleSave('SUBMITTED')}
            disabled={isUpdating || editedKpis.length === 0}
            className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ShieldCheck size={18} />}
            Finalize Actuals
          </button>
        </div>
      </div>
    </div>
  );
};
