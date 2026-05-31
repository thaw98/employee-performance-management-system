import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, Check, MessageSquare, CheckCircle } from 'lucide-react';
import { continuousFeedbackApi } from '../../features/continuousFeedback/continuousFeedbackApi';
import type { ContinuousFeedback } from '../../features/continuousFeedback/types';
import { FEEDBACK_CATEGORY_LABELS } from '../../features/continuousFeedback/types';

const categoryColors: Record<string, string> = {
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

  useEffect(() => {
    loadFeedback();
  }, []);

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

  const unacknowledged = feedbacks.filter((fb) => !fb.acknowledged);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4">
      {/* Header */}
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#dbeafe] rounded-bl-[120px] -mr-12 -mt-12 opacity-60"></div>
        <div className="relative">
          <div className="flex items-center gap-2 text-[#2463eb] mb-3">
            <MessageSquare size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Feedback</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Continuous Feedback</h1>
          <p className="text-sm font-semibold text-slate-500 mt-2">
            View feedback shared with you by your manager
          </p>
        </div>
      </div>

      {/* Stats Mini */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Feedback</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{feedbacks.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Acknowledgment</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{unacknowledged.length}</p>
        </div>
      </div>

      {/* Unacknowledged Feedback */}
      {unacknowledged.length > 0 && (
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2 text-amber-600">
            <CheckCircle size={16} />
            <h2 className="text-[10px] font-black uppercase tracking-widest">Pending Acknowledgment</h2>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full ml-auto border border-amber-200">
              {unacknowledged.length}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {unacknowledged.map((fb, index) => (
              <div
                key={fb.feedbackId}
                className="p-5 hover:bg-slate-50/80 transition-colors animate-fade-in-up"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        categoryColors[fb.category] || 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {FEEDBACK_CATEGORY_LABELS[fb.category as keyof typeof FEEDBACK_CATEGORY_LABELS] || fb.category}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">From: {fb.managerName}</p>
                    {fb.feedbackMessage && (
                      <p className="text-sm font-medium text-slate-600 mt-1.5 leading-relaxed">{fb.feedbackMessage}</p>
                    )}
                    <p className="text-[10px] font-bold text-slate-400 mt-2">
                      {new Date(fb.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => navigate(`/employee/continuous-feedback/${fb.feedbackId}`)}
                      className="p-2.5 text-slate-400 hover:text-[#2463eb] hover:bg-[#ebf4ff] rounded-xl transition-all"
                      title="View details"
                    >
                      <Eye size={18} />
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
        <div className="p-6 border-b border-slate-100 flex items-center gap-2 text-slate-400">
          <MessageSquare size={16} />
          <h2 className="text-[10px] font-black uppercase tracking-widest">Shared Feedback</h2>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full ml-auto">{feedbacks.length}</span>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-[#2463eb] rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-400 animate-pulse">Loading feedback...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <MessageSquare size={40} className="text-slate-200" />
            <p className="text-sm font-bold text-slate-400">No shared feedback yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {feedbacks.map((fb, index) => (
              <div
                key={fb.feedbackId}
                className="p-5 hover:bg-slate-50/80 transition-colors cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${index * 40}ms` }}
                onClick={() => navigate(`/employee/continuous-feedback/${fb.feedbackId}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        categoryColors[fb.category] || 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {FEEDBACK_CATEGORY_LABELS[fb.category as keyof typeof FEEDBACK_CATEGORY_LABELS] || fb.category}
                      </span>
                      {fb.acknowledged && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-blue-50 text-[#1d4ed8] border-[#bfdbfe]">
                          <div className="flex items-center gap-1">
                            <Check size={10} />
                            Acknowledged
                          </div>
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-800">From: {fb.managerName}</p>
                    {fb.feedbackMessage && (
                      <p className="text-sm font-medium text-slate-600 mt-1.5 leading-relaxed">{fb.feedbackMessage}</p>
                    )}
                    <p className="text-[10px] font-bold text-slate-400 mt-2">
                      {new Date(fb.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/employee/continuous-feedback/${fb.feedbackId}`)}
                      className="p-2.5 text-slate-400 hover:text-[#2463eb] hover:bg-[#ebf4ff] rounded-xl transition-all"
                      title="View details"
                    >
                      <Eye size={18} />
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
        )}
      </div>
    </div>
  );
}
