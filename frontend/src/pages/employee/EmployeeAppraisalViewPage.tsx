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
    Lock,
    Award,
    TrendingUp,
    Download
} from 'lucide-react';
import { resolveMediaSrc } from '../../utils/mediaUrl';
import { exportAppraisalPdf } from '../../utils/exportAppraisalPdf';

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
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPdf = async () => {
        if (!assignment) return;
        try {
            setIsExporting(true);
            await exportAppraisalPdf(assignment as any);
            toast.success('PDF report exported successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to export PDF report');
        } finally {
            setIsExporting(false);
        }
    };

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
            {/* Helper for Category Colors */}
            {(() => {
                const getCategoryStyle = (cat: string) => {
                    const c = (cat || '').toUpperCase();
                    if (c.includes('EXCELLENT') || c.includes('OUTSTANDING')) return 'from-emerald-500 to-teal-600 text-white border-emerald-400/30';
                    if (c.includes('GOOD') || c.includes('ABOVE')) return 'from-blue-500 to-indigo-600 text-white border-blue-400/30';
                    if (c.includes('AVERAGE') || c.includes('SATISFACTORY')) return 'from-amber-500 to-orange-600 text-white border-amber-400/30';
                    return 'from-slate-500 to-slate-700 text-white border-slate-400/30';
                };
                return null;
            })()}
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
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportPdf}
                        disabled={isExporting}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-emerald-500/10 transition-all active:scale-95 disabled:scale-100 cursor-pointer disabled:cursor-not-allowed"
                    >
                        {isExporting ? (
                            <>
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download size={14} /> Export PDF
                            </>
                        )}
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                        <Lock size={14} /> Finalized Report
                    </div>
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
                        <div className="bg-slate-900 text-white p-8 rounded-[32px] text-center min-w-[200px] shadow-2xl shadow-emerald-900/20 relative group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1 relative z-10">Final Assessment</p>
                            <div className="text-5xl font-black italic relative z-10 mb-2">{assignment.totalScore?.toFixed(1)}<span className="text-xl ml-1 opacity-50">%</span></div>
                            <div className={`mt-2 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border shadow-lg flex items-center justify-center gap-2 relative z-10 bg-gradient-to-r ${
                                (assignment.ratingCategory || '').toUpperCase().includes('EXCELLENT') ? 'from-emerald-500 to-teal-600 border-emerald-400' :
                                (assignment.ratingCategory || '').toUpperCase().includes('GOOD') ? 'from-blue-500 to-indigo-600 border-blue-400' :
                                (assignment.ratingCategory || '').toUpperCase().includes('AVERAGE') ? 'from-amber-500 to-orange-600 border-amber-400' :
                                'from-slate-600 to-slate-800 border-slate-500'
                            }`}>
                                <Award size={14} />
                                {assignment.ratingCategory || 'PENDING'}
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
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manager Signature</span>
                                <span className="text-[9px] text-slate-300 font-medium">{assignment.managerSignedAt ? new Date(assignment.managerSignedAt).toLocaleDateString() : ''}</span>
                            </div>
                            <div className="h-14 w-40 bg-white rounded-2xl p-2 flex items-center justify-center border border-slate-100 shadow-inner">
                                {assignment.managerSignature ? (
                                    <img src={resolveMediaSrc(assignment.managerSignature)} alt="Manager Signature" className="h-full object-contain opacity-90" />
                                ) : (
                                    <span className="font-signature text-slate-400 text-lg">Signed</span>
                                )}
                            </div>
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
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">HR Representative</span>
                                <span className="text-[9px] text-emerald-500/60 font-medium">{assignment.hrSignedAt ? new Date(assignment.hrSignedAt).toLocaleDateString() : ''}</span>
                            </div>
                            <div className="h-14 w-40 bg-white/10 rounded-2xl p-2 flex items-center justify-center border border-white/10 shadow-inner">
                                {assignment.hrSignature ? (
                                    <img src={resolveMediaSrc(assignment.hrSignature)} alt="HR Signature" className="h-full object-contain brightness-0 invert opacity-90" />
                                ) : (
                                    <span className="text-emerald-500/40 font-bold text-xs uppercase tracking-tighter italic">Verified by HR</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
                .font-signature {
                    font-family: 'Dancing Script', cursive;
                }
            `}} />
        </div>
    );
}
