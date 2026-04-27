import React, { useState } from 'react';
import { useGetEmployeesQuery } from '../../features/hrEmployeeList/hrEmployeeApi';
import { useGetDepartmentsQuery } from '../../features/department/api/departmentApi';
import { useGetPositionsByDepartmentQuery } from '../../features/position/api/positionApi';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, UserCheck, Target, X } from 'lucide-react';

export const KpiAssignedPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<number | undefined>(undefined);
  const [selectedPos, setSelectedPos] = useState<number | undefined>(undefined);

  const { data: employeesResponse, isLoading } = useGetEmployeesQuery({
    size: 1000,
    search: searchTerm,
    departmentId: selectedDept,
    positionId: selectedPos
  });

  const { data: departmentsResponse } = useGetDepartmentsQuery();
  const { data: positionsResponse } = useGetPositionsByDepartmentQuery(selectedDept as number, {
    skip: !selectedDept
  });

  const employees = employeesResponse?.data?.content || [];
  const departments = departmentsResponse?.data || [];
  const positions = positionsResponse?.data || [];

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDept(undefined);
    setSelectedPos(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Assigned KPI List</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Overview of KPI assignments and completion status across organization.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtered Employees</p>
            <p className="text-2xl font-black text-slate-900">{employees.length}</p>
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
                placeholder="Search employee name, ID or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none font-medium"
              />
            </div>

            <div className="flex flex-1 gap-4 w-full">
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

              <select
                value={selectedPos || ''}
                onChange={(e) => setSelectedPos(e.target.value ? Number(e.target.value) : undefined)}
                disabled={!selectedDept}
                className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none font-medium appearance-none disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">All Positions</option>
                {positions.map(p => (
                  <option key={p.positionId} value={p.positionId}>{p.positionName}</option>
                ))}
              </select>
            </div>

            {(searchTerm || selectedDept || selectedPos) && (
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
                <th className="py-4 px-6">Employee Info</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6">Position</th>
                <th className="py-4 px-6">KPI Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest">Loading...</td>
                </tr>
              ) : employees.map((emp) => (
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
                    <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full border border-amber-100 uppercase tracking-tighter">
                      ACTIVE
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => navigate(`/hr/kpi-detail?employeeId=${emp.employeeId}`)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all flex items-center gap-2 ml-auto"
                    >
                      <Eye size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:inline">Detail</span>
                    </button>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <Target size={32} />
                      </div>
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No Employees Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
