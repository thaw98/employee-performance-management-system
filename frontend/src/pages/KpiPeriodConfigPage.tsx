import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';
//MNA
type PeriodType = 'MONTHLY' | 'ANNUAL' | 'BUDGET_YEAR';

interface KpiPeriod {
    id?: string;
    name: string;
    type: PeriodType;
    startDate: string;
    endDate: string;
    reviewStartDate: string;
    reviewEndDate: string;
    isActive: boolean;
}

export const KpiPeriodConfigPage: React.FC = () => {
    const navigate = useNavigate();
    const [periods, setPeriods] = useState<KpiPeriod[]>([
        { id: '1', name: '2026 Annual Review', type: 'ANNUAL', startDate: '2026-01-01', endDate: '2026-12-31', reviewStartDate: '2026-12-01', reviewEndDate: '2026-12-31', isActive: true },
        { id: '2', name: 'FY 2026 Budget Year', type: 'BUDGET_YEAR', startDate: '2026-04-01', endDate: '2027-03-31', reviewStartDate: '2027-03-01', reviewEndDate: '2027-03-31', isActive: false },
    ]);

    const [form, setForm] = useState<KpiPeriod>({
        name: '',
        type: 'MONTHLY',
        startDate: '',
        endDate: '',
        reviewStartDate: '',
        reviewEndDate: '',
        isActive: false
    });

    const [error, setError] = useState<string | null>(null);

    const handleSave = () => {
        setError(null);

        // Rule 4: Validation (end < start)
        if (new Date(form.endDate) < new Date(form.startDate)) {
            setError("Validation Error: End date cannot be before start date.");
            return;
        }

        const newPeriod = { ...form, id: Date.now().toString() };
        setPeriods([...periods, newPeriod]);

        // Reset form
        setForm({
            name: '',
            type: 'MONTHLY',
            startDate: '',
            endDate: '',
            reviewStartDate: '',
            reviewEndDate: '',
            isActive: false
        });

        alert("Performance Period Configured Successfully!");
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-inter animate-in fade-in duration-500">
            <div className="mb-8">
                <button onClick={() => navigate('/hr/goals')} className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mb-2">
                    <i className="bi bi-arrow-left"></i> Back to Dashboard
                </button>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Cycle Configuration</h1>
                <p className="text-slate-500 mt-1">Define flexible evaluation periods including Monthly, Annual, and Budget years.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm sticky top-6">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <i className="bi bi-plus-circle-fill text-blue-600"></i> New Evaluation Cycle
                        </h3>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2 animate-bounce">
                                <i className="bi bi-exclamation-triangle-fill"></i> {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Cycle Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Q3 Performance Review"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Period Type</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={form.type}
                                    onChange={e => setForm({ ...form, type: e.target.value as PeriodType })}
                                >
                                    <option value="MONTHLY">Monthly</option>
                                    <option value="ANNUAL">Annual (Start Date Dependent)</option>
                                    <option value="BUDGET_YEAR">Budget Year (Custom Span)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none"
                                        value={form.startDate}
                                        onChange={e => setForm({ ...form, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">End Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none"
                                        value={form.endDate}
                                        onChange={e => setForm({ ...form, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 mt-6 border-t border-slate-100">
                                <h4 className="text-[10px] font-black text-slate-800 uppercase mb-3">Evaluation Window</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="date"
                                        className="w-full bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-2 text-xs outline-none text-blue-700 font-bold"
                                        value={form.reviewStartDate}
                                        onChange={e => setForm({ ...form, reviewStartDate: e.target.value })}
                                    />
                                    <input
                                        type="date"
                                        className="w-full bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-2 text-xs outline-none text-blue-700 font-bold"
                                        value={form.reviewEndDate}
                                        onChange={e => setForm({ ...form, reviewEndDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                className="w-full py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 transition-all mt-6"
                            >
                                Save Configuration
                            </button>
                        </div>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-2">Configured Periods</h3>
                    {periods.map(p => (
                        <div key={p.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${p.type === 'BUDGET_YEAR' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                    <i className={`bi ${p.type === 'BUDGET_YEAR' ? 'bi-bank' : 'bi-calendar3'}`}></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">{p.name}</h4>
                                    <p className="text-xs text-slate-500 font-medium">
                                        {formatDate(p.startDate)} — {formatDate(p.endDate)} • <span className="text-blue-600">{p.type.replace('_', ' ')}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {p.isActive && (
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full">ACTIVE</span>
                                )}
                                <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100">
                                    <i className="bi bi-pencil-square"></i>
                                </button>
                                <button className="p-2 text-slate-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                                    <i className="bi bi-trash-fill"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
