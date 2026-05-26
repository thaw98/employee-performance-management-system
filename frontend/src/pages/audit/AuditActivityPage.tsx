// src/pages/audit/AuditActivityPage.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Activity,
    Pause,
    Play,
    RefreshCw,
    Search,
    Users,
    Cpu,
    AlertTriangle,
    Database,
    Shield,
    X,
    CheckCircle2,
    Server,
    Clock,
    Filter,
    SlidersHorizontal,
    UserCheck,
    Terminal,
    ArrowRight
} from 'lucide-react';
import {
    useGetActivityEventsQuery,
    useGetActivitySessionsQuery,
    useGetActivityHealthQuery,
    useGetActivitySecurityAlertsQuery,
    useGetActivityResourcesQuery,
} from '../../features/audit/auditApi';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { formatDateTimeWithSeconds } from '../../utils/dateUtils';
import { format, parseISO } from 'date-fns';

export const AuditActivityPage: React.FC = () => {
    // Polling State (5 seconds interval)
    const [isPaused, setIsPaused] = useState(false);
    const pollingInterval = isPaused ? 0 : 5000;

    // Filters State
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [eventTypeFilter, setEventTypeFilter] = useState('');
    const [severityFilter, setSeverityFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');

    // Track "New" events
    const [knownEventIds, setKnownEventIds] = useState<Set<number>>(new Set());
    const [newIndicators, setNewIndicators] = useState<Set<number>>(new Set());
    const isFirstLoad = useRef(true);

    // Queries
    const { data: events, refetch: refetchEvents, isFetching: eventsFetching } = useGetActivityEventsQuery(undefined, { pollingInterval });
    const { data: sessions, refetch: refetchSessions, isFetching: sessionsFetching } = useGetActivitySessionsQuery(undefined, { pollingInterval });
    const { data: health, refetch: refetchHealth, isFetching: healthFetching } = useGetActivityHealthQuery(undefined, { pollingInterval });
    const { data: alerts, refetch: refetchAlerts, isFetching: alertsFetching } = useGetActivitySecurityAlertsQuery(undefined, { pollingInterval });
    const { data: resources, refetch: refetchResources, isFetching: resourcesFetching } = useGetActivityResourcesQuery(undefined, { pollingInterval });

    // Track incoming new events
    useEffect(() => {
        if (events && events.length > 0) {
            if (isFirstLoad.current) {
                // Initialize known IDs
                const ids = new Set(events.map(e => e.auditId));
                setKnownEventIds(ids);
                isFirstLoad.current = false;
            } else {
                // Find new IDs
                const currentIds = events.map(e => e.auditId);
                const newlyArrived = currentIds.filter(id => !knownEventIds.has(id));
                if (newlyArrived.length > 0) {
                    setNewIndicators(prev => {
                        const updated = new Set(prev);
                        newlyArrived.forEach(id => updated.add(id));
                        return updated;
                    });
                    setKnownEventIds(prev => {
                        const updated = new Set(prev);
                        newlyArrived.forEach(id => updated.add(id));
                        return updated;
                    });
                }
            }
        }
    }, [events, knownEventIds]);

    // Manual Refresh
    const handleRefreshAll = () => {
        refetchEvents();
        refetchSessions();
        refetchHealth();
        refetchAlerts();
        refetchResources();
    };

    // Clear Indicators
    const handleClearIndicators = () => {
        setNewIndicators(new Set());
    };

    // Reset Filters
    const handleResetFilters = () => {
        setSearchQuery('');
        setEventTypeFilter('');
        setSeverityFilter('');
        setUserFilter('');
        setRoleFilter('');
        setModuleFilter('');
        setStartDateFilter('');
        setEndDateFilter('');
    };

    // Filter events
    const filteredEvents = useMemo(() => {
        if (!events) return [];
        return events.filter(event => {
            // General text search (description, target type, action type, user name)
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const desc = (event.description || '').toLowerCase();
                const action = (event.actionType || '').toLowerCase();
                const target = (event.targetType || '').toLowerCase();
                const user = (event.performedByUserName || '').toLowerCase();
                if (!desc.includes(query) && !action.includes(query) && !target.includes(query) && !user.includes(query)) {
                    return false;
                }
            }
            // Event Type (Action Type)
            if (eventTypeFilter && !event.actionType?.toLowerCase().includes(eventTypeFilter.toLowerCase())) {
                return false;
            }
            // User filter
            if (userFilter) {
                const matchName = event.performedByUserName?.toLowerCase().includes(userFilter.toLowerCase());
                const matchId = event.performedByUserId?.toString() === userFilter;
                if (!matchName && !matchId) return false;
            }
            // Module (Target Type)
            if (moduleFilter && !event.targetType?.toLowerCase().includes(moduleFilter.toLowerCase())) {
                return false;
            }
            // Date Filter
            if (startDateFilter) {
                const start = new Date(startDateFilter);
                const eventDate = new Date(event.createdAt);
                if (eventDate < start) return false;
            }
            if (endDateFilter) {
                const end = new Date(endDateFilter);
                const eventDate = new Date(event.createdAt);
                if (eventDate > end) return false;
            }
            return true;
        });
    }, [events, searchQuery, eventTypeFilter, userFilter, moduleFilter, startDateFilter, endDateFilter]);

    // Filter alerts
    const filteredAlerts = useMemo(() => {
        if (!alerts) return [];
        return alerts.filter(alert => {
            if (severityFilter && alert.severity !== severityFilter.toUpperCase()) {
                return false;
            }
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const msg = (alert.message || '').toLowerCase();
                const ip = (alert.ipAddress || '').toLowerCase();
                const user = (alert.username || '').toLowerCase();
                if (!msg.includes(query) && !ip.includes(query) && !user.includes(query)) {
                    return false;
                }
            }
            return true;
        });
    }, [alerts, severityFilter, searchQuery]);

    // Format chart date
    const formattedChartData = useMemo(() => {
        if (!resources) return [];
        return resources.map(m => {
            try {
                return {
                    ...m,
                    timeLabel: format(parseISO(m.timestamp), 'HH:mm:ss')
                };
            } catch (e) {
                return {
                    ...m,
                    timeLabel: m.timestamp
                };
            }
        });
    }, [resources]);

    return (
        <div className="space-y-6">
            {/* Header Dashboard Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Activity className="h-7 w-7 text-indigo-600 animate-pulse" />
                        Activity Monitor
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Live real-time stream monitor, security logging, and resource inspector
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    {/* Live indicator tag */}
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm border ${isPaused
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${isPaused ? 'bg-slate-400' : 'bg-emerald-500 animate-ping'
                            }`} />
                        {isPaused ? 'Feed Paused' : 'Monitoring Live'}
                    </div>

                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${isPaused
                                ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-md'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                        title={isPaused ? 'Resume monitoring stream' : 'Pause monitoring stream'}
                    >
                        {isPaused ? <Play size={16} /> : <Pause size={16} />}
                        {isPaused ? 'Resume' : 'Pause'}
                    </button>

                    <button
                        onClick={handleRefreshAll}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        title="Force reload all logs"
                    >
                        <RefreshCw size={16} className={eventsFetching || sessionsFetching || healthFetching ? 'animate-spin' : ''} />
                        Refresh
                    </button>

                    {newIndicators.size > 0 && (
                        <button
                            onClick={handleClearIndicators}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-2 text-sm font-semibold hover:bg-indigo-100 animate-bounce"
                        >
                            Clear New ({newIndicators.size})
                        </button>
                    )}

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${showFilters ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <SlidersHorizontal size={16} />
                        Filters
                    </button>
                </div>
            </div>

            {/* Collapsible Filter Panel */}
            {showFilters && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-indigo-600" />
                            <h3 className="font-semibold text-slate-900">Search & Stream Filters</h3>
                        </div>
                        <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">General Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search details..."
                                    className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Event Action Type</label>
                            <input
                                type="text"
                                placeholder="e.g., UPDATE, CREATE"
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={eventTypeFilter}
                                onChange={(e) => setEventTypeFilter(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">User ID / Username</label>
                            <input
                                type="text"
                                placeholder="Search user..."
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={userFilter}
                                onChange={(e) => setUserFilter(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Target Module</label>
                            <input
                                type="text"
                                placeholder="e.g., KPI, APPRAISAL"
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={moduleFilter}
                                onChange={(e) => setModuleFilter(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Alert Severity</label>
                            <select
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)}
                            >
                                <option value="">All Severities</option>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Start Time Limit</label>
                            <input
                                type="datetime-local"
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={startDateFilter}
                                onChange={(e) => setStartDateFilter(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">End Time Limit</label>
                            <input
                                type="datetime-local"
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={endDateFilter}
                                onChange={(e) => setEndDateFilter(e.target.value)}
                            />
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                onClick={handleResetFilters}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Section 3: System Health Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Uptime SLA</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">{health ? `${health.uptime}%` : '...'}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                        <CheckCircle2 size={24} />
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System CPU</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">{health ? `${health.cpuUsage.toFixed(1)}%` : '...'}</p>
                    </div>
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                        <Cpu size={24} />
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">JVM Memory</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">{health ? `${health.memoryUsage.toFixed(1)}%` : '...'}</p>
                    </div>
                    <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                        <Server size={24} />
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Threads</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">{health ? health.activeThreads : '...'}</p>
                    </div>
                    <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                        <Terminal size={24} />
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">DB Pool Usage</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            {health?.dbPool ? `${health.dbPool.activeConnections}/${health.dbPool.maxConnections}` : '...'}
                        </p>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                        <Database size={24} />
                    </div>
                </div>
            </div>

            {/* Main Streaming Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                {/* Real-time Event Streaming - takes 2 cols on wide screen */}
                <div className="lg:col-span-2 flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[500px]">
                    <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <Activity size={18} className="text-indigo-600" />
                            <h3 className="font-semibold text-slate-900">1. Real-time Event Stream</h3>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 font-medium">
                                {filteredEvents.length} events filtered
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Clock size={12} />
                            <span>Auto-polling feed</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[500px] p-5 space-y-3 custom-scrollbar">
                        {eventsFetching && events?.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-slate-400 gap-2 py-20">
                                <RefreshCw className="animate-spin" />
                                Loading Event Stream...
                            </div>
                        ) : filteredEvents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                                <Terminal size={32} className="text-slate-300 mb-2" />
                                <p className="text-sm">No streaming activities found matching filters.</p>
                            </div>
                        ) : (
                            filteredEvents.map(event => {
                                const isNew = newIndicators.has(event.auditId);
                                return (
                                    <div
                                        key={event.auditId}
                                        className={`group relative flex items-start gap-4 p-4 rounded-xl border transition-all ${isNew
                                                ? 'bg-indigo-50/40 border-indigo-100 hover:bg-indigo-50/60 shadow-sm'
                                                : 'bg-white border-slate-100 hover:bg-slate-50/80 hover:border-slate-200'
                                            }`}
                                    >
                                        {/* New indicator tag */}
                                        {isNew && (
                                            <span className="absolute top-3 right-3 rounded bg-indigo-600 text-[9px] font-extrabold text-white px-1.5 py-0.5 shadow-sm">
                                                NEW
                                            </span>
                                        )}

                                        <div className={`rounded-xl p-2.5 shrink-0 ${event.actionType?.includes('CREATE') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                event.actionType?.includes('UPDATE') ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                    event.actionType?.includes('DELETE') ? 'bg-red-50 text-red-600 border border-red-100' :
                                                        'bg-slate-50 text-slate-600 border border-slate-100'
                                            }`}>
                                            <Terminal size={16} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                <span className="text-xs font-bold text-slate-900">
                                                    {event.actionType?.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-[10px] text-slate-400">on</span>
                                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                                    {event.targetType?.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-slate-600 break-words leading-relaxed">
                                                {event.description}
                                            </p>

                                            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <UserCheck size={12} className="text-slate-300" />
                                                    {event.performedByUserName} (ID: {event.performedByUserId})
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} className="text-slate-300" />
                                                    {formatDateTimeWithSeconds(event.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Resource Metrics Chart Card */}
                <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <Cpu size={18} className="text-indigo-600" />
                            <h3 className="font-semibold text-slate-900">5. Resource Utilization</h3>
                        </div>
                    </div>
                    <div className="flex-1 p-5 flex flex-col justify-center">
                        <div className="mb-4 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                                    <span className="h-2 w-2 rounded-full bg-indigo-600" /> CPU Load
                                </span>
                                <span className="font-bold text-slate-800">
                                    {health ? `${health.cpuUsage.toFixed(1)}%` : '...'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                                    <span className="h-2 w-2 rounded-full bg-purple-500" /> Memory Load
                                </span>
                                <span className="font-bold text-slate-800">
                                    {health ? `${health.memoryUsage.toFixed(1)}%` : '...'}
                                </span>
                            </div>
                        </div>

                        {resourcesFetching && resources?.length === 0 ? (
                            <div className="flex items-center justify-center h-48 text-slate-400">
                                Loading stats...
                            </div>
                        ) : (
                            <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={formattedChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={10} />
                                        <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="cpu" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#cpuGradient)" name="CPU %" />
                                        <Area type="monotone" dataKey="ram" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#ramGradient)" name="Memory %" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Bottom Row Grids */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* Live Session Tracker */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-200 px-5 py-4 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users size={18} className="text-indigo-600" />
                            <h3 className="font-semibold text-slate-900">2. Active User Sessions</h3>
                        </div>
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 font-bold">
                            {sessions ? sessions.length : 0} online
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">IP Address</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Browser</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Login Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {sessionsFetching && sessions?.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                                            Loading active user sessions...
                                        </td>
                                    </tr>
                                ) : !sessions || sessions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                                            No active user sessions tracked.
                                        </td>
                                    </tr>
                                ) : (
                                    sessions.map(sess => (
                                        <tr key={sess.sessionId} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 uppercase">
                                                        {sess.userName.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">{sess.userName}</p>
                                                        <p className="text-xs text-slate-400">{sess.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap text-xs font-mono text-slate-600">
                                                {sess.ipAddress}
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-500">
                                                {sess.userAgent}
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-400">
                                                {sess.loginTime ? format(parseISO(sess.loginTime), 'MMM dd, HH:mm') : '—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Security Alerts Banner Panel */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
                    <div className="border-b border-slate-200 px-5 py-4 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Shield size={18} className="text-indigo-600" />
                            <h3 className="font-semibold text-slate-900">4. Live Security Alerts</h3>
                        </div>
                    </div>

                    <div className="flex-1 p-5 space-y-3 overflow-y-auto max-h-[300px]">
                        {alertsFetching && alerts?.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                Loading alerts...
                            </div>
                        ) : filteredAlerts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-center">
                                <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                                <p className="text-sm font-semibold text-slate-800">No active security concerns</p>
                                <p className="text-xs text-slate-400">Zero threat reports matching filter limits.</p>
                            </div>
                        ) : (
                            filteredAlerts.map(alert => (
                                <div
                                    key={alert.alertId}
                                    className={`flex items-start gap-3 p-4 rounded-xl border ${alert.severity === 'HIGH' ? 'bg-red-50/50 border-red-200 text-red-900' :
                                            alert.severity === 'MEDIUM' ? 'bg-amber-50/50 border-amber-200 text-amber-900' :
                                                'bg-blue-50/50 border-blue-200 text-blue-900'
                                        }`}
                                >
                                    <AlertTriangle className={`shrink-0 h-5 w-5 ${alert.severity === 'HIGH' ? 'text-red-500' :
                                            alert.severity === 'MEDIUM' ? 'text-amber-500' :
                                                'text-blue-500'
                                        }`} />

                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold text-white uppercase ${alert.severity === 'HIGH' ? 'bg-red-500' :
                                                    alert.severity === 'MEDIUM' ? 'bg-amber-500' :
                                                        'bg-blue-500'
                                                }`}>
                                                {alert.severity}
                                            </span>
                                            <span className="text-xs text-slate-500 font-mono">IP: {alert.ipAddress}</span>
                                        </div>
                                        <p className="mt-1 text-sm font-medium">{alert.message}</p>
                                        <div className="mt-1.5 flex justify-between items-center text-xs text-slate-400">
                                            <span>User: {alert.username}</span>
                                            <span>{alert.timestamp ? format(parseISO(alert.timestamp), 'HH:mm:ss') : ''}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};