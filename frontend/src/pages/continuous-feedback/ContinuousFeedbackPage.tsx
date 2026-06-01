import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import type { RootState } from '../../app/store';
import { getRoleGroup } from '../../utils/dashboardRedirect';
import {
  Eye, Plus, Send, MessageSquare, Clock, XCircle,
  Calendar, Search, ChevronLeft, ChevronRight,
  CheckCircle, Lock, AlertTriangle, BarChart3
} from 'lucide-react';
import { continuousFeedbackApi } from '../../features/continuousFeedback/continuousFeedbackApi';
import type { ContinuousFeedback } from '../../features/continuousFeedback/types';
import { FEEDBACK_CATEGORY_LABELS } from '../../features/continuousFeedback/types';

const PAGE_SIZE = 10;

const categoryColorMap: Record<string, string> = {
  PRAISE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COACHING: 'bg-blue-50 text-[#1d4ed8] border-[#bfdbfe]',
  IMPROVEMENT_NEEDED: 'bg-amber-50 text-amber-800 border-amber-200',
  GOAL_PROGRESS: 'bg-violet-50 text-violet-700 border-violet-200',
  BEHAVIORAL_NOTE: 'bg-sky-50 text-sky-700 border-sky-200',
  ATTENDANCE: 'bg-orange-50 text-orange-700 border-orange-200',
  COMMUNICATION: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  TEAMWORK: 'bg-pink-50 text-pink-700 border-pink-200',
  PERFORMANCE_RISK: 'bg-rose-50 text-rose-700 border-rose-200',
};

const statusBadgeConfig: Record<string, { bg: string; text: string; border: string; icon: typeof CheckCircle }> = {
  SHARED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle },
  SCHEDULED: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', icon: Clock },
  PRIVATE_NOTE: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: Lock },
  CANCELLED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: XCircle },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { loadData(); }, []);

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

  const loadHistory = async () => {
    if (!startDate && !endDate) { loadData(); return; }
    try {
      setLoading(true);
      const params: { startDate?: string; endDate?: string } = {};
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate + 'T23:59:59').toISOString();
      const resp = await continuousFeedbackApi.getHistory(params);
      setFeedbacks(resp.data);
    } catch {
      toast.error('Failed to load history');
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

  const searchedFeedbacks = useMemo(() => {
    if (!searchQuery.trim()) return feedbacks;
    const q = searchQuery.toLowerCase();
    return feedbacks.filter((fb) =>
      fb.employeeName.toLowerCase().includes(q) ||
      fb.employeeBusinessId.toLowerCase().includes(q) ||
      (fb.feedbackMessage && fb.feedbackMessage.toLowerCase().includes(q)) ||
      (fb.managerName && fb.managerName.toLowerCase().includes(q))
    );
  }, [feedbacks, searchQuery]);

  const filteredFeedbacks = useMemo(() => {
    let result = searchedFeedbacks;
    if (categoryFilter !== 'ALL') result = result.filter((fb) => fb.category === categoryFilter);
    if (statusFilter !== 'ALL') result = result.filter((fb) => fb.visibilityStatus === statusFilter);
    return result;
  }, [searchedFeedbacks, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredFeedbacks.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedFeedbacks = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredFeedbacks.slice(start, start + PAGE_SIZE);
  }, [filteredFeedbacks, safeCurrentPage]);

  const resetPage = useCallback(() => setCurrentPage(1), []);

  useEffect(() => { resetPage(); }, [searchQuery, categoryFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: feedbacks.length,
    shared: feedbacks.filter((fb) => fb.visibilityStatus === 'SHARED').length,
    scheduled: feedbacks.filter((fb) => fb.visibilityStatus === 'SCHEDULED').length,
    private: feedbacks.filter((fb) => fb.visibilityStatus === 'PRIVATE_NOTE').length,
    pendingAck: feedbacks.filter((fb) => fb.visibilityStatus === 'SHARED' && !fb.acknowledged).length,
  }), [feedbacks]);

  const statCards = [
    { label: 'Total Records', value: stats.total, color: 'text-[#2463eb]', bg: 'bg-[#eef2ff]', icon: BarChart3 },
    { label: 'Shared', value: stats.shared, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Send },
    { label: 'Scheduled', value: stats.scheduled, color: 'text-violet-600', bg: 'bg-violet-50', icon: Clock },
    { label: 'Pending Ack.', value: stats.pendingAck, color: 'text-amber-600', bg: 'bg-amber-50', icon: CheckCircle },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#dbeafe]/60 to-transparent rounded-bl-[140px] -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#dbeafe]/30 to-transparent rounded-tr-[100px] -ml-10 -mb-10"></div>
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-[#2463eb] mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#eef2ff] flex items-center justify-center">
                <MessageSquare size={16} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Feedback</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Continuous Feedback</h1>
            <p className="text-sm font-semibold text-slate-500 mt-1.5">
              {canCreateFeedback
                ? 'Create and manage feedback for your team'
                : 'Review continuous feedback across the organization'}
            </p>
          </div>
          {canCreateFeedback && (
            <Link
              to={`${feedbackBasePath}/create`}
              className="bg-[#2463eb] hover:bg-[#1d4ed8] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#dbeafe] flex items-center gap-2 active:scale-95 shrink-0"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New Feedback</span>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon size={15} className={stat.color} />
                </div>
              </div>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-[20px] shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by employee name, ID, or message..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-[11px] font-bold border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {Object.entries(FEEDBACK_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-[11px] font-bold border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              {['SHARED', 'SCHEDULED', 'PRIVATE_NOTE', 'CANCELLED'].map((s) => (
                <option key={s} value={s}>{s === 'PRIVATE_NOTE' ? 'Private Note' : s.charAt(0) + s.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <Calendar size={14} className="text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date range</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold border border-slate-200 bg-slate-50 focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all"
          />
          <span className="text-[11px] font-bold text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold border border-slate-200 bg-slate-50 focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all"
          />
          <button
            onClick={loadHistory}
            className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#2463eb] text-white shadow-sm hover:bg-[#1d4ed8] transition-all active:scale-95"
          >
            Apply
          </button>
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); loadData(); }}
              className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all active:scale-95"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <MessageSquare size={15} />
            <h2 className="text-[10px] font-black uppercase tracking-widest">
              {canCreateFeedback ? 'Team Feedback' : 'Organization Feedback'}
            </h2>
          </div>
          {!loading && (
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {filteredFeedbacks.length} result{filteredFeedbacks.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-[3px] border-slate-100 border-t-[#2463eb] rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-400 animate-pulse">Loading feedback...</p>
          </div>
        ) : paginatedFeedbacks.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
              <MessageSquare size={28} className="text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-400">
              {searchQuery || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'No feedback matches your filters'
                : 'No feedback records yet'}
            </p>
            {canCreateFeedback && !searchQuery && categoryFilter === 'ALL' && statusFilter === 'ALL' && (
              <Link
                to={`${feedbackBasePath}/create`}
                className="mt-1 bg-[#ebf4ff] text-[#2463eb] px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#dbeafe] transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Create your first feedback
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-50">
              {paginatedFeedbacks.map((fb, index) => {
                const StatusIcon = statusBadgeConfig[fb.visibilityStatus]?.icon || MessageSquare;
                const isPip = fb.pipSuggested;
                const isAck = fb.acknowledged;

                return (
                  <div
                    key={fb.feedbackId}
                    className="p-5 hover:bg-slate-50/80 transition-colors cursor-pointer animate-fade-in-up group"
                    style={{ animationDelay: `${(index % PAGE_SIZE) * 30}ms` }}
                    onClick={() => navigate(`${feedbackBasePath}/${fb.feedbackId}`)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${categoryColorMap[fb.category] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            {FEEDBACK_CATEGORY_LABELS[fb.category] || fb.category}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-1 ${statusBadgeConfig[fb.visibilityStatus]?.bg || 'bg-slate-100'} ${statusBadgeConfig[fb.visibilityStatus]?.text || 'text-slate-700'} ${statusBadgeConfig[fb.visibilityStatus]?.border || 'border-slate-200'}`}>
                            <StatusIcon size={9} />
                            {fb.visibilityStatus === 'PRIVATE_NOTE' ? 'Private' : fb.visibilityStatus.charAt(0) + fb.visibilityStatus.slice(1).toLowerCase()}
                          </span>
                          {isAck && (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-blue-50 text-[#1d4ed8] border-[#bfdbfe] inline-flex items-center gap-1">
                              <CheckCircle size={9} />
                              Acknowledged
                            </span>
                          )}
                          {isPip && (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-rose-50 text-rose-700 border-rose-200 inline-flex items-center gap-1">
                              <AlertTriangle size={9} />
                              PIP Warning
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#eef2ff] flex items-center justify-center text-[10px] font-black text-[#2463eb] shrink-0">
                            {fb.employeeName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 leading-tight">
                              {fb.employeeName}
                            </p>
                            <p className="text-[11px] font-semibold text-slate-400">
                              {fb.employeeBusinessId} &middot; by {fb.managerName}
                            </p>
                          </div>
                        </div>

                        {fb.feedbackMessage && (
                          <p className="text-sm font-medium text-slate-600 mt-2.5 line-clamp-2 leading-relaxed pl-9">
                            {fb.feedbackMessage}
                          </p>
                        )}

                        {fb.privateManagerNote && (
                          <p className="text-xs font-semibold text-amber-600/70 mt-1.5 italic flex items-center gap-1.5 pl-9">
                            <Lock size={11} />
                            {fb.privateManagerNote}
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-2.5 pl-9">
                          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(fb.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          {fb.scheduledPublishAt && (
                            <p className="text-[10px] font-bold text-violet-500 flex items-center gap-1">
                              <Clock size={11} />
                              Sched. {new Date(fb.scheduledPublishAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                          {fb.sharedAt && (
                            <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                              <Send size={11} />
                              Shared {new Date(fb.sharedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 mt-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => navigate(`${feedbackBasePath}/${fb.feedbackId}`)}
                          className="p-2 text-slate-400 hover:text-[#2463eb] hover:bg-[#ebf4ff] rounded-xl transition-all"
                          title="View details"
                        >
                          <Eye size={17} />
                        </button>
                        {canCreateFeedback && !fb.shared && fb.visibilityStatus !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => handleShare(fb.feedbackId)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Share feedback"
                          >
                            <Send size={17} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
              <p className="text-[11px] font-bold text-slate-400 shrink-0">
                Showing {(safeCurrentPage - 1) * PAGE_SIZE + 1}&ndash;{Math.min(safeCurrentPage * PAGE_SIZE, filteredFeedbacks.length)} of {filteredFeedbacks.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const startPage = Math.max(1, Math.min(safeCurrentPage - 2, totalPages - 4));
                  const page = startPage + i;
                  if (page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[32px] h-8 rounded-xl text-[11px] font-black transition-all active:scale-95 ${
                        page === safeCurrentPage
                          ? 'bg-[#2463eb] text-white shadow-sm'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                }).filter(Boolean)}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
