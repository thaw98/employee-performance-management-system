import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Check, ClipboardList, Calendar, AlertTriangle, Send, MessageSquare, User, Lock, Clock, CheckCircle, CalendarCheck, History, XCircle, Edit3 } from 'lucide-react';
import ConfirmActionModal from '../../features/hrEmployeeList/components/ConfirmActionModal';
import { continuousFeedbackApi } from '../../features/continuousFeedback/continuousFeedbackApi';
import { useAppSelector } from '../../app/hooks';
import { usePermissionState } from '../../features/permission/usePermission';
import type {
  ContinuousFeedback,
  ContinuousFeedbackActionItem,
  AuditLogEntry,
} from '../../features/continuousFeedback/types';
import { FEEDBACK_CATEGORY_LABELS } from '../../features/continuousFeedback/types';

const ACTION_ITEM_STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const statusStyles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  OPEN: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
  IN_PROGRESS: { bg: 'bg-blue-50', text: 'text-[#1d4ed8]', border: 'border-[#bfdbfe]', dot: 'bg-[#2463eb]' },
  COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  CANCELLED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-400' },
};

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
  const [activePipId, setActivePipId] = useState<number | null>(null);
  const [meetingDesc, setMeetingDesc] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [auditTimeline, setAuditTimeline] = useState<AuditLogEntry[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [editingScheduled, setEditingScheduled] = useState(false);
  const [editScheduledDate, setEditScheduledDate] = useState('');
  const [editScheduledTime, setEditScheduledTime] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showPipConfirmModal, setShowPipConfirmModal] = useState(false);
  const [isCreatingPip, setIsCreatingPip] = useState(false);

  const authUser = useAppSelector((s) => s.auth.user);
  const { hasPermission } = usePermissionState();
  const canManageFeedbackActions = authUser?.roleId === 2 || authUser?.roleId === 3;
  const canManagePipCreation = canManageFeedbackActions && hasPermission('CONTINUOUS_FEEDBACK', 'create_pip');

  const isInternal = window.location.pathname.startsWith('/hr')
    || window.location.pathname.startsWith('/audit')
    || window.location.pathname.startsWith('/manager');

  useEffect(() => {
    if (feedbackId) loadFeedback();
  }, [feedbackId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const resp = await continuousFeedbackApi.getFeedback(Number(feedbackId));
      setFeedback(resp.data);
      setEditMessage(resp.data.feedbackMessage || '');
      if (resp.data.scheduledPublishAt) {
        const d = new Date(resp.data.scheduledPublishAt);
        setEditScheduledDate(d.toISOString().slice(0, 10));
        setEditScheduledTime(d.toISOString().slice(11, 16));
      }

      if (resp.data.pipSuggested || canManagePipCreation) {
        const pipResp = await continuousFeedbackApi.getPipWarning(resp.data.employeeId);
        setShowPipWarning(pipResp.data.warningActive);
        setPipCount(pipResp.data.negativeFeedbackCount);
        setActivePipId(pipResp.data.activePipId ?? null);
      }
    } catch {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditTimeline = async () => {
    try {
      const resp = await continuousFeedbackApi.getFeedbackAuditTimeline(Number(feedbackId));
      setAuditTimeline(resp.data);
      setShowTimeline(true);
    } catch {
      toast.error('Failed to load audit timeline');
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

  const handleUpdateScheduled = async () => {
    if (!editScheduledDate || !editScheduledTime) {
      toast.error('Date and time are required');
      return;
    }
    try {
      await continuousFeedbackApi.updateScheduledFeedback(Number(feedbackId), {
        feedbackMessage: editMessage,
        scheduledPublishAt: new Date(`${editScheduledDate}T${editScheduledTime}`).toISOString(),
      });
      toast.success('Scheduled feedback updated');
      setEditingScheduled(false);
      loadFeedback();
    } catch {
      toast.error('Failed to update scheduled feedback');
    }
  };

  const handleCancelScheduled = async () => {
    try {
      await continuousFeedbackApi.cancelScheduledFeedback(Number(feedbackId));
      toast.success('Scheduled feedback cancelled');
      setShowCancelConfirm(false);
      loadFeedback();
    } catch {
      toast.error('Failed to cancel scheduled feedback');
    }
  };

  const handleCreateMeeting = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmCreateMeeting = async () => {
    setIsCreatingMeeting(true);
    try {
      const resp = await continuousFeedbackApi.createMeetingFromFeedback(Number(feedbackId), {
        description: meetingDesc || undefined,
      });
      toast.success('Follow-up meeting created');
      setShowConfirmModal(false);
      setMeetingDesc('');
      const rolePath = window.location.pathname.startsWith('/hr') ? '/hr' : '/manager';
      navigate(`${rolePath}/meetings/${resp.data.id}`);
    } catch {
      toast.error('Failed to create meeting');
    } finally {
      setIsCreatingMeeting(false);
    }
  };

  const handleCreatePip = () => {
    setShowPipConfirmModal(true);
  };

  const handleConfirmCreatePip = async () => {
    setIsCreatingPip(true);
    try {
      const resp = await continuousFeedbackApi.createPipFromFeedback(Number(feedbackId));
      toast.success('PIP created from feedback');
      setShowPipConfirmModal(false);
      const rolePath = window.location.pathname.startsWith('/hr') ? '/hr' : '/manager';
      if (resp.data?.id) {
        const pipPath = rolePath === '/hr' ? `/hr/pip-monitoring/${resp.data.id}` : `/manager/pip/${resp.data.id}`;
        navigate(pipPath);
      } else {
        navigate(rolePath === '/hr' ? '/hr/pip-monitoring' : '/manager/pip');
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || 'Failed to create PIP');
    } finally {
      setIsCreatingPip(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#2463eb] rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-400 animate-pulse">Loading feedback details...</p>
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

  const isShared = feedback.shared;
  const isScheduled = feedback.visibilityStatus === 'SCHEDULED';
  const isCancelled = feedback.visibilityStatus === 'CANCELLED';
  const isPrivateNote = feedback.visibilityStatus === 'PRIVATE_NOTE';
  const rolePath = window.location.pathname.startsWith('/hr')
    ? '/hr'
    : window.location.pathname.startsWith('/audit')
    ? '/audit'
    : window.location.pathname.startsWith('/employee')
    ? '/employee'
    : '/manager';

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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm w-fit"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Main Detail Card */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#dbeafe] rounded-bl-[120px] -mr-12 -mt-12 opacity-50"></div>
        <div className="relative p-8">
          {/* Badges Row */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${categoryColorMap[feedback.category] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
              {FEEDBACK_CATEGORY_LABELS[feedback.category as keyof typeof FEEDBACK_CATEGORY_LABELS] || feedback.category}
            </span>
            {isShared ? (
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-700 border-emerald-200">
                <div className="flex items-center gap-1">
                  <CheckCircle size={10} />
                  Shared
                </div>
              </span>
            ) : isScheduled ? (
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-violet-50 text-violet-700 border-violet-200">
                <div className="flex items-center gap-1">
                  <Clock size={10} />
                  Scheduled
                </div>
              </span>
            ) : isCancelled ? (
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-rose-50 text-rose-700 border-rose-200">
                <div className="flex items-center gap-1">
                  <XCircle size={10} />
                  Cancelled
                </div>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-amber-50 text-amber-800 border-amber-200">
                <div className="flex items-center gap-1">
                  <Lock size={10} />
                  Private Note
                </div>
              </span>
            )}
            {feedback.acknowledged && (
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-blue-50 text-[#1d4ed8] border-[#bfdbfe]">
                <div className="flex items-center gap-1">
                  <Check size={10} />
                  Acknowledged
                </div>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[#2463eb] mb-4">
            <MessageSquare size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Feedback Details</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-1">
            Feedback for {feedback.employeeName}
          </h1>
          <p className="text-sm font-bold text-slate-500 mb-6">
            <User size={14} className="inline mr-1" />
            By {feedback.managerName}
          </p>

          {/* Detail Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</p>
                  <p className="text-sm font-bold text-slate-700">{feedback.employeeName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</p>
                  <p className="text-sm font-bold text-slate-700">{FEEDBACK_CATEGORY_LABELS[feedback.category as keyof typeof FEEDBACK_CATEGORY_LABELS]}</p>
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
              {feedback.scheduledPublishAt && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-500 shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scheduled Publish</p>
                    <p className="text-sm font-bold text-slate-700">
                      {new Date(feedback.scheduledPublishAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
              {feedback.sharedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                    <Send size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shared</p>
                    <p className="text-sm font-bold text-slate-700">
                      {new Date(feedback.sharedAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
              {feedback.acknowledgedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                    <Check size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acknowledged</p>
                    <p className="text-sm font-bold text-slate-700">
                      {new Date(feedback.acknowledgedAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
              {feedback.cancelledAt && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                    <XCircle size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancelled</p>
                    <p className="text-sm font-bold text-slate-700">
                      {new Date(feedback.cancelledAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Feedback Message */}
          {feedback.feedbackMessage && (
            <div className="mt-6 bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center gap-2 text-slate-400 mb-3">
                <MessageSquare size={14} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Feedback Message</h3>
              </div>
              <p className="text-sm font-bold text-slate-700 leading-relaxed">{feedback.feedbackMessage}</p>
            </div>
          )}

          {/* Private Manager Note */}
          {feedback.privateManagerNote !== null && (
            <div className="mt-4 bg-amber-50/50 rounded-2xl p-5 border border-amber-200">
              <div className="flex items-center gap-2 text-amber-600 mb-3">
                <Lock size={14} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Private Manager Note</h3>
                <span className="text-[10px] font-bold text-amber-500 normal-case tracking-normal">(visible to managers, HR, and audit only)</span>
              </div>
              <p className="text-sm font-bold text-slate-700 leading-relaxed">{feedback.privateManagerNote || <span className="text-slate-400 italic">(empty)</span>}</p>
            </div>
          )}
        </div>
      </div>

      {/* Scheduled Feedback Controls */}
      {isScheduled && isInternal && (
        <div className="bg-violet-50 border border-violet-200 rounded-[32px] p-6 relative overflow-hidden animate-fade-in-up">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-200/30 rounded-bl-[80px] -mr-6 -mt-6"></div>
          <div className="relative">
            <div className="flex items-center gap-2 text-violet-600 mb-4">
              <Clock size={18} />
              <h3 className="text-xs font-black uppercase tracking-widest">Scheduled Feedback Controls</h3>
            </div>

            {editingScheduled ? (
              <div className="space-y-4">
                <textarea
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-violet-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:border-violet-500 focus:ring-1 focus:ring-violet-200 outline-none transition-all resize-none shadow-inner"
                  placeholder="Feedback message"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={editScheduledDate}
                    onChange={(e) => setEditScheduledDate(e.target.value)}
                    className="w-full bg-white border border-violet-200 rounded-2xl px-4 py-3 text-sm font-bold focus:border-violet-500 focus:ring-1 focus:ring-violet-200 outline-none transition-all shadow-inner"
                  />
                  <input
                    type="time"
                    value={editScheduledTime}
                    onChange={(e) => setEditScheduledTime(e.target.value)}
                    className="w-full bg-white border border-violet-200 rounded-2xl px-4 py-3 text-sm font-bold focus:border-violet-500 focus:ring-1 focus:ring-violet-200 outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={handleUpdateScheduled} className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95">
                    Save Changes
                  </button>
                  <button onClick={() => setEditingScheduled(false)} className="px-5 py-2.5 bg-white text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all border border-slate-200 active:scale-95">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setEditingScheduled(true)} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95">
                  <Edit3 size={16} />
                  Edit Scheduled Feedback
                </button>
                <button onClick={() => setShowCancelConfirm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95">
                  <XCircle size={16} />
                  Cancel Schedule
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PIP Warning */}
      {showPipWarning && (
        <div className="bg-rose-50 border border-rose-200 rounded-[32px] p-6 relative overflow-hidden animate-fade-in-up">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-200/30 rounded-bl-[80px] -mr-6 -mt-6"></div>
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="text-rose-600" size={24} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-rose-800 uppercase tracking-widest">PIP Warning</p>
              <p className="text-sm font-bold text-rose-600 mt-1">
                This employee has received {pipCount} improvement/performance-risk feedback records within 30 days.
              </p>
              {canManagePipCreation && activePipId ? (
                <button
                  type="button"
                  onClick={() => {
                    const rolePath = window.location.pathname.startsWith('/hr') ? '/hr' : '/manager';
                    const pipPath = rolePath === '/hr' ? `/hr/pip-monitoring/${activePipId}` : `/manager/pip/${activePipId}`;
                    navigate(pipPath);
                  }}
                  className="mt-4 px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                >
                  View Active PIP
                </button>
              ) : canManagePipCreation ? (
                <button
                  type="button"
                  onClick={handleCreatePip}
                  className="mt-4 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-200 active:scale-95"
                >
                  Create PIP
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {rolePath !== '/employee' && !isCancelled && (
        <div className="flex flex-wrap gap-3">
          {canManageFeedbackActions && (
            <button
              onClick={() => setShowAiForm(!showAiForm)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#2463eb] hover:bg-[#1d4ed8] text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#dbeafe] active:scale-95"
            >
              <ClipboardList size={16} />
              Add Action Item
            </button>
          )}
          {canManageFeedbackActions && (
            <button
              onClick={handleCreateMeeting}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-100 active:scale-95"
            >
              <Calendar size={16} />
              Create Follow-up Meeting
            </button>
          )}
          {isInternal && (
            <button
              onClick={() => {
                if (!showTimeline) loadAuditTimeline();
                else setShowTimeline(!showTimeline);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95"
            >
              <History size={16} />
              {showTimeline ? 'Hide Timeline' : 'Audit Timeline'}
            </button>
          )}
        </div>
      )}

      {/* Add Action Item Form */}
      {canManageFeedbackActions && showAiForm && (
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 animate-fade-in-up">
          <div className="flex items-center gap-2 text-[#2463eb] mb-4">
            <ClipboardList size={16} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">New Action Item</h3>
          </div>
          <div className="space-y-4">
            <textarea
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all resize-none shadow-inner"
              placeholder="Action item description..."
            />
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={aiDueDate}
                  onChange={(e) => setAiDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all shadow-inner"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleAddActionItem} className="px-5 py-2.5 bg-[#2463eb] hover:bg-[#1d4ed8] text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95">
                Create
              </button>
              <button onClick={() => setShowAiForm(false)} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-95">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Items List */}
      {feedback.actionItems && feedback.actionItems.length > 0 && (
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2 text-slate-400">
            <ClipboardList size={16} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Action Items</h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full ml-auto">{feedback.actionItems.length}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {feedback.actionItems.map((ai) => {
              const s = statusStyles[ai.status] || statusStyles['OPEN'];
              return (
                <div key={ai.actionItemId} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${s.dot} shrink-0`} />
                      <p className="text-sm font-bold text-slate-800">{ai.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 ml-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${s.bg} ${s.text} ${s.border}`}>
                        {ai.status}
                      </span>
                      {ai.dueDate && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <Calendar size={12} />
                          Due: {new Date(ai.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                      {ai.completedAt && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                          <Check size={12} />
                          Completed: {new Date(ai.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                  {canManageFeedbackActions && (
                    <select
                      value={ai.status}
                      onChange={(e) => handleUpdateAiStatus(ai, e.target.value)}
                      className="shrink-0 px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all"
                    >
                      {ACTION_ITEM_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Audit Timeline - Internal only */}
      {showTimeline && isInternal && (
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2 text-slate-400">
            <History size={16} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Activity Timeline</h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full ml-auto">{auditTimeline.length} events</span>
          </div>
          <div className="p-6">
            {auditTimeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 opacity-40">
                <History size={32} className="text-slate-300 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No timeline events</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200" />
                <div className="space-y-0">
                  {auditTimeline.map((event, idx) => (
                    <div key={event.id} className="relative pl-10 pb-6 last:pb-0">
                      <div className={`absolute left-[5px] w-3.5 h-3.5 rounded-full border-2 border-white ${
                        idx === 0 ? 'bg-[#2463eb]' : 'bg-slate-300'
                      }`} />
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-700">
                            {event.actionType.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {new Date(event.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-500">{event.description}</p>
                        {event.performedByUserName && (
                          <p className="text-[10px] font-bold text-slate-400 mt-1">By: {event.performedByUserName}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comments Section */}
      {isShared && (
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <MessageSquare size={16} />
              <h3 className="text-[10px] font-black uppercase tracking-widest">Comments</h3>
              {feedback.comments && feedback.comments.length > 0 && (
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">{feedback.comments.length}</span>
              )}
            </div>
            {!feedback.acknowledged && rolePath === '/employee' && (
              <button
                onClick={handleAcknowledge}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#2463eb] hover:bg-[#1d4ed8] text-white rounded-xl font-bold text-xs transition-all shadow-md active:scale-95"
              >
                <Check size={14} />
                Acknowledge
              </button>
            )}
          </div>

          <div className="p-6 space-y-4">
            {feedback.comments && feedback.comments.length > 0 ? (
              feedback.comments.map((c) => (
                <div key={c.commentId} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#2463eb]/10 text-[#2463eb] flex items-center justify-center text-[10px] font-black uppercase">
                        {c.authorEmployeeName?.charAt(0) || '?'}
                      </span>
                      <span className="text-sm font-bold text-slate-800">{c.authorEmployeeName}</span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full">
                        {c.commentType.replace(/_/g, ' ')}
                      </span>
                      {!c.visibleToEmployee && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Internal
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-700 ml-8">{c.commentText}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 ml-8">
                    {new Date(c.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 opacity-40">
                <MessageSquare size={32} className="text-slate-300 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No comments yet</p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-100">
            <div className="flex gap-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all resize-none shadow-inner"
                placeholder="Add a comment..."
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-3 bg-[#2463eb] hover:bg-[#1d4ed8] text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95"
                >
                  <Send size={16} />
                </button>
                {rolePath === '/hr' && (
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={commentVisible}
                      onChange={(e) => setCommentVisible(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-[#2463eb] focus:ring-[#dbeafe]"
                    />
                    Visible
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmActionModal
        isOpen={showConfirmModal}
        onClose={() => { if (!isCreatingMeeting) setShowConfirmModal(false); }}
        onConfirm={handleConfirmCreateMeeting}
        title="Create Follow-up Meeting"
        message={`This will create a follow-up one-on-one meeting for ${feedback.employeeName} based on this feedback.`}
        description="A new one-on-one meeting will be scheduled. You can configure the details after creation."
        confirmText="Create Meeting"
        cancelText="Cancel"
        isLoading={isCreatingMeeting}
        variant="success"
        icon={<CalendarCheck size={22} />}
      />

      <ConfirmActionModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelScheduled}
        title="Cancel Scheduled Feedback"
        message={`Are you sure you want to cancel this scheduled feedback for ${feedback.employeeName}?`}
        description="The feedback will not be published to the employee. This action cannot be undone."
        confirmText="Yes, Cancel"
        cancelText="No, Keep"
        isLoading={false}
        variant="danger"
        icon={<XCircle size={22} />}
      />

      <ConfirmActionModal
        isOpen={showPipConfirmModal}
        onClose={() => { if (!isCreatingPip) setShowPipConfirmModal(false); }}
        onConfirm={handleConfirmCreatePip}
        title="Create PIP?"
        message={`This will create a Performance Improvement Plan for ${feedback.employeeName} based on this feedback.${pipCount > 0 ? ` (${pipCount} negative feedback records in 30 days)` : ''}`}
        description="You will be redirected to the new PIP record after creation."
        confirmText="Confirm"
        cancelText="Cancel"
        isLoading={isCreatingPip}
        variant="warning"
        icon={<AlertTriangle size={22} />}
      />
    </div>
  );
}
