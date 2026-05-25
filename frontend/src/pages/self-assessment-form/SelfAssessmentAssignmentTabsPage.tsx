import React from 'react';
import { ClipboardList, Send } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AssignSelfAssessmentFormsPage } from './AssignSelfAssessmentFormsPage';
import { SelfAssessmentAssignmentsPage } from './SelfAssessmentAssignmentsPage';

type AssignmentTab = 'overview' | 'assign';

const tabs: Array<{
  id: AssignmentTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: 'overview', label: 'Overview', icon: ClipboardList },
  { id: 'assign', label: 'Assign Forms', icon: Send },
];

export const SelfAssessmentAssignmentTabsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab: AssignmentTab = searchParams.get('tab') === 'assign' ? 'assign' : 'overview';

  const switchTab = (tab: AssignmentTab, replace = false) => {
    navigate(`/hr/self-assessment/assignments?tab=${tab}`, { replace });
  };

  return (
    <div className="animate-fade-in">
      <div className="px-6 pt-6 md:px-8">
        <div
          role="tablist"
          aria-label="Self-assessment assignment sections"
          className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`self-assessment-${tab.id}-panel`}
                onClick={() => switchTab(tab.id)}
                className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-[#2463eb] text-white shadow-sm shadow-[#2463eb]/20'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id={`self-assessment-${activeTab}-panel`}
        role="tabpanel"
        aria-label={activeTab === 'overview' ? 'Overview' : 'Assign Forms'}
      >
        {activeTab === 'overview' ? (
          <SelfAssessmentAssignmentsPage />
        ) : (
          <AssignSelfAssessmentFormsPage
            onAssignmentSuccess={() => switchTab('overview', true)}
          />
        )}
      </div>
    </div>
  );
};
