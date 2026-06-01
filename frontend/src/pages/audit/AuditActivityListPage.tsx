// src/pages/audit/AuditActivityListPage.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Eye,
    ChevronDown,
    Filter,
    Clock,
    UserCheck,
    Database,
    List,
    Search,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import { formatDateTimeWithSeconds } from '../../utils/dateUtils';
import { useGetAuditLogsQuery, type AuditLog } from '../../features/audit/auditApi';
import { AuditLogDetailsModal } from './AuditLogDetailsModal';
import { PaginationBar } from '../../components/common/PaginationBar';

type ActivityCategory =
    | 'ALL'
    | 'KPI'
    | 'SELF_ASSESSMENT'
    | 'APPRAISAL'
    | 'FEEDBACK_360'
    | 'MEETING'
    | 'CONTINUOUS_FEEDBACK'
    | 'PIP'
    | 'FAQ'
    | 'LOGIN'
    | 'PERMISSION'
    | 'DATA'
    | 'IMPORT_EXPORT'
    | 'OTHER';

interface CategoryDef {
    key: ActivityCategory;
    label: string;
}

const CATEGORIES: CategoryDef[] = [
    { key: 'KPI', label: 'KPI' },
    { key: 'SELF_ASSESSMENT', label: 'Self-Assessment' },
    { key: 'APPRAISAL', label: 'Appraisal' },
    { key: 'FEEDBACK_360', label: '360 Feedback' },
    { key: 'MEETING', label: 'One-on-one Meeting' },
    { key: 'CONTINUOUS_FEEDBACK', label: 'Continuous Performance Feedback' },
    { key: 'PIP', label: 'PIP' },
    { key: 'FAQ', label: 'FAQ Support' },
    { key: 'LOGIN', label: 'Login / Authentication' },
    { key: 'PERMISSION', label: 'Permission / Role Change' },
    { key: 'DATA', label: 'Data Change' },
    { key: 'IMPORT_EXPORT', label: 'Import / Export' },
    { key: 'OTHER', label: 'Other' },
];

const TAB_CATEGORIES: CategoryDef[] = [
    { key: 'ALL', label: 'All Activities' },
    { key: 'KPI', label: 'KPI' },
    { key: 'SELF_ASSESSMENT', label: 'Self-Assessment' },
    { key: 'APPRAISAL', label: 'Appraisal' },
    { key: 'FEEDBACK_360', label: '360 Feedback' },
    { key: 'MEETING', label: 'Meeting' },
    { key: 'CONTINUOUS_FEEDBACK', label: 'Continuous Feedback' },
    { key: 'PIP', label: 'PIP' },
];

const DROPDOWN_CATEGORIES: CategoryDef[] = CATEGORIES.filter(
    (c) => c.key !== 'ALL' && !TAB_CATEGORIES.some((t) => t.key === c.key)
);

function deriveCategory(log: AuditLog): ActivityCategory {
    const action = (log.actionType ?? '').toUpperCase();
    const target = (log.targetType ?? '').toUpperCase();

    if (action.startsWith('KPI_') || target.startsWith('EMPLOYEE_KPI') || target === 'KPI') return 'KPI';
    if (action.startsWith('SELF_ASSESSMENT_') || target.startsWith('SELF_ASSESSMENT')) return 'SELF_ASSESSMENT';
    if (action.startsWith('APPRAISAL_') || target.startsWith('APPRAISAL')) return 'APPRAISAL';
    if (action.startsWith('FEEDBACK_360_') || target.startsWith('FEEDBACK_360') || target === 'FEEDBACK_360') return 'FEEDBACK_360';
    if (action.startsWith('MEETING_') || target.startsWith('MEETING')) return 'MEETING';
    if (action.startsWith('CONTINUOUS_FEEDBACK_') || target.startsWith('CONTINUOUS_FEEDBACK')) return 'CONTINUOUS_FEEDBACK';
    if (action.startsWith('PIP_') || target.startsWith('PIP')) return 'PIP';
    if (action.startsWith('FAQ_') || target.startsWith('FAQ')) return 'FAQ';
    if (action.startsWith('LOGIN_') || action.includes('LOGIN') || action.startsWith('FORGOT_PASSWORD_') || action.startsWith('PASSWORD_') || action.startsWith('TEMP_PASSWORD_')) return 'LOGIN';
    if (action.startsWith('PERMISSION_') || target.startsWith('PERMISSION') || action.includes('PERMISSION')) return 'PERMISSION';
    if (action.startsWith('DATA_') || target.startsWith('DATA') || action.startsWith('SNAPSHOT_') || action.startsWith('TIME_SETTINGS_')) return 'DATA';
    if (action.startsWith('EMPLOYEE_BULK_IMPORT') || action.includes('_IMPORT') || action.includes('_EXPORT') || action.startsWith('IMPORT_') || action.startsWith('EXPORT_') || action.includes('BULK_')) return 'IMPORT_EXPORT';
    if (action.startsWith('EDIT_EMPLOYEE') || action.startsWith('EMPLOYMENT_STATUS') || action.startsWith('MANAGER_ASSIGNED') || action.startsWith('EMPLOYEE_ACCOUNT') || action.startsWith('EMPLOYEE_')) return 'DATA';

    return 'OTHER';
}

function getSeverityInfo(actionType?: string): { label: string; class: string } {
    if (!actionType) return { label: 'Info', class: 'bg-slate-100 text-slate-600' };
    const up = actionType.toUpperCase();
    if (up.includes('CREATE') || up.includes('SUBMIT') || up.includes('APPROVE') || up.includes('SHARED') || up.includes('ACKNOWLEDGED') || up.includes('RESET_SUCCESS')) return { label: 'Success', class: 'bg-emerald-50 text-emerald-700' };
    if (up.includes('DELETE') || up.includes('REJECT') || up.includes('FAILED')) return { label: 'Error', class: 'bg-red-50 text-red-700' };
    if (up.includes('UPDATE') || up.includes('EDIT') || up.includes('CHANGE') || up.includes('TRANSFER') || up.includes('ASSIGNED') || up.includes('PROPOSED') || up.includes('RETURN') || up.includes('PROMOTION')) return { label: 'Updated', class: 'bg-blue-50 text-blue-700' };
    if (up.includes('LOGIN') || up.includes('PASSWORD') || up.includes('OTP') || up.includes('FORGOT_PASSWORD')) return { label: 'Auth', class: 'bg-purple-50 text-purple-700' };
    return { label: 'Info', class: 'bg-slate-100 text-slate-600' };
}

const FETCH_ALL_SIZE = 100_000;

function matchesSearch(log: AuditLog, query: string): boolean {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return [
        log.description,
        log.actionType,
        log.targetType,
        log.performedByUserName,
        log.performedByUserId,
        log.targetId,
    ].some((value) => String(value ?? '').toLowerCase().includes(term));
}

const AuditActivityListPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState<ActivityCategory>('ALL');
    const [dropdownCategory, setDropdownCategory] = useState<ActivityCategory | ''>('');
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [actionTypeFilter, setActionTypeFilter] = useState('');
    const [targetTypeFilter, setTargetTypeFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');

    const { data, isLoading } = useGetAuditLogsQuery({
        page: 0,
        size: FETCH_ALL_SIZE,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
    });

    const apiFilteredLogs = useMemo(() => {
        let logs = data?.content ?? [];
        if (actionTypeFilter.trim()) {
            const term = actionTypeFilter.trim().toLowerCase();
            logs = logs.filter((log) => log.actionType?.toLowerCase().includes(term));
        }
        if (targetTypeFilter.trim()) {
            const term = targetTypeFilter.trim().toLowerCase();
            logs = logs.filter((log) => log.targetType?.toLowerCase().includes(term));
        }
        if (userFilter.trim()) {
            const term = userFilter.trim().toLowerCase();
            logs = logs.filter((log) => {
                const matchName = log.performedByUserName?.toLowerCase().includes(term);
                const matchId = log.performedByUserId?.toString() === userFilter.trim();
                return matchName || matchId;
            });
        }
        return logs;
    }, [data, actionTypeFilter, targetTypeFilter, userFilter]);

    const filteredLogs = useMemo(() => {
        return apiFilteredLogs.filter((log) => {
            if (activeCategory !== 'ALL' && deriveCategory(log) !== activeCategory) return false;
            return matchesSearch(log, searchQuery);
        });
    }, [apiFilteredLogs, activeCategory, searchQuery]);

    const totalItems = filteredLogs.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const paginatedLogs = useMemo(() => {
        const start = page * pageSize;
        return filteredLogs.slice(start, start + pageSize);
    }, [filteredLogs, page, pageSize]);

    useEffect(() => {
        setPage(0);
    }, [searchQuery, activeCategory, actionTypeFilter, targetTypeFilter, userFilter, startDateFilter, endDateFilter]);

    useEffect(() => {
        if (page > 0 && page >= totalPages) {
            setPage(Math.max(0, totalPages - 1));
        }
    }, [page, totalPages]);

    const handleTabClick = useCallback((cat: ActivityCategory) => {
        setActiveCategory(cat);
        setDropdownCategory('');
    }, []);

    const handleDropdownChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value as ActivityCategory | '';
        if (val) {
            setActiveCategory(val);
            setDropdownCategory(val);
        }
    }, []);

    const resetFilters = useCallback(() => {
        setSearchQuery('');
        setActionTypeFilter('');
        setTargetTypeFilter('');
        setUserFilter('');
        setStartDateFilter('');
        setEndDateFilter('');
        setPage(0);
    }, []);

    const hasActiveFilters =
        Boolean(searchQuery || actionTypeFilter || targetTypeFilter || userFilter || startDateFilter || endDateFilter);

    const activeLabel = CATEGORIES.find((c) => c.key === activeCategory)?.label || 'All Activities';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Activity</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Complete audit activity history with category filtering
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                            Clear filters
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/audit/dashboard')}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>

            {/* Search & filter controls */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative min-w-0 flex-1">
                        <Search
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            placeholder="Search description, action, target, or user..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowFilters((prev) => !prev)}
                        className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                            showFilters
                                ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-700'
                        }`}
                    >
                        <SlidersHorizontal size={16} />
                        Filters
                        {hasActiveFilters && !showFilters && (
                            <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                On
                            </span>
                        )}
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-4 space-y-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                                <Filter size={16} className="text-indigo-600" />
                                Advanced filters
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowFilters(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                aria-label="Close filters"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                                    Action type
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. KPI_CREATE"
                                    value={actionTypeFilter}
                                    onChange={(e) => setActionTypeFilter(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                                    Target type
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. EMPLOYEE_KPI"
                                    value={targetTypeFilter}
                                    onChange={(e) => setTargetTypeFilter(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                                    User
                                </label>
                                <input
                                    type="text"
                                    placeholder="Name or user ID"
                                    value={userFilter}
                                    onChange={(e) => setUserFilter(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                                    Start date
                                </label>
                                <input
                                    type="date"
                                    value={startDateFilter}
                                    onChange={(e) => setStartDateFilter(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                                    End date
                                </label>
                                <input
                                    type="date"
                                    value={endDateFilter}
                                    onChange={(e) => setEndDateFilter(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs + Dropdown Filter */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    {TAB_CATEGORIES.map((tab) => {
                        const count =
                            tab.key === 'ALL'
                                ? apiFilteredLogs.filter((log) => matchesSearch(log, searchQuery)).length
                                : apiFilteredLogs.filter(
                                      (log) =>
                                          deriveCategory(log) === tab.key && matchesSearch(log, searchQuery)
                                  ).length;
                        const isActive = activeCategory === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => handleTabClick(tab.key)}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition-all ${
                                    isActive
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700'
                                }`}
                            >
                                {tab.label}
                                <span
                                    className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                                        isActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                    }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Overflow dropdown */}
                <div className="relative">
                    <select
                        value={dropdownCategory}
                        onChange={handleDropdownChange}
                        className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-sm font-medium text-slate-600 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600"
                    >
                        <option value="">More categories...</option>
                        {DROPDOWN_CATEGORIES.map((cat) => {
                            const count = apiFilteredLogs.filter(
                                (log) => deriveCategory(log) === cat.key && matchesSearch(log, searchQuery)
                            ).length;
                            return (
                                <option key={cat.key} value={cat.key}>
                                    {cat.label} ({count})
                                </option>
                            );
                        })}
                    </select>
                    <ChevronDown
                        size={14}
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                </div>
            </div>

            {/* Active category indicator (when selected via dropdown) */}
            {dropdownCategory && dropdownCategory !== activeCategory && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Filter size={14} />
                    <span>
                        Showing: <strong>{activeLabel}</strong>
                    </span>
                    <button
                        onClick={() => {
                            setActiveCategory('ALL');
                            setDropdownCategory('');
                        }}
                        className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                        Clear
                    </button>
                </div>
            )}

            {/* Activity List */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <List size={16} className="text-indigo-600" />
                        <h3 className="font-semibold text-slate-900 dark:text-white">{activeLabel}</h3>
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                            {totalItems} events
                        </span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="space-y-4 p-5">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-700" />
                        ))}
                    </div>
                ) : totalItems === 0 ? (
                    <div className="flex flex-col items-center gap-3 px-5 py-16">
                        <Database size={48} className="text-slate-300 dark:text-slate-600" />
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            No activity found
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            {hasActiveFilters
                                ? 'Try adjusting your search or filters.'
                                : activeCategory === 'ALL'
                                  ? 'There is no audit activity recorded yet.'
                                  : `No activity recorded for "${activeLabel}".`}
                        </p>
                        {(activeCategory !== 'ALL' || hasActiveFilters) && (
                            <button
                                onClick={() => {
                                    handleTabClick('ALL');
                                    resetFilters();
                                }}
                                className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400"
                            >
                                {hasActiveFilters ? 'Clear all filters' : 'View All Activity'}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {paginatedLogs.map((log) => {
                            const severity = getSeverityInfo(log.actionType);
                            const category = deriveCategory(log);
                            const categoryLabel = CATEGORIES.find((c) => c.key === category)?.label || 'Other';
                            return (
                                <div
                                    key={log.auditId ?? log.id}
                                    className="flex flex-col gap-2 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-700/50 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                {categoryLabel}
                                            </span>
                                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${severity.class}`}>
                                                {severity.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-slate-200">
                                            {log.description || log.actionType?.replace(/_/g, ' ') || 'No description'}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                                            <span className="inline-flex items-center gap-1">
                                                <UserCheck size={12} />
                                                {log.performedByUserName || `User #${log.performedByUserId}`}
                                            </span>
                                            {log.targetType && (
                                                <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-700">
                                                    {log.targetType.replace(/_/g, ' ')}
                                                    {log.targetId ? ` #${log.targetId}` : ''}
                                                </span>
                                            )}
                                            <span className="inline-flex items-center gap-1">
                                                <Clock size={12} />
                                                {formatDateTimeWithSeconds(log.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedLog(log)}
                                        className="shrink-0 rounded-lg p-1.5 text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-slate-700"
                                        title="View details"
                                    >
                                        <Eye size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!isLoading && totalItems > 0 && (
                    <PaginationBar
                        pageIndex={page}
                        pageSize={pageSize}
                        pageCount={totalPages}
                        totalItems={totalItems}
                        itemLabel="events"
                        rowsPerPageOptions={[10, 20, 50, 100]}
                        onPageIndexChange={setPage}
                        onPageSizeChange={(nextSize) => {
                            setPageSize(nextSize);
                            setPage(0);
                        }}
                        className="mt-0 rounded-none border-x-0 border-b-0 border-t border-slate-200 dark:border-slate-700 shadow-none"
                    />
                )}
            </div>

            <AuditLogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
        </div>
    );
};

export default AuditActivityListPage;
