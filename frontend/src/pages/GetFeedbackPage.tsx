import React, { useState, useEffect } from 'react';
import axios from '../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { 
    Search, 
    Eye, 
    ChevronLeft, 
    ChevronRight,
    Calendar,
    User,
    Printer,
    Inbox
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    Dialog, 
    DialogPanel, 
    DialogTitle, 
    Transition, 
    TransitionChild 
} from '@headlessui/react';
import { useGetProfileQuery } from '../features/user/userApi';

interface FeedbackItem {
    id: number;
    date: string;
    evaluatorName: string; // We'll assume the backend provides this or we show "Anonymous"
    role: string;
    score: number;
    remark: string;
}

interface FeedbackDetail {
    criteriaName: string;
    rating: number;
    comment: string;
}

export function GetFeedbackPage() {
    const [received, setReceived] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const { data: profileResponse } = useGetProfileQuery();
    const timeFormat = profileResponse?.data?.timeFormat || '12h';

    // Modal state
    const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
    const [details, setDetails] = useState<FeedbackDetail[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const getPageItems = (): (number | 'ellipsis')[] => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, index) => index);
        }

        const candidatePages = new Set<number>([
            0, 1, 2,
            totalPages - 3, totalPages - 2, totalPages - 1,
            page - 1, page, page + 1,
        ]);

        const normalizedPages = [...candidatePages]
            .filter((value) => value >= 0 && value < totalPages)
            .sort((left, right) => left - right);

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
            setReceived(resp.data.data.content);
            setTotalPages(resp.data.data.totalPages);
        } catch (err) {
            toast.error('Failed to load received feedback');
        } finally {
            setLoading(false);
        }
    };

    const openDetails = async (item: FeedbackItem) => {
        setSelectedFeedback(item);
        setIsModalOpen(true);
        setLoadingDetails(true);
        try {
            const resp = await axios.get(`/feedback/${item.id}/details`);
            setDetails(resp.data.data);
        } catch (err) {
            toast.error('Failed to load feedback details');
        } finally {
            setLoadingDetails(false);
        }
    };

    const generatePDF = (item: FeedbackItem) => {
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text('360-Degree Feedback Assessment Report', 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.text(`Date: ${new Date(item.date).toLocaleDateString('en-GB')} ${new Date(item.date).toLocaleTimeString('en-US', { hour12: timeFormat === '12h', hour: '2-digit', minute: '2-digit' })}`, 14, 35);
        doc.text(`Role of Evaluator: ${item.role}`, 14, 42);
        doc.text(`Overall Score: ${item.score.toFixed(1)}%`, 14, 49);
        doc.text(`Performance Remark: ${item.remark}`, 14, 56);
        
        autoTable(doc, {
            startY: 65,
            head: [['Criteria', 'Rating', 'Comments']],
            body: details.map(d => [d.criteriaName, d.rating, d.comment || 'N/A']),
            theme: 'striped',
            headStyles: { fillColor: [8, 85, 191] }
        });
        
        doc.save(`Feedback_Report_${item.date}.pdf`);
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
            {/* Header Section */}
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

            {/* Table Section */}
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
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                <Calendar size={18} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700">{new Date(item.date).toLocaleDateString('en-GB')}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                    {new Date(item.date).toLocaleTimeString('en-US', { 
                                                        hour12: timeFormat === '12h', 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                <User size={18} />
                                            </div>
                                            <span className="font-bold text-slate-700">{item.evaluatorName}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="px-3 py-1 rounded-lg bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-tight">
                                            {item.role}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-col items-center">
                                            <span className="text-lg font-black text-slate-800">{item.score.toFixed(1)}%</span>
                                            <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500" style={{ width: `${item.score}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-4 py-2 rounded-xl border-2 text-xs font-black uppercase tracking-tight ${getRemarkColor(item.remark)}`}>
                                            {item.remark}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all text-gray-500">
                                            <button 
                                                onClick={() => openDetails(item)}
                                                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center border border-transparent hover:border-slate-200"
                                            >
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

            {/* Detailed View Modal */}
            <Transition show={isModalOpen} as={React.Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
                    <TransitionChild
                        as={React.Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
                    </TransitionChild>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <TransitionChild
                                as={React.Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-[32px] bg-white p-10 shadow-2xl transition-all border border-slate-100">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="space-y-1">
                                            <DialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                                Received Feedback Details
                                            </DialogTitle>
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                                Role of Evaluator: <span className="text-blue-600">{selectedFeedback?.role}</span>
                                            </p>
                                        </div>
                                        <div className={`px-5 py-2 rounded-2xl border-2 font-black uppercase text-xs tracking-widest ${getRemarkColor(selectedFeedback?.remark || '')}`}>
                                            {selectedFeedback?.remark} • {selectedFeedback?.score.toFixed(1)}%
                                        </div>
                                    </div>

                                    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                                        {loadingDetails ? (
                                            <div className="p-20 text-center space-y-4">
                                                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Fetching details...</p>
                                            </div>
                                        ) : (
                                            details.map((d, i) => (
                                                <div key={i} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h5 className="font-black text-slate-800">{d.criteriaName}</h5>
                                                        <span className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-blue-100">
                                                            {d.rating}
                                                        </span>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-xl border border-slate-100 italic text-sm text-slate-600 font-medium leading-relaxed">
                                                        {d.comment || (
                                                            <span className="text-slate-300 italic">No comments provided.</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end gap-3">
                                        <button
                                            onClick={() => setIsModalOpen(false)}
                                            className="px-8 py-3 rounded-xl text-xs font-black text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                                        >
                                            CLOSE
                                        </button>
                                        <button
                                            onClick={() => selectedFeedback && generatePDF(selectedFeedback)}
                                            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                        >
                                            <Printer size={16} /> PRINT REPORT
                                        </button>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4 flex-wrap">
                    <button 
                        onClick={() => setPage(prev => Math.max(0, prev - 1))}
                        disabled={page === 0}
                        className="bg-white p-3 rounded-xl border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 disabled:opacity-0 transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    {getPageItems().map((item, index) =>
                        item === 'ellipsis' ? (
                            <span key={`ellipsis-${index}`} className="px-1 text-slate-400 text-sm select-none">...</span>
                        ) : (
                            <button
                                key={item}
                                onClick={() => setPage(item)}
                                className={`min-w-[42px] h-10 px-3 rounded-xl text-sm font-black border transition-all ${
                                    item === page
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-white border-slate-100 text-slate-500 hover:text-blue-600 hover:border-blue-100'
                                }`}
                            >
                                {item + 1}
                            </button>
                        )
                    )}
                    <button 
                        onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={page === totalPages - 1}
                        className="bg-white p-3 rounded-xl border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 disabled:opacity-0 transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}
