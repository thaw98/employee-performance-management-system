import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft, MessageSquare, User, Clock, Send, CheckCircle,
  Lock, History, Reply, XCircle
} from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { getRoleGroup } from '../../utils/dashboardRedirect';
import { upwardFeedbackApi } from '../../features/continuousFeedback/upwardFeedbackApi';
import type { UpwardFeedback, UpwardFeedbackReply } from '../../features/continuousFeedback/types';

export default function UpwardFeedbackDetailPage() {
  const { feedbackId } = useParams<{ feedbackId: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const roleGroup = user ? getRoleGroup(user) : null;
  const [feedback, setFeedback] = useState<UpwardFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (feedbackId) loadFeedback();
  }, [feedbackId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const resp = await upwardFeedbackApi.getFeedback(Number(feedbackId));
      setFeedback(resp.data);
    } catch {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReply = async () => {
    if (!replyText.trim()) return;
    try {
      await upwardFeedbackApi.addReply(Number(feedbackId), { message: replyText.trim() });
      toast.success('Reply added');
      setReplyText('');
      loadFeedback();
    } catch {
      toast.error('Failed to add reply');
    }
  };

  const handleClose = async () => {
    try {
      await upwardFeedbackApi.closeFeedback(Number(feedbackId));
      toast.success('Feedback closed');
      loadFeedback();
    } catch {
      toast.error('Failed to close feedback');
    }
  };

  const rolePath = window.location.pathname.startsWith('/hr')
    ? '/hr' : window.location.pathname.startsWith('/audit')
    ? '/audit' : window.location.pathname.startsWith('/employee')
    ? '/employee' : '/manager';

  const canParticipate = roleGroup !== 'HR' && roleGroup !== 'AUDIT';
  const isOpen = feedback?.status === 'OPEN';

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#2463eb] rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-400 animate-pulse">Loading feedback...</p>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="max-w-4xl mx-auto p-12 flex flex-col items-center justify-center gap-3">
        <MessageSquare size={40} className="text-slate-200" />
        <p className="text-sm font-bold text-slate-400">Feedback not found</p>
        <button onClick={() => navigate(-1)} className="text-[#2463eb] text-sm font-bold hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm w-fit"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Main Card */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#dbeafe] rounded-bl-[120px] -mr-12 -mt-12 opacity-50"></div>
        <div className="relative p-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              isOpen
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              <div className="flex items-center gap-1">
                {isOpen ? <MessageSquare size={10} /> : <Lock size={10} />}
                {feedback.status}
              </div>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[#2463eb] mb-4">
            <MessageSquare size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Upward Feedback</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-1">
            Feedback to {feedback.managerName}
          </h1>
          <p className="text-sm font-bold text-slate-500 mb-6">
            <User size={14} className="inline mr-1" />
            By {feedback.employeeName}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">From</p>
                  <p className="text-sm font-bold text-slate-700">{feedback.employeeName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To</p>
                  <p className="text-sm font-bold text-slate-700">{feedback.managerName}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Created</p>
                  <p className="text-sm font-bold text-slate-700">
                    {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              {feedback.closedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                    <XCircle size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Closed</p>
                    <p className="text-sm font-bold text-slate-700">
                      {new Date(feedback.closedAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="mt-6 bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 mb-3">
              <MessageSquare size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-widest">Feedback Message</h3>
            </div>
            <p className="text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">{feedback.message}</p>
          </div>

          {/* Close Button */}
          {canParticipate && isOpen && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleClose}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-sm transition-all active:scale-95"
              >
                <XCircle size={16} />
                Close Thread
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Replies Section */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2 text-slate-400">
          <Reply size={16} />
          <h3 className="text-[10px] font-black uppercase tracking-widest">Replies</h3>
          {feedback.replies && feedback.replies.length > 0 && (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full ml-auto">
              {feedback.replies.length}
            </span>
          )}
        </div>

        <div className="p-6 space-y-4">
          {feedback.replies && feedback.replies.length > 0 ? (
            feedback.replies.map((r) => (
              <div key={r.replyId} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#2463eb]/10 text-[#2463eb] flex items-center justify-center text-[10px] font-black uppercase">
                      {r.authorEmployeeName?.charAt(0) || '?'}
                    </span>
                    <span className="text-sm font-bold text-slate-800">{r.authorEmployeeName}</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-700 ml-8 whitespace-pre-wrap">{r.message}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2 ml-8">
                  {new Date(r.createdAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 opacity-40">
              <Reply size={32} className="text-slate-300 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No replies yet</p>
            </div>
          )}
        </div>

        {/* Add Reply */}
        {canParticipate && isOpen && (
          <div className="p-6 border-t border-slate-100">
            <div className="flex gap-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all resize-none shadow-inner"
                placeholder="Add a reply..."
              />
              <button
                onClick={handleAddReply}
                disabled={!replyText.trim()}
                className="px-4 py-3 bg-[#2463eb] hover:bg-[#1d4ed8] text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History Section */}
      {feedback.history && feedback.history.length > 0 && (
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2 text-slate-400">
            <History size={16} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Audit History</h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full ml-auto">
              {feedback.history.length}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {feedback.history.map((h) => (
              <div key={h.historyId} className="p-4 flex items-start gap-3 hover:bg-slate-50/80 transition-colors">
                <div className="w-2 h-2 rounded-full bg-[#2463eb] mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800">{h.actorEmployeeName}</p>
                  <p className="text-xs font-medium text-slate-500">{h.description}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    {new Date(h.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                  {h.eventType.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
