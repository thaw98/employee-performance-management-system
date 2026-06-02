import React, { useState, useEffect } from 'react';
import axios from '../../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { 
    MessageSquare, 
    User, 
    Star, 
    Send, 
    ChevronRight, 
    ChevronLeft,
    CheckCircle2,
    Info,
    AlertCircle
} from 'lucide-react';

interface Employee {
    id: number;
    name: string;
    department: string;
    position: string;
}

interface Criteria {
    id: number;
    name: string;
    description: string;
    active: boolean;
}

interface FeedbackScore {
    criteriaId: number;
    rating: number;
    comment: string;
}

export function GiveFeedbackPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [criteria, setCriteria] = useState<Criteria[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [scores, setScores] = useState<Record<number, FeedbackScore>>({});
    const [generalComment, setGeneralComment] = useState('');

    useEffect(() => {
        fetchEmployees();
        fetchCriteria();
    }, []);

    const fetchEmployees = async () => {
        try {
            const resp = await axios.get('/employees');
            setEmployees(resp.data.data || []);
        } catch (err) {
            toast.error('Failed to load colleagues');
        }
    };

    const fetchCriteria = async () => {
        try {
            const resp = await axios.get('/criteria');
            const data = resp.data.data || [];
            if (Array.isArray(data)) {
                setCriteria(data.filter((c: any) => c.active));
            } else {
                setCriteria([]);
            }
        } catch (err) {
            toast.error('Failed to load evaluation criteria');
        }
    };

    const handleRatingChange = (criteriaId: number, rating: number) => {
        setScores(prev => ({
            ...prev,
            [criteriaId]: {
                ...prev[criteriaId],
                criteriaId,
                rating
            }
        }));
    };

    const handleCommentChange = (criteriaId: number, comment: string) => {
        setScores(prev => ({
            ...prev,
            [criteriaId]: {
                ...prev[criteriaId],
                criteriaId,
                comment
            }
        }));
    };

    const handleSubmit = async () => {
        if (!selectedEmployeeId) return;
        
        // Basic validation
        const incomplete = criteria.some(c => !scores[c.id]?.rating);
        if (incomplete) {
            toast.error('Please provide a rating for all criteria');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                targetEmployeeId: selectedEmployeeId,
                scores: Object.values(scores),
                overallComment: generalComment
            };
            
            // Simulating API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('Feedback submitted:', payload);
            
            toast.success('Feedback submitted successfully!');
            setStep(3); // Success step
        } catch (err) {
            toast.error('Failed to submit feedback');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                        <MessageSquare size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-800 uppercase">Give 360 Feedback</h1>
                        <p className="text-slate-500 font-medium mt-1">Provide anonymous and constructive feedback to your colleagues.</p>
                    </div>
                </div>
                
                {/* Stepper info */}
                <div className="hidden md:flex items-center gap-3">
                    {[1, 2].map((s) => (
                        <div 
                            key={s} 
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all ${
                                step === s ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-110' : 
                                step > s ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                            }`}
                        >
                            {step > s ? <CheckCircle2 size={20} /> : s}
                        </div>
                    ))}
                </div>
            </div>

            {step === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <User className="text-emerald-600" size={24} />
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Select Colleague</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {employees.map((emp) => (
                                    <button
                                        key={emp.id}
                                        onClick={() => setSelectedEmployeeId(emp.id)}
                                        className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                                            selectedEmployeeId === emp.id 
                                            ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-4 ring-emerald-50' 
                                            : 'border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white'
                                        }`}
                                    >
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-slate-400 shadow-sm">
                                            {emp.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{emp.name}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{emp.department} • {emp.position}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-emerald-50 p-8 rounded-[32px] text-slate-800 border border-emerald-100 shadow-xl shadow-emerald-100/50 space-y-6">
                            <Info size={32} className="text-emerald-600" />
                            <h3 className="text-xl font-black leading-tight">Why Feedback Matters?</h3>
                            <p className="text-slate-600 text-sm leading-relaxed font-medium">
                                Peer feedback is essential for personal and professional growth. Your honest input helps colleagues identify their strengths and areas for improvement.
                            </p>
                            <div className="pt-4 border-t border-emerald-100 space-y-3">
                                <div className="flex items-center gap-3 text-xs font-bold text-emerald-800">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full" /> 
                                    Anonymous responses
                                </div>
                                <div className="flex items-center gap-3 text-xs font-bold text-emerald-800">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full" /> 
                                    Constructive criticism
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={!selectedEmployeeId}
                            onClick={() => setStep(2)}
                            className="w-full py-5 bg-white border-2 border-slate-200 text-slate-800 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-50 transition-all disabled:opacity-50 group shadow-sm active:scale-95"
                        >
                            PROCEED TO FORM <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                    {/* Selected Colleague Summary Bar */}
                    <div className="bg-emerald-50 p-6 rounded-3xl text-slate-800 border border-emerald-100 flex items-center justify-between shadow-lg shadow-emerald-100/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-bold text-emerald-700 shadow-sm">
                                {selectedEmployee?.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Evaluating</p>
                                <h4 className="font-bold text-lg leading-none mt-1">{selectedEmployee?.name}</h4>
                            </div>
                        </div>
                        <button onClick={() => setStep(1)} className="text-xs font-black bg-white px-4 py-2 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-all uppercase tracking-widest shadow-sm">Change Colleague</button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-3 space-y-6">
                            {criteria.map((c, idx) => (
                                <div key={c.id} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6 group hover:border-emerald-200 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                {idx + 1}
                                            </span>
                                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{c.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onClick={() => handleRatingChange(c.id, star)}
                                                    className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${
                                                        (scores[c.id]?.rating || 0) >= star 
                                                        ? 'text-yellow-400 bg-yellow-50' 
                                                        : 'text-slate-200 bg-slate-50 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    <Star size={20} fill={(scores[c.id]?.rating || 0) >= star ? "currentColor" : "none"} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <p className="text-slate-500 font-medium text-sm leading-relaxed pl-11">{c.description}</p>
                                    
                                    <div className="pl-11">
                                        <textarea
                                            placeholder="Add specific comments or examples for this criteria..."
                                            value={scores[c.id]?.comment || ''}
                                            onChange={(e) => handleCommentChange(c.id, e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-all h-28"
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                                    <AlertCircle className="text-emerald-600" size={24} />
                                    General Recommendation
                                </h3>
                                <textarea
                                    placeholder="Any other comments or summary of this colleague's performance..."
                                    value={generalComment}
                                    onChange={(e) => setGeneralComment(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-5 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-all h-40"
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm sticky top-8">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Form Progress</h4>
                                <div className="space-y-4">
                                    {criteria.map((c) => (
                                        <div key={c.id} className="flex items-center gap-3">
                                            <div className={`w-2.5 h-2.5 rounded-full transition-all ${scores[c.id]?.rating ? 'bg-emerald-500 shadow-sm scale-110' : 'bg-slate-200'}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-tight ${scores[c.id]?.rating ? 'text-slate-800' : 'text-slate-400'}`}>
                                                {c.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="mt-10 space-y-4">
                                    <button 
                                        disabled={isSubmitting}
                                        onClick={handleSubmit}
                                        className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'SUBMITTING...' : 'SUBMIT FEEDBACK'}
                                        {!isSubmitting && <Send size={18} />}
                                    </button>
                                    <button 
                                        onClick={() => setStep(1)}
                                        className="w-full py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-800 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ChevronLeft size={16} /> Back
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="bg-white p-20 rounded-[48px] border border-slate-100 shadow-2xl text-center space-y-8 animate-in zoom-in-95 duration-500 max-w-2xl mx-auto">
                    <div className="w-24 h-24 bg-emerald-50 rounded-[32px] flex items-center justify-center text-emerald-500 mx-auto animate-bounce shadow-inner">
                        <CheckCircle2 size={56} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Feedback Submitted!</h2>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed">
                            Thank you for sharing your thoughts. Your feedback for <span className="text-emerald-600 font-bold">{selectedEmployee?.name}</span> has been securely recorded and remains completely anonymous.
                        </p>
                    </div>
                    <div className="pt-6 grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => { setStep(1); setSelectedEmployeeId(null); setScores({}); setGeneralComment(''); }}
                            className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black text-sm hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 uppercase"
                        >
                            Give More Feedback
                        </button>
                        <button 
                            onClick={() => window.location.href = '/hr/dashboard'}
                            className="w-full py-5 bg-slate-100 text-slate-500 rounded-[24px] font-black text-sm hover:bg-slate-200 transition-all uppercase"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
