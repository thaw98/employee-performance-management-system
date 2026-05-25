import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Calendar, ChevronRight, ClipboardCheck, FileCheck2, HelpCircle, Loader2, MessageCircleQuestion, MessageSquareText, Target } from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  useGetMyFaqQuestionsQuery,
  useGetPublishedFaqQuestionsQuery,
  useSubmitFaqQuestionMutation,
  type FaqCategory,
} from '../features/faq/faqSupportApi'
import { useAppSelector } from '../app/hooks'
import { getRoleGroup } from '../utils/dashboardRedirect'

type FaqFormState = {
  category: FaqCategory
  subject: string
  question: string
}

const faqQuestionExamples: Record<FaqCategory, { subject: string; question: string }> = {
  KPI: {
    subject: 'Example: KPI target is missing',
    question: 'Example: My KPI target for this review cycle is not showing. Can HR confirm which KPI should be assigned?',
  },
  PIP: {
    subject: 'Example: PIP follow-up meeting date',
    question: 'Example: I need clarification about my PIP objective, timeline, or follow-up meeting. Can HR explain the next step?',
  },
  FEEDBACK: {
    subject: 'Example: Feedback submission issue',
    question: 'Example: I submitted feedback by mistake or cannot find my feedback history. Can HR help check it?',
  },
  ASSESSMENT: {
    subject: 'Example: Self-assessment form question',
    question: 'Example: I need help understanding a self-assessment question, score, retake, or review status.',
  },
  APPRAISAL: {
    subject: 'Example: Appraisal form not showing',
    question: 'Example: My appraisal assignment or evaluation form is missing. Can HR confirm the appraisal cycle and reviewer?',
  },
}

const faqSections = [
  {
    title: 'KPI',
    icon: Target,
    tone: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    items: [
      {
        question: 'What is a KPI?',
        answer: 'KPI means Key Performance Indicator. It is a measurable work target used to track whether an employee, position, or department is meeting expected performance.',
      },
      {
        question: 'Who creates and assigns KPIs?',
        answer: 'HR can manage KPI categories and templates. Managers and assigned reviewers use the KPI records to monitor progress and performance results.',
      },
      {
        question: 'What should I do if my KPI is incorrect?',
        answer: 'Check the KPI detail first. If the department, position, target, or period looks wrong, contact your manager or HR before the review is finalized.',
      },
    ],
  },
  {
    title: 'PIP',
    icon: ClipboardCheck,
    tone: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    items: [
      {
        question: 'What is a PIP?',
        answer: 'PIP means Performance Improvement Plan. It is used when an employee needs structured goals, follow-up meetings, and progress updates to improve performance.',
      },
      {
        question: 'Does a PIP mean termination?',
        answer: 'No. A PIP is primarily an improvement process. It documents expectations, support actions, meeting notes, and progress during the improvement period.',
      },
      {
        question: 'Why do I need to sign a PIP?',
        answer: 'The signature records that the plan was reviewed with the relevant people. It does not replace discussion, meeting notes, or HR clarification.',
      },
    ],
  },
  {
    title: 'Feedback',
    icon: MessageSquareText,
    tone: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    items: [
      {
        question: 'What is 360 feedback?',
        answer: '360 feedback collects input from relevant people around an employee, such as managers, peers, or other reviewers, depending on the company process.',
      },
      {
        question: 'Can feedback be edited after submission?',
        answer: 'Usually submitted feedback becomes part of the record. If something was submitted by mistake, contact HR or your manager as soon as possible.',
      },
      {
        question: 'Where can I review feedback history?',
        answer: 'Use the 360 Feedback history or received feedback pages available in your role menu. HR and managers may also use reports for summarized views.',
      },
    ],
  },
  {
    title: 'Assessment',
    icon: BarChart3,
    tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    items: [
      {
        question: 'What is self-assessment?',
        answer: 'Self-assessment lets employees review their own work, answer assigned questions, and submit evidence or remarks before manager or HR review.',
      },
      {
        question: 'What happens after I submit an assessment?',
        answer: 'The submitted form moves to the review flow. A manager or HR reviewer may approve it, return it, request a retake, or schedule a discussion if needed.',
      },
      {
        question: 'Can I change answers after submitting?',
        answer: 'You may need a retake or reopen action depending on the current status. Check the form status first, then ask your reviewer or HR if changes are needed.',
      },
    ],
  },
  {
    title: 'Appraisal',
    icon: FileCheck2,
    tone: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    items: [
      {
        question: 'What is an appraisal?',
        answer: 'An appraisal is a formal performance evaluation for a review cycle. It may include questions, ratings, reviewer comments, and final submission records.',
      },
      {
        question: 'Who can evaluate an appraisal?',
        answer: 'The evaluator depends on the appraisal assignment and role setup. Managers usually evaluate assigned employees, while HR manages configuration and reports.',
      },
      {
        question: 'What if appraisal information is missing?',
        answer: 'Check whether the appraisal cycle and assignment are active. If the expected form is still missing, raise it to HR for cycle or assignment verification.',
      },
    ],
  },
]

export function FaqPage() {
  const tokenUser = useAppSelector((s) => s.auth.user)
  const { data: publishedFaqQuestionsResponse, isLoading: isLoadingPublishedFaqQuestions } = useGetPublishedFaqQuestionsQuery({ page: 0, size: 20 })
  const {
    data: myFaqQuestionsResponse,
    isLoading: isLoadingMyFaqQuestions,
    refetch: refetchMyFaqQuestions,
  } = useGetMyFaqQuestionsQuery({ page: 0, size: 5 })
  const [submitFaqQuestion, { isLoading: isSubmittingFaqQuestion }] = useSubmitFaqQuestionMutation()
  const faqQuestionPanelRef = useRef<HTMLDivElement>(null)
  const [faqForm, setFaqForm] = useState<FaqFormState>({
    category: 'KPI',
    subject: '',
    question: '',
  })
  const [showFaqQuestionForm, setShowFaqQuestionForm] = useState(false)

  const roleGroup = tokenUser ? getRoleGroup(tokenUser) : null
  const rolePrefix = roleGroup === 'HR' ? '/hr' : roleGroup === 'MANAGER' ? '/manager' : '/employee'
  const meetingsPath =
    roleGroup === 'HR'
      ? '/hr/meetings?section=schedule&action=schedule&target=hr'
      : roleGroup === 'MANAGER'
        ? '/manager/meetings?section=schedule&action=schedule&target=hr'
        : '/employee/meetings?section=schedule&action=request&target=hr'
  const faqExample = faqQuestionExamples[faqForm.category]
  const publishedFaqQuestions = publishedFaqQuestionsResponse?.data?.content ?? []
  const myFaqQuestions = myFaqQuestionsResponse?.data?.content ?? []

  const openFaqQuestionForm = () => {
    setShowFaqQuestionForm(true)
    window.requestAnimationFrame(() => {
      faqQuestionPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleFaqSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const subject = faqForm.subject.trim()
    const question = faqForm.question.trim()

    if (!subject || !question) {
      toast.error('Please enter a subject and question.')
      return
    }

    try {
      await submitFaqQuestion({
        category: faqForm.category,
        subject,
        question,
      }).unwrap()
      await refetchMyFaqQuestions()
      setFaqForm((current) => ({ ...current, subject: '', question: '' }))
      setShowFaqQuestionForm(false)
      toast.success('Question sent to HR.')
    } catch (err) {
      console.error('Failed to submit FAQ question', err)
      toast.error('Failed to send question to HR.')
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
              <HelpCircle size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Performance FAQ</h1>
              <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Quick answers for KPI, PIP, feedback, assessment, and appraisal workflows.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openFaqQuestionForm}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black text-white transition-all hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            <MessageCircleQuestion size={16} />
            Ask Question
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {faqSections.map((section) => {
            const Icon = section.icon
            const publishedItems = publishedFaqQuestions.filter((item) => item.category === section.title.toUpperCase())
            const totalQuestionCount = section.items.length + publishedItems.length

            return (
              <details
                key={section.title}
                className="group rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-all open:bg-white open:shadow-sm dark:border-slate-800 dark:bg-slate-800/40 dark:open:bg-slate-900"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${section.tone}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">{section.title}</h2>
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">{totalQuestionCount} common questions</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-slate-300 transition-transform group-open:rotate-90 group-hover:text-cyan-600" />
                </summary>

                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  {isLoadingPublishedFaqQuestions && (
                    <div className="h-16 animate-pulse rounded-2xl bg-white dark:bg-slate-800/80" />
                  )}
                  {publishedItems.map((item) => (
                    <div key={item.id} className="relative rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 pr-16 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                      <span className="absolute right-5 top-4 rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300">
                        HR
                      </span>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100">{item.subject}</p>
                      <p className="mt-4 text-sm font-semibold leading-relaxed text-slate-500 dark:text-slate-400">{item.question}</p>
                      <div className="mt-4 rounded-2xl bg-white p-4 dark:bg-slate-900">
                        <p className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Answer</p>
                        <p className="mt-2 text-sm font-bold leading-relaxed text-slate-700 dark:text-slate-200">{item.answer}</p>
                      </div>
                    </div>
                  ))}
                  {section.items.map((item) => (
                    <div key={item.question} className="px-1 py-5">
                      <p className="text-base font-black text-slate-900 dark:text-slate-100">{item.question}</p>
                      <p className="mt-4 text-sm font-semibold leading-7 text-slate-500 dark:text-slate-400">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </details>
            )
          })}
        </div>

        <div ref={faqQuestionPanelRef} className="mt-6 grid grid-cols-1 gap-4 scroll-mt-24 lg:grid-cols-[1fr_1fr]">
          {showFaqQuestionForm ? (
            <form onSubmit={handleFaqSubmit} className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="mb-4">
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">Submit a question to HR</p>
                <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">HR can reply here and you will also receive a notification.</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Category</label>
                  <select
                    value={faqForm.category}
                    onChange={(event) => setFaqForm((current) => ({ ...current, category: event.target.value as FaqCategory }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {faqSections.map((section) => (
                      <option key={section.title} value={section.title.toUpperCase()}>
                        {section.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</label>
                  <input
                    value={faqForm.subject}
                    onChange={(event) => setFaqForm((current) => ({ ...current, subject: event.target.value }))}
                    maxLength={255}
                    placeholder={faqExample.subject}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Question</label>
                  <textarea
                    value={faqForm.question}
                    onChange={(event) => setFaqForm((current) => ({ ...current, question: event.target.value }))}
                    maxLength={3000}
                    rows={4}
                    placeholder={faqExample.question}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingFaqQuestion}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 text-xs font-black text-white transition-all hover:bg-cyan-700 active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingFaqQuestion ? <Loader2 size={16} className="animate-spin" /> : <MessageCircleQuestion size={16} />}
                  Send Question
                </button>
              </div>
            </form>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center dark:border-slate-700 dark:bg-slate-800/60">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-300">
                <MessageCircleQuestion size={22} />
              </div>
              <p className="text-sm font-black text-slate-900 dark:text-slate-100">Need to ask HR?</p>
              <p className="mt-2 max-w-sm text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                Click Ask Question to submit a KPI, PIP, feedback, assessment, or appraisal question.
              </p>
              <button
                type="button"
                onClick={openFaqQuestionForm}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 text-xs font-black text-white transition-all hover:bg-cyan-700 active:scale-95"
              >
                <MessageCircleQuestion size={16} />
                Ask Question
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="mb-4">
              <p className="text-sm font-black text-slate-900 dark:text-slate-100">My FAQ questions</p>
              <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">Latest questions and HR replies.</p>
            </div>
            {isLoadingMyFaqQuestions ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
                ))}
              </div>
            ) : myFaqQuestions.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                No FAQ questions submitted yet.
              </div>
            ) : (
              <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
                {myFaqQuestions.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">{item.subject}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{item.category}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${item.status === 'ANSWERED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                        {item.status === 'ANSWERED' ? 'Answered' : 'Open'}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">{item.question}</p>
                    {item.answer && (
                      <div className="mt-3 rounded-xl bg-white p-3 dark:bg-slate-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-300">HR Reply</p>
                        <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-200">{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-5 dark:border-cyan-900/40 dark:bg-cyan-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-slate-100">Need more than these answers?</p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                This FAQ is only a quick guide. If your case is not covered here, set up a meeting with HR and ask for more information.
              </p>
            </div>
            <Link
              to={meetingsPath}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 text-xs font-black text-white transition-all hover:bg-cyan-700 active:scale-95"
            >
              <Calendar size={16} />
              Set Up Meeting
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
