import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, Check, MessageSquare, Search, ChevronLeft, ChevronRight, ChevronDown, BarChart3, Clock, X } from 'lucide-react';
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

type AckFilter = 'ALL' | 'PENDING' | 'ACKNOWLEDGED';

export default function EmployeeContinuousFeedbackPage() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<ContinuousFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [ackFilter, setAckFilter] = useState<AckFilter>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [totalShared, setTotalShared] = useState(0);
  const [pendingAcknowledgment, setPendingAcknowledgment] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const loadFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const acknowledged =
        ackFilter === 'PENDING' ? false : ackFilter === 'ACKNOWLEDGED' ? true : undefined;
      const resp = await continuousFeedbackApi.getMyFeedback({
        page: currentPage - 1,
        size: PAGE_SIZE,
        search: debouncedSearch || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        acknowledged,
      });
      const data = resp.data;
      setFeedbacks(data.content);
      setTotalPages(Math.max(1, data.totalPages));
      setTotalElements(data.totalElements);
      setTotalShared(data.totalShared);
      setPendingAcknowledgment(data.pendingAcknowledgment);
      if (currentPage > data.totalPages && data.totalPages > 0) {
        setCurrentPage(data.totalPages);
      }
    } catch {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, categoryFilter, ackFilter]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, categoryFilter, ackFilter]);

  const handleAcknowledge = async (feedbackId: number) => {
    try {
      await continuousFeedbackApi.acknowledgeFeedback(feedbackId);
      toast.success('Feedback acknowledged');
      loadFeedback();
    } catch {
      toast.error('Failed to acknowledge');
    }
  };

  const hasActiveFilters =
    Boolean(debouncedSearch) || categoryFilter !== 'ALL' || ackFilter !== 'ALL';

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setAckFilter('ALL');
    setCurrentPage(1);
  };

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const showPagination = totalPages > 1;
  const rangeStart = totalElements === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safeCurrentPage * PAGE_SIZE, totalElements);

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
          <p className="text-2xl font-black text-[#2463eb]">{totalShared}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Acknowledgment</span>
            <div className={`w-8 h-8 rounded-xl ${pendingAcknowledgment > 0 ? 'bg-amber-50' : 'bg-slate-50'} flex items-center justify-center`}>
              <Clock size={15} className={pendingAcknowledgment > 0 ? 'text-amber-600' : 'text-slate-400'} />
            </div>
          </div>
          <p className={`text-2xl font-black ${pendingAcknowledgment > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
            {pendingAcknowledgment}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-[20px] shadow-sm border border-slate-100 space-y-3">
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
              className="w-full sm:w-auto pl-3 pr-9 py-2.5 rounded-xl text-[11px] font-bold border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {Object.entries(FEEDBACK_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} aria-hidden />
          </div>
          <div className="relative">
            <select
              value={ackFilter}
              onChange={(e) => setAckFilter(e.target.value as AckFilter)}
              className="w-full sm:w-auto pl-3 pr-9 py-2.5 rounded-xl text-[11px] font-bold border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending Acknowledgment</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} aria-hidden />
          </div>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-[#2463eb] transition-colors"
          >
            <X size={14} />
            Clear filters
          </button>
        )}
      </div>

      {/* Shared Feedback List */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <MessageSquare size={15} />
            <h2 className="text-[10px] font-black uppercase tracking-widest">Shared Feedback</h2>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {totalElements} result{totalElements !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-[3px] border-slate-100 border-t-[#2463eb] rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-400 animate-pulse">Loading feedback...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
              <MessageSquare size={28} className="text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-400">
              {hasActiveFilters ? 'No feedback matches your filters' : 'No shared feedback yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-50">
              {feedbacks.map((fb, index) => (
                <div
                  key={fb.feedbackId}
                  className={`p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer animate-fade-in-up group ${
                    !fb.acknowledged ? 'bg-amber-50/30 border-l-4 border-l-amber-400' : ''
                  }`}
                  style={{ animationDelay: `${(index % PAGE_SIZE) * 30}ms` }}
                  onClick={() => navigate(`/employee/continuous-feedback/${fb.feedbackId}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${categoryColorMap[fb.category] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {FEEDBACK_CATEGORY_LABELS[fb.category] || fb.category}
                        </span>
                        {fb.acknowledged ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-blue-50 text-[#1d4ed8] border-[#bfdbfe] inline-flex items-center gap-1">
                            <Check size={9} />
                            Acknowledged
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-amber-50 text-amber-700 border-amber-200 inline-flex items-center gap-1">
                            <Clock size={9} />
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">
                          {(fb.managerName || '?').charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-bold text-slate-800">From: {fb.managerName || 'Manager'}</p>
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

            {showPagination && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <p className="text-[11px] font-bold text-slate-400 shrink-0">
                  Showing {rangeStart}&ndash;{rangeEnd} of {totalElements}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
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
                        type="button"
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
                    type="button"
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
