import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun, Globe, Save, Loader2, Image as ImageIcon, Trash2, RotateCcw, AlertTriangle, X, Calendar, ChevronRight, HelpCircle, MessageCircleQuestion, Target, ClipboardCheck, MessageSquareText, BarChart3, FileCheck2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAppSelector } from '../app/hooks'
import { useGetProfileQuery, useUpdateProfileMutation, useUpdateWallpaperMutation, useDeleteWallpaperMutation } from '../features/user/userApi'
import {
  useGetMyFaqQuestionsQuery,
  useGetPublishedFaqQuestionsQuery,
  useSubmitFaqQuestionMutation,
  type FaqCategory,
} from '../features/faq/faqSupportApi'
import { getRoleGroup } from '../utils/dashboardRedirect'
import {
  applyLanguagePreference,
  isLanguageApplied,
  setGoogleTranslateWidgetVisible,
} from '../utils/googleTranslatePreference'

type ThemePreference = 'light' | 'dark' | 'wallpaper'
type FaqFormState = {
  category: FaqCategory
  subject: string
  question: string
}

const themeOptions: Array<{
  id: ThemePreference
  name: string
  icon: ReactNode
  color: string
}> = [
  { id: 'light', name: 'Light Mode', icon: <Sun size={18} />, color: 'bg-white border-slate-200' },
  { id: 'dark', name: 'Dark Mode', icon: <Moon size={18} />, color: 'bg-slate-900 border-slate-800 text-white' },
  { id: 'wallpaper', name: 'Custom Wallpaper', icon: <ImageIcon size={18} />, color: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' }
]

const isThemePreference = (theme: unknown): theme is ThemePreference =>
  theme === 'light' || theme === 'dark' || theme === 'wallpaper'

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

const getErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { data?: { message?: unknown } } }).response
    if (typeof response?.data?.message === 'string') {
      return response.data.message
    }
  }

  return fallback
}

const faqSections = [
  {
    title: 'KPI',
    icon: Target,
    tone: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    items: [
      {
        question: 'What is a KPI?',
        answer: 'KPI means Key Performance Indicator. It is a measurable work target used to track whether an employee, position, or department is meeting expected performance.'
      },
      {
        question: 'Who creates and assigns KPIs?',
        answer: 'HR can manage KPI categories and templates. Managers and assigned reviewers use the KPI records to monitor progress and performance results.'
      },
      {
        question: 'What should I do if my KPI is incorrect?',
        answer: 'Check the KPI detail first. If the department, position, target, or period looks wrong, contact your manager or HR before the review is finalized.'
      }
    ]
  },
  {
    title: 'PIP',
    icon: ClipboardCheck,
    tone: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    items: [
      {
        question: 'What is a PIP?',
        answer: 'PIP means Performance Improvement Plan. It is used when an employee needs structured goals, follow-up meetings, and progress updates to improve performance.'
      },
      {
        question: 'Does a PIP mean termination?',
        answer: 'No. A PIP is primarily an improvement process. It documents expectations, support actions, meeting notes, and progress during the improvement period.'
      },
      {
        question: 'Why do I need to sign a PIP?',
        answer: 'The signature records that the plan was reviewed with the relevant people. It does not replace discussion, meeting notes, or HR clarification.'
      }
    ]
  },
  {
    title: 'Feedback',
    icon: MessageSquareText,
    tone: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    items: [
      {
        question: 'What is 360 feedback?',
        answer: '360 feedback collects input from relevant people around an employee, such as managers, peers, or other reviewers, depending on the company process.'
      },
      {
        question: 'Can feedback be edited after submission?',
        answer: 'Usually submitted feedback becomes part of the record. If something was submitted by mistake, contact HR or your manager as soon as possible.'
      },
      {
        question: 'Where can I review feedback history?',
        answer: 'Use the 360 Feedback history or received feedback pages available in your role menu. HR and managers may also use reports for summarized views.'
      }
    ]
  },
  {
    title: 'Assessment',
    icon: BarChart3,
    tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    items: [
      {
        question: 'What is self-assessment?',
        answer: 'Self-assessment lets employees review their own work, answer assigned questions, and submit evidence or remarks before manager or HR review.'
      },
      {
        question: 'What happens after I submit an assessment?',
        answer: 'The submitted form moves to the review flow. A manager or HR reviewer may approve it, return it, request a retake, or schedule a discussion if needed.'
      },
      {
        question: 'Can I change answers after submitting?',
        answer: 'You may need a retake or reopen action depending on the current status. Check the form status first, then ask your reviewer or HR if changes are needed.'
      }
    ]
  },
  {
    title: 'Appraisal',
    icon: FileCheck2,
    tone: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    items: [
      {
        question: 'What is an appraisal?',
        answer: 'An appraisal is a formal performance evaluation for a review cycle. It may include questions, ratings, reviewer comments, and final submission records.'
      },
      {
        question: 'Who can evaluate an appraisal?',
        answer: 'The evaluator depends on the appraisal assignment and role setup. Managers usually evaluate assigned employees, while HR manages configuration and reports.'
      },
      {
        question: 'What if appraisal information is missing?',
        answer: 'Check whether the appraisal cycle and assignment are active. If the expected form is still missing, raise it to HR for cycle or assignment verification.'
      }
    ]
  }
]


export function SystemSettingsPage() {
  const tokenUser = useAppSelector((s) => s.auth.user)
  const { data: profileResponse } = useGetProfileQuery()
  const { data: publishedFaqQuestionsResponse, isLoading: isLoadingPublishedFaqQuestions } = useGetPublishedFaqQuestionsQuery({ page: 0, size: 20 })
  const {
    data: myFaqQuestionsResponse,
    isLoading: isLoadingMyFaqQuestions,
    refetch: refetchMyFaqQuestions,
  } = useGetMyFaqQuestionsQuery({ page: 0, size: 5 })
  const [submitFaqQuestion, { isLoading: isSubmittingFaqQuestion }] = useSubmitFaqQuestionMutation()
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()
  const [updateWallpaper, { isLoading: isUploading }] = useUpdateWallpaperMutation()
  const [deleteWallpaper, { isLoading: isDeleting }] = useDeleteWallpaperMutation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initialLanguageRef = useRef<'Myanmar' | 'English'>('English')
  const profileLanguageSyncedRef = useRef(false)

  const [theme, setTheme] = useState<ThemePreference>('light')
  const [language, setLanguage] = useState<'Myanmar' | 'English'>('English')
  const [timezone, setTimezone] = useState('UTC+06:30 (Yangon)')
  const [timeFormat, setTimeFormat] = useState('12h')
  const [isSaving, setIsSaving] = useState(false)
  const [pendingWallpaper, setPendingWallpaper] = useState<File | 'remove' | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const faqQuestionPanelRef = useRef<HTMLDivElement>(null)
  const [faqForm, setFaqForm] = useState<FaqFormState>({
    category: 'KPI',
    subject: '',
    question: '',
  })
  const [showFaqQuestionForm, setShowFaqQuestionForm] = useState(false)

  const roleGroup = tokenUser ? getRoleGroup(tokenUser) : null
  const rolePrefix = roleGroup === 'HR' ? '/hr' : roleGroup === 'MANAGER' ? '/manager' : '/employee'
  const isHR = roleGroup === 'HR' || profileResponse?.data?.role === 'HR'
  const meetingsPath = isHR ? '/hr/meetings?section=schedule' : `${rolePrefix}/meetings`
  const faqExample = faqQuestionExamples[faqForm.category]
  const publishedFaqQuestions = publishedFaqQuestionsResponse?.data?.content ?? []
  const myFaqQuestions = myFaqQuestionsResponse?.data?.content ?? []

  useEffect(() => {
    if (isThemePreference(profileResponse?.data?.theme)) {
      setTheme(profileResponse.data.theme)
    }
    if (profileResponse?.data?.language && !profileLanguageSyncedRef.current) {
      const profileLanguage = profileResponse.data.language.toLowerCase().includes('myanmar') || profileResponse.data.language.toLowerCase().includes('burmese')
        ? 'Myanmar'
        : 'English'
      setLanguage(profileLanguage)
      initialLanguageRef.current = profileLanguage
      profileLanguageSyncedRef.current = true
    }
    if (profileResponse?.data?.timezone) {
      setTimezone(profileResponse.data.timezone)
    }
    if (profileResponse?.data?.timeFormat) {
      setTimeFormat(profileResponse.data.timeFormat)
    }
  }, [profileResponse])

  useEffect(() => {
    setGoogleTranslateWidgetVisible(false)
  }, [])

  const handleThemeChange = (newTheme: ThemePreference) => {
    setTheme(newTheme)
    if (newTheme === 'wallpaper') {
        if (!profileResponse?.data?.wallpaperUrl && pendingWallpaper === null) {
           fileInputRef.current?.click()
        }
    }
  }

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPendingWallpaper(file)
      setTheme('wallpaper')
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const languageChanged = language !== initialLanguageRef.current
      const needsLanguageApply = languageChanged || !isLanguageApplied(language)

      if (pendingWallpaper === 'remove') {
          await deleteWallpaper().unwrap()
          if (theme === 'wallpaper') {
             await updateProfile({ theme: 'light', language, timezone, timeFormat }).unwrap()
             setTheme('light')
          } else {
             await updateProfile({ theme, language, timezone, timeFormat }).unwrap()
          }
      } else if (pendingWallpaper instanceof File && theme === 'wallpaper') {
        await updateWallpaper(pendingWallpaper).unwrap()
        await updateProfile({ language, timezone, timeFormat }).unwrap()
      } else {
        await updateProfile({ theme, language, timezone, timeFormat }).unwrap()
      }

      setPendingWallpaper(null)
      initialLanguageRef.current = language
      toast.success('Changes saved!')
      if (needsLanguageApply) {
        applyLanguagePreference(language, { reload: true })
      }
    } catch (err: unknown) {
      console.error("Failed to save system settings", err)
      toast.error(getErrorMessage(err, 'Failed to save settings.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    setIsResetting(true)
    try {
      // Direct save to defaults
      await deleteWallpaper().unwrap()
      await updateProfile({ 
        theme: 'light', 
        language: 'English',
        timezone: 'UTC+06:30 (Yangon)',
        timeFormat: '12h' 
      }).unwrap()

      setShowResetModal(false)
      initialLanguageRef.current = 'English'
      setLanguage('English')
      toast.success('Changes saved!')
      applyLanguagePreference('English', { reload: true })
    } catch (err) {
      console.error("Reset failed", err)
      toast.error('Failed to reset settings.')
    } finally {
      setIsResetting(false)
    }
  }

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
    <>
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">System Settings</h1>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          Customize your application experience and preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Appearance Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <Sun size={20} />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-200 tracking-tight">Appearance</h2>
            </div>

            <div className="space-y-8">
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-widest text-[10px]">Interface Theme</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Hidden file input for wallpaper */}
                  <input type="file" ref={fileInputRef} onChange={handleWallpaperUpload} accept="image/*" className="hidden" />
                  
                  {themeOptions.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleThemeChange(t.id)}
                      disabled={isUpdating || (isUploading && t.id === 'wallpaper')}
                      className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                        theme === t.id 
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm' 
                          : 'border-transparent bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className={`w-full aspect-video rounded-lg ${t.color} flex items-center justify-center mb-1 shadow-inner border transition-all ${(t.id === 'wallpaper' && pendingWallpaper !== 'remove' && (pendingWallpaper instanceof File || profileResponse?.data?.wallpaperUrl)) ? 'bg-cover bg-center' : ''}`}
                           style={t.id === 'wallpaper' && pendingWallpaper !== 'remove' && (pendingWallpaper instanceof File || profileResponse?.data?.wallpaperUrl) ? { backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.40), rgba(248, 250, 252, 0.40)), url("${pendingWallpaper instanceof File ? URL.createObjectURL(pendingWallpaper) : profileResponse?.data?.wallpaperUrl}")` } : {}}
                      >
                         {(isUpdating || isUploading || isDeleting) && theme === t.id ? <Loader2 className="animate-spin text-blue-600" /> : t.icon}
                      </div>
                      <span className={`text-xs font-bold ${theme === t.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>{t.name}</span>
                      
                      {t.id === 'wallpaper' && (
                         <>
                           <div 
                             className="absolute top-2 left-2 w-6 h-6 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors z-10"
                             onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                             title="Upload new wallpaper"
                           >
                              <ImageIcon size={12} className="text-blue-600 dark:text-blue-400" />
                           </div>
                           {(pendingWallpaper !== 'remove' && (pendingWallpaper instanceof File || profileResponse?.data?.wallpaperUrl)) && (
                             <div 
                               className="absolute top-2 right-2 w-6 h-6 bg-red-50 dark:bg-red-900/40 rounded-full flex items-center justify-center text-red-500 shadow-sm border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors z-10"
                               onClick={(e) => { e.stopPropagation(); setPendingWallpaper('remove'); }}
                               title="Remove wallpaper"
                             >
                                <Trash2 size={12} className="text-red-600 dark:text-red-400" />
                             </div>
                           )}
                         </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Language and Region Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                <Globe size={20} />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-200 tracking-tight">Language and Region</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2 notranslate" translate="no">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'Myanmar' | 'English')}
                    className="notranslate w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all appearance-none"
                  >
                     <option className="dark:bg-slate-900 notranslate" value="Myanmar">Myanmar</option>
                     <option className="dark:bg-slate-900 notranslate" value="English">English</option>
                  </select>
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 leading-relaxed">
                    Applies across the application after you click Save Settings.
                  </p>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Time Zone Preference</label>
                  <select 
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all appearance-none"
                  >
                     <option className="dark:bg-slate-900">UTC+06:30 (Yangon)</option>
                     <option className="dark:bg-slate-900">UTC+00:00 (GMT)</option>
                  </select>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Clock Display Format</label>
                  <select 
                    value={timeFormat}
                    onChange={(e) => setTimeFormat(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all appearance-none"
                  >
                     <option className="dark:bg-slate-900" value="12h">12-Hour Clock (AM/PM)</option>
                     <option className="dark:bg-slate-900" value="24h">24-Hour Clock (Military)</option>
                  </select>
               </div>
            </div>
          </div>
        </div>
        {isHR && (
          <Link
            to="/hr/settings/system/time"
            className="block bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 group"
          >
                        <div className="p-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-slate-200 tracking-tight">Time Settings</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Configure organization year type, review cycles, and duration.
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
            </div>
          </Link>
        )}

        {/* FAQ Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
          <div className="p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl flex items-center justify-center shrink-0">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-slate-200 tracking-tight">Performance FAQ</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
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
                const publishedItems = publishedFaqQuestions.filter(
                  (item) => item.category === section.title.toUpperCase(),
                )
                const totalQuestionCount = section.items.length + publishedItems.length

                return (
                  <details
                    key={section.title}
                    className="group rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-all open:bg-white open:shadow-sm dark:border-slate-800 dark:bg-slate-800/40 dark:open:bg-slate-900"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${section.tone}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{section.title}</h3>
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

        {/* Action Bar */}
        <div className="pt-6 flex justify-end gap-3">
           <button 
             onClick={() => setShowResetModal(true)}
             className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-sm font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all flex items-center gap-2 transform active:scale-95"
           >
              <RotateCcw size={18} />
              Reset to Defaults
           </button>
           <button 
             onClick={() => handleSave()}
             disabled={isSaving}
             className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0"
           >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Save Settings
           </button>
        </div>
      </div>
    </div>

    {/* Custom Reset Confirmation Modal */}
    {showResetModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isResetting && setShowResetModal(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-white/20 relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
           <div className="p-8 pb-4 text-center">
              <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 scale-110 shadow-inner">
                 <AlertTriangle size={40} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Reset to Defaults?</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-6">
                Are you sure you want to revert all system settings to their original values? This cannot be undone.
              </p>
           </div>
           <div className="p-8 pt-4 flex flex-col gap-3">
              <button 
                onClick={handleReset}
                disabled={isResetting}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                 {isResetting ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
                 Yes, Reset Everything
              </button>
              <button 
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50"
              >
                 Cancel
              </button>
           </div>
           <button 
             onClick={() => !isResetting && setShowResetModal(false)}
             className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
           >
              <X size={20} />
           </button>
        </div>
      </div>
    )}
    </>
  )
}
