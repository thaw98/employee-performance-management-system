import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { upwardFeedbackApi } from '../../features/continuousFeedback/upwardFeedbackApi';

export default function UpwardFeedbackCreatePage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please enter your feedback message');
      return;
    }
    try {
      setSubmitting(true);
      const resp = await upwardFeedbackApi.createFeedback({ message: message.trim() });
      toast.success('Upward feedback submitted successfully');
      navigate(`/employee/upward-feedback/${resp.data.feedbackId}`);
    } catch {
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 px-4">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm w-fit"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#dbeafe] rounded-bl-[120px] -mr-12 -mt-12 opacity-60"></div>
        <div className="relative p-8">
          <div className="flex items-center gap-2 text-[#2463eb] mb-3">
            <MessageSquare size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Upward Feedback</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Submit Upward Feedback</h1>
          <p className="text-sm font-semibold text-slate-500 mt-2">
            Share feedback with your direct manager
          </p>

          <div className="mt-8 space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                Your Feedback Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all resize-none shadow-inner"
                placeholder="Write your feedback for your manager..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSubmit}
                disabled={submitting || !message.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-[#2463eb] hover:bg-[#1d4ed8] text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#dbeafe] active:scale-95"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Submit Feedback
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-5 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
