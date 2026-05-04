import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Clock, FileText, AlertTriangle } from 'lucide-react';
import {
  useGetMyFormStatusQuery,
  useGetMyCurrentFormQuery,
  useSaveDraftMutation,
  useSubmitFormMutation,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';
import { getRatingOptions, isRatingValidForAnswer } from '../../features/selfAssessmentForm/ratingSystem';
import { formatDateDayMonthYear } from '../../utils/dateUtils';

interface AnswerFormData {
  answers: {
    id: number;
    yesNoAnswer: string | null;
    rating: number | null;
    remarks: string | null;
  }[];
  employeeRemarks: string | null;
}

export const MySelfAssessmentFormPage: React.FC = () => {
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const { data: formStatus, isLoading: statusLoading } = useGetMyFormStatusQuery();
  const shouldLoadForm = Boolean(formStatus?.isEligible && formStatus?.hasActiveTemplate && formStatus?.status !== 'NOT_ASSIGNED');
  const { data: formData, isLoading: formLoading, refetch } = useGetMyCurrentFormQuery(undefined, {
    skip: !shouldLoadForm,
  });

  const [saveDraft, { isLoading: isSaving }] = useSaveDraftMutation();
  const [submitForm, { isLoading: isSubmitting }] = useSubmitFormMutation();

  const { register, handleSubmit, setValue, watch, reset, formState: { isDirty } } = useForm<AnswerFormData>({
    defaultValues: {
      answers: [],
      employeeRemarks: '',
    },
  });

  useEffect(() => {
    if (formData?.answers) {
      reset({
        answers: formData.answers.map(a => ({
          id: a.id,
          yesNoAnswer: a.yesNoAnswer,
          rating: a.rating,
          remarks: a.remarks || '',
        })),
        employeeRemarks: formData.employeeRemarks || '',
      });
    }
  }, [formData, reset]);

  const watchAnswers = watch('answers');
  const ratingSystem = formData?.ratingSystem ?? 'FIVE_POINT';

  const handleYesNoChange = (index: number, value: string, currentRating: number | null) => {
    setValue(`answers.${index}.yesNoAnswer`, value);
    if (isRatingValidForAnswer(ratingSystem, value, currentRating)) {
      setValue(`answers.${index}.rating`, currentRating);
    } else {
      setValue(`answers.${index}.rating`, null as any);
    }
  };

  const handleRatingChange = (index: number, value: string, yesNoAnswer: string | null) => {
    const rating = parseInt(value);
    if (!isRatingValidForAnswer(ratingSystem, yesNoAnswer, rating)) {
      toast.error('Rating does not match the selected response');
      return;
    }
    setValue(`answers.${index}.rating`, rating);
  };

  const onSaveDraft = async (data: AnswerFormData) => {
    try {
      await saveDraft({
        answers: data.answers.map(a => ({
          id: a.id,
          yesNoAnswer: a.yesNoAnswer,
          rating: a.rating,
          remarks: a.remarks,
        })),
        employeeRemarks: data.employeeRemarks,
        overallRemarks: formData?.overallRemarks ?? null,
      }).unwrap();
      toast.success('Draft saved successfully');
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to save draft');
    }
  };

  const onSubmitForm = async (data: AnswerFormData) => {
    const submissionTitle = formData?.title?.trim() || 'Self Assessment Form';

    try {
      await submitForm({
        title: submissionTitle,
        answers: data.answers.map(a => ({
          id: a.id,
          yesNoAnswer: a.yesNoAnswer,
          rating: a.rating,
          remarks: a.remarks,
        })),
        employeeRemarks: data.employeeRemarks,
        overallRemarks: formData?.overallRemarks ?? null,
      }).unwrap();
      toast.success('Form submitted successfully');
      setShowSubmitConfirm(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to submit form');
    }
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!formStatus?.isEligible) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">Not Eligible</h2>
          <p className="text-amber-700 dark:text-amber-300 mt-2">{formStatus?.message}</p>
        </div>
      </div>
    );
  }

  if (formStatus?.deadlinePassed && formStatus?.status !== 'REOPENED') {
    return (
      <div className="p-6">
        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center">
          <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Deadline Passed</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {formStatus?.status === 'NOT_SUBMITTED'
              ? 'Your draft was marked as not submitted because the deadline has passed.'
              : 'The deadline for this self-assessment cycle has passed.'}
          </p>
        </div>
      </div>
    );
  }

  if (!formStatus?.hasActiveTemplate) {
    return (
      <div className="p-6">
        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No Form Available</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">{formStatus?.message}</p>
        </div>
      </div>
    );
  }

  if (formStatus?.status === 'NOT_ASSIGNED') {
    return (
      <div className="p-6">
        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No Assigned Form</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">{formStatus?.message}</p>
        </div>
      </div>
    );
  }

  if (formLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const isReadOnly = formData?.status !== 'DRAFT' && formData?.status !== 'REOPENED';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Self Assessment Form</h1>
        {formData?.title && (
          <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">{formData.title}</p>
        )}
        <div className="flex items-center gap-4 mt-2">
          <span className={`text-sm px-3 py-1 rounded-full ${
            formData?.status === 'DRAFT' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
            formData?.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
            formData?.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
            formData?.status === 'REOPENED' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
            'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
          }`}>
            {formData?.status}
          </span>
          {formData?.cycleName && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Cycle: {formData.cycleName}
            </span>
          )}
          {formData?.deadlineDate && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Deadline: {formatDateDayMonthYear(formData.deadlineDate)}
            </span>
          )}
          {formData?.totalScore != null && (
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Score: {formData.totalScore.toFixed(1)}% ({formData.ratingCategory})
            </span>
          )}
        </div>
      </div>

      {isReadOnly && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            This form is read-only in its current status. You cannot make changes.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmitForm)}>
        <div className="space-y-6">
          {formData?.answers && formData.answers.map((answer, index) => (
            <div key={answer.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="mb-4">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Question {index + 1}</span>
                <p className="text-base font-medium text-slate-900 dark:text-white mt-1">{answer.questionText}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Response
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        {...register(`answers.${index}.yesNoAnswer` as const)}
                        value="Yes"
                        checked={watchAnswers?.[index]?.yesNoAnswer === 'Yes'}
                        onChange={() => handleYesNoChange(index, 'Yes', watchAnswers?.[index]?.rating)}
                        disabled={isReadOnly}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        {...register(`answers.${index}.yesNoAnswer` as const)}
                        value="No"
                        checked={watchAnswers?.[index]?.yesNoAnswer === 'No'}
                        onChange={() => handleYesNoChange(index, 'No', watchAnswers?.[index]?.rating)}
                        disabled={isReadOnly}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Rating
                  </label>
                  <select
                    {...register(`answers.${index}.rating` as const)}
                    value={watchAnswers?.[index]?.rating ?? ''}
                    onChange={(e) => handleRatingChange(index, e.target.value, watchAnswers?.[index]?.yesNoAnswer)}
                    disabled={isReadOnly || !watchAnswers?.[index]?.yesNoAnswer}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                  >
                    <option value="">Select Rating</option>
                    {getRatingOptions(ratingSystem, watchAnswers?.[index]?.yesNoAnswer).map((rating) => (
                      <option key={rating} value={rating}>{rating}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Remarks (Optional)
                  </label>
                  <input
                    {...register(`answers.${index}.remarks` as const)}
                    disabled={isReadOnly}
                    placeholder="Add remarks..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                  />
                </div>
              </div>

              {answer.managerProposedYesNo && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">Manager Proposed Adjustment</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Original:</span>
                      <p className="font-medium text-slate-700 dark:text-slate-200">{answer.yesNoAnswer} ({answer.rating})</p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Proposed:</span>
                      <p className="font-medium text-amber-700 dark:text-amber-300">{answer.managerProposedYesNo} ({answer.managerProposedRating})</p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Comment:</span>
                      <p className="text-slate-600 dark:text-slate-300">{answer.managerProposedComment}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Additional Remarks</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Employee Remarks
                </label>
                <textarea
                  {...register('employeeRemarks')}
                  disabled={isReadOnly}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                  placeholder="Add any additional remarks..."
                />
              </div>
            </div>
          </div>
        </div>

        {!isReadOnly && (
          <div className="mt-6 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={handleSubmit(onSaveDraft)}
              disabled={isSaving || !isDirty}
              className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              Save & Finish Later
            </button>
            <button
              type="button"
              onClick={() => setShowSubmitConfirm(true)}
              disabled={isSubmitting}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        )}
      </form>

      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Confirm Submission</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Are you ready to submit this completed assessment?<br />
              <strong>Your assessment will be shared with your manager and you will not be able to make any changes.</strong>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit(onSubmitForm)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
