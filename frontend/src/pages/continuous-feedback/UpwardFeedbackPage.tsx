import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import type { RootState } from '../../app/store';
import { getRoleGroup } from '../../utils/dashboardRedirect';
import { Eye, MessageSquare, Plus, Filter, ArrowUpRight } from 'lucide-react';
import { upwardFeedbackApi } from '../../features/continuousFeedback/upwardFeedbackApi';
import type { UpwardFeedback } from '../../features/continuousFeedback/types';

export default function UpwardFeedbackPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const roleGroup = user ? getRoleGroup(user) : null;
  const [feedbacks, setFeedbacks] = useState<UpwardFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');

  const feedbackBasePath = useMemo(() => {
    const match = pathname.match(/^\/(hr|manager|audit|employee)\/upward-feedback/);
    return match ? `/${match[1]}/upward-feedback` : '/employee/upward-feedback';
  }, [pathname]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (roleGroup === 'HR' || roleGroup === 'AUDIT') {
        const resp = await upwardFeedbackApi.listAll();
        setFeedbacks(resp.data);
      } else if (roleGroup === 'MANAGER') {
        const resp = await upwardFeedbackApi.getMyReceivedFeedback();
        setFeedbacks(resp.data);
      } else {
        const resp = await upwardFeedbackApi.getMySentFeedback();
        setFeedbacks(resp.data);
      }
    } catch {
      toast.error('Failed to load upward feedback');
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedbacks = useMemo(() => {
    if (statusFilter === 'ALL') return feedbacks;
    return feedbacks.filter((fb) => fb.status === statusFilter);
  }, [feedbacks, statusFilter]);

  const canCreate = roleGroup === 'EMPLOYEE';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4">
      {/* Header */}
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#dbeafe] rounded-bl-[120px] -mr-12 -mt-12 opacity-60"></div>
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#2463eb] mb-3">
              <ArrowUpRight size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Feedback</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Upward Feedback</h1>
            <p className="text-sm font-semibold text-slate-500 mt-2">
              {roleGroup === 'EMPLOYEE'
                ? 'Submit and track feedback to your manager'
                : roleGroup === 'MANAGER'
                ? 'Review feedback from your direct reports'
                : 'View upward feedback across the organization'}
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => navigate(`${feedbackBasePath}/create`)}
              className="bg-[#2463eb] hover:bg-[#1d4ed8] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#dbeafe] flex items-center gap-2 active:scale-95"
            >
              <Plus size={18} />
              New Feedback
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      {feedbacks.length > 0 && (
        <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <Filter size={16} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filter by status</span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-[#2463eb] text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('OPEN')}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === 'OPEN'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setStatusFilter('CLOSED')}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === 'CLOSED'
                    ? 'bg-slate-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Closed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <ArrowUpRight size={16} />
            <h2 className="text-[10px] font-black uppercase tracking-widest">
              {roleGroup === 'MANAGER' ? 'Received Feedback' : 'Feedback Threads'}
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
            <p className="text-sm font-bold text-slate-400 animate-pulse">Loading...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <ArrowUpRight size={40} className="text-slate-200" />
            <p className="text-sm font-bold text-slate-400">No upward feedback records yet</p>
            {canCreate && (
              <button
                onClick={() => navigate(`${feedbackBasePath}/create`)}
                className="mt-2 bg-[#ebf4ff] text-[#2463eb] px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#dbeafe] transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Submit your first feedback
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredFeedbacks.map((fb, index) => (
              <div
                key={fb.feedbackId}
                className="p-5 hover:bg-slate-50/80 transition-colors cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${index * 40}ms` }}
                onClick={() => navigate(`${feedbackBasePath}/${fb.feedbackId}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        fb.status === 'OPEN'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {fb.status}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      {roleGroup === 'MANAGER'
                        ? `From: ${fb.employeeName}`
                        : `To: ${fb.managerName}`}
                      <span className="text-slate-400 font-semibold ml-2">— {fb.employeeBusinessId}</span>
                    </p>
                    <p className="text-sm font-medium text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                      {fb.message}
                    </p>
                    {fb.replies && fb.replies.length > 0 && (
                      <p className="text-[10px] font-bold text-slate-400 mt-1.5 flex items-center gap-1">
                        <MessageSquare size={10} />
                        {fb.replies.length} repl{fb.replies.length === 1 ? 'y' : 'ies'}
                      </p>
                    )}
                    <p className="text-[10px] font-bold text-slate-400 mt-2">
                      {new Date(fb.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
