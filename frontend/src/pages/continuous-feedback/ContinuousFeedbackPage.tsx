import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import type { RootState } from '../../app/store';
import { getRoleGroup } from '../../utils/dashboardRedirect';
import { Eye, Plus, Send } from 'lucide-react';
import { continuousFeedbackApi } from '../../features/continuousFeedback/continuousFeedbackApi';
import type { ContinuousFeedback } from '../../features/continuousFeedback/types';
import { FEEDBACK_CATEGORY_LABELS } from '../../features/continuousFeedback/types';

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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Continuous Feedback</h1>
          <p className="text-sm text-gray-500 mt-1">
            {canCreateFeedback
              ? 'Create and manage feedback for your team'
              : 'Review continuous feedback across the organization'}
          </p>
        </div>
        {canCreateFeedback && (
          <Link
            to={`${feedbackBasePath}/create`}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            New Feedback
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {canCreateFeedback ? 'Team Feedback Timeline' : 'Organization Feedback Timeline'}
          </h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : feedbacks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No feedback records yet</p>
            {canCreateFeedback && (
              <Link
                to={`${feedbackBasePath}/create`}
                className="inline-flex items-center gap-2 mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                <Plus size={16} />
                Create your first feedback
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {feedbacks.map((fb) => (
              <div key={fb.feedbackId} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                        {FEEDBACK_CATEGORY_LABELS[fb.category] || fb.category}
                      </span>
                      {fb.shared ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          Shared
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                          Private Note
                        </span>
                      )}
                      {fb.acknowledged && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          Acknowledged
                        </span>
                      )}
                      {fb.pipSuggested && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                          PIP Warning
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 font-medium">
                      {fb.employeeName} — {fb.employeeBusinessId}
                    </p>
                    {fb.feedbackMessage && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{fb.feedbackMessage}</p>
                    )}
                    {fb.privateManagerNote && (
                      <p className="text-xs text-gray-400 mt-1 italic">
                        Private note: {fb.privateManagerNote}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      type="button"
                      onClick={() => navigate(`${feedbackBasePath}/${fb.feedbackId}`)}
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="View details"
                    >
                      <Eye size={18} />
                    </button>
                    {canCreateFeedback && !fb.shared && (
                      <button
                        type="button"
                        onClick={() => handleShare(fb.feedbackId)}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="Share feedback"
                      >
                        <Send size={18} />
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
