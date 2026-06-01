import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, Check, MessageSquare, Search, ChevronLeft, ChevronRight, ChevronDown, BarChart3, Clock } from 'lucide-react';
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

export default function EmployeeContinuousFeedbackPage() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<ContinuousFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { loadFeedback(); }, []);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const resp = await continuousFeedbackApi.getMyFeedback();
      setFeedbacks(resp.data);
    } catch {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (feedbackId: number) => {
    try {
      await continuousFeedbackApi.acknowledgeFeedback(feedbackId);
      toast.success('Feedback acknowledged');
      loadFeedback();
    } catch {
      toast.error('Failed to acknowledge');
    }
  };

  const unacknowledged = useMemo(() =>
    feedbacks.filter((fb) => !fb.acknowledged),
  [feedbacks]);

  const searchedFeedbacks = useMemo(() => {
    if (!searchQuery.trim()) return feedbacks;
    const q = searchQuery.toLowerCase();
    return feedbacks.filter((fb) =>
      fb.managerName.toLowerCase().includes(q) ||
      (fb.feedbackMessage && fb.feedbackMessage.toLowerCase().includes(q))
    );
  }, [feedbacks, searchQuery]);

  const filteredFeedbacks = useMemo(() => {
    if (categoryFilter === 'ALL') return searchedFeedbacks;
    return searchedFeedbacks.filter((fb) => fb.category === categoryFilter);
  }, [searchedFeedbacks, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredFeedbacks.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedFeedbacks = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredFeedbacks.slice(start, start + PAGE_SIZE);
  }, [filteredFeedbacks, safeCurrentPage]);

  const resetPage = useCallback(() => setCurrentPage(1), []);
  useEffect(() => { resetPage(); }, [searchQuery, categoryFilter]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#dbeafe]/60 to-transparent rounded-bl-[140px] -mr-16 -mt-16"></div>
        <div className="relative">
          <div className="flex items-center gap-2.5 text-[#2463eb] mb-3">
            <div className="w-8 h-8 rounded-xl bg-[#eef2ff] flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Feedback</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Continuous Feedback</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1.5">
            View feedback shared with you by your manager
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Feedback</span>
            <div className="w-8 h-8 rounded-xl bg-[#eef2ff] flex items-center justify-center">
              <BarChart3 size={15} className="text-[#2463eb]" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#2463eb]">{feedbacks.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Acknowledgment</span>
            <div className={`w-8 h-8 rounded-xl ${unacknowledged.length > 0 ? 'bg-amber-50' : 'bg-slate-50'} flex items-center justify-center`}>
              <Clock size={15} className={unacknowledged.length > 0 ? 'text-amber-600' : 'text-slate-400'} />
            </div>
          </div>
          <p className={`text-2xl font-black ${unacknowledged.length > 0 ? 'text-amber-600' : 'text-slate-500'}`}>{unacknowledged.length}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 sm:p-5 rounded-[20px] shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by manager name or message..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-3 pr-9 py-2.5 rounded-xl text-[11px] font-bold border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {Object.entries(FEEDBACK_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} aria-hidden />
          </div>
        </div>
      </div>

      {/* Unacknowledged Section */}
      {unacknowledged.length > 0 && (
        <div className="bg-white rounded-[32px] shadow-sm border border-amber-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 flex items-center gap-2 text-amber-600">
            <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock size={13} />
            </div>
            <h2 className="text-[10px] font-black uppercase tracking-widest">Pending Acknowledgment</h2>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full ml-auto border border-amber-200">
              {unacknowledged.length}
            </span>
          </div>
          <div className="divide-y divide-amber-50">
            {unacknowledged.map((fb) => (
              <div
                key={fb.feedbackId}
                className="p-4 sm:p-5 hover:bg-amber-50/40 transition-colors animate-fade-in-up"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border mb-2 ${categoryColorMap[fb.category] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {FEEDBACK_CATEGORY_LABELS[fb.category] || fb.category}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500 shrink-0">
                        {fb.managerName.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm font-bold text-slate-800">From: {fb.managerName}</p>
                    </div>
                    {fb.feedbackMessage && (
                      <p className="text-sm font-medium text-slate-600 mt-2 leading-relaxed pl-8">{fb.feedbackMessage}</p>
                    )}
                    <p className="text-[10px] font-bold text-slate-400 mt-2 pl-8">
                      {new Date(fb.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => navigate(`/employee/continuous-feedback/${fb.feedbackId}`)}
                      className="p-2 text-slate-400 hover:text-[#2463eb] hover:bg-[#ebf4ff] rounded-xl transition-all"
                      title="View details"
                    >
                      <Eye size={17} />
                    </button>
                    <button
                      onClick={() => handleAcknowledge(fb.feedbackId)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#2463eb] hover:bg-[#1d4ed8] text-white rounded-xl font-bold text-xs transition-all shadow-md active:scale-95"
                    >
                      <Check size={14} />
                      Acknowledge
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Shared Feedback */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <MessageSquare size={15} />
            <h2 className="text-[10px] font-black uppercase tracking-widest">Shared Feedback</h2>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {filteredFeedbacks.length} result{filteredFeedbacks.length !== 1 ? 's' : ''}
          </span>
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
              {searchQuery || categoryFilter !== 'ALL'
                ? 'No feedback matches your search'
                : 'No shared feedback yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-50">
              {paginatedFeedbacks.map((fb, index) => (
                <div
                  key={fb.feedbackId}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer animate-fade-in-up group"
                  style={{ animationDelay: `${(index % PAGE_SIZE) * 30}ms` }}
                  onClick={() => navigate(`/employee/continuous-feedback/${fb.feedbackId}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${categoryColorMap[fb.category] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {FEEDBACK_CATEGORY_LABELS[fb.category] || fb.category}
                        </span>
                        {fb.acknowledged && (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-blue-50 text-[#1d4ed8] border-[#bfdbfe] inline-flex items-center gap-1">
                            <Check size={9} />
                            Acknowledged
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">
                          {fb.managerName.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-bold text-slate-800">From: {fb.managerName}</p>
                      </div>
                      {fb.feedbackMessage && (
                        <p className="text-sm font-medium text-slate-600 mt-2 line-clamp-2 leading-relaxed pl-9">{fb.feedbackMessage}</p>
                      )}
                      <p className="text-[10px] font-bold text-slate-400 mt-2 pl-9">
                        {new Date(fb.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 mt-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/employee/continuous-feedback/${fb.feedbackId}`)}
                        className="p-2 text-slate-400 hover:text-[#2463eb] hover:bg-[#ebf4ff] rounded-xl transition-all"
                        title="View details"
                      >
                        <Eye size={17} />
                      </button>
                      {!fb.acknowledged && (
                        <button
                          onClick={() => handleAcknowledge(fb.feedbackId)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#2463eb] hover:bg-[#1d4ed8] text-white rounded-xl font-bold text-xs transition-all shadow-md active:scale-95"
                        >
                          <Check size={14} />
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
