import React, { useState, useEffect } from 'react';
import axios from '../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { 
    User, 
    Briefcase, 
    Building, 
    Calendar, 
    CheckCircle2, 
    ChevronRight, 
    ChevronLeft, 
    Send,
    Star
} from 'lucide-react';

const PRIMARY = '#0855BF';

interface Criteria {
    id: number;
    name: string;
    description: string;
}

interface Evaluatee {
    id: number;
    name: string;
    staffNo: string;
    position: string;
    department: string;
}

export function GiveFeedbackPage() {
    const [evaluator, setEvaluator] = useState<any>(null);
    const [evaluatees, setEvaluatees] = useState<Evaluatee[]>([]);
    const [selectedEvaluatee, setSelectedEvaluatee] = useState<Evaluatee | null>(null);
    const [criteriaList, setCriteriaList] = useState<Criteria[]>([]);
    const [role, setRole] = useState<'MANAGER' | 'PEER' | 'SUBORDINATE'>('PEER');
    const [currentPage, setCurrentPage] = useState(1);
    
    // Form state: criteriaId -> { rating, comment }
    const [ratings, setRatings] = useState<Record<number, number>>({});
    const [comments, setComments] = useState<Record<number, string>>({});

    useEffect(() => {
        fetchEvaluatorInfo();
        fetchCriteria();
    }, []);

    useEffect(() => {
        if (role) {
            fetchEligibleEvaluatees(role);
        }
    }, [role]);

    const fetchEvaluatorInfo = async () => {
        try {
            const resp = await axios.get('/feedback/evaluator-info');
            if (resp.data.success) {
                setEvaluator(resp.data.data);
            } else {
                toast.error(resp.data.message || 'Failed to load evaluator info');
            }
        } catch (err: any) {
            console.error('Evaluator Info Error:', err);
            toast.error(err.response?.data?.message || 'Connection error while loading evaluator info');
        }
    };

    const fetchCriteria = async () => {
        try {
            const resp = await axios.get('/criteria');
            if (resp.data.success) {
                setCriteriaList(resp.data.data.filter((c: any) => c.active));
            }
        } catch (err) {
            console.error('Criteria Load Error:', err);
            toast.error('Could not load assessment criteria');
        }
    };

    const fetchEligibleEvaluatees = async (targetRole: string) => {
        try {
            const resp = await axios.get(`/feedback/eligible-evaluatees?role=${targetRole}`);
            if (resp.data.success) {
                const list = resp.data.data || [];
                setEvaluatees(list);
                
                if (targetRole === 'PEER' && list.length > 0) {
                    const randomPeer = list[Math.floor(Math.random() * list.length)];
                    setSelectedEvaluatee(randomPeer);
                } else {
                    setSelectedEvaluatee(null);
                }
            }
        } catch (err: any) {
            console.error('Eligible Load Error:', err);
            toast.error(err.response?.data?.message || 'Error fetching eligible employees');
        }
    };

    const criteriaPerPage = Math.ceil(criteriaList.length / 3);
    const paginatedCriteria = criteriaList.slice(
        (currentPage - 1) * criteriaPerPage,
        currentPage * criteriaPerPage
    );

    const isAllRatedOnCurrentPage = paginatedCriteria.every(c => ratings[c.id]);
    const isAllRatedTotal = criteriaList.every(c => ratings[c.id]);

    const handleSubmit = async () => {
        if (!selectedEvaluatee) return toast.error('Please select an employee');
        if (!isAllRatedTotal) return toast.error('Please rate all criteria');

        try {
            const payload = {
                evaluateeId: selectedEvaluatee.id,
                role: role,
                details: criteriaList.map(c => ({
                    criteriaId: c.id,
                    rating: ratings[c.id],
                    comment: comments[c.id] || ''
                }))
            };
            await axios.post('/feedback', payload);
            toast.success('Feedback submitted successfully!');
            // Reset form or redirect
            window.location.reload(); 
        } catch (err) {
            toast.error('Failed to submit feedback');
        }
    };

    const calculateLiveScore = () => {
        const totalPoints = Object.values(ratings).reduce((a, b) => a + b, 0);
        const questionCount = criteriaList.length;
        if (questionCount === 0) return { score: 0, remark: 'N/A' };
        
        const score = (totalPoints * 100) / (questionCount * 5);
        let remark = '';
        if (score >= 86) remark = 'Outstanding';
        else if (score >= 71) remark = 'Good';
        else if (score >= 60) remark = 'Meet Requirement';
        else if (score >= 40) remark = 'Need Improvement';
        else remark = 'Unsatisfactory';

        return { score, remark };
    };

    const liveResult = calculateLiveScore();

    const getLiveRemarkColor = (remark: string) => {
        switch (remark) {
            case 'Outstanding': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'Good': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'Meet Requirement': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'Need Improvement': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'Unsatisfactory': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-slate-400 bg-slate-50 border-slate-100';
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-8 animate-in fade-in duration-500">
            {/* Header / Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                {/* Evaluator Card */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
                        <CheckCircle2 size={16} /> Evaluator Information
                    </h3>
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                        <div className="flex items-center gap-3 text-slate-700">
                            <User size={18} className="text-slate-400" />
                            <span className="font-bold">{evaluator?.name || 'Loading...'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 text-sm">
                            <Briefcase size={18} className="text-slate-400" />
                            <span>{evaluator?.position}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 text-sm">
                            <Building size={18} className="text-slate-400" />
                            <span>{evaluator?.department}</span>
                        </div>
                    </div>
                </div>

                {/* Evaluatee Card */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
                        <Star size={16} /> Evaluatee Information
                    </h3>
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
                        {evaluatees.length > 0 ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Employee</label>
                                    <select 
                                        value={selectedEvaluatee?.id || ''}
                                        onChange={(e) => setSelectedEvaluatee(evaluatees.find(ev => ev.id === Number(e.target.value)) || null)}
                                        className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                                    >
                                        <option value="">Choose employee...</option>
                                        {evaluatees.map(ev => (
                                            <option key={ev.id} value={ev.id}>{ev.name} ({ev.staffNo})</option>
                                        ))}
                                    </select>
                                </div>
                                {selectedEvaluatee && (
                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-blue-100 mt-2">
                                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Level: <span className="text-blue-700">{selectedEvaluatee.position}</span></div>
                                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Dept: <span className="text-blue-700">{selectedEvaluatee.department}</span></div>
                                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1">
                                            <Calendar size={12} /> Today: {evaluator?.date}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-8 text-center text-slate-400 font-bold italic text-sm">
                                No eligible employees found for this role in your department.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Role Selection Tabs */}
            <div className="flex justify-center">
                <div className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm flex gap-2">
                    {(['PEER', 'MANAGER', 'SUBORDINATE'] as const).map(r => (
                        <button
                            key={r}
                            onClick={() => { setRole(r); setCurrentPage(1); }}
                            className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${role === r ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Pagination Progress */}
            <div className="flex items-center justify-center gap-4">
                {[1, 2, 3].map(p => (
                    <div key={p} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${p === currentPage ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-lg' : p < currentPage ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                            {p}
                        </div>
                        {p < 3 && <div className={`w-12 h-1 rounded-full ${p < currentPage ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                    </div>
                ))}
            </div>

            {/* Feedback Form Content */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8 space-y-10">
                    {paginatedCriteria.map(criteria => (
                        <div key={criteria.id} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <h4 className="text-lg font-black text-slate-800">{criteria.name}</h4>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{criteria.description}</p>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                    {[1, 2, 3, 4, 5].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => setRatings(prev => ({ ...prev, [criteria.id]: num }))}
                                            className={`w-12 h-12 rounded-xl text-lg font-black transition-all flex items-center justify-center ${ratings[criteria.id] === num ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-blue-200 hover:text-blue-500'}`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex-1 min-w-[300px]">
                                    <textarea
                                        placeholder="Add specific comments or observations..."
                                        value={comments[criteria.id] || ''}
                                        onChange={(e) => setComments(prev => ({ ...prev, [criteria.id]: e.target.value }))}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all h-20 resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Final Page Summary removed as requested */}
                </div>

                {/* Score & Navigation Footer */}
                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all"
                        >
                            <ChevronLeft size={18} /> PREVIOUS
                        </button>

                        {/* Live Score Preview */}
                        {Object.keys(ratings).length > 0 && (
                            <div className={`px-6 py-3 rounded-2xl border-2 flex items-center gap-4 transition-all animate-in zoom-in duration-300 ${getLiveRemarkColor(liveResult.remark)}`}>
                                <div className="text-center">
                                    <div className="text-[10px] font-black uppercase opacity-60">Live Score</div>
                                    <div className="text-xl font-black leading-tight">{liveResult.score.toFixed(1)}%</div>
                                </div>
                                <div className="w-px h-8 bg-current opacity-20" />
                                <div className="text-center">
                                    <div className="text-[10px] font-black uppercase opacity-60">Projected Remark</div>
                                    <div className="text-xs font-black uppercase tracking-widest">{liveResult.remark}</div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {currentPage < 3 ? (
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(3, prev + 1))}
                                disabled={!isAllRatedOnCurrentPage}
                                className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                            >
                                NEXT PAGE <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={!isAllRatedTotal}
                                className="flex items-center gap-3 px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50"
                            >
                                <Send size={20} /> SUBMIT FEEDBACK
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
