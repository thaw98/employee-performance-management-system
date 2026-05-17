import React, { useMemo, useState } from 'react';
import { useGetKpiHistorySummaryQuery } from '../../features/kpi/kpiApi';
import { useGetDepartmentsQuery } from '../../features/department/api/departmentApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Target, Users, Building2, TrendingUp, ChevronLeft, ChevronRight, Filter, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx-js-style';
import { toast } from 'react-hot-toast';

const COLORS = ['#0855BF', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6', '#F43F5E'];

export default function KpiReportsPage() {
  const { data: summaryData = [], isLoading } = useGetKpiHistorySummaryQuery();
  const { data: departmentsData } = useGetDepartmentsQuery();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDept, setSelectedDept] = useState('');
  const itemsPerPage = 10;

  const departments = departmentsData?.data || [];

  const filteredData = useMemo(() => {
    const data = !selectedDept
      ? [...summaryData]
      : summaryData.filter(item => item.departmentName === selectedDept);

    return data.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  }, [summaryData, selectedDept]);

  const handleExportExcel = () => {
    try {
      const data: any[] = [];

      // Row 1: Title "Kpi Report"
      data.push(['Kpi Report', '', '', '', '', '', '']);
      
      // Row 2: "Kpi Period - Month Year" & "Export Date - Day Month Year"
      const periodStr = format(new Date(), 'MMMM yyyy');
      const todayStr = format(new Date(), 'dd MMM yyyy'); // Standard Day Month Year constraint
      data.push([
        `Kpi Period - ${periodStr}`, 
        '', 
        '', 
        '', 
        '', 
        `Export Date - ${todayStr}`, 
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
        'Total Score'
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
            : '-'
        ]);
      });
      
      // Bottom Row: Total Employee
      data.push([
        '', 
        '', 
        '', 
        '', 
        '', 
        'Total Employee', 
        filteredData.length
      ]);
      
      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // Apply merges
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Row 1: Merge A1:G1 for Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Row 2: Merge A2:E2 for Period
        { s: { r: 1, c: 5 }, e: { r: 1, c: 6 } }  // Row 2: Merge F2:G2 for Export Date
      ];

      // Adjust column widths to make sure text is not cut off
      ws['!cols'] = [
        { wch: 8 },  // No
        { wch: 25 }, // Employee Name
        { wch: 15 }, // Staff Number
        { wch: 25 }, // Manager Name
        { wch: 20 }, // Department
        { wch: 20 }, // Position
        { wch: 15 }  // Total Score / Total Count
      ];

      // Set print options for A4 Portrait paper size
      ws['!pageSetup'] = {
        paperSize: 9, // A4 Paper
        orientation: 'portrait'
      };

      // Apply Excel Cell Styling
      const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      
      for (let r = 0; r < data.length; r++) {
        for (let c = 0; c < 7; c++) {
          const cellRef = `${cols[c]}${r + 1}`;
          // Ensure cell exists
          if (!ws[cellRef]) {
            ws[cellRef] = { t: 's', v: '' };
          }
          
          const cell = ws[cellRef];
          
          // Row 1: Main Title "Kpi Report"
          if (r === 0) {
            cell.s = {
              font: { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
              fill: { fgColor: { rgb: 'F97316' } }, // Premium Orange
              alignment: { horizontal: 'center', vertical: 'center' }
            };
          }
          // Row 2: "Kpi Period - Month Year" & "Export Date - Day Month Year"
          else if (r === 1) {
            cell.s = {
              font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: 'EA580C' } },
              fill: { fgColor: { rgb: 'FFF7ED' } }, // Pale Orange
              alignment: { 
                horizontal: c < 5 ? 'left' : 'right', 
                vertical: 'center' 
              },
              border: {
                bottom: { style: 'thin', color: { rgb: 'FED7AA' } }
              }
            };
          }
          // Row 3: Headers exactly as in the layout
          else if (r === 2) {
            cell.s = {
              font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: 'EA580C' } }, // Dark Orange
              fill: { fgColor: { rgb: 'FFEDD5' } }, // Light Orange
              alignment: { horizontal: 'center', vertical: 'center' },
              border: {
                top: { style: 'medium', color: { rgb: 'EA580C' } },
                bottom: { style: 'medium', color: { rgb: 'EA580C' } },
                left: { style: 'thin', color: { rgb: 'FFEDD5' } },
                right: { style: 'thin', color: { rgb: 'FFEDD5' } }
              }
            };
          }
          // Bottom Row: Total Employee
          else if (r === data.length - 1) {
            cell.s = {
              font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: '0F172A' } },
              fill: { fgColor: { rgb: 'F8FAFC' } }, // Soft Slate Gray
              alignment: { 
                horizontal: c === 5 || c === 6 ? 'right' : 'left', 
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
            if (c === 1 || c === 3) align = 'center'; // Center Employee Name and Manager Name
            else if (c === 2 || c === 6) align = 'right'; // Right-align Staff Number & Scores (No is left-aligned)
            
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
            if (c === 6 && cell.v && cell.v !== '-') {
              cell.s.font.bold = true;
              cell.s.font.color = { rgb: '10B981' }; // Success Emerald Green for score rates
            }
          }
        }
      }
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "KPI Report");
      
      const deptSuffix = selectedDept ? `_${selectedDept.replace(/\s+/g, '_')}` : '';
      XLSX.writeFile(wb, `KPI_Performance_Report${deptSuffix}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      toast.success('Excel report exported successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export Excel report');
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
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">KPI Reports Overview</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Analytics and distribution of Key Performance Indicators across the organization</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
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

          {/* Export to Excel Button */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2.5 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-emerald-100 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <FileSpreadsheet size={16} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
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
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
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
            <Building2 size={16} className="text-indigo-600" />
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
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  >
                    {departmentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
            <TrendingUp size={16} className="text-indigo-600" />
            KPI Assignment Over Time
          </h3>
          <div className="h-[300px]">
            {timelineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                    dx={-10}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="Records" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-medium">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Employee KPI Details Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Employee KPI Performance Directory</h3>
            <p className="text-xs font-medium text-slate-400 mt-1">Detailed list of employee KPI definitions, total assigned KPIs, and performance scores</p>
          </div>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider">
            {filteredData.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="py-4 px-6">Employee Name</th>
                <th className="py-4 px-6">Staff Number</th>
                <th className="py-4 px-6">Manager Name</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6">Position</th>
                <th className="py-4 px-6 text-center">Period</th>
                <th className="py-4 px-6 text-center">Total KPIs</th>
                <th className="py-4 px-6 text-right">Total Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredData.length > 0 ? (
                filteredData
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-black">
                          {item.employeeName?.charAt(0)}
                        </div>
                        {item.employeeName}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {item.staffNo || `EMP-${item.employeeId}`}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {item.managerName || '-'}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-wider">
                          {item.departmentName}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-medium">
                        {item.positionName}
                      </td>
                      <td className="py-4 px-6 text-center text-slate-500 font-bold">
                        {item.period}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-black rounded-full">
                          {item.totalKpis}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-black text-emerald-600">
                        {item.totalScore !== undefined && item.totalScore !== null ? (
                          `${Number(item.totalScore).toFixed(2)}%`
                        ) : (
                          <span className="text-slate-300 font-medium">-</span>
                        )}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
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
    </div>
  );
}
