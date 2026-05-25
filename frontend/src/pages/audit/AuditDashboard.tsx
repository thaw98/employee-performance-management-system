// src/pages/audit/AuditDashboard.tsx
import React, { useState, useEffect } from 'react';


import { useNavigate } from 'react-router-dom';
import {
    Activity,
    Shield,
    Users,
    Database,
    Filter,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Eye,
    X,
    FileText,
    Calendar,
} from 'lucide-react';
import { formatDateTimeWithSeconds } from '../../utils/dateUtils';
import { useGetAuditLogsQuery, useGetAuditSummaryQuery, type AuditFilter } from '../../features/audit/auditApi';

export const AuditDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<AuditFilter>({ page: 0, size: 10 });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useGetAuditLogsQuery(filters);
    const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useGetAuditSummaryQuery();

    const handleFilterChange = (key: keyof AuditFilter, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 0 }));
    };

    const applyDateRange = () => {
        setFilters(prev => ({
            ...prev,
            startDate: dateRange.start || undefined,
            endDate: dateRange.end || undefined,
            page: 0,
        }));
    };

    const resetFilters = () => {
        setFilters({ page: 0, size: 10 });
        setDateRange({ start: '', end: '' });
        setShowFilters(false);
    };

    const handleRefresh = () => {
        refetchLogs();
        refetchSummary();
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < (logsData?.totalPages || 0)) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    const getActionBadgeClass = (actionType?: string) => {
        if (!actionType) return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        if (actionType.includes('CREATE')) return 'bg-green-500/10 text-green-400 border-green-500/20';
        if (actionType.includes('UPDATE')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        if (actionType.includes('DELETE')) return 'bg-red-500/10 text-red-400 border-red-500/20';
        if (actionType.includes('LOGIN')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audit Dashboard</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        System activity and security audit logs
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                        <Filter size={16} />
                        Filters
                    </button>
                    <button
                        onClick={() => navigate('/audit/logs')}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        <FileText size={16} />
                        All Audits
                    </button>
                    <button
                        onClick={handleRefresh}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        title="Refresh"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Audits</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {summaryLoading ? '...' : summary?.totalAudits?.toLocaleString() || 0}
                            </p>
                        </div>
                        <div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-900/20">
                            <Database className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Today's Activity</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {summaryLoading ? '...' : summary?.todayAudits?.toLocaleString() || 0}
                            </p>
                        </div>
                        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                            <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Active Users</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {summaryLoading ? '...' : summary?.uniqueUsers || 0}
                            </p>
                        </div>
                        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                            <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Top Action</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                                {summaryLoading ? '...' : summary?.mostActiveAction || '—'}
                            </p>
                        </div>
                        <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
                            <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Filter Audit Logs</h3>
                        <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400">Action Type</label>
                            <input
                                type="text"
                                placeholder="e.g., EMPLOYEE_CREATED"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                value={filters.actionType || ''}
                                onChange={(e) => handleFilterChange('actionType', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400">Target Type</label>
                            <input
                                type="text"
                                placeholder="e.g., EMPLOYEE"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                value={filters.targetType || ''}
                                onChange={(e) => handleFilterChange('targetType', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400">User ID</label>
                            <input
                                type="number"
                                placeholder="User ID"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                value={filters.userId || ''}
                                onChange={(e) => handleFilterChange('userId', e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <button
                                onClick={applyDateRange}
                                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                            >
                                Apply
                            </button>
                            <button
                                onClick={resetFilters}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400">Start Date</label>
                            <input
                                type="date"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400">End Date</label>
                            <input
                                type="date"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Logs Table */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Timestamp</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Action Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Target Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">User ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {logsLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                                            Loading audit logs...
                                        </div>
                                    </td>
                                </tr>
                            ) : logsData?.content?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                                        No audit logs found
                                    </td>
                                </tr>
                            ) : (
                                logsData?.content?.map((log) => (
                                    <tr
                                        key={log.auditId}
                                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                        onClick={() => setSelectedLog(log)}
                                    >
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                                            {formatDateTimeWithSeconds(log.createdAt)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getActionBadgeClass(log.actionType)}`}>
                                                {log.actionType}
                                            </span>
                                        </td>
                                        <td className="max-w-md truncate px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                                            {log.description}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                                            {log.targetType}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                                            {log.performedByUserId}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!logsLoading && logsData && logsData.totalPages > 0 && (
                    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-700">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            Showing {filters.page * filters.size + 1} to{' '}
                            {Math.min((filters.page + 1) * filters.size, logsData.totalElements)} of {logsData.totalElements} results
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(filters.page - 1)}
                                disabled={filters.page === 0}
                                className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, logsData.totalPages) }, (_, i) => {
                                    let pageNum = i;
                                    if (logsData.totalPages > 5) {
                                        if (filters.page < 3) pageNum = i;
                                        else if (filters.page > logsData.totalPages - 3) pageNum = logsData.totalPages - 5 + i;
                                        else pageNum = filters.page - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`min-w-[32px] rounded-lg px-2 py-1 text-sm transition ${filters.page === pageNum
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {pageNum + 1}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => handlePageChange(filters.page + 1)}
                                disabled={filters.page >= logsData.totalPages - 1}
                                className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedLog(null)}>
                    <div className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white shadow-xl dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Audit Log Details</h2>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4 p-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Audit ID</label>
                                    <p className="mt-1 text-slate-900 dark:text-white">{selectedLog.auditId}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Timestamp</label>
                                    <p className="mt-1 text-slate-900 dark:text-white">{formatDateTimeWithSeconds(selectedLog.createdAt)}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Action Type</label>
                                    <p className="mt-1">
                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getActionBadgeClass(selectedLog.actionType)}`}>
                                            {selectedLog.actionType}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Target Type</label>
                                    <p className="mt-1 text-slate-900 dark:text-white">{selectedLog.targetType}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Target ID</label>
                                    <p className="mt-1 text-slate-900 dark:text-white">{selectedLog.targetId}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Performed By</label>
                                    <p className="mt-1 text-slate-900 dark:text-white">{selectedLog.performedByUserName || `User ID: ${selectedLog.performedByUserId}`}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Description</label>
                                <p className="mt-1 rounded-lg bg-slate-50 p-3 text-slate-900 dark:bg-slate-700/50 dark:text-white">
                                    {selectedLog.description}
                                </p>
                            </div>
                            {selectedLog.metadataJson && (
                                <div>
                                    <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Metadata</label>
                                    <pre className="mt-1 max-h-60 overflow-auto rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-700/50 dark:text-slate-300">
                                        {JSON.stringify(selectedLog.metadataJson, null, 2)}
                                    </pre>
                                </div>
                            )}
                            <div className="grid gap-4 sm:grid-cols-2">
                                {selectedLog.beforeData && (
                                    <div>
                                        <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Before Data</label>
                                        <pre className="mt-1 max-h-60 overflow-auto rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-700/50 dark:text-slate-300">
                                            {selectedLog.beforeData}
                                        </pre>
                                    </div>
                                )}
                                {selectedLog.afterData && (
                                    <div>
                                        <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">After Data</label>
                                        <pre className="mt-1 max-h-60 overflow-auto rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-700/50 dark:text-slate-300">
                                            {selectedLog.afterData}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};