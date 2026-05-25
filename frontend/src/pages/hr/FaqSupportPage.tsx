import { useState } from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, Inbox, Loader2, MessageSquareReply, RefreshCw, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useGetHrFaqQuestionsQuery,
  usePublishFaqQuestionMutation,
  useReplyFaqQuestionMutation,
  type FaqSupportQuestion,
  type FaqSupportStatus,
} from '../../features/faq/faqSupportApi';

type StatusFilter = 'all' | FaqSupportStatus;

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'ANSWERED', label: 'Answered' },
];

function formatDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getApiErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'object' && data !== null && 'message' in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
  }

  return 'Check that the backend is running and the FAQ support API is available.';
}

export function FaqSupportPage() {
  const [status, setStatus] = useState<StatusFilter>('OPEN');
  const [selectedQuestion, setSelectedQuestion] = useState<FaqSupportQuestion | null>(null);
  const [replyText, setReplyText] = useState('');
  const [questionOverrides, setQuestionOverrides] = useState<Record<number, FaqSupportQuestion>>({});
  const { data, error, isLoading, isFetching, isError, refetch } = useGetHrFaqQuestionsQuery({ status: 'all', page: 0, size: 50 });
  const [replyFaqQuestion, { isLoading: isReplying }] = useReplyFaqQuestionMutation();
  const [publishFaqQuestion, { isLoading: isPublishing }] = usePublishFaqQuestionMutation();

  const serverQuestions = data?.data?.content ?? [];
  const questions = serverQuestions.map((question) => questionOverrides[question.id] ?? question);
  const extraQuestions = Object.values(questionOverrides).filter(
    (question) => !serverQuestions.some((serverQuestion) => serverQuestion.id === question.id),
  );
  const allQuestions = [...extraQuestions, ...questions];
  const visibleQuestions = status === 'all' ? allQuestions : allQuestions.filter((question) => question.status === status);

  const openReply = (question: FaqSupportQuestion) => {
    setSelectedQuestion(question);
    setReplyText(question.answer ?? '');
  };

  const submitReply = async () => {
    if (!selectedQuestion) return;
    const answer = replyText.trim();
    if (!answer) {
      toast.error('Please enter a reply.');
      return;
    }

    try {
      const response = await replyFaqQuestion({ id: selectedQuestion.id, answer }).unwrap();
      setQuestionOverrides((current) => ({ ...current, [response.data.id]: response.data }));
      toast.success('Reply sent to user.');
      setSelectedQuestion(null);
      setReplyText('');
      setStatus('ANSWERED');
      refetch();
    } catch (err) {
      console.error('Failed to reply to FAQ question', err);
      toast.error('Failed to send reply.');
    }
  };

  const publishQuestion = async (question: FaqSupportQuestion) => {
    try {
      const response = await publishFaqQuestion(question.id).unwrap();
      setQuestionOverrides((current) => ({ ...current, [response.data.id]: response.data }));
      toast.success('Published to FAQ.');
    } catch (err) {
      console.error('Failed to publish FAQ question', err);
      toast.error('Only answered questions can be published.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#dbeafe] text-[#2463eb] dark:bg-[#2463eb]/20 dark:text-[#60a5fa]">
              <HelpCircle size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">FAQ Support</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Review employee questions and send HR replies.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-1 dark:bg-slate-800">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
                  status === option.value
                    ? 'bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] text-white shadow-sm shadow-[#2463eb]/25'
                    : 'text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-200">
            <Inbox size={18} />
            Questions
          </div>
          {isFetching && !isLoading && <Loader2 size={18} className="animate-spin text-[#2463eb]" />}
        </div>

        {isLoading ? (
          <div className="space-y-4 p-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-16 text-center">
            <AlertTriangle size={44} className="mx-auto text-amber-400" />
            <p className="mt-4 text-sm font-black text-slate-700 dark:text-slate-200">Unable to load FAQ questions from database.</p>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
              {getApiErrorMessage(error)}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-4 py-2 text-sm font-black text-white shadow-md shadow-[#2463eb]/25 hover:brightness-110"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        ) : visibleQuestions.length === 0 ? (
          <div className="p-16 text-center">
            <Search size={44} className="mx-auto text-slate-300" />
            <p className="mt-4 text-sm font-black text-slate-500">No {status === 'all' ? '' : status.toLowerCase()} FAQ questions found.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {visibleQuestions.map((question) => (
              <div key={question.id} className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#dbeafe] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#2463eb] dark:bg-[#2463eb]/30 dark:text-[#60a5fa]">
                        {question.category}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                        question.status === 'ANSWERED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}>
                        {question.status}
                      </span>
                    </div>
                    <h2 className="mt-3 text-lg font-black text-slate-900 dark:text-white">{question.subject}</h2>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600 dark:text-slate-300">{question.question}</p>
                    <p className="mt-3 text-xs font-bold text-slate-400">
                      Asked by {question.submitterName}
                      {question.departmentName ? ` · ${question.departmentName}` : ''}
                      {question.submitterEmail ? ` · ${question.submitterEmail}` : ''} · {formatDate(question.createdAt)}
                    </p>
                    {question.answer && (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-300">
                          HR Reply {question.answeredByName ? `by ${question.answeredByName}` : ''}
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-200">{question.answer}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                    <button
                      type="button"
                      onClick={() => openReply(question)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-4 py-3 text-xs font-black text-white shadow-md shadow-[#2463eb]/25 transition-all hover:brightness-110 active:scale-95"
                    >
                      {question.status === 'ANSWERED' ? <CheckCircle2 size={16} /> : <MessageSquareReply size={16} />}
                      {question.status === 'ANSWERED' ? 'Update Reply' : 'Reply'}
                    </button>
                    {question.status === 'ANSWERED' && (
                      <button
                        type="button"
                        disabled={question.published || isPublishing}
                        onClick={() => publishQuestion(question)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700 transition-all hover:bg-emerald-100 active:scale-95 disabled:opacity-50 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                      >
                        {question.published ? <CheckCircle2 size={16} /> : <MessageSquareReply size={16} />}
                        {question.published ? 'Published' : 'Publish FAQ'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/45" onClick={() => !isReplying && setSelectedQuestion(null)} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#2463eb] dark:text-[#60a5fa]">{selectedQuestion.category}</p>
              <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">{selectedQuestion.subject}</h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500 dark:text-slate-400">{selectedQuestion.question}</p>
            </div>
            <textarea
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              rows={7}
              maxLength={5000}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-[#2463eb] focus:ring-2 focus:ring-[#2463eb]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              placeholder="Write HR reply..."
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={isReplying}
                onClick={() => setSelectedQuestion(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isReplying}
                onClick={submitReply}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-4 py-2 text-sm font-black text-white shadow-md shadow-[#2463eb]/25 hover:brightness-110 disabled:opacity-50"
              >
                {isReplying ? <Loader2 size={16} className="animate-spin" /> : <MessageSquareReply size={16} />}
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
