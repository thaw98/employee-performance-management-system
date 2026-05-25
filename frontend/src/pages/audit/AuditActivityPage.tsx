// src/pages/audit/AuditActivityPage.tsx
import React from 'react';
import { Activity } from 'lucide-react';

export const AuditActivityPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <Activity className="h-16 w-16 text-indigo-500 mb-4" />
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">Activity Monitor</h2>
            <p className="text-slate-500 dark:text-slate-400">Coming soon. Real-time system activity monitoring.</p>
        </div>
    );
};