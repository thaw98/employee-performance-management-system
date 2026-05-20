import React, { useState, useEffect, useRef } from 'react';
import axios from '../../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { Search, Eye, CheckCircle, XCircle, RotateCcw, Lock, Unlock, FileText, User, Loader2, Building2, Filter, ChevronDown, Award, MessageSquare, Target, Save } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import SignatureCanvas from 'react-signature-canvas';
import { resolveMediaSrc } from '../../utils/mediaUrl';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PRIMARY = '#0855BF';

interface Question {
    id: number;
    questionText: string;
    answerType: string;
    isRequired: boolean;
}

interface Category {
    id: number;
    name: string;
    description: string;
    questions: Question[];
}

interface Template {
    id: number;
    name: string;
    maxRating: number;
    categories: Category[];
}

interface Answer {
    id: number;
    rating: number;
    comments?: string;
    question?: Question;
}

interface Submission {
    id: number;
    employee: {
        id: number;
        employeeName: string;
        employeeId?: string;
        department?: {
            id?: number;
            name: string;
            departmentName?: string;
        };
        position?: {
            id?: number;
            name: string;
        };
    };
    period?: {
        id?: number;
        name: string;
    };
    template?: Template;
    totalScore?: number;
    maxPoints?: number;
    ratingCategory?: string;
    status: 'HR_APPROVED' | 'REJECTED' | 'RETURNED' | 'LOCKED' | 'SUBMITTED' | 'PENDING';
    submittedAt?: string;
    answers?: Answer[];
    managerComments?: string;
    managerSignature?: string;
    managerSignedAt?: string;
}

export function AppraisalSubmissionsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState<string | number>('ALL');
    const [filterPos, setFilterPos] = useState<string | number>('ALL');
    const [activeTab, setActiveTab] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [departments, setDepartments] = useState<any[]>([]);
    const [positions, setPositions] = useState<any[]>([]);
    const [selectedAsmt, setSelectedAsmt] = useState<Submission | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [kpiHistory, setKpiHistory] = useState<any[]>([]);

    // Review Modal States
    const [comments, setComments] = useState('');
    const [signature, setSignature] = useState('');
    const sigCanvas = useRef<any>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);
    const [defaultSignature, setDefaultSignature] = useState<string | null>(null);
    const [isUsingSavedSignature, setIsUsingSavedSignature] = useState(false);
    const [showTopOnly, setShowTopOnly] = useState(false);
    const [showBottomOnly, setShowBottomOnly] = useState(false);

    // KPI Edit Modal for HR
    const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);
    const [kpiTargetEmployee, setKpiTargetEmployee] = useState<any>(null);
    const [kpiTargetPeriod, setKpiTargetPeriod] = useState<string | undefined>(undefined);

    useEffect(() => {
        fetchSubmissions();
        fetchDepartments();
        fetchDefaultSignature();
    }, []);

    useEffect(() => {
        if (filterDept !== 'ALL') {
            fetchPositions(filterDept as number);
        } else {
            setPositions([]);
            setFilterPos('ALL');
        }
    }, [filterDept]);

    useEffect(() => {
        if (selectedAsmt) {
            fetchHistory(selectedAsmt.id);
            fetchKpiHistory(selectedAsmt.employee.id, selectedAsmt.period?.name);
            
            // Auto-load default signature for approval
            if (defaultSignature && !signature) {
                setSignature(defaultSignature);
                setIsUsingSavedSignature(true);
            }
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

    const fetchDepartments = async () => {
        try {
            const resp = await axios.get('/departments');
            setDepartments(resp.data.data || []);
        } catch (err) {
            console.error('Dept fetch error:', err);
        }
    };

    const fetchDefaultSignature = async () => {
        try {
            const resp = await axios.get('/signatures/default');
            if (resp.data.success && resp.data.data) {
                setDefaultSignature(resp.data.data.signatureData);
            }
        } catch (err) {
            console.error("Failed to fetch default signature", err);
        }
    };

    const fetchPositions = async (deptId: number) => {
        try {
            const resp = await axios.get(`/departments/${deptId}/positions`);
            setPositions(resp.data.data || []);
        } catch (err) {
            console.error('Position fetch error:', err);
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
            setIsUsingSavedSignature(false);
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

    const handleReset = async (id: number) => {
        setIsActionLoading(true);
        setActionInProgress('reset');
        try {
            await axios.post(`/appraisal-assignments/${id}/reset`);
            toast.success('Appraisal reset to pending manager successfully');
            setSelectedAsmt(null);
            fetchSubmissions();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to reset appraisal';
            toast.error(errorMessage);
            console.error('Reset error:', err);
        } finally {
            setIsActionLoading(false);
            setActionInProgress(null);
        }
    };

    const handleClearSignature = () => {
        if (sigCanvas.current) {
            sigCanvas.current.clear();
        }
        setSignature('');
        setIsUsingSavedSignature(false);
    };

    const handleUseDefaultSignature = () => {
        if (defaultSignature) {
            setSignature(defaultSignature);
            setIsUsingSavedSignature(true);
            toast.success("Default signature applied");
        } else {
            toast.error("No default signature found in Settings");
        }
    };

    const handleCloseModal = () => {
        setSelectedAsmt(null);
        setComments('');
        setSignature('');
        setIsUsingSavedSignature(false);
        sigCanvas.current?.clear();
        setActionInProgress(null);
    };

    const handleExportSummaryPDF = () => {
        // Filter based on the currently active tab (HR_APPROVED or LOCKED)
        const targetStatus = activeTab === 'LOCKED' ? 'LOCKED' : 'HR_APPROVED';
        
        // Use finalSubmissions (which handles the top-only filtering)
        const filtered = finalSubmissions.filter(s => s.status === targetStatus);

        if (filtered.length === 0) {
            toast.error(`No appraisals found to export for ${activeTab === 'LOCKED' ? 'Finalized' : 'Approved'} status.`);
            return;
        }

        const doc = new jsPDF('l', 'mm', 'a4');
        const dateStr = new Date().toLocaleDateString();

        // Header
        doc.setFillColor(8, 85, 191);
        doc.rect(0, 0, 297, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('HR PERFORMANCE SUMMARY REPORT', 15, 20);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Status: ${targetStatus === 'LOCKED' ? 'FINALIZED' : 'HR APPROVED'}`, 15, 30);
        doc.text(`Generated on: ${dateStr}`, 15, 35);
        doc.text(`Filter: ${filterDept === 'ALL' ? 'ALL DEPARTMENTS' : 'DEPARTMENTAL'} | ${filterPos === 'ALL' ? 'ALL POSITIONS' : String(filterPos).toUpperCase()}`, 282, 35, { align: 'right' });

        const tableData = filtered.map((a, index) => [
            index + 1,
            a.employee.employeeName,
            a.employee.employeeId || 'N/A',
            a.employee.department?.name || 'N/A',
            a.employee.position?.name || 'N/A',
            a.period?.name || 'N/A',
            `${a.totalScore?.toFixed(1) || '0.0'}%`,
            a.ratingCategory || 'N/A'
        ]);

        autoTable(doc, {
            head: [['NO', 'EMPLOYEE NAME', 'ID', 'DEPARTMENT', 'POSITION', 'PERIOD', 'SCORE %', 'RATING']],
            body: tableData,
            startY: 50,
            theme: 'grid',
            headStyles: { 
                fillColor: [30, 41, 59], 
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold',
                halign: 'center'
            },
            styles: { fontSize: 9, cellPadding: 5 },
            columnStyles: {
                0: { halign: 'center', cellWidth: 15 },
                6: { halign: 'center', fontStyle: 'bold' },
                7: { halign: 'center', fontStyle: 'bold' }
            },
            alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        doc.save(`HR_Performance_Summary_${targetStatus}_${dateStr.replace(/\//g, '-')}.pdf`);
        toast.success("Summary report exported successfully.");
    };

    const filteredSubmissions = submissions.filter(s => {
        const matchesSearch = s.employee.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             s.employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDept = filterDept === 'ALL' || s.employee.department?.id === Number(filterDept);
        const matchesPos = filterPos === 'ALL' || s.employee.position?.name === filterPos;
        
        const matchesStatus = activeTab === 'ALL' || s.status === activeTab;
        
        return matchesSearch && matchesDept && matchesPos && matchesStatus;
    }).sort((a, b) => {
        const scoreA = a.totalScore ?? 0;
        const scoreB = b.totalScore ?? 0;
        return scoreB - scoreA;
    });

    // Handle Top/Bottom Performers filtering
    let finalSubmissions = filteredSubmissions;
    if (showTopOnly || showBottomOnly) {
        const deptExtremeScores: Record<number, number> = {};
        
        // Find max/min score for each department
        filteredSubmissions.forEach(s => {
            const deptId = s.employee.department?.id || 0;
            const score = s.totalScore ?? 0;
            if (showTopOnly) {
                if (!deptExtremeScores[deptId] || score > deptExtremeScores[deptId]) {
                    deptExtremeScores[deptId] = score;
                }
            } else if (showBottomOnly) {
                if (!deptExtremeScores[deptId] || score < deptExtremeScores[deptId]) {
                    deptExtremeScores[deptId] = score;
                }
            }
        });
        
        // Filter to keep only those with the extreme score in their department
        finalSubmissions = filteredSubmissions.filter(s => {
            const deptId = s.employee.department?.id || 0;
            const score = s.totalScore ?? 0;
            return score === deptExtremeScores[deptId] && score > 0;
        });
    }

    const paginatedSubmissions = finalSubmissions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const maxScore = finalSubmissions.length > 0 ? Math.max(...finalSubmissions.map(s => s.totalScore ?? 0)) : 0;
    const minScore = finalSubmissions.length > 0 ? Math.min(...finalSubmissions.map(s => s.totalScore ?? 0).filter(s => s > 0)) : 0;

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
            case 'LOCKED':
                return 'bg-slate-900 text-white border-slate-900';
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
            {/* Status Tabs */}
            <div className="bg-white p-2 rounded-[28px] border border-slate-100 shadow-sm flex flex-wrap items-center gap-2 px-2 overflow-x-auto">
                {['ALL', 'PENDING', 'SUBMITTED', 'RETURNED', 'HR_APPROVED', 'REJECTED', 'LOCKED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => {
                            setActiveTab(status);
                            setCurrentPage(1);
                        }}
                        className={`px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === status 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                            : 'text-slate-400 hover:bg-slate-50'
                        }`}
                    >
                        {status === 'LOCKED' ? 'FINALIZED' : status.replace(/_/g, ' ')}
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-[9px] ${activeTab === status ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {status === 'ALL' ? submissions.length : submissions.filter(s => s.status === status).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Header with Search & Filters */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight" style={{ color: PRIMARY }}>
                            Review & Approve Appraisals
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            Track, review and finalize performance appraisal cycles.
                        </p>
                    </div>
                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                            {(activeTab === 'HR_APPROVED' || activeTab === 'LOCKED') && (
                                <>
                                    <button
                                        onClick={() => {
                                            setShowTopOnly(!showTopOnly);
                                            setShowBottomOnly(false);
                                        }}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${
                                            showTopOnly 
                                            ? 'bg-amber-500 text-white shadow-amber-200' 
                                            : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        🏆 {showTopOnly ? 'Showing Best Per Dept' : 'Show Top Per Dept'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowBottomOnly(!showBottomOnly);
                                            setShowTopOnly(false);
                                        }}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${
                                            showBottomOnly 
                                            ? 'bg-red-500 text-white shadow-red-200' 
                                            : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        ⚠️ {showBottomOnly ? 'Showing Bottom Per Dept' : 'Show Bottom Per Dept'}
                                    </button>
                                    <button
                                        onClick={handleExportSummaryPDF}
                                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200 animate-in zoom-in duration-300"
                                    >
                                        <FileText size={16} /> Export Summary (PDF)
                                    </button>
                                </>
                            )}
                            {/* Search */}
                        <div className="relative group w-full md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search employee..."
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-sm font-medium transition-all outline-none"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Dept Filter */}
                        <div className="relative min-w-[180px]">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            <select
                                value={filterDept}
                                onChange={(e) => {
                                    setFilterDept(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                                    setFilterPos('ALL');
                                }}
                                className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-[11px] uppercase tracking-widest appearance-none text-slate-600 cursor-pointer hover:bg-slate-100"
                            >
                                <option value="ALL">All Departments</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>

                        {/* Position Filter */}
                        <div className="relative min-w-[180px]">
                            <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            <select
                                value={filterPos}
                                onChange={(e) => setFilterPos(e.target.value)}
                                disabled={filterDept === 'ALL'}
                                className={`w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-[11px] uppercase tracking-widest appearance-none text-slate-600 cursor-pointer hover:bg-slate-100 ${filterDept === 'ALL' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <option value="ALL">All Positions</option>
                                {positions.map(p => (
                                    <option key={p.id} value={p.positionName}>{p.positionName}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
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
                                paginatedSubmissions.map(sa => (
                                    <tr key={sa.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                                                            {sa.employee.employeeName}
                                                        </div>
                                                        {sa.totalScore && sa.totalScore > 0 && sa.totalScore === maxScore && showTopOnly && (
                                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black rounded-md border border-amber-200 animate-bounce shadow-sm">
                                                                🏆 TOP PERFORMER
                                                            </span>
                                                        )}
                                                        {sa.totalScore && sa.totalScore > 0 && sa.totalScore === minScore && showBottomOnly && (
                                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-[8px] font-black rounded-md border border-red-200 shadow-sm">
                                                                ⚠️ NEEDS SUPPORT (PIP)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                                                        {sa.employee.employeeId || 'N/A'} • {sa.employee.department?.name || 'No Dept'} • <span className="text-blue-500 font-bold">{sa.employee.position?.name || 'No Position'}</span>
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
                                                {sa.status === 'REJECTED' && (
                                                    <button
                                                        onClick={() => handleReset(sa.id)}
                                                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-all flex items-center justify-center"
                                                        title="Reset/Re-evaluate Appraisal"
                                                    >
                                                        <RotateCcw size={18} />
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

                {/* Pagination Controls */}
                {finalSubmissions.length > 0 && (
                    <div className="flex items-center justify-between bg-slate-50 p-6 border-t border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, finalSubmissions.length)} to {Math.min(currentPage * itemsPerPage, finalSubmissions.length)} of {finalSubmissions.length} records
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => {
                                    setCurrentPage(prev => prev - 1);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all bg-white shadow-sm"
                            >
                                <RotateCcw size={18} className="rotate-180" />
                            </button>
                            
                            {Array.from({ length: Math.ceil(finalSubmissions.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => {
                                        setCurrentPage(page);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${currentPage === page ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                disabled={currentPage === Math.ceil(finalSubmissions.length / itemsPerPage)}
                                onClick={() => {
                                    setCurrentPage(prev => prev + 1);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all bg-white shadow-sm"
                            >
                                <RotateCcw size={18} />
                            </button>
                        </div>
                    </div>
                )}
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
                            <div className="space-y-6">
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-sm shadow-blue-500/50" />
                                    Evaluation Responses
                                </h4>
                                
                                {selectedAsmt.template?.categories ? (
                                    <div className="space-y-8">
                                        {selectedAsmt.template.categories.map((category) => (
                                            <div key={category.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                                    <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{category.name}</h5>
                                                    <span className="text-[10px] text-slate-400 italic font-medium">{category.description}</span>
                                                </div>
                                                <div className="p-6 space-y-8">
                                                    {category.questions.map((question, qIdx) => {
                                                        const answer = selectedAsmt.answers?.find(a => a.question?.id === question.id);
                                                        const maxRating = selectedAsmt.template?.maxRating || 5;

                                                        return (
                                                            <div key={question.id} className="space-y-4">
                                                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                                                    <div className="flex-1 space-y-1">
                                                                        <div className="flex items-start gap-3">
                                                                            <span className="text-xs font-black text-slate-200 mt-0.5">{(qIdx + 1).toString().padStart(2, '0')}</span>
                                                                            <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                                                                {question.questionText}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Rating Display */}
                                                                    <div className="flex items-center gap-1.5 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100 self-start lg:self-center">
                                                                        {[...Array(maxRating)].map((_, i) => {
                                                                            const num = i + 1;
                                                                            const isSelected = answer?.rating === num;
                                                                            return (
                                                                                <div 
                                                                                    key={num}
                                                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${
                                                                                        isSelected 
                                                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/20 scale-110 z-10' 
                                                                                        : 'bg-white text-slate-200 border border-slate-100'
                                                                                    }`}
                                                                                >
                                                                                    {num}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                                
                                                                {answer?.comments && (
                                                                    <div className="ml-8 flex items-start gap-3 p-4 bg-blue-50/30 rounded-2xl border border-blue-50/50">
                                                                        <MessageSquare size={14} className="text-blue-400 mt-0.5" />
                                                                        <p className="text-[11px] text-blue-800 font-medium italic leading-relaxed">
                                                                            "{answer.comments}"
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-16 text-center text-slate-400 font-medium border-4 border-dashed border-slate-50 rounded-[40px] space-y-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                            <Eye size={32} className="opacity-20" />
                                        </div>
                                        <p>No template structure found for this submission.</p>
                                    </div>
                                )}
                            </div>

                            {/* KPI Revision History Section */}
                            {kpiHistory.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                            KPI Revision History
                                        </h4>
                                        <button
                                            onClick={() => {
                                                setKpiTargetEmployee(selectedAsmt.employee);
                                                setKpiTargetPeriod(selectedAsmt.period?.name);
                                                setIsKpiModalOpen(true);
                                            }}
                                            className="px-4 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2"
                                        >
                                            <FileText size={14} /> Update KPI Actuals
                                        </button>
                                    </div>
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
                                        <div className="flex items-center justify-between ml-2">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                Digital Signature {selectedAsmt.status !== 'HR_APPROVED' && '(Required for Approval)'}
                                            </label>
                                            {defaultSignature && (
                                                <button 
                                                    onClick={handleUseDefaultSignature}
                                                    className="text-[9px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1.5"
                                                    type="button"
                                                >
                                                    <RotateCcw size={10} /> Use Saved Signature
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative bg-white border-2 border-slate-200 rounded-2xl overflow-hidden group hover:border-slate-300 transition-all h-40">
                                            {isUsingSavedSignature && signature && (
                                                <div 
                                                    className="absolute inset-0 z-10 flex items-center justify-center p-8 bg-white cursor-pointer"
                                                    onClick={() => setIsUsingSavedSignature(false)}
                                                >
                                                    <img 
                                                        src={resolveMediaSrc(signature)} 
                                                        alt="Saved Signature" 
                                                        className="max-w-full max-h-full object-contain opacity-90 transition-transform group-hover:scale-105"
                                                    />
                                                    <div className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-tighter">Click to Draw</span>
                                                    </div>
                                                </div>
                                            )}
                                            <SignatureCanvas
                                                ref={sigCanvas}
                                                onBegin={() => setIsUsingSavedSignature(false)}
                                                onEnd={() => {
                                                    if (sigCanvas.current) {
                                                        setSignature(sigCanvas.current.getCanvas().toDataURL());
                                                        setIsUsingSavedSignature(false);
                                                    }
                                                }}
                                                canvasProps={{
                                                    className: "w-full h-40 cursor-crosshair",
                                                    style: { background: 'white' }
                                                }}
                                            />
                                            <button
                                                onClick={handleClearSignature}
                                                className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100 rounded-lg z-20 shadow-sm"
                                                type="button"
                                            >
                                                <RotateCcw size={14} />
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
                                        ) : selectedAsmt.status === 'REJECTED' ? (
                                            <button
                                                onClick={() => handleReset(selectedAsmt.id)}
                                                disabled={isActionLoading}
                                                className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-amber-200 hover:bg-amber-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                            >
                                                {actionInProgress === 'reset' ? (
                                                    <Loader2 className="animate-spin" size={18} />
                                                ) : (
                                                    <RotateCcw size={18} />
                                                )}
                                                RESET FOR RE-EVALUATION
                                            </button>
                                        ) : selectedAsmt.status === 'HR_APPROVED' ? (
                                             <>
                                                 <button
                                                     onClick={() => handleLock(selectedAsmt.id)}
                                                     className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-slate-200 hover:bg-black transition-all flex items-center justify-center gap-3"
                                                 >
                                                     <Lock size={18} />
                                                     LOCK FOREVER (FINALIZE)
                                                 </button>
                                                 <div className="grid grid-cols-2 gap-3 mt-3">
                                                     <button
                                                         onClick={() => handleAction('return')}
                                                         disabled={isActionLoading || !comments.trim()}
                                                         className="py-3.5 bg-amber-50 text-amber-700 rounded-xl font-bold text-xs hover:bg-amber-100 transition-all flex items-center justify-center gap-2 border border-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                         title="Return Approved Appraisal for Correction"
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
                                                         title="Reject Approved Appraisal"
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

            {/* KPI Edit Modal for HR */}
            {isKpiModalOpen && kpiTargetEmployee && (
                <KpiEditModal 
                    employee={kpiTargetEmployee} 
                    period={kpiTargetPeriod}
                    onClose={() => {
                        setIsKpiModalOpen(false);
                        if (selectedAsmt) fetchKpiHistory(selectedAsmt.employee.id, selectedAsmt.period?.name);
                    }} 
                />
            )}
        </div>
    );
}

const KpiEditModal = ({ employee, period, onClose }: { employee: any, period?: string, onClose: () => void }) => {
    const [editedKpis, setEditedKpis] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchKpis();
    }, []);

    const fetchKpis = async () => {
        try {
            const resp = await axios.get(`/kpis/employee/${employee.id}${period ? `?period=${period}` : ''}`);
            setEditedKpis(resp.data || []);
        } catch (err) {
            toast.error('Failed to fetch KPIs');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (index: number, field: string, value: any) => {
        const updated = [...editedKpis];
        const kpi = { ...updated[index], [field]: value };

        // Auto-calculate if actual value changed
        if (field === 'actual') {
            const actualStr = String(value || '');
            const targetStr = String(kpi.target || '');
            const weight = Number(kpi.weight || 0);

            const actualNum = parseFloat(actualStr.replace(/[^0-9.]/g, ''));
            const targetNum = parseFloat(targetStr.replace(/[^0-9.]/g, ''));

            if (!isNaN(actualNum) && !isNaN(targetNum) && targetNum !== 0) {
                const score = (actualNum / targetNum) * 100;
                kpi.score = Number(score.toFixed(2));
                kpi.weightedScore = Number(((score * weight) / 100).toFixed(2));
            } else {
                kpi.score = 0;
                kpi.weightedScore = 0;
            }
        }

        updated[index] = kpi;
        setEditedKpis(updated);
    };

    const handleSave = async (status: 'DRAFT' | 'SUBMITTED') => {
        if (status === 'SUBMITTED') {
            const missingActuals = editedKpis.some(k => !k.actual || !k.actual.trim());
            if (missingActuals) {
                toast.error('All KPIs must have an actual value before submitting');
                return;
            }
        }

        setIsUpdating(true);
        try {
            const kpisWithStatus = editedKpis.map(k => ({ ...k, status }));
            await axios.put(`/kpis/hr/employee/${employee.id}/actuals`, kpisWithStatus);
            toast.success(status === 'DRAFT' ? 'KPIs saved as draft' : 'KPIs submitted successfully');
            onClose();
        } catch (err: any) {
            const errorMsg = typeof err.response?.data === 'string' 
                ? err.response.data 
                : err.response?.data?.message || `Failed to ${status === 'DRAFT' ? 'save draft' : 'submit'} KPIs`;
            toast.error(errorMsg);
        } finally {
            setIsUpdating(false);
        }
    };

    const totalWeightedScore = editedKpis.reduce((acc, kpi) => acc + (kpi.weightedScore || 0), 0);

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-black text-slate-900">Update KPI Actuals (HR Access)</h2>
                            {editedKpis[0]?.status === 'DRAFT' && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full uppercase tracking-widest">Draft</span>
                            )}
                        </div>
                        <p className="text-sm font-medium text-slate-500">Employee: <span className="font-bold text-slate-900">{employee.employeeName}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <XCircle size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-0 bg-white">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-slate-300" size={32} /></div>
                    ) : (
                        <div className="min-w-full">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                                        <th className="py-4 px-6 border-r border-slate-200">KPI</th>
                                        <th className="py-4 px-4 text-center border-r border-slate-200">Target</th>
                                        <th className="py-4 px-4 text-center border-r border-slate-200">Unit</th>
                                        <th className="py-4 px-4 text-center border-r border-slate-200">Actual</th>
                                        <th className="py-4 px-4 text-center border-r border-slate-200">Weight (%)</th>
                                        <th className="py-4 px-4 text-center border-r border-slate-200">Score (%)</th>
                                        <th className="py-4 px-6 text-right">Weighted Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {editedKpis.map((kpi, idx) => (
                                        <tr key={kpi.id || idx} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-4 px-6 border-r border-slate-100">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{kpi.name}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{kpi.category}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-center border-r border-slate-100">
                                                <span className="text-xs font-bold text-slate-700">{kpi.target}</span>
                                            </td>
                                            <td className="py-4 px-4 text-center text-[10px] font-black text-slate-400 border-r border-slate-100 uppercase">{kpi.unit}</td>
                                            <td className="py-4 px-2 border-r border-slate-100">
                                                <input 
                                                    type="text" 
                                                    value={kpi.actual || ''} 
                                                    onChange={(e) => handleChange(idx, 'actual', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 transition-all text-center shadow-sm"
                                                    placeholder="—"
                                                />
                                            </td>
                                            <td className="py-4 px-4 text-center border-r border-slate-100">
                                                <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600">
                                                    {kpi.weight}%
                                                </span>
                                            </td>
                                            <td className="py-4 px-2 border-r border-slate-100">
                                                <input 
                                                    type="number" 
                                                    min="0" max="100"
                                                    value={kpi.score || ''} 
                                                    onChange={(e) => handleChange(idx, 'score', parseFloat(e.target.value))}
                                                    className="w-full px-3 py-2 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 transition-all text-center shadow-sm"
                                                />
                                            </td>
                                            <td className="py-4 px-6 text-right font-black text-slate-900 tracking-tight">
                                                {kpi.weightedScore?.toFixed(2) || '0.00'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-50/50 border-t-2 border-slate-200">
                                        <td colSpan={6} className="py-4 px-6 text-right text-xs font-black text-slate-900 uppercase tracking-widest border-r border-slate-200">Total Score</td>
                                        <td className="py-4 px-6 text-right text-sm font-black text-blue-600 tracking-tight bg-blue-50/30">
                                            {totalWeightedScore.toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => handleSave('DRAFT')}
                        disabled={isUpdating || editedKpis.length === 0}
                        className="px-5 py-2.5 bg-slate-100 text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200"
                    >
                        {isUpdating ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                        Save as Draft
                    </button>
                    <button 
                        onClick={() => handleSave('SUBMITTED')}
                        disabled={isUpdating || editedKpis.length === 0}
                        className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUpdating ? <Loader2 className="animate-spin" size={16} /> : <Target size={16} />}
                        Submit KPIs
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppraisalSubmissionsPage;