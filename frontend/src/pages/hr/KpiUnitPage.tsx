import React, { useState } from 'react';
import { Plus, Trash2, Ruler, Search, X, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAddUnitMutation, useDeleteUnitMutation, useGetUnitsQuery } from '../../features/kpi/kpiUnitApi';
import { kcGradientBr, kcGradientR, kcGradientRHover } from '../../features/kpi/kpiCategoriesTheme';
import '../../styles/kpi-categories.css';

export const KpiUnitPage: React.FC = () => {
  const { data: units, isLoading } = useGetUnitsQuery();
  const [addUnit] = useAddUnitMutation();
  const [deleteUnit] = useDeleteUnitMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitDesc, setNewUnitDesc] = useState('');

  const filteredUnits = units?.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAdd = async () => {
    if (!newUnitName.trim()) {
      toast.error('Unit name is required');
      return;
    }
    try {
      await addUnit({ name: newUnitName.trim(), description: newUnitDesc.trim() || null }).unwrap();
      toast.success('Unit added successfully');
      setIsModalOpen(false);
      setNewUnitName('');
      setNewUnitDesc('');
    } catch (err: any) {
      toast.error(err.data || 'Failed to add unit');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to deactivate this unit?')) {
      try {
        await deleteUnit(id).unwrap();
        toast.success('Unit deactivated');
      } catch (err) {
        toast.error('Failed to deactivate unit');
      }
    }
  };

  return (
    <div className="kpi-categories-theme space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-[#2463eb]/25 ${kcGradientBr}`}>
            <Ruler size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">KPI Units</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Manage measurement units for KPI targets.</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`flex items-center gap-2 px-6 py-3 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-[#2463eb]/25 hover:shadow-xl hover:brightness-110 active:scale-[0.98] ${kcGradientR} ${kcGradientRHover}`}
        >
          <Plus size={16} /> Add Unit
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search units..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2463eb]/20 focus:border-[#2463eb] outline-none font-medium transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="py-4 px-6">Unit Name</th>
                <th className="py-4 px-6">Description</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-[#2463eb]/70 font-bold uppercase tracking-widest">Loading...</td>
                </tr>
              ) : filteredUnits.map((unit) => (
                <tr key={unit.id} className="hover:bg-[#2463eb]/[0.04] transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#eff6ff] text-[#2463eb] rounded-lg flex items-center justify-center ring-1 ring-[#bfdbfe]/80">
                        <Ruler size={16} />
                      </div>
                      <span className="text-sm font-bold text-slate-900">{unit.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm font-medium text-slate-500">
                    {unit.description || <span className="text-slate-300 italic">No description</span>}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => unit.id && handleDelete(unit.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Deactivate"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUnits.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={3} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <Ruler size={32} />
                      </div>
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No Units Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 text-white rounded-2xl flex items-center justify-center shadow-md shadow-[#2463eb]/20 ${kcGradientBr}`}>
                  <Plus size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">New Unit</h2>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Add Measurement Unit</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Name</label>
                <input
                  type="text"
                  placeholder="e.g. Percentage"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#2463eb]/20 focus:border-[#2463eb] outline-none transition-all placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description (Optional)</label>
                <textarea
                  placeholder="Describe when this unit should be used..."
                  value={newUnitDesc}
                  onChange={(e) => setNewUnitDesc(e.target.value)}
                  rows={4}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#2463eb]/20 focus:border-[#2463eb] outline-none transition-all placeholder:text-slate-300 resize-none"
                />
              </div>
            </div>
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className={`flex-[2] px-6 py-4 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-[#2463eb]/25 hover:shadow-xl hover:brightness-110 flex items-center justify-center gap-2 ${kcGradientR} ${kcGradientRHover}`}
              >
                <Save size={16} /> Save Unit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
