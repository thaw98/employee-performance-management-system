import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FileText } from 'lucide-react';
import { EMPLOYEE_SELF_ASSESSMENT_MY_FORM_PATH } from '../../routes/employeeSelfAssessmentRoutes';

export const EmployeeSelfAssessmentHubPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-2xl">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Self Assessment
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-2">
          Complete your assigned self-assessment for the current cycle.
        </p>
      </div>

      <Link
        to={EMPLOYEE_SELF_ASSESSMENT_MY_FORM_PATH}
        className="flex items-center justify-between gap-4 rounded-[24px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
            <FileText size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Your form
            </p>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100 truncate">
              My Form
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Open, edit, and submit your responses
            </p>
          </div>
        </div>
        <ChevronRight
          size={22}
          className="shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 transition-colors"
        />
      </Link>
    </div>
  );
};
