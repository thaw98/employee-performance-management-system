import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  TrendingUp,
  Award,
  FileText,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  Users,
  Star,
  Filter,
  ArrowUpDown,
  FileDown,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  useGetPerformanceSummariesQuery,
} from '../../features/performanceReport/performanceReportApi';
import { resolveProfilePictureSrc } from '../../utils/mediaUrl';
import { exportPerformanceReportListPdf } from '../../utils/exportPerformanceReportListPdf';

/* ── Helpers ─────────────────────────────────────────── */

const scoreColor = (score: number | null) => {
  if (score == null) return 'text-slate-400';
  if (score >= 4.5) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 3.5) return 'text-blue-600 dark:text-blue-400';
  if (score >= 2.5) return 'text-amber-600 dark:text-amber-400';
  if (score >= 1.5) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

const scoreBg = (score: number | null) => {
  if (score == null) return 'bg-slate-50 dark:bg-slate-800';
  if (score >= 4.5) return 'bg-emerald-50 dark:bg-emerald-900/20';
  if (score >= 3.5) return 'bg-blue-50 dark:bg-blue-900/20';
  if (score >= 2.5) return 'bg-amber-50 dark:bg-amber-900/20';
  if (score >= 1.5) return 'bg-orange-50 dark:bg-orange-900/20';
  return 'bg-red-50 dark:bg-red-900/20';
};

const eligibilityBadge = (eligibility: string) => {
  const norm = eligibility?.trim().toLowerCase();
  switch (norm) {
    case 'strongly recommended':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'eligible':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'possible':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    case 'not eligible':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  }
};

const pipBadge = (hasActivePip: boolean) =>
  hasActivePip
    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';

const formatScore = (score: number | null) =>
  score != null ? score.toFixed(1) : '—';

/* ── Component ───────────────────────────────────────── */

type PerformanceReportPageProps = {
  basePath?: string;
  readOnly?: boolean;
};

export const PerformanceReportPage: React.FC<PerformanceReportPageProps> = ({
  basePath = '/hr/performance-reports',
}) => {
  const navigate = useNavigate();
  const { data: summaries = [], isLoading, error } = useGetPerformanceSummariesQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterEligibility, setFilterEligibility] = useState('');
  const [sortField, setSortField] = useState<'overallRating' | 'employeeName'>('overallRating');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // unique departments
  const departments = useMemo(
    () => [...new Set(summaries.map((s) => s.departmentName).filter(Boolean))] as string[],
    [summaries]
  );

  // Reset to first page when search or filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDepartmentChange = (value: string) => {
    setFilterDepartment(value);
    setCurrentPage(1);
  };

  const handleEligibilityChange = (value: string) => {
    setFilterEligibility(value);
    setCurrentPage(1);
  };

  // filtered + sorted
  const filtered = useMemo(() => {
    let result = summaries;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.employeeName?.toLowerCase().includes(lower) ||
          s.staffNo?.toLowerCase().includes(lower) ||
          s.departmentName?.toLowerCase().includes(lower) ||
          s.positionName?.toLowerCase().includes(lower)
      );
    }
    if (filterDepartment) {
      result = result.filter((s) => s.departmentName === filterDepartment);
    }
    if (filterEligibility) {
      result = result.filter(
        (s) => s.promotionEligibility?.trim().toLowerCase() === filterEligibility.toLowerCase()
      );
    }
    result = [...result].sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortField === 'overallRating') {
        aVal = a.overallRating ?? -1;
        bVal = b.overallRating ?? -1;
      } else {
        aVal = a.employeeName ?? '';
        bVal = b.employeeName ?? '';
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [summaries, searchTerm, filterDepartment, filterEligibility, sortField, sortDir]);

  // Paginated records
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [filtered, currentPage, pageSize]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;

  const handleExportExcel = () => {
    const rows = filtered.map((emp, index) => ({
      No: index + 1,
      Employee: emp.employeeName,
      'Staff No': emp.staffNo || '-',
      Department: emp.departmentName || '-',
      Position: emp.positionName || '-',
      'KPI Score': formatScore(emp.kpiScore),
      'Appraisal Score': formatScore(emp.appraisalScore),
      'Self-Assessment Score': formatScore(emp.selfAssessmentScore),
      'Feedback Score': formatScore(emp.feedbackScore),
      PIP: emp.hasActivePip ? 'Active' : 'None',
      Overall: formatScore(emp.overallRating),
      Eligibility: emp.promotionEligibility,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 24 },
      { wch: 14 },
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
      { wch: 16 },
      { wch: 20 },
      { wch: 16 },
      { wch: 10 },
      { wch: 10 },
      { wch: 18 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Performance Reports');
    XLSX.writeFile(workbook, `performance-report-summary-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const toggleSort = (field: 'overallRating' | 'employeeName') => {
    setCurrentPage(1);
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'overallRating' ? 'desc' : 'asc');
    }
  };

  // Summary stats
  const totalEmployees = summaries.length;
  const eligibleCount = summaries.filter((s) => s.promotionEligible).length;
  const avgRating =
    summaries.filter((s) => s.overallRating != null).length > 0
      ? summaries
          .filter((s) => s.overallRating != null)
          .reduce((sum, s) => sum + (s.overallRating ?? 0), 0) /
        summaries.filter((s) => s.overallRating != null).length
      : 0;
  const activePipCount = summaries.filter((s) => s.hasActivePip).length;

  const deptPerformanceData = useMemo(() => {
    const deptTotals: Record<string, { totalRating: number; count: number }> = {};
    summaries.forEach((s) => {
      if (s.overallRating == null) return;
      const name = s.departmentName || 'Unknown';
      if (!deptTotals[name]) {
        deptTotals[name] = { totalRating: 0, count: 0 };
      }
      deptTotals[name].totalRating += s.overallRating;
      deptTotals[name].count += 1;
    });
    return Object.entries(deptTotals)
      .map(([name, data]) => ({
        name,
        'Avg Rating': Number((data.totalRating / data.count).toFixed(1)),
      }))
      .sort((a, b) => b['Avg Rating'] - a['Avg Rating'])
      .slice(0, 8);
  }, [summaries]);

  const eligibilityChartData = useMemo(() => {
    const counts: Record<string, number> = {
      'Strongly Recommended': 0,
      'Eligible': 0,
      'Possible': 0,
      'Not Eligible': 0,
    };
    summaries.forEach((s) => {
      const eligibility = s.promotionEligibility || 'Not Eligible';
      const norm = eligibility.trim();
      if (norm === 'Strongly Recommended') counts['Strongly Recommended'] += 1;
      else if (norm === 'Eligible') counts['Eligible'] += 1;
      else if (norm === 'Possible') counts['Possible'] += 1;
      else counts['Not Eligible'] += 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  }, [summaries]);

  const ELIGIBILITY_COLORS: Record<string, string> = {
    'Strongly Recommended': '#10b981',
    'Eligible': '#3b82f6',
    'Possible': '#f59e0b',
    'Not Eligible': '#ef4444',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-red-700 dark:text-red-400">
        Failed to load performance report data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Performance Report Summary
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consolidated performance overview for all employees with promotion eligibility
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => { exportPerformanceReportListPdf(filtered) }}
            disabled={filtered.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <FileDown size={18} />
            Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            disabled={filtered.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <FileSpreadsheet size={18} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Total Employees</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalEmployees}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Promotion Eligible</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{eligibleCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Star size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Avg. Rating</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{avgRating.toFixed(1)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Active PIP</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{activePipCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Comparison */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Users size={16} className="text-emerald-600" />
            Average Rating by Department
          </h3>
          <div className="h-[260px]">
            {deptPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="Avg Rating" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {deptPerformanceData.map((_, index) => (
                      <Cell key={`dept-bar-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316'][index % 6]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No rating data available</div>
            )}
          </div>
        </div>

        {/* Promotion Eligibility Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-600" />
            Promotion Eligibility Distribution
          </h3>
          <div className="h-[260px]">
            {eligibilityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={eligibilityChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: '#475569', strokeWidth: 1 }}
                  >
                    {eligibilityChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={ELIGIBILITY_COLORS[entry.name] || '#64748b'}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No eligibility data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, staff no, department..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={filterDepartment}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={filterEligibility}
              onChange={(e) => handleEligibilityChange(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="">All Eligibility</option>
              <option value="Strongly recommended">Strongly Recommended</option>
              <option value="Eligible">Eligible</option>
              <option value="Possible">Possible</option>
              <option value="Not eligible">Not Eligible</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">
                  <button
                    onClick={() => toggleSort('employeeName')}
                    className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    Employee
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="text-center px-3 py-3 font-semibold text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp size={14} />
                    KPI
                  </div>
                </th>
                <th className="text-center px-3 py-3 font-semibold text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-center gap-1">
                    <Award size={14} />
                    Appraisal
                  </div>
                </th>
                <th className="text-center px-3 py-3 font-semibold text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-center gap-1">
                    <FileText size={14} />
                    Self-Assessment
                  </div>
                </th>
                <th className="text-center px-3 py-3 font-semibold text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-center gap-1">
                    <MessageSquare size={14} />
                    Feedback
                  </div>
                </th>
                <th className="text-center px-3 py-3 font-semibold text-slate-500 dark:text-slate-400">PIP</th>
                <th className="text-center px-3 py-3 font-semibold text-slate-500 dark:text-slate-400">
                  <button
                    onClick={() => toggleSort('overallRating')}
                    className="flex items-center justify-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 mx-auto"
                  >
                    Overall
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="text-center px-3 py-3 font-semibold text-slate-500 dark:text-slate-400">Eligibility</th>
                <th className="text-center px-3 py-3 font-semibold text-slate-500 dark:text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No employees found.
                  </td>
                </tr>
              )}
              {paginatedData.map((emp) => (
                <tr
                  key={emp.employeeId}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`${basePath}/${emp.employeeId}`)}
                >
                  {/* Employee */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 overflow-hidden shrink-0">
                        {emp.profilePictureUrl ? (
                          <img
                            src={resolveProfilePictureSrc(emp.profilePictureUrl)}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        ) : (
                          emp.employeeName?.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {emp.employeeName}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                          {emp.staffNo || '—'} · {emp.departmentName || '—'} · {emp.positionName || '—'}
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* KPI */}
                  <td className="text-center px-3 py-3">
                    <span className={`font-bold ${scoreColor(emp.kpiScore)}`}>{formatScore(emp.kpiScore)}</span>
                  </td>
                  {/* Appraisal */}
                  <td className="text-center px-3 py-3">
                    <span className={`font-bold ${scoreColor(emp.appraisalScore)}`}>
                      {formatScore(emp.appraisalScore)}
                    </span>
                  </td>
                  {/* Self Assessment */}
                  <td className="text-center px-3 py-3">
                    <span className={`font-bold ${scoreColor(emp.selfAssessmentScore)}`}>
                      {formatScore(emp.selfAssessmentScore)}
                    </span>
                  </td>
                  {/* Feedback */}
                  <td className="text-center px-3 py-3">
                    <span className={`font-bold ${scoreColor(emp.feedbackScore)}`}>
                      {formatScore(emp.feedbackScore)}
                    </span>
                  </td>
                  {/* PIP */}
                  <td className="text-center px-3 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${pipBadge(
                        emp.hasActivePip
                      )}`}
                    >
                      {emp.hasActivePip ? 'Active' : 'None'}
                    </span>
                  </td>
                  {/* Overall */}
                  <td className="text-center px-3 py-3">
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg ${scoreBg(
                        emp.overallRating
                      )}`}
                    >
                      <Star size={14} className={scoreColor(emp.overallRating)} />
                      <span className={`font-bold ${scoreColor(emp.overallRating)}`}>
                        {formatScore(emp.overallRating)}
                      </span>
                    </div>
                  </td>
                  {/* Eligibility */}
                  <td className="text-center px-3 py-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${eligibilityBadge(
                        emp.promotionEligibility
                      )}`}
                    >
                      {emp.promotionEligibility}
                    </span>
                  </td>
                  {/* Action */}
                  <td className="text-center px-3 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`${basePath}/${emp.employeeId}`);
                      }}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600 transition-colors"
                      title="View Details"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span>
                Showing <strong>{Math.min(filtered.length, (currentPage - 1) * pageSize + 1)}</strong> to{' '}
                <strong>{Math.min(filtered.length, currentPage * pageSize)}</strong> of{' '}
                <strong>{filtered.length}</strong> employees
              </span>
              <div className="flex items-center gap-1">
                <span>Page Size:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-600 dark:text-slate-300 focus:outline-none"
                >
                  {[5, 10, 20, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-bold transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                First
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-bold transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                Previous
              </button>
              <span className="px-3 font-semibold">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-bold transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                Next
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-bold transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rating Scale Reference & Calculation Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Left Column: Rating Scale */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Rating Scale Reference</h3>
          <div className="grid grid-cols-5 gap-2 text-center text-xs mb-4">
            {[
              { rating: 5, level: 'Excellent', eligibility: 'Strongly Recommended', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
              { rating: 4, level: 'Good', eligibility: 'Eligible', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
              { rating: 3, level: 'Meet Requirement', eligibility: 'Possible', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
              { rating: 2, level: 'Needs Improvement', eligibility: 'Not Eligible', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
              { rating: 1, level: 'Unsatisfactory', eligibility: 'Not Eligible', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
            ].map((item) => (
              <div key={item.rating} className={`rounded-lg p-3 ${item.color} flex flex-col justify-between`}>
                <div>
                  <p className="text-lg font-black">{item.rating}</p>
                  <p className="font-bold text-[10px] sm:text-xs leading-tight">{item.level}</p>
                </div>
                <p className="text-[9px] mt-2 opacity-75 font-semibold leading-tight">{item.eligibility}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Promotion Rules</h4>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-disc pl-4">
              <li><strong>Strongly Recommended:</strong> Rating &ge; 4.5</li>
              <li><strong>Eligible:</strong> Rating &ge; 3.5 (Minimum requirement for actual promotion)</li>
              <li><strong>Possible:</strong> Rating &ge; 2.5</li>
              <li><strong>Not Eligible:</strong> Rating &lt; 2.5, or active PIP, or missing evaluation components.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Calculation Formula */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Score Calculation Formula & Recommendations</h3>
          
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-start gap-4 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Overall Rating</span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Average of all completed assessment components (rounded to 1 decimal).</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Overall Rating = (KPI + Appraisal + Self-Assessment + Feedback) ÷ 4</p>
              </div>
              <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">Average</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                <span className="font-semibold text-slate-700 dark:text-slate-300">🎯 KPI Score</span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">Normalized to 5-point scale:<br /><strong>(Total Score ÷ 100) &times; 5</strong></p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                <span className="font-semibold text-slate-700 dark:text-slate-300">🏆 Appraisal Score</span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">Latest manager appraisal normalized to 5.0 (out of 100 or directly out of 5).</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                <span className="font-semibold text-slate-700 dark:text-slate-300">📝 Self-Assessment</span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">Latest employee self-assessment normalized to 5.0.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                <span className="font-semibold text-slate-700 dark:text-slate-300">💬 Feedback Score</span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">Average of all received feedback scores (normalized to 5.0 if necessary).</p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-lg p-2.5 text-[11px] text-amber-800 dark:text-amber-300">
              <p className="font-bold">⚠️ Critical Conditions for Promotion:</p>
              <ul className="list-decimal pl-4 mt-1 space-y-1">
                <li>Must complete <strong>all 4 scores</strong> to be eligible.</li>
                <li>Must not have an <strong>active PIP</strong>.</li>
                <li>Overall rating must be <strong>&ge; 3.5</strong> to launch a promotion.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceReportPage;
