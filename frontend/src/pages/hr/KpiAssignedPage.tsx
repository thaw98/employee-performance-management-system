import React, { useState, useEffect } from 'react';
import { kpiManagementApi } from '../../services/kpiManagementApi';
import { 
  Users, Target, CheckCircle2, AlertCircle, Search, 
  ChevronRight, ArrowRight, ShieldCheck, Lock, 
  FileText, Layout, ListFilter
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';

interface AssignmentSummary {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  department: string;
  position: string;
  kpiCount: number;
  totalWeight: number;
  totalScore: number;
  isLocked: boolean;
}

export const KpiAssignedPage: React.FC = () => {
  const [summaries, setSummaries] = useState<AssignmentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    setIsLoading(true);
    try {
      const res = await kpiManagementApi.getEmployees();
      const employees = res.data.data;
      
      const summaryPromises = employees.map(async (emp: any) => {
        try {
          const kpiRes = await kpiManagementApi.getEmployeeKpis(emp.id);
          const kpis = kpiRes.data.data || [];
          const totalWeight = kpis.reduce((acc: number, k: any) => acc + (k.weight || 0), 0);
          const totalScore = kpis.reduce((acc: number, k: any) => acc + (k.weightedScore || 0), 0);
          const isLocked = kpis.some((k: any) => k.isLocked);
          
          return {
            employeeId: emp.id,
            employeeName: emp.employeeName,
            employeeCode: emp.employeeId,
            department: emp.department?.name || 'Operations',
            position: emp.position?.name || 'Staff',
            kpiCount: kpis.length,
            totalWeight,
            totalScore,
            isLocked
          };
        } catch (err) {
          return null;
        }
      });

      const results = await Promise.all(summaryPromises);
      setSummaries(results.filter(r => r !== null) as AssignmentSummary[]);
    } catch (error) {
      toast.error('Failed to load assignment summaries');
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = summaries.filter(s => 
    s.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Assigned KPIs</h1>
          </div>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest ml-1">Central Compliance & Performance Registry</p>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="relative group">
            <input
              type="text"
              placeholder="Filter by name, ID or role..."
              className="pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all w-80 shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
          </div>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Grid of Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-[2.5rem]"></div>
          ))
        ) : filtered.length > 0 ? (
          filtered.map((summary) => (
            <div key={summary.employeeId} className="group bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 hover:scale-[1.02] relative overflow-hidden ring-1 ring-slate-100">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-indigo-400 font-black text-xl shadow-xl rotate-3 group-hover:rotate-0 transition-transform">
                      {summary.employeeName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 tracking-tight leading-none text-lg truncate w-40">{summary.employeeName}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{summary.employeeCode}</p>
                    </div>
                  </div>
                  {summary.isLocked ? (
                    <div className="bg-amber-100 text-amber-600 p-2 rounded-xl shadow-sm" title="Finalized Record">
                      <Lock size={18} />
                    </div>
                  ) : (
                    <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl shadow-sm" title="Active Appraisal">
                      <CheckCircle2 size={18} />
                    </div>
                  )}
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center py-3 border-b border-slate-50">
                    <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                       <Layout size={14} /> Position
                    </div>
                    <span className="text-xs font-bold text-slate-700">{summary.position}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-50">
                    <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                       <ListFilter size={14} /> KPI Count
                    </div>
                    <span className="text-xs font-black px-2 py-1 bg-slate-100 rounded-lg text-slate-600">{summary.kpiCount} Metrics</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Total Weight</p>
                    <p className={clsx(
                      "text-xl font-black",
                      summary.totalWeight === 100 ? "text-indigo-600" : "text-amber-500"
                    )}>
                      {summary.totalWeight}%
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 group-hover:bg-slate-900 transition-colors group/score">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1 group-hover:text-slate-500">Current Score</p>
                    <p className="text-xl font-black text-slate-800 group-hover:text-indigo-400 transition-colors">{summary.totalScore.toFixed(2)}</p>
                  </div>
                </div>

                <button 
                  onClick={() => window.location.href = `/hr/kpi-management?employeeId=${summary.employeeId}`}
                  className="w-full mt-8 py-4 bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2 group/btn"
                >
                  Manage Profile
                  <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
              <div className="absolute bottom-[-20px] right-[-20px] text-slate-50 opacity-[0.03] rotate-[-20deg]">
                <FileText size={160} />
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center">
             <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-slate-300 rotate-12">
                <Users size={48} />
             </div>
             <h3 className="text-xl font-black text-slate-900 tracking-tight">No assignments found</h3>
             <p className="text-slate-400 text-sm font-medium mt-2">Try adjusting your search filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiAssignedPage;
