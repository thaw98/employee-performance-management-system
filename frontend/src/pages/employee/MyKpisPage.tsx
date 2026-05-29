import { Target, TrendingUp, Award, Calendar } from 'lucide-react';
import { useGetMyLatestKpisQuery } from '../../features/kpi/kpiApi';
import { displayKpiTarget } from '../../features/kpi/kpiDisplay';
import { KPI_CHART_COLORS, kpisGradientBr } from '../../features/kpi/kpisTheme';

export function MyKpisPage() {
  const { data: kpis, isLoading } = useGetMyLatestKpisQuery();

  const totalWeight = kpis?.reduce((acc, curr) => acc + (curr.weight || 0), 0) || 0;
  const weightComplete = totalWeight === 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#dbeafe] border-t-[#2463eb] rounded-full animate-spin" />
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
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#2463eb]/20 ${kpisGradientBr}`}>
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
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#2463eb]/20 ${kpisGradientBr}`}>
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Weight</p>
            <h3 className={`text-3xl font-black ${weightComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
              {totalWeight}%
            </h3>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              weightComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}
          >
            <Award size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Weight Breakdown</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">How each indicator contributes to your final score</p>
          </div>
          {!weightComplete && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 animate-pulse">
              <Calendar size={14} />
              <span className="text-[10px] font-black uppercase">Configuration Incomplete (Total Weight != 100%)</span>
            </div>
          )}
        </div>

        <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden flex shadow-inner border border-slate-100">
          {kpis?.map((kpi, idx) => (
            <div
              key={kpi.id}
              className="h-full transition-all duration-1000 ease-out hover:opacity-80 cursor-help border-r border-white/20 last:border-0"
              style={{
                width: `${kpi.weight}%`,
                backgroundColor: KPI_CHART_COLORS[idx % KPI_CHART_COLORS.length],
              }}
              title={`${kpi.name}: ${kpi.weight}%`}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {kpis?.map((kpi, idx) => (
            <div key={kpi.id} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: KPI_CHART_COLORS[idx % KPI_CHART_COLORS.length],
                }}
              />
              <span className="text-xs font-black text-slate-500 uppercase truncate" title={kpi.name}>
                {kpi.name}
              </span>
              <span className="text-xs font-black text-slate-900 ml-auto">{kpi.weight}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-[#eff6ff]/50">
          <h3 className="text-lg font-black text-slate-900">KPI Details</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Performance breakdown for the current period</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#eff6ff]/60 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-[#bfdbfe]/50">
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
                <tr key={kpi.id} className="hover:bg-[#eff6ff]/30 transition-colors group">
                  <td className="py-6 px-8">
                    <div>
                      <h4 className="text-base font-black text-slate-900 tracking-tight group-hover:text-[#2463eb] transition-colors uppercase">{kpi.name}</h4>
                      <p className="text-xs font-bold text-slate-500 uppercase mt-0.5 tracking-wider">{kpi.category}</p>
                    </div>
                  </td>
                  <td className="py-6 px-4 text-center">
                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-700">
                      {kpi.weight}%
                    </span>
                  </td>
                  <td className="py-6 px-4 text-center">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">
	                      {displayKpiTarget(kpi.target, kpi.unit)}
                    </span>
                  </td>
                  <td className="py-6 px-4 text-center font-black text-slate-900 text-sm">
                    {kpi.actual || '—'}
                  </td>
                  <td className="py-6 px-4 text-center">
                    <span
                      className={`text-sm font-black ${
                        (kpi.score || 0) >= 80
                          ? 'text-emerald-600'
                          : (kpi.score || 0) >= 60
                            ? 'text-[#2463eb]'
                            : 'text-amber-600'
                      }`}
                    >
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
              {kpis && kpis.length > 0 && (
                <tr className="bg-[#eff6ff]/40 font-black">
                  <td className="py-6 px-8 text-sm font-black text-slate-900 uppercase tracking-widest">Total Aggregate</td>
                  <td className="py-6 px-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] ${
                        weightComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {totalWeight}%
                    </span>
                  </td>
                  <td className="py-6 px-4" />
                  <td className="py-6 px-4" />
                  <td className="py-6 px-4" />
                  <td className="py-6 px-8 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-lg text-[#2463eb] tracking-tight">
                        {kpis.reduce((acc, curr) => acc + (curr.weightedScore || 0), 0).toFixed(1)}
                      </span>
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wider mt-0.5">Total Score</span>
                    </div>
                  </td>
                </tr>
              )}
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
