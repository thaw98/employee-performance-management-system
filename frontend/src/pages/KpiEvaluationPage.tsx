import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
//MNA
export const KpiEvaluationPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [status, setStatus] = useState<'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'LOCKED'>('SUBMITTED');
    const [showHistory, setShowHistory] = useState<string | null>(null);

    const isLocked = status === 'LOCKED';
    const isApproved = status === 'APPROVED';

    const departmentEmployees = [
        { id: '101', name: 'Zin Ko Swe', position: 'Software Engineer', dept: 'Engineering' },
        { id: '102', name: 'Kyaw Zayar', position: 'Junior Developer', dept: 'Engineering' },
    ];

    const [kpis, setKpis] = useState([
        { id: '1', kpi: 'Sprint / task completion rate', target: '90%', actual: '', weight: 25, score: 0, weightedScore: 0, logic: 'higher' },
        { id: '2', kpi: 'Code quality (bugs)', target: '90%', actual: '', weight: 25, score: 0, weightedScore: 0, logic: 'higher' },
    ]);

    const calculateMetrics = (row: any) => {
        const parse = (v: string) => parseFloat(v.replace(/[^\d.]/g, '')) || 0;
        const target = parse(row.target);
        const actual = parse(row.actual);
        let score = 0;
        if (target > 0 && actual > 0) {
            score = row.logic === 'higher' ? (actual / target) * 100 : (target / actual) * 100;
        }
        return { ...row, score, weightedScore: (score * row.weight) / 100 };
    };

    const updateActual = (id: string, value: string) => {
        if (isLocked) return;
        setKpis(prev => prev.map(k => k.id === id ? calculateMetrics({ ...k, actual: value }) : k));
        if (status === 'SUBMITTED') setStatus('UNDER_REVIEW');
    };

    const totalScore = kpis.reduce((acc, k) => acc + k.weightedScore, 0);

    const getStatusStyle = () => {
        switch (status) {
            case 'DRAFT': return 'bg-slate-100 text-slate-500 border-slate-200';
            case 'SUBMITTED': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'UNDER_REVIEW': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'LOCKED': return 'bg-slate-900 text-white border-slate-900';
            default: return 'bg-slate-100';
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-inter shadow-inner animate-in fade-in duration-500">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Appraisal Workspace</h1>
                    <p className="text-slate-500 mt-1 uppercase text-[10px] font-black tracking-widest">Workflow: Evaluation & Final Review</p>
                </div>
                {selectedEmployee && (
                    <div className="flex gap-3">
                        {!isLocked && (
                            <>
                                <button
                                    onClick={() => alert("Audit Log: Draft Evaluation Saved.")}
                                    className="px-6 py-2 rounded-xl font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                                >
                                    <i className="bi bi-save mr-2"></i> Save Progress
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            const res = await fetch(`http://localhost:8080/api/v1/kpis/approve?employeeId=101&periodId=1`, {
                                                method: 'POST',
                                                headers: { 'X-User-Id': '1' }
                                            });
                                            if (res.ok) {
                                                setStatus('APPROVED');
                                                alert("Audit Log: KPI Records Approved.");
                                            }
                                        } catch (e) { alert("Approval failed"); }
                                    }}
                                    className="px-6 py-2 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100"
                                >
                                    <i className="bi bi-check-circle mr-2"></i> Approve
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            const res = await fetch(`http://localhost:8080/api/v1/kpis/lock?employeeId=101&periodId=1`, {
                                                method: 'POST',
                                                headers: { 'X-User-Id': '1' }
                                            });
                                            if (res.ok) {
                                                setStatus('LOCKED');
                                                alert("Audit Log: Performance Records Verified and LOCKED.");
                                            }
                                        } catch (e) { alert("Locking failed"); }
                                    }}
                                    className="px-6 py-2 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-900 shadow-xl"
                                >
                                    <i className="bi bi-lock-fill mr-2"></i> Lock Record
                                </button>
                            </>
                        )}
                        {isLocked && (
                            <button className="px-6 py-2 rounded-xl font-black bg-slate-200 text-slate-500 cursor-not-allowed">
                                <i className="bi bi-shield-lock-fill mr-2"></i> ARCHIVED & LOCKED
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-2">Member Directory</h3>
                    <div className="space-y-2">
                        {departmentEmployees.map(emp => (
                            <button
                                key={emp.id}
                                onClick={() => { setSelectedEmployee(emp.name); setStatus('SUBMITTED'); }}
                                className={`w-full text-left p-5 rounded-3xl transition-all border ${selectedEmployee === emp.name ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-100 scale-105' : 'bg-white border-slate-200 hover:border-blue-200'}`}
                            >
                                <div className={`font-black ${selectedEmployee === emp.name ? 'text-white' : 'text-slate-800'}`}>{emp.name}</div>
                                <div className={`text-[10px] font-bold uppercase ${selectedEmployee === emp.name ? 'text-blue-100' : 'text-slate-400'}`}>{emp.position}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-3">
                    {!selectedEmployee ? (
                        <div className="h-full flex flex-col items-center justify-center border-4 border-dashed border-slate-200 rounded-[3rem] p-20 text-slate-300 bg-white/50">
                            <i className="bi bi-search text-7xl mb-6 opacity-20"></i>
                            <p className="font-black uppercase tracking-widest">Select an employee from the directory</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 flex items-center justify-between shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-0"></div>
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="w-20 h-20 bg-gradient-to-tr from-slate-900 via-slate-800 to-blue-900 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-2xl">
                                        {selectedEmployee.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h2 className="text-2xl font-black text-slate-900">{selectedEmployee}</h2>
                                            <span className={`px-3 py-1 text-[10px] font-black rounded-lg border uppercase tracking-wider ${getStatusStyle()}`}>
                                                {status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-400 tracking-tight uppercase">Performance Cycle: April 2026 - March 2027</p>
                                    </div>
                                </div>
                                <div className="text-right relative z-10">
                                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1 tracking-[2px]">Aggregate Score</span>
                                    <span className="text-5xl font-black text-slate-900 tracking-tighter">{totalScore.toFixed(1)}%</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                        <tr>
                                            <th className="py-6 px-8">Audit Trail & Metric Definition</th>
                                            <th className="py-6 px-4 w-24">Target</th>
                                            <th className="py-6 px-4 w-40 text-center">Actual Result</th>
                                            <th className="py-6 px-4 w-20 text-center">Score</th>
                                            <th className="py-6 px-4 w-20 text-center">Weight</th>
                                            <th className="py-6 px-8 text-right">Weighted</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {kpis.map(k => (
                                            <tr key={k.id} className="hover:bg-slate-50/50 transition-all duration-300">
                                                <td className="py-6 px-8">
                                                    <div className="font-black text-slate-800 text-base">{k.kpi}</div>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <button
                                                            onClick={() => setShowHistory(k.id)}
                                                            className="text-[9px] bg-slate-100 hover:bg-blue-600 text-slate-500 hover:text-white px-3 py-1 rounded-full font-black uppercase tracking-widest transition-all"
                                                        >
                                                            <i className="bi bi-clock-fill mr-1"></i> Revision History
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4 text-slate-500 font-bold">{k.target}</td>
                                                <td className="py-6 px-4">
                                                    <input
                                                        type="text"
                                                        disabled={isLocked || isApproved}
                                                        className={`w-full px-5 py-2.5 rounded-2xl border font-black text-blue-700 transition-all shadow-inner ${isLocked || isApproved ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-blue-50/30 border-blue-100 hover:border-blue-400 focus:ring-4 focus:ring-blue-100'}`}
                                                        placeholder="0.00"
                                                        value={k.actual}
                                                        onChange={(e) => updateActual(k.id, e.target.value)}
                                                    />
                                                </td>
                                                <td className="py-6 px-4 text-center font-black text-slate-600">{k.score.toFixed(0)}%</td>
                                                <td className="py-6 px-4 text-center text-slate-400 font-bold">{k.weight}%</td>
                                                <td className="py-6 px-8 text-right font-black text-slate-900 text-lg">{k.weightedScore.toFixed(1)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-900 text-white">
                                        <tr>
                                            <td colSpan={5} className="py-10 px-8 text-right text-[10px] uppercase font-black tracking-[6px] text-slate-500">Consolidated Performance Analytics</td>
                                            <td className="py-10 px-8 text-right text-4xl font-black text-emerald-400 tracking-tighter">{totalScore.toFixed(1)}%</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
