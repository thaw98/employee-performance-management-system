import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const KpiAuditLogsPage: React.FC = () => {
    const navigate = useNavigate();
    //MNA
    // Mock data for the prototype representation of KM-12 Audit Logs
    const [logs] = useState([
        { id: 1, action: 'HR_LOCK', details: 'KPI Records locked for Employee ID: 101', performedBy: 'Admin HR', createdAt: '2026-04-09 10:45:00' },
        { id: 2, action: 'FINAL_SUBMISSION', details: 'Saved 5 records. Total weight: 100.0%', performedBy: 'Manager A', createdAt: '2026-04-09 09:30:12' },
        { id: 3, action: 'VALIDATION_FAILURE', details: 'Submission blocked: Total weight 85.0%', performedBy: 'Manager A', createdAt: '2026-04-09 09:28:44' },
        { id: 4, action: 'ACTUAL_UPDATE', details: 'Updated actual result to: 95', performedBy: 'System', createdAt: '2026-04-08 14:20:00' },
        { id: 5, action: 'KPI_REVISION', details: 'Revised metric: Sprint Velocity', performedBy: 'Admin HR', createdAt: '2026-04-07 11:15:00' },
    ]);

    const getActionBadge = (action: string) => {
        if (action.includes('LOCK')) return 'bg-slate-900 text-slate-100';
        if (action.includes('FAILURE')) return 'bg-red-100 text-red-700';
        if (action.includes('SUBMISSION')) return 'bg-emerald-100 text-emerald-700';
        if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-700';
        return 'bg-purple-100 text-purple-700';
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-inter shadow-inner animate-in fade-in duration-500">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Audit Logs</h1>
                    <p className="text-slate-500 mt-1 uppercase text-[10px] font-black tracking-widest">Requirement KM-12: Traceability</p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl shadow-sm hover:bg-slate-50 font-bold transition-all"
                >
                    <i className="bi bi-arrow-left mr-2"></i> Go Back
                </button>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-8">
                <div className="flex justify-between items-center mb-6">
                    <div className="relative w-96">
                        <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input type="text" placeholder="Search logs..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 ring-blue-100 font-bold text-slate-700" />
                    </div>
                    <button className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl font-bold hover:bg-slate-50"><i className="bi bi-filter"></i> Filter</button>
                </div>

                <table className="w-full text-left">
                    <thead className="border-b border-slate-200 text-[10px] uppercase font-black tracking-widest text-slate-400">
                        <tr>
                            <th className="py-4 px-4">Timestamp</th>
                            <th className="py-4 px-4">Actor</th>
                            <th className="py-4 px-4 w-40 text-center">Action Signature</th>
                            <th className="py-4 px-4">Event Context</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-5 px-4 text-xs font-bold text-slate-500"><i className="bi bi-clock mr-2 text-slate-300"></i> {log.createdAt}</td>
                                <td className="py-5 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-black text-xs">
                                            {log.performedBy.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <span className="font-extrabold text-slate-800">{log.performedBy}</span>
                                    </div>
                                </td>
                                <td className="py-5 px-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border border-transparent ${getActionBadge(log.action)}`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="py-5 px-4 font-medium text-slate-600 text-sm">{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
