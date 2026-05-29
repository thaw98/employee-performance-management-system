import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from '../app/axiosInstance';
import { addFeedbackScorePerformanceSection } from '../utils/feedbackScorePdf';
import { addPdfProfessionalFooter, addPdfInfoTable, addPdfProfessionalHeader, addPdfSectionHeader } from '../utils/pdfBranding';
import { isReceivedAnonymous, feedbackRoleDisplay } from '../utils/feedbackAnonymity';

interface FeedbackDetail {
  criteriaName: string;
  rating: number;
  comment: string;
}

interface FeedbackDetailPageData {
  id: number;
  date?: string | null;
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
  reviewCycleName?: string | null;
  reviewCycleStartDate?: string | null;
  additionalComments?: string | null;
  details: FeedbackDetail[];
}

interface FeedbackDetailLocationState {
  feedback?: Partial<FeedbackDetailPageData>;
  sourcePath?: string;
  listState?: unknown;
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

const scoreText = (score?: number | null) => (typeof score === 'number' ? `${score.toFixed(1)}%` : '-');

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

const sourceTitle = (sourcePath?: string, data?: Partial<FeedbackDetailPageData>) =>
  sourcePath?.includes('/received') || data?.direction === 'RECEIVED'
    ? 'Received Feedback Details'
    : 'Feedback Details';

export function FeedbackDetailPage() {
  const { feedbackId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuditView = location.pathname.includes('/audit/');
  const routeState = (location.state || {}) as FeedbackDetailLocationState;
  const [data, setData] = useState<FeedbackDetailPageData | null>(() => {
    if (!routeState.feedback) return null;
    return { ...(routeState.feedback as FeedbackDetailPageData), details: routeState.feedback.details || [] };
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const resp = await axios.get(`/feedback/${feedbackId}/detail-page`);
        setData(resp.data.data);
      } catch (err) {
        toast.error('Failed to load feedback details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [feedbackId]);

  const evaluator = useMemo(() => {
    if (!data) return null;
    if (isAuditView) {
      return {
        name: data.evaluatorName || '-',
        staffNo: data.evaluatorStaffNo || '',
        position: data.evaluatorPosition || '-',
        department: data.evaluatorDepartment || '-',
      };
    }
    if (isReceivedAnonymous(data)) {
      return { name: 'Anonymous', staffNo: '', position: '-', department: '-' };
    }
    return {
      name: data.evaluatorName || '-',
      staffNo: data.evaluatorStaffNo || '',
      position: data.evaluatorPosition || '-',
      department: data.evaluatorDepartment || '-',
    };
  }, [data, isAuditView]);
  const title = isAuditView ? 'Feedback Details' : sourceTitle(routeState.sourcePath, data || undefined);

  const handleBack = () => {
    if (routeState.sourcePath) {
      navigate(routeState.sourcePath, { state: routeState.listState });
      return;
    }
    navigate(-1);
  };

  const generatePDF = () => {
    if (!data) return;
    try {
      const doc = new jsPDF();
      const margin = 14;
      if (isAuditView) {
        const genDateTime = new Date().toLocaleString('en-GB');
        addPdfProfessionalHeader(doc, '360 Feedback Assessment Report', `Generated: ${genDateTime}`, { margin });
        let currentY = 42;
        currentY = addPdfSectionHeader(doc, margin, currentY, 'Evaluator Information', { width: 182 });
        currentY = addPdfInfoTable(doc, currentY + 2, [
          ['Employee Name', data.evaluatorName || '-', 'Staff ID', data.evaluatorStaffNo || '-'],
          ['Position', data.evaluatorPosition || '-', 'Department', data.evaluatorDepartment || '-'],
          ['Anonymous Flag', data.anonymous ? 'Anonymous' : 'Not Anonymous', 'Feedback Type', data.role || '-'],
        ], { marginLeft: margin, marginRight: margin }) + 8;
        currentY = addPdfSectionHeader(doc, margin, currentY, 'Evaluatee Information', { width: 182 });
        currentY = addPdfInfoTable(doc, currentY + 2, [
          ['Employee Name', data.evaluateeName || '-', 'Staff ID', data.evaluateeStaffNo || '-'],
          ['Position', data.evaluateePosition || data.position || '-', 'Department', data.evaluateeDepartment || '-'],
          ['Assessment Date', formatPdfDate(data.date), 'Cycle', data.reviewCycleName || '-'],
        ], { marginLeft: margin, marginRight: margin }) + 10;
        currentY = addPdfSectionHeader(doc, margin, currentY, 'Evaluation Result', { width: 182 });
        autoTable(doc, {
          startY: currentY + 4,
          head: [['#', 'Criteria', 'Rating', 'Comments']],
          body: data.details.map((detail, index) => [index + 1, detail.criteriaName, detail.rating, detail.comment || '-']),
          theme: 'grid',
          margin: { left: margin, right: margin },
          styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
          headStyles: { fillColor: [37, 99, 235], textColor: 255 },
          columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' } },
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
        if (data.additionalComments?.trim()) {
          currentY = addPdfSectionHeader(doc, margin, currentY, 'Additional Comments', { width: 182 });
          doc.setFontSize(9);
          doc.text(doc.splitTextToSize(data.additionalComments.trim(), 170), margin, currentY + 8);
          currentY += 24;
        }
        addFeedbackScorePerformanceSection(doc, currentY, {
          scorePercentage: data.score || 0,
          remark: data.remark || undefined,
          marginLeft: margin,
          marginRight: margin,
        });
        const pageCount = doc.getNumberOfPages();
        for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
          doc.setPage(pageNumber);
          addPdfProfessionalFooter(doc, pageNumber, pageCount, { margin });
        }
        doc.save(`360_Feedback_${data.id}.pdf`);
        toast.success('Report generated successfully');
        return;
      }

      const pdfEvaluator = isReceivedAnonymous(data)
        ? { name: 'Anonymous', staffNo: '', position: '-', department: '-' }
        : { name: data.evaluatorName || '-', staffNo: data.evaluatorStaffNo || '', position: data.evaluatorPosition || '-', department: data.evaluatorDepartment || '-' };
      const genDateTime = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
      const directionLabel = data.direction === 'RECEIVED' ? 'Received Feedback' : 'Given Feedback';
      addPdfProfessionalHeader(doc, '360 Feedback Assessment Report', `${directionLabel}  |  Generated: ${genDateTime}`, { margin });

      let currentY = 42;
      currentY = addPdfSectionHeader(doc, margin, currentY, 'Evaluator Information', { width: 182 });
      currentY = addPdfInfoTable(doc, currentY + 2, [
        ['Employee Name', pdfEvaluator.name, 'Staff ID', pdfEvaluator.staffNo || '-'],
        ['Position', pdfEvaluator.position || '-', 'Department', pdfEvaluator.department || '-'],
        ['Feedback Type', feedbackRoleDisplay(data), '', ''],
      ], { marginLeft: margin, marginRight: margin }) + 8;

      currentY = addPdfSectionHeader(doc, margin, currentY, 'Evaluatee Information', { width: 182 });
      currentY = addPdfInfoTable(doc, currentY + 2, [
        ['Employee Name', data.evaluateeName || '-', 'Staff ID', data.evaluateeStaffNo || '-'],
        ['Position', data.evaluateePosition || data.position || '-', 'Department', data.evaluateeDepartment || '-'],
        ['Assessment Date', formatPdfDate(data.date), 'Cycle', data.reviewCycleName || '-'],
      ], { marginLeft: margin, marginRight: margin }) + 10;

      currentY = addPdfSectionHeader(doc, margin, currentY, 'Evaluation Result', { width: 182 });
      autoTable(doc, {
        startY: currentY + 4,
        head: [['#', 'Criteria', 'Rating', 'Comments']],
        body: data.details.map((detail, index) => [index + 1, detail.criteriaName, detail.rating, detail.comment || '-']),
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

      if (data.additionalComments?.trim()) {
        const commentLines = doc.splitTextToSize(data.additionalComments.trim(), 170);
        const commentBoxHeight = Math.max(20, 8 + commentLines.length * 4.5);
        const pageHeight = doc.internal.pageSize.getHeight();
        if (currentY + 12 + commentBoxHeight > pageHeight - 20) {
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

      addFeedbackScorePerformanceSection(doc, currentY, {
        scorePercentage: data.score || 0,
        remark: data.remark || undefined,
        marginLeft: margin,
        marginRight: margin,
      });

      const pageCount = doc.getNumberOfPages();
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        doc.setPage(pageNumber);
        addPdfProfessionalFooter(doc, pageNumber, pageCount, { margin });
      }
      doc.save(`Feedback_Report_${data.id}.pdf`);
      toast.success('Report generated successfully');
    } catch (err) {
      toast.error('Failed to generate PDF Report');
    }
  };

  if (loading && !data) {
    return (
      <div className="p-20 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest">Fetching details...</p>
      </div>
    );
  }

  if (!data) {
    return <div className="p-10 text-sm font-bold text-slate-500">Feedback details could not be loaded.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 animate-in fade-in duration-500">
      <button onClick={handleBack} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-600 hover:bg-slate-50">
        <ArrowLeft size={16} /> BACK
      </button>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{title}</h1>
            <p className="text-sm font-bold text-slate-400">
              {isAuditView ? (
                <>Evaluator: <span className="text-blue-600">{evaluator?.name}</span></>
              ) : (
                <span className="uppercase tracking-widest">
                  {data.direction === 'RECEIVED' ? 'Received from' : 'Given by'}: <span className="text-blue-600">{evaluator?.name}</span>
                </span>
              )}
            </p>
          </div>
          {isAuditView ? (
            <span className={`rounded-full border px-4 py-2 text-xs font-black uppercase ${data.anonymous ? 'border-orange-100 bg-orange-50 text-orange-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
              {data.anonymous ? 'Anonymous' : 'Not Anonymous'}
            </span>
          ) : (
            <div className={`w-fit px-5 py-2 rounded-2xl border-2 font-black uppercase text-xs tracking-widest ${getRemarkColor(data.remark)}`}>
              {data.remark || '-'} | {scoreText(data.score)}
            </div>
          )}
        </div>

        {!isAuditView && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <h2 className="font-black text-slate-800 mb-2">Evaluator</h2>
              <p className="font-bold text-slate-700">{evaluator?.name || '-'}</p>
              <p className="text-xs font-bold text-slate-500">{evaluator?.position || '-'}</p>
              <p className="text-xs font-bold text-slate-400">{evaluator?.department || ''}</p>
              <p className="text-xs font-bold text-slate-400 mt-1">Type: {feedbackRoleDisplay(data)}</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <h2 className="font-black text-slate-800 mb-2">Evaluatee</h2>
              <p className="font-bold text-slate-700">{data.evaluateeName || '-'}</p>
              <p className="text-xs font-bold text-slate-500">{data.evaluateePosition || data.position || '-'}</p>
              <p className="text-xs font-bold text-slate-400">{data.evaluateeDepartment || ''}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {data.details.map((detail, index) => (
            <div key={`${detail.criteriaName}-${index}`} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-black text-slate-800">{detail.criteriaName}</h3>
                <span className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-lg">{detail.rating}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 italic text-sm text-slate-600 font-medium">
                {detail.comment || 'No comments provided for this criteria.'}
              </div>
            </div>
          ))}
          <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
            <h3 className="font-black text-slate-800">Additional Comments</h3>
            <div className="bg-white p-4 rounded-xl border border-slate-100 italic text-sm text-slate-600 font-medium whitespace-pre-wrap">
              {data.additionalComments?.trim() || 'No additional comments provided.'}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={generatePDF} className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all">
            {isAuditView ? <Download size={16} /> : <Printer size={16} />}
            {isAuditView ? 'PDF REPORT' : 'PRINT REPORT'}
          </button>
        </div>
      </div>
    </div>
  );
}
