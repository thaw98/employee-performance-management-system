import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import type { RootState } from '../../app/store';
import { getRoleGroup } from '../../utils/dashboardRedirect';
import { Eye, Plus, Send, MessageSquare, Filter } from 'lucide-react';
import { continuousFeedbackApi } from '../../features/continuousFeedback/continuousFeedbackApi';
import type { ContinuousFeedback } from '../../features/continuousFeedback/types';
import { FEEDBACK_CATEGORY_LABELS } from '../../features/continuousFeedback/types';

const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
  Shared: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Private Note': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  Acknowledged: { bg: 'bg-blue-50', text: 'text-[#1d4ed8]', border: 'border-[#bfdbfe]' },
  'PIP Warning': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export default function ContinuousFeedbackPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const roleGroup = user ? getRoleGroup(user) : null;
  const canCreateFeedback = roleGroup === 'MANAGER';
  const feedbackBasePath = useMemo(() => {
    const match = pathname.match(/^\/(hr|manager|audit)\/continuous-feedback/);
    return match ? `/${match[1]}/continuous-feedback` : '/manager/continuous-feedback';
  }, [pathname]);
  const [feedbacks, setFeedbacks] = useState<ContinuousFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const resp = await continuousFeedbackApi.getTeamFeedback();
      setFeedbacks(resp.data);
    } catch {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (feedbackId: number) => {
    try {
      await continuousFeedbackApi.shareFeedback(feedbackId);
      toast.success('Feedback shared');
      loadData();
    } catch {
      toast.error('Failed to share feedback');
    }
  };

  const filteredFeedbacks = useMemo(() => {
    if (categoryFilter === 'ALL') return feedbacks;
    return feedbacks.filter((fb) => fb.category === categoryFilter);
  }, [feedbacks, categoryFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4">
      {/* Header */}
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#dbeafe] rounded-bl-[120px] -mr-12 -mt-12 opacity-60"></div>
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#2463eb] mb-3">
              <MessageSquare size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Feedback</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Continuous Feedback</h1>
            <p className="text-sm font-semibold text-slate-500 mt-2">
              {canCreateFeedback
                ? 'Create and manage feedback for your team'
                : 'Review continuous feedback across the organization'}
            </p>
          </div>
          {canCreateFeedback && (
            <Link
              to={`${feedbackBasePath}/create`}
              className="bg-[#2463eb] hover:bg-[#1d4ed8] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#dbeafe] flex items-center gap-2 active:scale-95"
            >
              <Plus size={18} />
              New Feedback
            </Link>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      {feedbacks.length > 0 && (
        <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <Filter size={16} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filter by category</span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCategoryFilter('ALL')}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  categoryFilter === 'ALL'
                    ? 'bg-[#2463eb] text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {Object.entries(FEEDBACK_CATEGORY_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setCategoryFilter(key)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    categoryFilter === key
                      ? 'bg-[#2463eb] text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feedback List Card */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <MessageSquare size={16} />
            <h2 className="text-[10px] font-black uppercase tracking-widest">
              {canCreateFeedback ? 'Team Feedback Timeline' : 'Organization Feedback Timeline'}
            </h2>
          </div>
          {!loading && (
            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              {filteredFeedbacks.length} record{filteredFeedbacks.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-[#2463eb] rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-400 animate-pulse">Loading feedback...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <MessageSquare size={40} className="text-slate-200" />
            <p className="text-sm font-bold text-slate-400">No feedback records yet</p>
            {canCreateFeedback && (
              <Link
                to={`${feedbackBasePath}/create`}
                className="mt-2 bg-[#ebf4ff] text-[#2463eb] px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#dbeafe] transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Create your first feedback
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredFeedbacks.map((fb, index) => {
              const badges: { label: string; key: string }[] = [
                { label: FEEDBACK_CATEGORY_LABELS[fb.category] || fb.category, key: 'cat' },
                ...(fb.shared ? [{ label: 'Shared', key: 'shared' }] : [{ label: 'Private Note', key: 'private' }]),
                ...(fb.acknowledged ? [{ label: 'Acknowledged', key: 'ack' }] : []),
                ...(fb.pipSuggested ? [{ label: 'PIP Warning', key: 'pip' }] : []),
              ];

              return (
                <div
                  key={fb.feedbackId}
                  className="p-5 hover:bg-slate-50/80 transition-colors cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${index * 40}ms` }}
                  onClick={() => navigate(`${feedbackBasePath}/${fb.feedbackId}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {badges.map((b) => {
                          const cfg = statusConfig[b.label] || statusConfig['Shared'];
                          return (
                            <span
                              key={b.key}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.text} ${cfg.border} border`}
                            >
                              {b.label}
                            </span>
                          );
                        })}
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        {fb.employeeName}{' '}
                        <span className="text-slate-400 font-semibold">— {fb.employeeBusinessId}</span>
                      </p>
                      {fb.feedbackMessage && (
                        <p className="text-sm font-medium text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                          {fb.feedbackMessage}
                        </p>
                      )}
                      {fb.privateManagerNote && (
                        <p className="text-xs font-bold text-slate-400 mt-1.5 italic flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          Private note: {fb.privateManagerNote}
                        </p>
                      )}
                      <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
                        {new Date(fb.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => navigate(`${feedbackBasePath}/${fb.feedbackId}`)}
                        className="p-2.5 text-slate-400 hover:text-[#2463eb] hover:bg-[#ebf4ff] rounded-xl transition-all"
                        title="View details"
                      >
                        <Eye size={18} />
                      </button>
                      {canCreateFeedback && !fb.shared && (
                        <button
                          type="button"
                          onClick={() => handleShare(fb.feedbackId)}
                          className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Share feedback"
                        >
                          <Send size={18} />
                        </button>
                      )}
                    </div>
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
