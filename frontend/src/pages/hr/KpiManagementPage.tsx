import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, AlertCircle, CheckCircle2, Target } from 'lucide-react';
import { useGetEmployeesQuery } from '../../features/hrEmployeeList/hrEmployeeApi';
import { useGetKpisByEmployeeQuery, useSetupKpisMutation } from '../../features/kpi/kpiApi';
import type { Kpi } from '../../features/kpi/kpiApi';
import { toast } from 'react-hot-toast';

export const KpiManagementPage: React.FC = () => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [period, setPeriod] = useState('2026-2027');
  const [kpis, setKpis] = useState<Kpi[]>([]);

  const { data: employeesResponse, isLoading: employeesLoading } = useGetEmployeesQuery({ size: 1000 });
  const employees = employeesResponse?.data?.content || [];

  const { data: existingKpis, isLoading: kpisLoading, refetch: refetchKpis } = useGetKpisByEmployeeQuery(
    { employeeId: selectedEmployeeId!, period },
    { skip: !selectedEmployeeId }
  );

  const [setupKpis, { isLoading: isSaving }] = useSetupKpisMutation();

  useEffect(() => {
    if (existingKpis && existingKpis.length > 0) {
      setKpis(existingKpis);
    } else {
      setKpis([]);
    }
  }, [existingKpis]);

  const addKpiRow = () => {
    if (!selectedEmployeeId) {
      toast.error('Please select an employee first');
      return;
    }
    const newKpi: Kpi = {
      employeeId: selectedEmployeeId,
      name: '',
      category: '',
      target: '',
      unit: '',
      actual: '',
      weight: 0,
      score: 0,
      weightedScore: 0,
      period,
      status: 'DRAFT'
    };
    setKpis([...kpis, newKpi]);
  };

  const removeKpiRow = (index: number) => {
    const newKpis = [...kpis];
    newKpis.splice(index, 1);
    setKpis(newKpis);
  };

  const handleInputChange = (index: number, field: keyof Kpi, value: any) => {
    const newKpis = [...kpis];
    (newKpis[index] as any)[field] = value;

    // Recalculate score and weighted score if weight or actual/score changes
    if (field === 'weight' || field === 'score') {
      const weight = Number(newKpis[index].weight) || 0;
      const score = Number(newKpis[index].score) || 0;
      newKpis[index].weightedScore = (score * weight) / 100;
    }

    setKpis(newKpis);
  };

  const totalWeight = kpis.reduce((sum, kpi) => sum + (Number(kpi.weight) || 0), 0);
  const totalScore = kpis.reduce((sum, kpi) => sum + (Number(kpi.weightedScore) || 0), 0);

  const handleSave = async () => {
    if (!selectedEmployeeId) {
      toast.error('Please select an employee');
      return;
    }

    if (kpis.length === 0) {
      toast.error('Please add at least one KPI');
      return;
    }

    // Validation
    const invalidKpis = kpis.filter(kpi => !kpi.name || !kpi.category || !kpi.target || !kpi.weight);
    if (invalidKpis.length > 0) {
      toast.error('Please fill in all required fields (Name, Category, Target, Weight)');
      return;
    }

    if (totalWeight !== 100) {
      toast.error(`Total weight must be 100%. Current total: ${totalWeight}%`);
      return;
    }

    try {
      await setupKpis(kpis.map(k => ({ ...k, employeeId: selectedEmployeeId }))).unwrap();
      toast.success('KPI setup saved successfully');
      refetchKpis();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to save KPI setup');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">KPI Modeler</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Define performance targets and weights for employees.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</span>
            <select
              className="bg-transparent border-none text-sm font-bold text-slate-900 focus:ring-0 outline-none min-w-[200px]"
              value={selectedEmployeeId || ''}
              onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.employeeName} ({emp.staffNo})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</span>
            <select
              className="bg-transparent border-none text-sm font-bold text-slate-900 focus:ring-0 outline-none"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
              <option value="2027-2028">2027-2028</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">KPI Setup Configuration</h3>
            {totalWeight === 100 ? (
              <span className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-200 uppercase tracking-tighter">
                <CheckCircle2 size={12} /> Valid Weight (100%)
              </span>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full border border-amber-200 uppercase tracking-tighter">
                <AlertCircle size={12} /> Total Weight: {totalWeight}%
              </span>
            )}
          </div>
          <button
            onClick={addKpiRow}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-200 uppercase tracking-widest"
          >
            <Plus size={16} /> Add KPI Item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="py-4 px-6 w-1/4">KPI Name</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Target</th>
                <th className="py-4 px-6">Unit</th>
                <th className="py-4 px-6">Actual</th>
                <th className="py-4 px-6 text-center">Weight (%)</th>
                <th className="py-4 px-6 text-center">Score (%)</th>
                <th className="py-4 px-6 text-right">Weighted Score</th>
                <th className="py-4 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {kpis.map((kpi, idx) => (
                <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                  <td className="py-3 px-6">
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-200 outline-none"
                      placeholder="e.g., Sales Target"
                      value={kpi.name}
                      onChange={(e) => handleInputChange(idx, 'name', e.target.value)}
                    />
                  </td>
                  <td className="py-3 px-6">
                    <select
                      className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-200 outline-none"
                      value={kpi.category}
                      onChange={(e) => handleInputChange(idx, 'category', e.target.value)}
                    >
                      <option value="">Category</option>
                      <option value="Delivery Performance">Delivery Performance</option>
                      <option value="Financial Management">Financial Management</option>
                      <option value="Quality Assurance">Quality Assurance</option>
                      <option value="Stakeholder Satisfaction">Stakeholder Satisfaction</option>
                      <option value="Team Performance">Team Performance</option>
                      <option value="Compliance Management">Compliance Management</option>
                    </select>
                  </td>
                  <td className="py-3 px-6">
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-200 outline-none"
                      placeholder="90%"
                      value={kpi.target}
                      onChange={(e) => handleInputChange(idx, 'target', e.target.value)}
                    />
                  </td>
                  <td className="py-3 px-6">
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-200 outline-none"
                      placeholder="Rate"
                      value={kpi.unit}
                      onChange={(e) => handleInputChange(idx, 'unit', e.target.value)}
                    />
                  </td>
                  <td className="py-3 px-6">
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-200 outline-none"
                      placeholder="Actual"
                      value={kpi.actual}
                      onChange={(e) => handleInputChange(idx, 'actual', e.target.value)}
                    />
                  </td>
                  <td className="py-3 px-6 text-center">
                    <input
                      type="number"
                      className="w-20 bg-slate-50 border-none rounded-lg px-3 py-2 text-sm font-black text-blue-600 text-center focus:ring-2 focus:ring-blue-200 outline-none"
                      value={kpi.weight}
                      onChange={(e) => handleInputChange(idx, 'weight', Number(e.target.value))}
                    />
                  </td>
                  <td className="py-3 px-6 text-center">
                    <input
                      type="number"
                      className="w-20 bg-slate-50 border-none rounded-lg px-3 py-2 text-sm font-black text-emerald-600 text-center focus:ring-2 focus:ring-emerald-200 outline-none"
                      value={kpi.score}
                      onChange={(e) => handleInputChange(idx, 'score', Number(e.target.value))}
                    />
                  </td>
                  <td className="py-3 px-6 text-right font-black text-slate-900 text-sm">
                    {(Number(kpi.weightedScore) || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <button
                      onClick={() => removeKpiRow(idx)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {kpis.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <Target size={32} />
                      </div>
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No KPI Items Defined</p>
                      <button
                        onClick={addKpiRow}
                        className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline mt-2"
                      >
                        + Create First Item
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50/50 border-t border-slate-100">
              <tr className="font-black text-slate-900">
                <td colSpan={5} className="py-6 px-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Totals
                </td>
                <td className="py-6 px-6 text-center text-lg font-black text-blue-700">
                  {totalWeight}%
                </td>
                <td className="py-6 px-6 text-center text-slate-400">
                  -
                </td>
                <td className="py-6 px-6 text-right text-2xl font-black text-indigo-700">
                  {totalScore.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          onClick={() => setKpis([])}
          className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all uppercase tracking-widest"
        >
          Reset Setup
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || totalWeight !== 100}
          className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-xs font-black transition-all shadow-xl uppercase tracking-widest ${
            isSaving || totalWeight !== 100
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
          }`}
        >
          {isSaving ? 'Processing...' : <><Save size={18} /> Finalize KPI Setup</>}
        </button>
      </div>
    </div>
  );
};
