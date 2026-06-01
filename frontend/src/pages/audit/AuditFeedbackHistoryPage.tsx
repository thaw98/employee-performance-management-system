import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, Eye, FileSpreadsheet, FileText, RefreshCcw, Search } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import axios from '../../app/axiosInstance';
import { PaginationBar } from '../../components/common/PaginationBar';
import { addFeedbackScorePerformanceSection } from '../../utils/feedbackScorePdf';
import { addPdfInfoTable, addPdfProfessionalFooter, addPdfProfessionalHeader, addPdfSectionHeader, loadPdfLogo } from '../../utils/pdfBranding';

interface AuditSummaryRow {
  employeeId: number;
  employeeName?: string | null;
  staffNo?: string | null;
  position?: string | null;
  department?: string | null;
  feedbackCount: number;
  anonymousCount: number;
  nonAnonymousCount: number;
  averageScore: number;
  latestFeedbackDate?: string | null;
  reviewCycleId?: number | null;
  reviewCycleName?: string | null;
}

interface AuditTotals {
  totalEvaluatees: number;
  totalFeedbackCount: number;
  anonymousCount: number;
  nonAnonymousCount: number;
  averageScore: number;
}

interface AuditHistoryItem {
  id: number;
  date: string;
  evaluatorName?: string | null;
  evaluatorStaffNo?: string | null;
  evaluatorPosition?: string | null;
  evaluatorDepartment?: string | null;
  evaluateeName?: string | null;
  evaluateeStaffNo?: string | null;
  evaluateePosition?: string | null;
  evaluateeDepartment?: string | null;
  role?: string | null;
  score?: number | null;
  remark?: string | null;
  anonymous?: boolean;
  additionalComments?: string | null;
  reviewCycleName?: string | null;
}

interface FeedbackDetail {
  criteriaName: string;
  rating: number;
  comment: string;
}

const emptyTotals: AuditTotals = {
  totalEvaluatees: 0,
  totalFeedbackCount: 0,
  anonymousCount: 0,
  nonAnonymousCount: 0,
  averageScore: 0,
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString('en-GB');
};

const scoreText = (score?: number | null) => (typeof score === 'number' ? `${score.toFixed(1)}%` : '-');

const todayIso = () => new Date().toISOString().slice(0, 10);

const isStartedOrPastCycle = (cycle: { startDate?: string | null; status?: string | null }) => {
  if (cycle.status?.toUpperCase() === 'UPCOMING') return false;
  if (cycle.startDate) return cycle.startDate <= todayIso();
  return true;
};

const buildParams = (page: number, pageSize: number, filters: Record<string, string>) => {
  const params = new URLSearchParams({ page: String(page), size: String(pageSize) });
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params;
};

const getRemarkColor = (remark?: string | null) => {
  switch (remark) {
    case 'Outstanding': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'Good': return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'Meet Requirement': return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'Need Improvement': return 'bg-orange-50 text-orange-700 border-orange-100';
    case 'Unsatisfactory': return 'bg-red-50 text-red-700 border-red-100';
    default: return 'bg-slate-50 text-slate-600 border-slate-100';
  }
};

function AuditSummaryStats({ totals }: { totals: AuditTotals }) {
  const items = [
    ['Evaluatees', totals.totalEvaluatees],
    ['Feedback', totals.totalFeedbackCount],
    ['Anonymous', totals.anonymousCount],
    ['Not Anonymous', totals.nonAnonymousCount],
    ['Avg Score', scoreText(totals.averageScore)],
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
          <div className="mt-1 text-2xl font-black text-slate-800">{value}</div>
        </div>
      ))}
    </div>
  );
}

export function AuditFeedbackHistoryPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AuditSummaryRow[]>([]);
  const [totals, setTotals] = useState<AuditTotals>(emptyTotals);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [reviewCycles, setReviewCycles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    reviewCycleId: '',
    feedbackType: '',
    fromDate: '',
    toDate: '',
  });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [cyclesResp, departmentsResp] = await Promise.all([
          axios.get('/review-cycles?requiresEmployeeSubmission=true'),
          axios.get('/departments'),
        ]);
        setReviewCycles((cyclesResp.data.data || []).filter(isStartedOrPastCycle));
        setDepartments(departmentsResp.data.data || []);
      } catch {
        toast.error('Failed to load filters');
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true);
        const resp = await axios.get(`/feedback/audit/history-summary?${buildParams(page, pageSize, filters).toString()}`);
        const data = resp.data.data || {};
        setRows(data.content || []);
        setTotals(data.totals || emptyTotals);
        setTotalPages(data.totalPages || 0);
        setTotalItems(data.totalElements || 0);
      } catch {
        toast.error('Failed to load audit feedback history');
      } finally {
        setLoading(false);
      }
    };
    loadSummary();
  }, [page, pageSize, filters]);

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setPage(0);
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filterSummary = useMemo(() => {
    const entries = [
      ['Search', filters.search || 'All'],
      ['Department', departments.find(d => String(d.id) === filters.department)?.name || filters.department || 'All'],
      ['Cycle', reviewCycles.find(c => String(c.id) === filters.reviewCycleId)?.name || 'All'],
      ['Type', filters.feedbackType || 'All'],
      ['From', filters.fromDate || 'Any'],
      ['To', filters.toDate || 'Any'],
    ];
    return entries;
  }, [departments, filters, reviewCycles]);

  const fetchExportRows = async () => {
    const resp = await axios.get(`/feedback/audit/history-summary?${buildParams(0, 10000, filters).toString()}`);
    return resp.data.data?.content || rows;
  };

  const exportExcel = async () => {
    try {
      const exportRows = await fetchExportRows();
      const summaryRows = [
        ['Report Filters'],
        ...filterSummary,
        [],
        ['Total Evaluatees', totals.totalEvaluatees],
        ['Total Feedback Count', totals.totalFeedbackCount],
        ['Anonymous Count', totals.anonymousCount],
        ['Non-Anonymous Count', totals.nonAnonymousCount],
        ['Average Score', scoreText(totals.averageScore)],
        [],
        ['Evaluatee', 'Staff No', 'Position', 'Department', 'Feedback Count', 'Anonymous', 'Not Anonymous', 'Average Score', 'Latest Feedback', 'Cycle'],
        ...exportRows.map((row: AuditSummaryRow) => [
          row.employeeName || '-',
          row.staffNo || '-',
          row.position || '-',
          row.department || '-',
          row.feedbackCount,
          row.anonymousCount,
          row.nonAnonymousCount,
          scoreText(row.averageScore),
          formatDate(row.latestFeedbackDate),
          row.reviewCycleName || '-',
        ]),
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), '360 Summary');
      XLSX.writeFile(workbook, '360_Feedback_Summary.xlsx');
    } catch {
      toast.error('Failed to export Excel summary');
    }
  };

  const exportPdf = async () => {
    try {
      const exportRows = await fetchExportRows();
      const doc = new jsPDF();
      const margin = 14;
      const logoDataUrl = await loadPdfLogo();
      addPdfProfessionalHeader(doc, '360 Feedback Summary', `Generated: ${new Date().toLocaleString('en-GB')}`, { margin, logoDataUrl });
      let currentY = addPdfSectionHeader(doc, margin, 42, 'Report Filters', { width: 182 });
      currentY = addPdfInfoTable(doc, currentY + 2, filterSummary, { marginLeft: margin, marginRight: margin }) + 8;
      currentY = addPdfSectionHeader(doc, margin, currentY, 'Totals', { width: 182 });
      currentY = addPdfInfoTable(doc, currentY + 2, [
        ['Total Evaluatees', String(totals.totalEvaluatees), 'Feedback Count', String(totals.totalFeedbackCount)],
        ['Anonymous', String(totals.anonymousCount), 'Not Anonymous', String(totals.nonAnonymousCount)],
        ['Average Score', scoreText(totals.averageScore), '', ''],
      ], { marginLeft: margin, marginRight: margin }) + 8;
      autoTable(doc, {
        startY: currentY,
        head: [['Evaluatee', 'Staff No', 'Department', 'Count', 'Anon', 'Not Anon', 'Avg', 'Latest']],
        body: exportRows.map((row: AuditSummaryRow) => [row.employeeName || '-', row.staffNo || '-', row.department || '-', row.feedbackCount, row.anonymousCount, row.nonAnonymousCount, scoreText(row.averageScore), formatDate(row.latestFeedbackDate)]),
        theme: 'grid',
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      });
      const pageCount = doc.getNumberOfPages();
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        doc.setPage(pageNumber);
        addPdfProfessionalFooter(doc, pageNumber, pageCount, { margin });
      }
      doc.save('360_Feedback_Summary.pdf');
    } catch {
      toast.error('Failed to export PDF summary');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-6 py-5 text-white shadow-xl">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30">
              <RefreshCcw size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">360 Feedback History</h2>
              <p className="text-sm font-medium text-slate-300">Company-wide evaluatee summary</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportExcel} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-black text-white backdrop-blur-sm transition hover:bg-white/20"><FileSpreadsheet size={16} /> EXCEL</button>
            <button type="button" onClick={exportPdf} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-black text-white backdrop-blur-sm transition hover:bg-white/20"><FileText size={16} /> PDF</button>
          </div>
        </div>
      </div>

      <AuditSummaryStats totals={totals} />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 flex items-center gap-2 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-50 transition-all">
          <Search size={17} className="text-slate-400 shrink-0" />
          <input aria-label="Search evaluatee" value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} placeholder="Search evaluatee..." className="bg-transparent text-sm font-semibold text-slate-700 outline-none w-full placeholder:text-slate-400" />
        </div>
        <select aria-label="Department" value={filters.department} onChange={(e) => updateFilter('department', e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-bold text-slate-600 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all">
          <option value="">All departments</option>
          {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
        </select>
        <select aria-label="Review cycle" value={filters.reviewCycleId} onChange={(e) => updateFilter('reviewCycleId', e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-bold text-slate-600 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all">
          <option value="">All cycles</option>
          {reviewCycles.map(cycle => <option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}
        </select>
        <select aria-label="Feedback type" value={filters.feedbackType} onChange={(e) => updateFilter('feedbackType', e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-bold text-slate-600 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all">
          <option value="">All types</option>
          <option value="SELF">Self Feedback</option>
          <option value="PEER">Peer</option>
          <option value="MANAGER">Manager</option>
          <option value="SUBORDINATE">Subordinate</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input aria-label="From date" type="date" value={filters.fromDate} onChange={(e) => updateFilter('fromDate', e.target.value)} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs font-bold text-slate-600 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all" />
          <input aria-label="To date" type="date" value={filters.toDate} onChange={(e) => updateFilter('toDate', e.target.value)} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs font-bold text-slate-600 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-5 py-4">Evaluatee</th>
                <th className="px-5 py-4">Position</th>
                <th className="px-5 py-4">Department</th>
                <th className="px-5 py-4 text-center">Feedback</th>
                <th className="px-5 py-4 text-center">Anonymous</th>
                <th className="px-5 py-4 text-center">Not Anonymous</th>
                <th className="px-5 py-4 text-center">Avg Score</th>
                <th className="px-5 py-4">Latest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-20 text-center"><div className="flex flex-col items-center gap-4"><div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading feedback history...</p></div></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-20 text-center"><div className="flex flex-col items-center gap-3"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"><FileText size={28} /></div><p className="text-base font-black uppercase text-slate-300">No feedback history found</p></div></td></tr>
              ) : rows.map(row => (
                <tr key={row.employeeId} className="transition hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <button type="button" onClick={() => {
                      const drilldownParams = new URLSearchParams();
                      Object.entries(filters).forEach(([key, value]) => {
                        if (value && key !== 'search') drilldownParams.set(key, value);
                      });
                      const suffix = drilldownParams.toString();
                      navigate(`/audit/360-feedback/history/${row.employeeId}${suffix ? `?${suffix}` : ''}`);
                    }} className="text-left font-black text-blue-600 transition hover:text-blue-800">{row.employeeName || '-'}</button>
                    <div className="text-[11px] font-bold uppercase text-slate-400">{row.staffNo || '-'}</div>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-600">{row.position || '-'}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-600">{row.department || '-'}</td>
                  <td className="px-5 py-4 text-center"><span className="inline-flex min-w-[28px] justify-center rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-black text-slate-800">{row.feedbackCount}</span></td>
                  <td className="px-5 py-4 text-center font-bold text-orange-600">{row.anonymousCount}</td>
                  <td className="px-5 py-4 text-center font-bold text-emerald-600">{row.nonAnonymousCount}</td>
                  <td className="px-5 py-4 text-center"><span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-black text-blue-700">{scoreText(row.averageScore)}</span></td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-600">{formatDate(row.latestFeedbackDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && totalItems > 0 && (
          <PaginationBar pageIndex={page} pageSize={pageSize} pageCount={Math.max(1, totalPages || Math.ceil(totalItems / pageSize))} totalItems={totalItems} itemLabel="evaluatees" rowsPerPageOptions={[5, 10, 20, 50]} onPageIndexChange={setPage} onPageSizeChange={(nextSize) => { setPageSize(nextSize); setPage(0); }} className="mt-0 rounded-none border-x-0 border-b-0 border-t border-slate-200/70 shadow-none" />
        )}
      </div>
    </div>
  );
}

export function AuditFeedbackEvaluateeHistoryPage() {
  const { employeeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [evaluatee, setEvaluatee] = useState<AuditSummaryRow | null>(null);
  const [rows, setRows] = useState<AuditHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const drilldownFilters = {
          department: searchParams.get('department') || '',
          reviewCycleId: searchParams.get('reviewCycleId') || '',
          feedbackType: searchParams.get('feedbackType') || '',
          fromDate: searchParams.get('fromDate') || '',
          toDate: searchParams.get('toDate') || '',
        };
        const resp = await axios.get(`/feedback/audit/evaluatees/${employeeId}/history?${buildParams(page, pageSize, drilldownFilters).toString()}`);
        const data = resp.data.data || {};
        setEvaluatee(data.evaluatee || null);
        setRows(data.history?.content || []);
        setTotalPages(data.history?.totalPages || 0);
        setTotalItems(data.history?.totalElements || 0);
      } catch {
        toast.error('Failed to load evaluatee feedback history');
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [employeeId, page, pageSize, searchParams]);

  const viewDetails = (item: AuditHistoryItem) => {
    const suffix = searchParams.toString();
    const query = suffix ? `?${suffix}` : '';
    navigate(`/audit/360-feedback/history/${employeeId}/${item.id}${query}`, {
      state: {
        feedback: item,
        sourcePath: `/audit/360-feedback/history/${employeeId}${query}`,
        listState: { page, pageSize },
      },
    });
  };

  const generatePDF = async (item: AuditHistoryItem) => {
    try {
      const resp = await axios.get(`/feedback/${item.id}/details`);
      const pdfDetails: FeedbackDetail[] = resp.data.data || [];
      const doc = new jsPDF();
      const margin = 14;
      const logoDataUrl = await loadPdfLogo();
      addPdfProfessionalHeader(doc, '360 Feedback Assessment Report', `Generated: ${new Date().toLocaleString('en-GB')}`, { margin, logoDataUrl });
      let currentY = 42;
      currentY = addPdfSectionHeader(doc, margin, currentY, 'Evaluator Information', { width: 182 });
      currentY = addPdfInfoTable(doc, currentY + 2, [
        ['Employee Name', item.evaluatorName || '-', 'Staff ID', item.evaluatorStaffNo || '-'],
        ['Position', item.evaluatorPosition || '-', 'Department', item.evaluatorDepartment || '-'],
        ['Anonymous Flag', item.anonymous ? 'Anonymous' : 'Not Anonymous', 'Feedback Type', item.role || '-'],
      ], { marginLeft: margin, marginRight: margin }) + 8;
      currentY = addPdfSectionHeader(doc, margin, currentY, 'Evaluatee Information', { width: 182 });
      currentY = addPdfInfoTable(doc, currentY + 2, [
        ['Employee Name', item.evaluateeName || evaluatee?.employeeName || '-', 'Staff ID', item.evaluateeStaffNo || evaluatee?.staffNo || '-'],
        ['Position', item.evaluateePosition || evaluatee?.position || '-', 'Department', item.evaluateeDepartment || evaluatee?.department || '-'],
        ['Assessment Date', formatDate(item.date), 'Cycle', item.reviewCycleName || '-'],
      ], { marginLeft: margin, marginRight: margin }) + 10;
      currentY = addPdfSectionHeader(doc, margin, currentY, 'Evaluation Result', { width: 182 });
      autoTable(doc, {
        startY: currentY + 4,
        head: [['#', 'Criteria', 'Rating', 'Comments']],
        body: pdfDetails.map((detail, index) => [index + 1, detail.criteriaName, detail.rating, detail.comment || '-']),
        theme: 'grid',
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' } },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
      if (item.additionalComments?.trim()) {
        currentY = addPdfSectionHeader(doc, margin, currentY, 'Additional Comments', { width: 182 });
        doc.setFontSize(9);
        doc.text(doc.splitTextToSize(item.additionalComments.trim(), 170), margin, currentY + 8);
        currentY += 24;
      }
      addFeedbackScorePerformanceSection(doc, currentY, { scorePercentage: item.score || 0, remark: item.remark || undefined, marginLeft: margin, marginRight: margin });
      const pageCount = doc.getNumberOfPages();
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        doc.setPage(pageNumber);
        addPdfProfessionalFooter(doc, pageNumber, pageCount, { margin });
      }
      doc.save(`360_Feedback_${item.id}.pdf`);
    } catch {
      toast.error('Failed to generate PDF report');
    }
  };

  const statsCards = evaluatee ? [
    { label: 'Total Feedback', value: evaluatee.feedbackCount, icon: 'message-square', color: 'blue' },
    { label: 'Anonymous', value: evaluatee.anonymousCount, icon: 'user-x', color: 'orange' },
    { label: 'Not Anonymous', value: evaluatee.nonAnonymousCount, icon: 'user-check', color: 'emerald' },
    { label: 'Average Score', value: scoreText(evaluatee.averageScore), icon: 'trending-up', color: 'violet' },
  ] : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate('/audit/360-feedback/history')} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/70 backdrop-blur-sm transition hover:bg-white/20 hover:text-white">
              <ArrowLeft size={18} />
            </button>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">{evaluatee?.employeeName || 'Evaluatee History'}</h2>
                  <p className="text-sm font-medium text-slate-300">
                    {evaluatee?.staffNo || ''}{evaluatee?.staffNo && evaluatee?.position ? ' · ' : ''}{evaluatee?.position || ''}{evaluatee?.position && evaluatee?.department ? ' · ' : ''}{evaluatee?.department || ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {evaluatee && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statsCards.map(card => (
            <div key={card.label} className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-10 ${card.color === 'blue' ? 'bg-blue-600' : card.color === 'orange' ? 'bg-orange-500' : card.color === 'emerald' ? 'bg-emerald-500' : 'bg-violet-500'}`} />
              <div className="relative">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
                <p className={`mt-2 text-3xl font-black ${card.color === 'blue' ? 'text-blue-600' : card.color === 'orange' ? 'text-orange-600' : card.color === 'emerald' ? 'text-emerald-600' : 'text-violet-600'}`}>{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Evaluation Records</h3>
              <p className="text-xs text-slate-500">{totalItems} record{totalItems !== 1 ? 's' : ''} found</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-4 py-4">Evaluator</th>
                <th className="px-4 py-4">Department</th>
                <th className="px-4 py-4">Position</th>
                <th className="px-4 py-4 text-center">Anonymous</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4 text-center">Score</th>
                <th className="px-4 py-4 text-center">Remark</th>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-20 text-center"><div className="flex flex-col items-center gap-4"><div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading evaluators...</p></div></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-20 text-center"><div className="flex flex-col items-center gap-3"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"><FileText size={28} /></div><p className="text-base font-black uppercase text-slate-300">No evaluator rows found</p></div></td></tr>
              ) : rows.map(item => (
                <tr key={item.id} className="transition hover:bg-slate-50/60">
                  <td className="px-4 py-4">
                    <div className="font-black text-slate-800">{item.evaluatorName || '-'}</div>
                    <div className="text-[11px] font-bold uppercase text-slate-400">{item.evaluatorStaffNo || '-'}</div>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-600">{item.evaluatorDepartment || '-'}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-600">{item.evaluatorPosition || '-'}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${item.anonymous ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${item.anonymous ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                      {item.anonymous ? 'Anonymous' : 'Identified'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">{item.role || '-'}</span>
                  </td>
                  <td className="px-4 py-4 text-center font-black text-blue-600">{scoreText(item.score)}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase ring-1 ${getRemarkColor(item.remark)}`}>{item.remark || '-'}</span>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-600">{formatDate(item.date)}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => viewDetails(item)} title="View details" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600">
                        <Eye size={16} />
                      </button>
                      <button type="button" onClick={() => generatePDF(item)} title="Download PDF" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-violet-50 hover:text-violet-600">
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && totalItems > 0 && <PaginationBar pageIndex={page} pageSize={pageSize} pageCount={Math.max(1, totalPages || Math.ceil(totalItems / pageSize))} totalItems={totalItems} itemLabel="evaluations" rowsPerPageOptions={[5, 10, 20, 50]} onPageIndexChange={setPage} onPageSizeChange={(nextSize) => { setPageSize(nextSize); setPage(0); }} className="mt-0 rounded-none border-x-0 border-b-0 border-t border-slate-200/70 shadow-none" />}
      </div>
    </div>
  );
}
