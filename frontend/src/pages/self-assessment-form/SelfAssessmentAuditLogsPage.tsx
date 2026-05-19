import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  FileText,
  Filter,
  Info,
  Search,
} from 'lucide-react';
import { useGetSelfAssessmentAuditLogsQuery } from '../../features/audit/auditApi';

type TargetFilter = 'ALL' | 'FORMS' | 'TEMPLATES';

const formatLabel = (value?: string | null) => (value ? value.replace(/_/g, ' ') : 'N/A');

const contextText = (log: {
  targetType: string;
  employeeName?: string | null;
  employeeId?: string | null;
  formTitle?: string | null;
  templateTitle?: string | null;
  formStatus?: string | null;
  cycleName?: string | null;
}) => {
  if (log.targetType === 'SELF_ASSESSMENT_FORM_TEMPLATE') {
    return log.templateTitle || 'Template reference unavailable';
  }

  const parts = [
    log.employeeName || log.employeeId,
    log.formTitle,
    log.formStatus ? formatLabel(log.formStatus) : null,
    log.cycleName,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' / ') : 'Form reference unavailable';
};

export const SelfAssessmentAuditLogsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<TargetFilter>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: auditLogs, isLoading, isError } = useGetSelfAssessmentAuditLogsQuery();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const filteredLogs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return (auditLogs || []).filter((log) => {
      const matchesSearch =
        !query ||
        [
          log.performedByUserName,
          log.actionType,
          log.description,
          log.employeeName,
          log.employeeId,
          log.formTitle,
          log.templateTitle,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesFilter =
        filterType === 'ALL' ||
        (filterType === 'FORMS' && log.targetType === 'SELF_ASSESSMENT_FORM') ||
        (filterType === 'TEMPLATES' && log.targetType === 'SELF_ASSESSMENT_FORM_TEMPLATE');

      return matchesSearch && matchesFilter;
    });
  }, [auditLogs, searchTerm, filterType]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleExpand = (id: number) => {
    setExpandedRow((current) => (current === id ? null : id));
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATED') || action.includes('SUBMITTED') || action.includes('APPROVED')) {
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    }
    if (action.includes('UPDATED') || action.includes('DRAFT') || action.includes('REVIEWED')) {
      return 'bg-blue-50 text-blue-600 border-blue-100';
    }
    if (action.includes('REJECTED') || action.includes('DELETED')) return 'bg-rose-50 text-rose-600 border-rose-100';
    if (action.includes('REOPENED') || action.includes('RETURN')) return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
  };

  const getTargetIcon = (target: string) => {
    switch (target) {
      case 'SELF_ASSESSMENT_FORM':
        return <FileText size={14} />;
      case 'SELF_ASSESSMENT_FORM_TEMPLATE':
        return <ClipboardList size={14} />;
      default:
        return <Info size={14} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
            <ClipboardList className="text-indigo-600" size={28} />
            Self-Assessment Audit Logs
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Traceability for self-assessment form workflow and template changes.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search performer, employee, form, action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-800 transition-all"
            />
          </div>

          <div className="relative">
            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as TargetFilter)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-800 transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">All Target Types</option>
              <option value="FORMS">Forms</option>
              <option value="TEMPLATES">Templates</option>
            </select>
          </div>

          <div className="flex items-center justify-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              {filteredLogs.length} Records Found
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-100/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
                <th className="py-5 px-6">Date and Time</th>
                <th className="py-5 px-6">Performed By</th>
                <th className="py-5 px-6">Action</th>
                <th className="py-5 px-6">Target Type</th>
                <th className="py-5 px-6">Employee/Form Context</th>
                <th className="py-5 px-6">Description</th>
                <th className="py-5 px-6 text-right w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">
                        Loading Audit Logs...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-rose-500 font-bold uppercase tracking-widest">
                    Failed to load audit logs. Please try again.
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-4">
                      <ClipboardList size={32} />
                    </div>
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
                      No audit logs found matching your filters.
                    </p>
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
                            {log.performedByUserName?.charAt(0) || 'S'}
                          </div>
                          <span className="text-sm font-bold text-slate-800">{log.performedByUserName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border tracking-wider ${getActionColor(log.actionType)}`}>
                          {formatLabel(log.actionType)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                          {getTargetIcon(log.targetType)}
                          <span className="uppercase tracking-tight text-[10px] text-slate-500">
                            {formatLabel(log.targetType)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="max-w-xs">
                          <p className="text-sm font-bold text-slate-700 line-clamp-1">{contextText(log)}</p>
                          {log.employeeId && (
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Staff No. {log.employeeId}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-slate-600 font-medium line-clamp-1 max-w-md">{log.description}</p>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {expandedRow === log.id ? (
                          <ChevronUp size={16} className="text-indigo-600" />
                        ) : (
                          <ChevronDown size={16} className="text-slate-300" />
                        )}
                      </td>
                    </tr>
                    {expandedRow === log.id && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={7} className="p-0 border-b border-slate-100">
                          <div className="p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                  Log Details
                                </h4>
                                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                    {log.description}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                  Context
                                </h4>
                                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  <Detail label="Employee" value={log.employeeName || 'N/A'} />
                                  <Detail label="Staff No." value={log.employeeId || 'N/A'} />
                                  <Detail label="Form" value={log.formTitle || 'N/A'} />
                                  <Detail label="Template" value={log.templateTitle || 'N/A'} />
                                  <Detail label="Status" value={formatLabel(log.formStatus)} />
                                  <Detail label="Cycle" value={log.cycleName || 'N/A'} />
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2">
                              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                                Target ID: <span className="text-slate-900">{log.targetId || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                                User ID: <span className="text-slate-900">{log.performedByUserId || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                                Employee DB ID: <span className="text-slate-900">{log.employeeDbId || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                                Cycle ID: <span className="text-slate-900">{log.cycleId || 'N/A'}</span>
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
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-black rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
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

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="font-black uppercase tracking-widest text-slate-400 text-[10px]">{label}</div>
    <div className="font-bold text-slate-700 mt-1 break-words">{value}</div>
  </div>
);

export default SelfAssessmentAuditLogsPage;
