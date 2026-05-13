import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { 
    ChevronLeft, 
    MessageSquare, 
    Save, 
    CheckCircle2, 
    User, 
    ShieldCheck,
    PenLine,
    Loader2,
    Building2,
    Calendar,
    ArrowRight,
    AlertCircle,
    RotateCcw
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { useRef } from 'react';
import { resolveMediaSrc } from '../../utils/mediaUrl';

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
    };
    status: string;
    managerComments?: string;
    managerSignature?: string;
    hrComments?: string;
    totalScore?: number;
    ratingCategory?: string;
}

export const ManagerEvaluationPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [answers, setAnswers] = useState<Record<number, { rating: number, comments: string }>>({});
    const [comments, setComments] = useState('');
    const [signature, setSignature] = useState('');
    const [isUsingSavedSignature, setIsUsingSavedSignature] = useState(false);
    const sigCanvas = useRef<any>(null);
    const [defaultSignature, setDefaultSignature] = useState<string | null>(null);

    useEffect(() => {
        fetchForm();
        fetchDefaultSignature();
    }, [id]);

    const fetchDefaultSignature = async () => {
        try {
            const resp = await axios.get('/signatures/default');
            if (resp.data.success && resp.data.data) {
                setDefaultSignature(resp.data.data.signatureData);
            }
        } catch (err) {
            console.error("Failed to fetch default signature", err);
        }
    };

    useEffect(() => {
        if (!loading && assignment && defaultSignature) {
            if (!signature) {
                setSignature(defaultSignature);
                setIsUsingSavedSignature(true);
            }
        }
    }, [loading, assignment, defaultSignature]);
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
                
                setAnswers(initialAnswers);
                setComments(response.data.data.managerComments || '');
                setSignature(response.data.data.managerSignature || '');
            }
        } catch (error) {
            toast.error('Failed to load evaluation form');
            navigate('/manager/appraisals');
        } finally {
            setLoading(false);
        }
    };

    const handleRatingChange = (questionId: number, rating: number) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], rating }
        }));
    };

    const handleAnswerCommentChange = (questionId: number, comments: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], comments }
        }));
    };

    const handleClearSignature = () => {
        if (sigCanvas.current) {
            sigCanvas.current.clear();
        }
        setSignature('');
        setIsUsingSavedSignature(false);
    };

    const handleUseDefaultSignature = () => {
        if (defaultSignature) {
            setSignature(defaultSignature);
            setIsUsingSavedSignature(true);
            toast.success("Default signature applied");
        } else {
            toast.error("No default signature found in Settings");
        }
    };

    const handleSubmit = async () => {
        // Capture signature if drawn but not yet in state
        let finalSignature = signature;
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            finalSignature = sigCanvas.current.getCanvas().toDataURL();
        } else if (!finalSignature && defaultSignature) {
            // Auto-use default signature if canvas is empty and no signature selected yet
            finalSignature = defaultSignature;
        }

        // Validation
        const unanswered = Object.values(answers).some(a => a.rating === 0);
        if (unanswered) {
            toast.error('Please rate all items before submitting');
            return;
        }

        if (!finalSignature || !finalSignature.trim()) {
            toast.error('Please provide your signature or set one in Settings');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                answers: Object.entries(answers).map(([qId, data]) => ({
                    questionId: parseInt(qId),
                    rating: data.rating,
                    comments: data.comments
                })),
                comments,
                signature: finalSignature
            };

            const response = await axios.post(`/appraisal-assignments/${id}/evaluate`, payload);
            if (response.data.success) {
                toast.success('Evaluation submitted successfully');
                navigate('/manager/appraisals');
            }
        } catch (error) {
            toast.error('Failed to submit evaluation');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={40} className="text-[#5D5FEF] animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse">Loading appraisal form...</p>
                </div>
            </div>
        );
    }

    if (!assignment) return null;

    const empName = assignment.employee?.employeeName || assignment.employee?.fullName || (assignment.employee as any)?.full_name || 'Employee';
    const deptName = assignment.employee?.department?.departmentName || assignment.employee?.department?.name || 'N/A';
    const posName = (assignment.employee as any)?.position?.positionName || (assignment.employee as any)?.position?.name || 'N/A';
    const isReadOnly = assignment.status !== 'PENDING_MANAGER' && assignment.status !== 'RETURNED';

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Sticky Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
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
                    {!isReadOnly && (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex items-center gap-2 bg-[#5D5FEF] text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-[#5D5FEF]/20 hover:bg-[#4C4EDE] transition-all disabled:opacity-50"
                        >
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                            Submit Evaluation
                        </button>
                    )}
                    {isReadOnly && (
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                            assignment.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                            assignment.status === 'HR_APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                            Status: {assignment.status}
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 mt-8 space-y-8">
                {/* HR Feedback if returned or rejected */}
                {(assignment.status === 'RETURNED' || assignment.status === 'REJECTED') && assignment.hrComments && (
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
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#5D5FEF] to-[#7C7EF5] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-[#5D5FEF]/20">
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
                            </div>
                        </div>
                    </div>
                </section>

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
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-[#5D5FEF] bg-[#5D5FEF]/10 px-2 py-0.5 rounded-full uppercase">Question</span>
                                                {question.isRequired && <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">* Required</span>}
                                            </div>
                                            <h4 className="text-base font-bold text-slate-800 leading-relaxed">{question.questionText}</h4>
                                        </div>

                                        <div className="flex flex-col items-center gap-4">
                                            <div className="flex gap-2">
                                                {[...Array(assignment.template?.maxRating || 5)].map((_, i) => {
                                                    const ratingValue = i + 1;
                                                    const isSelected = answers[question.id]?.rating === ratingValue;
                                                    return (
                                                        <button
                                                            key={ratingValue}
                                                            onClick={() => !isReadOnly && handleRatingChange(question.id, ratingValue)}
                                                            disabled={isReadOnly}
                                                            className={`h-11 w-11 rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                                                                isSelected 
                                                                ? 'bg-[#5D5FEF] text-white shadow-lg shadow-[#5D5FEF]/30 ring-2 ring-[#5D5FEF]/50 ring-offset-2' + (!isReadOnly ? ' scale-110' : '') 
                                                                : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-[#5D5FEF]/30 hover:text-[#5D5FEF] hover:bg-slate-50'
                                                            } ${isReadOnly ? 'cursor-default' : 'hover:scale-105 active:scale-95'}`}
                                                        >
                                                            {ratingValue}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Question Comments */}
                                    <div className="mt-8 pt-8 border-t border-slate-100 flex items-start gap-4">
                                        <MessageSquare size={20} className="text-slate-300 mt-3" />
                                        <textarea
                                            placeholder={isReadOnly ? "No comments provided" : "Add specific comments for this item (optional)..."}
                                            value={answers[question.id]?.comments || ''}
                                            onChange={(e) => !isReadOnly && handleAnswerCommentChange(question.id, e.target.value)}
                                            readOnly={isReadOnly}
                                            className="flex-1 bg-slate-50/50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#5D5FEF]/20 transition-all resize-none h-24"
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
                                <MessageSquare className="text-amber-400" /> Final Feedback
                            </h3>
                            <p className="text-slate-400 text-sm max-w-xl">
                                Provide overall summary of the employee performance for this period. 
                                This feedback will be visible to HR and potentially the employee.
                            </p>
                            <textarea
                                placeholder={isReadOnly ? "No summary feedback" : "Your summary comments..."}
                                value={comments}
                                onChange={(e) => !isReadOnly && setComments(e.target.value)}
                                readOnly={isReadOnly}
                                className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm focus:ring-2 focus:ring-amber-500/50 transition-all resize-none h-40"
                            />
                        </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-black flex items-center gap-3">
                                            <PenLine className="text-amber-400" /> Digital Signature
                                        </h3>
                                        {!isReadOnly && defaultSignature && (
                                            <button 
                                                onClick={handleUseDefaultSignature}
                                                className="text-[10px] font-black uppercase tracking-widest text-amber-400 hover:text-white transition-colors flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"
                                            >
                                                <CheckCircle2 size={12} /> Use Saved Signature
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="relative bg-white/5 border-2 border-white/10 rounded-3xl overflow-hidden group hover:border-amber-400/50 transition-all">
                                        {isReadOnly ? (
                                            <div className="h-40 flex items-center justify-center p-6 bg-white rounded-3xl">
                                                {assignment.managerSignature ? (
                                                    <img src={resolveMediaSrc(assignment.managerSignature)} alt="Manager Signature" className="h-full object-contain" />
                                                ) : (
                                                    <span className="text-slate-300 italic text-sm">No signature provided</span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="relative h-40 bg-white rounded-2xl overflow-hidden group">
                                                {isUsingSavedSignature && signature && (
                                                    <div 
                                                        className="absolute inset-0 z-10 flex items-center justify-center p-8 bg-white cursor-pointer"
                                                        onClick={() => setIsUsingSavedSignature(false)}
                                                    >
                                                        <img 
                                                            src={resolveMediaSrc(signature)} 
                                                            alt="Saved Signature" 
                                                            className="max-w-full max-h-full object-contain opacity-90 transition-transform group-hover:scale-105"
                                                        />
                                                        <div className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="text-[9px] font-black text-[#5D5FEF] bg-[#5D5FEF]/5 px-2 py-1 rounded-md uppercase tracking-tighter">Click to Draw Manually</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <SignatureCanvas
                                                    ref={sigCanvas}
                                                    onBegin={() => setIsUsingSavedSignature(false)}
                                                    onEnd={() => {
                                                        setSignature(sigCanvas.current.getCanvas().toDataURL());
                                                        setIsUsingSavedSignature(false);
                                                    }}
                                                    canvasProps={{
                                                        className: "w-full h-40 cursor-crosshair",
                                                        style: { background: 'white' }
                                                    }}
                                                />
                                                <button
                                                    onClick={handleClearSignature}
                                                    className="absolute top-2 right-2 p-2 text-slate-400 hover:text-red-500 transition-colors z-20"
                                                >
                                                    <RotateCcw size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Authorized Manager Signature</p>
                                </div>
                                
                                {!isReadOnly && (
                                    <div className="flex justify-end pt-4">
                                        <button
                                            onClick={handleSubmit}
                                            disabled={submitting}
                                            className="group bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-10 py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-orange-500/20 transition-all flex items-center justify-center gap-4"
                                        >
                                            {submitting ? 'SUBMITTING...' : 'FINALIZE & SUBMIT'}
                                            <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                                        </button>
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

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
                .font-signature {
                    font-family: 'Dancing Script', cursive;
                }
            `}</style>
        </div>
    );
};
