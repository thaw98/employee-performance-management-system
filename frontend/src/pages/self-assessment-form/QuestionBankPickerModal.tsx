import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import { useGetQuestionBankQuery } from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';

const inputBase =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-[#2463eb] focus:outline-none focus:ring-2 focus:ring-[#2463eb]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500';

export interface QuestionBankPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (questionTexts: string[]) => void;
}

export const QuestionBankPickerModal: React.FC<QuestionBankPickerModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data: questionBank = [], isLoading } = useGetQuestionBankQuery(
    { includeInactive: false },
    { skip: !isOpen },
  );

  const filteredQuestions = useMemo(
    () =>
      questionBank.filter((question) =>
        question.questionText.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [questionBank, search],
  );

  const filteredIds = useMemo(() => filteredQuestions.map((q) => q.id), [filteredQuestions]);

  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const someFilteredSelected = filteredIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  const toggleQuestion = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredIds.forEach((id) => next.delete(id));
      } else {
        filteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleInsert = () => {
    const texts = questionBank
      .filter((q) => selectedIds.has(q.id))
      .map((q) => q.questionText);
    onInsert(texts);
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const selectedCount = selectedIds.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="animate-scale-in flex w-full max-w-xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800 max-h-[90vh]">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
              <BookOpen size={16} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Question Bank</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            aria-label="Close question bank"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-6">
          <div className="relative mb-4 shrink-0">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="text"
              placeholder="Search questions..."
              className={`${inputBase} pl-10`}
            />
          </div>

          {filteredQuestions.length > 0 && (
            <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {selectedCount > 0 ? (
                  <>
                    <span className="tabular-nums font-semibold text-[#2463eb] dark:text-[#60a5fa]">
                      {selectedCount}
                    </span>{' '}
                    selected
                  </>
                ) : (
                  'Select questions to add'
                )}
              </span>
              <button
                type="button"
                onClick={toggleSelectAllFiltered}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {allFilteredSelected ? 'Deselect all' : someFilteredSelected ? 'Select all visible' : 'Select all'}
              </button>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-600">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-slate-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#2463eb]" />
                Loading questions...
              </div>
            ) : filteredQuestions.length > 0 ? (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredQuestions.map((question) => {
                  const checked = selectedIds.has(question.id);
                  return (
                    <li key={question.id}>
                      <label
                        className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-all ${
                          checked
                            ? 'bg-[#2463eb]/[0.04] dark:bg-[#2463eb]/10'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                        }`}
                      >
                        <div className="relative mt-0.5 flex shrink-0 items-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleQuestion(question.id)}
                            className="peer sr-only"
                          />
                          <div className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-slate-300 transition-all peer-checked:border-[#2463eb] peer-checked:bg-[#2463eb] dark:border-slate-500">
                            <svg
                              className={`h-3 w-3 text-white transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <span className="min-w-0 flex-1 text-sm text-slate-800 dark:text-slate-100">
                          {question.questionText}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                No active questions found
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-700">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            disabled={selectedCount === 0}
            className="rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#2463eb]/25 transition-all hover:shadow-lg hover:shadow-[#2463eb]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Insert {selectedCount > 0 ? `${selectedCount} ` : ''}
            Question{selectedCount === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  );
};
