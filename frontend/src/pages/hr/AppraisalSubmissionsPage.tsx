import React, { useState, useEffect, useRef } from 'react';
import axios from '../../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { Search, Eye, CheckCircle, XCircle, RotateCcw, Lock, FileText, ChevronRight, User } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import SignatureCanvas from 'react-signature-canvas';

const PRIMARY = '#0855BF';

export function AppraisalSubmissionsPage() {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsmt, setSelectedAsmt] = useState<any>(null);
    
    // Review Modal States
    const [comments, setComments] = useState('');
    const [signature, setSignature] = useState('');
    const sigCanvas = useRef<any>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        setIsLoading(true);
        try {
            const resp = await axios.get('/appraisal-assignments');
            setSubmissions(resp.data.data || []);
        } catch (err) {
            toast.error('Failed to fetch appraisal submissions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (action: 'approve' | 'reject' | 'return') => {
        if (!comments.trim() && action !== 'approve') {
            toast.error('Comments are required for this action');
            return;
        }
        if (action === 'approve' && !signature) {
            toast.error('Signature is required for approval');
            return;
        }

        setIsActionLoading(true);
        try {
            const endpoint = `/appraisal-assignments/${selectedAsmt.id}/${action}`;
            const payload = { comments, signature: action === 'approve' ? signature : null };
            await axios.post(endpoint, payload);
            toast.success(`Appraisal ${action}d successfully`);
            setSelectedAsmt(null);
            setComments('');
            setSignature('');
            fetchSubmissions();
        } catch (err) {
            toast.error(`Failed to ${action} appraisal`);
        } finally {
            setIsActionLoading(true);
        }
    };

    const handleLock = async (id: number) => {
        try {
            await axios.post(`/appraisal-assignments/${id}/lock`);
            toast.success('Appraisal locked successfully');
            fetchSubmissions();
        } catch (err) {
            toast.error('Failed to lock appraisal');
        }
    };

    const filteredSubmissions = submissions.filter(s => 
        s.employee.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'HR_APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'REJECTED': return 'bg-red-50 text-red-600 border-red-100';
            case 'RETURNED': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'LOCKED': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'SUBMITTED': return 'bg-blue-50 text-blue-600 border-blue-100';
            default: return 'bg-slate-50 text-slate-400 border-slate-100';
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight" style={{ color: PRIMARY }}>Review & Approve appraisals</h1>
                        <p className="text-slate-500 mt-2 font-medium italic">Track, review and finalize performance appraisal cycles.</p>
                    </div>
                    <div className="relative group w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Submissions Table */}
            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                <th className="p-6">Employee Details</th>
                                <th className="p-6">Cycle / Period</th>
                                <th className="p-6 text-center">Score</th>
                                <th className="p-6">Status</th>
                                <th className="p-6 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-bold animate-pulse">Loading submissions...</td></tr>
                            ) : filteredSubmissions.length === 0 ? (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-bold italic">No submissions found.</td></tr>
                            ) : (
                                filteredSubmissions.map(sa => (
                                    <tr key={sa.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-700 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{sa.employee.employeeName}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{sa.employee.employeeId} • {sa.employee.department?.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 font-bold text-slate-600 text-sm">
                                            {sa.period?.name || 'Annual 2026'}
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-lg font-black text-blue-600">{sa.totalScore ? `${sa.totalScore.toFixed(1)}%` : '—'}</span>
                                                <span className="text-[9px] font-black uppercase text-slate-300">{sa.ratingCategory || 'PENDING'}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border ${getStatusStyle(sa.status)}`}>
                                                {sa.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => setSelectedAsmt(sa)}
                                                    className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {sa.status === 'HR_APPROVED' && (
                                                    <button 
                                                        onClick={() => handleLock(sa.id)}
                                                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center justify-center"
                                                        title="Lock Appraisal"
                                                    >
                                                        <Lock size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review Modal */}
            {selectedAsmt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-xl uppercase tracking-tighter">Review: {selectedAsmt.employee.employeeName}</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">Cycle: {selectedAsmt.period?.name || 'Annual 2026'}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedAsmt(null)} className="w-12 h-12 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all shadow-sm">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-12">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl space-y-2">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Self Score</p>
                                    <p className="text-3xl font-black text-blue-700">{selectedAsmt.totalScore?.toFixed(1) || '0.0'}%</p>
                                </div>
                                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl space-y-2">
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Performance Category</p>
                                    <p className="text-2xl font-black text-emerald-700">{selectedAsmt.ratingCategory || 'N/A'}</p>
                                </div>
                                <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submission Date</p>
                                    <p className="text-xl font-bold text-slate-700">{selectedAsmt.submittedAt ? formatDate(selectedAsmt.submittedAt) : 'N/A'}</p>
                                </div>
                            </div>

                            {/* Detailed Answers Section (Placeholder for PAC-2 visual check) */}
                            <div className="space-y-6">
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                    Detailed Responses
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {selectedAsmt.answers?.map((ans: any, idx: number) => (
                                        <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between">
                                            <div className="space-y-2">
                                                <p className="text-sm font-bold text-slate-700">Q{idx+1}: {ans.question?.questionText}</p>
                                                <p className="text-xs text-slate-500 font-medium italic">"{ans.comments || 'No comments'}"</p>
                                            </div>
                                            <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-blue-600 font-black">
                                                {ans.rating} / 5
                                            </div>
                                        </div>
                                    )) || <div className="p-10 text-center text-slate-400 font-bold italic border-2 border-dashed border-slate-100 rounded-3xl">Detailed answers not available for preview.</div>}
                                </div>
                            </div>

                            {/* HR Actions Section */}
                            <div className="pt-10 border-t border-slate-100 space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">HR Review Comments</label>
                                    <textarea 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[32px] px-8 py-6 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all h-32"
                                        placeholder="Enter your professional assessment and feedback..."
                                        value={comments}
                                        onChange={e => setComments(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Digital Signature</label>
                                        <div className="relative bg-white border-2 border-slate-100 rounded-[32px] overflow-hidden group">
                                            <SignatureCanvas 
                                                ref={sigCanvas}
                                                onEnd={() => setSignature(sigCanvas.current.getCanvas().toDataURL())}
                                                canvasProps={{ className: "w-full h-40 cursor-crosshair" }}
                                            />
                                            <button 
                                                onClick={() => { sigCanvas.current.clear(); setSignature(''); }}
                                                className="absolute top-4 right-4 px-3 py-1.5 bg-white border border-slate-100 text-[9px] font-black uppercase text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                Reset
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col justify-end gap-3 pb-2">
                                        <button 
                                            onClick={() => handleAction('approve')}
                                            disabled={isActionLoading || !signature}
                                            className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-xs shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            <CheckCircle size={18} /> APPROVE & FINALIZE
                                        </button>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={() => handleAction('return')}
                                                disabled={isActionLoading}
                                                className="py-4 bg-slate-100 text-slate-600 rounded-[20px] font-black text-[10px] hover:bg-amber-50 hover:text-amber-600 transition-all flex items-center justify-center gap-2"
                                            >
                                                <RotateCcw size={14} /> RETURN
                                            </button>
                                            <button 
                                                onClick={() => handleAction('reject')}
                                                disabled={isActionLoading}
                                                className="py-4 bg-slate-100 text-slate-600 rounded-[20px] font-black text-[10px] hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2"
                                            >
                                                <XCircle size={14} /> REJECT
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
