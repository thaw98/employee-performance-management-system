import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ClipboardList, AlertTriangle, Clock, MessageSquare, BarChart } from 'lucide-react';
import { continuousFeedbackApi } from '../../features/continuousFeedback/continuousFeedbackApi';
import type { ContinuousFeedbackDashboard } from '../../features/continuousFeedback/types';
import { FEEDBACK_CATEGORY_LABELS } from '../../features/continuousFeedback/types';

const statConfigs = [
  {
    label: 'Total Feedback',
    key: 'totalFeedbackRecords' as const,
    icon: MessageSquare,
    gradient: 'from-[#2463eb] to-[#1d4ed8]',
    shadow: 'shadow-[#dbeafe]',
  },
  {
    label: 'Open Action Items',
    key: 'openActionItems' as const,
    icon: ClipboardList,
    gradient: 'from-amber-500 to-amber-600',
    shadow: 'shadow-amber-100',
  },
  {
    label: 'Overdue Items',
    key: 'overdueActionItems' as const,
    icon: Clock,
    gradient: 'from-rose-500 to-rose-600',
    shadow: 'shadow-rose-100',
  },
  {
    label: 'PIP Warning Cases',
    key: 'pipWarningCases' as const,
    icon: AlertTriangle,
    gradient: 'from-red-500 to-red-600',
    shadow: 'shadow-red-100',
  },
];

const categoryBarColors: Record<string, string> = {
  PRAISE: 'bg-emerald-500',
  COACHING: 'bg-blue-500',
  IMPROVEMENT_NEEDED: 'bg-amber-500',
  GOAL_PROGRESS: 'bg-violet-500',
  BEHAVIORAL_NOTE: 'bg-sky-500',
  ATTENDANCE: 'bg-orange-500',
  COMMUNICATION: 'bg-cyan-500',
  TEAMWORK: 'bg-pink-500',
  PERFORMANCE_RISK: 'bg-rose-500',
};

export default function ContinuousFeedbackDashboardPage() {
  const [dashboard, setDashboard] = useState<ContinuousFeedbackDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const resp = await continuousFeedbackApi.getDashboard();
      setDashboard(resp.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-12 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#2463eb] rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-400 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="max-w-7xl mx-auto p-12 flex flex-col items-center justify-center gap-3">
        <BarChart size={40} className="text-slate-200" />
        <p className="text-sm font-bold text-slate-400">Failed to load dashboard data</p>
        <button onClick={loadDashboard} className="text-[#2463eb] text-sm font-bold hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4">
      {/* Header */}
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#dbeafe] rounded-bl-[120px] -mr-12 -mt-12 opacity-60"></div>
        <div className="relative">
          <div className="flex items-center gap-2 text-[#2463eb] mb-3">
            <BarChart size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Analytics</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Continuous Feedback Dashboard</h1>
          <p className="text-sm font-semibold text-slate-500 mt-2">
            Overview of feedback activity and action items
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statConfigs.map((stat) => {
          const Icon = stat.icon;
          const value = dashboard[stat.key];
          return (
            <div
              key={stat.key}
              className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-6 relative overflow-hidden group hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    {stat.label}
                  </p>
                  <p className="text-4xl font-black text-slate-800 tracking-tight">{value}</p>
                </div>
                <div className={`bg-gradient-to-br ${stat.gradient} p-3 rounded-2xl text-white shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform`}>
                  <Icon size={22} />
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-30`} />
            </div>
          );
        })}
      </div>

      {/* Feedback by Category */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <BarChart size={16} />
            <h2 className="text-[10px] font-black uppercase tracking-widest">Feedback by Category</h2>
          </div>
          {dashboard.totalFeedbackRecords > 0 && (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              {dashboard.totalFeedbackRecords} total
            </span>
          )}
        </div>

        {Object.keys(dashboard.feedbackByCategory).length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <BarChart size={40} className="text-slate-200" />
            <p className="text-sm font-bold text-slate-400">No feedback data available</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {Object.entries(dashboard.feedbackByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count], index) => {
                const barColor = categoryBarColors[category] || 'bg-indigo-500';
                const percentage = dashboard.totalFeedbackRecords > 0
                  ? (count / dashboard.totalFeedbackRecords) * 100
                  : 0;
                return (
                  <div key={category} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-600">
                        {FEEDBACK_CATEGORY_LABELS[category as keyof typeof FEEDBACK_CATEGORY_LABELS] || category}
                      </span>
                      <span className="text-xs font-black text-slate-500">{count}</span>
                    </div>
                    <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full ${barColor} transition-all duration-700 ease-out`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
