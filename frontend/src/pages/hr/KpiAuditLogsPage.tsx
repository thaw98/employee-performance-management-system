import React, { useState, useMemo, useEffect } from 'react';
import { useGetKpiAuditLogsQuery } from '../../features/audit/auditApi';
import { 
  ClipboardList, 
  Search, 
  Calendar, 
  User, 
  Target, 
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  Activity,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

export const KpiAuditLogsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const { data: auditLogs, isLoading, isError } = useGetKpiAuditLogsQuery();

  const filteredLogs = useMemo(() => {
    if (!auditLogs) return [];
    return auditLogs.filter(log => {
      const matchesSearch = 
        log.performedByUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actionType.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterType === 'ALL' || log.targetType === filterType;
      
      return matchesSearch && matchesFilter;
    });
  }, [auditLogs, searchTerm, filterType]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleExpand = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATED') || action.includes('SUBMITTED')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (action.includes('UPDATED') || action.includes('DRAFT')) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (action.includes('DELETED')) return 'bg-rose-50 text-rose-600 border-rose-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
  };

  const getTargetIcon = (target: string) => {
    switch (target) {
      case 'EMPLOYEE_KPI': return <User size={14} />;
      case 'POSITION_KPI': return <Target size={14} />;
      case 'DEPARTMENT_KPI': return <Activity size={14} />;
      default: return <Info size={14} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
            <ClipboardList className="text-indigo-600" size={28} />
            KPI Audit Logs
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Traceability for all KPI-related changes in the system.</p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              placeholder="Search by user or description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-800 transition-all"
            />
          </div>

          <div className="relative">
            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-800 transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">All Target Types</option>
              <option value="EMPLOYEE_KPI">Employee KPIs</option>
              <option value="POSITION_KPI">Position KPIs</option>
              <option value="DEPARTMENT_KPI">Department KPIs</option>
            </select>
          </div>

          <div className="flex items-center justify-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              {filteredLogs.length} Records Found
            </span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-100/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
                <th className="py-5 px-6">Date and Time</th>
                <th className="py-5 px-6">Performed By</th>
                <th className="py-5 px-6">Action</th>
                <th className="py-5 px-6">Target Type</th>
                <th className="py-5 px-6">Description</th>
                <th className="py-5 px-6 text-right w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Loading Audit Logs...</p>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-rose-500 font-bold uppercase tracking-widest">
                    Failed to load audit logs. Please try again.
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-4">
                      <ClipboardList size={32} />
                    </div>
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No audit logs found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr 
                      onClick={() => toggleExpand(log.id)}
                      className={`hover:bg-slate-50/80 transition-all cursor-pointer group ${expandedRow === log.id ? 'bg-indigo-50/30' : ''}`}
                    >
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">
                            {format(new Date(log.createdAt), 'dd MMM yyyy')}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                            <Clock size={10} /> {format(new Date(log.createdAt), 'HH:mm:ss')}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-xs border border-slate-200">
                            {log.performedByUserName?.charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-slate-800">{log.performedByUserName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border tracking-wider ${getActionColor(log.actionType)}`}>
                          {log.actionType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                          {getTargetIcon(log.targetType)}
                          <span className="uppercase tracking-tight text-[10px] text-slate-500">
                            {log.targetType.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-slate-600 font-medium line-clamp-1 max-w-md">
                          {log.description}
                        </p>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {expandedRow === log.id ? <ChevronUp size={16} className="text-indigo-600" /> : <ChevronDown size={16} className="text-slate-300" />}
                      </td>
                    </tr>
                    {expandedRow === log.id && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={6} className="p-0 border-b border-slate-100">
                          <div className="p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-1 gap-6">
                              <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Log Details</h4>
                                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                    {log.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2">
                              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                                Target ID: <span className="text-slate-900">{log.targetId || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                                User ID: <span className="text-slate-900">{log.performedByUserId || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && !isError && totalPages > 1 && (
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
        )}
      </div>
    </div>
  );
};

export default KpiAuditLogsPage;
