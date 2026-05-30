import React, { useMemo, useState } from 'react';
import { FileSearch, Loader2, Search } from 'lucide-react';
import { useGetAuditLogsQuery } from '../../features/audit/auditApi';

const parseJson = (value: unknown) => {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(String(value));
    } catch {
        return value;
    }
};

export const AuditLogsPage: React.FC = () => {
    const [targetType, setTargetType] = useState('SCORE_EXPLANATION');
    const [search, setSearch] = useState('');
    const { data, isLoading } = useGetAuditLogsQuery({ page: 0, size: 100, targetType: targetType || undefined });

    const rows = useMemo(() => {
        const term = search.trim().toLowerCase();
        const content = data?.content ?? [];
        if (!term) return content;
        return content.filter((log) => [
            log.actionType,
            log.targetType,
            log.description,
            log.performedByUserName,
            log.metadataJson,
            log.beforeData,
            log.afterData,
        ].some((value) => String(value ?? '').toLowerCase().includes(term)));
    }, [data, search]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Audit Logs</h1>
                    <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">Search changes and inspect before/after audit details.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Target
                        <select value={targetType} onChange={(e) => setTargetType(e.target.value)} className="mt-1 block w-full rounded-xl border-slate-200 bg-white text-sm normal-case tracking-normal dark:border-slate-700 dark:bg-slate-900">
                            <option value="SCORE_EXPLANATION">Score Explanation</option>
                            <option value="">All Targets</option>
                        </select>
                    </label>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Search
                        <div className="relative mt-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border-slate-200 bg-white pl-9 text-sm dark:border-slate-700 dark:bg-slate-900" />
                        </div>
                    </label>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {isLoading ? (
                    <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-600" /></div>
                ) : rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                        <FileSearch className="mb-3 h-10 w-10" />
                        <p className="text-sm font-bold">No audit logs found.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {rows.map((log) => {
                            const metadata = parseJson(log.metadataJson) as any;
                            const beforeData = parseJson(log.beforeData);
                            const afterData = parseJson(log.afterData);
                            return (
                                <details key={log.id ?? log.auditId} className="group">
                                    <summary className="grid cursor-pointer gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 md:grid-cols-[180px_180px_1fr_180px]">
                                        <div className="text-xs font-bold text-slate-500">{new Date(log.createdAt).toLocaleString()}</div>
                                        <div className="text-sm font-black text-blue-700 dark:text-blue-300">{log.actionType}</div>
                                        <div className="text-sm text-slate-700 dark:text-slate-200">{log.description}</div>
                                        <div className="text-xs font-bold text-slate-500">{log.performedByUserName || 'System'}</div>
                                    </summary>
                                    <div className="grid gap-4 bg-slate-50 px-5 pb-5 pt-2 dark:bg-slate-950/30 lg:grid-cols-3">
                                        <AuditJson title="Reason" value={metadata?.reason ?? metadata} />
                                        <AuditJson title="Before" value={beforeData} />
                                        <AuditJson title="After" value={afterData} />
                                    </div>
                                </details>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

const AuditJson: React.FC<{ title: string; value: unknown }> = ({ title, value }) => (
    <div>
        <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">{title}</p>
        <pre className="max-h-64 overflow-auto rounded-xl bg-white p-3 text-xs text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800">
            {typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)}
        </pre>
    </div>
);
