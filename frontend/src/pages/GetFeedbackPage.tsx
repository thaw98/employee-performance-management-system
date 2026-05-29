import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { Calendar, ChevronLeft, ChevronRight, Eye, Inbox, Search, User } from 'lucide-react';
import { useGetProfileQuery } from '../features/user/userApi';
import { feedbackRoleDisplay } from '../utils/feedbackAnonymity';

interface FeedbackItem {
    id: number;
    date: string;
    evaluatorName: string;
    evaluatorPosition?: string | null;
    evaluatorDepartment?: string | null;
    evaluateeName?: string | null;
    evaluateeStaffNo?: string | null;
    evaluateePosition?: string | null;
    evaluateeDepartment?: string | null;
    reviewCycleStartDate?: string | null;
    role: string;
    score: number;
    remark: string;
    anonymous?: boolean;
    additionalComments?: string | null;
    direction?: string;
}

interface ReceivedListState {
    page?: number;
    searchTerm?: string;
}

export function GetFeedbackPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const restoredState = (location.state || {}) as ReceivedListState;
    const [received, setReceived] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(restoredState.page ?? 0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState(restoredState.searchTerm ?? '');
    const { data: profileResponse } = useGetProfileQuery();
    const timeFormat = profileResponse?.data?.timeFormat || '12h';

    const getPageItems = (): (number | 'ellipsis')[] => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, index) => index);
        }

        const candidatePages = new Set<number>([0, 1, 2, totalPages - 3, totalPages - 2, totalPages - 1, page - 1, page, page + 1]);
        const normalizedPages = [...candidatePages].filter((value) => value >= 0 && value < totalPages).sort((left, right) => left - right);
        const items: (number | 'ellipsis')[] = [];
        let previous: number | null = null;
        for (const pageNumber of normalizedPages) {
            if (previous !== null && pageNumber - previous > 1) {
                items.push('ellipsis');
            }
            items.push(pageNumber);
            previous = pageNumber;
        }
        return items;
    };

    useEffect(() => {
        fetchReceived();
    }, [page]);

    const fetchReceived = async () => {
        try {
            setLoading(true);
            const resp = await axios.get(`/feedback/received?page=${page}&size=10`);
            setReceived(resp.data.data.content.map((item: FeedbackItem) => ({ ...item, direction: 'RECEIVED' })));
            setTotalPages(resp.data.data.totalPages);
        } catch (err) {
            toast.error('Failed to load received feedback');
        } finally {
            setLoading(false);
        }
    };

    const viewDetails = (item: FeedbackItem) => {
        navigate(`${location.pathname.replace(/\/$/, '')}/${item.id}`, {
            state: {
                feedback: { ...item, direction: 'RECEIVED' },
                sourcePath: location.pathname,
                listState: { page, searchTerm },
            },
        });
    };

    const getRemarkColor = (remark: string) => {
        switch (remark) {
            case 'Outstanding': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Good': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Meet Requirement': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Need Improvement': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'Unsatisfactory': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-slate-50 text-slate-400 border-slate-100';
        }
    };

    const filteredItems = received.filter(item =>
        item.remark.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.evaluatorName.toLowerCase().startsWith(searchTerm.toLowerCase().charAt(0))
    );

    return (
        <div className="max-w-7xl mx-auto p-4 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Received Feedback</h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Inbox size={16} className="text-blue-500 line-through decoration-blue-500/30" /> Feedback responses from your colleagues
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by remark or role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-3 text-sm font-bold w-full md:w-80 outline-none focus:border-blue-500 transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Date Received</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Evaluator</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Evaluator Role</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Score</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Performance Remark</th>
                            <th className="p-6 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={6} className="p-6 h-20 bg-slate-50/20" />
                                </tr>
                            ))
                        ) : filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-20 text-center">
                                    <div className="flex flex-col items-center gap-4 text-slate-400">
                                        <Inbox size={48} className="opacity-20" />
                                        <p className="font-bold underline decoration-slate-200 decoration-2 underline-offset-4 decoration-wavy">No feedback received yet.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map((item) => (
                                <tr key={item.id} className="group hover:bg-blue-50/30 transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400"><Calendar size={18} /></div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700">{new Date(item.date).toLocaleDateString('en-GB')}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(item.date).toLocaleTimeString('en-US', { hour12: timeFormat === '12h', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400"><User size={18} /></div>
                                            <span className="font-bold text-slate-700">{item.evaluatorName}</span>
                                        </div>
                                    </td>
                                    <td className="p-6"><span className="px-3 py-1 rounded-lg bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-tight">{feedbackRoleDisplay(item)}</span></td>
                                    <td className="p-6">
                                        <div className="flex flex-col items-center">
                                            <span className="text-lg font-black text-slate-800">{item.score.toFixed(1)}%</span>
                                            <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${item.score}%` }} /></div>
                                        </div>
                                    </td>
                                    <td className="p-6"><span className={`px-4 py-2 rounded-xl border-2 text-xs font-black uppercase tracking-tight ${getRemarkColor(item.remark)}`}>{item.remark}</span></td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => viewDetails(item)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center border border-transparent hover:border-slate-200" title="View details">
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4 flex-wrap">
                    <button onClick={() => setPage(prev => Math.max(0, prev - 1))} disabled={page === 0} className="bg-white p-3 rounded-xl border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 disabled:opacity-0 transition-all">
                        <ChevronLeft size={20} />
                    </button>
                    {getPageItems().map((item, index) =>
                        item === 'ellipsis' ? (
                            <span key={`ellipsis-${index}`} className="px-1 text-slate-400 text-sm select-none">...</span>
                        ) : (
                            <button key={item} onClick={() => setPage(item)} className={`min-w-[42px] h-10 px-3 rounded-xl text-sm font-black border transition-all ${item === page ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-500 hover:text-blue-600 hover:border-blue-100'}`}>
                                {item + 1}
                            </button>
                        )
                    )}
                    <button onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))} disabled={page === totalPages - 1} className="bg-white p-3 rounded-xl border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 disabled:opacity-0 transition-all">
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}
