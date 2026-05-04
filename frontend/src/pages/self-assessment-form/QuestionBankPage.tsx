import React from 'react';
import { Edit2, Plus, RotateCcw, Search, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
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
  const roleId = useSelector((state: RootState) => state.auth.user?.roleId);
  const isDepartmentBank = roleId === 2;
  const [searchTerm, setSearchTerm] = React.useState('');
  const [includeInactive, setIncludeInactive] = React.useState(true);
  const [modalMode, setModalMode] = React.useState<'create' | 'edit' | null>(null);
  const [editingQuestion, setEditingQuestion] = React.useState<QuestionBankDto | null>(null);
  const [questionText, setQuestionText] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);

  const { data: questions = [], isLoading, refetch } = useGetQuestionBankQuery({ includeInactive });
  const [createQuestion, { isLoading: isCreating }] = useCreateQuestionBankItemMutation();
  const [updateQuestion, { isLoading: isUpdating }] = useUpdateQuestionBankItemMutation();
  const [updateStatus, { isLoading: isToggling }] = useUpdateQuestionBankItemStatusMutation();

  const filteredQuestions = questions.filter((question) =>
    question.questionText.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const openCreateModal = () => {
    setModalMode('create');
    setEditingQuestion(null);
    setQuestionText('');
    setIsActive(true);
  };

  const openEditModal = (question: QuestionBankDto) => {
    setModalMode('edit');
    setEditingQuestion(question);
    setQuestionText(question.questionText);
    setIsActive(question.isActive);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingQuestion(null);
    setQuestionText('');
    setIsActive(true);
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
          request: { questionText: questionText.trim(), isActive },
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

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Question Bank</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isDepartmentBank
              ? 'Manage reusable questions for your department self-assessment forms'
              : 'Manage reusable questions for HR self-assessment forms'}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus size={16} />
          Add Question
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative md:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              type="text"
              placeholder="Search questions"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(event) => setIncludeInactive(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Show inactive
            </label>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <RotateCcw size={15} />
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                  Question
                </th>
                <th scope="col" className="w-32 px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                  Status
                </th>
                <th scope="col" className="w-48 px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    Loading questions...
                  </td>
                </tr>
              ) : filteredQuestions.length > 0 ? (
                filteredQuestions.map((question) => (
                  <tr key={question.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3 text-slate-900 dark:text-white">{question.questionText}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          question.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {question.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(question)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(question)}
                          disabled={isToggling}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          {question.isActive ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                          {question.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No questions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {modalMode === 'edit' ? 'Edit Question' : 'Add Question'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Question Text
                </label>
                <input
                  type="text"
                  value={questionText}
                  onChange={(event) => setQuestionText(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {modalMode === 'edit' && (
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) => setIsActive(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Active
                </label>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {modalMode === 'edit' ? 'Save Changes' : 'Add Question'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
