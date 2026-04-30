import { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Target,
  MessageSquare,
  TrendingUp,
  ExternalLink,
  Zap,
  X,
  Save
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useGetManagerTeamQuery, useGetLatestKpisByEmployeeQuery, useUpdateManagerKpiActualsMutation, type Kpi } from '../../features/kpi/kpiApi';
import toast from 'react-hot-toast';

interface PerformanceData {
  name: string;
  score: number;
}

interface TeamMember {
  name: string;
  role: string;
  status: string;
  score: number;
  initial: string;
  color: string;
  id?: number;
}

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
                    <tr key={kpi.id || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-xs font-bold text-slate-900 border-r border-slate-100">{kpi.name}</td>
                      <td className="py-4 px-4 text-[11px] font-medium text-slate-500 border-r border-slate-100 uppercase">{kpi.category}</td>
                      <td className="py-4 px-4 text-center text-xs font-bold text-slate-700 border-r border-slate-100">{kpi.target}</td>
                      <td className="py-4 px-4 text-center text-[10px] font-black text-slate-400 border-r border-slate-100 uppercase">{kpi.unit}</td>
                      <td className="py-4 px-2 border-r border-slate-100">
                        <input 
                          type="text" 
                          value={kpi.actual || ''} 
                          onChange={(e) => handleChange(idx, 'actual', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-center"
                          placeholder="—"
                        />
                      </td>
                      <td className="py-4 px-4 text-center text-xs font-black text-slate-900 border-r border-slate-100">{kpi.weight}%</td>
                      <td className="py-4 px-2 border-r border-slate-100">
                        <input 
                          type="number" 
                          min="0" max="100"
                          value={kpi.score || ''} 
                          onChange={(e) => handleChange(idx, 'score', parseFloat(e.target.value))}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-center"
                        />
                      </td>
                      <td className="py-4 px-2">
                        <input 
                          type="number" 
                          value={kpi.weightedScore || ''} 
                          onChange={(e) => handleChange(idx, 'weightedScore', parseFloat(e.target.value))}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right"
                        />
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

export function ManagerDashboardPage() {
  const { data: teamData, isLoading: isTeamLoading } = useGetManagerTeamQuery();
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const teamMembers: TeamMember[] = teamData ? teamData.map((emp, idx) => ({
    id: emp.id,
    name: emp.name,
    role: emp.role,
    status: emp.status || 'ACTIVE',
    score: 0,
    initial: emp.name ? emp.name.charAt(0) : 'U',
    color: ['bg-amber-100 text-amber-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-purple-100 text-purple-700'][idx % 4]
  })) : [];

  const data: PerformanceData[] = teamMembers.map(tm => ({ name: tm.name, score: tm.score }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manager Dashboard</h1>
          <p className="text-slate-500 font-medium">Monitor and manage your team's performance</p>
        </div>
        <div className="flex gap-3">
          <a href="/manager/pip" className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-xl text-xs font-black text-white hover:shadow-lg transition-all">
            <Zap size={14} className="text-amber-400" />
            Team PIPs
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Team Size</p>
            <h3 className="text-3xl font-black text-slate-900">{isTeamLoading ? '-' : teamMembers.length}</h3>
            <p className="text-[10px] font-bold text-amber-600 uppercase mt-1">Direct reports</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending 1-on-1s</p>
            <h3 className="text-3xl font-black text-slate-900">0</h3>
            <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">Scheduled meetings</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
            <Calendar size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Team Avg Score</p>
            <h3 className="text-3xl font-black text-slate-900">86.4</h3>
            <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">KPI average</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Feedback</p>
            <h3 className="text-3xl font-black text-slate-900">0%</h3>
            <p className="text-[10px] font-bold text-amber-600 uppercase mt-1">Completion rate</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-700 shadow-sm">
            <MessageSquare size={24} />
          </div>
        </div>
      </div>

      {/* Main Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-900">Team KPI Performance</h3>
              <p className="text-xs font-bold text-slate-400">Average KPI scores by team member</p>
            </div>
            <button className="text-slate-400 hover:text-slate-900 transition-colors">
              <ExternalLink size={18} />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                barSize={40}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="score" fill="#c2410c" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Members List */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-900">Team Members</h3>
              <p className="text-xs font-bold text-slate-400">Status of your direct reports</p>
            </div>
          </div>

          <div className="space-y-4">
            {teamMembers.length === 0 && !isTeamLoading && (
              <p className="text-sm text-slate-500 font-medium text-center py-4">No team members found.</p>
            )}
            {teamMembers.map((member) => (
              <div 
                key={member.name} 
                onClick={() => setSelectedEmployee(member)}
                className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-24 transition-all hover:shadow-md cursor-pointer border border-transparent hover:border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${member.color} rounded-full flex items-center justify-center font-black text-xs`}>
                    {member.initial}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 leading-none mb-1 uppercase tracking-tight">{member.name}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{member.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900 tracking-tighter mb-1">{member.score}</p>
                  <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${member.status === 'SUBMITTED' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                    {member.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {selectedEmployee && (
        <KpiEditModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
      )}
    </div>
  );
}


