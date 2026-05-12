import React, { useState, useEffect } from 'react';
import axios from '../../app/axiosInstance';
import { toast } from 'react-hot-toast';
import {
    Plus, Calendar, Clock, User, CheckCircle, XCircle,
    MessageSquare, Search, Filter,
    ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function EmployeeMeetingsPage() {
    const [meetings, setMeetings] = useState<any[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('tab') || 'UPCOMING') as 'UPCOMING' | 'ONGOING' | 'COMPLETED';
    const setActiveTab = (tab: string) => {
        searchParams.set('tab', tab);
        setSearchParams(searchParams);
    };
    const navigate = useNavigate();

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const getDuration = (m: any) => {
        if (m.status === 'COMPLETED' && m.actualStartTime && m.actualEndTime) {
            const start = new Date(m.actualStartTime).getTime();
            const end = new Date(m.actualEndTime).getTime();
            const diff = Math.floor((end - start) / 60000);
            return `${diff}m`;
        }
        return `${m.durationMinutes}m`;
    };

    // Pagination & Filter state
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(9);
    const [searchName, setSearchName] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [sortBy, setSortBy] = useState('latest');
    const [subStatus, setSubStatus] = useState('ALL');
    const [showFilters, setShowFilters] = useState(false);
    const [requestableManagers, setRequestableManagers] = useState<any[]>([]);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [requestTitle, setRequestTitle] = useState('');
    const [requestDescription, setRequestDescription] = useState('');
    const [requestScheduledTime, setRequestScheduledTime] = useState('');
    const [requestDurationMinutes, setRequestDurationMinutes] = useState(45);

    // Reschedule Modal state
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
    const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
    const [proposedTime, setProposedTime] = useState('');
    const [rescheduleReason, setRescheduleReason] = useState('');

    const now = new Date();
    const minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    const openRequestModal = () => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('action', 'request');
        setSearchParams(nextParams);
        setIsRequestModalOpen(true);
    };

    const closeRequestModal = () => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('action');
        setSearchParams(nextParams);
        setIsRequestModalOpen(false);
    };

    useEffect(() => {
        setSortBy('latest');
        setPage(0);
    }, [activeTab]);

    useEffect(() => {
        if (searchParams.get('action') === 'request') {
            setIsRequestModalOpen(true);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchMeetings();
        fetchRequestableManagers();
        const interval = setInterval(() => {
            if (activeTab !== 'COMPLETED') fetchMeetings();
        }, 30000);
        return () => clearInterval(interval);
    }, [activeTab, page, sortBy, subStatus]);

    const fetchMeetings = async () => {
        try {
            let statuses = '';
            if (activeTab === 'UPCOMING') statuses = 'PENDING,ACCEPTED,RESCHEDULE_REQUESTED,RESCHEDULE_MGR,CANCEL_REQUESTED';
            if (activeTab === 'ONGOING') statuses = 'ONGOING';
            if (activeTab === 'COMPLETED') {
                if (subStatus === 'ALL') statuses = 'COMPLETED,CANCELLED';
                else statuses = subStatus;
            }

            let url = `/meetings/employee?statuses=${statuses}&page=${page}&size=${pageSize}&sortBy=${sortBy}`;
            if (searchName) url += `&searchName=${encodeURIComponent(searchName)}`;
            if (activeTab === 'COMPLETED') {
                if (fromDate) url += `&fromDate=${new Date(fromDate).toISOString()}`;
                if (toDate) url += `&toDate=${new Date(toDate).toISOString()}`;
            }

            const resp = await axios.get(url);
            setMeetings(resp.data.data.content || []);
            setTotalPages(resp.data.data.totalPages || 0);
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to load meetings';
            toast.error(errorMsg);
        }
    };

    const fetchRequestableManagers = async () => {
        try {
            const resp = await axios.get('/meetings/requestable-managers');
            setRequestableManagers(resp.data.data || []);
        } catch (err) {
            console.error('Failed to load requestable managers');
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchMeetings();
    };

    const handleRequestMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/meetings/request', {
                title: requestTitle,
                description: requestDescription,
                scheduledTime: new Date(requestScheduledTime).toISOString(),
                durationMinutes: requestDurationMinutes
            });
            toast.success('Meeting request sent');
            closeRequestModal();
            setRequestTitle('');
            setRequestDescription('');
            setRequestScheduledTime('');
            setRequestDurationMinutes(45);
            fetchMeetings();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to request meeting');
        }
    };

    const resetFilters = () => {
        setSearchName('');
        setFromDate('');
        setToDate('');
        setSortBy('latest');
        setSubStatus('ALL');
        setPage(0);
        fetchMeetings();
    };

    const handleAccept = async (id: number) => {
        try {
            await axios.put(`/meetings/${id}/accept`);
            toast.success('Meeting accepted');
            fetchMeetings();
        } catch (err) {
            toast.error('Failed to accept meeting');
        }
    };

    const handleAcceptReschedule = async (id: number) => {
        try {
            await axios.put(`/meetings/${id}/accept-reschedule`);
            toast.success('Reschedule accepted');
            fetchMeetings();
        } catch (err) {
            toast.error('Failed to accept reschedule');
        }
    };

    // Cancellation logic
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelMeetingId, setCancelMeetingId] = useState<number | null>(null);

    const handleCancelRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cancelMeetingId) return;
        try {
            await axios.put(`/meetings/${cancelMeetingId}/request-cancel`, { reason: cancelReason });
            toast.success('Cancellation request sent to manager');
            setIsCancelModalOpen(false);
            fetchMeetings();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to request cancellation');
        }
    };

    const openCancelModal = (id: number) => {
        setCancelMeetingId(id);
        setCancelReason('');
        setIsCancelModalOpen(true);
    };

    const handleRescheduleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMeetingId) return;
        try {
            await axios.put(`/meetings/${selectedMeetingId}/reschedule`, {
                rescheduleReason,
                proposedTime: new Date(proposedTime).toISOString()
            });
            toast.success('Reschedule request sent');
            setIsRescheduleOpen(false);
            fetchMeetings();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to request reschedule');
        }
    };

    const openReschedule = (id: number) => {
        setSelectedMeetingId(id);
        setProposedTime('');
        setRescheduleReason('');
        setIsRescheduleOpen(true);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">My Meetings</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Manage your 1-on-1 meetings with your manager</p>
                </div>
                <button
                    onClick={openRequestModal}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={18} /> Request Meeting
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-100 w-fit">
                    {['UPCOMING', 'ONGOING', 'COMPLETED'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => {
                                setMeetings([]);
                                setActiveTab(tab as any);
                                setPage(0);
                            }}
                            className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === tab ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'COMPLETED' && (
                    <div className="flex items-center gap-2">
                        <div className="relative group flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                placeholder="Search title..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600'}`}
                        >
                            <Filter size={20} />
                        </button>
                    </div>
                )}
            </div>

            {activeTab === 'COMPLETED' && showFilters && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
                        <select 
                            value={subStatus}
                            onChange={(e) => { setSubStatus(e.target.value); setPage(0); }}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                        >
                            <option value="ALL">All (History)</option>
                            <option value="COMPLETED">Completed Only</option>
                            <option value="CANCELLED">Cancelled Only</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">From Date</label>
                        <input 
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <div className="flex-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">To Date</label>
                            <input 
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                            />
                        </div>
                        <button 
                            onClick={resetFilters}
                            className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all h-[34px]"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meetings.length === 0 && (
                    <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-100 text-center shadow-sm">
                        <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-700">No {activeTab.toLowerCase()} meetings found</h3>
                        <p className="text-slate-500 text-sm mt-2">You don't have any meetings in this category.</p>
                    </div>
                )}
                {meetings.map(m => (
                    <div 
                        key={m.id} 
                        onClick={() => (m.status === 'COMPLETED' || m.status === 'CANCELLED') && navigate(`/employee/meetings/${m.id}`)}
                        className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between transition-all group ${ (m.status === 'COMPLETED' || m.status === 'CANCELLED') ? 'cursor-pointer hover:border-blue-200' : 'hover:border-blue-200'}`}
                    >
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-blue-700 transition-colors">{m.title}</h3>
                                    <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${m.status === 'CANCELLED' ? 'text-rose-500' : 'text-blue-600'}`}>{m.status}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${m.status === 'CANCELLED' ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                                    {m.status === 'CANCELLED' ? <XCircle size={18} /> : (m.status === 'COMPLETED' ? <CheckCircle size={18} /> : <User size={18} />)}
                                </div>
                            </div>
                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <User size={14} className="text-slate-400" />
                                    <span className="font-semibold">Manager: {m.managerName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Calendar size={14} className="text-slate-400" />
                                    <span>{formatDate(m.scheduledTime)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Clock size={14} className="text-slate-400" />
                                    <span>{getDuration(m)} {m.status === 'COMPLETED' ? '(Actual)' : 'minutes'}</span>
                                </div>
                            </div>
                        </div>

                        {activeTab !== 'COMPLETED' && (
                            <div className="flex gap-2 mt-auto flex-wrap">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); navigate(`/employee/meetings/${m.id}`); }}
                                    className="flex-1 min-w-fit bg-slate-50 border border-slate-200 text-slate-700 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 px-3"
                                >
                                    <MessageSquare size={16} /> Details
                                </button>
                                
                                {m.status === 'PENDING' && (
                                    <>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleAccept(m.id); }}
                                            className="bg-emerald-50 text-emerald-600 px-3 py-2 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors flex items-center gap-1 text-sm font-bold"
                                        >
                                            <Check size={16} /> Accept
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); openReschedule(m.id); }}
                                            className="bg-amber-50 text-amber-600 px-3 py-2 rounded-xl border border-amber-100 hover:bg-amber-100 transition-colors flex items-center gap-1 text-sm font-bold"
                                        >
                                            <Clock size={16} /> Reschedule
                                        </button>
                                    </>
                                )}

                                {m.status === 'ACCEPTED' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); openCancelModal(m.id); }}
                                        className="bg-rose-50 text-rose-600 px-3 py-2 rounded-xl border border-rose-100 hover:bg-rose-100 transition-colors flex items-center gap-1 text-sm font-bold"
                                    >
                                        <XCircle size={16} /> Cancel
                                    </button>
                                )}

                                {m.status === 'RESCHEDULE_MGR' && (
                                    <div className="w-full mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <p className="text-xs font-bold text-blue-800 uppercase mb-1">Reschedule Requested</p>
                                        <p className="text-sm text-blue-900 mb-2 font-medium">Proposed: {new Date(m.proposedTime).toLocaleString()}</p>
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={(e) => { e.stopPropagation(); handleAcceptReschedule(m.id); }} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">Accept</button>
                                            <button onClick={(e) => { e.stopPropagation(); openReschedule(m.id); }} className="flex-1 bg-white border border-blue-200 text-blue-700 py-2 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors">Propose</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'COMPLETED' && (
                            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to view details</span>
                                <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 group-hover:text-blue-500 transition-all" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {activeTab === 'COMPLETED' && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                    <button 
                        disabled={page === 0}
                        onClick={() => setPage(page - 1)}
                        className="p-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex gap-1">
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setPage(i)}
                                className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${page === i ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 border border-transparent'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <button 
                        disabled={page === totalPages - 1}
                        onClick={() => setPage(page + 1)}
                        className="p-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

            {/* Reschedule Modal */}
            {isRescheduleOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
                            <h2 className="text-xl font-black uppercase tracking-tight">Request Reschedule</h2>
                            <button onClick={() => setIsRescheduleOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Proposed Date & Time</label>
                                <input 
                                    required
                                    type="datetime-local"
                                    min={minDateTime}
                                    value={proposedTime}
                                    onChange={(e) => setProposedTime(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Reason</label>
                                <textarea 
                                    required
                                    rows={4}
                                    value={rescheduleReason}
                                    onChange={(e) => setRescheduleReason(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                                    placeholder="Please explain why you need to reschedule..."
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-black uppercase tracking-wider text-sm hover:bg-blue-700 transition-colors shadow-md mt-2"
                            >
                                Send Request
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {isRequestModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
                            <h2 className="text-xl font-black uppercase tracking-tight">Request Meeting</h2>
                            <button onClick={closeRequestModal} className="text-slate-400 hover:text-white transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleRequestMeeting} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Manager</label>
                                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700">
                                    {requestableManagers[0]?.name || 'No manager assigned'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Meeting Title</label>
                                <input
                                    required
                                    type="text"
                                    value={requestTitle}
                                    onChange={(e) => setRequestTitle(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="e.g., Career discussion"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Date & Time</label>
                                <input
                                    required
                                    type="datetime-local"
                                    min={minDateTime}
                                    value={requestScheduledTime}
                                    onChange={(e) => setRequestScheduledTime(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Duration (mins)</label>
                                <input
                                    required
                                    type="number"
                                    min="15"
                                    step="15"
                                    value={requestDurationMinutes}
                                    onChange={(e) => setRequestDurationMinutes(parseInt(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Description / Agenda</label>
                                <textarea
                                    rows={3}
                                    value={requestDescription}
                                    onChange={(e) => setRequestDescription(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                                    placeholder="Brief agenda or topics to discuss..."
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={requestableManagers.length === 0}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-black uppercase tracking-wider text-sm hover:bg-blue-700 transition-colors shadow-md mt-2 disabled:opacity-50"
                            >
                                Send Request
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Cancellation Modal */}
            {isCancelModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="bg-rose-800 p-6 text-white flex justify-between items-center">
                            <h2 className="text-xl font-black uppercase tracking-tight">Request Cancellation</h2>
                            <button onClick={() => setIsCancelModalOpen(false)} className="text-rose-400 hover:text-white transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCancelRequestSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Cancellation Reason</label>
                                <textarea 
                                    required
                                    rows={4}
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all resize-none"
                                    placeholder="Explain why you are requesting to cancel this meeting..."
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full bg-rose-600 text-white py-3 rounded-xl font-black uppercase tracking-wider text-sm hover:bg-rose-700 transition-colors shadow-md mt-2"
                            >
                                Send Request
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EmployeeMeetingsPage;
