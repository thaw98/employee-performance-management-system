import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
//MNA
export const KpiDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'templates'>('templates');
  const [showExcelMenu, setShowExcelMenu] = useState(false);
  const navigate = useNavigate();

  // Load from localStorage to persist changes from Assignment Matrix
  const [roleKpis, setRoleKpis] = useState<any[]>([]);

  useEffect(() => {
    const savedKpis = localStorage.getItem('epms_role_kpis');
    if (savedKpis) {
      setRoleKpis(JSON.parse(savedKpis));
    } else {
      // Default data with new columns
      const defaults = [
        {
          role: '07-PS HEAD',
          kpis: [
            { kpi: 'On-time delivery rate', category: 'Delivery Performance', target: '90%', unit: 'Project Schedule', actual: '', weight: 25, score: 0, weightedScore: 0 },
            { kpi: 'Project margin', category: 'Financial Management', target: '40%', unit: 'Project Costing', actual: '', weight: 15, score: 0, weightedScore: 0 },
            { kpi: 'Defect leakage', category: 'Quality Assurance', target: '95%', unit: '≤ target threshold', actual: '', weight: 20, score: 0, weightedScore: 0 },
            { kpi: 'Escalation resolution time', category: 'Stakeholder Satisfaction', target: '50%', unit: 'Within SLA', actual: '', weight: 15, score: 0, weightedScore: 0 },
            { kpi: 'Employee turnover rate', category: 'Team Performance', target: '20%', unit: 'Turnover rate', actual: '', weight: 10, score: 0, weightedScore: 0 },
            { kpi: 'Compliance Rate', category: 'Compliance Management', target: '-', unit: '-', actual: '', weight: 15, score: 0, weightedScore: 0 },
          ]
        }
      ];
      setRoleKpis(defaults);
      localStorage.setItem('epms_role_kpis', JSON.stringify(defaults));
    }
  }, []);

  const handleEdit = (roleData: any) => {
    navigate('/hr/kpi-assign', { state: { editData: roleData } });
  };

  const metrics = [
    { title: 'Active Periods', value: '2', icon: 'bi-calendar-check', color: 'from-blue-500 to-blue-600' },
    { title: 'Templates Defined', value: roleKpis.length.toString(), icon: 'bi-file-earmark-text', color: 'from-indigo-500 to-indigo-600' },
    { title: 'KPIs Assigned', value: '142', icon: 'bi-people', color: 'from-purple-500 to-purple-600' },
    { title: 'Completion Rate', value: '87%', icon: 'bi-graph-up-arrow', color: 'from-emerald-500 to-emerald-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-inter shadow-inner">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">HR KPI Management</h1>
          <p className="text-slate-500 mt-1">Configure position KPIs. Requirement: Total weight must equal 100%.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Excel Tools Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExcelMenu(!showExcelMenu)}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all font-medium flex items-center gap-2"
            >
              <i className="bi bi-file-earmark-spreadsheet text-emerald-600"></i> Excel Tools <i className={`bi bi-chevron-down text-[10px] transition-transform ${showExcelMenu ? 'rotate-180' : ''}`}></i>
            </button>

            {showExcelMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExcelMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    onClick={() => { window.open('http://localhost:8080/api/v1/kpis/excel/export?employeeId=1&periodId=1', '_blank'); setShowExcelMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <i className="bi bi-upload text-emerald-500"></i> Export to Excel
                  </button>
                  <label className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer">
                    <i className="bi bi-download text-blue-500"></i> Import Data
                    <input
                      type="file"
                      className="hidden"
                      accept=".xlsx, .xls"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                          const res = await fetch('http://localhost:8080/api/v1/kpis/excel/import', {
                            method: 'POST',
                            body: formData,
                            headers: { 'X-User-Id': '1' }
                          });
                          if (res.ok) {
                            alert('Import Success');
                            window.location.reload();
                          } else {
                            alert('Import Failed');
                          }
                        } catch (err) {
                          alert('Error');
                        }
                        setShowExcelMenu(false);
                      }}
                    />
                  </label>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => navigate('/hr/kpi-audit-logs')}
            className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl shadow-sm hover:bg-indigo-100 transition-all font-medium flex items-center gap-2"
          >
            <i className="bi bi-clock-history"></i> Audit Logs
          </button>

          <button
            onClick={() => navigate('/hr/kpi-periods')}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all font-medium flex items-center gap-2"
          >
            <i className="bi bi-calendar-range text-blue-600"></i> Manage Periods
          </button>

          <button
            onClick={() => navigate('/hr/kpi-assign')}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:bg-blue-700 transition-all font-bold flex items-center gap-2"
          >
            <i className="bi bi-plus-lg"></i> Create KPI Setup
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-transform duration-300 hover:-translate-y-1 group">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.color} text-white flex items-center justify-center text-xl mb-4 shadow-inner`}>
              <i className={`bi ${metric.icon}`}></i>
            </div>
            <h3 className="text-slate-500 font-medium text-sm mb-1">{metric.title}</h3>
            <p className="text-3xl font-bold text-slate-800">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 flex overflow-x-auto">
          {['overview', 'templates'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-4 font-semibold text-sm capitalize whitespace-nowrap transition-colors ${activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
              {tab === 'templates' ? 'Role Templates & Formulas' : tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'templates' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8">
              {roleKpis.map((roleSection, idx) => {
                const totalWeight = roleSection.kpis.reduce((acc: any, curr: any) => acc + (curr.weight || 0), 0);
                const totalWeightedScore = roleSection.kpis.reduce((acc: any, curr: any) => acc + (curr.weightedScore || 0), 0);

                return (
                  <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-blue-900 tracking-wide text-lg">{roleSection.role}</h4>
                        <button
                          onClick={() => handleEdit(roleSection)}
                          className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100 font-bold"
                        >
                          <i className="bi bi-pencil-square mr-1"></i> Edit Setup
                        </button>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Weight Status</span>
                          <span className={`font-black text-sm ${totalWeight === 100 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {totalWeight}% {totalWeight === 100 && 'Valid'}
                          </span>
                        </div>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Weighted Score</span>
                          <span className="font-black text-sm text-blue-700">
                            {totalWeightedScore.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white border-b border-slate-100 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                          <tr>
                            <th className="py-4 px-6">KPI</th>
                            <th className="py-4 px-3">Category</th>
                            <th className="py-4 px-3">Target</th>
                            <th className="py-4 px-3">Unit</th>
                            <th className="py-4 px-3">Actual</th>
                            <th className="py-4 px-3 text-center">Weight (%)</th>
                            <th className="py-4 px-3 text-center">Score (%)</th>
                            <th className="py-4 px-6 text-right">Weighted Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roleSection.kpis.map((kpi: any, kpiIdx: any) => (
                            <tr key={kpiIdx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors last:border-0">
                              <td className="py-3 px-6 font-bold text-slate-800">{kpi.kpi || kpi.name}</td>
                              <td className="py-3 px-3"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">{kpi.category}</span></td>
                              <td className="py-3 px-3 text-slate-700 font-medium">{kpi.target}</td>
                              <td className="py-3 px-3 text-slate-500 text-xs">{kpi.unit}</td>
                              <td className="py-3 px-3 text-slate-500 italic text-xs">{kpi.actual || '-'}</td>
                              <td className="py-3 px-3 text-center font-bold text-blue-600">{kpi.weight}%</td>
                              <td className="py-3 px-3 text-center font-medium text-slate-600">{kpi.score}%</td>
                              <td className="py-3 px-6 text-right font-black text-slate-900">{kpi.weightedScore?.toFixed(2) || '0.00'}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50/30 border-t border-slate-100 font-bold">
                          <tr>
                            <td colSpan={5} className="py-3 px-6 text-right text-[10px] text-slate-400 uppercase tracking-widest">Role Summary</td>
                            <td className={`py-3 px-3 text-center ${totalWeight === 100 ? 'text-emerald-600' : 'text-red-500'}`}>{totalWeight}%</td>
                            <td className="py-3 px-3"></td>
                            <td className="py-3 px-6 text-right text-blue-800">{totalWeightedScore.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
