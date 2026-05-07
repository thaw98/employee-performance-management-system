import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { 
    ChevronLeft, 
    Star, 
    MessageSquare, 
    Save, 
    CheckCircle2, 
    User, 
    ShieldCheck,
    PenLine,
    Loader2,
    Building2,
    Calendar,
    ArrowRight
} from 'lucide-react';

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

    useEffect(() => {
        fetchForm();
    }, [id]);

    const fetchForm = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/appraisal-assignments/${id}/form`);
            if (response.data.success) {
                setAssignment(response.data.data);
                // Initialize answers
                const initialAnswers: any = {};
                response.data.data.template.categories.forEach((cat: Category) => {
                    cat.questions.forEach((q: Question) => {
                        initialAnswers[q.id] = { rating: 0, comments: '' };
                    });
                });
                setAnswers(initialAnswers);
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

    const handleSubmit = async () => {
        // Validation
        const unanswered = Object.values(answers).some(a => a.rating === 0);
        if (unanswered) {
            toast.error('Please rate all items before submitting');
            return;
        }

        if (!signature.trim()) {
            toast.error('Please provide your signature');
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
                signature
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

    const empName = assignment.employee.employeeName || assignment.employee.fullName || assignment.employee.full_name || 'Employee';
    const deptName = assignment.employee.department?.departmentName || assignment.employee.department?.name || 'N/A';
    const posName = assignment.employee.position?.positionName || assignment.employee.position?.name || 'N/A';

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
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">Perform Evaluation</h1>
                            <p className="text-xs text-slate-500 font-medium">Assessing {empName}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 bg-[#5D5FEF] text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-[#5D5FEF]/20 hover:bg-[#4C4EDE] transition-all disabled:opacity-50"
                    >
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                        Submit Evaluation
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 mt-8 space-y-8">
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
                                                            onClick={() => handleRatingChange(question.id, ratingValue)}
                                                            className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                                                                isSelected 
                                                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 scale-110' 
                                                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                                                            }`}
                                                        >
                                                            <Star size={20} fill={isSelected ? "currentColor" : "none"} />
                                                            <span className="absolute -bottom-6 text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {ratingValue}
                                                            </span>
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
                                            placeholder="Add specific comments for this item (optional)..."
                                            value={answers[question.id]?.comments || ''}
                                            onChange={(e) => handleAnswerCommentChange(question.id, e.target.value)}
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
                                placeholder="Your summary comments..."
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm focus:ring-2 focus:ring-amber-500/50 transition-all resize-none h-40"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-10 items-end">
                            <div className="space-y-4">
                                <h3 className="text-xl font-black flex items-center gap-3">
                                    <PenLine className="text-amber-400" /> Digital Signature
                                </h3>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Type your full name as signature"
                                        value={signature}
                                        onChange={(e) => setSignature(e.target.value)}
                                        className="w-full bg-white/5 border-b-2 border-white/10 focus:border-amber-400 px-0 py-4 text-2xl font-signature bg-transparent focus:outline-none transition-all italic tracking-widest placeholder:opacity-20"
                                    />
                                    <p className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Authorized Manager Signature</p>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="group bg-amber-500 text-white px-10 py-5 rounded-[28px] font-black text-base shadow-xl shadow-amber-500/30 hover:bg-amber-600 transition-all flex items-center gap-4"
                                >
                                    {submitting ? 'SUBMITTING...' : 'FINALIZE & SUBMIT'}
                                    <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                                </button>
                            </div>
                        </div>
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
