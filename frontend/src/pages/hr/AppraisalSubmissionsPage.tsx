import React, { useState, useEffect, useRef } from 'react';
import axios from '../../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { Search, Eye, CheckCircle, XCircle, RotateCcw, Lock, Unlock, FileText, User, Loader2 } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import SignatureCanvas from 'react-signature-canvas';

const PRIMARY = '#0855BF';

interface Answer {
    id?: number;
    question?: {
        id?: number;
        questionText: string;
    };
    comments?: string;
    rating: number;
}

interface Submission {
    id: number;
    employee: {
        id: number;
        employeeName: string;
        employeeId?: string;
        department?: {
            name: string;
        };
    };
    period?: {
        id?: number;
        name: string;
    };
    totalScore?: number;
    maxPoints?: number;
    ratingCategory?: string;
    status: 'HR_APPROVED' | 'REJECTED' | 'RETURNED' | 'LOCKED' | 'SUBMITTED' | 'PENDING';
    submittedAt?: string;
    answers?: Answer[];
}

export function AppraisalSubmissionsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsmt, setSelectedAsmt] = useState<Submission | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [kpiHistory, setKpiHistory] = useState<any[]>([]);

    // Review Modal States
    const [comments, setComments] = useState('');
    const [signature, setSignature] = useState('');
    const sigCanvas = useRef<any>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    useEffect(() => {
        if (selectedAsmt) {
            fetchHistory(selectedAsmt.id);
            fetchKpiHistory(selectedAsmt.employee.id, selectedAsmt.period?.name);
        }
    }, [selectedAsmt]);

    const fetchKpiHistory = async (empId: number, period?: string) => {
        if (!empId) return;
        try {
            const resp = await axios.get(`/kpis/history/employee/${empId}${period ? `?period=${period}` : ''}`);
            setKpiHistory(resp.data || []);
        } catch (err) {
            console.error('KPI History fetch error:', err);
        }
    };

    const fetchSubmissions = async () => {
        setIsLoading(true);
        try {
            const resp = await axios.get('/appraisal-assignments');
            setSubmissions(resp.data.data || []);
        } catch (err) {
            toast.error('Failed to fetch appraisal submissions');
            console.error('Fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchHistory = async (asmtId: number) => {
        try {
            const resp = await axios.get(`/audit-logs/target/AppraisalAssignment/${asmtId}`);
            setHistory(resp.data.data || []);
        } catch (err) {
            console.error('History fetch error:', err);
        }
    };

    const handleAction = async (action: 'approve' | 'reject' | 'return' | 'unlock') => {
        if (!selectedAsmt) return;

        if (!comments.trim() && action !== 'approve') {
            toast.error('Comments are required for this action');
            return;
        }
        if (action === 'approve' && !signature) {
            toast.error('Signature is required for approval');
            return;
        }

        setIsActionLoading(true);
        setActionInProgress(action);

        try {
            const endpoint = `/appraisal-assignments/${selectedAsmt.id}/${action}`;
            const payload: any = { comments };

            if (action === 'approve') {
                payload.signature = signature;
            }

            await axios.post(endpoint, payload);
            toast.success(`Appraisal ${action}ed successfully`);

            // Reset and close modal
            setSelectedAsmt(null);
            setComments('');
            setSignature('');
            sigCanvas.current?.clear();

            // Refresh data
            await fetchSubmissions();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || `Failed to ${action} appraisal`;
            toast.error(errorMessage);
            console.error('Action error:', err);
        } finally {
            setIsActionLoading(false);
            setActionInProgress(null);
        }
    };

    const handleLock = async (id: number) => {
        try {
            await axios.post(`/appraisal-assignments/${id}/lock`);
            toast.success('Appraisal locked successfully');
            fetchSubmissions();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to lock appraisal';
            toast.error(errorMessage);
            console.error('Lock error:', err);
        }
    };

    const handleClearSignature = () => {
        if (sigCanvas.current) {
            sigCanvas.current.clear();
            setSignature('');
        }
    };

    const handleCloseModal = () => {
        setSelectedAsmt(null);
        setComments('');
        setSignature('');
        sigCanvas.current?.clear();
        setActionInProgress(null);
    };

    const filteredSubmissions = submissions.filter(s =>
        s.employee.employeeName.toLowerCase().startsWith(searchTerm.toLowerCase().charAt(0)) ||
        s.employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'HR_APPROVED':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'REJECTED':
                return 'bg-red-50 text-red-700 border-red-200';
            case 'RETURNED':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'LOCKED':
                return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'SUBMITTED':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'PENDING':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            default:
                return 'bg-slate-50 text-slate-500 border-slate-200';
        }
    };

    const getStatusLabel = (status: string) => {
        if (status === 'LOCKED') return 'FINALIZED';
        return status.replace(/_/g, ' ');
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight" style={{ color: PRIMARY }}>
                            Review & Approve Appraisals
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            Track, review and finalize performance appraisal cycles.
                        </p>
                    </div>
                    <div className="relative group w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-sm font-medium transition-all outline-none"
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
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <div className="flex items-center justify-center gap-3 text-slate-400">
                                            <Loader2 className="animate-spin" size={20} />
                                            <span className="font-medium">Loading submissions...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredSubmissions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-slate-400 font-medium">
                                        No submissions found.
                                    </td>
                                </tr>
                            ) : (
                                filteredSubmissions.map(sa => (
                                    <tr key={sa.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                                                        {sa.employee.employeeName}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                                                        {sa.employee.employeeId || 'N/A'} • {sa.employee.department?.name || 'No Department'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 font-medium text-slate-600 text-sm">
                                            {sa.period?.name || 'Annual 2026'}
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-lg font-bold text-blue-600">
                                                    {sa.totalScore ? `${sa.totalScore.toFixed(1)}%` : '—'}
                                                </span>
                                                <span className="text-[9px] font-bold uppercase text-slate-400">
                                                    {sa.ratingCategory || 'PENDING'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight border ${getStatusStyle(sa.status)}`}>
                                                {getStatusLabel(sa.status)}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl shadow-lg shadow-blue-200">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-xl">
                                        Review: {selectedAsmt.employee.employeeName}
                                    </h3>
                                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                                        Cycle: {selectedAsmt.period?.name || 'Annual 2026'} •
                                        ID: {selectedAsmt.employee.employeeId || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 flex items-center justify-center transition-all shadow-sm"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-3xl space-y-2">
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Points Achieved</p>
                                    <p className="text-3xl font-black text-blue-700 italic">
                                        {selectedAsmt.answers?.reduce((acc, curr) => acc + (curr.rating || 0), 0)}
                                        <span className="text-blue-300 mx-2 text-xl font-normal">/</span>
                                        <span className="text-blue-400 text-2xl">{(selectedAsmt.answers?.length || 0) * 5}</span>
                                    </p>
                                </div>
                                <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 rounded-3xl space-y-2">
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Overall Score</p>
                                    <p className="text-3xl font-black text-indigo-700">
                                        {selectedAsmt.totalScore?.toFixed(1) || '0.0'}%
                                    </p>
                                </div>
                                <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-3xl space-y-2">
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Performance Category</p>
                                    <p className="text-2xl font-bold text-emerald-700">
                                        {selectedAsmt.ratingCategory || 'N/A'}
                                    </p>
                                </div>
                                <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-3xl space-y-2">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Submission Date</p>
                                    <p className="text-xl font-medium text-slate-700">
                                        {selectedAsmt.submittedAt ? formatDate(selectedAsmt.submittedAt) : 'Not Submitted'}
                                    </p>
                                </div>
                            </div>

                            {/* Detailed Answers Section */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                    Detailed Responses
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {selectedAsmt.answers && selectedAsmt.answers.length > 0 ? (
                                        selectedAsmt.answers.map((ans, idx) => (
                                            <div key={ans.id || idx} className="p-5 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 transition-all shadow-sm group">
                                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                                    <div className="space-y-3 flex-1">
                                                        <div className="flex items-start gap-3">
                                                            <span className="font-black text-slate-200 group-hover:text-blue-200 text-lg">{(idx + 1).toString().padStart(2, '0')}</span>
                                                            <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                                                {ans.question?.questionText || 'Question not available'}
                                                            </p>
                                                        </div>
                                                        {ans.comments && (
                                                            <p className="text-[11px] text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-100 ml-8">
                                                                "{ans.comments}"
                                                            </p>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Rating Display 5 4 3 2 1 */}
                                                    <div className="flex items-center gap-1.5 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100 self-start lg:self-center">
                                                        {[5, 4, 3, 2, 1].map(num => (
                                                            <div 
                                                                key={num}
                                                                className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all ${ans.rating === num ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110 z-10' : 'bg-white text-slate-300 border border-slate-100 opacity-60'}`}
                                                            >
                                                                <span className="text-[9px] font-black uppercase tracking-tighter opacity-70 leading-none mb-0.5">{num}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-3xl">
                                            Detailed answers not available for preview.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* KPI Revision History Section */}
                            {kpiHistory.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                        KPI Revision History
                                    </h4>
                                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                                        <table className="w-full text-left text-[11px]">
                                            <thead className="bg-slate-50 text-slate-500 uppercase font-black">
                                                <tr>
                                                    <th className="p-3">Period</th>
                                                    <th className="p-3">KPI Name</th>
                                                    <th className="p-3">Target</th>
                                                    <th className="p-3">Actual</th>
                                                    <th className="p-3">Score</th>
                                                    <th className="p-3">Status</th>
                                                    <th className="p-3">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {kpiHistory.map((kpi, idx) => (
                                                    <tr key={kpi.id || idx} className={`${kpi.recordStatus === 'Archived' ? 'opacity-60 bg-slate-50' : 'bg-emerald-50/20'}`}>
                                                        <td className="p-3 font-bold">{kpi.period}</td>
                                                        <td className="p-3 font-medium text-slate-800">{kpi.name}</td>
                                                        <td className="p-3">{kpi.target} {kpi.unit}</td>
                                                        <td className="p-3 font-bold text-slate-700">{kpi.actual || '-'}</td>
                                                        <td className="p-3 font-black text-blue-600">{kpi.score || '-'}</td>
                                                        <td className="p-3">
                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-200 text-slate-600">
                                                                {kpi.status}
                                                            </span>
                                                            <span className={`ml-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${kpi.recordStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                                                {kpi.recordStatus}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-slate-500">
                                                            {kpi.createdDate ? formatDate(kpi.createdDate) : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Action History Section */}
                            {history.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-1.5 h-6 bg-slate-400 rounded-full" />
                                        Action History
                                    </h4>
                                    <div className="space-y-3">
                                        {history.map((log, idx) => (
                                            <div key={log.id || idx} className="flex gap-4 items-start ml-2 border-l-2 border-slate-100 pl-6 pb-2">
                                                <div className="w-2 h-2 rounded-full bg-slate-200 mt-1.5 -ml-7 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">{log.actionType} by {log.performedByUserId === 1 ? 'HR' : 'User'}</p>
                                                    <p className="text-[10px] text-slate-400">{formatDate(log.createdAt)} • {log.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* HR Actions Section */}
                            <div className="pt-6 border-t border-slate-200 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-2">
                                        HR Review Comments
                                    </label>
                                    <textarea
                                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                                        placeholder="Enter your professional assessment and feedback..."
                                        rows={4}
                                        value={comments}
                                        onChange={e => setComments(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Signature Section */}
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-2">
                                            Digital Signature {selectedAsmt.status !== 'HR_APPROVED' && '(Required for Approval)'}
                                        </label>
                                        <div className="relative bg-white border-2 border-slate-200 rounded-2xl overflow-hidden group hover:border-slate-300 transition-all">
                                            <SignatureCanvas
                                                ref={sigCanvas}
                                                onEnd={() => {
                                                    if (sigCanvas.current) {
                                                        setSignature(sigCanvas.current.getCanvas().toDataURL());
                                                    }
                                                }}
                                                canvasProps={{
                                                    className: "w-full h-40 cursor-crosshair",
                                                    style: { background: 'white' }
                                                }}
                                            />
                                            <button
                                                onClick={handleClearSignature}
                                                className="absolute top-3 right-3 px-3 py-1.5 bg-white border border-slate-200 text-[10px] font-bold uppercase text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                                                type="button"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                        {signature && (
                                            <p className="text-[10px] font-medium text-emerald-600 ml-2">
                                                ✓ Signature captured
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col justify-end gap-3">
                                        {selectedAsmt.status === 'LOCKED' ? (
                                            <button
                                                onClick={() => handleAction('unlock')}
                                                disabled={isActionLoading || !comments.trim()}
                                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {actionInProgress === 'unlock' ? (
                                                    <Loader2 className="animate-spin" size={18} />
                                                ) : (
                                                    <Unlock size={18} />
                                                )}
                                                UNLOCK FOR CORRECTION
                                            </button>
                                        ) : selectedAsmt.status === 'HR_APPROVED' ? (
                                            <button
                                                onClick={() => handleLock(selectedAsmt.id)}
                                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-slate-200 hover:bg-black transition-all flex items-center justify-center gap-3"
                                            >
                                                <Lock size={18} />
                                                LOCK FOREVER (FINALIZE)
                                            </button>
                                        ) : (selectedAsmt.status === 'SUBMITTED' || selectedAsmt.status === 'RETURNED') ? (
                                            <>
                                                <button
                                                    onClick={() => handleAction('approve')}
                                                    disabled={isActionLoading || !signature}
                                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {actionInProgress === 'approve' ? (
                                                        <Loader2 className="animate-spin" size={18} />
                                                    ) : (
                                                        <CheckCircle size={18} />
                                                    )}
                                                    APPROVE & FINALIZE
                                                </button>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => handleAction('return')}
                                                        disabled={isActionLoading || !comments.trim()}
                                                        className="py-3.5 bg-amber-50 text-amber-700 rounded-xl font-bold text-xs hover:bg-amber-100 transition-all flex items-center justify-center gap-2 border border-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {actionInProgress === 'return' ? (
                                                            <Loader2 className="animate-spin" size={14} />
                                                        ) : (
                                                            <RotateCcw size={14} />
                                                        )}
                                                        RETURN
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction('reject')}
                                                        disabled={isActionLoading || !comments.trim()}
                                                        className="py-3.5 bg-red-50 text-red-700 rounded-xl font-bold text-xs hover:bg-red-100 transition-all flex items-center justify-center gap-2 border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {actionInProgress === 'reject' ? (
                                                            <Loader2 className="animate-spin" size={14} />
                                                        ) : (
                                                            <XCircle size={14} />
                                                        )}
                                                        REJECT
                                                    </button>
                                                </div>
                                            </>
                                        ) : null}
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

export default AppraisalSubmissionsPage;