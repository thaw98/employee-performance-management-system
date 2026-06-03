import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ClipboardList, AlertTriangle, Clock, MessageSquare, BarChart,
  Eye, ChevronDown, ChevronRight, XCircle, Lock, CheckCircle,
} from 'lucide-react';
import { continuousFeedbackApi } from '../../features/continuousFeedback/continuousFeedbackApi';
import type { ContinuousFeedbackDashboard, ContinuousFeedback } from '../../features/continuousFeedback/types';
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

const statusBadgeConfig: Record<string, { bg: string; text: string; border: string; icon: typeof CheckCircle }> = {
  SHARED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle },
  SCHEDULED: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', icon: Clock },
  PRIVATE_NOTE: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: Lock },
  CANCELLED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: XCircle },
};

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
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const feedbackBasePath = useMemo(() => {
    const match = pathname.match(/^\/(hr|manager|audit)\/continuous-feedback/);
    return match ? `/${match[1]}/continuous-feedback` : '/manager/continuous-feedback';
  }, [pathname]);

  const [dashboard, setDashboard] = useState<ContinuousFeedbackDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [teamFeedback, setTeamFeedback] = useState<ContinuousFeedback[] | null>(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeError, setEmployeeError] = useState<string | null>(null);

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

  const loadTeamFeedback = async () => {
    if (teamFeedback !== null) return;
    try {
      setLoadingEmployees(true);
      setEmployeeError(null);
      const resp = await continuousFeedbackApi.getTeamFeedback();
      setTeamFeedback(resp.data);
    } catch {
      setEmployeeError('Failed to load employee data');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleCategoryClick = async (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      return;
    }
    setSelectedCategory(category);
    if (teamFeedback === null) {
      await loadTeamFeedback();
    }
  };

  const categoryEmployees = useMemo(() => {
    if (!selectedCategory || !teamFeedback) return [];
    const filtered = teamFeedback.filter((fb) => fb.category === selectedCategory);
    const map = new Map<number, { feedbacks: ContinuousFeedback[] }>();
    for (const fb of filtered) {
      if (!map.has(fb.employeeId)) {
        map.set(fb.employeeId, { feedbacks: [] });
      }
      map.get(fb.employeeId)!.feedbacks.push(fb);
    }
    return Array.from(map.entries()).map(([employeeId, { feedbacks }]) => {
      const latest = feedbacks.reduce((a, b) =>
        new Date(a.createdAt) > new Date(b.createdAt) ? a : b
      );
      const statuses = new Set(feedbacks.map((fb) => fb.visibilityStatus));
      return {
        employeeId,
        employeeName: latest.employeeName,
        employeeBusinessId: latest.employeeBusinessId,
        managerName: latest.managerName,
        managerId: latest.managerId,
        feedbackCount: feedbacks.length,
        latestFeedback: latest,
        statuses,
      };
    }).sort((a, b) => b.feedbackCount - a.feedbackCount);
  }, [selectedCategory, teamFeedback]);

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
                const isSelected = selectedCategory === category;
                return (
                  <div key={category} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(category)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCategoryClick(category); } }}
                      className={`w-full text-left transition-colors rounded-xl p-2 -mx-2 ${
                        isSelected ? 'bg-[#eef2ff] ring-1 ring-[#2463eb]/20' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                          {isSelected ? <ChevronDown size={12} className="text-[#2463eb]" /> : <ChevronRight size={12} className="text-slate-300" />}
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
                    </button>

                    {isSelected && (
                      <div className="mt-3 ml-2 border-l-2 border-[#2463eb]/20 pl-4 space-y-2">
                        {loadingEmployees && (
                          <div className="flex items-center gap-2 py-3 text-sm font-semibold text-slate-400">
                            <div className="w-4 h-4 border-2 border-slate-200 border-t-[#2463eb] rounded-full animate-spin" />
                            Loading employees...
                          </div>
                        )}
                        {employeeError && (
                          <p className="text-sm font-semibold text-rose-500 py-2">{employeeError}</p>
                        )}
                        {!loadingEmployees && !employeeError && categoryEmployees.length === 0 && (
                          <div className="py-4 flex flex-col items-center gap-2">
                            <BarChart size={24} className="text-slate-200" />
                            <p className="text-xs font-bold text-slate-400">No employees found in this category</p>
                          </div>
                        )}
                        {!loadingEmployees && !employeeError && categoryEmployees.length > 0 && (
                          <div className="divide-y divide-slate-50">
                            {categoryEmployees.map((emp) => {
                              const latest = emp.latestFeedback;
                              return (
                                <div
                                  key={emp.employeeId}
                                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 rounded-lg px-2 -mx-2 transition-colors cursor-pointer group"
                                  onClick={() => navigate(`${feedbackBasePath}/${latest.feedbackId}`)}
                                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`${feedbackBasePath}/${latest.feedbackId}`); } }}
                                  role="button"
                                  tabIndex={0}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-md bg-[#eef2ff] flex items-center justify-center text-[9px] font-black text-[#2463eb] shrink-0">
                                        {emp.employeeName.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="text-sm font-bold text-slate-800 truncate">{emp.employeeName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 text-[11px] font-semibold text-slate-400">
                                      <span>{emp.employeeBusinessId}</span>
                                      <span>&middot;</span>
                                      <span>{emp.managerName}</span>
                                      <span>&middot;</span>
                                      <span>{emp.feedbackCount} feedback{emp.feedbackCount !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[10px] font-bold text-slate-400">
                                        Latest: {new Date(latest.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                      {Array.from(emp.statuses).map((s) => {
                                        const cfg = statusBadgeConfig[s];
                                        const StatusIcon = cfg?.icon || MessageSquare;
                                        return (
                                          <span
                                            key={s}
                                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${cfg?.bg || 'bg-slate-100'} ${cfg?.text || 'text-slate-600'} ${cfg?.border || 'border-slate-200'} border`}
                                          >
                                            <StatusIcon size={7} />
                                            {s === 'PRIVATE_NOTE' ? 'Private' : s.charAt(0) + s.slice(1).toLowerCase()}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  <Eye size={15} className="text-slate-300 group-hover:text-[#2463eb] transition-colors shrink-0" />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
