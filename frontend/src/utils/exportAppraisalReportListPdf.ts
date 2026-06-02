import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addPdfFooterBranding, addPdfHeaderBranding, addPdfHeaderLogo, getPdfHeaderTextX, loadPdfLogo } from './pdfBranding';

const pageMargin = 0.3 * 25.4; // 7.62 mm
const navy: [number, number, number] = [28, 40, 65];
const slate: [number, number, number] = [88, 99, 115];
const borderColor: [number, number, number] = [220, 226, 235];

const formatDate = (): string => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export async function exportAppraisalReportListPdf(data: any[]): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const logoDataUrl = await loadPdfLogo();
  const logoWidth = 24;
  const logoHeight = 12;
  const headerTextX = getPdfHeaderTextX(pageMargin, !!logoDataUrl, { logoWidth });

  // Header Banner
  doc.setFillColor(...navy);
  doc.rect(0, 0, pageWidth, 26, 'F');
  if (logoDataUrl) {
    addPdfHeaderLogo(doc, logoDataUrl, { x: pageMargin, y: 5, width: logoWidth, height: logoHeight });
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Employee Appraisal Report Overview', headerTextX, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Consolidated Performance Appraisal Evaluations Record', headerTextX, 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`Total Records: ${data.length}`, pageWidth - pageMargin, 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Exported: ${formatDate()}`, pageWidth - pageMargin, 16, { align: 'right' });
  addPdfHeaderBranding(doc, { margin: pageMargin, y: 22, textColor: [255, 255, 255] });

  doc.setTextColor(0, 0, 0);

  // Table Body Rows
  const tableRows = data.map((a, index) => [
    index + 1,
    a.employee.employeeName,
    a.evaluator?.employeeName || '—',
    a.employee.employeeId || 'N/A',
    a.employee.department?.name || 'N/A',
    a.employee.position?.name || 'N/A',
    a.period?.name || 'N/A',
    a.totalScore != null ? `${a.totalScore.toFixed(1)}%` : '-',
    a.ratingCategory || 'N/A',
    a.status === 'LOCKED' ? 'FINALIZED' : a.status.replace(/_/g, ' '),
  ]);

  autoTable(doc, {
    startY: 32,
    theme: 'grid',
    head: [[
      '#',
      'Employee Name',
      'Manager',
      'Staff No',
      'Department',
      'Position',
      'Cycle / Period',
      'Score %',
      'Grade / Category',
      'Status'
    ]],
    body: tableRows,
    styles: {
      fontSize: 7,
      cellPadding: 2.2,
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
      1: { cellWidth: 32 },
      2: { cellWidth: 32 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 30 },
      5: { cellWidth: 30 },
      6: { cellWidth: 25, halign: 'center' },
      7: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      8: { cellWidth: 25, halign: 'center' },
      9: { cellWidth: 'auto', halign: 'center' },
    },
    margin: { left: pageMargin, right: pageMargin, bottom: 15 },
  });

  const finalY =
    (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...navy);
  doc.text(`Total Employees: ${data.length}`, pageWidth - pageMargin, finalY + 8, { align: 'right' });

  // Loop through all pages
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
    doc.text(`Employee Performance Management System (EPMS) - Total Appraisals: ${data.length}`, pageMargin, pageHeight - 7);
    addPdfFooterBranding(doc, { margin: pageMargin, y: pageHeight - 7, textColor: slate });
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - pageMargin, pageHeight - 7, { align: 'right' });
  }

  doc.save(`appraisal-report-overview-${new Date().toISOString().split('T')[0]}.pdf`);
}
