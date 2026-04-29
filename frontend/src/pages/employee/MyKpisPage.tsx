import React from 'react';
import { Target, TrendingUp, Award, Calendar } from 'lucide-react';
import { useGetMyLatestKpisQuery } from '../../features/kpi/kpiApi';

export function MyKpisPage() {
  const { data: kpis, isLoading } = useGetMyLatestKpisQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My KPIs</h1>
          <p className="text-slate-500 font-medium">Track your personal performance indicators and progress</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total KPIs</p>
            <h3 className="text-3xl font-black text-slate-900">{kpis?.length || 0}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <Target size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Score</p>
            <h3 className="text-3xl font-black text-slate-900">
              {kpis && kpis.length > 0 
                ? (kpis.reduce((acc, curr) => acc + (curr.score || 0), 0) / kpis.length).toFixed(1) 
                : '0.0'}
            </h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight text-sm">
              {kpis?.[0]?.status || 'ACTIVE'}
            </h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
            <Award size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50">
          <h3 className="text-lg font-black text-slate-900">KPI Details</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Performance breakdown for the current period</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="py-4 px-8">KPI Name</th>
                <th className="py-4 px-4 text-center">Weight</th>
                <th className="py-4 px-4 text-center">Target</th>
                <th className="py-4 px-4 text-center">Actual</th>
                <th className="py-4 px-4 text-center">Score</th>
                <th className="py-4 px-8 text-right">Weighted Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {kpis?.map((kpi) => (
                <tr key={kpi.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="py-6 px-8">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors uppercase">{kpi.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">{kpi.category}</p>
                    </div>
                  </td>
                  <td className="py-6 px-4 text-center">
                    <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600">
                      {kpi.weight}%
                    </span>
                  </td>
                  <td className="py-6 px-4 text-center">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                      {kpi.target} <span className="text-[10px] text-slate-400">{kpi.unit}</span>
                    </span>
                  </td>
                  <td className="py-6 px-4 text-center font-black text-slate-900 text-sm">
                    {kpi.actual || '—'}
                  </td>
                  <td className="py-6 px-4 text-center">
                    <span className={`text-sm font-black ${
                      (kpi.score || 0) >= 80 ? 'text-emerald-600' : (kpi.score || 0) >= 60 ? 'text-blue-600' : 'text-amber-600'
                    }`}>
                      {kpi.score || '0.0'}
                    </span>
                  </td>
                  <td className="py-6 px-8 text-right">
                    <span className="text-sm font-black text-slate-900 tracking-tight">
                      {kpi.weightedScore || '0.0'}
                    </span>
                  </td>
                </tr>
              ))}
              {(!kpis || kpis.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Target size={40} className="text-slate-200" />
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No KPIs found for this period</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
