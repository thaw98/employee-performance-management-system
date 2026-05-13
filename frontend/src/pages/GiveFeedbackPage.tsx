import { useState, useEffect } from 'react';
import axios from '../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { 
    User, 
    Briefcase, 
    Building, 
    CheckCircle2, 
    Calendar,
    ChevronRight, 
    Send,
    Star,
    EyeOff,
    UserCheck
} from 'lucide-react';

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
    profilePictureUrl?: string;
    given: boolean;
    statusText: string;
}

export function GiveFeedbackPage() {
    const [evaluator, setEvaluator] = useState<any>(null);
    const [evaluatees, setEvaluatees] = useState<Evaluatee[]>([]);
    const [selectedEvaluatee, setSelectedEvaluatee] = useState<Evaluatee | null>(null);
    const [criteriaList, setCriteriaList] = useState<Criteria[]>([]);
    const [role, setRole] = useState<'MANAGER' | 'PEER' | 'SUBORDINATE'>('PEER');
    const [ratings, setRatings] = useState<Record<number, number>>({});
    const [comments, setComments] = useState<Record<number, string>>({});
    const [roleFeedbackCount, setRoleFeedbackCount] = useState(0);
    const [roleFeedbackLimit, setRoleFeedbackLimit] = useState(5);
    const [noEligibleRemaining, setNoEligibleRemaining] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [activeCycle, setActiveCycle] = useState<any>(null);

    useEffect(() => {
        fetchEvaluatorInfo();
        fetchCriteria();
        fetchActiveCycle();
    }, []);

    useEffect(() => {
        if (role) {
            setRatings({}); // Clear ratings when role changes
            setComments({});
            setIsAnonymous(false);
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

    const fetchActiveCycle = async () => {
        try {
            const resp = await axios.get('/review-cycles/active');
            const cycles = resp.data.data || [];
            const submissionCycle = cycles.find((cycle: any) => cycle.requiresEmployeeSubmission) || cycles[0];
            setActiveCycle(submissionCycle || null);
        } catch (err) {
            console.error('Active review cycle load error:', err);
        }
    };

    const formatDeadline = (value?: string) => {
        if (!value) return 'Not set';
        const date = new Date(`${value}T00:00:00`);
        return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const fetchEligibleEvaluatees = async (targetRole: string) => {
        try {
            const resp = await axios.get(`/feedback/eligible-evaluatees?role=${targetRole}`);
            if (resp.data.success) {
                const data = resp.data.data;
                const list = data.evaluatees || [];
                setEvaluatees(list);
                setRoleFeedbackCount(data.roleFeedbackCount);
                setRoleFeedbackLimit(data.roleFeedbackLimit);
                
                const available = list.filter((e: any) => !e.given);
                setNoEligibleRemaining(available.length === 0);

                if (targetRole === 'PEER' && available.length > 0) {
                    // Random Selection Logic
                    const randomIndex = Math.floor(Math.random() * available.length);
                    setSelectedEvaluatee(available[randomIndex]);
                } else {
                    setSelectedEvaluatee(null);
                }
            }
        } catch (err: any) {
            console.error('Eligible Load Error:', err);
            toast.error(err.response?.data?.message || 'Error fetching eligible employees');
        }
    };

    const isAllRatedTotal = criteriaList.every(c => ratings[c.id]);

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedEvaluatee) return toast.error('Please select an employee');
        if (!isAllRatedTotal) return toast.error('Please rate all criteria');

        try {
            setIsSubmitting(true);
            const payload = {
                evaluateeId: selectedEvaluatee.id,
                role: role,
                anonymous: role === 'SUBORDINATE' ? isAnonymous : true,
                details: criteriaList.map(c => ({
                    criteriaId: c.id,
                    rating: ratings[c.id],
                    comment: comments[c.id] || ''
                }))
            };
            await axios.post('/feedback', payload);
            setShowSuccessModal(true);
        } catch (err) {
            toast.error('Failed to submit feedback');
        } finally {
            setIsSubmitting(false);
        }
    };

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [evaluatorImgError, setEvaluatorImgError] = useState(false);
    const [evaluateeImgErrors, setEvaluateeImgErrors] = useState<Record<number, boolean>>({});

    const isLimitReached = roleFeedbackCount >= roleFeedbackLimit;
    const isFormHidden = isLimitReached || noEligibleRemaining;

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
            {/* Limit Progress Indicator */}
            <div className="bg-white px-8 py-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isLimitReached ? 'bg-red-500' : 'bg-blue-500 animate-pulse'}`} />
                    <span className="text-xs font-black uppercase text-slate-500 tracking-widest">
                        {role} Feedback Progress:
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-xs font-black text-slate-800 tracking-widest">
                        {roleFeedbackCount} / {roleFeedbackLimit} COMPLETED
                    </div>
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div 
                            className={`h-full transition-all duration-1000 ${isLimitReached ? 'bg-red-500' : 'bg-blue-600'}`}
                            style={{ width: `${(roleFeedbackCount / roleFeedbackLimit) * 100}%` }}
                        />
                    </div>
                </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-3xl px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white text-amber-600 flex items-center justify-center shadow-sm">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Current Review Cycle Deadline</p>
                        <h2 className="text-lg font-black text-slate-900">
                            {activeCycle?.name ? `${activeCycle.name}: ` : ''}{formatDeadline(activeCycle?.endDate)}
                        </h2>
                    </div>
                </div>
                <p className="text-xs font-bold text-amber-800 max-w-md">
                    Feedback for this cycle must be submitted before the deadline ends.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {/* Evaluator Card */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-full">
                    <h3 className="text-xs font-black uppercase text-blue-600 tracking-widest flex items-center gap-2 mb-6">
                        <CheckCircle2 size={16} /> Evaluator Information
                    </h3>
                    <div className="p-5 bg-slate-50 rounded-3xl space-y-4 flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-4">
                            {evaluator?.profilePictureUrl && !evaluatorImgError ? (
                                <img 
                                    src={evaluator.profilePictureUrl} 
                                    alt="" 
                                    onError={() => setEvaluatorImgError(true)}
                                    className="w-14 h-14 rounded-full object-cover border-4 border-white shadow-md" 
                                />
                            ) : (
                                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-lg shadow-inner">
                                   {evaluator?.name?.charAt(0) || <User size={24} />}
                                </div>
                            )}
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Employee Name</p>
                                <p className="text-lg font-black text-slate-800 leading-tight">{evaluator?.name || 'Loading...'}</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200/60">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                                    <Briefcase size={10} /> Position
                                </p>
                                <p className="text-xs font-bold text-slate-600">{evaluator?.position || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                                    <Building size={10} /> Department
                                </p>
                                <p className="text-xs font-bold text-slate-600">{evaluator?.department || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Evaluatee Selection Dropdown - Custom UI */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-full relative">
                    <h3 className="text-xs font-black uppercase text-blue-600 tracking-widest flex items-center gap-2 mb-6">
                        <Star size={16} /> Evaluatee Selection
                    </h3>

                    <div className="flex-1 flex flex-col gap-4">
                        <div className="relative">
                            <button 
                                onClick={() => { if (role !== 'PEER') setIsDropdownOpen(!isDropdownOpen); }}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                                    role === 'PEER' ? 'cursor-default border-slate-100 bg-slate-50/50' : 
                                    isDropdownOpen ? 'border-blue-600 ring-4 ring-blue-50 bg-white' : 'border-slate-100 bg-white hover:border-blue-200 font-bold'
                                }`}
                            >
                                {selectedEvaluatee ? (
                                    <div className="flex items-center gap-3">
                                {selectedEvaluatee.profilePictureUrl && !evaluateeImgErrors[selectedEvaluatee.id] ? (
                                    <img 
                                        src={selectedEvaluatee.profilePictureUrl} 
                                        alt="" 
                                        onError={() => setEvaluateeImgErrors(prev => ({ ...prev, [selectedEvaluatee.id]: true }))}
                                        className="w-8 h-8 rounded-full object-cover border border-white shadow-sm" 
                                    />
                                ) : (
                                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-[10px]">
                                        {selectedEvaluatee.name.charAt(0)}
                                    </div>
                                )}
                                        <div className="text-left">
                                            <p className="text-xs font-black text-blue-700">{selectedEvaluatee.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400">#{selectedEvaluatee.staffNo}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <User size={20} />
                                        <span className="text-sm font-bold italic">
                                            {role === 'PEER' ? 'Allocating random peer...' : 'Click to select employee...'}
                                        </span>
                                    </div>
                                )}
                                {role !== 'PEER' && <ChevronRight className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-90' : ''}`} />}
                            </button>
                            
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl z-50 p-4 animate-in slide-in-from-top-4 duration-300">
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                        {evaluatees.length > 0 ? (
                                            evaluatees.map(ev => (
                                                <button
                                                    key={ev.id}
                                                    onClick={() => {
                                                        if (!ev.given) {
                                                            setSelectedEvaluatee(ev);
                                                            setIsDropdownOpen(false);
                                                        }
                                                    }}
                                                    disabled={ev.given}
                                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${
                                                        selectedEvaluatee?.id === ev.id 
                                                            ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-100' 
                                                            : ev.given 
                                                                ? 'border-slate-50 bg-slate-50/50 opacity-60 cursor-not-allowed' 
                                                                : 'border-slate-50 hover:border-blue-200 hover:bg-blue-50/20'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {ev.profilePictureUrl && !evaluateeImgErrors[ev.id] ? (
                                                            <img 
                                                                src={ev.profilePictureUrl} 
                                                                alt="" 
                                                                onError={() => setEvaluateeImgErrors(prev => ({ ...prev, [ev.id]: true }))}
                                                                className="w-8 h-8 rounded-full object-cover border border-white shadow-sm" 
                                                            />
                                                        ) : (
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] ${
                                                                selectedEvaluatee?.id === ev.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                                                            }`}>
                                                                {ev.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <div className="text-left">
                                                            <p className={`text-xs font-black ${selectedEvaluatee?.id === ev.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                                                {ev.name}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-slate-400">#{ev.staffNo}</p>
                                                        </div>
                                                    </div>

                                                    {ev.given ? (
                                                        <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                                                            <CheckCircle2 size={10} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Completed</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
                                                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Incomplete</span>
                                                        </div>
                                                    )}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-slate-400 font-bold italic text-xs bg-slate-50 rounded-2xl">
                                                No eligible employees found.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedEvaluatee && (
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-3 animate-in fade-in duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                                            <Briefcase size={10} /> Position
                                        </p>
                                        <p className="text-xs font-bold text-blue-800">{selectedEvaluatee.position}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                                            <Building size={10} /> Department
                                        </p>
                                        <p className="text-xs font-bold text-blue-800">{selectedEvaluatee.department}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {!selectedEvaluatee && (
                            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl p-4 text-center">
                                <p className="text-xs font-bold text-slate-300">Select an employee to view details</p>
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
                            onClick={() => { setRole(r); }}
                            className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${role === r ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Single Page Form */}


            {/* Feedback Content / Limit State */}
            {isFormHidden ? (
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl p-20 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center shadow-inner">
                        <CheckCircle2 size={48} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">All Feedbacks Given</h2>
                        <p className="text-slate-500 font-bold max-w-sm mx-auto leading-relaxed">
                            {isLimitReached 
                                ? `You have reached the maximum limit of ${roleFeedbackLimit} feedbacks for the ${role} role in this cycle.`
                                : `There are no remaining eligible employees to evaluate for the ${role} role at this time.`}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-8 space-y-10">
                        {criteriaList.map(criteria => (
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

                        {role === 'SUBORDINATE' && (
                            <div className="rounded-2xl border-2 border-slate-100 bg-slate-50/70 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isAnonymous ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {isAnonymous ? <EyeOff size={22} /> : <UserCheck size={22} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                            {isAnonymous ? 'Submit anonymously' : 'Show my name'}
                                        </p>
                                        <p className="text-xs font-bold text-slate-400">
                                            {isAnonymous
                                                ? 'Your subordinate will see this feedback as Anonymous.'
                                                : 'Your subordinate will see your name as the evaluator.'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={isAnonymous}
                                    onClick={() => setIsAnonymous(prev => !prev)}
                                    className={`relative h-8 w-16 rounded-full border-2 transition-all ${isAnonymous ? 'bg-blue-500 border-blue-500' : 'bg-slate-200 border-slate-200'}`}
                                >
                                    <span
                                        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${isAnonymous ? 'left-[34px]' : 'left-0.5'}`}
                                    />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
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
                            <button
                                onClick={() => {
                                    setRatings({});
                                    setComments({});
                                    toast.success('Form cleared');
                                }}
                                className="px-8 py-5 bg-white border-2 border-slate-200 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-50 hover:text-slate-800 transition-all"
                            >
                                RESET CHOICE
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!isAllRatedTotal || isSubmitting || !selectedEvaluatee}
                                className="flex items-center gap-3 px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50"
                            >
                                {isSubmitting ? <CheckCircle2 size={20} className="animate-spin" /> : <Send size={20} />} 
                                SUBMIT FEEDBACK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Confirmation Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 text-center space-y-6">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto scale-110 shadow-inner">
                                <CheckCircle2 size={42} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Feedback given!</h3>
                                <p className="text-slate-500 font-medium text-sm">
                                    Your response has been recorded successfully.
                                </p>
                            </div>
                            <button 
                                onClick={() => window.location.reload()}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
