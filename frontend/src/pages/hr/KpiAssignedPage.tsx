import React, { useState } from 'react';
import { useGetEmployeesKpiStatusQuery } from '../../features/hrEmployeeList/hrEmployeeApi';
import { useGetDepartmentsQuery } from '../../features/department/api/departmentApi';
import { useGetPositionsByDepartmentQuery } from '../../features/position/api/positionApi';
import {
  useGetPositionsKpiStatusQuery,
  useGetDepartmentsKpiStatusQuery
} from '../../features/kpi/kpiApi';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, UserCheck, Target, X, CheckCircle2, AlertCircle, Users, LayoutGrid } from 'lucide-react';

type ViewMode = 'employee' | 'position' | 'department';

export const KpiAssignedPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('employee');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<number | undefined>(undefined);
  const [selectedPos, setSelectedPos] = useState<number | undefined>(undefined);
  const [kpiStatus, setKpiStatus] = useState<'DEFINED' | 'NOT_DEFINED' | ''>('');
  const [period, setPeriod] = useState('2026-2027');

  // Employee Data
  const { data: employeesResponse, isLoading: employeesLoading } = useGetEmployeesKpiStatusQuery({
    size: 1000,
    search: searchTerm,
    departmentId: selectedDept,
    positionId: selectedPos,
    kpiStatus,
    period
  }, { skip: viewMode !== 'employee' });

  // Position Data
  const { data: positionsStatusResponse, isLoading: positionsLoading } = useGetPositionsKpiStatusQuery({
    departmentId: selectedDept,
    period
  }, { skip: viewMode !== 'position' });

  // Department Data
  const { data: departmentsStatusResponse, isLoading: deptsLoading } = useGetDepartmentsKpiStatusQuery({
    period
  }, { skip: viewMode !== 'department' });

  const { data: departmentsResponse } = useGetDepartmentsQuery();
  const { data: positionsResponse } = useGetPositionsByDepartmentQuery(selectedDept as number, {
    skip: !selectedDept
  });

  const employees = employeesResponse?.data?.content || [];
  const positionsStatus = positionsStatusResponse || [];
  const departmentsStatus = departmentsStatusResponse || [];
  
  const departments = departmentsResponse?.data || [];
  const positionsList = positionsResponse?.data || [];

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDept(undefined);
    setSelectedPos(undefined);
    setKpiStatus('');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Assigned KPI List</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Overview of KPI assignments and completion status across organization.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Period:</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="2024-2025">2024-2025</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => { setViewMode('employee'); handleClearFilters(); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${viewMode === 'employee' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <UserCheck size={14} /> Employee
        </button>
        <button
          onClick={() => { setViewMode('position'); handleClearFilters(); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${viewMode === 'position' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Users size={14} /> Position
        </button>
        <button
          onClick={() => { setViewMode('department'); handleClearFilters(); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${viewMode === 'department' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <LayoutGrid size={14} /> Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
            {viewMode === 'employee' ? <UserCheck size={24} /> : viewMode === 'position' ? <Users size={24} /> : <LayoutGrid size={24} />}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total {viewMode}s</p>
            <p className="text-2xl font-black text-slate-900">{currentStats.total}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KPI Defined</p>
            <p className="text-2xl font-black text-emerald-600">{currentStats.defined}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
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
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none font-medium"
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
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none font-medium appearance-none"
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
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none font-medium appearance-none disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">All Positions</option>
                  {positionsList.map(p => (
                    <option key={p.positionId} value={p.positionId}>{p.positionName}</option>
                  ))}
                </select>
              )}

              <select
                value={kpiStatus}
                onChange={(e) => setKpiStatus(e.target.value as any)}
                className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none font-medium appearance-none"
              >
                <option value="">All KPI Status</option>
                <option value="DEFINED">KPI Defined</option>
                <option value="NOT_DEFINED">Not Defined</option>
              </select>
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
                  {viewMode === 'employee' && employees.map((emp) => (
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
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
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

                  {viewMode === 'position' && filteredPositions.map((pos, idx) => (
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
                        <button
                          onClick={() => navigate(`/hr/kpi-management?departmentId=${pos.departmentId}&positionId=${pos.positionId}&mode=position`)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Manage Position KPIs"
                        >
                          <Target size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {viewMode === 'department' && filteredDepartments.map((dept, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                        {dept.departmentName}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge hasKpis={dept.hasKpis} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => navigate(`/hr/kpi-management?departmentId=${dept.departmentId}&mode=department`)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Manage Department KPIs"
                        >
                          <Target size={18} />
                        </button>
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
