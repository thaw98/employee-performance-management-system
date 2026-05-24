import React, { useState, useMemo, useEffect } from 'react';
import { 
  useGetEmployeeKpiHistoryQuery, 
  useGetPositionKpiHistoryQuery, 
  useGetDepartmentKpiHistoryQuery,
  useGetKpiHistorySummaryQuery
} from '../../features/kpi/kpiApi';
import { useGetEmployeesQuery } from '../../features/hrEmployeeList/hrEmployeeApi';
import { useGetDepartmentsQuery } from '../../features/department/api/departmentApi';
import { useGetPositionsQuery } from '../../features/position/api/positionApi';
import { Search, History, Download, Calendar, User, Briefcase, Building2, Target, CheckCircle2, AlertCircle, Eye, LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';

export const KpiHistoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  
  // Filters
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [selectedPosId, setSelectedPosId] = useState<number | null>(null);
  const [periodFilter, setPeriodFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedEmployeeId, selectedDeptId, selectedPosId, periodFilter, searchTerm]);

  // Fetch reference data
  const { data: employeesData } = useGetEmployeesQuery({ size: 1000 });
  const { data: departmentsData } = useGetDepartmentsQuery();
  const { data: positionsData } = useGetPositionsQuery({});

  // Fetch Global Summary Data
  const { data: globalSummary, isLoading: loadingGlobal } = useGetKpiHistorySummaryQuery();

  // Fetch Detailed History Data
  const { data: employeeHistory, isLoading: loadingEmployee } = useGetEmployeeKpiHistoryQuery(
    { employeeId: selectedEmployeeId!, period: periodFilter || undefined },
    { skip: activeTab !== 'employee' || !selectedEmployeeId }
  );

  const { data: deptHistory, isLoading: loadingDept } = useGetDepartmentKpiHistoryQuery(
    { departmentId: selectedDeptId!, period: periodFilter || undefined },
    { skip: activeTab !== 'department' || !selectedDeptId }
  );

  const { data: posHistory, isLoading: loadingPos } = useGetPositionKpiHistoryQuery(
    { departmentId: selectedDeptId!, positionId: selectedPosId!, period: periodFilter || undefined },
    { skip: activeTab !== 'position' || !selectedDeptId || !selectedPosId }
  );

  const employees = [...(employeesData?.data?.content || [])].sort((a, b) => 
    (a.employeeName || '').localeCompare(b.employeeName || '')
  );
  const departments = departmentsData?.data || [];
  const positions = positionsData?.data?.content || [];

  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    return employees.filter(emp => 
      emp.employeeName.toLowerCase().startsWith(searchTerm.toLowerCase().charAt(0)) ||
      emp.staffNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const handleViewDetail = (employeeId: number, period: string) => {
    setSelectedEmployeeId(employeeId);
    setPeriodFilter(period);
    setActiveTab('employee');
  };

  const renderStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'SUBMITTED' || s === 'ACTIVE') {
      return (
        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-widest flex items-center gap-1 w-fit">
          <CheckCircle2 size={10} /> {status}
        </span>
      );
    }
    if (s === 'DRAFT') {
      return (
        <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[10px] font-black rounded-full border border-slate-100 uppercase tracking-widest flex items-center gap-1 w-fit">
           {status}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full border border-amber-100 uppercase tracking-widest flex items-center gap-1 w-fit">
        <AlertCircle size={10} /> {status}
      </span>
    );
  };

  const renderPagination = (totalPages: number) => {
    if (totalPages <= 1) return null;
    return (
      <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-black rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-black rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const renderSummaryTable = (data: any[], isLoading: boolean) => {
    if (isLoading) return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest">Loading global history...</div>;
    if (!data || data.length === 0) return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
          <Target size={32} />
        </div>
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No history records found.</p>
      </div>
    );

    const sortedData = [...data].sort((a, b) => (a.employeeName || '').localeCompare(b.employeeName || ''));
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const groups: Record<string, any[]> = {};
    paginatedData.forEach(item => {
      const monthYear = item.createdDate ? format(new Date(item.createdDate), 'MMMM yyyy') : 'Unknown Date';
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(item);
    });

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-100/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
              <th className="py-4 px-6">Employee Name</th>
              <th className="py-4 px-6">Department</th>
              <th className="py-4 px-6">Position</th>
              <th className="py-4 px-6 text-center">Total KPIs</th>
              <th className="py-4 px-6">Assignment Date</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {Object.entries(groups).map(([month, items]) => (
              <React.Fragment key={month}>
                <tr className="bg-slate-50/80">
                  <td colSpan={6} className="py-2.5 px-6 border-y border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-[#2463eb] text-white rounded-md flex items-center justify-center shadow-sm">
                         <Calendar size={12} />
                      </div>
                      <span className="font-black text-slate-800 text-[10px] uppercase tracking-widest">{month}</span>
                      <span className="h-px bg-slate-200 flex-1 mx-4"></span>
                    </div>
                  </td>
                </tr>
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-xs">
                          {item.employeeName?.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-slate-900">{item.employeeName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase">
                        {item.departmentName}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-500">{item.positionName}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="px-3 py-1 bg-[#dbeafe] text-[#2463eb] text-sm font-black rounded-full">
                        {item.totalKpis}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase">
                      {item.createdDate ? format(new Date(item.createdDate), 'dd MMM yyyy') : '-'}
                    </td>
                    <td className="py-4 px-6 text-right">
                       <button 
                         onClick={() => handleViewDetail(item.employeeId, item.period)}
                         className="p-2 text-slate-400 hover:text-[#2463eb] hover:bg-[#eff6ff] rounded-xl transition-all"
                         title="View Details"
                       >
                         <Eye size={18} />
                       </button>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {renderPagination(totalPages)}
      </div>
    );
  };

  const renderHistoryTable = (data: any[], isLoading: boolean) => {
    if (isLoading) return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest">Loading history...</div>;
    if (!data || data.length === 0) return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
          <Target size={32} />
        </div>
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No history records found.</p>
      </div>
    );

    const sortedData = [...data].sort((a, b) => (a.employeeName || '').localeCompare(b.employeeName || ''));
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Grouping Logic for detailed view
    let groupedContent: React.ReactNode;
    
    if (!periodFilter) {
      const groups: Record<string, any[]> = {};
      paginatedData.forEach(item => {
        const monthYear = item.createdDate ? format(new Date(item.createdDate), 'MMMM yyyy') : 'Unknown Date';
        if (!groups[monthYear]) groups[monthYear] = [];
        groups[monthYear].push(item);
      });

      groupedContent = Object.entries(groups).map(([month, items]) => (
        <React.Fragment key={month}>
          <tr className="bg-slate-50/80 group">
            <td colSpan={10} className="py-2.5 px-6 border-y border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#2463eb] text-white rounded-md flex items-center justify-center shadow-sm">
                   <Calendar size={12} />
                </div>
                <span className="font-black text-slate-800 text-[10px] uppercase tracking-widest">{month}</span>
                <span className="h-px bg-slate-200 flex-1 mx-4"></span>
                <span className="px-2 py-0.5 bg-white border border-slate-200 text-[9px] font-black text-slate-400 rounded-full uppercase">
                  {items.length} Records
                </span>
              </div>
            </td>
          </tr>
          {items.map(item => renderRow(item))}
        </React.Fragment>
      ));
    } else {
      groupedContent = paginatedData.map(item => renderRow(item));
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-100/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
              <th className="py-4 px-6">Period</th>
              <th className="py-4 px-6">KPI Name</th>
              <th className="py-4 px-6">Category</th>
              <th className="py-4 px-6">Target</th>
              <th className="py-4 px-6">Actual</th>
              <th className="py-4 px-6 text-center">Weight (%)</th>
              <th className="py-4 px-6 text-center">Score (%)</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">Record</th>
              <th className="py-4 px-6">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {groupedContent}
          </tbody>
        </table>
        {renderPagination(totalPages)}
      </div>
    );
  };

  const renderRow = (item: any) => (
    <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors group ${item.recordStatus === 'Archived' ? 'opacity-60 grayscale-[0.2]' : ''}`}>
      <td className="py-4 px-6 font-bold text-slate-900 text-sm">{item.period}</td>
      <td className="py-4 px-6 text-sm font-medium text-slate-700">{item.name}</td>
      <td className="py-4 px-6">
        <span className="px-2 py-1 bg-[#eff6ff] text-[#2463eb] text-[10px] font-black rounded-lg uppercase">
          {item.category}
        </span>
      </td>
      <td className="py-4 px-6 text-sm text-slate-600">{item.target} {item.unit}</td>
      <td className="py-4 px-6 text-sm font-bold text-slate-900">{item.actual || '-'}</td>
      <td className="py-4 px-6 text-center text-sm font-black text-[#2463eb]">{item.weight}%</td>
      <td className="py-4 px-6 text-center text-sm font-black text-emerald-600">{item.score || '-'}</td>
      <td className="py-4 px-6">{renderStatusBadge(item.status || 'SUBMITTED')}</td>
      <td className="py-4 px-6">
         <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${item.recordStatus === 'Active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
          {item.recordStatus}
        </span>
      </td>
      <td className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase">
        {item.createdDate ? format(new Date(item.createdDate), 'dd MMM yyyy') : '-'}
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">KPI History</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">View and search historical KPI definitions and performance records.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-[#2463eb] hover:bg-[#1d4ed8] text-white rounded-2xl text-xs font-black transition-all shadow-xl shadow-[#dbeafe] uppercase tracking-widest">
          <Download size={16} /> Export History
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'all' ? 'bg-white text-[#2463eb] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <LayoutGrid size={14} /> All History
        </button>
        <button
          onClick={() => setActiveTab('employee')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'employee' ? 'bg-white text-[#2463eb] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <User size={14} /> By Employee
        </button>
        <button
          onClick={() => setActiveTab('department')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'department' ? 'bg-white text-[#2463eb] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Building2 size={14} /> By Department
        </button>
        <button
          onClick={() => setActiveTab('position')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'position' ? 'bg-white text-[#2463eb] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Briefcase size={14} /> By Position
        </button>
      </div>

      {/* Filters Card */}
      {activeTab !== 'all' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
             <Search size={18} className="text-[#2463eb]" />
             <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs">Search Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {activeTab === 'employee' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Employee</label>
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      placeholder="Quick search..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none font-bold text-slate-800"
                    />
                  </div>
                  <select 
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe]"
                    onChange={(val) => setSelectedEmployeeId(Number(val.target.value))}
                    value={selectedEmployeeId || ''}
                  >
                    <option value="">Choose Employee</option>
                    {filteredEmployees.map(emp => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.employeeName} ({emp.staffNo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {(activeTab === 'department' || activeTab === 'position') && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                <select 
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe]"
                  onChange={(e) => setSelectedDeptId(Number(e.target.value))}
                  value={selectedDeptId || ''}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.departmentId} value={dept.departmentId}>{dept.departmentName}</option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'position' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Position</label>
                <select 
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe]"
                  onChange={(e) => setSelectedPosId(Number(e.target.value))}
                  value={selectedPosId || ''}
                >
                  <option value="">Select Position</option>
                  {positions.map(pos => (
                    <option key={pos.positionId} value={pos.positionId}>{pos.positionName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Period (Optional)</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  placeholder="e.g. 2026-2027" 
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none font-bold text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden min-h-[400px]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#dbeafe] text-[#2463eb] rounded-lg flex items-center justify-center">
                <History size={18} />
              </div>
              <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">
                {activeTab === 'all' ? 'Complete KPI History Summary' : activeTab === 'employee' ? 'Employee History Details' : activeTab === 'department' ? 'Department History Details' : 'Position History Details'}
              </h3>
           </div>
        </div>

        <div>
          {activeTab === 'all' ? renderSummaryTable(globalSummary || [], loadingGlobal) :
           activeTab === 'employee' ? (
            selectedEmployeeId ? renderHistoryTable(employeeHistory || [], loadingEmployee) : (
              <div className="p-20 text-center">
                <User size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Please select an employee to view records</p>
              </div>
            )
          ) : activeTab === 'department' ? (
            selectedDeptId ? renderHistoryTable(deptHistory || [], loadingDept) : (
              <div className="p-20 text-center">
                <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Please select a department to view records</p>
              </div>
            )
          ) : (
            selectedDeptId && selectedPosId ? renderHistoryTable(posHistory || [], loadingPos) : (
              <div className="p-20 text-center">
                <Briefcase size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Please select department and position to view records</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default KpiHistoryPage;
