import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  useGetLatestKpisByEmployeeQuery,
  useGetEmployeeKpiPeriodsQuery,
  useGetKpisByEmployeeQuery,
  useGetLatestKpiDateByEmployeeQuery
} from '../../features/kpi/kpiApi';
import { useGetEmployeeByIdQuery } from '../../features/hrEmployeeList/hrEmployeeApi';
import { Target, ChevronLeft, Calendar, User, Briefcase, Award, TrendingUp, ShieldCheck, FileEdit, Lock } from 'lucide-react';

export const KpiDetailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const employeeId = searchParams.get('employeeId');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');

  const { data: employeeResponse, isLoading: empLoading } = useGetEmployeeByIdQuery(Number(employeeId), {
    skip: !employeeId
  });

  const { data: periods } = useGetEmployeeKpiPeriodsQuery(Number(employeeId), {
    skip: !employeeId
  });

  const { data: latestKpis } = useGetLatestKpisByEmployeeQuery(Number(employeeId), {
    skip: !employeeId || !!selectedPeriod
  });

  const { data: periodKpis, isLoading: kpisLoading } = useGetKpisByEmployeeQuery(
    { employeeId: Number(employeeId), period: selectedPeriod },
    { skip: !employeeId || !selectedPeriod }
  );

  const { data: latestDateData } = useGetLatestKpiDateByEmployeeQuery(Number(employeeId), {
    skip: !employeeId
  });

  useEffect(() => {
    if (periods && periods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(periods[0].toString());
    }
  }, [periods]);

  const kpis = selectedPeriod ? periodKpis : latestKpis;
  const employee = employeeResponse?.data;
  const isLoading = empLoading || kpisLoading;

  const totalWeight = kpis?.reduce((sum, k) => sum + (k.weight || 0), 0) || 0;
  const totalScore = kpis?.reduce((sum, k) => sum + (k.weightedScore || 0), 0) || 0;
  const currentStatus = kpis?.[0]?.status || 'N/A';

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'LOCKED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DRAFT': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'LOCKED': return <Lock size={12} />;
      case 'SUBMITTED': return <ShieldCheck size={12} />;
      case 'DRAFT': return <FileEdit size={12} />;
      default: return null;
    }
  };

  if (!employeeId) return <div className="p-10 text-center font-bold text-red-500 uppercase tracking-widest">No Employee Selected</div>;

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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Employee KPI Detail</h1>
            <p className="text-slate-500 text-sm font-medium">Historical performance audit and tracking system.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
          <Calendar size={18} className="text-slate-400" />
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-transparent border-none text-sm font-black text-slate-900 focus:ring-0 outline-none min-w-[140px]"
          >
            {periods?.map(p => (
              <option key={p.toString()} value={p.toString()}>{p.toString()}</option>
            ))}
            {(!periods || periods.length === 0) && <option value="">No Periods Found</option>}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center font-black text-slate-300 animate-pulse uppercase tracking-[0.2em]">Synchronizing Records...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Employee Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-3xl font-black mb-4 border border-indigo-100 shadow-inner relative group">
                {employee?.profilePictureUrl ? (
                  <img src={employee.profilePictureUrl} alt="" className="w-full h-full object-cover rounded-3xl" />
                ) : (
                  employee?.employeeName.charAt(0)
                )}
                <div className={`absolute -right-2 -bottom-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-white shadow-sm ${getStatusStyle(currentStatus).split(' ')[0].replace('bg-', 'bg-')}`}>
                  {getStatusIcon(currentStatus)}
                </div>
              </div>
              <h2 className="text-xl font-black text-slate-900">{employee?.employeeName}</h2>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{employee?.employeeId}</p>

              <div className="w-full mt-8 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                    <Briefcase size={14} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Department</p>
                    <p className="text-xs font-bold text-slate-700">{employee?.departmentName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                    <Award size={14} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Position</p>
                    <p className="text-xs font-bold text-slate-700">{employee?.positionName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                    <Calendar size={14} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Last Updated</p>
                    <p className="text-xs font-bold text-slate-700">
                      {latestDateData?.latestDate ? new Date(latestDateData.latestDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 shadow-xl shadow-indigo-100 text-white relative overflow-hidden">
              <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 -rotate-12" />
              <p className="text-xs font-black uppercase tracking-widest opacity-60">Performance Score</p>
              <h3 className="text-4xl font-black mt-2">
                {kpis && kpis.length > 0 ? totalScore.toFixed(2) : 'N/A'}
              </h3>
              <div className="mt-4 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border border-white/20 bg-white/10`}>
                  {currentStatus}
                </span>
                <span className="text-[10px] font-bold opacity-60 flex items-center gap-1">
                  <Target size={12} /> {totalWeight}% Weight
                </span>
              </div>
            </div>
          </div>

          {/* KPI List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-200">
                    <Target size={20} />
                  </div>
                  <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Targeted Metrics</h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                      <th className="py-4 px-6">KPI Name</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6">Target/Unit</th>
                      <th className="py-4 px-6 text-center">Weight</th>
                      <th className="py-4 px-6 text-right">Actual</th>
                      <th className="py-4 px-6 text-right">Score</th>
                      <th className="py-4 px-6 text-right">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {kpis && kpis.length > 0 ? kpis.map((kpi, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <p className="text-sm font-black text-slate-900">{kpi.name}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-tight">
                            {kpi.category}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm font-bold text-slate-700">{kpi.target} <span className="text-slate-400 font-medium">{kpi.unit}</span></p>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="text-xs font-black text-blue-600">{kpi.weight}%</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <p className="text-sm font-black text-slate-900">{kpi.actual || '-'}</p>
                        </td>
                        <td className="py-4 px-6 text-right font-black text-indigo-600">
                          {kpi.weightedScore?.toFixed(2) || '0.00'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <p className="text-[10px] font-bold text-slate-400">
                            {kpi.updatedDate ? new Date(kpi.updatedDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                              <Target size={32} />
                            </div>
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No KPIs Assigned for this Employee</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {kpis && kpis.length > 0 && (
                    <tfoot className="bg-slate-50/80 border-t border-slate-100">
                      <tr className="font-black">
                        <td colSpan={6} className="py-6 px-6 text-right text-[10px] text-slate-400 uppercase tracking-[0.2em]">Overall Achievement</td>
                        <td className="py-6 px-6 text-right text-2xl text-indigo-700">
                          {kpis.reduce((sum, k) => sum + (k.weightedScore || 0), 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
