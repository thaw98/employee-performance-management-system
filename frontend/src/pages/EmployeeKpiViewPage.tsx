import React, { useState } from 'react';

export const EmployeeKpiViewPage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState('2026');
  //MNA
  // Sample data grouped by year 
  const kpiData = {
    '2026': [
      { name: 'Sprint / task completion rate', category: 'Delivery Performance', target: '90%', weight: 25, actual: '92%', score: 100 },
      { name: 'Code quality (bugs / PR feedback)', category: 'Code Quality', target: '90%', weight: 25, actual: '88%', score: 98 },
      { name: 'System design contribution', category: 'System Design', target: '50%', weight: 20, actual: '60%', score: 110 },
      { name: 'Mentorship sessions', category: 'Leadership', target: '20%', weight: 15, actual: '15%', score: 75 },
      { name: 'Compliance Rate', category: 'Compliance Management', target: '100%', weight: 15, actual: '100%', score: 100 },
    ],
    '2025': [
      { name: 'Sprint / task completion rate', category: 'Delivery Performance', target: '85%', weight: 30, actual: '87%', score: 102 },
      { name: 'Bug count', category: 'Code Quality', target: '< 5 per month', weight: 40, actual: '3 per month', score: 120 },
      { name: 'Technical Docs', category: 'Documentation', target: '5 items', weight: 30, actual: '4 items', score: 80 },
    ]
  };

  const currentKpis = kpiData[selectedYear as keyof typeof kpiData] || [];
  const totalScore = currentKpis.reduce((acc, kpi) => acc + (kpi.score * (kpi.weight / 100)), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-inter animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Performance KPI</h1>
          <p className="text-slate-500 mt-1">Review your targets and tracked performance for the current budget year.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Budget Year</span>
          <select
            className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-blue-600 focus:ring-0 outline-none cursor-pointer"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="2026">April 2026 - March 2027</option>
            <option value="2025">April 2025 - March 2026</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-blue-100 font-medium mb-1">Final Weighted Score</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black">{totalScore.toFixed(1)}</span>
              <span className="text-blue-200">/ 100</span>
            </div>
            <div className="mt-6 flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full w-fit">
              <i className="bi bi-star-fill text-yellow-400 text-xs"></i>
              <span className="text-xs font-bold tracking-wide uppercase">Excellent Performance</span>
            </div>
          </div>
          {/* Decorative shapes */}
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider">Weight Distribution</h3>
            <i className="bi bi-pie-chart-fill text-indigo-500 text-xl"></i>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden flex">
            <div className="h-full bg-blue-500" style={{ width: '25%' }}></div>
            <div className="h-full bg-indigo-500" style={{ width: '25%' }}></div>
            <div className="h-full bg-purple-500" style={{ width: '20%' }}></div>
            <div className="h-full bg-emerald-500" style={{ width: '15%' }}></div>
            <div className="h-full bg-slate-400" style={{ width: '15%' }}></div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs font-medium text-slate-600">Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              <span className="text-xs font-medium text-slate-600">Quality</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider">Status</h3>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-200">LOCKED</span>
          </div>
          <p className="text-2xl font-black text-slate-800">Finalized</p>
          <p className="text-xs text-slate-500 mt-1">This record was locked on Mar 31, 2026 by HR Administration.</p>
        </div>
      </div>

      {/* KPI Detail Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Detailed KPI Breakdown</h3>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Read-Only Mode</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="py-5 px-8">KPI Name</th>
                <th className="py-5 px-8">Category</th>
                <th className="py-5 px-8">Target</th>
                <th className="py-5 px-8">Actual Achieved</th>
                <th className="py-5 px-8 text-center">Weight</th>
                <th className="py-5 px-8 text-right">Weighted Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentKpis.map((kpi, idx) => {
                const weightedScore = (kpi.score * (kpi.weight / 100));
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-8 font-bold text-slate-800 text-sm">{kpi.name}</td>
                    <td className="py-4 px-8">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg uppercase tracking-tight">
                        {kpi.category}
                      </span>
                    </td>
                    <td className="py-4 px-8 text-slate-500 text-sm">{kpi.target}</td>
                    <td className="py-4 px-8 font-bold text-emerald-600 text-sm">{kpi.actual}</td>
                    <td className="py-4 px-8 text-center font-bold text-blue-600 text-sm">{kpi.weight}%</td>
                    <td className="py-4 px-8 text-right font-black text-slate-900 text-sm">{weightedScore.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50/50 border-t border-slate-200">
              <tr>
                <td colSpan={4} className="py-6 px-8 text-right font-bold text-slate-400 uppercase text-xs tracking-widest">Total Weighted Score</td>
                <td className="py-6 px-8 text-center font-black text-slate-900">100%</td>
                <td className="py-6 px-8 text-right text-2xl font-black text-blue-700">{totalScore.toFixed(1)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
