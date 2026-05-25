import React, { useMemo, useState } from 'react';
import { useGetProfileQuery } from '../../features/user/userApi';
import { useGetKpiHistorySummaryQuery } from '../../features/kpi/kpiApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileSpreadsheet, ChevronLeft, ChevronRight, Users, Target, Calendar, Building2, Filter } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { format } from 'date-fns';
import {
  KPI_REPORTS_BAR_FILL,
  KPI_REPORTS_CHART_AXIS,
  KPI_REPORTS_CHART_COLORS,
  KPI_REPORTS_CHART_GRID,
  KPI_REPORTS_PIE_STROKE,
  KPI_REPORTS_PIE_STROKE_WIDTH,
  kpisGradientBr,
  kpisGradientR,
} from '../../features/kpi/kpisTheme';

const PAGE_SIZE = 10;

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

function formatPercentage(value?: number) {
  return value !== undefined && value !== null ? `${Number(value).toFixed(2)}%` : 'N/A';
}

function getInitials(name?: string) {
  if (!name) return 'M';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function ManagerKpiReportsPage() {
  const { data: profileResponse, isLoading: isProfileLoading } = useGetProfileQuery();
  const { data: summaryData = [], isLoading: isSummaryLoading } = useGetKpiHistorySummaryQuery({});
  const [currentPage, setCurrentPage] = useState(1);
  const [filterSortOpt, setFilterSortOpt] = useState('high-to-low');

  const profile = profileResponse?.data;
  const departmentName = profile?.departmentName || '';

  const filteredSummaries = useMemo(() => {
    return summaryData.filter((item) => item.departmentName === departmentName);
  }, [summaryData, departmentName]);

  const processedSummaries = useMemo(() => {
    let result = [...filteredSummaries];
    
    // Filter by performance level
    if (filterSortOpt === 'High Performer') {
      result = result.filter(item => getPerformanceLevel(item.totalScore) === 'High Performer');
    } else if (filterSortOpt === 'Good Performer') {
      result = result.filter(item => getPerformanceLevel(item.totalScore) === 'Good Performer');
    } else if (filterSortOpt === 'Low Performer') {
      result = result.filter(item => getPerformanceLevel(item.totalScore) === 'Low Performer');
    } else if (filterSortOpt === 'Poor Performer') {
      result = result.filter(item => getPerformanceLevel(item.totalScore) === 'Poor Performer');
    }

    // Sort by score
    if (filterSortOpt === 'low-to-high') {
      result.sort((a, b) => (a.totalScore || 0) - (b.totalScore || 0));
    } else {
      result.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    }

    return result;
  }, [filteredSummaries, filterSortOpt]);

  const departmentsKpiStats = useMemo(() => {
    const totalKpis = filteredSummaries.reduce((sum, item) => sum + (item.totalKpis || 0), 0);
    const employeesWithKpis = new Set(filteredSummaries.map((item) => item.employeeId)).size;
    const totalScoreValues = filteredSummaries.reduce((sum, item) => sum + (item.totalScore || 0), 0);
    const averageScore = filteredSummaries.length > 0 ? totalScoreValues / filteredSummaries.length : 0;
    const historicalRecords = filteredSummaries.length;

    return {
      totalKpis,
      employeesWithKpis,
      averageScore,
      historicalRecords,
    };
  }, [filteredSummaries]);

  const positionDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    filteredSummaries.forEach((item) => {
      const position = item.positionName || 'Unassigned';
      map[position] = (map[position] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredSummaries]);

  const recordsOverTime = useMemo(() => {
    const map: Record<string, number> = {};
    filteredSummaries.forEach((item) => {
      const period = item.period || 'Unknown';
      map[period] = (map[period] || 0) + 1;
    });
    return Object.entries(map)
      .map(([period, count]) => ({ period, count }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [filteredSummaries]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return processedSummaries.slice(start, start + PAGE_SIZE);
  }, [processedSummaries, currentPage]);

  const pageCount = Math.max(1, Math.ceil(processedSummaries.length / PAGE_SIZE));

  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();
    const period = format(new Date(), 'MMMM yyyy');
    const data = [
      [`KPI Report – ${departmentName || 'Department'}`],
      [`KPI Period: ${period}`, '', '', '', '', `Export Date: ${format(new Date(), 'dd MMM yyyy')}`],
      ['No', 'Employee Name', 'Staff Number', 'Position', 'Total KPIs', 'Total KPI Score (%)', 'Performance Level'],
      ...processedSummaries.map((item, index) => [
        index + 1,
        item.employeeName || 'Unknown',
        item.staffNo || `EMP-${item.employeeId}`,
        item.positionName || 'Unknown',
        item.totalKpis || 0,
        item.totalScore !== undefined && item.totalScore !== null ? Number(item.totalScore).toFixed(2) : 'N/A',
        getPerformanceLevel(item.totalScore) || 'N/A',
      ]),
      ['', '', '', '', '', 'Total Records', processedSummaries.length],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
      { s: { r: 1, c: 5 }, e: { r: 1, c: 6 } },
    ];
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 24 },
      { wch: 16 },
      { wch: 20 },
      { wch: 12 },
      { wch: 16 },
      { wch: 25 },
    ];

    data.forEach((row, rowIndex) => {
      row.forEach((_, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        const cell = worksheet[cellRef] || { t: 's', v: '' };
        let style: any = {
          font: { name: 'Segoe UI', sz: 10, color: { rgb: '1F2937' } },
          alignment: { horizontal: 'left', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: 'D1D5DB' } },
            bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
            left: { style: 'thin', color: { rgb: 'D1D5DB' } },
            right: { style: 'thin', color: { rgb: 'D1D5DB' } },
          },
        };

        if (rowIndex === 0) {
          style = {
            font: { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '2463EB' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        } else if (rowIndex === 1) {
          style = {
            font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '1D4ED8' } },
            fill: { fgColor: { rgb: 'EFF6FF' } },
            alignment: { horizontal: colIndex < 6 ? 'left' : 'right', vertical: 'center' },
          };
        } else if (rowIndex === 2) {
          style = {
            font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '1E40AF' } },
            fill: { fgColor: { rgb: 'DBEAFE' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        } else if (rowIndex === data.length - 1) {
          style.font.bold = true;
          style.alignment.horizontal = colIndex >= 5 ? 'right' : 'left';
        } else {
          if (colIndex === 0 || colIndex === 4 || colIndex === 6) {
            style.alignment.horizontal = 'center';
          } else if (colIndex === 5) {
            style.alignment.horizontal = 'right';
          }
          
          if (colIndex === 5 && cell.v && cell.v !== 'N/A') {
            style.font.bold = true;
            style.font.color = { rgb: '10B981' };
          }
          
          if (colIndex === 6 && cell.v && cell.v !== 'N/A') {
            style.font.bold = true;
            const lvl = cell.v;
            if (lvl === 'High Performer') {
              style.font.color = { rgb: '10B981' };
            } else if (lvl === 'Good Performer') {
              style.font.color = { rgb: '2463EB' };
            } else if (lvl === 'Low Performer') {
              style.font.color = { rgb: 'F59E0B' };
            } else if (lvl === 'Poor Performer') {
              style.font.color = { rgb: 'EF4444' };
            }
          }
        }

        worksheet[cellRef] = { ...cell, s: style };
      });
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, 'KPI Report');
    XLSX.writeFile(workbook, `manager-kpi-report-${departmentName?.replace(/\s+/g, '-') || 'department'}-${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const loading = isProfileLoading || isSummaryLoading;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">KPI Report</h1>
          <p className="mt-1 text-sm text-slate-500">Team performance summary for {departmentName || 'your department'}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter/Sort Dropdown */}
          <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-8 h-8 bg-[#eff6ff] text-[#2463eb] rounded-lg flex items-center justify-center">
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

          <button
            type="button"
            onClick={handleExportExcel}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold text-white shadow-sm shadow-[#dbeafe] transition hover:from-[#1d4ed8] hover:to-[#1e40af] h-[48px] ${kpisGradientR}`}
          >
            <FileSpreadsheet size={18} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Total KPIs Defined</p>
          <p className="mt-4 text-3xl font-black text-slate-900">{departmentsKpiStats.totalKpis}</p>
          <p className="mt-2 text-sm text-slate-500">Sum of KPI records for the department</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Employees with KPIs</p>
          <p className="mt-4 text-3xl font-black text-slate-900">{departmentsKpiStats.employeesWithKpis}</p>
          <p className="mt-2 text-sm text-slate-500">Unique employees with active KPI history</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Department Average KPI Score</p>
          <p className="mt-4 text-3xl font-black text-slate-900">{formatPercentage(departmentsKpiStats.averageScore)}</p>
          <p className="mt-2 text-sm text-slate-500">Average total KPI score across the department</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Historical Records</p>
          <p className="mt-4 text-3xl font-black text-slate-900">{departmentsKpiStats.historicalRecords}</p>
          <p className="mt-2 text-sm text-slate-500">Total KPI summary entries for this team</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">KPIs Distribution by Position</h2>
              <p className="mt-1 text-sm text-slate-500">Share of unique KPI records by job position.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eff6ff] px-3 py-2 text-sm font-semibold text-[#1d4ed8]">
              <Building2 size={16} /> {filteredSummaries.length} records
            </div>
          </div>

          <div className="mt-6 h-72">
            {loading ? (
              <div className="flex h-full items-center justify-center text-slate-400">Loading chart…</div>
            ) : positionDistribution.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-400">No KPI data available yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={positionDistribution}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    innerRadius={60}
                    paddingAngle={4}
                    stroke={KPI_REPORTS_PIE_STROKE}
                    strokeWidth={KPI_REPORTS_PIE_STROKE_WIDTH}
                  >
                    {positionDistribution.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={KPI_REPORTS_CHART_COLORS[index % KPI_REPORTS_CHART_COLORS.length]}
                        stroke={KPI_REPORTS_PIE_STROKE}
                        strokeWidth={KPI_REPORTS_PIE_STROKE_WIDTH}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${value ?? ''}`, 'Records'] as [string, string]}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 4px 12px rgb(0 0 0 / 0.15)',
                      fontWeight: 600,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">KPI Records Over Time</h2>
              <p className="mt-1 text-sm text-slate-500">Monthly KPI activity for your department.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2 text-sm font-semibold text-[#1d4ed8]">
              <Calendar size={16} /> Periods
            </div>
          </div>

          <div className="mt-6 h-72">
            {loading ? (
              <div className="flex h-full items-center justify-center text-slate-400">Loading chart…</div>
            ) : recordsOverTime.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-400">No records tracked yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recordsOverTime} margin={{ top: 12, right: 0, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={KPI_REPORTS_CHART_GRID} vertical={false} />
                  <XAxis dataKey="period" tick={KPI_REPORTS_CHART_AXIS} />
                  <YAxis tick={KPI_REPORTS_CHART_AXIS} />
                  <Tooltip
                    formatter={(value: any) => [`${value ?? ''}`, 'Records'] as [string, string]}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 4px 12px rgb(0 0 0 / 0.15)',
                      fontWeight: 600,
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill={KPI_REPORTS_BAR_FILL}
                    radius={[8, 8, 0, 0]}
                    stroke="#0d5c56"
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Team KPI Performance Directory</h2>
            <p className="mt-1 text-sm text-slate-500">A paginated view of your department KPI records.</p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
            Department: {departmentName || 'Not available'}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-4 py-4 whitespace-nowrap">Employee</th>
                <th className="px-4 py-4 whitespace-nowrap w-32">Staff No.</th>
                <th className="px-4 py-4 whitespace-nowrap">Position</th>
                <th className="px-4 py-4 text-right whitespace-nowrap">Total KPIs</th>
                <th className="px-4 py-4 text-right whitespace-nowrap">Score</th>
                <th className="px-4 py-4 text-center whitespace-nowrap">Performance Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading KPI records…</td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">No KPI records found for your department.</td>
                </tr>
              ) : (
                paginatedRecords.map((item) => (
                  <tr key={`${item.employeeId}-${item.period}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl font-black text-white ${kpisGradientBr}`}>{getInitials(item.employeeName)}</div>
                        <div>
                          <p className="font-black text-slate-900">{item.employeeName || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{item.managerName || 'Manager'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600 whitespace-nowrap w-32">{item.staffNo || `EMP-${item.employeeId}`}</td>
                    <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{item.positionName || 'N/A'}</td>
                    <td className="px-4 py-4 text-right text-slate-900 font-black whitespace-nowrap">{item.totalKpis ?? 0}</td>
                    <td className="px-4 py-4 text-right font-black text-slate-900 whitespace-nowrap">{formatPercentage(item.totalScore)}</td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      {renderPerformanceBadge(item.totalScore)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 text-slate-600 text-sm">
          <p>{filteredSummaries.length} record{filteredSummaries.length === 1 ? '' : 's'} total</p>
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-3 font-bold">{currentPage}</span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              disabled={currentPage === pageCount}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
