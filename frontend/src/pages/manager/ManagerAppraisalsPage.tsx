import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    Award, 
    Search, 
    Filter, 
    ChevronRight, 
    ChevronDown,
    AlertCircle, 
    ArrowRight,
    Building2,
    Calendar,
    FileText,
    Download
} from 'lucide-react';
import { formatCycleDate } from '../self-assessment-form/SelfAssessmentReviewCycleInfo';
import { exportAppraisalPdf } from '../../utils/exportAppraisalPdf';
import { addPdfFooterBranding, addPdfHeaderBranding, addPdfHeaderLogo, getPdfHeaderTextX, loadPdfLogo } from '../../utils/pdfBranding';
import {
    appraisalGradientIcon,
    appraisalGradientBtn,
    appraisalGradientSoft,
} from '../../features/appraisals/appraisalTheme';

interface AppraisalAssignment {
    id: number;
    employee: {
        id: number;
        employeeId: string;
        employeeName: string;
        department?: { id: number; name: string };
        position?: { id: number; name: string };
    };
    period: {
        name: string;
        startDate: string;
        endDate: string;
    };
    status: string;
    totalScore?: number;
    ratingCategory?: string;
    updatedAt: string;
}

export const ManagerAppraisalsPage: React.FC = () => {
    const [assignments, setAssignments] = useState<AppraisalAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterPosition, setFilterPosition] = useState('ALL');
    const [allDepartmentPositions, setAllDepartmentPositions] = useState<string[]>([]);
    const [showTopOnly, setShowTopOnly] = useState(false);
    const [showBottomOnly, setShowBottomOnly] = useState(false);
    const [filterAction, setFilterAction] = useState<'ALL' | 'PENDING' | 'DRAFT' | 'COMPLETED'>('ALL');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const resp = await axios.get('/appraisal-assignments/my-team');
            const data = resp.data.data || [];
            setAssignments(data);
            
            // Fetch all positions for this department
            if (data.length > 0) {
                const deptId = data[0].employee.department?.id;
                if (deptId) {
                    const posResp = await axios.get(`/departments/${deptId}/positions`);
                    const positions = (posResp.data.data || []).map((m: any) => m.positionName);
                    setAllDepartmentPositions(Array.from(new Set(positions)) as string[]);
                }
            }
        } catch (err) {
            console.error("Failed to fetch assignments", err);
            toast.error("Failed to load appraisals");
        } finally {
            setLoading(false);
        }
    };

    const handleExportSummaryPDF = async () => {
        // Filter based on the currently active tab (HR_APPROVED or LOCKED)
        const targetStatus = filterStatus === 'LOCKED' ? 'LOCKED' : 'HR_APPROVED';
        const filteredByStatus = assignments.filter(a => a.status === targetStatus);
        
        const filtered = filteredByStatus.filter(a => {
            const posName = a.employee.position?.name || (a.employee.position as any)?.positionName;
            const matchesPosition = filterPosition === 'ALL' || posName === filterPosition;
            return matchesPosition;
        }).sort((a, b) => {
            const scoreA = a.totalScore ?? 0;
            const scoreB = b.totalScore ?? 0;
            return scoreB - scoreA;
        });

        if (filtered.length === 0) {
            toast.error(`No appraisals found for ${filterPosition === 'ALL' ? 'all positions' : filterPosition}.`);
            return;
        }

        const doc = new jsPDF('l', 'mm', 'a4');
        const deptName = filtered[0].employee.department?.name || (filtered[0].employee.department as any)?.departmentName || 'Department';
        const dateStr = formatCycleDate(new Date().toISOString().split('T')[0]);

        const logoDataUrl = await loadPdfLogo();
        const margin = 15;
        const logoWidth = 24;
        const headerTextX = getPdfHeaderTextX(margin, !!logoDataUrl, { logoWidth });

        // Header
        doc.setFillColor(36, 99, 235);
        doc.rect(0, 0, 297, 40, 'F');
        if (logoDataUrl) {
            addPdfHeaderLogo(doc, logoDataUrl, { x: margin, y: 5, width: logoWidth, height: 12 });
        }
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('PERFORMANCE SUMMARY REPORT', headerTextX, 20);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Department: ${deptName.toUpperCase()}`, headerTextX, 30);
        doc.text(`Generated on: ${dateStr}`, headerTextX, 35);
        doc.text(`Filter: ${targetStatus === 'LOCKED' ? 'FINALIZED' : 'APPROVED'} | Position: ${filterPosition === 'ALL' ? 'ALL POSITIONS' : filterPosition.toUpperCase()}`, 282, 35, { align: 'right' });
        addPdfHeaderBranding(doc, { margin: 15, y: 12, textColor: [255, 255, 255] });

        const tableData = filtered.map((a, index) => [
            index + 1,
            a.employee.employeeName,
            a.employee.employeeId,
            a.employee.position?.name || 'N/A',
            a.period.name,
            `${a.totalScore?.toFixed(1) || '0.0'}%`,
            a.ratingCategory || 'N/A'
        ]);

        autoTable(doc, {
            head: [['NO', 'EMPLOYEE NAME', 'STAFF ID', 'POSITION', 'PERIOD', 'SCORE %', 'RATING']],
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
                5: { halign: 'center', fontStyle: 'bold' },
                6: { halign: 'center', fontStyle: 'bold' }
            },
            alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        const pageCount = doc.getNumberOfPages();
        for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
            doc.setPage(pageNumber);
            addPdfFooterBranding(doc, { align: 'left', margin: 15, y: doc.internal.pageSize.getHeight() - 8 });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(`Page ${pageNumber} of ${pageCount}`, doc.internal.pageSize.getWidth() - 15, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
        }

        doc.save(`Performance_Summary_${deptName}_${dateStr.replace(/\//g, '-')}.pdf`);
        toast.success("Summary report exported successfully.");
    };

    const handleDownloadPdf = async (assignmentId: number) => {
        try {
            toast.loading('Generating PDF report...', { id: `pdf-${assignmentId}` });
            const response = await axios.get(`/appraisal-assignments/${assignmentId}/form`);
            if (response.data.success) {
                await exportAppraisalPdf(response.data.data);
                toast.success('PDF report exported successfully', { id: `pdf-${assignmentId}` });
            } else {
                toast.error('Failed to generate PDF report', { id: `pdf-${assignmentId}` });
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to export PDF report', { id: `pdf-${assignmentId}` });
        }
    };

    const isEditableStatus = (status: string) =>
        status === 'PENDING_MANAGER' || status === 'RETURNED' || status === 'DRAFT';

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING_MANAGER':
                return 'PENDING';
            case 'DRAFT':
                return 'DRAFT';
            case 'RETURNED':
                return 'RETURNED';
            case 'SUBMITTED':
                return 'SUBMITTED';
            case 'HR_APPROVED':
                return 'APPROVED';
            case 'REJECTED':
                return 'REJECTED';
            case 'LOCKED':
                return 'FINALIZED';
            default:
                return status.replace('_', ' ');
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PENDING_MANAGER':
                return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'DRAFT':
                return 'bg-violet-50 text-violet-600 border-violet-100';
            case 'SUBMITTED':
                return 'bg-[#eff6ff] text-[#2463eb] border-[#dbeafe]';
            case 'HR_APPROVED':
                return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'REJECTED':
                return 'bg-red-50 text-red-600 border-red-100';
            case 'LOCKED':
                return 'bg-slate-900 text-white border-slate-900';
            default:
                return 'bg-slate-50 text-slate-400 border-slate-100';
        }
    };

    const uniquePositions = allDepartmentPositions.length > 0 
        ? allDepartmentPositions 
        : Array.from(new Set(assignments.map(a => a.employee.position?.name).filter(Boolean))) as string[];

    const filteredAssignments = assignments.filter(a => {
        const matchesSearch = a.employee.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             a.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;
        const matchesPosition = filterPosition === 'ALL' || a.employee.position?.name === filterPosition;
        
        let matchesAction = true;
        if (filterAction === 'PENDING') {
            matchesAction = a.status === 'PENDING_MANAGER' || a.status === 'RETURNED';
        } else if (filterAction === 'DRAFT') {
            matchesAction = a.status === 'DRAFT';
        } else if (filterAction === 'COMPLETED') {
            matchesAction = a.status === 'SUBMITTED' || a.status === 'HR_APPROVED' || a.status === 'LOCKED' || a.status === 'REJECTED';
        }
        
        return matchesSearch && matchesStatus && matchesPosition && matchesAction;
    }).sort((a, b) => {
        const scoreA = a.totalScore ?? 0;
        const scoreB = b.totalScore ?? 0;
        return scoreB - scoreA;
    });

    // Handle Top/Bottom Performers filtering for Manager view
    let finalAssignments = filteredAssignments;
    if (showTopOnly || showBottomOnly) {
        // Since manager sees their team (usually one dept), find max/min across current filtered list
        const scores = filteredAssignments.map(a => a.totalScore ?? 0).filter(s => s > 0);
        if (scores.length > 0) {
            const extremeScore = showTopOnly ? Math.max(...scores) : Math.min(...scores);
            finalAssignments = filteredAssignments.filter(a => (a.totalScore ?? 0) === extremeScore && (a.totalScore ?? 0) > 0);
        }
    }

    const maxScoreAcrossFiltered = filteredAssignments.length > 0 ? Math.max(...filteredAssignments.map(a => a.totalScore ?? 0)) : 0;
    const minScoreAcrossFiltered = filteredAssignments.length > 0 ? Math.min(...filteredAssignments.map(a => a.totalScore ?? 0).filter(s => s > 0)) : 0;

    // Pagination Logic
    const totalPages = Math.ceil(finalAssignments.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = finalAssignments.slice(indexOfFirstItem, indexOfLastItem);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterPosition, filterAction]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-col justify-between items-start md:items-start gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                        <div className={`w-12 h-12 ${appraisalGradientIcon} text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#2463eb]/20`}>
                            <Award size={24} />
                        </div>
                        Team Appraisals
                    </h1>
                    <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">
                        Manage and fill out performance appraisals for your direct reports
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#2463eb] focus:border-[#2463eb] outline-none transition-all font-medium text-sm"
                        />
                    </div>
                    
                    {(filterStatus === 'HR_APPROVED' || filterStatus === 'LOCKED') && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setShowTopOnly(!showTopOnly);
                                    setShowBottomOnly(false);
                                }}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${
                                    showTopOnly 
                                    ? `${appraisalGradientBtn} text-white shadow-[#2463eb]/20` 
                                    : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                🏆 {showTopOnly ? 'Showing Best' : 'Show Top'}
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
                                ⚠️ {showBottomOnly ? 'Showing Bottom' : 'Show Bottom'}
                            </button>
                            
                            <button
                                onClick={handleExportSummaryPDF}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200 animate-in zoom-in duration-300"
                            >
                                <FileText size={16} /> Export Summary (PDF)
                            </button>
                        </div>
                    )}

                    {/* Action Filter */}
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
                        <button
                            onClick={() => setFilterAction('ALL')}
                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterAction === 'ALL' ? `${appraisalGradientBtn} text-white shadow-md` : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterAction('PENDING')}
                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterAction === 'PENDING' ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setFilterAction('DRAFT')}
                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterAction === 'DRAFT' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Drafts
                        </button>
                        <button
                            onClick={() => setFilterAction('COMPLETED')}
                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterAction === 'COMPLETED' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Completed
                        </button>
                    </div>

                    {/* Position Filter */}
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        <select
                            value={filterPosition}
                            onChange={(e) => setFilterPosition(e.target.value)}
                            className="pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#2463eb] focus:border-[#2463eb] outline-none transition-all font-black text-[10px] uppercase tracking-widest appearance-none min-w-[160px] text-slate-600"
                        >
                            <option value="ALL">All Positions</option>
                            {uniquePositions.map(pos => (
                                <option key={pos} value={pos}>{pos}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
                        {['ALL', 'PENDING_MANAGER', 'DRAFT', 'RETURNED', 'SUBMITTED', 'HR_APPROVED', 'REJECTED', 'LOCKED'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === status ? 'bg-white text-[#2463eb] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {status === 'ALL' ? 'ALL' : getStatusLabel(status)}
                            </button>
                        ))}
                    </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white h-64 rounded-[2rem] border border-slate-100 animate-pulse" />
                    ))}
                </div>
            ) : filteredAssignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-24 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200">
                        <AlertCircle size={40} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">No Appraisals Found</h3>
                        <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest max-w-xs mx-auto">
                            There are currently no appraisals assigned to you for review.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentItems.map((assignment) => (
                        <div 
                            key={assignment.id}
                            className="group bg-white rounded-[2.5rem] border border-slate-100 p-6 hover:shadow-2xl hover:shadow-[#2463eb]/10 hover:translate-y-[-8px] transition-all duration-500 relative overflow-hidden"
                        >
                            {/* Status Badge */}
                            <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight border ${getStatusStyle(assignment.status)}`}>
                                {getStatusLabel(assignment.status)}
                            </div>

                            <div className="space-y-6">
                                {/* Employee Profile */}
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 ${assignment.status === 'SUBMITTED' ? 'bg-slate-900 text-white' : `${appraisalGradientSoft} text-[#2463eb]`} rounded-2xl flex items-center justify-center font-black text-xl shadow-inner group-hover:scale-110 transition-transform`}>
                                        {(assignment.employee.employeeName || 'E').charAt(0)}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-slate-900 group-hover:text-[#2463eb] transition-colors">
                                            {assignment.employee.employeeName || 'N/A'}
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                            ID: {assignment.employee.employeeId}
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            {assignment.totalScore !== undefined && assignment.totalScore > 0 && assignment.totalScore === maxScoreAcrossFiltered && (
                                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black rounded-md border border-amber-200 animate-bounce shadow-sm">
                                                    🏆 TOP PERFORMER
                                                </span>
                                            )}
                                            {assignment.totalScore !== undefined && assignment.totalScore > 0 && assignment.totalScore === minScoreAcrossFiltered && (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[8px] font-black rounded-md border border-red-200 shadow-sm">
                                                    ⚠️ NEEDS SUPPORT
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Dept & Position */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-50">
                                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                            <Building2 size={12} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Department</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-700 uppercase truncate">
                                            {assignment.employee.department?.name || (assignment.employee.department as any)?.departmentName || 'General'}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-50">
                                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                            <Award size={12} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Position</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-700 uppercase truncate">
                                            {assignment.employee.position?.name || 'Staff'}
                                        </p>
                                    </div>
                                </div>

                                {/* Cycle Info */}
                                <div className={`${appraisalGradientSoft} p-4 rounded-3xl border border-[#bfdbfe]/50 space-y-2`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[#2463eb]">
                                            <Calendar size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Active Cycle</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-[#1d4ed8]">{assignment.period.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="font-bold text-slate-400 uppercase">Deadline:</span>
                                        <span className="font-black text-slate-700 uppercase tracking-tighter italic">
                                            {formatCycleDate(assignment.period.endDate)}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="flex gap-2">
                                    <Link 
                                        to={`/manager/appraisals/${assignment.id}/evaluate`}
                                        className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm ${
                                            isEditableStatus(assignment.status)
                                            ? 'bg-slate-900 text-white hover:bg-[#2463eb] hover:shadow-lg hover:shadow-[#2463eb]/20'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {isEditableStatus(assignment.status) ? (
                                            <>
                                                {assignment.status === 'RETURNED'
                                                    ? 'RE-EVALUATE'
                                                    : assignment.status === 'DRAFT'
                                                        ? 'Continue Draft'
                                                        : 'Start Evaluation'} <ArrowRight size={14} />
                                            </>
                                        ) : (
                                            <>View Details <ChevronRight size={14} /></>
                                        )}
                                    </Link>
                                    {!isEditableStatus(assignment.status) && (
                                        <button
                                            onClick={() => handleDownloadPdf(assignment.id)}
                                            className="px-4 py-4 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 transition-all flex items-center justify-center shadow-sm cursor-pointer"
                                            title="Download PDF"
                                        >
                                            <Download size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Background Decoration */}
                            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#eff6ff] rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {!loading && finalAssignments.length > itemsPerPage && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-8 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Showing <span className="text-slate-900">{indexOfFirstItem + 1}</span> to <span className="text-slate-900">{Math.min(indexOfLastItem, finalAssignments.length)}</span> of <span className="text-slate-900">{finalAssignments.length}</span> assignments
                    </p>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:border-[#2463eb] hover:text-[#2463eb] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={18} className="rotate-180" />
                        </button>
                        
                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => {
                                const pageNum = i + 1;
                                // Show limited page numbers if totalPages is large
                                if (totalPages > 7 && (pageNum > 2 && pageNum < totalPages - 1 && Math.abs(pageNum - currentPage) > 1)) {
                                    if (pageNum === 3 || pageNum === totalPages - 2) return <span key={pageNum} className="px-2 text-slate-300">...</span>;
                                    return null;
                                }
                                
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === pageNum ? `${appraisalGradientBtn} text-white shadow-lg shadow-[#2463eb]/20 scale-110` : 'text-slate-400 hover:bg-slate-50'}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:border-[#2463eb] hover:text-[#2463eb] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
