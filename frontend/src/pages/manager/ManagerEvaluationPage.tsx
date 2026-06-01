import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { useRhfAutosave, withRetry, type SaveResult, type Transport } from 'react-hook-form-autosave';
import axios from '../../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { 
    ChevronLeft, 
    MessageSquare, 
    CheckCircle2, 
    User, 
    ShieldCheck,
    PenLine,
    Loader2,
    Building2,
    Calendar,
    AlertCircle,
    Clock,
    Download,
    Send,
    X,
    AlertTriangle,
    ClipboardCheck,
} from 'lucide-react';
import { formatCycleDate } from '../self-assessment-form/SelfAssessmentReviewCycleInfo';
import { formatDate } from '../../utils/dateUtils';
import { formatRatingCategory } from '../../utils/formatRatingCategory';
import { useRef } from 'react';
import { resolveMediaSrc } from '../../utils/mediaUrl';
import {
    InlineDefaultSignaturePad,
    type InlineDefaultSignaturePadHandle,
} from '../../components/signature/InlineDefaultSignaturePad';
import { useGetDefaultSignatureQuery } from '../../features/user/userApi';
import { exportAppraisalPdf } from '../../utils/exportAppraisalPdf';
import {
    appraisalGradientIcon,
    appraisalGradientBtn,
    appraisalGradientSoft,
} from '../../features/appraisals/appraisalTheme';
import { useGetScoreExplanationsQuery } from '../../features/scoreExplanation/scoreExplanationApi';
import { SelfAssessmentScoreBandTable } from '../../features/selfAssessmentForm/components/SelfAssessmentScoreBandTable';
interface EvaluationFormData {
    answers: Record<string, { rating: number; comments: string }>;
    comments: string;
    signature: string;
}

interface Question {
    id: number;
    questionText: string;
    isRequired: boolean;
    sortOrder: number;
}

interface Category {
    id: number;
    name: string;
    description: string;
    questions: Question[];
}

interface Assignment {
    id: number;
    employee: {
        id: number;
        employeeId: string;
        full_name?: string;
        fullName?: string;
        employeeName?: string;
        department?: { departmentName: string; name: string };
        position?: { positionName: string; name: string };
    };
    template: {
        id: number;
        name: string;
        maxRating: number;
        categories: Category[];
        assessmentDate?: string;
        effectiveDate?: string;
        deadlineDate?: string;
    };
    status: string;
    managerComments?: string;
    managerSignature?: string;
    managerSignedAt?: string;
    hrComments?: string;
    hrSignature?: string;
    hrSignedAt?: string;
    totalScore?: number;
    ratingCategory?: string;
    answers?: {
        question: { id: number };
        rating: number;
        comments: string;
    }[];
    updatedAt?: string;
}

const toEvaluationPayload = (data: EvaluationFormData, includeSignature: boolean) => ({
    answers: Object.entries(data.answers).map(([qId, answer]) => ({
        questionId: Number(qId),
        rating: answer.rating,
        comments: answer.comments,
    })),
    comments: data.comments,
    ...(includeSignature ? { signature: data.signature } : {}),
});

const computeRatingCategory = (score: number): string => {
    if (score >= 90) return 'EXCEPTIONAL';
    if (score >= 75) return 'GOOD';
    if (score >= 50) return 'AVERAGE';
    return 'NEEDS_IMPROVEMENT';
};

function EvaluationProgressBar({ current, total }: { current: number; total: number }) {
    const pct = total === 0 ? 0 : Math.round((current / total) * 100);
    const complete = pct === 100;
    return (
        <div className="space-y-2.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ClipboardCheck size={15} className={complete ? 'text-[#2463eb]' : 'text-slate-400'} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Completion Progress
                    </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold tabular-nums text-slate-900">
                        {pct}%
                    </span>
                    <span className="text-[11px] font-medium tabular-nums text-slate-400">
                        ({current}/{total} Answered)
                    </span>
                </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                        complete
                            ? 'bg-gradient-to-r from-[#2463eb] via-[#2463eb] to-[#3b82f6]'
                            : 'bg-gradient-to-r from-[#2463eb] to-[#3b82f6]'
                    }`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {total > 0 && !complete && (
                <p className="text-[11px] font-medium text-slate-500">
                    {total - current} question{total - current === 1 ? '' : 's'} remaining
                </p>
            )}
        </div>
    );
}

export const ManagerEvaluationPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);
    const [hasPadDrawing, setHasPadDrawing] = useState(false);
    const [needsInlineSignature, setNeedsInlineSignature] = useState(false);
    const [isSavingInlineSignature, setIsSavingInlineSignature] = useState(false);
    const inlineSignaturePadRef = useRef<InlineDefaultSignaturePadHandle>(null);
    const { data: defaultSigResponse, isLoading: isDefaultSigLoading, refetch: refetchDefaultSig } = useGetDefaultSignatureQuery();
    const { data: scoreExplanationsByModule, isLoading: scoreBandsLoading, isError: scoreBandsError } = useGetScoreExplanationsQuery();
    const scoreBands = useMemo(
        () => scoreExplanationsByModule?.APPRAISAL ?? null,
        [scoreExplanationsByModule],
    );
    const hasDefaultSignature = Boolean(defaultSigResponse?.data?.signatureData);
    const form = useForm<EvaluationFormData>({
        defaultValues: {
            answers: {},
            comments: '',
            signature: '',
        },
    });
    const { getValues, reset, setValue, watch, formState, control } = form;
    const answers = useWatch({ control, name: 'answers' }) ?? {};
    const comments = watch('comments');
    const isEditableStatus = (status?: string) =>
        status === 'PENDING_MANAGER' || status === 'RETURNED' || status === 'DRAFT';
    const isReadOnly = !isEditableStatus(assignment?.status);
    const autosaveDisabled = loading || !assignment || Boolean(isReadOnly);

    const draftTransport = useMemo<Transport>(() => {
        const transport: Transport = async (payload) => {
            try {
                await axios.post(`/appraisal-assignments/${id}/draft`, payload);
                setAssignment((current) =>
                    current && isEditableStatus(current.status)
                        ? { ...current, status: 'DRAFT' }
                        : current
                );
                return { ok: true };
            } catch (error: any) {
                return {
                    ok: false,
                    error: new Error(error?.response?.data?.message || 'Failed to save draft'),
                } satisfies SaveResult;
            }
        };

        return withRetry(transport, { maxRetries: 3 });
    }, [id]);

    const autosave = useRhfAutosave<EvaluationFormData>({
        form,
        transport: draftTransport,
        config: {
            debounceMs: 2000,
            maxRetries: 3,
            debug: false,
        },
        validateBeforeSave: 'none',
        selectPayload: (values) => values,
        shouldSave: ({ isDirty, dirtyFields }) =>
            !autosaveDisabled && (isDirty || Object.keys(dirtyFields).length > 0),
        mapPayload: () => toEvaluationPayload(getValues(), false),
    });

    useEffect(() => {
        fetchForm();
    }, [id]);

    useEffect(() => {
        if (!showSubmitConfirm) {
            setHasPadDrawing(false);
            setNeedsInlineSignature(false);
            return;
        }
        if (!isDefaultSigLoading && !hasDefaultSignature) {
            setNeedsInlineSignature(true);
        }
    }, [showSubmitConfirm, isDefaultSigLoading, hasDefaultSignature]);

    const handleDownloadPdf = async () => {
        if (!assignment) return;
        try {
            toast.loading('Generating PDF report...', { id: `pdf-${assignment.id}` });
            await exportAppraisalPdf(assignment as any);
            toast.success('PDF report exported successfully', { id: `pdf-${assignment.id}` });
        } catch (err) {
            console.error(err);
            toast.error('Failed to export PDF report', { id: `pdf-${assignment.id}` });
        }
    };

    const fetchForm = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/appraisal-assignments/${id}/form`);
            if (response.data.success) {
                setAssignment(response.data.data);
                
                // Initialize answers with defaults
                const initialAnswers: any = {};
                response.data.data.template?.categories?.forEach((cat: Category) => {
                    cat.questions?.forEach((q: Question) => {
                        initialAnswers[q.id] = { rating: 0, comments: '' };
                    });
                });

                // Fill with existing answers if available
                if (response.data.data.answers && response.data.data.answers.length > 0) {
                    response.data.data.answers.forEach((ans: any) => {
                        if (ans.question && ans.question.id) {
                            initialAnswers[ans.question.id] = { 
                                rating: ans.rating || 0, 
                                comments: ans.comments || '' 
                            };
                        }
                    });
                }
                
                reset({
                    answers: initialAnswers,
                    comments: response.data.data.managerComments || '',
                    signature: response.data.data.managerSignature || '',
                });
            }
        } catch (error) {
            toast.error('Failed to load evaluation form');
            navigate('/manager/appraisals');
        } finally {
            setLoading(false);
        }
    };

    const handleRatingChange = (questionId: number, rating: number) => {
        setValue(`answers.${questionId}.rating`, rating, { shouldDirty: true, shouldTouch: true });
    };

    const handleAnswerCommentChange = (questionId: number, comments: string) => {
        setValue(`answers.${questionId}.comments`, comments, { shouldDirty: true, shouldTouch: true });
    };

    const resolveSubmissionSignature = useCallback(async (): Promise<string> => {
        if (defaultSigResponse?.data?.signatureData) {
            return defaultSigResponse.data.signatureData;
        }
        const refreshed = await refetchDefaultSig();
        return refreshed.data?.data?.signatureData || getValues('signature') || '';
    }, [defaultSigResponse, refetchDefaultSig, getValues]);

    const handleSaveDraft = async () => {
        try {
            setSavingDraft(true);
            if (formState.isDirty || autosave.hasPendingChanges) {
                const result = await autosave.flush();
                if (!result?.ok) {
                    toast.error(result?.error?.message || 'Failed to save draft');
                    return;
                }
            }

            const finalSignature = await resolveSubmissionSignature();
            const currentValues = getValues();
            const savedValues: EvaluationFormData = {
                ...currentValues,
                signature: finalSignature || currentValues.signature,
            };
            if (finalSignature) {
                setValue('signature', finalSignature, { shouldDirty: false });
            }
            await axios.post(
                `/appraisal-assignments/${id}/draft`,
                toEvaluationPayload(savedValues, Boolean(finalSignature)),
            );
            reset(savedValues);
            autosave.forceBaselineUpdate();
            setAssignment((current) =>
                current
                    ? {
                        ...current,
                        status: isEditableStatus(current.status) ? 'DRAFT' : current.status,
                        managerComments: savedValues.comments,
                        managerSignature: finalSignature || current.managerSignature,
                    }
                    : current,
            );
            toast.success('Draft saved');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to save draft');
        } finally {
            setSavingDraft(false);
        }
    };

    const handleSubmitClick = () => {
        const unanswered = Object.values(answers).some(a => a.rating === 0);
        if (unanswered) {
            toast.error('Please rate all items before submitting');
            return;
        }

        setShowSubmitConfirm(true);
    };

    const handleConfirmSubmit = async () => {
        if (autosave.hasPendingChanges || formState.isDirty) {
            const result = await autosave.flush();
            if (!result?.ok) {
                toast.error(result?.error?.message || 'Please save changes before submitting');
                return;
            }
        }

        try {
            if (needsInlineSignature && !hasDefaultSignature) {
                const pad = inlineSignaturePadRef.current;
                if (!pad) {
                    toast.error('Signature pad is not ready. Please try again.');
                    return;
                }
                setIsSavingInlineSignature(true);
                const saved = await pad.saveAsDefault();
                if (!saved) return;
            }

            setSubmitting(true);
            const finalSignature = await resolveSubmissionSignature();
            if (!finalSignature?.trim()) {
                toast.error('A signature is required before submitting');
                return;
            }
            setValue('signature', finalSignature, { shouldDirty: false });

            const payload = toEvaluationPayload({
                ...getValues(),
                signature: finalSignature,
            }, true);

            const response = await axios.post(`/appraisal-assignments/${id}/evaluate`, payload);
            if (response.data.success) {
                setShowSubmitConfirm(false);
                toast.success('Evaluation submitted successfully');
                navigate('/manager/appraisals');
            }
        } catch (error) {
            toast.error('Failed to submit evaluation');
        } finally {
            setSubmitting(false);
            setIsSavingInlineSignature(false);
        }
    };

    const maxRating = assignment?.template?.maxRating || 5;
    const totalQuestionCount = useMemo(
        () => assignment?.template?.categories?.reduce(
            (count, category) => count + (category.questions?.length ?? 0),
            0,
        ) ?? 0,
        [assignment?.template?.categories],
    );
    const liveEvaluationStats = useMemo(() => {
        const answerValues = Object.values(answers ?? {});
        const answeredCount = answerValues.filter((answer) => (answer?.rating ?? 0) > 0).length;
        const pointsAchieved = answerValues.reduce((sum, answer) => sum + (answer?.rating ?? 0), 0);
        const maxPoints = totalQuestionCount * maxRating;
        const liveScore = maxPoints > 0 ? (pointsAchieved / maxPoints) * 100 : 0;
        const progressPercent = totalQuestionCount > 0
            ? Math.round((answeredCount / totalQuestionCount) * 100)
            : 0;

        return {
            answeredCount,
            pointsAchieved,
            maxPoints,
            liveScore,
            progressPercent,
            ratingCategory: computeRatingCategory(liveScore),
        };
    }, [answers, maxRating, totalQuestionCount]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={40} className="text-[#2463eb] animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse">Loading appraisal form...</p>
                </div>
            </div>
        );
    }

    if (!assignment) return null;

    const empName = assignment.employee?.employeeName || assignment.employee?.fullName || (assignment.employee as any)?.full_name || 'Employee';
    const deptName = assignment.employee?.department?.departmentName || assignment.employee?.department?.name || 'N/A';
    const posName = (assignment.employee as any)?.position?.positionName || (assignment.employee as any)?.position?.name || 'N/A';
    const saveStatus = autosave.isSaving
        ? 'Saving...'
        : autosave.lastError
            ? 'Save failed'
            : autosave.hasPendingChanges || formState.isDirty
                ? 'Unsaved changes'
                : 'All changes saved';
    const saveStatusTone = autosave.isSaving
        ? 'text-blue-600'
        : autosave.lastError
            ? 'text-red-600'
            : autosave.hasPendingChanges || formState.isDirty
                ? 'text-[#2463eb]'
                : 'text-emerald-600';

    return (
        <div className={`min-h-screen bg-slate-50/50 ${!isReadOnly ? 'pb-24' : 'pb-8'}`}>
            <main className="max-w-5xl mx-auto px-6 pt-6 space-y-8">
                {/* Page Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/manager/appraisals')}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">
                                {isReadOnly ? 'View Evaluation' : 'Perform Evaluation'}
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">
                                {isReadOnly ? 'Reviewing' : 'Assessing'} {empName}
                            </p>
                        </div>
                    </div>
                    {isReadOnly && (
                        <div className="flex items-center gap-3">
                            {(assignment.status === 'SUBMITTED' || assignment.status === 'HR_APPROVED' || assignment.status === 'LOCKED') && (
                                <button
                                    onClick={handleDownloadPdf}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                                    title="Download PDF"
                                >
                                    <Download size={14} />
                                    <span>Download PDF</span>
                                </button>
                            )}
                            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                assignment.status === 'SUBMITTED' ? 'bg-[#eff6ff] text-[#2463eb] border-[#dbeafe]' :
                                assignment.status === 'HR_APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                assignment.status === 'LOCKED' ? 'bg-slate-900 text-white border-slate-900' :
                                'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                                Status: {assignment.status === 'LOCKED' ? 'FINALIZED' : assignment.status}
                            </div>
                        </div>
                    )}
                </div>
                {/* HR Feedback if returned or rejected */}
                {(assignment.status === 'RETURNED' || assignment.status === 'REJECTED' || assignment.status === 'DRAFT') && assignment.hrComments && (
                    <section className="bg-red-50 border border-red-100 rounded-3xl p-6 flex items-start gap-4">
                        <div className="bg-red-500 text-white p-2 rounded-xl">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-red-900 uppercase tracking-tight">HR Feedback</h4>
                            <p className="text-sm text-red-700 mt-1">{assignment.hrComments}</p>
                        </div>
                    </section>
                )}
                {/* Employee Info Card */}
                <section className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                        <User size={120} />
                    </div>
                    <div className="flex items-start gap-6 relative z-10">
                        <div className={`h-20 w-20 rounded-2xl ${appraisalGradientIcon} flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-[#2463eb]/20`}>
                            {empName.charAt(0)}
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-slate-900">{empName}</h2>
                            <div className="flex flex-wrap gap-4 items-center text-sm text-slate-500 font-medium">
                                <span className="flex items-center gap-1.5"><Building2 size={16} /> {deptName}</span>
                                <span className="flex items-center gap-1.5 text-slate-300">|</span>
                                <span className="flex items-center gap-1.5"><ShieldCheck size={16} /> {posName}</span>
                                <span className="flex items-center gap-1.5 text-slate-300">|</span>
                                <span className="flex items-center gap-1.5"><Calendar size={16} /> {assignment.template?.name || 'N/A'}</span>
                                {assignment.template?.assessmentDate && (
                                    <>
                                        <span className="flex items-center gap-1.5 text-slate-300">|</span>
                                        <span className="flex items-center gap-1.5"><Clock size={16} /> {formatCycleDate(assignment.template.assessmentDate)}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Live progress & score while evaluating */}
                {!isReadOnly && totalQuestionCount > 0 && (
                    <>
                        <section className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
                            <EvaluationProgressBar
                                current={liveEvaluationStats.answeredCount}
                                total={totalQuestionCount}
                            />
                        </section>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className={`p-6 ${appraisalGradientSoft} border border-[#bfdbfe] rounded-3xl space-y-2 shadow-sm`}>
                                <p className="text-[10px] font-bold text-[#2463eb] uppercase tracking-wider">Points Achieved</p>
                                <p className="text-3xl font-black text-[#1d4ed8] italic">
                                    {liveEvaluationStats.pointsAchieved}
                                    <span className="text-[#93c5fd] mx-2 text-xl font-normal">/</span>
                                    <span className="text-[#60a5fa] text-2xl">{liveEvaluationStats.maxPoints}</span>
                                </p>
                            </div>
                            <div className={`p-6 ${appraisalGradientSoft} border border-[#bfdbfe] rounded-3xl space-y-2 shadow-sm`}>
                                <p className="text-[10px] font-bold text-[#2463eb] uppercase tracking-wider">Live Score</p>
                                <p className="text-3xl font-black text-[#1d4ed8]">
                                    {liveEvaluationStats.liveScore.toFixed(1)}%
                                </p>
                            </div>
                            <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-3xl space-y-2 shadow-sm min-w-0 overflow-hidden">
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Performance Category</p>
                                <p className="text-lg sm:text-xl font-bold text-emerald-700 break-words leading-snug">
                                    {formatRatingCategory(liveEvaluationStats.ratingCategory)}
                                </p>
                            </div>
                        </div>
                    </>
                )}

                {/* Summary Cards */}
                {isReadOnly && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className={`p-6 ${appraisalGradientSoft} border border-[#bfdbfe] rounded-3xl space-y-2 shadow-sm`}>
                            <p className="text-[10px] font-bold text-[#2463eb] uppercase tracking-wider">Points Achieved</p>
                            <p className="text-3xl font-black text-[#1d4ed8] italic">
                                {assignment.answers?.reduce((acc, curr) => acc + (curr.rating || 0), 0)}
                                <span className="text-[#93c5fd] mx-2 text-xl font-normal">/</span>
                                <span className="text-[#60a5fa] text-2xl">{(assignment.answers?.length || 0) * (assignment.template?.maxRating || 5)}</span>
                            </p>
                        </div>
                        <div className={`p-6 ${appraisalGradientSoft} border border-[#bfdbfe] rounded-3xl space-y-2 shadow-sm`}>
                            <p className="text-[10px] font-bold text-[#2463eb] uppercase tracking-wider">Overall Score</p>
                            <p className="text-3xl font-black text-[#1d4ed8]">
                                {assignment.totalScore?.toFixed(1) || '0.0'}%
                            </p>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-3xl space-y-2 shadow-sm min-w-0 overflow-hidden">
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Performance Category</p>
                            <p className="text-lg sm:text-xl font-bold text-emerald-700 break-words leading-snug">
                                {formatRatingCategory(assignment.ratingCategory)}
                            </p>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-3xl space-y-2 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Submission Date</p>
                            <p className="text-xl font-medium text-slate-700">
                                {assignment.managerSignedAt ? formatDate(assignment.managerSignedAt) : 'Not Submitted'}
                            </p>
                        </div>
                    </div>
                )}

                <SelfAssessmentScoreBandTable
                    bands={scoreBands}
                    loading={scoreBandsLoading && !scoreBands?.length}
                    error={scoreBandsError && !scoreBands?.length}
                />

                {/* Evaluation Categories */}
                {assignment.template?.categories?.map((category) => (
                    <section key={category.id} className="space-y-4">
                        <div className="flex items-end justify-between px-2">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">{category.name}</h3>
                                <p className="text-sm text-slate-500">{category.description}</p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{category.questions.length} Items</span>
                        </div>
                        <div className="grid gap-4">
                            {category.questions.map((question) => (
                                <div key={question.id} className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm hover:shadow-md transition-all group">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-[#2463eb] bg-[#eff6ff] px-2 py-0.5 rounded-full uppercase">Question</span>
                                                {question.isRequired && <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">* Required</span>}
                                            </div>
                                            <h4 className="text-base font-bold text-slate-800 leading-relaxed">{question.questionText}</h4>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {[...Array(assignment.template?.maxRating || 5)].map((_, i) => {
                                                const maxRating = assignment.template?.maxRating || 5;
                                                const ratingValue = maxRating - i;
                                                const isSelected = answers[question.id]?.rating === ratingValue;
                                                return (
                                                    <button
                                                        key={ratingValue}
                                                        onClick={() => !isReadOnly && handleRatingChange(question.id, ratingValue)}
                                                        disabled={isReadOnly}
                                                        className={`h-11 w-11 rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                                                            isSelected 
                                                            ? 'bg-[#2463eb] text-white shadow-lg shadow-[#2463eb]/30 ring-2 ring-[#2463eb]/50 ring-offset-2' + (!isReadOnly ? ' scale-110' : '') 
                                                            : 'bg-white border-2 border-slate-300 text-slate-500 hover:border-[#2463eb]/40 hover:text-[#2463eb] hover:bg-slate-50'
                                                        } ${isReadOnly ? 'cursor-default' : 'hover:scale-105 active:scale-95'}`}
                                                    >
                                                        {ratingValue}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    
                                    {/* Question Comments */}
                                    <div className="mt-8 pt-8 border-t border-slate-100 flex items-start gap-4">
                                        <MessageSquare size={20} className="text-slate-500 mt-3 shrink-0" />
                                        <textarea
                                            placeholder={isReadOnly ? "No comments provided" : "Add specific comments for this item (optional)..."}
                                            value={answers[question.id]?.comments || ''}
                                            onChange={(e) => !isReadOnly && handleAnswerCommentChange(question.id, e.target.value)}
                                            readOnly={isReadOnly}
                                            className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#2463eb] focus:bg-white focus:ring-2 focus:ring-[#2463eb]/20 transition-all resize-none h-24 read-only:bg-slate-100 read-only:text-slate-600"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}

                {/* Final Comments & Signature */}
                <section className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 p-10 opacity-10">
                        <PenLine size={160} />
                    </div>
                    <div className="relative z-10 space-y-10">
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black flex items-center gap-3">
                                <MessageSquare className="text-[#60a5fa]" /> Final Feedback
                            </h3>
                            <p className="text-slate-400 text-sm max-w-xl">
                                Provide overall summary of the employee performance for this period. 
                                This feedback will be visible to HR and potentially the employee.
                            </p>
                            <textarea
                                placeholder={isReadOnly ? "No summary feedback" : "Your summary comments..."}
                                value={comments}
                                onChange={(e) => !isReadOnly && setValue('comments', e.target.value, { shouldDirty: true, shouldTouch: true })}
                                readOnly={isReadOnly}
                                className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm focus:ring-2 focus:ring-[#2463eb]/50 transition-all resize-none h-40"
                            />
                        </div>

                        {isReadOnly && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-black flex items-center gap-3">
                                    <PenLine className="text-[#60a5fa]" /> Digital Signature
                                </h3>
                                <div className="relative bg-white/5 border-2 border-white/10 rounded-3xl overflow-hidden">
                                    <div className="h-40 flex items-center justify-center p-6 bg-white rounded-3xl">
                                        {assignment.managerSignature ? (
                                            <img src={resolveMediaSrc(assignment.managerSignature)} alt="Manager Signature" className="h-full object-contain" />
                                        ) : (
                                            <span className="text-slate-300 italic text-sm">No signature provided</span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Authorized Manager Signature</p>
                            </div>
                        )}

                        {isReadOnly && (
                                    <div className="flex flex-col md:flex-row justify-end gap-6">
                                        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 flex items-center gap-4 shadow-xl">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verified By</p>
                                                <p className="text-slate-900 font-black text-sm uppercase">Manager</p>
                                            </div>
                                            <div className="h-12 w-32 bg-slate-50 rounded-xl p-2 flex items-center justify-center border border-slate-100">
                                                {assignment.managerSignature ? (
                                                    <img src={resolveMediaSrc(assignment.managerSignature)} alt="Verified Signature" className="h-full object-contain" />
                                                ) : (
                                                    <span className="font-signature text-slate-700 text-lg">Signed</span>
                                                )}
                                            </div>
                                        </div>

                                        {(assignment.status === 'HR_APPROVED' || assignment.status === 'LOCKED') && (assignment as any).hrSignature && (
                                            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 flex items-center gap-4 shadow-xl">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Approved By</p>
                                                    <p className="text-slate-900 font-black text-sm uppercase">HR / Admin</p>
                                                </div>
                                                <div className="h-12 w-32 bg-slate-50 rounded-xl p-2 flex items-center justify-center border border-slate-100">
                                                    <img src={resolveMediaSrc((assignment as any).hrSignature)} alt="HR Signature" className="h-full object-contain" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                </section>
            </main>

            {!isReadOnly && (
                <div className="fixed bottom-0 left-64 right-0 z-40 border-t border-slate-200 bg-white/85 backdrop-blur-xl">
                    <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
                        <div className="hidden items-center gap-2 sm:flex">
                            <span className={`text-xs font-bold ${saveStatusTone}`}>
                                {saveStatus}
                            </span>
                            {totalQuestionCount > 0 && (
                                <>
                                    <span className="text-slate-300">·</span>
                                    <span className="text-xs font-medium tabular-nums text-slate-500">
                                        {liveEvaluationStats.answeredCount}/{totalQuestionCount} Answered
                                    </span>
                                    <span className="text-slate-300">·</span>
                                    <span className="text-xs font-medium tabular-nums text-slate-500">
                                        {liveEvaluationStats.progressPercent}% complete
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="flex flex-1 items-center justify-end gap-3 sm:flex-initial">
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                disabled={savingDraft || autosave.isSaving}
                                className="flex items-center gap-2 border border-slate-200 bg-white text-slate-700 px-4 py-2.5 rounded-2xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                            >
                                {savingDraft || autosave.isSaving ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
                                Save Draft
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitClick}
                                disabled={submitting || savingDraft}
                                className={`flex items-center gap-2 ${appraisalGradientBtn} text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-[#2463eb]/20 transition-all disabled:opacity-50`}
                            >
                                {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                Submit Evaluation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSubmitConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="submit-evaluation-title"
                        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] text-white shadow-md shadow-[#2463eb]/20">
                                    <Send size={18} />
                                </div>
                                <div>
                                    <h3 id="submit-evaluation-title" className="text-base font-bold tracking-tight text-slate-900">
                                        Submit Evaluation
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        This action cannot be undone
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => !submitting && !isSavingInlineSignature && setShowSubmitConfirm(false)}
                                disabled={submitting || isSavingInlineSignature}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="px-6 py-5">
                            <p className="text-sm leading-relaxed text-slate-600">
                                Submitting this evaluation will finalize it and send it to HR. You will not be able to make further changes.
                            </p>
                            {needsInlineSignature && (
                                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3.5">
                                    <p className="text-sm font-semibold text-amber-900">
                                        Default signature is required before submission.
                                    </p>
                                    <p className="mt-1 text-xs text-amber-800">
                                        Sign below. Your signature will be saved as your default when you confirm submission.
                                    </p>
                                    <InlineDefaultSignaturePad
                                        ref={inlineSignaturePadRef}
                                        onDrawingChange={setHasPadDrawing}
                                        disabled={isSavingInlineSignature || submitting}
                                    />
                                </div>
                            )}
                            <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3.5">
                                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                                <p className="text-sm leading-snug font-medium text-amber-800">
                                    Once submitted, this evaluation cannot be edited and will be sent to HR for review.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setShowSubmitConfirm(false)}
                                disabled={submitting || isSavingInlineSignature}
                                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmSubmit}
                                disabled={
                                    submitting
                                    || isSavingInlineSignature
                                    || isDefaultSigLoading
                                    || (needsInlineSignature && !hasPadDrawing)
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#dbeafe] transition-all hover:shadow-lg hover:shadow-[#2463eb]/30 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <CheckCircle2 size={16} />
                                {isSavingInlineSignature ? 'Saving signature…' : submitting ? 'Submitting…' : 'Submit Evaluation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
                .font-signature {
                    font-family: 'Dancing Script', cursive;
                }
            `}</style>
        </div>
    );
};
