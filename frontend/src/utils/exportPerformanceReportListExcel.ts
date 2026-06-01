import { format } from 'date-fns';
import * as XLSX from 'xlsx-js-style';
import { type PerformanceReportSummary } from '../features/performanceReport/performanceReportApi';

type SheetRow = (string | number)[];

const NUM_COLS = 12;
const COL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const;

const BRAND_BLUE = '1C2841';
const ACCENT_BLUE = '2463EB';
const HEADER_BG = 'E2E8F0';
const META_BG = 'EDF2F7';
const BORDER_LIGHT = 'F1F5F9';
const TEXT_BODY = '334155';

const formatScore = (score: number | null): string =>
  score != null ? score.toFixed(1) : '—';

const eligibilityColor = (value: string | null | undefined): string => {
  const norm = value?.trim().toLowerCase() ?? '';
  if (norm === 'strongly recommended') return '059669';
  if (norm === 'eligible') return '2563EB';
  if (norm === 'possible') return 'D97706';
  if (norm === 'not eligible') return 'DC2626';
  return '64748B';
};

const overallScoreColor = (score: number | null): string => {
  if (score == null) return '94A3B8';
  if (score >= 4.5) return '059669';
  if (score >= 3.5) return '2563EB';
  if (score >= 2.5) return 'D97706';
  if (score >= 1.5) return 'EA580C';
  return 'DC2626';
};

export type PerformanceReportListExcelOptions = {
  searchTerm?: string;
  filterDepartment?: string;
  filterEligibility?: string;
  totalInSystem?: number;
  avgRating?: number;
  eligibleCount?: number;
  activePipCount?: number;
};

type SheetLayout = {
  rows: SheetRow[];
  titleRow: number;
  metaRow: number;
  filterRow: number | null;
  headerRow: number;
  dataStartRow: number;
  dataEndRow: number;
  footerRow: number;
};

const buildFilterSummary = (options: PerformanceReportListExcelOptions): string | null => {
  const parts: string[] = [];
  if (options.searchTerm?.trim()) {
    parts.push(`Search: "${options.searchTerm.trim()}"`);
  }
  if (options.filterDepartment) {
    parts.push(`Department: ${options.filterDepartment}`);
  }
  if (options.filterEligibility) {
    parts.push(`Eligibility: ${options.filterEligibility}`);
  }
  return parts.length > 0 ? parts.join('  |  ') : null;
};

const buildSheetLayout = (
  data: PerformanceReportSummary[],
  options: PerformanceReportListExcelOptions,
): SheetLayout => {
  const rows: SheetRow[] = [];
  const todayStr = format(new Date(), 'dd MMM yyyy HH:mm');
  const filterSummary = buildFilterSummary(options);
  const totalInSystem = options.totalInSystem ?? data.length;

  const titleRow = rows.length;
  rows.push(['Employee Performance Report Summary', ...Array(NUM_COLS - 1).fill('')]);

  const metaRow = rows.length;
  rows.push([
    `Export Date: ${todayStr}`,
    '',
    '',
    '',
    '',
    `Records Shown: ${data.length}`,
    '',
    '',
    '',
    '',
    `Total Employees: ${totalInSystem}`,
    '',
  ]);

  let filterRow: number | null = null;
  if (filterSummary) {
    filterRow = rows.length;
    rows.push([`Applied Filters: ${filterSummary}`, ...Array(NUM_COLS - 1).fill('')]);
  }

  const headerRow = rows.length;
  rows.push([
    'No.',
    'Employee Name',
    'Staff No.',
    'Department',
    'Position',
    'KPI Score',
    'Appraisal Score',
    'Self-Assessment',
    'Feedback Score',
    'PIP Status',
    'Overall Rating',
    'Promotion Eligibility',
  ]);

  const dataStartRow = rows.length;
  data.forEach((emp, index) => {
    rows.push([
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
      emp.promotionEligibility || '—',
    ]);
  });
  const dataEndRow = rows.length - 1;

  const rated = data.filter((e) => e.overallRating != null);
  const avg =
    options.avgRating ??
    (rated.length > 0
      ? rated.reduce((sum, e) => sum + (e.overallRating ?? 0), 0) / rated.length
      : 0);
  const eligible = options.eligibleCount ?? data.filter((e) => e.promotionEligible).length;
  const activePip = options.activePipCount ?? data.filter((e) => e.hasActivePip).length;

  const footerRow = rows.length;
  rows.push([
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    `Avg Overall: ${avg.toFixed(1)}`,
    `Active PIP: ${activePip}`,
    `Promotion Eligible: ${eligible}`,
    'EPMS — Confidential',
  ]);

  return {
    rows,
    titleRow,
    metaRow,
    filterRow,
    headerRow,
    dataStartRow,
    dataEndRow,
    footerRow,
  };
};

const applyStyles = (
  ws: XLSX.WorkSheet,
  layout: SheetLayout,
  data: PerformanceReportSummary[],
) => {
  const { rows, titleRow, metaRow, filterRow, headerRow, dataStartRow, dataEndRow, footerRow } =
    layout;

  for (let r = 0; r < rows.length; r += 1) {
    for (let c = 0; c < NUM_COLS; c += 1) {
      const ref = `${COL_LETTERS[c]}${r + 1}`;
      if (!ws[ref]) {
        ws[ref] = { t: 's', v: '' };
      }
      const cell = ws[ref];

      if (r === titleRow) {
        cell.s = {
          font: { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: BRAND_BLUE } },
          alignment: { horizontal: 'center', vertical: 'center' },
        };
        continue;
      }

      if (r === metaRow) {
        cell.s = {
          font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: ACCENT_BLUE } },
          fill: { fgColor: { rgb: META_BG } },
          alignment: {
            horizontal: c === 0 ? 'left' : c >= 9 ? 'right' : 'center',
            vertical: 'center',
          },
          border: { bottom: { style: 'thin', color: { rgb: 'CBD5E1' } } },
        };
        continue;
      }

      if (filterRow != null && r === filterRow) {
        cell.s = {
          font: { name: 'Segoe UI', sz: 9, color: { rgb: '475569' } },
          fill: { fgColor: { rgb: 'F8FAFC' } },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
          border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } },
        };
        continue;
      }

      if (r === headerRow) {
        cell.s = {
          font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: ACCENT_BLUE } },
          fill: { fgColor: { rgb: HEADER_BG } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'medium', color: { rgb: ACCENT_BLUE } },
            bottom: { style: 'medium', color: { rgb: ACCENT_BLUE } },
          },
        };
        continue;
      }

      if (r === footerRow) {
        cell.s = {
          font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: ACCENT_BLUE } },
          fill: { fgColor: { rgb: 'F8FAFC' } },
          alignment: { horizontal: c >= 8 ? 'center' : 'left', vertical: 'center' },
          border: {
            top: { style: 'double', color: { rgb: '94A3B8' } },
            bottom: { style: 'medium', color: { rgb: ACCENT_BLUE } },
          },
        };
        continue;
      }

      if (r >= dataStartRow && r <= dataEndRow) {
        const dataIndex = r - dataStartRow;
        const emp = data[dataIndex];
        let align: 'left' | 'center' | 'right' = 'left';
        if (c === 0 || c === 2 || c === 9) align = 'center';
        else if (c >= 5 && c <= 10) align = 'center';

        const isAlt = dataIndex % 2 === 1;
        cell.s = {
          font: { name: 'Segoe UI', sz: 10, color: { rgb: TEXT_BODY } },
          fill: isAlt ? { fgColor: { rgb: 'FAFBFC' } } : undefined,
          alignment: { horizontal: align, vertical: 'center', wrapText: c === 1 || c === 3 || c === 4 },
          border: { bottom: { style: 'thin', color: { rgb: BORDER_LIGHT } } },
        };

        if (c === 9 && cell.v === 'Active') {
          cell.s.font = { ...cell.s.font, bold: true, color: { rgb: 'DC2626' } };
        } else if (c === 9 && cell.v === 'None') {
          cell.s.font = { ...cell.s.font, color: { rgb: '059669' } };
        }

        if (c === 10 && emp) {
          cell.s.font = {
            ...cell.s.font,
            bold: true,
            color: { rgb: overallScoreColor(emp.overallRating) },
          };
        }

        if (c === 11 && cell.v && cell.v !== '—') {
          cell.s.font = {
            ...cell.s.font,
            bold: true,
            color: { rgb: eligibilityColor(String(cell.v)) },
          };
        }
      }
    }
  }
};

export function exportPerformanceReportListExcel(
  data: PerformanceReportSummary[],
  options: PerformanceReportListExcelOptions = {},
): void {
  const layout = buildSheetLayout(data, options);
  const ws = XLSX.utils.aoa_to_sheet(layout.rows);

  ws['!merges'] = [
    { s: { r: layout.titleRow, c: 0 }, e: { r: layout.titleRow, c: NUM_COLS - 1 } },
    { s: { r: layout.metaRow, c: 0 }, e: { r: layout.metaRow, c: 4 } },
    { s: { r: layout.metaRow, c: 5 }, e: { r: layout.metaRow, c: 7 } },
    { s: { r: layout.metaRow, c: 9 }, e: { r: layout.metaRow, c: NUM_COLS - 1 } },
    ...(layout.filterRow != null
      ? [{ s: { r: layout.filterRow, c: 0 }, e: { r: layout.filterRow, c: NUM_COLS - 1 } }]
      : []),
  ];

  ws['!cols'] = [
    { wch: 6 },
    { wch: 26 },
    { wch: 14 },
    { wch: 22 },
    { wch: 22 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 22 },
  ];

  ws['!rows'] = [
    { hpt: 28 },
    { hpt: 20 },
    ...(layout.filterRow != null ? [{ hpt: 18 }] : []),
    { hpt: 22 },
  ];

  ws['!pageSetup'] = {
    paperSize: 9,
    orientation: 'landscape',
    fitToWidth: 1,
    fitToHeight: 0,
  };

  if (data.length > 0) {
    ws['!autofilter'] = {
      ref: `A${layout.headerRow + 1}:L${layout.dataEndRow + 1}`,
    };
  }

  applyStyles(ws, layout, data);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Performance Summary');
  XLSX.writeFile(wb, `Performance_Report_Summary_${format(new Date(), 'yyyyMMdd')}.xlsx`);
}
