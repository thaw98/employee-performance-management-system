import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Check, ClipboardList, Calendar, AlertTriangle, Send } from 'lucide-react';
import { continuousFeedbackApi } from '../../features/continuousFeedback/continuousFeedbackApi';
import type {
  ContinuousFeedback,
  ContinuousFeedbackActionItem,
} from '../../features/continuousFeedback/types';
import { FEEDBACK_CATEGORY_LABELS } from '../../features/continuousFeedback/types';

const ACTION_ITEM_STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function ContinuousFeedbackDetailPage() {
  const { feedbackId } = useParams<{ feedbackId: string }>();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<ContinuousFeedback | null>(null);
  const [loading, setLoading] = useState(true);

  const [newComment, setNewComment] = useState('');
  const [commentVisible, setCommentVisible] = useState(true);
  const [aiDescription, setAiDescription] = useState('');
  const [aiDueDate, setAiDueDate] = useState('');
  const [showAiForm, setShowAiForm] = useState(false);
  const [showPipWarning, setShowPipWarning] = useState(false);
  const [pipCount, setPipCount] = useState(0);
  const [meetingDesc, setMeetingDesc] = useState('');

  useEffect(() => {
    if (feedbackId) loadFeedback();
  }, [feedbackId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const resp = await continuousFeedbackApi.getFeedback(Number(feedbackId));
      setFeedback(resp.data);

      if (resp.data.pipSuggested) {
        const pipResp = await continuousFeedbackApi.getPipWarning(resp.data.employeeId);
        setShowPipWarning(pipResp.data.warningActive);
        setPipCount(pipResp.data.negativeFeedbackCount);
      }
    } catch {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    try {
      await continuousFeedbackApi.acknowledgeFeedback(Number(feedbackId));
      toast.success('Feedback acknowledged');
      loadFeedback();
    } catch {
      toast.error('Failed to acknowledge');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await continuousFeedbackApi.addComment(Number(feedbackId), {
        commentText: newComment,
        visibleToEmployee: commentVisible,
      });
      toast.success('Comment added');
      setNewComment('');
      loadFeedback();
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const handleAddActionItem = async () => {
    if (!aiDescription.trim()) {
      toast.error('Description is required');
      return;
    }
    try {
      await continuousFeedbackApi.addActionItem(Number(feedbackId), {
        description: aiDescription,
        dueDate: aiDueDate || undefined,
      });
      toast.success('Action item created');
      setAiDescription('');
      setAiDueDate('');
      setShowAiForm(false);
      loadFeedback();
    } catch {
      toast.error('Failed to create action item');
    }
  };

  const handleUpdateAiStatus = async (ai: ContinuousFeedbackActionItem, newStatus: string) => {
    try {
      await continuousFeedbackApi.updateActionItemStatus(ai.actionItemId, { status: newStatus });
      toast.success('Status updated');
      loadFeedback();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleCreateMeeting = async () => {
    try {
      await continuousFeedbackApi.createMeetingFromFeedback(Number(feedbackId), {
        description: meetingDesc || undefined,
      });
      toast.success('Follow-up meeting created');
      setMeetingDesc('');
    } catch {
      toast.error('Failed to create meeting');
    }
  };

  const handleCreatePip = async () => {
    try {
      await continuousFeedbackApi.createPipFromFeedback(Number(feedbackId));
      toast.success('PIP created from feedback');
      loadFeedback();
    } catch {
      toast.error('Failed to create PIP');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (!feedback) {
    return <div className="p-8 text-center text-gray-500">Feedback not found</div>;
  }

  const isShared = feedback.shared;
  const isEmployee = !feedback.privateManagerNote && !feedback.privateManagerNote; // simple check
  const rolePath = window.location.pathname.startsWith('/hr')
    ? '/hr'
    : window.location.pathname.startsWith('/audit')
    ? '/audit'
    : window.location.pathname.startsWith('/employee')
    ? '/employee'
    : '/manager';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-indigo-100 text-indigo-700">
                {FEEDBACK_CATEGORY_LABELS[feedback.category as keyof typeof FEEDBACK_CATEGORY_LABELS] || feedback.category}
              </span>
              {isShared ? (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700">Shared</span>
              ) : (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-700">Private Note</span>
              )}
              {feedback.acknowledged && (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-700">Acknowledged</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-800">
              Feedback for {feedback.employeeName}
            </h1>
            <p className="text-sm text-gray-500">By {feedback.managerName}</p>
          </div>
        </div>

        {feedback.feedbackMessage && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Feedback Message</h3>
            <p className="text-gray-600 bg-gray-50 rounded-lg p-3">{feedback.feedbackMessage}</p>
          </div>
        )}

        {feedback.privateManagerNote !== null && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              Private Manager Note
              <span className="text-xs text-gray-400 ml-2">(visible to managers, HR, and audit only)</span>
            </h3>
            <p className="text-gray-600 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              {feedback.privateManagerNote || '(empty)'}
            </p>
          </div>
        )}

        <div className="text-xs text-gray-400 space-y-1">
          <p>Created: {new Date(feedback.createdAt).toLocaleString()}</p>
          {feedback.sharedAt && <p>Shared: {new Date(feedback.sharedAt).toLocaleString()}</p>}
          {feedback.acknowledgedAt && <p>Acknowledged: {new Date(feedback.acknowledgedAt).toLocaleString()}</p>}
        </div>
      </div>

      {showPipWarning && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">PIP Warning</p>
              <p className="text-sm text-red-600 mt-1">
                This employee has received {pipCount} improvement/performance-risk feedback records within 30 days.
              </p>
              <button
                onClick={handleCreatePip}
                className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                Create PIP
              </button>
            </div>
          </div>
        </div>
      )}

      {!isEmployee && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowAiForm(!showAiForm)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            <ClipboardList size={16} />
            Add Action Item
          </button>
          <button
            onClick={handleCreateMeeting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Calendar size={16} />
            Create Follow-up Meeting
          </button>
        </div>
      )}

      {showAiForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">New Action Item</h3>
          <div className="space-y-3">
            <textarea
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Action item description..."
            />
            <input
              type="date"
              value={aiDueDate}
              onChange={(e) => setAiDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <div className="flex gap-2">
              <button onClick={handleAddActionItem} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                Create
              </button>
              <button onClick={() => setShowAiForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {feedback.actionItems && feedback.actionItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Action Items</h3>
          <div className="space-y-3">
            {feedback.actionItems.map((ai) => (
              <div key={ai.actionItemId} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{ai.description}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    <span>Status: {ai.status}</span>
                    {ai.dueDate && <span>Due: {new Date(ai.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
                <select
                  value={ai.status}
                  onChange={(e) => handleUpdateAiStatus(ai, e.target.value)}
                  className="ml-3 px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  {ACTION_ITEM_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {isShared && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Comments</h3>
            {!feedback.acknowledged && rolePath === '/employee' && (
              <button
                onClick={handleAcknowledge}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                <Check size={14} />
                Acknowledge
              </button>
            )}
          </div>

          <div className="space-y-3 mb-4">
            {feedback.comments && feedback.comments.length > 0 ? (
              feedback.comments.map((c) => (
                <div key={c.commentId} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800">{c.authorEmployeeName}</span>
                    <span className="text-xs text-gray-400">
                      {c.commentType.replace(/_/g, ' ')}
                      {!c.visibleToEmployee && (
                        <span className="ml-1 text-yellow-600">(internal)</span>
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{c.commentText}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No comments yet</p>
            )}
          </div>

          <div className="flex gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Add a comment..."
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send size={16} />
              </button>
              {rolePath === '/hr' && (
                <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={commentVisible}
                    onChange={(e) => setCommentVisible(e.target.checked)}
                    className="rounded"
                  />
                  Visible to employee
                </label>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
