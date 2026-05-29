import React, { useState, useEffect } from 'react';
import axios from '../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { 
    FileText, 
    Printer, 
    Eye, 
    Search,
    Download
} from 'lucide-react';
import { PaginationBar } from '../components/common/PaginationBar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addFeedbackScorePerformanceSection } from '../utils/feedbackScorePdf';
import { addPdfProfessionalHeader, addPdfProfessionalFooter, addPdfSectionHeader, addPdfInfoTable, loadPdfLogo } from '../utils/pdfBranding';
import { 
    Dialog, 
    DialogPanel, 
    DialogTitle, 
    Transition, 
    TransitionChild 
} from '@headlessui/react';
import { useGetProfileQuery } from '../features/user/userApi';

interface HistoryItem {
    id: number;
    date: string;
    evaluatorName?: string | null;
    evaluatorPosition?: string | null;
    evaluatorDepartment?: string | null;
    evaluateeName: string;
    evaluateeStaffNo: string;
    evaluateePosition?: string | null;
    evaluateeDepartment?: string | null;
    position: string;
    role: string;
    score: number;
    remark: string;
    anonymous?: boolean;
    status?: string;
    reviewCycleId?: number;
    reviewCycleName?: string;
    reviewCycleStartDate?: string | null;
    additionalComments?: string | null;
}

interface FeedbackDetail {
    criteriaName: string;
    rating: number;
    comment: string;
}

const formatPdfDate = (value?: string | null) => {
    if (!value) return '-';

    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;
        return `${day}/${month}/${year}`;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString('en-GB');
};

export function FeedbackHistoryPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [reviewCycles, setReviewCycles] = useState<any[]>([]);
    const [filters, setFilters] = useState({
        reviewCycleId: '',
        status: '',
        fromDate: '',
        reviewee: '',
        feedbackType: ''
    });
    const { data: profileResponse } = useGetProfileQuery();
    const timeFormat = profileResponse?.data?.timeFormat || '12h';

    // Modal state
    const [selectedFeedback, setSelectedFeedback] = useState<HistoryItem | null>(null);
    const [details, setDetails] = useState<FeedbackDetail[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    useEffect(() => {
        fetchHistory();
    }, [page, pageSize, filters]);

    useEffect(() => {
        fetchReviewCycles();
    }, []);

    const updateFilter = (key: keyof typeof filters, value: string) => {
        setPage(0);
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const fetchReviewCycles = async () => {
        try {
            const resp = await axios.get('/review-cycles?requiresEmployeeSubmission=true');
            setReviewCycles(resp.data.data || []);
        } catch (err) {
            console.error('Review cycle filter load error:', err);
        }
    };

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: String(page),
                size: String(pageSize),
            });
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.set(key, value);
            });
            const resp = await axios.get(`/feedback/history?${params.toString()}`);
            setHistory(resp.data.data.content);
            setTotalPages(resp.data.data.totalPages);
            setTotalItems(resp.data.data.totalElements ?? 0);
        } catch (err) {
            toast.error('Failed to load history');
        } finally {
            setLoading(false);
        }
    };

    const openDetails = async (item: HistoryItem) => {
        setSelectedFeedback(item);
        setIsModalOpen(true);
        setLoadingDetails(true);
        try {
            const resp = await axios.get(`/feedback/${item.id}/details`);
            setDetails(resp.data.data);
        } catch (err) {
            toast.error('Failed to load feedback details');
        } finally {
            setLoadingDetails(false);
        }
    };

    const getRemarkColor = (remark: string) => {
        switch (remark) {
            case 'Outstanding': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Good': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Meet Requirement': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Need Improvement': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'Unsatisfactory': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const generatePDF = async (id: number) => {
        try {
            const item = history.find(h => h.id === id);
            if (!item) return;

            const resp = await axios.get(`/feedback/${id}/details`);
            const details = resp.data.data;

            const doc = new jsPDF();
            const margin = 14;

            const logoDataUrl = await loadPdfLogo();
            const isAnonymous = Boolean(item.anonymous) || item.evaluatorName?.trim().toLowerCase() === 'anonymous';
            const evaluatorName = isAnonymous ? 'Anonymous' : item.evaluatorName || '-';
            const evaluatorPosition = isAnonymous ? '-' : item.evaluatorPosition || '-';
            const evaluatorDepartment = isAnonymous ? '-' : item.evaluatorDepartment || '-';

            const refId = `FB-${id}`;
            const genDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            addPdfProfessionalHeader(doc, 'Performance Feedback Report', `Reference: ${refId}  |  ${genDate}`, { margin, logoDataUrl });

            let currentY = 42;
            currentY = addPdfSectionHeader(doc, margin, currentY, 'Evaluatee Information', { width: 182 });
            currentY = addPdfInfoTable(doc, currentY + 2, [
                ['Employee Name', item.evaluateeName || '-', 'Current Position', item.evaluateePosition || item.position || '-'],
                ['Assessment Date', formatPdfDate(item.date), 'Staff ID', item.evaluateeStaffNo || '-'],
                ['Department', item.evaluateeDepartment || '-', 'Effective Date', formatPdfDate(item.reviewCycleStartDate)],
            ], { marginLeft: margin, marginRight: margin }) + 8;

            currentY = addPdfSectionHeader(doc, margin, currentY, 'Evaluator Information', { width: 182 });
            currentY = addPdfInfoTable(doc, currentY + 2, [
                ['Employee Name', evaluatorName, 'Current Position', evaluatorPosition],
                ['Department', evaluatorDepartment, 'Evaluator Role', item.role || '-'],
            ], { marginLeft: margin, marginRight: margin }) + 10;

            currentY = addPdfSectionHeader(doc, margin, currentY, 'Detailed Assessment Criteria', { width: 182 });
            autoTable(doc, {
                startY: currentY + 4,
                head: [['#', 'Assessment Criteria', 'Rating', 'Comments / Observations']],
                body: details.map((d: any, idx: number) => [
                    idx + 1,
                    d.criteriaName,
                    d.rating,
                    d.comment || 'No comment provided'
                ]),
                theme: 'grid',
                margin: { left: margin, right: margin },
                styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
                headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                    2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
                },
                alternateRowStyles: { fillColor: [249, 250, 251] }
            });
            currentY = (doc as any).lastAutoTable.finalY + 10;

            if (item.additionalComments?.trim()) {
                currentY = addPdfSectionHeader(doc, margin, currentY, 'Additional Comments', { width: 182 });
                doc.setDrawColor(226, 232, 240);
                doc.setFillColor(248, 250, 252);
                doc.roundedRect(margin, currentY + 2, 182, 20, 3, 3, 'FD');
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(9);
                doc.setTextColor(71, 85, 105);
                const commentLines = doc.splitTextToSize(item.additionalComments.trim(), 170);
                doc.text(commentLines, margin + 6, currentY + 10);
                currentY += Math.max(28, 12 + commentLines.length * 5);
            }

            currentY = addFeedbackScorePerformanceSection(doc, currentY, {
                scorePercentage: item.score,
                remark: item.remark,
                marginLeft: margin,
                marginRight: margin,
            });

            const pageCount = doc.getNumberOfPages();
            for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
                doc.setPage(pageNumber);
                addPdfProfessionalFooter(doc, pageNumber, pageCount, { margin });
            }

            doc.save(`Feedback_Report_${item.evaluateeStaffNo || id}.pdf`);
            toast.success('Report generated successfully');
        } catch (err) {
            console.error(err);
            toast.error('Failed to generate PDF Report');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">FEEDBACK HISTORY</h2>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="md:col-span-2 border-2 border-slate-100 rounded-2xl px-4 py-2 flex items-center gap-2">
                    <Search size={18} className="text-slate-400" />
                    <input
                        value={filters.reviewee}
                        onChange={(e) => updateFilter('reviewee', e.target.value)}
                        placeholder="Search reviewee..."
                        className="text-sm font-bold text-slate-700 outline-none w-full"
                    />
                </div>
                <select
                    value={filters.reviewCycleId}
                    onChange={(e) => updateFilter('reviewCycleId', e.target.value)}
                    className="border-2 border-slate-100 rounded-2xl px-4 py-2 text-xs font-black text-slate-500 outline-none bg-white"
                >
                    <option value="">All cycles</option>
                    {reviewCycles.map(cycle => (
                        <option key={cycle.id} value={cycle.id}>{cycle.name}</option>
                    ))}
                </select>
                <select
                    value={filters.feedbackType}
                    onChange={(e) => updateFilter('feedbackType', e.target.value)}
                    className="border-2 border-slate-100 rounded-2xl px-4 py-2 text-xs font-black text-slate-500 outline-none bg-white"
                >
                    <option value="">All types</option>
                    <option value="SELF">Self Feedback</option>
                    <option value="PEER">Peer</option>
                    <option value="MANAGER">Manager</option>
                    <option value="SUBORDINATE">Subordinate</option>
                </select>
                <select
                    value={filters.status}
                    onChange={(e) => updateFilter('status', e.target.value)}
                    className="border-2 border-slate-100 rounded-2xl px-4 py-2 text-xs font-black text-slate-500 outline-none bg-white"
                >
                    <option value="">All statuses</option>
                    <option value="SUBMITTED">Submitted</option>
                </select>
                <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => updateFilter('fromDate', e.target.value)}
                    className="min-w-0 border-2 border-slate-100 rounded-2xl px-3 py-2 text-xs font-bold text-slate-500 outline-none"
                />
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                            <th className="p-6">Date</th>
                            <th className="p-6">Evaluatee</th>
                            <th className="p-6">Position</th>
                            <th className="p-6">Role</th>
                            <th className="p-6">Cycle</th>
                            <th className="p-6 text-center">Score</th>
                            <th className="p-6 text-center">Remark</th>
                            <th className="p-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="p-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading history...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : history.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-20 text-center">
                                    <div className="flex flex-col items-center gap-4 text-slate-300">
                                        <FileText size={48} />
                                        <p className="text-lg font-black uppercase">No feedback history found</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            history.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-6">
                                        <div className="text-sm font-bold text-slate-700">{new Date(item.date).toLocaleDateString('en-GB')}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                                            {new Date(item.date).toLocaleTimeString('en-US', { 
                                                hour12: timeFormat === '12h', 
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                            })}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="font-black text-slate-800">{item.evaluateeName}</div>
                                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{item.evaluateeStaffNo}</div>
                                    </td>
                                    <td className="p-6">
                                        <div className="text-sm font-bold text-slate-600">{item.position}</div>
                                    </td>
                                    <td className="p-6">
                                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            {item.role}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="text-xs font-black text-slate-600">{item.reviewCycleName || 'N/A'}</div>
                                        <div className="text-[10px] font-bold text-emerald-600 uppercase">{item.status || 'SUBMITTED'}</div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <div className="text-base font-black text-blue-600">{item.score.toFixed(1)}%</div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight shadow-sm border ${getRemarkColor(item.remark)}`}>
                                            {item.remark}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => generatePDF(item.id)}
                                                className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                                title="Download PDF Report"
                                            >
                                                <Download size={18} />
                                            </button>
                                            <button 
                                                onClick={() => openDetails(item)}
                                                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center border border-transparent hover:border-slate-200"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                </div>

                {!loading && totalItems > 0 && (
                    <PaginationBar
                        pageIndex={page}
                        pageSize={pageSize}
                        pageCount={Math.max(1, totalPages || Math.ceil(totalItems / pageSize))}
                        totalItems={totalItems}
                        itemLabel="records"
                        rowsPerPageOptions={[5, 10, 20, 50]}
                        onPageIndexChange={setPage}
                        onPageSizeChange={(nextSize) => {
                            setPageSize(nextSize);
                            setPage(0);
                        }}
                        className="mt-0 rounded-none border-x-0 border-b-0 border-t border-slate-200/70 shadow-none"
                    />
                )}
            </div>

            {/* Detailed View Modal */}
            <Transition show={isModalOpen} as={React.Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
                    <TransitionChild
                        as={React.Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
                    </TransitionChild>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <TransitionChild
                                as={React.Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-[32px] bg-white p-10 shadow-2xl transition-all border border-slate-100">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="space-y-1">
                                            <DialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                                Feedback Details
                                            </DialogTitle>
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                                Evaluating: <span className="text-blue-600">{selectedFeedback?.evaluateeName}</span>
                                            </p>
                                        </div>
                                        <div className={`px-5 py-2 rounded-2xl border-2 font-black uppercase text-xs tracking-widest ${getRemarkColor(selectedFeedback?.remark || '')}`}>
                                            {selectedFeedback?.remark} • {selectedFeedback?.score.toFixed(1)}%
                                        </div>
                                    </div>

                                    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                                        {loadingDetails ? (
                                            <div className="p-20 text-center space-y-4">
                                                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Fetching details...</p>
                                            </div>
                                        ) : (
                                            <>
                                                {details.map((d, i) => (
                                                    <div key={i} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <h5 className="font-black text-slate-800">{d.criteriaName}</h5>
                                                            <span className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-blue-100">
                                                                {d.rating}
                                                            </span>
                                                        </div>
                                                        <div className="bg-white p-4 rounded-xl border border-slate-100 italic text-sm text-slate-600 font-medium leading-relaxed">
                                                            {d.comment || (
                                                                <span className="text-slate-300 italic">No comments provided for this criteria.</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                                                    <h5 className="font-black text-slate-800">Additional Comments</h5>
                                                    <div className="bg-white p-4 rounded-xl border border-slate-100 italic text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                                                        {selectedFeedback?.additionalComments?.trim() || (
                                                            <span className="text-slate-300 italic">No additional comments provided.</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end gap-3">
                                        <button
                                            onClick={() => setIsModalOpen(false)}
                                            className="px-8 py-3 rounded-xl text-xs font-black text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                                        >
                                            CLOSE
                                        </button>
                                        <button
                                            onClick={() => selectedFeedback && generatePDF(selectedFeedback.id)}
                                            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                        >
                                            <Printer size={16} /> PRINT REPORT
                                        </button>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}
