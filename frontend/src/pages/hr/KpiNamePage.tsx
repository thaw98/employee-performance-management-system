import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Tag, Search, X, Save, ChevronLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAddNameMutation, useDeleteNameMutation, useGetNamesQuery } from '../../features/kpi/kpiNameApi';
import { kcGradientBr, kcGradientR, kcGradientRHover } from '../../features/kpi/kpiCategoriesTheme';
import '../../styles/kpi-categories.css';

export const KpiNamePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: names, isLoading } = useGetNamesQuery();
  const [addName] = useAddNameMutation();
  const [deleteName] = useDeleteNameMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const filteredNames = names?.filter(kpiName =>
    kpiName.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error('KPI name is required');
      return;
    }
    try {
      await addName({ name: newName.trim(), description: newDesc.trim() || null }).unwrap();
      toast.success('KPI name added successfully');
      setIsModalOpen(false);
      setNewName('');
      setNewDesc('');
    } catch (err: any) {
      toast.error(err.data || 'Failed to add KPI name');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to deactivate this KPI name?')) {
      try {
        await deleteName(id).unwrap();
        toast.success('KPI name deactivated');
      } catch (err) {
        toast.error('Failed to deactivate KPI name');
      }
    }
  };

  return (
    <div className="kpi-categories-theme space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => navigate('/hr/kpi-management')}
            aria-label="Back to KPI management"
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 transition-all shadow-sm shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-[#2463eb]/25 ${kcGradientBr}`}>
            <Tag size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">KPI Names</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Manage reusable KPI names for KPI setup and templates.</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`flex items-center gap-2 px-6 py-3 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-[#2463eb]/25 hover:shadow-xl hover:brightness-110 active:scale-[0.98] ${kcGradientR} ${kcGradientRHover}`}
        >
          <Plus size={16} /> Add KPI Name
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search KPI names..."
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
                <th className="py-4 px-6">KPI Name</th>
                <th className="py-4 px-6">Description</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-[#2463eb]/70 font-bold uppercase tracking-widest">Loading...</td>
                </tr>
              ) : filteredNames.map((kpiName) => (
                <tr key={kpiName.id} className="hover:bg-[#2463eb]/[0.04] transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#eff6ff] text-[#2463eb] rounded-lg flex items-center justify-center ring-1 ring-[#bfdbfe]/80">
                        <Tag size={16} />
                      </div>
                      <span className="text-sm font-bold text-slate-900">{kpiName.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm font-medium text-slate-500">
                    {kpiName.description || <span className="text-slate-300 italic">No description</span>}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => kpiName.id && handleDelete(kpiName.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Deactivate"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredNames.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={3} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <Tag size={32} />
                      </div>
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No KPI Names Found</p>
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
                  <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">New KPI Name</h2>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Add Reusable Name</p>
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">KPI Name</label>
                <input
                  type="text"
                  placeholder="e.g. Quality of Work"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#2463eb]/20 focus:border-[#2463eb] outline-none transition-all placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description (Optional)</label>
                <textarea
                  placeholder="Describe when this KPI name should be used..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
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
                <Save size={16} /> Save KPI Name
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
