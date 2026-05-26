import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type PerformanceReportSummary } from '../features/performanceReport/performanceReportApi';

const pageMargin = 0.3 * 25.4; // 7.62 mm
const navy: [number, number, number] = [28, 40, 65];
const slate: [number, number, number] = [88, 99, 115];
const borderColor: [number, number, number] = [220, 226, 235];
const sectionFill: [number, number, number] = [237, 242, 247];

const formatScore = (score: number | null): string =>
  score != null ? score.toFixed(1) : '—';

const formatDate = (): string => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export function exportPerformanceReportListPdf(data: PerformanceReportSummary[]): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - pageMargin * 2;

  // Header Banner
  doc.setFillColor(...navy);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Performance Report Summary', pageMargin, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Official Employee Performance & Promotion Eligibility Record', pageMargin, 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`Total Records: ${data.length}`, pageWidth - pageMargin, 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Exported: ${formatDate()}`, pageWidth - pageMargin, 16, { align: 'right' });

  doc.setTextColor(0, 0, 0);

  // Table Body Rows
  const tableRows = data.map((emp, index) => [
    index + 1,
    emp.employeeName,
    emp.staffNo || '—',
    emp.departmentName || '—',
    emp.positionName || '—',
    formatScore(emp.kpiScore),
    formatScore(emp.appraisalScore),
    formatScore(emp.selfAssessmentScore),
    formatScore(emp.feedbackScore),
    emp.hasActivePip ? 'Active' : 'None',
    formatScore(emp.overallRating),
    emp.promotionEligibility?.toUpperCase() || '—',
  ]);

  autoTable(doc, {
    startY: 32,
    theme: 'grid',
    head: [[
      '#',
      'Employee Name',
      'Staff No',
      'Department',
      'Position',
      'KPI',
      'Appraisal',
      'Self-Assmt',
      'Feedback',
      'PIP',
      'Overall',
      'Eligibility'
    ]],
    body: tableRows,
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      overflow: 'linebreak',
      lineColor: borderColor,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: navy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 36 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 32 },
      4: { cellWidth: 32 },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 20, halign: 'center' },
      8: { cellWidth: 18, halign: 'center' },
      9: { cellWidth: 16, halign: 'center' },
      10: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      11: { cellWidth: 'auto', fontStyle: 'bold' },
    },
    margin: { left: pageMargin, right: pageMargin, bottom: 15 },
  });

  // Loop through all pages to add dynamic footers (Page X of Y) and Total Employees summary
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Page footer line
    doc.setDrawColor(...borderColor);
    doc.line(pageMargin, pageHeight - 12, pageWidth - pageMargin, pageHeight - 12);
    
    // Page footer text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...slate);
    doc.text(`Employee Performance Management System (EPMS) - Total Employees: ${data.length}`, pageMargin, pageHeight - 7);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - pageMargin, pageHeight - 7, { align: 'right' });
  }

  doc.save(`performance-report-summary-${new Date().toISOString().split('T')[0]}.pdf`);
}
