import React, { useState, useEffect, useRef } from 'react';
import axios from '../app/axiosInstance';
import { useAppSelector } from '../app/hooks';
import { toast } from 'react-hot-toast';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import SignatureCanvas from 'react-signature-canvas';

const PRIMARY = '#0855BF';

export function SelfAssessmentReviewListPage() {
    const [assessments, setAssessments] = useState<any[]>([]);
    const [selectedAsmt, setSelectedAsmt] = useState<any>(null);
    const [comments, setComments] = useState('');
    const [signature, setSignature] = useState('');
    const [signatureType, setSignatureType] = useState<'draw' | 'upload'>('draw');
    const sigCanvas = useRef<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleClearSignature = () => {
        if (sigCanvas.current) {
            sigCanvas.current.clear();
            setSignature('');
        }
    };

    const handleSignatureEnd = () => {
        if (sigCanvas.current) {
            setSignature(sigCanvas.current.getCanvas().toDataURL('image/png'));
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSignature(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const renderSignature = (sig: string) => {
        if (!sig) return null;
        if (sig.startsWith('data:image')) {
            return <img src={sig} alt="Signature" className="max-h-16 inline-block" />;
        }
        if (sig.startsWith('data:')) {
            return (
                <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                    <i className="bi bi-shield-lock-fill text-lg"></i>
                    <span className="text-sm font-semibold">Digital Certificate</span>
                </div>
            );
        }
        return <span className="font-serif text-xl italic">{sig}</span>;
    };

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmp, setSelectedEmp] = useState<any>(null);
    const [filterText, setFilterText] = useState('');

    const user = useAppSelector(s => s.auth.user);
    const role = user?.role;
    const isHr = role === 'HR';

    useEffect(() => {
        fetchAssessments();
    }, []);

    useEffect(() => {
        if (selectedAsmt) {
            if (isHr) {
                setComments(selectedAsmt.hrComments || '');
                setSignature(selectedAsmt.hrSignature || '');
            } else {
                setComments(selectedAsmt.managerComments || '');
                setSignature(selectedAsmt.managerSignature || '');
            }
        } else {
            setComments('');
            setSignature('');
        }
    }, [selectedAsmt, isHr]);

    const fetchAssessments = async () => {
        try {
            const resp = await axios.get('/api/self-assessments/all');
            setAssessments(resp.data.data || []);
        } catch (err) {
            toast.error('Failed to fetch assessments');
        }
    };

    const searchEmployees = async () => {
        try {
            const resp = await axios.get(`/api/employees/autocomplete?keyword=${searchKeyword}`);
            setEmployees(resp.data.data || []);
        } catch (err) {
            toast.error('Failed to find employees');
        }
    };

    const handleCreateAssignment = async () => {
        if (!selectedEmp) return;
        try {
            await axios.post(`/api/self-assessments/create/${selectedEmp.id}`);
            toast.success(`Assignment created for ${selectedEmp.employeeName}`);
            setShowAssignModal(false);
            setSelectedEmp(null);
            fetchAssessments();
        } catch (err) {
            toast.error('Failed to create assignment');
        }
    };

    const handleUnlock = async (id: number) => {
        try {
            await axios.post(`/api/self-assessments/${id}/unlock`);
            toast.success('Assignment unlocked for employee edits');
            fetchAssessments();
        } catch (err) {
            toast.error('Failed to unlock assignment');
        }
    };

    const handleReview = async () => {
        if (!signature.trim()) {
            toast.error('Signature is required');
            return;
        }
        setIsSubmitting(true);
        try {
            const endpoint = isHr
                ? `/api/self-assessments/${selectedAsmt.id}/hr-review`
                : `/api/self-assessments/${selectedAsmt.id}/manager-review`;
            await axios.post(endpoint, { comments, signature });
            toast.success(isHr ? 'Self-assignment Finalized' : 'Review submitted successfully');
            setSelectedAsmt(null);
            setComments('');
            setSignature('');
            fetchAssessments();
        } catch (err) {
            toast.error('Failed to submit review');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredAssessments = assessments.filter(sa => {
        const searchStr = filterText.toLowerCase();
        return (
            sa.employee.employeeName.toLowerCase().includes(searchStr) ||
            sa.employee.employeeId.toLowerCase().includes(searchStr) ||
            sa.employee.department?.name.toLowerCase().includes(searchStr) ||
            sa.employee.position?.name.toLowerCase().includes(searchStr)
        );
    });

    const stats = {
        total: assessments.length,
        submitted: assessments.filter(a => a.status !== 'UNLOCKED').length,
        finalized: assessments.filter(a => a.status === 'FINALIZED').length
    };

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight" style={{ color: PRIMARY }}>Compliance Review</h1>
                    <p className="text-slate-500 mt-1 font-medium italic text-sm">Monitor and finalize organizational self-assessments.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group w-full md:w-80">
                        <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or department..."
                            value={filterText}
                            onChange={e => setFilterText(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
                        />
                    </div>
                    {isHr && (
                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                onClick={() => setShowAssignModal(true)}
                                className="flex-1 md:flex-none px-6 py-3.5 bg-white text-blue-600 border border-blue-600 rounded-2xl font-bold shadow-sm hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <i className="bi bi-person-plus text-lg" />
                                Assign New
                            </button>
                            <button
                                onClick={async () => {
                                    if (window.confirm('Assign self-assessment to ALL employees?')) {
                                        try {
                                            await axios.post('/api/self-assessments/create/all');
                                            toast.success('Assigned to all employees');
                                            fetchAssessments();
                                        } catch (err) {
                                            toast.error('Failed to assign to all');
                                        }
                                    }
                                }}
                                className="flex-1 md:flex-none px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <i className="bi bi-people-fill text-lg" />
                                Bulk Assign
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Assigned', value: stats.total, icon: 'bi-clipboard-check', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Submitted', value: stats.submitted, icon: 'bi-hourglass-split', color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Finalized', value: stats.finalized, icon: 'bi-check-all', color: 'text-emerald-600', bg: 'bg-emerald-50' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center text-2xl`}>
                            <i className={`bi ${stat.icon}`} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-800">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <th className="p-4">Employee</th>
                            <th className="p-4 text-center">Score</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Submission Date</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredAssessments.length > 0 ? (
                            filteredAssessments.map(sa => (
                                <tr key={sa.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-700">{sa.employee.employeeName}</div>
                                        <div className="text-xs text-slate-400">{sa.employee.department?.name} • {sa.employee.position?.name}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full transition-all duration-1000"
                                                    style={{
                                                        width: (sa.totalScore != null) ? `${sa.totalScore}%` : '0%',
                                                        backgroundColor: (sa.totalScore != null) ? PRIMARY : '#cbd5e1'
                                                    }}
                                                />
                                            </div>
                                            <div className="font-black text-sm" style={{ color: (sa.totalScore !== null && sa.totalScore !== undefined) ? PRIMARY : '#cbd5e1' }}>
                                                {(sa.totalScore !== null && sa.totalScore !== undefined) ? `${sa.totalScore.toFixed(0)}%` : 'N/A'}
                                            </div>
                                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter line-clamp-1">{sa.ratingCategory || '—'}</div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                                ${sa.status === 'FINALIZED' ? 'bg-emerald-100 text-emerald-700' :
                                                sa.status === 'LOCKED' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-blue-100 text-blue-700'}`}
                                        >
                                            {sa.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-500 text-sm">
                                        {sa.employeeSignedAt ? formatDate(sa.employeeSignedAt) : 'Pending Submission'}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => setSelectedAsmt(sa)}
                                                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors font-semibold text-xs"
                                            >
                                                View/Review
                                            </button>
                                            {isHr && sa.status === 'LOCKED' && (
                                                <button
                                                    onClick={() => handleUnlock(sa.id)}
                                                    className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors font-semibold text-xs flex items-center gap-1"
                                                    title="Unlock for employee edits"
                                                >
                                                    <i className="bi bi-unlock-fill" />
                                                    Unlock
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="p-12 text-center">
                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                        <i className="bi bi-search text-4xl opacity-20" />
                                        <p className="font-medium">No results matching "{filterText}"</p>
                                        <p className="text-xs">Try searching for a different name or department.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showAssignModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">Assign New Self-Assessment</h2>
                            <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 rounded-xl border-slate-200 p-3"
                                    placeholder="Search employee by name..."
                                    value={searchKeyword}
                                    onChange={e => setSearchKeyword(e.target.value)}
                                />
                                <button onClick={searchEmployees} className="px-4 py-2 bg-slate-800 text-white rounded-xl"><i className="bi bi-search" /></button>
                            </div>
                            <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
                                {employees.map(emp => (
                                    <div
                                        key={emp.id}
                                        onClick={() => setSelectedEmp(emp)}
                                        className={`p-4 cursor-pointer transition-colors flex items-center justify-between
                                    ${selectedEmp?.id === emp.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                                    >
                                        <div>
                                            <div className="font-bold text-slate-700">{emp.employeeName}</div>
                                            <div className="text-xs text-slate-400">{emp.employeeId} • {emp.department?.name}</div>
                                        </div>
                                        {selectedEmp?.id === emp.id && <i className="bi bi-check-circle-fill text-blue-600" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex gap-3">
                            <button onClick={() => setShowAssignModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600">Cancel</button>
                            <button
                                disabled={!selectedEmp}
                                onClick={handleCreateAssignment}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50"
                            >Confirm Assignment</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedAsmt && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Reviewing {selectedAsmt.employee.employeeName}'s Assessment</h2>
                                <div className="flex gap-4 mt-1">
                                    <p className="text-xs text-slate-500"><span className="font-bold text-slate-400">ID:</span> {selectedAsmt.employee.employeeId}</p>
                                    <p className="text-xs text-slate-500"><span className="font-bold text-slate-400">Dept:</span> {selectedAsmt.employee.department?.name}</p>
                                    <p className="text-xs text-slate-500"><span className="font-bold text-slate-400">Pos:</span> {selectedAsmt.employee.position?.name}</p>
                                </div>
                                <p className="text-sm text-slate-500 mt-2">Submitted on {formatDate(selectedAsmt.employeeSignedAt)}</p>
                            </div>
                            <button onClick={() => setSelectedAsmt(null)} className="text-slate-400 hover:text-slate-600 text-2xl">
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Total Points</label>
                                    <div className="text-3xl font-black text-slate-800">{selectedAsmt.totalPoints ?? '—'}</div>
                                </div>
                                <div className="text-right">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Performance Rating</label>
                                    <div className="text-3xl font-black" style={{ color: PRIMARY }}>
                                        {selectedAsmt.totalScore != null ? `${selectedAsmt.totalScore.toFixed(0)}%` : 'Pending'}
                                    </div>
                                    <div className="text-sm font-bold text-blue-600 uppercase italic">{selectedAsmt.ratingCategory || '—'}</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <h3 className="font-bold text-slate-800">Employee Detailed Responses</h3>
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase">{selectedAsmt.items.length} Subjects</span>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    {selectedAsmt.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex flex-col p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all">
                                            <div className="text-sm text-slate-600 font-semibold line-clamp-2 min-h-[2.5rem] mb-3">{item.questionText}</div>
                                            <div className="flex justify-between items-end mt-auto pt-3 border-t border-slate-200/50">
                                                <div className="flex gap-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Response</span>
                                                        <span className={`text-xs font-black uppercase ${item.answerYesNo ? 'text-blue-600' : 'text-red-500'}`}>{item.answerYesNo ? 'Yes' : 'No'}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Rating</span>
                                                        <span className="text-xs font-black text-slate-700">{item.rating}/5</span>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                                    <span className="text-blue-600 font-bold text-sm">{item.rating}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-5 bg-amber-50 rounded-xl border border-amber-100">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-xs font-black text-amber-800 uppercase">Employee Remarks & Signature</h4>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Date: {formatDate(selectedAsmt.employeeSignedAt)}</div>
                                </div>
                                <p className="text-slate-700 italic mb-3">"{selectedAsmt.employeeRemarks || 'No remarks provided.'}"</p>
                                <div className="flex items-center gap-2 pt-2 border-t border-amber-200/50">
                                    <span className="text-[10px] text-amber-600 font-bold uppercase">Digitally Signed By:</span>
                                    <div className="min-h-[4rem] flex items-center">{renderSignature(selectedAsmt.employeeSignature)}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                                {/* Manager Feedback Section */}
                                <div className={`p-6 rounded-2xl border ${selectedAsmt.status === 'FINALIZED' || selectedAsmt.managerSignature ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                                    <h4 className="text-xs font-black text-blue-800 uppercase mb-4">Manager Review & Feedback</h4>
                                    {(selectedAsmt.status === 'FINALIZED' || selectedAsmt.managerSignature || isHr) ? (
                                        <div className="space-y-4">
                                            <p className="text-slate-700 italic">"{selectedAsmt.managerComments || 'No comments provided.'}"</p>
                                            <div className="flex justify-between items-end border-t border-blue-200 pt-2">
                                                <div>
                                                    <span className="text-[8px] font-bold text-blue-400 uppercase block">Signed By</span>
                                                    <div className="min-h-[4rem] flex items-center mt-1">{renderSignature(selectedAsmt.managerSignature)}</div>
                                                </div>
                                                <span className="text-[9px] text-blue-400 font-bold uppercase">{selectedAsmt.managerSignedAt ? formatDate(selectedAsmt.managerSignedAt) : ''}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <textarea
                                                value={comments}
                                                onChange={e => setComments(e.target.value)}
                                                className="w-full h-24 rounded-xl border-slate-200 p-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                                                placeholder="Provide feedback..."
                                            />
                                            <div className="mt-4">
                                                {signature ? (
                                                    <div className="border border-slate-200 rounded-xl p-4 bg-white flex items-center justify-between mb-4">
                                                        {renderSignature(signature)}
                                                        <button onClick={() => { setSignature(''); if (sigCanvas.current) sigCanvas.current.clear(); }} className="text-red-500 text-sm font-medium hover:underline">Clear</button>
                                                    </div>
                                                ) : (
                                                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white mb-4">
                                                        <div className="flex border-b border-slate-200 bg-slate-50">
                                                            <button onClick={() => setSignatureType('draw')} className={`flex-1 py-2 text-sm font-medium ${signatureType === 'draw' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Draw Signature</button>
                                                            <button onClick={() => setSignatureType('upload')} className={`flex-1 py-2 text-sm font-medium ${signatureType === 'upload' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Upload File</button>
                                                        </div>
                                                        <div className="p-4 bg-white">
                                                            {signatureType === 'draw' ? (
                                                                <div className="border border-slate-200 rounded bg-slate-50 relative">
                                                                    <SignatureCanvas
                                                                        ref={sigCanvas}
                                                                        onEnd={handleSignatureEnd}
                                                                        canvasProps={{ className: 'w-full h-24 cursor-crosshair' }}
                                                                    />
                                                                    <button onClick={handleClearSignature} className="absolute top-2 right-2 text-xs text-slate-400 hover:text-red-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">Reset</button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-center w-full">
                                                                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                                                        <div className="flex flex-col items-center justify-center">
                                                                            <p className="text-sm text-slate-500"><span className="font-semibold">Upload</span> signature</p>
                                                                        </div>
                                                                        <input type="file" className="hidden" accept="image/*,.pdf,.p12,.cer,.pem" onChange={handleFileUpload} />
                                                                    </label>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={handleReview}
                                                disabled={isSubmitting}
                                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-colors"
                                            >
                                                {isSubmitting ? 'Submitting...' : 'Submit Manager Review'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* HR Feedback Section */}
                                <div className={`p-6 rounded-2xl border ${selectedAsmt.status === 'FINALIZED' ? 'bg-purple-50 border-purple-100' : 'bg-slate-50 border-slate-100'}`}>
                                    <h4 className="text-xs font-black text-purple-800 uppercase mb-4">HR Approval & Comments</h4>
                                    {selectedAsmt.status === 'FINALIZED' || selectedAsmt.hrSignature || !isHr ? (
                                        <div className="space-y-4">
                                            <p className="text-slate-700 italic">"{selectedAsmt.hrComments || 'No HR comments provided.'}"</p>
                                            <div className="flex justify-between items-end border-t border-purple-200 pt-2">
                                                <div>
                                                    <span className="text-[8px] font-bold text-purple-400 uppercase block">Signed By</span>
                                                    <div className="min-h-[4rem] flex items-center mt-1">{renderSignature(selectedAsmt.hrSignature)}</div>
                                                </div>
                                                <span className="text-[9px] text-purple-400 font-bold uppercase">{selectedAsmt.hrSignedAt ? formatDate(selectedAsmt.hrSignedAt) : ''}</span>
                                            </div>
                                            {!isHr && selectedAsmt.status !== 'FINALIZED' && (
                                                <div className="text-[10px] text-slate-400 font-medium italic text-center">
                                                    Approval pending HR review
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <textarea
                                                value={comments}
                                                onChange={e => setComments(e.target.value)}
                                                className="w-full h-24 rounded-xl border-slate-200 p-3 text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none"
                                                placeholder="HR Final Comments..."
                                            />
                                            <div className="mt-4">
                                                {signature ? (
                                                    <div className="border border-slate-200 rounded-xl p-4 bg-white flex items-center justify-between mb-4">
                                                        {renderSignature(signature)}
                                                        <button onClick={() => { setSignature(''); if (sigCanvas.current) sigCanvas.current.clear(); }} className="text-red-500 text-sm font-medium hover:underline">Clear</button>
                                                    </div>
                                                ) : (
                                                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white mb-4">
                                                        <div className="flex border-b border-slate-200 bg-slate-50">
                                                            <button onClick={() => setSignatureType('draw')} className={`flex-1 py-2 text-sm font-medium ${signatureType === 'draw' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Draw Signature</button>
                                                            <button onClick={() => setSignatureType('upload')} className={`flex-1 py-2 text-sm font-medium ${signatureType === 'upload' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Upload File</button>
                                                        </div>
                                                        <div className="p-4 bg-white">
                                                            {signatureType === 'draw' ? (
                                                                <div className="border border-slate-200 rounded bg-slate-50 relative">
                                                                    <SignatureCanvas
                                                                        ref={sigCanvas}
                                                                        onEnd={handleSignatureEnd}
                                                                        canvasProps={{ className: 'w-full h-24 cursor-crosshair' }}
                                                                    />
                                                                    <button onClick={handleClearSignature} className="absolute top-2 right-2 text-xs text-slate-400 hover:text-red-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">Reset</button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-center w-full">
                                                                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                                                        <div className="flex flex-col items-center justify-center">
                                                                            <p className="text-sm text-slate-500"><span className="font-semibold">Upload</span> signature</p>
                                                                        </div>
                                                                        <input type="file" className="hidden" accept="image/*,.pdf,.p12,.cer,.pem" onChange={handleFileUpload} />
                                                                    </label>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={handleReview}
                                                disabled={isSubmitting}
                                                className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-purple-700 transition-colors"
                                            >
                                                {isSubmitting ? 'Submitting...' : 'Approve & Finalize'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
