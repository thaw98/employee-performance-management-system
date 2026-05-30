import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ClipboardList, AlertTriangle, Clock, MessageSquare } from 'lucide-react';
import { continuousFeedbackApi } from '../../features/continuousFeedback/continuousFeedbackApi';
import type { ContinuousFeedbackDashboard } from '../../features/continuousFeedback/types';
import { FEEDBACK_CATEGORY_LABELS } from '../../features/continuousFeedback/types';

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
    return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  }

  if (!dashboard) {
    return <div className="p-8 text-center text-gray-500">Failed to load dashboard data</div>;
  }

  const stats = [
    {
      label: 'Total Feedback',
      value: dashboard.totalFeedbackRecords,
      icon: <MessageSquare size={24} />,
      color: 'bg-indigo-500',
    },
    {
      label: 'Open Action Items',
      value: dashboard.openActionItems,
      icon: <ClipboardList size={24} />,
      color: 'bg-amber-500',
    },
    {
      label: 'Overdue Items',
      value: dashboard.overdueActionItems,
      icon: <Clock size={24} />,
      color: 'bg-red-500',
    },
    {
      label: 'PIP Warning Cases',
      value: dashboard.pipWarningCases,
      icon: <AlertTriangle size={24} />,
      color: 'bg-rose-500',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Continuous Feedback Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of feedback activity and action items</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg text-white`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Feedback by Category</h2>
        {Object.keys(dashboard.feedbackByCategory).length === 0 ? (
          <p className="text-sm text-gray-400">No feedback data available</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(dashboard.feedbackByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => (
                <div key={category} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-40">
                    {FEEDBACK_CATEGORY_LABELS[category as keyof typeof FEEDBACK_CATEGORY_LABELS] || category}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                    <div
                      className="bg-indigo-500 h-2.5 rounded-full transition-all"
                      style={{
                        width: `${dashboard.totalFeedbackRecords > 0 ? (count / dashboard.totalFeedbackRecords) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-10 text-right">{count}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
