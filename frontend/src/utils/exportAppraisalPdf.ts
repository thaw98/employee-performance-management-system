import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { resolveMediaSrc } from './mediaUrl';

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

export interface AppraisalAssignmentForPdf {
  id: number;
  status: string;
  totalScore: number;
  ratingCategory: string;
  managerComments: string;
  managerSignature: string;
  managerSignedAt: string;
  hrComments: string;
  hrSignature: string;
  hrSignedAt: string;
  employee: {
    employeeName: string;
    fullName?: string;
    employeeId: string;
    department?: { name: string; departmentName: string };
    position?: { name: string; positionName: string };
  };
  template: {
    name: string;
    maxRating: number;
    categories: Category[];
  };
  answers: {
    question: { id: number };
    rating: number;
    comments: string;
  }[];
  period?: {
    name: string;
  };
}

const pageMargin = 0.3 * 25.4; // 7.62 mm
const navy: [number, number, number] = [28, 40, 65];
const slate: [number, number, number] = [88, 99, 115];
const borderColor: [number, number, number] = [220, 226, 235];
const sectionFill: [number, number, number] = [237, 242, 247];

const pad2 = (n: number): string => String(n).padStart(2, '0');

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = String(date.getFullYear());
  const h24 = date.getHours();
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = pad2(date.getMinutes());
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  return `${day}/${month}/${year}, ${h12}:${mm} ${ampm}`;
};

const lastTableY = (doc: jsPDF): number => {
  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY;
  return typeof finalY === 'number' ? finalY : pageMargin;
};

const ensureSpace = (doc: jsPDF, y: number, height: number): number => {
  if (y + height <= doc.internal.pageSize.getHeight() - pageMargin) {
    return y;
  }
  doc.addPage();
  return pageMargin;
};

const inferImageFormat = (dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' => {
  const match = /^data:image\/([^;]+);/i.exec(dataUrl);
  const mime = match?.[1]?.toLowerCase();
  if (mime === 'jpg' || mime === 'jpeg') return 'JPEG';
  if (mime === 'webp') return 'WEBP';
  return 'PNG';
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const signatureToDataUrl = async (value: string | null): Promise<string | null> => {
  const signature = value?.trim();
  if (!signature) return null;
  if (signature.startsWith('data:image/')) return signature;
  if (/^[A-Za-z0-9+/=\s]+$/.test(signature) && signature.length > 120) {
    return `data:image/png;base64,${signature.replace(/\s/g, '')}`;
  }

  const src = resolveMediaSrc(signature);
  if (!src) return null;
  try {
    const response = await fetch(src);
    if (!response.ok) return null;
    return blobToDataUrl(await response.blob());
  } catch (e) {
    console.error('Failed to fetch signature image:', e);
    return null;
  }
};

const tableBaseStyles = {
  fontSize: 8,
  cellPadding: 3,
  overflow: 'linebreak' as const,
  lineColor: borderColor,
  lineWidth: 0.1,
};

const headStyles = {
  fillColor: navy,
  textColor: [255, 255, 255] as [number, number, number],
  fontStyle: 'bold' as const,
};

const addSectionTitle = (doc: jsPDF, title: string, y: number): number => {
  const nextY = ensureSpace(doc, y, 12);
  doc.setTextColor(...navy);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageMargin, nextY);
  doc.setTextColor(0, 0, 0);
  return nextY + 5;
};

const addPageFooters = (doc: jsPDF): void => {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    doc.setPage(pageNumber);
    doc.setDrawColor(...borderColor);
    doc.line(pageMargin, pageHeight - 10, pageWidth - pageMargin, pageHeight - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...slate);
    doc.text('Performance Appraisal Report', pageMargin, pageHeight - 5);
    doc.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - pageMargin, pageHeight - 5, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }
};

export async function exportAppraisalPdf(assignment: AppraisalAssignmentForPdf): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - pageMargin * 2;

  // Header Banner
  doc.setFillColor(...navy);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Performance Appraisal Report', pageMargin, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Official Evaluation Record', pageMargin, 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`Assignment ID: ${assignment.id}`, pageWidth - pageMargin, 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Exported: ${formatDate(new Date().toISOString())}`, pageWidth - pageMargin, 16, { align: 'right' });

  doc.setTextColor(0, 0, 0);

  // Employee Information
  const empName = assignment.employee?.employeeName || assignment.employee?.fullName || 'Employee';
  const deptName = assignment.employee?.department?.departmentName || assignment.employee?.department?.name || 'N/A';
  const posName = assignment.employee?.position?.positionName || assignment.employee?.position?.name || 'N/A';
  const cycleName = assignment.period?.name || assignment.template?.name || 'N/A';

  let y = 32;
  const infoRows = [
    [
      { content: 'Employee Name', styles: { fontStyle: 'bold' as const, textColor: navy, fillColor: sectionFill } },
      empName,
      { content: 'Employee ID', styles: { fontStyle: 'bold' as const, textColor: navy, fillColor: sectionFill } },
      assignment.employee?.employeeId || 'N/A',
    ],
    [
      { content: 'Department', styles: { fontStyle: 'bold' as const, textColor: navy, fillColor: sectionFill } },
      deptName,
      { content: 'Position', styles: { fontStyle: 'bold' as const, textColor: navy, fillColor: sectionFill } },
      posName,
    ],
    [
      { content: 'Appraisal Cycle', styles: { fontStyle: 'bold' as const, textColor: navy, fillColor: sectionFill } },
      cycleName,
      { content: 'Status', styles: { fontStyle: 'bold' as const, textColor: navy, fillColor: sectionFill } },
      assignment.status.replace('_', ' '),
    ]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: infoRows,
    styles: tableBaseStyles,
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: (contentWidth - 64) / 2 },
      2: { cellWidth: 32 },
      3: { cellWidth: (contentWidth - 64) / 2 },
    },
    margin: { left: pageMargin, right: pageMargin },
  });

  y = lastTableY(doc) + 7;

  // Score Summary Section
  y = addSectionTitle(doc, 'Performance Score Summary', y);
  const scoreRows = [
    [
      { content: 'Total Rating Score', styles: { fontStyle: 'bold' as const, textColor: navy, fillColor: sectionFill } },
      `${assignment.totalScore?.toFixed(1) || '0.0'}%`,
      { content: 'Performance Grade', styles: { fontStyle: 'bold' as const, textColor: navy, fillColor: sectionFill } },
      assignment.ratingCategory || 'N/A',
    ]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: scoreRows,
    styles: tableBaseStyles,
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: (contentWidth - 64) / 2 },
      2: { cellWidth: 32 },
      3: { cellWidth: (contentWidth - 64) / 2 },
    },
    margin: { left: pageMargin, right: pageMargin },
  });

  y = lastTableY(doc) + 8;

  // Evaluation Details
  y = addSectionTitle(doc, 'Evaluation Details', y);
  
  if (assignment.template?.categories) {
    for (const category of assignment.template.categories) {
      y = ensureSpace(doc, y, 15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...navy);
      doc.text(category.name, pageMargin, y);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(...slate);
      if (category.description) {
        doc.text(category.description, pageMargin + 1, y + 4.5);
      }
      doc.setTextColor(0, 0, 0);

      y = y + (category.description ? 7.5 : 3.5);

      const tableRows = (category.questions || []).map((question, index) => {
        const answer = assignment.answers?.find(a => a.question?.id === question.id);
        const ratingVal = answer?.rating != null ? String(answer.rating) : '-';
        const commentsVal = answer?.comments?.trim() || '-';
        return [
          index + 1,
          question.questionText,
          ratingVal,
          commentsVal
        ];
      });

      autoTable(doc, {
        startY: y,
        theme: 'grid',
        head: [['#', 'Evaluation Criteria', 'Score', 'Comments / Remarks']],
        body: tableRows,
        styles: { ...tableBaseStyles, fontSize: 7.5 },
        headStyles,
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: contentWidth * 0.5 },
          2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
          3: { cellWidth: 'auto' }
        },
        margin: { left: pageMargin, right: pageMargin },
      });

      y = lastTableY(doc) + 6;
    }
  }

  // Signatures Section
  const signatureBlockHeight = 42;
  y = ensureSpace(doc, y, signatureBlockHeight);
  
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.text('Final Record Signatures', pageMargin, y);
  doc.setTextColor(0, 0, 0);
  y += 5.5;

  const cardW = (contentWidth - 6) / 2;
  const cardH = 32;
  const cardPad = 3;

  // Manager Signature Card
  const managerX = pageMargin;
  doc.setDrawColor(215, 220, 230);
  doc.roundedRect(managerX, y, cardW, cardH, 1, 1);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Evaluator (Department Head / Manager)', managerX + cardPad, y + 5);
  
  // Manager Comments
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.setTextColor(...slate);
  const managerCommentsTxt = assignment.managerComments?.trim() 
    ? `"${assignment.managerComments.trim()}"` 
    : 'No summary comments provided.';
  doc.text(managerCommentsTxt, managerX + cardPad, y + 9.5, { maxWidth: cardW - cardPad * 2 });
  doc.setTextColor(0, 0, 0);

  // Manager Signature Image
  const managerSigUrl = await signatureToDataUrl(assignment.managerSignature);
  const sigW = 34;
  const sigH = 8.5;
  const sigY = y + cardH - 12;
  
  if (managerSigUrl) {
    try {
      doc.addImage(managerSigUrl, inferImageFormat(managerSigUrl), managerX + cardPad, sigY, sigW, sigH);
    } catch {
      doc.setFontSize(6.5);
      doc.text('Signature unavailable', managerX + cardPad, sigY + 5);
    }
  } else {
    doc.setFontSize(6.5);
    doc.text('Not signed', managerX + cardPad, sigY + 5);
  }

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Signed: ${formatDate(assignment.managerSignedAt)}`, managerX + cardPad, y + cardH - 2.5);

  // HR Signature Card
  const hrX = pageMargin + cardW + 6;
  doc.setDrawColor(215, 220, 230);
  doc.roundedRect(hrX, y, cardW, cardH, 1, 1);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('HR Validator Representative', hrX + cardPad, y + 5);

  // HR Comments
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.setTextColor(...slate);
  const hrCommentsTxt = assignment.hrComments?.trim() 
    ? `"${assignment.hrComments.trim()}"` 
    : 'Form validated and approved by HR.';
  doc.text(hrCommentsTxt, hrX + cardPad, y + 9.5, { maxWidth: cardW - cardPad * 2 });
  doc.setTextColor(0, 0, 0);

  // HR Signature Image
  const hrSigUrl = await signatureToDataUrl(assignment.hrSignature);
  if (hrSigUrl) {
    try {
      doc.addImage(hrSigUrl, inferImageFormat(hrSigUrl), hrX + cardPad, sigY, sigW, sigH);
    } catch {
      doc.setFontSize(6.5);
      doc.text('Signature unavailable', hrX + cardPad, sigY + 5);
    }
  } else {
    doc.setFontSize(6.5);
    doc.text('Verified by HR', hrX + cardPad, sigY + 5);
  }

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Approved: ${formatDate(assignment.hrSignedAt)}`, hrX + cardPad, y + cardH - 2.5);

  addPageFooters(doc);
  doc.save(`appraisal-report-${assignment.id}.pdf`);
}
