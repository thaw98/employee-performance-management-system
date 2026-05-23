import { useState, useEffect, useMemo } from 'react';
import axios from '../../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { 
  Award, 
  Users, 
  Building2, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  FileSpreadsheet, 
  Download, 
  Search, 
  Loader2 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx-js-style';
import { format } from 'date-fns';
import { exportAppraisalPdf } from '../../utils/exportAppraisalPdf';

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

interface Template {
  id: number;
  name: string;
  maxRating: number;
  categories: Category[];
}

interface Answer {
  id: number;
  rating: number;
  comments?: string;
  question?: Question;
}

interface Assignment {
  id: number;
  employee: {
    id: number;
    employeeName: string;
    employeeId?: string;
    department?: {
      id?: number;
      name: string;
      departmentName?: string;
    };
    position?: {
      id?: number;
      name: string;
    };
  };
  period?: {
    id?: number;
    name: string;
  };
  template?: Template;
  totalScore?: number;
  maxPoints?: number;
  ratingCategory?: string;
  status: string;
  submittedAt?: string;
  answers?: Answer[];
  managerComments?: string;
  managerSignature?: string;
  managerSignedAt?: string;
  hrComments?: string;
  hrSignature?: string;
  hrSignedAt?: string;
}

const CHART_COLORS = ['#1C2841', '#10B981', '#F59E0B', '#3B82F6', '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6'];

export default function AppraisalReportsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedRating, setSelectedRating] = useState('ALL');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAssignments();
    fetchDepartments();
  }, []);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const resp = await axios.get('/appraisal-assignments');
      setAssignments(resp.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch appraisal data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const resp = await axios.get('/departments');
      setDepartments(resp.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Unique periods and rating categories for filter options
  const ratingCategories = useMemo(() => {
    const set = new Set<string>();
    assignments.forEach(a => {
      if (a.ratingCategory) set.add(a.ratingCategory);
    });
    return Array.from(set);
  }, [assignments]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const matchesSearch = 
        a.employee.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = 
        selectedDept === 'ALL' || 
        a.employee.department?.id === Number(selectedDept);
      
      const matchesStatus = 
        selectedStatus === 'ALL' || 
        a.status === selectedStatus;
      
      const matchesRating = 
        selectedRating === 'ALL' || 
        a.ratingCategory === selectedRating;

      return matchesSearch && matchesDept && matchesStatus && matchesRating;
    }).sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  }, [assignments, searchTerm, selectedDept, selectedStatus, selectedRating]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredAssignments.length;
    const completed = filteredAssignments.filter(a => a.status === 'LOCKED' || a.status === 'HR_APPROVED').length;
    
    const scoredAssignments = filteredAssignments.filter(a => a.totalScore != null && a.totalScore > 0);
    const averageScore = scoredAssignments.length > 0
      ? scoredAssignments.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / scoredAssignments.length
      : 0;

    const pending = total - completed;

    return { total, completed, averageScore, pending };
  }, [filteredAssignments]);

  // Recharts: Department distribution & status distribution
  const deptChartData = useMemo(() => {
    const deptTotals: Record<string, { totalScore: number; count: number }> = {};
    
    filteredAssignments.forEach(a => {
      if (a.totalScore == null || a.totalScore <= 0) return;
      const deptName = a.employee.department?.name || a.employee.department?.departmentName || 'Unknown';
      if (!deptTotals[deptName]) {
        deptTotals[deptName] = { totalScore: 0, count: 0 };
      }
      deptTotals[deptName].totalScore += a.totalScore;
      deptTotals[deptName].count += 1;
    });

    return Object.entries(deptTotals)
      .map(([name, data]) => ({
        name,
        'Average Score (%)': Number((data.totalScore / data.count).toFixed(1)),
        count: data.count,
      }))
      .sort((a, b) => b['Average Score (%)'] - a['Average Score (%)'])
      .slice(0, 8);
  }, [filteredAssignments]);

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAssignments.forEach(a => {
      const statusLabel = a.status === 'LOCKED' ? 'FINALIZED' : a.status.replace(/_/g, ' ');
      counts[statusLabel] = (counts[statusLabel] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: count,
    }));
  }, [filteredAssignments]);

  // Export to Excel handler
  const handleExportExcel = () => {
    try {
      const data: any[] = [];
      
      // Header Banner Title
      data.push(['Employee Performance Appraisal Report', '', '', '', '', '', '', '']);
      
      // Meta info
      const todayStr = format(new Date(), 'dd MMM yyyy');
      data.push([
        `Export Date: ${todayStr}`, 
        '', 
        '', 
        '', 
        '', 
        '', 
        `Total Appraisals: ${filteredAssignments.length}`, 
        ''
      ]);

      // Headers row
      data.push([
        'No',
        'Employee Name',
        'Staff Number',
        'Department',
        'Position',
        'Period',
        'Score %',
        'Grade / Category',
        'Status'
      ]);

      // Add Data rows
      filteredAssignments.forEach((a, idx) => {
        data.push([
          idx + 1,
          a.employee.employeeName,
          a.employee.employeeId || 'N/A',
          a.employee.department?.name || 'N/A',
          a.employee.position?.name || 'N/A',
          a.period?.name || 'N/A',
          a.totalScore != null ? `${a.totalScore.toFixed(1)}%` : '-',
          a.ratingCategory || 'N/A',
          a.status === 'LOCKED' ? 'FINALIZED' : a.status.replace(/_/g, ' ')
        ]);
      });

      // Bottom Summary Row
      data.push([
        '', 
        '', 
        '', 
        '', 
        '', 
        '', 
        `Avg Score: ${stats.averageScore.toFixed(1)}%`, 
        '', 
        ''
      ]);

      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // Merges
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // Export Date
        { s: { r: 1, c: 6 }, e: { r: 1, c: 8 } }  // Total count
      ];

      // Columns width
      ws['!cols'] = [
        { wch: 6 },   // No
        { wch: 22 },  // Name
        { wch: 14 },  // ID
        { wch: 18 },  // Department
        { wch: 18 },  // Position
        { wch: 16 },  // Period
        { wch: 12 },  // Score
        { wch: 18 },  // Category
        { wch: 16 }   // Status
      ];

      ws['!pageSetup'] = {
        paperSize: 9, // A4
        orientation: 'landscape'
      };

      // Styling
      const numCols = 9;
      const colLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

      for (let r = 0; r < data.length; r++) {
        for (let c = 0; c < numCols; c++) {
          const ref = `${colLetters[c]}${r + 1}`;
          if (!ws[ref]) {
            ws[ref] = { t: 's', v: '' };
          }
          const cell = ws[ref];

          if (r === 0) {
            cell.s = {
              font: { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
              fill: { fgColor: { rgb: '1C2841' } }, // Navy Header
              alignment: { horizontal: 'center', vertical: 'center' }
            };
          } else if (r === 1) {
            cell.s = {
              font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '1C2841' } },
              fill: { fgColor: { rgb: 'EDF2F7' } },
              alignment: { 
                horizontal: c < 4 ? 'left' : 'right', 
                vertical: 'center' 
              },
              border: {
                bottom: { style: 'thin', color: { rgb: 'CBD5E1' } }
              }
            };
          } else if (r === 2) {
            cell.s = {
              font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: '1C2841' } },
              fill: { fgColor: { rgb: 'E2E8F0' } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: {
                top: { style: 'medium', color: { rgb: '1C2841' } },
                bottom: { style: 'medium', color: { rgb: '1C2841' } }
              }
            };
          } else if (r === data.length - 1) {
            cell.s = {
              font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: '1C2841' } },
              fill: { fgColor: { rgb: 'F8FAFC' } },
              alignment: { horizontal: 'right', vertical: 'center' },
              border: {
                top: { style: 'double', color: { rgb: '94A3B8' } },
                bottom: { style: 'medium', color: { rgb: '1C2841' } }
              }
            };
          } else {
            // Data Rows
            let align = 'left';
            if (c === 0 || c === 2 || c === 8) align = 'center';
            else if (c === 6) align = 'right';

            cell.s = {
              font: { name: 'Segoe UI', sz: 10, color: { rgb: '334155' } },
              alignment: { horizontal: align, vertical: 'center' },
              border: {
                bottom: { style: 'thin', color: { rgb: 'F1F5F9' } }
              }
            };

            // Highlight score col
            if (c === 6 && cell.v && cell.v !== '-') {
              cell.s.font.bold = true;
              cell.s.font.color = { rgb: '10B981' };
            }
          }
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Appraisal Report');
      XLSX.writeFile(wb, `Appraisal_Performance_Report_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      toast.success('Appraisal report exported to Excel successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export Excel report');
    }
  };

  const handleDownloadPdf = async (a: Assignment) => {
    try {
      toast.loading('Generating PDF report...', { id: `pdf-${a.id}` });
      await exportAppraisalPdf(a as any);
      toast.success('PDF report exported successfully', { id: `pdf-${a.id}` });
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF report', { id: `pdf-${a.id}` });
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'HR_APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'LOCKED':
        return 'bg-slate-900 text-white border-slate-900';
      case 'SUBMITTED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'RETURNED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'LOCKED') return 'FINALIZED';
    return status.replace(/_/g, ' ');
  };

  const paginatedAssignments = useMemo(() => {
    return filteredAssignments.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredAssignments, currentPage]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <span className="font-semibold text-sm">Loading appraisal report data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Appraisal Reports Overview</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Analyze, track progress, and export official performance appraisal evaluations.
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          className="flex items-center justify-center gap-2.5 px-6 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <FileSpreadsheet size={16} />
          <span>Export Excel</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total Appraisals</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Award size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.completed}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Completed (Locked/Approved)</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.averageScore.toFixed(1)}%</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Average Score</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Loader2 size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.pending}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Pending (Active)</div>
          </div>
        </div>
      </div>

      {/* Recharts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Comparison */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" />
            Average Appraisal Score by Department
          </h3>
          <div className="h-[260px]">
            {deptChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="Average Score (%)" fill="#1C2841" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No score data available</div>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600" />
            Appraisals Status Distribution
          </h3>
          <div className="h-[260px]">
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  >
                    {statusChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No status data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Filter size={18} className="text-blue-600" />
          <span className="font-black text-xs uppercase tracking-widest text-slate-700">Filter Appraisals</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Search Input */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Search Employee</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Name or Staff ID..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-sm font-medium transition-all outline-none"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Department Selection */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Department</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <select
                value={selectedDept}
                onChange={e => {
                  setSelectedDept(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-[11px] uppercase tracking-widest appearance-none text-slate-600 cursor-pointer hover:bg-slate-100"
              >
                <option value="ALL">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Status</label>
            <div className="relative">
              <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <select
                value={selectedStatus}
                onChange={e => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-[11px] uppercase tracking-widest appearance-none text-slate-600 cursor-pointer hover:bg-slate-100"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="PENDING_MANAGER">PENDING MANAGER</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="RETURNED">RETURNED</option>
                <option value="HR_APPROVED">HR APPROVED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="LOCKED">FINALIZED</option>
              </select>
            </div>
          </div>

          {/* Rating Category Selection */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Rating Grade</label>
            <div className="relative">
              <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <select
                value={selectedRating}
                onChange={e => {
                  setSelectedRating(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-[11px] uppercase tracking-widest appearance-none text-slate-600 cursor-pointer hover:bg-slate-100"
              >
                <option value="ALL">All Grades</option>
                {ratingCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                <th className="p-6">Employee Details</th>
                <th className="p-6">Cycle / Period</th>
                <th className="p-6 text-center">Appraisal Score</th>
                <th className="p-6 text-center">Grade</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredAssignments.length > 0 ? (
                paginatedAssignments.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold">
                          {a.employee.employeeName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{a.employee.employeeName}</div>
                          <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                            {a.employee.employeeId || 'N/A'} • {a.employee.department?.name || 'No Dept'} • <span className="text-blue-500 font-bold">{a.employee.position?.name || 'No Position'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 font-medium text-slate-600">
                      {a.period?.name || 'Annual 2026'}
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-base font-black text-blue-600">
                        {a.totalScore != null ? `${a.totalScore.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-xs font-bold text-slate-700 uppercase">
                        {a.ratingCategory || 'N/A'}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusBadgeStyle(a.status)}`}>
                        {getStatusLabel(a.status)}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDownloadPdf(a)}
                          className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center justify-center"
                          title="Download PDF Report"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-slate-400 font-semibold">
                    No appraisals found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredAssignments.length > itemsPerPage && (
          <div className="p-6 bg-slate-50 flex items-center justify-between border-t border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAssignments.length)} to {Math.min(currentPage * itemsPerPage, filteredAssignments.length)} of {filteredAssignments.length} records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage(prev => prev - 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all bg-white shadow-sm cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: Math.ceil(filteredAssignments.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${currentPage === page ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={currentPage === Math.ceil(filteredAssignments.length / itemsPerPage)}
                onClick={() => {
                  setCurrentPage(prev => prev + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all bg-white shadow-sm cursor-pointer"
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
