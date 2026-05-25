import React, { useState, useEffect } from 'react';
import { useGetEmployeesKpiStatusQuery } from '../../features/hrEmployeeList/hrEmployeeApi';
import { useGetDepartmentsQuery } from '../../features/department/api/departmentApi';
import { MonthYearPicker } from '../../components/common/MonthYearPicker';
import { useGetPositionsByDepartmentQuery } from '../../features/position/api/positionApi';

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
import {
  useGetPositionsKpiStatusQuery,
  useGetDepartmentsKpiStatusQuery,
  usePerformMonthlyKpiResetMutation
} from '../../features/kpi/kpiApi';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, UserCheck, Target, X, CheckCircle2, AlertCircle, Users, LayoutGrid, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { kpisGradientBr } from '../../features/kpi/kpisTheme';

type ViewMode = 'employee' | 'position' | 'department';

const primaryFocusRing = 'focus:ring-2 focus:ring-[#2463eb]/15 focus:border-[#2463eb]';
const primaryTabActive = 'bg-white text-[#2463eb] shadow-sm';
const primaryActionHover = 'hover:text-[#2463eb] hover:bg-[#eff6ff]';

export const KpiAssignedPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('employee');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<number | undefined>(undefined);
  const [selectedPos, setSelectedPos] = useState<number | undefined>(undefined);
  const [kpiStatus, setKpiStatus] = useState<'DEFINED' | 'NOT_DEFINED' | ''>('');
  const [periodMonth, setPeriodMonth] = useState(getCurrentMonthValue());
  const selectedPeriodLabel = formatMonthYear(periodMonth);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, searchTerm, selectedDept, selectedPos, kpiStatus, periodMonth]);

  // Employee Data
  const { data: employeesResponse, isLoading: employeesLoading } = useGetEmployeesKpiStatusQuery({
    size: 1000,
    search: searchTerm,
    departmentId: selectedDept,
    positionId: selectedPos,
    kpiStatus,
    period: selectedPeriodLabel
  }, { skip: viewMode !== 'employee' });

  // Position Data
  const { data: positionsStatusResponse, isLoading: positionsLoading } = useGetPositionsKpiStatusQuery({
    departmentId: selectedDept,
    period: selectedPeriodLabel
  }, { skip: viewMode !== 'position' });

  // Department Data
  const { data: departmentsStatusResponse, isLoading: deptsLoading } = useGetDepartmentsKpiStatusQuery({
    period: selectedPeriodLabel
  }, { skip: viewMode !== 'department' });

  const { data: departmentsResponse } = useGetDepartmentsQuery();
  const { data: positionsResponse } = useGetPositionsByDepartmentQuery(selectedDept as number, {
    skip: !selectedDept
  });

  const employees = [...(employeesResponse?.data?.content || [])].sort((a, b) => 
    (a.employeeName || '').localeCompare(b.employeeName || '')
  );
  const positionsStatus = positionsStatusResponse || [];
  const departmentsStatus = departmentsStatusResponse || [];
  
  const [performReset, { isLoading: isResetting }] = usePerformMonthlyKpiResetMutation();
  
  const departments = departmentsResponse?.data || [];
  const positionsList = positionsResponse?.data || [];

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDept(undefined);
    setSelectedPos(undefined);
    setKpiStatus('');
  };

  const handleResetKpis = async () => {
    if (window.confirm('Are you sure you want to RESET all KPIs for the organization? \n\nThis will: \n1. Archive all current active KPIs. \n2. Create new blank KPIs for the next month. \n3. Reset all scores and actual values to zero.')) {
      try {
        await performReset().unwrap();
        toast.success('System-wide monthly KPI reset completed successfully!');
      } catch (err: any) {
        toast.error('Failed to reset KPIs. Please check logs.');
      }
    }
  };

  const filteredPositions = positionsStatus.filter(p => 
    (!searchTerm || p.positionName.toLowerCase().includes(searchTerm.toLowerCase()) || p.departmentName.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!kpiStatus || (kpiStatus === 'DEFINED' ? p.hasKpis : !p.hasKpis))
  );

  const filteredDepartments = departmentsStatus.filter(d => 
    (!searchTerm || d.departmentName.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!kpiStatus || (kpiStatus === 'DEFINED' ? d.hasKpis : !d.hasKpis))
  );

  const stats = {
    employee: {
      total: employees.length,
      defined: employees.filter(e => e.hasKpis).length,
      notDefined: employees.filter(e => !e.hasKpis).length
    },
    position: {
      total: positionsStatus.length,
      defined: positionsStatus.filter(p => p.hasKpis).length,
      notDefined: positionsStatus.filter(p => !p.hasKpis).length
    },
    department: {
      total: departmentsStatus.length,
      defined: departmentsStatus.filter(d => d.hasKpis).length,
      notDefined: departmentsStatus.filter(d => !d.hasKpis).length
    }
  };

  const currentStats = stats[viewMode];

  const paginatedEmployees = employees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedPositions = filteredPositions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedDepartments = filteredDepartments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = viewMode === 'employee' 
    ? Math.ceil(employees.length / itemsPerPage)
    : viewMode === 'position' 
    ? Math.ceil(filteredPositions.length / itemsPerPage)
    : Math.ceil(filteredDepartments.length / itemsPerPage);

  const renderPagination = () => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Assigned KPI List</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Overview of KPI assignments and completion status across organization.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Period:</span>
          <MonthYearPicker value={periodMonth} onChange={setPeriodMonth} />
          <button 
            onClick={handleResetKpis}
            disabled={isResetting}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-black transition-all border border-red-100 uppercase tracking-widest disabled:opacity-50 shadow-sm"
          >
            <RotateCcw size={16} className={isResetting ? "animate-spin" : ""} />
            {isResetting ? "Resetting..." : "Reset Monthly KPIs"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => { setViewMode('employee'); handleClearFilters(); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${viewMode === 'employee' ? primaryTabActive : 'text-slate-500 hover:text-slate-700'}`}
        >
          <UserCheck size={14} /> Employee
        </button>
        <button
          onClick={() => { setViewMode('position'); handleClearFilters(); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${viewMode === 'position' ? primaryTabActive : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Users size={14} /> Position
        </button>
        <button
          onClick={() => { setViewMode('department'); handleClearFilters(); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${viewMode === 'department' ? primaryTabActive : 'text-slate-500 hover:text-slate-700'}`}
        >
          <LayoutGrid size={14} /> Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => setKpiStatus('')}
          className={`bg-white p-6 rounded-3xl border transition-all cursor-pointer hover:shadow-md ${kpiStatus === '' ? 'border-[#2463eb] ring-1 ring-[#2463eb]' : 'border-slate-100 shadow-sm'} flex items-center gap-4`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#2463eb]/20 ${kpisGradientBr}`}>
            {viewMode === 'employee' ? <UserCheck size={24} /> : viewMode === 'position' ? <Users size={24} /> : <LayoutGrid size={24} />}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total {viewMode}s</p>
            <p className="text-2xl font-black text-slate-900">{currentStats.total}</p>
          </div>
        </div>

        <div 
          onClick={() => setKpiStatus('DEFINED')}
          className={`bg-white p-6 rounded-3xl border transition-all cursor-pointer hover:shadow-md ${kpiStatus === 'DEFINED' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-100 shadow-sm'} flex items-center gap-4`}
        >
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KPI Defined</p>
            <p className="text-2xl font-black text-emerald-600">{currentStats.defined}</p>
          </div>
        </div>

        <div 
          onClick={() => setKpiStatus('NOT_DEFINED')}
          className={`bg-white p-6 rounded-3xl border transition-all cursor-pointer hover:shadow-md ${kpiStatus === 'NOT_DEFINED' ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-100 shadow-sm'} flex items-center gap-4`}
        >
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Not Defined</p>
            <p className="text-2xl font-black text-rose-600">{currentStats.notDefined}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 space-y-4 bg-slate-50/50">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder={`Search ${viewMode}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none font-medium ${primaryFocusRing}`}
              />
            </div>

            <div className="flex flex-[2] gap-4 w-full">
              {viewMode !== 'department' && (
                <select
                  value={selectedDept || ''}
                  onChange={(e) => {
                    setSelectedDept(e.target.value ? Number(e.target.value) : undefined);
                    setSelectedPos(undefined);
                  }}
                  className={`flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none font-medium appearance-none ${primaryFocusRing}`}
                >
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>
                  ))}
                </select>
              )}

              {viewMode === 'employee' && (
                <select
                  value={selectedPos || ''}
                  onChange={(e) => setSelectedPos(e.target.value ? Number(e.target.value) : undefined)}
                  disabled={!selectedDept}
                  className={`flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none font-medium appearance-none disabled:bg-slate-50 disabled:text-slate-400 ${primaryFocusRing}`}
                >
                  <option value="">All Positions</option>
                  {positionsList.map(p => (
                    <option key={p.positionId} value={p.positionId}>{p.positionName}</option>
                  ))}
                </select>
              )}

              <div className="flex bg-slate-100 p-1 rounded-2xl flex-1">
                <button
                  onClick={() => setKpiStatus('')}
                  className={`flex-1 px-4 py-1.5 rounded-xl text-xs font-black transition-all uppercase tracking-tight ${kpiStatus === '' ? primaryTabActive : 'text-slate-500 hover:text-slate-700'}`}
                >
                  All Status
                </button>
                <button
                  onClick={() => setKpiStatus('DEFINED')}
                  className={`flex-1 px-4 py-1.5 rounded-xl text-xs font-black transition-all uppercase tracking-tight ${kpiStatus === 'DEFINED' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Defined
                </button>
                <button
                  onClick={() => setKpiStatus('NOT_DEFINED')}
                  className={`flex-1 px-4 py-1.5 rounded-xl text-xs font-black transition-all uppercase tracking-tight ${kpiStatus === 'NOT_DEFINED' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Not Defined
                </button>
              </div>
            </div>

            {(searchTerm || selectedDept || selectedPos || kpiStatus) && (
              <button
                onClick={handleClearFilters}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Clear Filters"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                {viewMode === 'employee' ? (
                  <>
                    <th className="py-4 px-6">Employee Info</th>
                    <th className="py-4 px-6">Department</th>
                    <th className="py-4 px-6">Position</th>
                  </>
                ) : viewMode === 'position' ? (
                  <>
                    <th className="py-4 px-6">Position Name</th>
                    <th className="py-4 px-6">Department</th>
                  </>
                ) : (
                  <th className="py-4 px-6">Department Name</th>
                )}
                <th className="py-4 px-6">Assignment Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {employeesLoading || positionsLoading || deptsLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest">Loading...</td>
                </tr>
              ) : (
                <>
                  {viewMode === 'employee' && paginatedEmployees.map((emp) => (
                    <tr key={emp.employeeId} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold overflow-hidden">
                            {emp.profilePictureUrl ? (
                              <img src={emp.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              emp.employeeName.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{emp.employeeName}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{emp.staffNo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-tight">
                          {emp.departmentName}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-500">
                        {emp.positionName}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge hasKpis={!!emp.hasKpis} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/hr/kpi-detail?employeeId=${emp.employeeId}`)}
                            className={`p-2 text-slate-400 rounded-xl transition-all ${primaryActionHover}`}
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => navigate(`/hr/kpi-management?employeeId=${emp.employeeId}`)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Manage KPIs"
                          >
                            <Target size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {viewMode === 'position' && paginatedPositions.map((pos, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                        {pos.positionName}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-tight">
                          {pos.departmentName}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge hasKpis={pos.hasKpis} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/hr/position-kpi-detail?departmentId=${pos.departmentId}&positionId=${pos.positionId}`)}
                            className={`p-2 text-slate-400 rounded-xl transition-all ${primaryActionHover}`}
                            title="View Position KPI Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => navigate(`/hr/kpi-management?departmentId=${pos.departmentId}&positionId=${pos.positionId}&mode=position`)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Manage Position KPIs"
                          >
                            <Target size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {viewMode === 'department' && paginatedDepartments.map((dept, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                        {dept.departmentName}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge hasKpis={dept.hasKpis} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/hr/department-kpi-detail?departmentId=${dept.departmentId}`)}
                            className={`p-2 text-slate-400 rounded-xl transition-all ${primaryActionHover}`}
                            title="View Department KPI Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => navigate(`/hr/kpi-management?departmentId=${dept.departmentId}&mode=department`)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Manage Department KPIs"
                          >
                            <Target size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {((viewMode === 'employee' && employees.length === 0) ||
                    (viewMode === 'position' && filteredPositions.length === 0) ||
                    (viewMode === 'department' && filteredDepartments.length === 0)) && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                            <Target size={32} />
                          </div>
                          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No Records Found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
          {renderPagination()}
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ hasKpis: boolean }> = ({ hasKpis }) => (
  hasKpis ? (
    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-widest flex items-center gap-1.5 w-fit">
      <CheckCircle2 size={10} />
      DEFINED
    </span>
  ) : (
    <span className="px-2.5 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full border border-rose-100 uppercase tracking-widest flex items-center gap-1.5 w-fit">
      <AlertCircle size={10} />
      NOT DEFINED
    </span>
  )
);
