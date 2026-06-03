import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, Building2, Briefcase, Calendar, Tag, User, Shield, MessageSquare, Star } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from '../app/axiosInstance';
import { addFeedbackScorePerformanceSection } from '../utils/feedbackScorePdf';
import { addPdfProfessionalFooter, addPdfInfoTable, addPdfProfessionalHeader, addPdfSectionHeader, loadPdfLogo } from '../utils/pdfBranding';
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
    case 'Outstanding': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
    case 'Good': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
    case 'Meet Requirement': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
    case 'Need Improvement': return 'bg-orange-50 text-orange-700 ring-1 ring-orange-200';
    case 'Unsatisfactory': return 'bg-red-50 text-red-700 ring-1 ring-red-200';
    default: return 'bg-slate-50 text-slate-600 ring-1 ring-slate-200';
  }
};

const getScoreColor = (score?: number | null) => {
  if (!score) return 'text-slate-400';
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
};

const getScoreRingColor = (score?: number | null) => {
  if (!score) return '#94a3b8';
  if (score >= 80) return '#059669';
  if (score >= 60) return '#2563eb';
  if (score >= 40) return '#d97706';
  return '#dc2626';
};

const getInitials = (name?: string | null) => {
  if (!name || name === '-') return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const sourceTitle = (sourcePath?: string, data?: Partial<FeedbackDetailPageData>) =>
  sourcePath?.includes('/received') || data?.direction === 'RECEIVED'
    ? 'Received Feedback Details'
    : 'Feedback Details';

function ScoreGauge({ score, size = 80 }: { score?: number | null; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score || 0));
  const offset = circumference - (progress / 100) * circumference;
  const color = getScoreRingColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className={`absolute text-lg font-black ${getScoreColor(score)}`}>
        {scoreText(score).replace('%', '')}
        <span className="text-[9px] font-bold">%</span>
      </span>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-b-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-sm font-bold text-slate-800 truncate">{value || '-'}</p>
      </div>
    </div>
  );
}

function EmployeeAvatarBadge({ name, staffNo, position, department, label }: {
  name?: string | null;
  staffNo?: string | null;
  position?: string | null;
  department?: string | null;
  label: string;
}) {
  return (
    <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg font-black shadow-sm shadow-blue-200">
        {getInitials(name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">{label}</p>
        <p className="text-base font-black text-slate-800 truncate">{name || '-'}</p>
        {staffNo && <p className="text-[11px] font-bold uppercase text-slate-400">{staffNo}</p>}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
          {position && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Briefcase size={12} className="text-slate-400" />
              {position}
            </div>
          )}
          {department && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Building2 size={12} className="text-slate-400" />
              {department}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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

  const generatePDF = async () => {
    if (!data) return;
    try {
      const doc = new jsPDF();
      const margin = 14;
      const logoDataUrl = await loadPdfLogo();
      if (isAuditView) {
        const genDateTime = new Date().toLocaleString('en-GB');
        addPdfProfessionalHeader(doc, '360 Feedback Assessment Report', `Generated: ${genDateTime}`, { margin, logoDataUrl });
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

      const isSelf = data.role === 'SELF';
      const pdfEvaluator = isReceivedAnonymous(data)
        ? { name: 'Anonymous', staffNo: '', position: '-', department: '-' }
        : { name: data.evaluatorName || '-', staffNo: data.evaluatorStaffNo || '', position: data.evaluatorPosition || '-', department: data.evaluatorDepartment || '-' };
      const genDateTime = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
      const directionLabel = isSelf ? 'Self Feedback' : (data.direction === 'RECEIVED' ? 'Received Feedback' : 'Given Feedback');
      addPdfProfessionalHeader(doc, '360 Feedback Assessment Report', `${directionLabel}  |  Generated: ${genDateTime}`, { margin, logoDataUrl });

      let currentY = 42;
      if (isSelf) {
        currentY = addPdfSectionHeader(doc, margin, currentY, 'Employee Information', { width: 182 });
        currentY = addPdfInfoTable(doc, currentY + 2, [
          ['Employee Name', data.evaluateeName || '-', 'Staff ID', data.evaluateeStaffNo || '-'],
          ['Position', data.evaluateePosition || data.position || '-', 'Department', data.evaluateeDepartment || '-'],
          ['Assessment Date', formatPdfDate(data.date), 'Cycle', data.reviewCycleName || '-'],
        ], { marginLeft: margin, marginRight: margin }) + 10;
      } else {
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
      }

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading feedback details...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 mx-auto mb-4">
            <MessageSquare size={28} />
          </div>
          <p className="text-base font-black text-slate-400">Feedback details could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 px-6 py-5 text-slate-900 shadow-xl shadow-blue-100/50">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button type="button" onClick={handleBack} className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 shadow-sm transition hover:bg-blue-50 hover:text-blue-700">
              <ArrowLeft size={18} />
            </button>
            <div className="h-10 w-px bg-blue-100" />
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                <Star size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">{title}</h1>
                <p className="text-sm font-medium text-slate-500">
                  360 Feedback Assessment
                  {data.reviewCycleName && <span className="hidden sm:inline"> &middot; {data.reviewCycleName}</span>}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black uppercase backdrop-blur-sm ${
              data.anonymous
                ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200'
                : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${data.anonymous ? 'bg-orange-500' : 'bg-emerald-500'}`} />
              {data.anonymous ? 'Anonymous' : 'Not Anonymous'}
            </span>
            <button type="button" onClick={generatePDF} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700">
              <Download size={16} /> PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {data.role === 'SELF' ? (
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
              <EmployeeAvatarBadge
                name={data.evaluateeName}
                staffNo={data.evaluateeStaffNo}
                position={data.evaluateePosition || data.position}
                department={data.evaluateeDepartment}
                label="Employee"
              />
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EmployeeAvatarBadge
              name={evaluator?.name}
              staffNo={evaluator?.staffNo}
              position={evaluator?.position}
              department={evaluator?.department}
              label="Evaluator"
            />
            <EmployeeAvatarBadge
              name={data.evaluateeName}
              staffNo={data.evaluateeStaffNo}
              position={data.evaluateePosition || data.position}
              department={data.evaluateeDepartment}
              label="Evaluatee"
            />
          </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Star size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Evaluation Criteria</h3>
                  <p className="text-xs text-slate-500">{data.details.length} criteria assessed</p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {data.details.map((detail, index) => {
                const ratingPercent = Math.min(100, (detail.rating / 5) * 100);
                return (
                  <div key={`${detail.criteriaName}-${index}`} className="px-6 py-5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-black text-slate-400">
                          {index + 1}
                        </span>
                        <h4 className="font-black text-slate-800 truncate">{detail.criteriaName}</h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              size={14}
                              className={star <= detail.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                            />
                          ))}
                        </div>
                        <span className="ml-1.5 inline-flex items-center justify-center min-w-[32px] h-8 rounded-lg bg-blue-600 text-white text-sm font-black px-2">
                          {detail.rating}
                        </span>
                      </div>
                    </div>
                    <div className="ml-10">
                      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-3 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${ratingPercent}%`,
                            backgroundColor: ratingPercent >= 80 ? '#059669' : ratingPercent >= 60 ? '#2563eb' : ratingPercent >= 40 ? '#d97706' : '#dc2626',
                          }}
                        />
                      </div>
                      <div className="bg-slate-50/80 rounded-xl border border-slate-100 px-4 py-3">
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {detail.comment || <span className="italic text-slate-400">No comments provided for this criteria.</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Additional Comments</h3>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              {data.additionalComments?.trim() ? (
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100 p-5">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {data.additionalComments.trim()}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm font-semibold text-slate-400 italic">No additional comments provided.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="border-b border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 px-6 py-5 text-center">
              <ScoreGauge score={data.score} size={100} />
              <div className="mt-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Performance Score</p>
                <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase ${getRemarkColor(data.remark)}`}>
                  {data.remark || 'Not Rated'}
                </span>
              </div>
            </div>
            <div className="px-5 py-4 space-y-0.5">
              <InfoRow icon={<User size={14} />} label="Feedback Type" value={data.role || '-'} />
              <InfoRow icon={<Calendar size={14} />} label="Assessment Date" value={formatPdfDate(data.date)} />
              <InfoRow icon={<Tag size={14} />} label="Review Cycle" value={data.reviewCycleName || '-'} />
              <InfoRow icon={<Shield size={14} />} label="Anonymity" value={data.anonymous ? 'Anonymous' : 'Not Anonymous'} />
            </div>
          </div>

          <button type="button" onClick={generatePDF} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-black text-white shadow-sm shadow-blue-200 hover:bg-blue-700 transition-all">
            <Download size={18} />
            Download PDF Report
          </button>
        </div>
      </div>
    </div>
  );
}
