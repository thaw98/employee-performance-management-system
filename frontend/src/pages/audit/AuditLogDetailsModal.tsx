import React from 'react';
import {
    Activity,
    AlertCircle,
    CheckCircle,
    Clock,
    Copy,
    FileText,
    Printer,
    UserCheck,
    X,
} from 'lucide-react';
import { formatDateTimeWithSeconds } from '../../utils/dateUtils';
import type { AuditLog } from '../../features/audit/auditApi';

function getActionBadgeClass(actionType?: string) {
    if (!actionType) return 'bg-gray-100 text-gray-600 border-gray-200';
    if (actionType.includes('CREATE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (actionType.includes('UPDATE')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (actionType.includes('DELETE')) return 'bg-red-50 text-red-700 border-red-200';
    if (actionType.includes('LOGIN')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (actionType.includes('SUBMIT')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-gray-50 text-gray-600 border-gray-200';
}

function getActionIcon(actionType?: string) {
    if (!actionType) return <Activity size={12} />;
    if (actionType.includes('CREATE')) return <CheckCircle size={12} />;
    if (actionType.includes('UPDATE')) return <Activity size={12} />;
    if (actionType.includes('DELETE')) return <AlertCircle size={12} />;
    if (actionType.includes('SUBMIT')) return <CheckCircle size={12} />;
    return <Clock size={12} />;
}

interface AuditLogDetailsModalProps {
    log: AuditLog | null;
    onClose: () => void;
}

export const AuditLogDetailsModal: React.FC<AuditLogDetailsModalProps> = ({ log, onClose }) => {
    if (!log) return null;

    const auditId = log.auditId ?? log.id;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-xl bg-white shadow-2xl dark:bg-slate-800"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
                            <FileText size={18} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Audit Log Details</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                        >
                            <Copy size={16} />
                        </button>
                        <button
                            type="button"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                        >
                            <Printer size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
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
                            <p className="mt-1 font-mono text-sm text-slate-900 dark:text-white">#{auditId}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                            <label className="text-xs font-medium uppercase text-slate-500">Timestamp</label>
                            <p className="mt-1 text-sm text-slate-900 dark:text-white">
                                {formatDateTimeWithSeconds(log.createdAt)}
                            </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                            <label className="text-xs font-medium uppercase text-slate-500">Action Type</label>
                            <div className="mt-1">
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getActionBadgeClass(log.actionType)}`}
                                >
                                    {getActionIcon(log.actionType)}
                                    {log.actionType?.replace(/_/g, ' ')}
                                </span>
                            </div>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                            <label className="text-xs font-medium uppercase text-slate-500">Target</label>
                            <p className="mt-1 text-sm text-slate-900 dark:text-white">
                                {log.targetType?.replace(/_/g, ' ')}
                                {log.targetId ? ` #${log.targetId}` : ''}
                            </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50 sm:col-span-2">
                            <label className="text-xs font-medium uppercase text-slate-500">Performed By</label>
                            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-900 dark:text-white">
                                <UserCheck size={14} className="text-slate-400" />
                                {log.performedByUserName || `User #${log.performedByUserId}`}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                        <label className="text-xs font-medium uppercase text-slate-500">Description</label>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                            {log.description}
                        </p>
                    </div>
                    {log.metadataJson && (
                        <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                            <label className="text-xs font-medium uppercase text-slate-500">Metadata</label>
                            <pre className="mt-2 max-h-60 overflow-auto rounded-lg bg-white p-3 font-mono text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                {JSON.stringify(log.metadataJson, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
