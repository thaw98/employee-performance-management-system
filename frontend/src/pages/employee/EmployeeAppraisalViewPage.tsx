import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { 
    ChevronLeft, 
    MessageSquare, 
    CheckCircle2, 
    User, 
    ShieldCheck,
    Building2,
    Calendar,
    Lock
} from 'lucide-react';

interface Question {
    id: number;
    questionText: string;
    answerType: string;
    isRequired: boolean;
}

interface Category {
    id: number;
    name: string;
    description: string;
    questions: Question[];
}

interface Assignment {
    id: number;
    status: string;
    totalScore: number;
    ratingCategory: string;
    managerComments: string;
    managerSignature: string;
    managerSignedAt: string;
    hrComments: string;
    hrSignature: string;
    hrSignedAt: string;
    employee: {
        employeeName: string;
        fullName?: string;
        employeeId: string;
        department?: { name: string; departmentName: string };
        position?: { name: string; positionName: string };
    };
    template: {
        name: string;
        maxRating: number;
        categories: Category[];
    };
    answers: {
        question: { id: number };
        rating: number;
        comments: string;
    }[];
}

export function EmployeeAppraisalViewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`/appraisal-assignments/${id}/form`);
            setAssignment(response.data.data);
        } catch (error) {
            toast.error('Failed to load appraisal report');
            navigate('/employee/dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">Loading report...</p>
            </div>
        );
    }

    if (!assignment) return null;

    const empName = assignment.employee?.employeeName || assignment.employee?.fullName || 'Employee';
    const deptName = assignment.employee?.department?.departmentName || assignment.employee?.department?.name || 'N/A';
    const posName = (assignment.employee as any)?.position?.positionName || (assignment.employee as any)?.position?.name || 'N/A';

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => navigate(-1)}
                    className="group flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors font-bold text-sm"
                >
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-all">
                        <ChevronLeft size={18} />
                    </div>
                    Back to List
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                    <Lock size={14} /> Finalized Report
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-5" />
                <div className="p-10 pt-16 relative">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-32 h-32 bg-emerald-50 rounded-[40px] border-4 border-white shadow-xl flex items-center justify-center text-emerald-600 font-black text-4xl">
                            {empName.charAt(0)}
                        </div>
                        <div className="flex-1 text-center md:text-left space-y-2">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{empName}</h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                    <Building2 size={16} className="text-emerald-500" /> {deptName}
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                    <User size={16} className="text-emerald-500" /> {posName}
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                    <Calendar size={16} className="text-emerald-500" /> {assignment.template?.name}
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-900 text-white p-8 rounded-[32px] text-center min-w-[180px] shadow-2xl shadow-emerald-900/20">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Performance Rate</p>
                            <div className="text-4xl font-black italic">{assignment.totalScore?.toFixed(1)}%</div>
                            <div className="mt-2 px-3 py-1 bg-emerald-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/30">
                                {assignment.ratingCategory}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Evaluation Content */}
            <div className="space-y-6">
                {assignment.template?.categories?.map((category) => (
                    <div key={category.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">{category.name}</h3>
                            <span className="text-[10px] font-bold text-slate-400 italic">{category.description}</span>
                        </div>
                        <div className="p-8 space-y-10">
                            {category.questions?.map((question) => {
                                const answer = assignment.answers?.find(a => a.question.id === question.id);
                                return (
                                    <div key={question.id} className="space-y-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex-1 space-y-2">
                                                <h4 className="text-base font-bold text-slate-800 leading-relaxed">{question.questionText}</h4>
                                            </div>

                                            <div className="flex gap-2">
                                                {[...Array(assignment.template?.maxRating || 5)].map((_, i) => {
                                                    const val = i + 1;
                                                    const isSelected = answer?.rating === val;
                                                    return (
                                                        <div 
                                                            key={val}
                                                            className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black border-2 transition-all ${
                                                                isSelected 
                                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/30' 
                                                                : 'bg-white border-slate-100 text-slate-200'
                                                            }`}
                                                        >
                                                            {val}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {answer?.comments && (
                                            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <MessageSquare size={16} className="text-slate-400 mt-1" />
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manager's Comment</p>
                                                    <p className="text-sm text-slate-700 italic">"{answer.comments}"</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Final Signatures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Manager Signature */}
                <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                            <ShieldCheck size={20} />
                        </div>
                        <h3 className="text-lg font-black text-slate-800">Evaluator Review</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 min-h-[100px]">
                            <p className="text-sm text-slate-600 italic">"{assignment.managerComments || 'No summary comments provided.'}"</p>
                        </div>
                        <div className="flex items-center justify-between pt-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manager Signature</span>
                                <span className="text-xs font-bold text-slate-700 mt-1">{assignment.evaluator?.employeeName}</span>
                            </div>
                            {assignment.managerSignature && (
                                <img src={assignment.managerSignature} alt="Manager Signature" className="h-12 object-contain opacity-80" />
                            )}
                        </div>
                    </div>
                </div>

                {/* HR Approval */}
                <div className="bg-[#111827] p-10 rounded-[40px] border border-slate-800 shadow-2xl space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                            <CheckCircle2 size={20} />
                        </div>
                        <h3 className="text-lg font-black text-white">HR Validation</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 min-h-[100px]">
                            <p className="text-sm text-slate-300 italic">"{assignment.hrComments || 'Form validated and approved by HR.'}"</p>
                        </div>
                        <div className="flex items-center justify-between pt-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">HR Representative</span>
                                <span className="text-xs font-bold text-emerald-500 mt-1 italic uppercase tracking-tighter">Verified & Approved</span>
                            </div>
                            {assignment.hrSignature && (
                                <img src={assignment.hrSignature} alt="HR Signature" className="h-12 object-contain invert opacity-80" />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
