import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  Award,
  FileText,
  MessageSquare,
  AlertTriangle,
  Star,
  CheckCircle2,
  XCircle,
  Rocket,
  User,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import {
  useGetEmployeePerformanceSummaryQuery,
} from '../../features/performanceReport/performanceReportApi';
import { useState } from 'react';
import { resolveProfilePictureSrc } from '../../utils/mediaUrl';
import { PromotionModal } from './PromotionModal';
import * as XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { addPdfFooterBranding, addPdfHeaderBranding, addPdfHeaderLogo, loadPdfLogo } from '../../utils/pdfBranding';

/* ── Helpers ─────────────────────────────────────────── */

const getScoreInfo = (score: number | null) => {
  if (score == null) return { label: 'No Data', color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', ring: 'ring-slate-200' };
  if (score >= 4.5) return { label: 'Excellent', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', ring: 'ring-emerald-500' };
  if (score >= 3.5) return { label: 'Good', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', ring: 'ring-blue-500' };
  if (score >= 2.5) return { label: 'Meet Requirement', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', ring: 'ring-amber-500' };
  if (score >= 1.5) return { label: 'Needs Improvement', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', ring: 'ring-orange-500' };
  return { label: 'Unsatisfactory', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', ring: 'ring-red-500' };
};

const formatScore = (score: number | null) =>
  score != null ? score.toFixed(1) : '—';

const getProgressWidth = (score: number | null) =>
  score != null ? `${(score / 5) * 100}%` : '0%';

const getProgressColor = (score: number | null) => {
  if (score == null) return 'bg-slate-300 dark:bg-slate-600';
  if (score >= 4.5) return 'bg-emerald-500';
  if (score >= 3.5) return 'bg-blue-500';
  if (score >= 2.5) return 'bg-amber-500';
  if (score >= 1.5) return 'bg-orange-500';
  return 'bg-red-500';
};

/** Convert dd/MM/yyyy or yyyy-MM-dd string to a human-friendly relative duration like "2 years 3 months" */
const formatDuration = (dateStr: string | null | undefined): string | null => {
  if (!dateStr) return null;
  let day = 1;
  let month = 1;
  let year = 2024;
  
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      year = Number(parts[0]);
      month = Number(parts[1]);
      day = Number(parts[2]);
    } else {
      return dateStr;
    }
  } else if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      day = Number(parts[0]);
      month = Number(parts[1]);
      year = Number(parts[2]);
    } else {
      return dateStr;
    }
  } else {
    return dateStr;
  }

  const joined = new Date(year, month - 1, day);
  const now = new Date();
  if (isNaN(joined.getTime())) return dateStr;

  let years = now.getFullYear() - joined.getFullYear();
  let months = now.getMonth() - joined.getMonth();
  let days = now.getDate() - joined.getDate();

  if (days < 0) {
    months--;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const segments: string[] = [];
  if (years > 0) segments.push(`${years} year${years > 1 ? 's' : ''}`);
  if (months > 0) segments.push(`${months} month${months > 1 ? 's' : ''}`);
  if (segments.length === 0 && days >= 7) {
    const weeks = Math.floor(days / 7);
    segments.push(`${weeks} week${weeks > 1 ? 's' : ''}`);
  }
  if (segments.length === 0) segments.push(`${Math.max(days, 1)} day${days > 1 ? 's' : ''}`);
  return segments.join(' ');
};

/* ── Score Card Component ─────────────────────────────── */

const ScoreCard: React.FC<{
  title: string;
  score: number | null;
  period?: string | null;
  icon: React.ReactNode;
  extra?: string | null;
}> = ({ title, score, period, icon, extra }) => {
  const info = getScoreInfo(score);
  return (
    <div className={`rounded-xl border ${info.border} ${info.bg} p-5 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`${info.color}`}>{icon}</div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">{title}</h3>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${info.bg} ${info.color}`}>
          {info.label}
        </span>
      </div>

      <div className="flex items-end gap-1 mb-3">
        <span className={`text-3xl font-black ${info.color}`}>{formatScore(score)}</span>
        <span className="text-sm text-slate-400 dark:text-slate-500 mb-1">/ 5.0</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(score)}`}
          style={{ width: getProgressWidth(score) }}
        />
      </div>

      {period && (
        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
          Period: {period}
        </p>
      )}
      {extra && (
        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
          {extra}
        </p>
      )}
    </div>
  );
};

/* ── Main Component ───────────────────────────────────── */

type PerformanceReportDetailPageProps = {
  basePath?: string;
  readOnly?: boolean;
};

export const PerformanceReportDetailPage: React.FC<PerformanceReportDetailPageProps> = ({
  basePath = '/hr/performance-reports',
  readOnly = false,
}) => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const empId = Number(employeeId);
  const { data: report, isLoading, error } = useGetEmployeePerformanceSummaryQuery(empId, {
    skip: !empId,
  });

  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(basePath)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft size={18} />
          Back to Performance Reports
        </button>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-red-700 dark:text-red-400">
          Failed to load employee performance data.
        </div>
      </div>
    );
  }

  const overallInfo = getScoreInfo(report.overallRating);

  const handleExportExcel = () => {
    if (!report) return;
    try {
      const data: any[] = [];
      data.push(['EMPLOYEE PERFORMANCE REPORT', '']);
      data.push(['', '']);
      data.push(['Employee Information', '']);
      data.push(['Name', report.employeeName]);
      data.push(['Staff No', report.staffNo || '—']);
      data.push(['Position', report.positionName || 'No Position']);
      data.push(['Department', report.departmentName || 'No Department']);
      data.push(['Joined Date', report.joinedDate ? formatDuration(report.joinedDate) : '—']);
      data.push(['', '']);
      data.push(['Performance Summary', '']);
      data.push(['Overall Rating', `${formatScore(report.overallRating)} / 5.0`]);
      data.push(['Performance Level', report.performanceLevel || '—']);
      data.push(['KPI Score', `${formatScore(report.kpiScore)} (${report.kpiPeriod || 'N/A'})`]);
      data.push(['Appraisal Score', `${formatScore(report.appraisalScore)} (${report.appraisalPeriod || 'N/A'})`]);
      data.push(['Self Assessment', `${formatScore(report.selfAssessmentScore)} (${report.selfAssessmentCycle || 'N/A'})`]);
      data.push(['Feedback Score', `${formatScore(report.feedbackScore)} (${report.feedbackCount} feedbacks)`]);
      data.push(['', '']);
      data.push(['Status & Eligibility', '']);
      data.push(['PIP Status', report.hasActivePip ? `Active (${report.pipStatus || ''})` : 'No Active PIP']);
      data.push(['Promotion Eligibility', report.promotionEligible ? 'Eligible' : 'Not Eligible']);
      
      const ws = XLSX.utils.aoa_to_sheet(data);
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
        { s: { r: 9, c: 0 }, e: { r: 9, c: 1 } },
        { s: { r: 17, c: 0 }, e: { r: 17, c: 1 } }
      ];
      ws['!cols'] = [{ wch: 25 }, { wch: 45 }];

      for (let r = 0; r < data.length; r++) {
        for (let c = 0; c < 2; c++) {
          const cellRef = `${['A', 'B'][c]}${r + 1}`;
          if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
          
          if (r === 0) {
            ws[cellRef].s = {
              font: { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
              fill: { fgColor: { rgb: '2463EB' } },
              alignment: { horizontal: 'center', vertical: 'center' }
            };
          } else if (r === 2 || r === 9 || r === 17) {
             ws[cellRef].s = {
               font: { name: 'Segoe UI', sz: 12, bold: true, color: { rgb: '1E40AF' } },
               fill: { fgColor: { rgb: 'DBEAFE' } },
               alignment: { horizontal: 'left', vertical: 'center' }
             };
          } else if (data[r][0] !== '') {
             ws[cellRef].s = {
               font: { name: 'Segoe UI', sz: 11, bold: c === 0 },
               alignment: { vertical: 'top', wrapText: true },
               border: {
                 bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
               }
             };
          }
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Performance Report");
      XLSX.writeFile(wb, `Performance_Report_${report.employeeName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportPdf = async () => {
    if (!report) return;
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      
      const logoDataUrl = await loadPdfLogo();
      if (logoDataUrl) {
        addPdfHeaderLogo(doc, logoDataUrl, { x: 14, y: 5, width: 24, height: 12 });
      }

      doc.setFontSize(16);
      doc.text('Employee Performance Report', 14, 18);
      doc.setFontSize(10);
      doc.text(`Export Date: ${format(new Date(), 'dd MMM yyyy')}`, 140, 18);
      addPdfHeaderBranding(doc, { margin: 14, y: 14 });

      autoTable(doc, {
        startY: 30,
        head: [['Employee Information', '']],
        body: [
          ['Name', report.employeeName],
          ['Staff No', report.staffNo || '—'],
          ['Position', report.positionName || 'No Position'],
          ['Department', report.departmentName || 'No Department'],
          ['Joined Date', report.joinedDate ? formatDuration(report.joinedDate) || '—' : '—'],
        ],
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [36, 99, 235], textColor: 255 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 'auto' } }
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Performance Summary', '']],
        body: [
          ['Overall Rating', `${formatScore(report.overallRating)} / 5.0`],
          ['Performance Level', report.performanceLevel || '—'],
          ['KPI Score', `${formatScore(report.kpiScore)} (${report.kpiPeriod || 'N/A'})`],
          ['Appraisal Score', `${formatScore(report.appraisalScore)} (${report.appraisalPeriod || 'N/A'})`],
          ['Self Assessment', `${formatScore(report.selfAssessmentScore)} (${report.selfAssessmentCycle || 'N/A'})`],
          ['Feedback Score', `${formatScore(report.feedbackScore)} (${report.feedbackCount} feedbacks)`],
        ],
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [36, 99, 235], textColor: 255 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 'auto' } }
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Status & Eligibility', '']],
        body: [
          ['PIP Status', report.hasActivePip ? `Active (${report.pipStatus || ''})` : 'No Active PIP'],
          ['Promotion Eligibility', report.promotionEligible ? 'Eligible' : 'Not Eligible'],
        ],
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [36, 99, 235], textColor: 255 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 'auto' } }
      });
      
      addPdfFooterBranding(doc, { align: 'left', margin: 14, y: doc.internal.pageSize.getHeight() - 8 });
      doc.save(`Performance_Report_${report.employeeName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back & Export */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(basePath)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Performance Reports
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPdf}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download size={14} /> Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 text-xs font-bold text-white shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.02] hover:shadow-md hover:shadow-blue-500/30 active:scale-[0.98]"
          >
            <FileSpreadsheet size={14} /> Export Excel
          </button>
        </div>
      </div>

      {/* Employee Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-500 dark:text-slate-400 overflow-hidden shrink-0">
            {report.profilePictureUrl ? (
              <img
                src={resolveProfilePictureSrc(report.profilePictureUrl)}
                className="w-full h-full object-cover"
                alt=""
              />
            ) : (
              <User size={28} />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{report.employeeName}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {report.positionName || 'No Position'} · {report.departmentName || 'No Department'}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400 dark:text-slate-500 mt-1">
              <span>Staff No: {report.staffNo || '—'}</span>
              {report.joinedDate && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span>Joined: {formatDuration(report.joinedDate)}</span>
                </>
              )}
            </div>
          </div>

          {/* Overall Rating Badge */}
          <div className={`text-center px-6 py-3 rounded-xl border ${overallInfo.border} ${overallInfo.bg}`}>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Overall Rating</p>
            <div className="flex items-center justify-center gap-1">
              <Star size={20} className={overallInfo.color} />
              <span className={`text-2xl font-black ${overallInfo.color}`}>{formatScore(report.overallRating)}</span>
              <span className="text-sm text-slate-400 dark:text-slate-500">/5</span>
            </div>
            <p className={`text-xs font-bold mt-1 ${overallInfo.color}`}>{report.performanceLevel}</p>
          </div>
        </div>
      </div>

      {/* Score Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ScoreCard
          title="KPI Score"
          score={report.kpiScore}
          period={report.kpiPeriod}
          icon={<TrendingUp size={18} />}
        />
        <ScoreCard
          title="Appraisal Score"
          score={report.appraisalScore}
          period={report.appraisalPeriod}
          icon={<Award size={18} />}
          extra={report.appraisalRatingCategory ? `Category: ${report.appraisalRatingCategory}` : undefined}
        />
        <ScoreCard
          title="Self Assessment Score"
          score={report.selfAssessmentScore}
          period={report.selfAssessmentCycle}
          icon={<FileText size={18} />}
        />
        <ScoreCard
          title="Feedback Score"
          score={report.feedbackScore}
          period={null}
          icon={<MessageSquare size={18} />}
          extra={`Total feedbacks received: ${report.feedbackCount}`}
        />

        {/* PIP Status Card */}
        <div
          className={`rounded-xl border p-5 transition-all hover:shadow-md ${
            report.hasActivePip
              ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
              : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle
                size={18}
                className={report.hasActivePip ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}
              />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">PIP Status</h3>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            {report.hasActivePip ? (
              <>
                <XCircle size={24} className="text-red-600 dark:text-red-400" />
                <span className="text-lg font-bold text-red-600 dark:text-red-400">Active PIP</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">No Active PIP</span>
              </>
            )}
          </div>
          {report.pipStatus && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest PIP Status: <span className="font-semibold">{report.pipStatus}</span>
            </p>
          )}
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            {report.hasActivePip
              ? 'Employee has an active Performance Improvement Plan — not eligible for promotion'
              : 'No active PIP — clear for promotion consideration'}
          </p>
        </div>
      </div>

      {/* Promotion Eligibility Section */}
      <div
        className={`rounded-xl border p-6 ${
          report.promotionEligible
            ? 'border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Promotion Eligibility</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Overall Rating: <strong className={overallInfo.color}>{formatScore(report.overallRating)} / 5.0</strong>
              </span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                PIP: <strong className={report.hasActivePip ? 'text-red-600' : 'text-emerald-600'}>{report.hasActivePip ? 'Active' : 'None'}</strong>
              </span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  report.promotionEligibility?.trim().toLowerCase() === 'strongly recommended'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : report.promotionEligibility?.trim().toLowerCase() === 'eligible'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : report.promotionEligibility?.trim().toLowerCase() === 'possible'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                    : report.promotionEligibility?.trim().toLowerCase() === 'not eligible'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {report.promotionEligibility}
              </span>
            </div>
          </div>

          {/* Promote Button — only visible if eligible */}
          {report.promotionEligible && !readOnly && (
            <button
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all active:scale-[0.98]"
              onClick={() => setIsPromotionModalOpen(true)}
            >
              <Rocket size={18} />
              Promote Employee
            </button>
          )}
        </div>

        {!report.promotionEligible && (
          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {report.hasActivePip
                ? '⚠️ Employee has an active PIP and is not eligible for promotion at this time.'
                : (report.kpiScore == null || report.selfAssessmentScore == null || report.appraisalScore == null || report.feedbackScore == null)
                ? '⚠️ All four evaluation components (KPI, Self Assessment, Appraisal, and Feedback) must be completed for promotion eligibility.'
                : report.overallRating == null
                ? 'ℹ️ Insufficient performance data to determine eligibility.'
                : report.overallRating < 3.5
                ? `⚠️ Overall rating (${formatScore(report.overallRating)}) is below the minimum threshold of 3.5 required for promotion.`
                : 'ℹ️ Not eligible for promotion.'}
            </p>
          </div>
        )}
      </div>

      {/* Rating Scale Reference */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Rating Scale Reference</h3>
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {[
            { rating: 5, level: 'Excellent', eligibility: 'Strongly Recommended', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
            { rating: 4, level: 'Good', eligibility: 'Eligible', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
            { rating: 3, level: 'Meet Requirement', eligibility: 'Possible', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
            { rating: 2, level: 'Needs Improvement', eligibility: 'Not Eligible', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
            { rating: 1, level: 'Unsatisfactory', eligibility: 'Not Eligible', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
          ].map((item) => (
            <div key={item.rating} className={`rounded-lg p-3 ${item.color}`}>
              <p className="text-lg font-black">{item.rating}</p>
              <p className="font-bold">{item.level}</p>
              <p className="text-[10px] mt-1 opacity-75">{item.eligibility}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Promotion Modal */}
      {!readOnly && (
        <PromotionModal
          isOpen={isPromotionModalOpen}
          onClose={() => setIsPromotionModalOpen(false)}
          employeeId={report.employeeId}
          employeeName={report.employeeName}
          currentPosition={report.positionName}
          departmentName={report.departmentName}
        />
      )}
    </div>
  );
};

export default PerformanceReportDetailPage;
