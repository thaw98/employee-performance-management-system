import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../app/hooks';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Save, X, AlertCircle, ShieldCheck, Search, Layout, UserCheck, ArrowRight, Target, Lock, Unlock, Eye } from 'lucide-react';
import { kpiManagementApi } from '../../services/kpiManagementApi';
import type { PositionKpi, Position, KpiCategory, Employee } from '../../types/kpiManagement';

const PRIORITY_CONFIG = {
  critical: { label: '🔴 Critical', minWeight: 20, maxWeight: 35, color: 'bg-red-100 text-red-700' },
  high: { label: '🟠 High', minWeight: 10, maxWeight: 15, color: 'bg-orange-100 text-orange-700' },
  medium: { label: '🟡 Medium', minWeight: 10, maxWeight: 10, color: 'bg-yellow-100 text-yellow-700' },
  low: { label: '🟢 Lower', minWeight: 5, maxWeight: 5, color: 'bg-green-100 text-green-700' }
};

const DEFAULT_CATEGORIES = [
  'Delivery Performance', 'Quality Assurance', 'Financial Management',
  'Stakeholder Satisfaction', 'Team Performance', 'Compliance Management',
  'Innovation', 'Customer Service', 'Sales Performance', 'Operational Efficiency',
  'Code Quality', 'System Design', 'Leadership', 'Reporting', 'Accuracy',
  'Talent Acquisition', 'HR Operations', 'Asset Management'
];

export const KpiManagementPage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);

  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [kpis, setKpis] = useState<PositionKpi[]>([
    { positionId: 0, kpiName: '', category: '', target: '', unit: '', weight: 0, priorityLevel: 'medium', logicDirection: 'higher' }
  ]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPositions();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedPositionId) {
      fetchPositionKpis();
    }
  }, [selectedPositionId]);

  const fetchPositions = async () => {
    try {
      const res = await kpiManagementApi.getPositions();
      setPositions(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch positions', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await kpiManagementApi.getCategories();
      if (res.data.data && res.data.data.length > 0) {
        setCategories(res.data.data.map((c: KpiCategory) => c.name));
      }
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

  const fetchPositionKpis = async () => {
    if (!selectedPositionId) return;
    setIsLoading(true);
    try {
      const res = await kpiManagementApi.getPositionKpis(selectedPositionId);
      if (res.data.data && res.data.data.length > 0) {
        setKpis(res.data.data);
      } else {
        setKpis([{ positionId: selectedPositionId, kpiName: '', category: '', target: '', unit: '', weight: 0, priorityLevel: 'medium', logicDirection: 'higher' }]);
      }
    } catch (error) {
      console.error('Failed to fetch position KPIs', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addKpiRow = () => {
    if (!selectedPositionId) {
      toast.error('Please select a position first');
      return;
    }
    setKpis([
      ...kpis,
      { positionId: selectedPositionId, kpiName: '', category: '', target: '', unit: '', weight: 0, priorityLevel: 'medium', logicDirection: 'higher' }
    ]);
  };

  const removeKpiRow = (index: number) => {
    if (kpis.length > 1) {
      const newKpis = [...kpis];
      const removed = newKpis.splice(index, 1)[0];
      setKpis(newKpis);
      if (removed.id) {
        kpiManagementApi.deletePositionKpi(removed.id).catch(console.error);
      }
    } else {
      toast.error('At least one KPI is required');
    }
  };

  const updateKpi = (index: number, field: keyof PositionKpi, value: any) => {
    const newKpis = [...kpis];
    newKpis[index] = { ...newKpis[index], [field]: value, positionId: selectedPositionId! };

    if (field === 'weight') {
      const weight = value;
      if (weight >= 20 && weight <= 35) newKpis[index].priorityLevel = 'critical';
      else if (weight >= 10 && weight <= 15) newKpis[index].priorityLevel = 'high';
      else if (weight === 10) newKpis[index].priorityLevel = 'medium';
      else if (weight === 5) newKpis[index].priorityLevel = 'low';
    }

    if (field === 'target' && value && !value.includes('%') && !isNaN(parseFloat(value))) {
      newKpis[index].target = value + '%';
    }

    setKpis(newKpis);
  };

  const getTotalWeight = () => {
    return kpis.reduce((sum, kpi) => sum + (kpi.weight || 0), 0);
  };

  const validateKpis = () => {
    for (let i = 0; i < kpis.length; i++) {
      const kpi = kpis[i];
      if (!kpi.kpiName.trim()) {
        toast.error(`Row ${i + 1}: KPI name is required`);
        return false;
      }
      if (!kpi.category) {
        toast.error(`Row ${i + 1}: Category is required`);
        return false;
      }
      if (!kpi.target) {
        toast.error(`Row ${i + 1}: Target value is required`);
        return false;
      }
      if (kpi.weight <= 0 || kpi.weight > 100) {
        toast.error(`Row ${i + 1}: Weight must be between 1 and 100`);
        return false;
      }

      const config = PRIORITY_CONFIG[kpi.priorityLevel];
      if (config && (kpi.weight < config.minWeight || kpi.weight > config.maxWeight)) {
        toast.error(`${kpi.kpiName}: ${config.label} weight should be between ${config.minWeight}% and ${config.maxWeight}%`);
        return false;
      }
    }

    const totalWeight = getTotalWeight();
    if (totalWeight !== 100) {
      toast.error(`Total weight must equal 100%. Current total: ${totalWeight}%`);
      return false;
    }

    return true;
  };

  const handleSave = async (isFinal: boolean) => {
    if (!selectedPositionId) {
      toast.error('Please select a position');
      return;
    }

    if (isFinal && !validateKpis()) return;

    setIsLoading(true);
    try {
      await kpiManagementApi.savePositionKpis({
        positionId: selectedPositionId,
        kpis,
        isFinal
      });
      toast.success(isFinal ? 'KPIs submitted successfully!' : 'KPIs saved as draft');
      fetchPositionKpis();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save KPIs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error('Category name is required');
      return;
    }
    try {
      await kpiManagementApi.createCategory(newCategory);
      setCategories([...categories, newCategory]);
      setNewCategory('');
      setShowCategoryModal(false);
      toast.success('Category added successfully');
    } catch (error) {
      toast.error('Failed to add category');
    }
  };

  const totalWeight = getTotalWeight();
  const isValidWeight = totalWeight === 100;
  const selectedPosition = positions.find(p => p.id === selectedPositionId);
  
  const filteredPositions = positions.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">KPI Management</h1>
          <p className="text-slate-500 mt-1">Define Key Performance Indicators for each position</p>
        </div>

        {/* Position Selection */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Select Position
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search positions..."
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-10 focus:border-[#115e59] focus:ring-1 focus:ring-[#115e59] outline-none transition-shadow hover:shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          </div>
          
          <div className="mt-4 max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
            {filteredPositions.map((position) => (
              <div
                key={position.id}
                onClick={() => setSelectedPositionId(position.id)}
                className={`p-3 cursor-pointer hover:bg-slate-50 transition-all flex items-center justify-between group ${
                  selectedPositionId === position.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div>
                  <div className="font-bold text-slate-800 text-sm">{position.name}</div>
                  <div className="text-[10px] text-slate-400">{position.department?.name || 'No Department'}</div>
                </div>
                <ArrowRight className={`w-4 h-4 text-slate-200 group-hover:text-blue-500 transition-colors ${selectedPositionId === position.id ? 'text-blue-500' : ''}`} />
              </div>
            ))}
            {filteredPositions.length === 0 && (
              <div className="p-4 text-center text-slate-400 text-sm italic">No positions found</div>
            )}
          </div>
        </div>

        {/* KPI Workspace */}
        {selectedPositionId && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center flex-wrap gap-3">
              <div>
                <h2 className="font-bold text-slate-800">
                  KPIs for {selectedPosition?.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total weight must equal 100% before submission
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={addKpiRow}
                  className="px-4 py-2 text-sm font-bold text-[#115e59] border border-[#115e59]/20 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Plus size={16} className="inline mr-1" /> Add KPI
                </button>
                <button
                  onClick={() => handleSave(false)}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <Save size={16} className="inline mr-1" /> Draft
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={isLoading || !isValidWeight}
                  className={`px-6 py-2 text-sm font-black text-white rounded-lg transition-all shadow-md disabled:opacity-50 ${
                    isValidWeight ? 'bg-[#115e59] hover:bg-[#0d4a46] hover:shadow-lg' : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  Submit ({totalWeight}%)
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center">Loading...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">KPI Name</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Target</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Unit</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Weight (%)</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Priority</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {kpis.map((kpi, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                              placeholder="Enter KPI name"
                              value={kpi.kpiName}
                              onChange={(e) => updateKpi(index, 'kpiName', e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <select
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                value={kpi.category}
                                onChange={(e) => updateKpi(index, 'category', e.target.value)}
                              >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => setShowCategoryModal(true)}
                                className="px-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"
                                title="Add new category"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              className="w-28 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                              placeholder="e.g., 90%"
                              value={kpi.target}
                              onChange={(e) => updateKpi(index, 'target', e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              className="w-28 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                              placeholder="Unit"
                              value={kpi.unit}
                              onChange={(e) => updateKpi(index, 'unit', e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                              placeholder="Weight"
                              min="0"
                              max="100"
                              value={kpi.weight || ''}
                              onChange={(e) => updateKpi(index, 'weight', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_CONFIG[kpi.priorityLevel]?.color || 'bg-slate-100 text-slate-600'}`}>
                              {PRIORITY_CONFIG[kpi.priorityLevel]?.label || 'Medium'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => removeKpiRow(index)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-right font-bold text-slate-700">Total:</td>
                        <td className={`px-4 py-4 font-bold ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
                          {totalWeight}%
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {!isValidWeight && totalWeight > 0 && (
                  <div className="m-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="text-amber-500" size={20} />
                      <div>
                        <p className="font-medium text-amber-800">Weight Distribution Invalid</p>
                        <p className="text-sm text-amber-700">
                          Total weight must equal 100%. Current total: <strong>{totalWeight}%</strong>.
                          {totalWeight < 100 ? ` Need ${100 - totalWeight}% more.` : ` Remove ${totalWeight - 100}% to reach 100%.`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Priority Legend */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                  <p className="text-xs font-bold text-slate-500 mb-2">Priority Weight Guidelines:</p>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <span className="text-red-600">🔴 Critical: 20-35%</span>
                    <span className="text-orange-600">🟠 High: 10-15%</span>
                    <span className="text-yellow-600">🟡 Medium: 10%</span>
                    <span className="text-green-600">🟢 Lower: 5%</span>
                    <span className="text-slate-400 ml-auto">Total must equal 100%</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Empty State */}
        {!selectedPositionId && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-50 rounded-full mb-4 border border-slate-100">
              <Search size={40} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">Select a Position</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
              Search and select a **Position** to define KPI templates and weights.
            </p>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add New Category</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-lg px-4 py-2 mb-4 focus:border-blue-500 outline-none"
              placeholder="Category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button onClick={handleAddCategory} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KpiManagementPage;
