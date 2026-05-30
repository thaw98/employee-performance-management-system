import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, Check } from 'lucide-react';
import { continuousFeedbackApi } from '../../features/continuousFeedback/continuousFeedbackApi';
import type { ContinuousFeedback } from '../../features/continuousFeedback/types';
import { FEEDBACK_CATEGORY_LABELS } from '../../features/continuousFeedback/types';

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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Continuous Feedback</h1>
        <p className="text-sm text-gray-500 mt-1">View feedback shared with you by your manager</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Shared Feedback</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : feedbacks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No shared feedback yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {feedbacks.map((fb) => (
              <div key={fb.feedbackId} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                        {FEEDBACK_CATEGORY_LABELS[fb.category as keyof typeof FEEDBACK_CATEGORY_LABELS] || fb.category}
                      </span>
                      {fb.acknowledged && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          Acknowledged
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800">From: {fb.managerName}</p>
                    {fb.feedbackMessage && (
                      <p className="text-sm text-gray-600 mt-1">{fb.feedbackMessage}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => navigate(`/employee/continuous-feedback/${fb.feedbackId}`)}
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="View details"
                    >
                      <Eye size={18} />
                    </button>
                    {!fb.acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(fb.feedbackId)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
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
