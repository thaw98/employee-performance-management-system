import { useMemo, useState } from 'react';
import { useGetKpiHistorySummaryQuery, useGetDepartmentComparisonQuery } from '../../features/kpi/kpiApi';
import { useGetDepartmentsQuery } from '../../features/department/api/departmentApi';
import { MonthYearPicker } from '../../components/common/MonthYearPicker';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Target, Users, Building2, TrendingUp, ChevronLeft, ChevronRight, Filter, FileSpreadsheet, Download } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';
import {
  KPI_REPORTS_BAR_FILL,
  KPI_REPORTS_CHART_AXIS,
  KPI_REPORTS_CHART_COLORS,
  KPI_REPORTS_CHART_GRID,
  KPI_REPORTS_PIE_STROKE,
  KPI_REPORTS_PIE_STROKE_WIDTH,
  kpisGradientR,
} from '../../features/kpi/kpisTheme';

export function getPerformanceLevel(score?: number | null): string | null {
  if (score === undefined || score === null) return null;
  if (score >= 90) return 'High Performer';
  if (score >= 70) return 'Good Performer';
  if (score >= 50) return 'Low Performer';
  return 'Poor Performer';
}

export function getPerformanceLevelBadgeStyle(level: string): string {
  switch (level) {
    case 'High Performer':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Good Performer':
      return 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]';
    case 'Low Performer':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Poor Performer':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

export function renderPerformanceBadge(score?: number | null) {
  const level = getPerformanceLevel(score);
  if (!level) return <span className="text-slate-300 font-medium">-</span>;
  
  return (
    <span className={`px-2.5 py-1 text-[10px] font-black rounded-full border uppercase tracking-wider ${getPerformanceLevelBadgeStyle(level)}`}>
      {level}
    </span>
  );
}

const getCurrentMonthValue = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
};

const formatMonthYear = (monthValue: string) => {
  if (!monthValue) return '';
  const [year, month] = monthValue.split('-');
  if (!year || !month) return monthValue;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

export default function KpiReportsPage() {
  const [selectedPeriodMonth, setSelectedPeriodMonth] = useState(getCurrentMonthValue());
  const selectedPeriodLabel = formatMonthYear(selectedPeriodMonth);

  const { data: summaryData = [], isLoading: isSummaryLoading } = useGetKpiHistorySummaryQuery({ period: selectedPeriodLabel });
  const { data: departmentComparisonData = [], isLoading: isComparisonLoading } = useGetDepartmentComparisonQuery({ period: selectedPeriodLabel });
  const { data: departmentsData } = useGetDepartmentsQuery();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDept, setSelectedDept] = useState('');
  const [activeTab, setActiveTab] = useState<'employee' | 'department'>('employee');
  const [filterSortOpt, setFilterSortOpt] = useState('high-to-low');
  const itemsPerPage = 10;

  const isLoading = isSummaryLoading || isComparisonLoading;

  const departments = departmentsData?.data || [];

  const filteredData = useMemo(() => {
    let data = !selectedDept
      ? [...summaryData]
      : summaryData.filter(item => item.departmentName === selectedDept);

    // Filter by performance level
    if (filterSortOpt === 'High Performer') {
      data = data.filter(item => getPerformanceLevel(item.totalScore) === 'High Performer');
    } else if (filterSortOpt === 'Good Performer') {
      data = data.filter(item => getPerformanceLevel(item.totalScore) === 'Good Performer');
    } else if (filterSortOpt === 'Low Performer') {
      data = data.filter(item => getPerformanceLevel(item.totalScore) === 'Low Performer');
    } else if (filterSortOpt === 'Poor Performer') {
      data = data.filter(item => getPerformanceLevel(item.totalScore) === 'Poor Performer');
    }

    // Sort by score
    if (filterSortOpt === 'low-to-high') {
      return data.sort((a, b) => (a.totalScore || 0) - (b.totalScore || 0));
    } else {
      return data.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    }
  }, [summaryData, selectedDept, filterSortOpt]);

  const sortedDepartmentComparisonData = useMemo(() => {
    return [...departmentComparisonData].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  }, [departmentComparisonData]);

  const handleExportExcel = () => {
    try {
      const data: any[] = [];
      const isDeptActive = activeTab === 'department';

      if (isDeptActive) {
        // Row 1: Title "Department Performance Comparison Report"
        data.push(['Department Performance Comparison Report', '', '', '', '']);
        
        // Row 2: "Kpi Period - Month Year" & "Export Date - Day Month Year"
        const periodStr = selectedPeriodLabel || format(new Date(), 'MMMM yyyy');
        const todayStr = format(new Date(), 'dd MMM yyyy');
        data.push([
          `KPI Period: ${periodStr}`, 
          '', 
          '', 
          `Export Date: ${todayStr}`, 
          ''
        ]);

        // Row 3: Headers
        data.push([
          'No',
          'Department',
          'Total Staff',
          'Department Manager Name',
          'Total Score'
        ]);

        // Row 4+: Data rows
        sortedDepartmentComparisonData.forEach((item, index) => {
          data.push([
            index + 1, // No
            item.departmentName,
            `${item.totalStaff} Members`,
            item.managerName || '-',
            item.totalScore !== undefined && item.totalScore !== null 
              ? `${Number(item.totalScore).toFixed(2)}%` 
              : '-'
          ]);
        });
        
        // Bottom Row: Total Departments
        data.push([
          '', 
          '', 
          '', 
          'Total Departments', 
          sortedDepartmentComparisonData.length
        ]);
      } else {
        // Row 1: Title "Kpi Report"
        data.push(['Kpi Report', '', '', '', '', '', '']);
        
        // Row 2: "Kpi Period - Month Year" & "Export Date - Day Month Year"
        const periodStr = selectedPeriodLabel || format(new Date(), 'MMMM yyyy');
        const todayStr = format(new Date(), 'dd MMM yyyy'); // Standard Day Month Year constraint
        data.push([
          `KPI Period: ${periodStr}`, 
          '', 
          '', 
          '', 
          '', 
          `Export Date: ${todayStr}`, 
          ''
        ]);

        // Row 3: Headers exactly as in the layout
        data.push([
          'No',
          'Employee Name',
          'Staff Number',
          'Manager Name',
          'Department',
          'Position',
          'Total Score',
          'Performance Level'
        ]);

        // Row 4+: Data rows
        filteredData.forEach((item, index) => {
          data.push([
            index + 1, // No
            item.employeeName,
            item.staffNo || `EMP-${item.employeeId}`,
            item.managerName || '-',
            item.departmentName,
            item.positionName,
            item.totalScore !== undefined && item.totalScore !== null 
              ? `${Number(item.totalScore).toFixed(2)}%` 
              : '-',
            getPerformanceLevel(item.totalScore) || '-'
          ]);
        });
        
        // Bottom Row: Total Employee
        data.push([
          '', 
          '', 
          '', 
          '', 
          '', 
          '', 
          'Total Employee', 
          filteredData.length
        ]);
      }
      
      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // Apply merges
      if (isDeptActive) {
        ws['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Row 1: Merge A1:E1 for Title
          { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }, // Row 2: Merge A2:C2 for Period
          { s: { r: 1, c: 3 }, e: { r: 1, c: 4 } }  // Row 2: Merge D2:E2 for Export Date
        ];

        // Adjust column widths to make sure text is not cut off
        ws['!cols'] = [
          { wch: 5 },  // No
          { wch: 20 }, // Department
          { wch: 15 }, // Total Staff
          { wch: 20 }, // Manager Name
          { wch: 15 }  // Total Score
        ];
      } else {
        ws['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Row 1: Merge A1:H1 for Title
          { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Row 2: Merge A2:F2 for Period
          { s: { r: 1, c: 6 }, e: { r: 1, c: 7 } }  // Row 2: Merge G2:H2 for Export Date
        ];

        // Adjust column widths to make sure text is not cut off
        ws['!cols'] = [
          { wch: 5 },  // No
          { wch: 20 }, // Employee Name
          { wch: 12 }, // Staff Number
          { wch: 20 }, // Manager Name
          { wch: 18 }, // Department
          { wch: 18 }, // Position
          { wch: 12 }, // Total Score
          { wch: 18 }  // Performance Level
        ];
      }

      // Set print options for A4 Portrait paper size
      ws['!pageSetup'] = {
        paperSize: 9, // A4 Paper
        orientation: 'portrait'
      };

      // Apply Excel Cell Styling
      const numCols = isDeptActive ? 5 : 8;
      const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, numCols);
      
      for (let r = 0; r < data.length; r++) {
        for (let c = 0; c < numCols; c++) {
          const cellRef = `${cols[c]}${r + 1}`;
          // Ensure cell exists
          if (!ws[cellRef]) {
            ws[cellRef] = { t: 's', v: '' };
          }
          
          const cell = ws[cellRef];
          
          // Row 1: Main Title
          if (r === 0) {
            cell.s = {
              font: { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
              fill: { fgColor: { rgb: '2463EB' } },
              alignment: { horizontal: 'center', vertical: 'center' }
            };
          }
          // Row 2: Period & Export Date
          else if (r === 1) {
            cell.s = {
              font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '1D4ED8' } },
              fill: { fgColor: { rgb: 'EFF6FF' } },
              alignment: { 
                horizontal: c < (isDeptActive ? 3 : 6) ? 'left' : 'right', 
                vertical: 'center' 
              },
              border: {
                bottom: { style: 'thin', color: { rgb: 'BFDBFE' } }
              }
            };
          }
          // Row 3: Headers exactly as in the layout
          else if (r === 2) {
            cell.s = {
              font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: '1E40AF' } },
              fill: { fgColor: { rgb: 'DBEAFE' } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: {
                top: { style: 'medium', color: { rgb: '2463EB' } },
                bottom: { style: 'medium', color: { rgb: '2463EB' } },
                left: { style: 'thin', color: { rgb: 'DBEAFE' } },
                right: { style: 'thin', color: { rgb: 'DBEAFE' } }
              }
            };
          }
          // Bottom Row
          else if (r === data.length - 1) {
            cell.s = {
              font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: '0F172A' } },
              fill: { fgColor: { rgb: 'F8FAFC' } }, // Soft Slate Gray
              alignment: { 
                horizontal: c >= (numCols - 2) ? 'right' : 'left', 
                vertical: 'center' 
              },
              border: {
                top: { style: 'double', color: { rgb: '94A3B8' } },
                bottom: { style: 'medium', color: { rgb: '64748B' } },
                left: { style: 'thin', color: { rgb: 'E2E8F0' } },
                right: { style: 'thin', color: { rgb: 'E2E8F0' } }
              }
            };
          }
          // Data Rows (Row 4 to Row data.length - 2)
          else {
            let align = 'left';
            if (isDeptActive) {
              if (c === 0 || c === 2) align = 'center'; // Center No and Staff count
              else if (c === 4) align = 'right'; // Right-align Scores
            } else {
              if (c === 1 || c === 3 || c === 7) align = 'center'; // Center Employee Name, Manager Name & Performance Level
              else if (c === 2 || c === 6) align = 'right'; // Right-align Staff Number & Scores (No is left-aligned)
            }
            
            cell.s = {
              font: { name: 'Segoe UI', sz: 10, color: { rgb: '334155' } },
              alignment: { horizontal: align, vertical: 'center' },
              border: {
                bottom: { style: 'thin', color: { rgb: 'F1F5F9' } },
                left: { style: 'thin', color: { rgb: 'F1F5F9' } },
                right: { style: 'thin', color: { rgb: 'F1F5F9' } }
              }
            };
            
            // Format Total Score highlight
            const isScoreCol = isDeptActive ? c === 4 : c === 6;
            if (isScoreCol && cell.v && cell.v !== '-') {
              cell.s.font.bold = true;
              cell.s.font.color = { rgb: '10B981' }; // Success Emerald Green for score rates
            }

            // Format Performance Level highlight (index 7 for employee report)
            if (!isDeptActive && c === 7 && cell.v && cell.v !== '-') {
              cell.s.font.bold = true;
              const lvl = cell.v;
              if (lvl === 'High Performer') {
                cell.s.font.color = { rgb: '10B981' }; // Green
              } else if (lvl === 'Good Performer') {
                cell.s.font.color = { rgb: '2463EB' };
              } else if (lvl === 'Low Performer') {
                cell.s.font.color = { rgb: 'F97316' }; // Orange
              } else if (lvl === 'Poor Performer') {
                cell.s.font.color = { rgb: 'EF4444' }; // Red
              }
            }
          }
        }
      }
      
      const wb = XLSX.utils.book_new();
      const sheetName = isDeptActive ? "Dept Comparison" : "KPI Report";
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      const deptSuffix = selectedDept ? `_${selectedDept.replace(/\s+/g, '_')}` : '';
      const filePrefix = isDeptActive ? 'Department_Comparison_Report' : 'KPI_Performance_Report';
      XLSX.writeFile(wb, `${filePrefix}${deptSuffix}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      toast.success(`${isDeptActive ? 'Department comparison' : 'Excel'} report exported successfully!`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to export Excel report');
    }
  };

  const handleExportPdf = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const isDeptActive = activeTab === 'department';
      const title = isDeptActive ? 'Department Performance Comparison Report' : 'KPI Report';
      doc.setFontSize(16);
      doc.text(title, 14, 14);
      doc.setFontSize(10);
      doc.text(`KPI Period: ${selectedPeriodLabel || format(new Date(), 'MMMM yyyy')}`, 14, 22);
      doc.text(`Export Date: ${format(new Date(), 'dd MMM yyyy')}`, 230, 22);

      if (isDeptActive) {
        autoTable(doc, {
          startY: 30,
          head: [['No', 'Department', 'Total Staff', 'Department Manager Name', 'Total Score']],
          body: sortedDepartmentComparisonData.map((item, index) => [
            index + 1,
            item.departmentName,
            `${item.totalStaff} Members`,
            item.managerName || '-',
            item.totalScore !== undefined && item.totalScore !== null ? `${Number(item.totalScore).toFixed(2)}%` : '-',
          ]),
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: [36, 99, 235], textColor: 255 },
        });
      } else {
        autoTable(doc, {
          startY: 30,
          head: [['No', 'Employee Name', 'Staff Number', 'Manager Name', 'Department', 'Position', 'Total Score', 'Performance Level']],
          body: filteredData.map((item, index) => [
            index + 1,
            item.employeeName,
            item.staffNo || `EMP-${item.employeeId}`,
            item.managerName || '-',
            item.departmentName,
            item.positionName,
            item.totalScore !== undefined && item.totalScore !== null ? `${Number(item.totalScore).toFixed(2)}%` : '-',
            getPerformanceLevel(item.totalScore) || '-',
          ]),
          styles: { fontSize: 8, cellPadding: 1.8 },
          headStyles: { fillColor: [36, 99, 235], textColor: 255 },
        });
      }

      doc.save(`${isDeptActive ? 'Department_Comparison_Report' : 'KPI_Performance_Report'}_${format(new Date(), 'yyyyMMdd')}.pdf`);
      toast.success('PDF report exported successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export PDF report');
    }
  };

  const stats = useMemo(() => {
    const totalRecords = filteredData.length;
    const totalEmployees = new Set(filteredData.map(s => s.employeeId)).size;
    const totalDepartments = new Set(filteredData.map(s => s.departmentName)).size;
    const totalKpis = filteredData.reduce((acc, curr) => acc + (curr.totalKpis || 0), 0);

    return { totalRecords, totalEmployees, totalDepartments, totalKpis };
  }, [filteredData]);

  const departmentChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(item => {
      const dept = item.departmentName || 'Unknown';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredData]);

  const timelineChartData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredData.forEach(item => {
      if (!item.createdDate) return;
      try {
        const monthYear = format(new Date(item.createdDate), 'MMM yyyy');
        groups[monthYear] = (groups[monthYear] || 0) + 1;
      } catch (e) {
        // Ignore parsing errors
      }
    });

    return Object.entries(groups).map(([month, count]) => ({
      name: month,
      Records: count
    }));
  }, [filteredData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-[#bfdbfe] border-t-[#2463eb] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">KPI Reports Overview</h1>
        <p className="text-sm font-medium text-slate-500">Analytics and distribution of Key Performance Indicators across the organization</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Department Filter */}
          <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-2xl border border-slate-100 shadow-sm h-12">
            <div className="w-8 h-8 bg-[#eff6ff] text-[#2463eb] rounded-lg flex items-center justify-center flex-shrink-0">
              <Filter size={16} />
            </div>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none focus:ring-0 cursor-pointer min-w-[200px]"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentName}>
                  {dept.departmentName}
                </option>
              ))}
            </select>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-2xl border border-slate-100 shadow-sm h-12">
            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 size={16} />
            </div>
            <MonthYearPicker
              value={selectedPeriodMonth}
              onChange={(value) => {
                setSelectedPeriodMonth(value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Filter/Sort Dropdown */}
          {activeTab === 'employee' && (
            <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-2xl border border-slate-100 shadow-sm h-12">
              <div className="w-8 h-8 bg-[#eff6ff] text-[#2463eb] rounded-lg flex items-center justify-center flex-shrink-0">
                <Filter size={16} />
              </div>
              <select
                value={filterSortOpt}
                onChange={(e) => {
                  setFilterSortOpt(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none focus:ring-0 cursor-pointer min-w-[200px]"
              >
                <option value="high-to-low">High Score to Low</option>
                <option value="low-to-high">Low Score to High</option>
                <option value="High Performer">High Performer</option>
                <option value="Good Performer">Good Performer</option>
                <option value="Low Performer">Low Performer</option>
                <option value="Poor Performer">Poor Performer</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
          <button
            onClick={handleExportPdf}
            className="flex h-12 items-center justify-center gap-2.5 rounded-2xl bg-slate-900 px-5 text-xs font-black uppercase tracking-wider text-white shadow-sm transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download size={16} />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className={`flex items-center justify-center gap-2.5 px-5 h-12 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-sm shadow-[#dbeafe] hover:from-[#1d4ed8] hover:to-[#1e40af] hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${kpisGradientR}`}
          >
            <FileSpreadsheet size={16} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#eff6ff] text-[#2463eb] rounded-xl flex items-center justify-center">
            <Target size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.totalKpis}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total KPIs Defined</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.totalEmployees}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Employees w/ KPIs</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#eff6ff] text-[#1d4ed8] rounded-xl flex items-center justify-center">
            <Building2 size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.totalDepartments}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Departments Active</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.totalRecords}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Historical Records</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Building2 size={16} className="text-[#2463eb]" />
            KPIs Distribution by Department
          </h3>
          <div className="h-[300px]">
            {departmentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    stroke={KPI_REPORTS_PIE_STROKE}
                    strokeWidth={KPI_REPORTS_PIE_STROKE_WIDTH}
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: KPI_REPORTS_CHART_AXIS.fill, strokeWidth: 1 }}
                  >
                    {departmentChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={KPI_REPORTS_CHART_COLORS[index % KPI_REPORTS_CHART_COLORS.length]}
                        stroke={KPI_REPORTS_PIE_STROKE}
                        strokeWidth={KPI_REPORTS_PIE_STROKE_WIDTH}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 4px 12px rgb(0 0 0 / 0.15)',
                      fontWeight: 600,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-medium">No data available</div>
            )}
          </div>
        </div>

        {/* Timeline Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#2463eb]" />
            KPI Assignment Over Time
          </h3>
          <div className="h-[300px]">
            {timelineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={KPI_REPORTS_CHART_GRID} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={KPI_REPORTS_CHART_AXIS}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={KPI_REPORTS_CHART_AXIS}
                    dx={-10}
                  />
                  <Tooltip
                    cursor={{ fill: '#e2e8f0' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 4px 12px rgb(0 0 0 / 0.15)',
                      fontWeight: 600,
                    }}
                  />
                  <Bar
                    dataKey="Records"
                    fill={KPI_REPORTS_BAR_FILL}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={50}
                    stroke="#0d5c56"
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-medium">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* View Switcher Buttons */}
      <div className="flex items-center gap-3 mt-8">
        <button
          onClick={() => setActiveTab('employee')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-200 border ${
            activeTab === 'employee'
              ? `border-[#2463eb] text-white shadow-lg shadow-[#dbeafe]/50 ${kpisGradientR}`
              : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users size={16} />
          Employee Directory
        </button>
        <button
          onClick={() => setActiveTab('department')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-200 border ${
            activeTab === 'department'
              ? `border-[#2463eb] text-white shadow-lg shadow-[#dbeafe]/50 ${kpisGradientR}`
              : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Building2 size={16} />
          Department KPI Performance Directory
        </button>
      </div>

      {activeTab === 'department' ? (
        /* Department Comparison Section */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-6">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Building2 size={18} className="text-[#2463eb]" />
                Department Performance Comparison
              </h3>
              <p className="text-xs font-medium text-slate-400 mt-1">
                Comparative overview of active departments, total staff size, department managers, and their average performance score
              </p>
            </div>
            <span className="px-3 py-1 bg-[#eff6ff] text-[#1d4ed8] text-xs font-bold rounded-full uppercase tracking-wider">
              {sortedDepartmentComparisonData.length} Departments
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="py-4 px-6 text-center w-16 whitespace-nowrap">No</th>
                  <th className="py-4 px-6 whitespace-nowrap">Department</th>
                  <th className="py-4 px-6 text-center whitespace-nowrap">Total Staff</th>
                  <th className="py-4 px-6 whitespace-nowrap">Department Manager Name</th>
                  <th className="py-4 px-6 text-right whitespace-nowrap">Total Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isComparisonLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                      Loading comparisons...
                    </td>
                  </tr>
                ) : sortedDepartmentComparisonData.length > 0 ? (
                  sortedDepartmentComparisonData.map((dept, idx) => (
                    <tr key={dept.departmentId || idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-6 text-center font-bold text-slate-400 whitespace-nowrap">
                        {idx + 1}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full ring-2 ring-white"
                            style={{
                              backgroundColor:
                                KPI_REPORTS_CHART_COLORS[idx % KPI_REPORTS_CHART_COLORS.length],
                            }}
                          />
                          {dept.departmentName}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center text-slate-600 font-bold whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                          {dept.totalStaff} Members
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center text-xs font-black">
                            {dept.managerName ? dept.managerName.charAt(0) : '-'}
                          </div>
                          {dept.managerName || '-'}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-black text-[#2463eb] text-base whitespace-nowrap">
                        {dept.totalScore !== undefined && dept.totalScore !== null ? (
                          `${Number(dept.totalScore).toFixed(2)}%`
                        ) : (
                          <span className="text-slate-300 font-medium">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                      No department data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Employee KPI Details Table */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-6">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Employee KPI Performance Directory</h3>
              <p className="text-xs font-medium text-slate-400 mt-1">Detailed list of employee KPI definitions, total assigned KPIs, and performance scores</p>
            </div>
            <span className="px-3 py-1 bg-[#eff6ff] text-[#1d4ed8] text-xs font-bold rounded-full uppercase tracking-wider">
              {filteredData.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="py-4 px-6 whitespace-nowrap">Employee Name</th>
                  <th className="py-4 px-6 whitespace-nowrap w-32">Staff No.</th>
                  <th className="py-4 px-6 whitespace-nowrap">Manager Name</th>
                  <th className="py-4 px-6 whitespace-nowrap">Department</th>
                  <th className="py-4 px-6 whitespace-nowrap">Position</th>
                  <th className="py-4 px-6 text-center whitespace-nowrap">Total KPIs</th>
                  <th className="py-4 px-6 text-right whitespace-nowrap">Total Score</th>
                  <th className="py-4 px-6 text-center whitespace-nowrap">Performance Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredData.length > 0 ? (
                  filteredData
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((item, idx) => (
                      <tr key={`${item.employeeId}-${item.period}`} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="font-bold text-slate-700">{item.employeeName}</div>
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap w-32">
                          {item.staffNo || `EMP-${item.employeeId}`}
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">
                          {item.managerName || '-'}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-wider">
                            {item.departmentName}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">{item.positionName}</td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-[#eff6ff] text-[#2463eb] text-xs font-black rounded-full">
                            {item.totalKpis}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-black text-emerald-600 whitespace-nowrap">
                          {item.totalScore !== undefined && item.totalScore !== null ? (
                            `${Number(item.totalScore).toFixed(2)}%`
                          ) : (
                            <span className="text-slate-300 font-medium">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          {renderPerformanceBadge(item.totalScore)}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                      No KPI records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {filteredData.length > itemsPerPage && (
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} employees
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredData.length / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(filteredData.length / itemsPerPage)}
                  className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
