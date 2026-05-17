import React from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Edit2,
  Filter,
  HelpCircle,
  Loader2,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../app/store';
import {
  type QuestionBankDto,
  useCreateQuestionBankItemMutation,
  useGetQuestionBankQuery,
  useUpdateQuestionBankItemMutation,
  useUpdateQuestionBankItemStatusMutation,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const maybeError = error as { data?: { message?: string } };
  return maybeError?.data?.message || fallback;
};

export const QuestionBankPage: React.FC = () => {
  const navigate = useNavigate();
  const roleId = useSelector((state: RootState) => state.auth.user?.roleId);
  const isDepartmentBank = roleId === 2;
  const routeBase = isDepartmentBank ? '/manager/self-assessment/templates' : '/hr/self-assessment/templates';
  const [searchTerm, setSearchTerm] = React.useState('');
  const [includeInactive, setIncludeInactive] = React.useState(true);
  const [modalMode, setModalMode] = React.useState<'create' | 'edit' | null>(null);
  const [editingQuestion, setEditingQuestion] = React.useState<QuestionBankDto | null>(null);
  const [questionText, setQuestionText] = React.useState('');

  const { data: questions = [], isLoading, refetch } = useGetQuestionBankQuery({ includeInactive });
  const [createQuestion, { isLoading: isCreating }] = useCreateQuestionBankItemMutation();
  const [updateQuestion, { isLoading: isUpdating }] = useUpdateQuestionBankItemMutation();
  const [updateStatus, { isLoading: isToggling }] = useUpdateQuestionBankItemStatusMutation();

  const filteredQuestions = questions.filter((question) =>
    question.questionText.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const activeCount = questions.filter((q) => q.isActive).length;
  const inactiveCount = questions.length - activeCount;
  const hasActiveFilters = searchTerm.trim() !== '' || !includeInactive;

  const openCreateModal = () => {
    setModalMode('create');
    setEditingQuestion(null);
    setQuestionText('');
  };

  const openEditModal = (question: QuestionBankDto) => {
    setModalMode('edit');
    setEditingQuestion(question);
    setQuestionText(question.questionText);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingQuestion(null);
    setQuestionText('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!questionText.trim()) {
      toast.error('Please enter question text');
      return;
    }

    try {
      if (modalMode === 'edit' && editingQuestion) {
        await updateQuestion({
          id: editingQuestion.id,
          request: { questionText: questionText.trim(), isActive: editingQuestion.isActive },
        }).unwrap();
        toast.success('Question updated');
      } else {
        await createQuestion({ questionText: questionText.trim(), isActive: true }).unwrap();
        toast.success('Question added');
      }
      closeModal();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save question'));
    }
  };

  const handleToggleStatus = async (question: QuestionBankDto) => {
    try {
      await updateStatus({ id: question.id, isActive: !question.isActive }).unwrap();
      toast.success(question.isActive ? 'Question deactivated' : 'Question reactivated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update status'));
    }
  };

  const summaryCards = [
    {
      label: 'Total Questions',
      value: questions.length,
      icon: BookOpen,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-900/30',
      ring: 'ring-blue-500/20',
      bgGlow: 'bg-blue-500/10',
    },
    {
      label: 'Active',
      value: activeCount,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
      ring: 'ring-emerald-500/20',
      bgGlow: 'bg-emerald-500/10',
    },
    {
      label: 'Inactive',
      value: inactiveCount,
      icon: PowerOff,
      iconColor: 'text-slate-500 dark:text-slate-400',
      iconBg: 'bg-slate-100 dark:bg-slate-700/60',
      ring: 'ring-slate-400/20',
      bgGlow: 'bg-slate-400/10',
    },
    {
      label: 'Showing',
      value: includeInactive ? 'All' : 'Active Only',
      icon: Filter,
      iconColor: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-50 dark:bg-violet-900/30',
      ring: 'ring-violet-500/20',
      bgGlow: 'bg-violet-500/10',
      isText: true as const,
    },
  ];

  return (
    <>
    <div className="min-h-screen px-6 py-6 md:px-8 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate(routeBase)}
        className="group mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
        Back to Templates
      </button>

      {/* ─── Header ─── */}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-lg shadow-[#5D5FEF]/25">
              <BookOpen size={22} className="text-white" />
            </div>
            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-[9px] font-bold text-white shadow-sm">
              {questions.length}
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Question Bank
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 max-w-lg">
              {isDepartmentBank
                ? 'Manage reusable questions for your department self-assessment forms'
                : 'Manage reusable questions for HR self-assessment forms'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:brightness-110 active:scale-[0.97]"
        >
          <Plus size={16} strokeWidth={2.5} />
          Add Question
        </button>
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card, i) => (
          <div
            key={card.label}
            className="animate-fade-in-up group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700/60 dark:bg-slate-800/80"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${card.bgGlow} blur-2xl transition-all duration-500 group-hover:scale-150`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {card.label}
                </p>
                {'isText' in card && card.isText ? (
                  <p className="mt-2 text-lg font-extrabold text-slate-900 dark:text-white">{card.value}</p>
                ) : (
                  <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{card.value}</p>
                )}
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg} ring-1 ${card.ring}`}>
                <card.icon size={18} className={card.iconColor} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-700/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700/60">
              <HelpCircle size={18} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Questions</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {filteredQuestions.length} of {questions.length} question{questions.length !== 1 ? 's' : ''}
                {hasActiveFilters && (
                  <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-[#5D5FEF]/10 px-2 py-0.5 text-[10px] font-bold text-[#5D5FEF] dark:bg-[#5D5FEF]/20 dark:text-[#8b8ef7]">
                    <Filter size={9} />Filtered
                  </span>
                )}
              </p>
            </div>
          </div>
          <button type="button" onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100">
            <RefreshCw size={14} />Refresh
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input id="qb-search" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search questions..." className="w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 pl-11 text-sm text-slate-900 shadow-sm transition-all focus:border-[#5D5FEF] focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-[#5D5FEF]" />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"><X size={14} /></button>
              )}
            </div>
            <label className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all cursor-pointer select-none hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
              <input type="checkbox" checked={includeInactive} onChange={(event) => setIncludeInactive(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#5D5FEF] focus:ring-[#5D5FEF]/20" />
              Show inactive
            </label>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/60">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-slate-50/40 dark:from-slate-800/60 dark:to-slate-800/30 dark:border-slate-700/60">
                  <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Question
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 dark:divide-slate-700/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 size={28} className="animate-spin text-[#5D5FEF]/60" />
                        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Loading questions...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredQuestions.length > 0 ? (
                  filteredQuestions.map((question, index) => (
                    <tr
                      key={question.id}
                      className="group transition-all duration-200 hover:bg-[#5D5FEF]/[0.02] dark:hover:bg-[#5D5FEF]/[0.04]"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#5D5FEF]/10 to-[#7C7EF5]/5 text-[#5D5FEF] dark:from-[#5D5FEF]/20 dark:to-[#7C7EF5]/10 dark:text-[#8b8ef7]">
                            <HelpCircle size={16} />
                          </div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {question.questionText}
                          </p>
                          <span className="shrink-0 text-xs text-slate-400">
                            {question.questionText?.length ?? 0}/100
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {question.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(question)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                          >
                            <Edit2 size={13} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(question)}
                            disabled={isToggling}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 ${
                              question.isActive
                                ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
                            }`}
                          >
                            {isToggling ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : question.isActive ? (
                              <PowerOff size={13} />
                            ) : (
                              <Power size={13} />
                            )}
                            {question.isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700/60">
                          <BookOpen size={24} className="text-slate-400 dark:text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No questions found</p>
                          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                            {searchTerm.trim()
                              ? 'Try adjusting your search terms'
                              : 'Add your first question to get started'}
                          </p>
                        </div>
                        {!searchTerm.trim() && (
                          <button
                            type="button"
                            onClick={openCreateModal}
                            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:brightness-110"
                          >
                            <Plus size={13} strokeWidth={2.5} />
                            Add Question
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    {modalMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200/60 bg-white p-6 shadow-2xl dark:border-slate-700/60 dark:bg-slate-800 animate-fade-in-up">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] shadow-md shadow-[#5D5FEF]/20">
                  {modalMode === 'edit' ? <Edit2 size={16} className="text-white" /> : <Plus size={16} className="text-white" />}
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {modalMode === 'edit' ? 'Edit Question' : 'Add Question'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="qb-question-text" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Question Text
                </label>
                <textarea
                  id="qb-question-text"
                  rows={3}
                  value={questionText}
                  onChange={(event) => setQuestionText(event.target.value)}
                  placeholder="Enter your question text..."
                  className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all focus:border-[#5D5FEF] focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-[#5D5FEF] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5D5FEF] to-[#7C7EF5] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#5D5FEF]/25 transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(isCreating || isUpdating) && <Loader2 size={14} className="animate-spin" />}
                  {modalMode === 'edit' ? 'Save Changes' : 'Add Question'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
    )}
    </>
  );
};
