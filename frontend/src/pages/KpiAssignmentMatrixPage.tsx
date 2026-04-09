import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface KpiRow {
  id: string;
  kpi: string;
  category: string;
  target: string;
  unit: string;
  actual: string;
  weight: number;
  score: number;
  weightedScore: number;
  direction: 'higher' | 'lower';
}
//MNA
export const KpiAssignmentMatrixPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedType, setSelectedType] = useState<'employee' | 'department' | 'role'>('role');
  const [targetId, setTargetId] = useState('');
  const [kpis, setKpis] = useState<KpiRow[]>([
    { id: '1', kpi: '', category: '', target: '', unit: '', actual: '', weight: 0, score: 0, weightedScore: 0, direction: 'higher' }
  ]);

  // Load edit data
  useEffect(() => {
    if (location.state && location.state.editData) {
      const { role, kpis: existingKpis } = location.state.editData;
      setTargetId(role);
      setKpis(existingKpis.map((k: any, idx: number) => ({
        ...k,
        id: idx.toString(),
        kpi: k.kpi || k.name || '',
        actual: k.actual || '',
        score: k.score || 0,
        weightedScore: k.weightedScore || 0,
        direction: k.direction || 'higher'
      })));
      setSelectedType('role');
    }
  }, [location.state]);

  const totalWeight = kpis.reduce((sum, item) => sum + (item.weight || 0), 0);
  const totalScore = kpis.reduce((sum, item) => sum + (item.weightedScore || 0), 0);

  // SRS Rule: Total weight must exactly equal 100%
  const isWeightValid = totalWeight === 100;

  const addRow = () => {
    setKpis([...kpis, { id: Date.now().toString(), kpi: '', category: '', target: '', unit: '', actual: '', weight: 0, score: 0, weightedScore: 0, direction: 'higher' }]);
  };

  const removeRow = (id: string) => {
    if (kpis.length > 1) {
      setKpis(kpis.filter(k => k.id !== id));
    }
  };

  const updateKpi = (id: string, field: keyof KpiRow, value: any) => {
    setKpis(prev => prev.map(k => {
      if (k.id === id) {
        const updated = { ...k, [field]: value };
        const parseVal = (v: string) => parseFloat(v.replace(/[^\d.]/g, '')) || 0;
        const targetVal = parseVal(updated.target);
        const actualVal = parseVal(updated.actual);

        let score = updated.score;
        if (targetVal > 0 && actualVal > 0) {
          score = updated.direction === 'higher' ? (actualVal / targetVal) * 100 : (targetVal / actualVal) * 100;
        }
        const weightedScore = (score * (updated.weight || 0)) / 100;
        return { ...updated, score, weightedScore };
      }
      return k;
    }));
  };

  const handleSave = (isFinal: boolean) => {
    if (isFinal && !isWeightValid) {
      alert(`FR-KPI-06 Validation Blocked: Final submission requires exactly 100% weight. Current total: ${totalWeight}%`);
      return;
    }

    const finalRoleName = targetId || (selectedType === 'role' ? 'New Role' : `Assignment (${selectedType})`);
    const savedKpis = localStorage.getItem('epms_role_kpis');
    let kpiList = savedKpis ? JSON.parse(savedKpis) : [];
    const newAssignment = { role: finalRoleName, kpis: kpis.map(({ id, ...rest }) => rest) };

    const existingIndex = kpiList.findIndex((item: any) => item.role === finalRoleName);
    if (existingIndex > -1) kpiList[existingIndex] = newAssignment;
    else kpiList.push(newAssignment);

    localStorage.setItem('epms_role_kpis', JSON.stringify(kpiList));
    alert(`Audit Log: KPI ${isFinal ? 'Finalized' : 'Saved as Draft'}. Weight: ${totalWeight}%`);
    navigate('/hr/goals');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-inter shadow-inner animate-in fade-in duration-500">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/hr/goals')} className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mb-2">
            <i className="bi bi-arrow-left"></i> Back to Dashboard
          </button>
          <h1 className="text-3xl font-extrabold text-slate-1000 tracking-tight">Standardized KPI Calibration</h1>
          <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-widest">Requirement FR-KPI-06: Total Weight Validation</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => handleSave(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all font-semibold">
            Save as Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${isWeightValid ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
          >
            <i className="bi bi-shield-check"></i> Final Submission
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Live Calibration Monitor</label>
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-full border-[6px] flex items-center justify-center text-xl font-black transition-all duration-700 ${isWeightValid ? 'border-emerald-500 text-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-slate-100 text-slate-300'}`}>
                {totalWeight}%
              </div>
              <div>
                <h4 className={`text-lg font-black ${isWeightValid ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {isWeightValid ? 'Weight Goal Reached!' : `Current Distribution: ${totalWeight}%`}
                </h4>
                <p className="text-xs text-slate-500">
                  {isWeightValid ? 'Standardized weight calibration confirmed.' : `Needs ${100 - totalWeight}% more to allow submission.`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full max-w-md">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Assign Dynamic KPI To (KM-20)</label>
            <div className="flex gap-2 mb-3">
              {['employee', 'department', 'role'].map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type as any)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg uppercase ${selectedType === type ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}
                >
                  {type}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder={`Select ${selectedType} name...`}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-bold text-slate-800 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50/80 border-b border-slate-200 px-8 py-5 flex justify-between items-center">
            <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase text-xs">
              <i className="bi bi-list-task text-blue-600 text-lg"></i> Dynamic Field Configurations (KM-19)
            </h3>
            <button onClick={addRow} className="px-4 py-1.5 bg-blue-600 text-white text-[10px] rounded-lg font-black uppercase hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center gap-2">
              <i className="bi bi-plus-lg"></i> Add Custom Field
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50/50 text-slate-400 font-bold uppercase text-[9px] tracking-widest border-b border-slate-200">
                <tr>
                  <th className="py-5 px-8">KPI</th>
                  <th className="py-5 px-4 font-black">Category</th>
                  <th className="py-5 px-4">Target</th>
                  <th className="py-5 px-4">Unit</th>
                  <th className="py-5 px-4">Actual</th>
                  <th className="py-5 px-4 text-center">Weight (%)</th>
                  <th className="py-5 px-4 text-center">Score (%)</th>
                  <th className="py-5 px-8 text-right bg-blue-50/30">Weighted Score</th>
                  <th className="py-5 px-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kpis.map((kpi) => (
                  <tr key={kpi.id} className="hover:bg-slate-50/50 group transition-all">
                    <td className="py-4 px-8">
                      <input type="text" className="bg-transparent border-none outline-none w-full font-bold text-slate-800 placeholder:text-slate-200" value={kpi.kpi} onChange={(e) => updateKpi(kpi.id, 'kpi', e.target.value)} placeholder="Define KPI Name..." />
                    </td>
                    <td className="py-4 px-4">
                      <input type="text" className="bg-transparent border-none outline-none w-full text-xs font-bold text-slate-600 uppercase" value={kpi.category} onChange={(e) => updateKpi(kpi.id, 'category', e.target.value)} placeholder="Category" />
                    </td>
                    <td className="py-4 px-4">
                      <input type="text" className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 w-full text-slate-700 font-bold text-xs" value={kpi.target} onChange={(e) => updateKpi(kpi.id, 'target', e.target.value)} placeholder="90%" />
                    </td>
                    <td className="py-4 px-4">
                      <input type="text" className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 w-full text-slate-500 text-xs italic" value={kpi.unit} onChange={(e) => updateKpi(kpi.id, 'unit', e.target.value)} placeholder="e.g. % / Days" />
                    </td>
                    <td className="py-4 px-4 text-xs font-bold text-slate-400">
                      {kpi.actual || '-'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <input type="number" className={`bg-slate-100 border-2 rounded-xl px-2 py-2 w-20 text-center font-black outline-none transition-all ${kpi.weight > 0 ? 'border-blue-200 text-blue-700' : 'border-slate-200 text-slate-400'}`} value={kpi.weight || ''} onChange={(e) => updateKpi(kpi.id, 'weight', parseFloat(e.target.value) || 0)} />
                    </td>
                    <td className="py-4 px-4 text-center text-xs font-black text-slate-500">
                      {kpi.score.toFixed(2)}%
                    </td>
                    <td className="py-4 px-8 text-right bg-blue-50/20 font-black text-blue-900">
                      {kpi.weightedScore.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button onClick={() => removeRow(kpi.id)} className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><i className="bi bi-trash3-fill"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className={`transition-all duration-500 font-bold border-t ${isWeightValid ? 'bg-emerald-900 text-white' : 'bg-slate-900 text-white'}`}>
                <tr>
                  <td colSpan={5} className="py-8 px-10 text-right text-slate-400 uppercase text-[10px] font-black tracking-[4px]">Weight Audit Baseline</td>
                  <td className={`py-8 px-4 text-center text-2xl font-black ${isWeightValid ? 'text-emerald-400' : 'text-red-400'}`}>
                    {totalWeight}%
                  </td>
                  <td className="py-8 px-4 text-center text-xs font-black text-blue-400">
                    AVG SCORE: {(kpis.reduce((a, b) => a + b.score, 0) / kpis.length || 0).toFixed(1)}%
                  </td>
                  <td className="py-8 px-10 text-right text-3xl font-black text-emerald-400">
                    {totalScore.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
