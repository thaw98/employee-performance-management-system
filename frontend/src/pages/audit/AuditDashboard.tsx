// src/pages/audit/AuditDashboard.tsx
import React, { useState, useMemo } from 'react';
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
    Download,
    Calendar,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Clock,
    UserCheck,
    BarChart3,
    PieChart,
    Search,
    SlidersHorizontal,
    Maximize2,
    Minimize2,
    MoreVertical,
    Copy,
    Share2,
    Printer,
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart as RePieChart,
    Pie,
    Cell,
    Area,
    AreaChart,
} from 'recharts';
import { formatDateTimeWithSeconds } from '../../utils/dateUtils';
import { useGetAuditLogsQuery, useGetAuditSummaryQuery, type AuditFilter } from '../../features/audit/auditApi';

// Professional color palette
const COLORS = {
    primary: '#4F46E5',
    secondary: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    purple: '#8B5CF6',
    pink: '#EC4899',
    indigo: '#6366F1',
    teal: '#14B8A6',
    orange: '#F97316',
};

const CHART_COLORS = [COLORS.primary, COLORS.secondary, COLORS.warning, COLORS.purple, COLORS.pink, COLORS.indigo];

export const AuditDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<AuditFilter>({ page: 0, size: 15 });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [exportLoading, setExportLoading] = useState(false);

    const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useGetAuditLogsQuery(filters);
    const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useGetAuditSummaryQuery();

    // Prepare chart data from logs
    const chartData = useMemo(() => {
        if (!logsData?.content) return [];

        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = subDays(new Date(), 6 - i);
            return {
                date: format(date, 'MMM dd'),
                fullDate: date,
                count: 0,
            };
        });

        logsData.content.forEach((log) => {
            const logDate = new Date(log.createdAt);
            const dayIndex = last7Days.findIndex(
                (d) => format(d.fullDate, 'yyyy-MM-dd') === format(logDate, 'yyyy-MM-dd')
            );
            if (dayIndex !== -1) {
                last7Days[dayIndex].count++;
            }
        });

        return last7Days;
    }, [logsData]);

    // Action type distribution for pie chart
    const actionDistribution = useMemo(() => {
        if (!logsData?.content) return [];

        const distribution: Record<string, number> = {};
        logsData.content.forEach((log) => {
            const action = log.actionType?.split('_')[0] || 'OTHER';
            distribution[action] = (distribution[action] || 0) + 1;
        });

        return Object.entries(distribution)
            .map(([name, value]) => ({ name, value }))
            .slice(0, 5);
    }, [logsData]);

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
        setFilters({ page: 0, size: 15 });
        setDateRange({ start: '', end: '' });
        setShowFilters(false);
    };

    const handleRefresh = () => {
        refetchLogs();
        refetchSummary();
    };

    const handleExport = async () => {
        setExportLoading(true);
        try {
            // Simulate export - replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            alert('Export completed! Check your downloads folder.');
        } finally {
            setExportLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < (logsData?.totalPages || 0)) {
            setFilters(prev => ({ ...prev, page: newPage }));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getActionBadgeClass = (actionType?: string) => {
        if (!actionType) return 'bg-gray-100 text-gray-600 border-gray-200';
        if (actionType.includes('CREATE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (actionType.includes('UPDATE')) return 'bg-blue-50 text-blue-700 border-blue-200';
        if (actionType.includes('DELETE')) return 'bg-red-50 text-red-700 border-red-200';
        if (actionType.includes('LOGIN')) return 'bg-purple-50 text-purple-700 border-purple-200';
        if (actionType.includes('SUBMIT')) return 'bg-amber-50 text-amber-700 border-amber-200';
        return 'bg-gray-50 text-gray-600 border-gray-200';
    };

    const getActionIcon = (actionType?: string) => {
        if (!actionType) return <Activity size={12} />;
        if (actionType.includes('CREATE')) return <CheckCircle size={12} />;
        if (actionType.includes('UPDATE')) return <Activity size={12} />;
        if (actionType.includes('DELETE')) return <AlertCircle size={12} />;
        if (actionType.includes('SUBMIT')) return <CheckCircle size={12} />;
        return <Clock size={12} />;
    };

    const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }: any) => (
        <div className="group relative overflow-hidden rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-slate-800">
            <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-gradient-to-br opacity-10 blur-2xl"
                style={{ background: `linear-gradient(135deg, ${color}, ${color})` }} />
            <div className="relative">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                            {summaryLoading ? '...' : value?.toLocaleString() || 0}
                        </p>
                        {trend && (
                            <p className={`mt-1 text-xs font-medium ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
                            </p>
                        )}
                    </div>
                    <div className="rounded-xl p-3" style={{ backgroundColor: `${color}10` }}>
                        <Icon size={24} style={{ color }} />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header with Quick Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audit Dashboard</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Real-time system activity monitoring and security audit trail
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                        {viewMode === 'table' ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                        {viewMode === 'table' ? 'Grid View' : 'Table View'}
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={exportLoading}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                        {exportLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-transparent" />
                        ) : (
                            <Download size={16} />
                        )}
                        Export
                    </button>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                        <SlidersHorizontal size={16} />
                        Filters
                    </button>
                    <button
                        onClick={() => navigate('/audit/logs')}
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:shadow-md transition-all"
                    >
                        <FileText size={16} />
                        All Audits
                    </button>
                    <button
                        onClick={handleRefresh}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={logsLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Audits" value={summary?.totalAudits} icon={Database} color={COLORS.primary} trend={12} />
                <StatCard title="Today's Activity" value={summary?.todayAudits} icon={Activity} color={COLORS.secondary} />
                <StatCard title="Active Users" value={summary?.uniqueUsers} icon={Users} color={COLORS.info} />
                <StatCard title="Top Action" value={summary?.mostActiveAction?.replace(/_/g, ' ')} icon={TrendingUp} color={COLORS.warning} />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Activity Trend Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">Activity Trend</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Last 7 days audit activity</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400" />
                            <span className="text-xs text-slate-500">7 days</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke={COLORS.primary}
                                strokeWidth={2}
                                fill="url(#colorCount)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Action Distribution Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">Action Distribution</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Top 5 action types</p>
                        </div>
                        <PieChart size={14} className="text-slate-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <RePieChart>
                            <Pie
                                data={actionDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                labelLine={false}
                            >
                                {actionDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                }}
                            />
                        </RePieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Filters Panel - Professional */}
            {showFilters && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter size={18} className="text-indigo-600" />
                                <h3 className="font-semibold text-slate-900 dark:text-white">Advanced Filters</h3>
                            </div>
                            <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="p-5">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Action Type</label>
                                <input
                                    type="text"
                                    placeholder="e.g., EMPLOYEE_CREATED"
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    value={filters.actionType || ''}
                                    onChange={(e) => handleFilterChange('actionType', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Target Type</label>
                                <input
                                    type="text"
                                    placeholder="e.g., EMPLOYEE"
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    value={filters.targetType || ''}
                                    onChange={(e) => handleFilterChange('targetType', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">User ID</label>
                                <input
                                    type="number"
                                    placeholder="Enter user ID"
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    value={filters.userId || ''}
                                    onChange={(e) => handleFilterChange('userId', e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <button
                                    onClick={applyDateRange}
                                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                >
                                    Apply Filters
                                </button>
                                <button
                                    onClick={resetFilters}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">End Date</label>
                                <input
                                    type="date"
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Logs Table - Enhanced */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity size={18} className="text-indigo-600" />
                            <h3 className="font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                {logsData?.totalElements || 0} events
                            </span>
                        </div>
                        {filters.actionType || filters.targetType || filters.startDate ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Active filters:</span>
                                {filters.actionType && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                                        {filters.actionType}
                                        <button onClick={() => handleFilterChange('actionType', '')} className="hover:text-indigo-900">×</button>
                                    </span>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Timestamp</th>
                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Action Type</th>
                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Description</th>
                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Target</th>
                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">User</th>
                                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {logsLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={6} className="px-5 py-4">
                                            <div className="h-12 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
                                        </td>
                                    </tr>
                                ))
                            ) : logsData?.content?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Database size={40} className="text-slate-300" />
                                            <p className="text-sm text-slate-500">No audit logs found</p>
                                            <button onClick={resetFilters} className="text-sm text-indigo-600 hover:text-indigo-700">
                                                Clear filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logsData?.content?.map((log) => (
                                    <tr
                                        key={log.auditId}
                                        className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                        onClick={() => setSelectedLog(log)}
                                    >
                                        <td className="whitespace-nowrap px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <Clock size={12} className="text-slate-400" />
                                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                                    {formatDateTimeWithSeconds(log.createdAt)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getActionBadgeClass(log.actionType)}`}>
                                                {getActionIcon(log.actionType)}
                                                {log.actionType?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="max-w-md truncate px-5 py-3 text-sm text-slate-600 dark:text-slate-300">
                                            {log.description?.length > 80 ? `${log.description.substring(0, 80)}...` : log.description}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                {log.targetType?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <UserCheck size={12} className="text-slate-400" />
                                                <span className="text-sm text-slate-600 dark:text-slate-300">#{log.performedByUserId}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <button className="rounded-lg p-1 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400">
                                                <Eye size={16} />
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
                    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-slate-500">
                            Showing <span className="font-medium text-slate-700">{filters.page * filters.size + 1}</span> to{' '}
                            <span className="font-medium text-slate-700">{Math.min((filters.page + 1) * filters.size, logsData.totalElements)}</span> of{' '}
                            <span className="font-medium text-slate-700">{logsData.totalElements}</span> results
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => handlePageChange(0)}
                                disabled={filters.page === 0}
                                className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700"
                            >
                                First
                            </button>
                            <button
                                onClick={() => handlePageChange(filters.page - 1)}
                                disabled={filters.page === 0}
                                className="rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="flex gap-1">
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
                                            className={`min-w-[34px] rounded-lg px-2 py-1.5 text-sm font-medium transition ${filters.page === pageNum
                                                ? 'bg-indigo-600 text-white shadow-sm'
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
                                className="rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700"
                            >
                                <ChevronRight size={18} />
                            </button>
                            <button
                                onClick={() => handlePageChange(logsData.totalPages - 1)}
                                disabled={filters.page >= logsData.totalPages - 1}
                                className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700"
                            >
                                Last
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
                    <div className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-xl bg-white shadow-2xl dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
                                    <FileText size={18} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Audit Log Details</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700">
                                    <Copy size={16} />
                                </button>
                                <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700">
                                    <Printer size={16} />
                                </button>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-5 p-6">
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                                    <label className="text-xs font-medium uppercase text-slate-500">Audit ID</label>
                                    <p className="mt-1 font-mono text-sm text-slate-900 dark:text-white">#{selectedLog.auditId}</p>
                                </div>
                                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                                    <label className="text-xs font-medium uppercase text-slate-500">Timestamp</label>
                                    <p className="mt-1 text-sm text-slate-900 dark:text-white">{formatDateTimeWithSeconds(selectedLog.createdAt)}</p>
                                </div>
                                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                                    <label className="text-xs font-medium uppercase text-slate-500">Action Type</label>
                                    <div className="mt-1">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getActionBadgeClass(selectedLog.actionType)}`}>
                                            {getActionIcon(selectedLog.actionType)}
                                            {selectedLog.actionType?.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </div>
                                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                                    <label className="text-xs font-medium uppercase text-slate-500">Target</label>
                                    <p className="mt-1 text-sm text-slate-900 dark:text-white">
                                        {selectedLog.targetType?.replace(/_/g, ' ')} #{selectedLog.targetId}
                                    </p>
                                </div>

                            </div>
                            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                                <label className="text-xs font-medium uppercase text-slate-500">Description</label>
                                <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                    {selectedLog.description}
                                </p>
                            </div>
                            {selectedLog.metadataJson && (
                                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                                    <label className="text-xs font-medium uppercase text-slate-500">Metadata</label>
                                    <pre className="mt-2 max-h-60 overflow-auto rounded-lg bg-white p-3 text-xs font-mono text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                        {JSON.stringify(selectedLog.metadataJson, null, 2)}
                                    </pre>
                                </div>)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};



