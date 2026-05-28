import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Download, Eye, FileText, Printer, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from '../app/axiosInstance';
import { PaginationBar } from '../components/common/PaginationBar';
import { useGetProfileQuery } from '../features/user/userApi';
import { addFeedbackScorePerformanceSection } from '../utils/feedbackScorePdf';
import { addPdfProfessionalHeader, addPdfProfessionalFooter, addPdfSectionHeader, addPdfInfoTable } from '../utils/pdfBranding';

type FeedbackDirection = 'ALL' | 'GIVEN' | 'RECEIVED';

interface CombinedHistoryItem {
  id: number;
  date: string;
  direction?: 'GIVEN' | 'RECEIVED' | null;
  evaluatorName?: string | null;
  evaluatorStaffNo?: string | null;
  evaluatorPosition?: string | null;
  evaluatorDepartment?: string | null;
  evaluateeName?: string | null;
  evaluateeStaffNo?: string | null;
  evaluateePosition?: string | null;
  evaluateeDepartment?: string | null;
  position?: string | null;
  role?: string | null;
  score?: number | null;
  remark?: string | null;
  anonymous?: boolean;
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

const tabs: { label: string; value: FeedbackDirection }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Given', value: 'GIVEN' },
  { label: 'Received', value: 'RECEIVED' },
];

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString('en-GB');
};

const formatPdfDate = (value?: string | null) => {
  if (!value) return '-';
  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return `${day}/${month}/${year}`;
  }
  return formatDate(value);
};

const scoreText = (score?: number | null) => (typeof score === 'number' ? `${score.toFixed(1)}%` : '-');

const isReceivedAnonymous = (item: CombinedHistoryItem) =>
  item.direction === 'RECEIVED' && (Boolean(item.anonymous) || item.evaluatorName?.trim().toLowerCase() === 'anonymous');

const evaluatorDisplay = (item: CombinedHistoryItem) => {
  if (isReceivedAnonymous(item)) {
    return { name: 'Anonymous', staffNo: '', position: '', department: '' };
  }
  return {
    name: item.evaluatorName || '-',
    staffNo: item.evaluatorStaffNo || '',
    position: item.evaluatorPosition || '-',
    department: item.evaluatorDepartment || '-',
  };
};

export function CombinedFeedbackHistoryPage() {
  const [history, setHistory] = useState<CombinedHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [reviewCycles, setReviewCycles] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    direction: 'ALL' as FeedbackDirection,
    reviewCycleId: '',
    feedbackType: '',
    fromDate: '',
    toDate: '',
    peopleSearch: '',
  });
  const [selectedFeedback, setSelectedFeedback] = useState<CombinedHistoryItem | null>(null);
  const [details, setDetails] = useState<FeedbackDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: profileResponse } = useGetProfileQuery();
  const timeFormat = profileResponse?.data?.timeFormat || '12h';

  useEffect(() => {
    const fetchReviewCycles = async () => {
      try {
        const resp = await axios.get('/review-cycles?requiresEmployeeSubmission=true');
        setReviewCycles(resp.data.data || []);
      } catch (err) {
        console.error('Review cycle filter load error:', err);
      }
    };
    fetchReviewCycles();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), size: String(pageSize) });
        Object.entries(filters).forEach(([key, value]) => {
          if (value && !(key === 'direction' && value === 'ALL')) params.set(key, value);
        });
        const resp = await axios.get(`/feedback/combined-history?${params.toString()}`);
        setHistory(resp.data.data.content || []);
        setTotalPages(resp.data.data.totalPages || 0);
        setTotalItems(resp.data.data.totalElements || 0);
      } catch (err) {
        toast.error('Failed to load feedback history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [page, pageSize, filters]);

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setPage(0);
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const openDetails = async (item: CombinedHistoryItem) => {
    setSelectedFeedback(item);
    setIsModalOpen(true);
    setLoadingDetails(true);
    try {
      const resp = await axios.get(`/feedback/${item.id}/details`);
      setDetails(resp.data.data || []);
    } catch (err) {
      toast.error('Failed to load feedback details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const getRemarkColor = (remark?: string | null) => {
    switch (remark) {
      case 'Outstanding': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Good': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Meet Requirement': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Need Improvement': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'Unsatisfactory': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const generatePDF = async (item: CombinedHistoryItem) => {
    try {
      const resp = await axios.get(`/feedback/${item.id}/details`);
      const pdfDetails: FeedbackDetail[] = resp.data.data || [];
      const evaluator = evaluatorDisplay(item);
      const doc = new jsPDF();
      const margin = 14;

      const genDateTime = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
      const directionLabel = item.direction === 'RECEIVED' ? 'Received Feedback' : 'Given Feedback';
      addPdfProfessionalHeader(doc, '360° Feedback Assessment Report', `${directionLabel}  |  Generated: ${genDateTime}`, { margin });

      let currentY = 42;
      currentY = addPdfSectionHeader(doc, margin, currentY, 'Evaluator Information', { width: 182 });
      currentY = addPdfInfoTable(doc, currentY + 2, [
        ['Employee Name', evaluator.name, 'Staff ID', evaluator.staffNo || '-'],
        ['Position', evaluator.position || '-', 'Department', evaluator.department || '-'],
      ], { marginLeft: margin, marginRight: margin }) + 8;

      currentY = addPdfSectionHeader(doc, margin, currentY, 'Evaluatee Information', { width: 182 });
      currentY = addPdfInfoTable(doc, currentY + 2, [
        ['Employee Name', item.evaluateeName || '-', 'Staff ID', item.evaluateeStaffNo || '-'],
        ['Position', item.evaluateePosition || item.position || '-', 'Department', item.evaluateeDepartment || '-'],
        ['Assessment Date', formatPdfDate(item.date), 'Cycle', item.reviewCycleName || '-'],
      ], { marginLeft: margin, marginRight: margin }) + 10;

      currentY = addPdfSectionHeader(doc, margin, currentY, 'Evaluation Result', { width: 182 });
      autoTable(doc, {
        startY: currentY + 4,
        head: [['#', 'Criteria', 'Rating', 'Comments']],
        body: pdfDetails.map((detail, index) => [index + 1, detail.criteriaName, detail.rating, detail.comment || '-']),
        theme: 'grid',
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;

      if (item.additionalComments?.trim()) {
        const commentLines = doc.splitTextToSize(item.additionalComments.trim(), 170);
        const commentBoxHeight = Math.max(20, 8 + commentLines.length * 4.5);
        const pageHeight = doc.internal.pageSize.getHeight();
        const footerReserved = 20;
        
        if (currentY + 12 + commentBoxHeight > pageHeight - footerReserved) {
          doc.addPage();
          currentY = 20;
        }
        
        currentY = addPdfSectionHeader(doc, margin, currentY, 'Additional Comments', { width: 182 });
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, currentY + 2, 182, commentBoxHeight, 3, 3, 'FD');
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(commentLines, margin + 6, currentY + 10);
        currentY += commentBoxHeight + 8;
      }

      currentY = addFeedbackScorePerformanceSection(doc, currentY, {
        scorePercentage: item.score || 0,
        remark: item.remark || undefined,
        marginLeft: margin,
        marginRight: margin,
      });

      const pageCount = doc.getNumberOfPages();
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        doc.setPage(pageNumber);
        addPdfProfessionalFooter(doc, pageNumber, pageCount, { margin });
      }
      doc.save(`Feedback_History_${item.id}.pdf`);
      toast.success('Report generated successfully');
    } catch (err) {
      toast.error('Failed to generate PDF Report');
    }
  };

  const selectedEvaluator = useMemo(() => selectedFeedback ? evaluatorDisplay(selectedFeedback) : null, [selectedFeedback]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">FEEDBACK HISTORY</h2>
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" role="tablist" aria-label="Feedback direction">
          {tabs.map(tab => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={filters.direction === tab.value}
              onClick={() => updateFilter('direction', tab.value)}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all ${filters.direction === tab.value ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="md:col-span-2 border-2 border-slate-100 rounded-2xl px-4 py-2 flex items-center gap-2">
          <Search size={18} className="text-slate-400" />
          <input
            aria-label="Search people"
            value={filters.peopleSearch}
            onChange={(e) => updateFilter('peopleSearch', e.target.value)}
            placeholder="Search people..."
            className="text-sm font-bold text-slate-700 outline-none w-full"
          />
        </div>
        <select value={filters.reviewCycleId} onChange={(e) => updateFilter('reviewCycleId', e.target.value)} className="border-2 border-slate-100 rounded-2xl px-4 py-2 text-xs font-black text-slate-500 outline-none bg-white" aria-label="Review cycle">
          <option value="">All cycles</option>
          {reviewCycles.map(cycle => <option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}
        </select>
        <select value={filters.feedbackType} onChange={(e) => updateFilter('feedbackType', e.target.value)} className="border-2 border-slate-100 rounded-2xl px-4 py-2 text-xs font-black text-slate-500 outline-none bg-white" aria-label="Feedback type">
          <option value="">All types</option>
          <option value="PEER">Peer</option>
          <option value="MANAGER">Manager</option>
          <option value="SUBORDINATE">Subordinate</option>
        </select>
        <input aria-label="From date" type="date" value={filters.fromDate} onChange={(e) => updateFilter('fromDate', e.target.value)} className="min-w-0 border-2 border-slate-100 rounded-2xl px-3 py-2 text-xs font-bold text-slate-500 outline-none" />
        <input aria-label="To date" type="date" value={filters.toDate} onChange={(e) => updateFilter('toDate', e.target.value)} className="min-w-0 border-2 border-slate-100 rounded-2xl px-3 py-2 text-xs font-bold text-slate-500 outline-none" />
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                <th className="p-5">Date</th>
                <th className="p-5">Direction</th>
                <th className="p-5">Evaluator</th>
                <th className="p-5">Evaluatee</th>
                <th className="p-5">Role/Type</th>
                <th className="p-5">Cycle</th>
                <th className="p-5 text-center">Score</th>
                <th className="p-5 text-center">Remark</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={9} className="p-20 text-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /><p className="mt-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Loading history...</p></td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={9} className="p-20 text-center"><div className="flex flex-col items-center gap-4 text-slate-300"><FileText size={48} /><p className="text-lg font-black uppercase">No feedback history found</p></div></td></tr>
              ) : history.map(item => {
                const evaluator = evaluatorDisplay(item);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5"><div className="text-sm font-bold text-slate-700">{formatDate(item.date)}</div><div className="text-[10px] font-bold text-slate-400 uppercase">{new Date(item.date).toLocaleTimeString('en-US', { hour12: timeFormat === '12h', hour: '2-digit', minute: '2-digit' })}</div></td>
                    <td className="p-5"><span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${item.direction === 'RECEIVED' ? 'bg-violet-50 text-violet-700' : 'bg-emerald-50 text-emerald-700'}`}>{item.direction === 'RECEIVED' ? 'Received' : 'Given'}</span></td>
                    <td className="p-5"><div className="font-black text-slate-800">{evaluator.name}</div><div className="text-[11px] font-bold text-slate-500">{evaluator.position || '-'}</div><div className="text-[10px] font-bold text-slate-400 uppercase">{evaluator.department || ''}</div></td>
                    <td className="p-5"><div className="font-black text-slate-800">{item.evaluateeName || '-'}</div><div className="text-[11px] font-bold text-slate-500 uppercase">{item.evaluateeStaffNo || '-'}</div></td>
                    <td className="p-5"><span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase">{item.role || '-'}</span></td>
                    <td className="p-5"><div className="text-xs font-black text-slate-600">{item.reviewCycleName || 'N/A'}</div></td>
                    <td className="p-5 text-center"><div className="text-base font-black text-blue-600">{scoreText(item.score)}</div></td>
                    <td className="p-5 text-center"><span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getRemarkColor(item.remark)}`}>{item.remark || '-'}</span></td>
                    <td className="p-5 text-right"><div className="flex items-center justify-end gap-2"><button onClick={() => generatePDF(item)} className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center" title="Download PDF Report"><Download size={18} /></button><button onClick={() => openDetails(item)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center border border-transparent hover:border-slate-200" title="View details"><Eye size={18} /></button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && totalItems > 0 && (
          <PaginationBar pageIndex={page} pageSize={pageSize} pageCount={Math.max(1, totalPages || Math.ceil(totalItems / pageSize))} totalItems={totalItems} itemLabel="records" rowsPerPageOptions={[5, 10, 20, 50]} onPageIndexChange={setPage} onPageSizeChange={(nextSize) => { setPageSize(nextSize); setPage(0); }} className="mt-0 rounded-none border-x-0 border-b-0 border-t border-slate-200/70 shadow-none" />
        )}
      </div>

      <Transition show={isModalOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
          <TransitionChild as={React.Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" /></TransitionChild>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild as={React.Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-[32px] bg-white p-10 shadow-2xl transition-all border border-slate-100">
                  <div className="flex items-center justify-between mb-8 gap-4">
                    <div className="space-y-1">
                      <DialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tight">Feedback Details</DialogTitle>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{selectedFeedback?.direction === 'RECEIVED' ? 'Received from' : 'Given by'}: <span className="text-blue-600">{selectedEvaluator?.name}</span></p>
                    </div>
                    <div className={`px-5 py-2 rounded-2xl border-2 font-black uppercase text-xs tracking-widest ${getRemarkColor(selectedFeedback?.remark)}`}>{selectedFeedback?.remark} | {scoreText(selectedFeedback?.score)}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100"><h4 className="font-black text-slate-800 mb-2">Evaluator</h4><p className="font-bold text-slate-700">{selectedEvaluator?.name || '-'}</p><p className="text-xs font-bold text-slate-500">{selectedEvaluator?.position || '-'}</p><p className="text-xs font-bold text-slate-400">{selectedEvaluator?.department || ''}</p></div>
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100"><h4 className="font-black text-slate-800 mb-2">Evaluatee</h4><p className="font-bold text-slate-700">{selectedFeedback?.evaluateeName || '-'}</p><p className="text-xs font-bold text-slate-500">{selectedFeedback?.evaluateePosition || selectedFeedback?.position || '-'}</p><p className="text-xs font-bold text-slate-400">{selectedFeedback?.evaluateeDepartment || ''}</p></div>
                  </div>
                  <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-4">
                    {loadingDetails ? <div className="p-20 text-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
                      <>
                        {details.map((detail, index) => <div key={`${detail.criteriaName}-${index}`} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4"><div className="flex items-center justify-between"><h5 className="font-black text-slate-800">{detail.criteriaName}</h5><span className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-lg">{detail.rating}</span></div><div className="bg-white p-4 rounded-xl border border-slate-100 italic text-sm text-slate-600 font-medium">{detail.comment || 'No comments provided for this criteria.'}</div></div>)}
                        <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3"><h5 className="font-black text-slate-800">Additional Comments</h5><div className="bg-white p-4 rounded-xl border border-slate-100 italic text-sm text-slate-600 font-medium whitespace-pre-wrap">{selectedFeedback?.additionalComments?.trim() || 'No additional comments provided.'}</div></div>
                      </>
                    )}
                  </div>
                  <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 rounded-xl text-xs font-black text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">CLOSE</button>
                    <button onClick={() => selectedFeedback && generatePDF(selectedFeedback)} className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all"><Printer size={16} /> PRINT REPORT</button>
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
