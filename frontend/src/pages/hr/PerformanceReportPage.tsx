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
} from 'lucide-react';
import {
  useGetPerformanceSummariesQuery,
  type PerformanceReportSummary,
} from '../../features/performanceReport/performanceReportApi';
import { resolveProfilePictureSrc } from '../../utils/mediaUrl';

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
  switch (eligibility) {
    case 'Strongly Recommended':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'Eligible':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'Possible':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    case 'Not Eligible':
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

export const PerformanceReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: summaries = [], isLoading, error } = useGetPerformanceSummariesQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [sortField, setSortField] = useState<'overallRating' | 'employeeName'>('overallRating');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // unique departments
  const departments = useMemo(
    () => [...new Set(summaries.map((s) => s.departmentName).filter(Boolean))] as string[],
    [summaries]
  );

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
  }, [summaries, searchTerm, filterDepartment, sortField, sortDir]);

  const toggleSort = (field: 'overallRating' | 'employeeName') => {
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Performance Report Summary
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Consolidated performance overview for all employees with promotion eligibility
        </p>
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

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, staff no, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No employees found.
                  </td>
                </tr>
              )}
              {filtered.map((emp) => (
                <tr
                  key={emp.employeeId}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/hr/performance-reports/${emp.employeeId}`)}
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
                        navigate(`/hr/performance-reports/${emp.employeeId}`);
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
      </div>
    </div>
  );
};

export default PerformanceReportPage;
