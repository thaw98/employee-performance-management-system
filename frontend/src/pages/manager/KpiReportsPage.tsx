import React, { useMemo, useState } from 'react';
import { useGetProfileQuery } from '../../features/user/userApi';
import { useGetKpiHistorySummaryQuery } from '../../features/kpi/kpiApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileSpreadsheet, ChevronLeft, ChevronRight, Users, Target, Calendar, Building2 } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { format } from 'date-fns';

const ORANGE_COLORS = ['#F97316', '#FB923C', '#F59E0B', '#FBBF24', '#EA580C', '#C2410C'];
const PAGE_SIZE = 10;

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
  const { data: summaryData = [], isLoading: isSummaryLoading } = useGetKpiHistorySummaryQuery();
  const [currentPage, setCurrentPage] = useState(1);

  const profile = profileResponse?.data;
  const departmentName = profile?.departmentName || '';

  const filteredSummaries = useMemo(() => {
    return summaryData.filter((item) => item.departmentName === departmentName);
  }, [summaryData, departmentName]);

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
    return filteredSummaries.slice(start, start + PAGE_SIZE);
  }, [filteredSummaries, currentPage]);

  const pageCount = Math.max(1, Math.ceil(filteredSummaries.length / PAGE_SIZE));

  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();
    const period = format(new Date(), 'MMMM yyyy');
    const data = [
      [`KPI Report – ${departmentName || 'Department'}`],
      [`KPI Period: ${period}`, '', '', '', '', `Export Date: ${format(new Date(), 'dd MMM yyyy')}`],
      ['No', 'Employee Name', 'Staff Number', 'Position', 'Period', 'Total KPIs', 'Total KPI Score (%)'],
      ...filteredSummaries.map((item, index) => [
        index + 1,
        item.employeeName || 'Unknown',
        item.staffNo || `EMP-${item.employeeId}`,
        item.positionName || 'Unknown',
        item.period || 'Unknown',
        item.totalKpis || 0,
        item.totalScore !== undefined && item.totalScore !== null ? Number(item.totalScore).toFixed(2) : 'N/A',
      ]),
      ['', '', '', '', '', 'Total Records', filteredSummaries.length],
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
      { wch: 14 },
      { wch: 12 },
      { wch: 16 },
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
            fill: { fgColor: { rgb: 'F97316' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        } else if (rowIndex === 1) {
          style = {
            font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: 'C2410C' } },
            fill: { fgColor: { rgb: 'FFEDD5' } },
            alignment: { horizontal: colIndex < 5 ? 'left' : 'right', vertical: 'center' },
          };
        } else if (rowIndex === 2) {
          style = {
            font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: 'B45309' } },
            fill: { fgColor: { rgb: 'FEF3C7' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
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
        <button
          type="button"
          onClick={handleExportExcel}
          className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700"
        >
          <FileSpreadsheet size={18} />
          Export Excel
        </button>
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
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
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
                  >
                    {positionDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={ORANGE_COLORS[index % ORANGE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value ?? ''}`, 'Records'] as [string, string]} />
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
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip formatter={(value: any) => [`${value ?? ''}`, 'Records'] as [string, string]} />
                  <Bar dataKey="count" fill="#F97316" radius={[8, 8, 0, 0]} />
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
                <th className="px-4 py-4">Employee</th>
                <th className="px-4 py-4">Staff No.</th>
                <th className="px-4 py-4">Position</th>
                <th className="px-4 py-4">Period</th>
                <th className="px-4 py-4 text-right">Total KPIs</th>
                <th className="px-4 py-4 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading KPI records…</td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No KPI records found for your department.</td>
                </tr>
              ) : (
                paginatedRecords.map((item) => (
                  <tr key={`${item.employeeId}-${item.period}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 font-black">{getInitials(item.employeeName)}</div>
                        <div>
                          <p className="font-black text-slate-900">{item.employeeName || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{item.managerName || 'Manager'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{item.staffNo || `EMP-${item.employeeId}`}</td>
                    <td className="px-4 py-4 text-slate-600">{item.positionName || 'N/A'}</td>
                    <td className="px-4 py-4 text-slate-600">{item.period || 'N/A'}</td>
                    <td className="px-4 py-4 text-right text-slate-900 font-black">{item.totalKpis ?? 0}</td>
                    <td className="px-4 py-4 text-right font-black text-slate-900">{formatPercentage(item.totalScore)}</td>
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
