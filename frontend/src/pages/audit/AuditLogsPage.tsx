// src/pages/audit/AuditLogsPage.tsx
import React from 'react';
import { List } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <List className="h-16 w-16 text-indigo-500 mb-4" />
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">Audit Logs</h2>
            <p className="text-slate-500 dark:text-slate-400">Coming soon. Detailed audit logs view with advanced filtering.</p>
        </div>
    );
};