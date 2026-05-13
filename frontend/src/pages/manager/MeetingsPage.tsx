import React, { useState, useEffect } from 'react';
import axios from '../../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { 
    Plus, Calendar, Clock, User, CheckCircle, XCircle, 
    MessageSquare, Play, Square, Search, Filter,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

export function MeetingsPage() {
    const [meetings, setMeetings] = useState<any[]>([]);
    const [eligibleEmployees, setEligibleEmployees] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const location = useLocation();
    const isHrView = location.pathname.startsWith('/hr/');
    const hrSection = (searchParams.get('section') || 'schedule') as 'schedule' | 'history';
    const activeTab = (searchParams.get('tab') || 'UPCOMING') as 'UPCOMING' | 'ONGOING' | 'COMPLETED';
    const setActiveTab = (tab: string) => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tab', tab);
        setSearchParams(nextParams);
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
    const [selectedDept, setSelectedDept] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [sortBy, setSortBy] = useState('latest');
    const [subStatus, setSubStatus] = useState('ALL');
    const [showFilters, setShowFilters] = useState(false);

    // End Meeting Modal
    const [isEndModalOpen, setIsEndModalOpen] = useState(false);
    const [summaryNotes, setSummaryNotes] = useState('');
    const [endMeetingId, setEndMeetingId] = useState<number | null>(null);

    // Form state
    const [employeeId, setEmployeeId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [durationMinutes, setDurationMinutes] = useState(45);

    const now = new Date();
    const minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    // Reschedule state
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
    const [rescheduleProposedTime, setRescheduleProposedTime] = useState('');
    const [rescheduleReason, setRescheduleReason] = useState('');

    useEffect(() => {
        setSortBy('latest');
        setPage(0);
    }, [activeTab]);

    useEffect(() => {
        fetchMeetings();
        if (!isHrView || hrSection === 'schedule') fetchEligibleEmployees();
        fetchDepartments();
        const interval = setInterval(() => {
            if ((!isHrView || hrSection === 'schedule') && activeTab !== 'COMPLETED') fetchMeetings();
        }, 30000); 
        return () => clearInterval(interval);
    }, [activeTab, page, sortBy, selectedDept, subStatus, hrSection, isHrView]);

    const fetchMeetings = async () => {
        try {
            let statuses = '';
            if (isHrView && hrSection === 'history') {
                statuses = subStatus === 'ALL' ? 'COMPLETED,CANCELLED' : subStatus;
            } else {
                if (activeTab === 'UPCOMING') statuses = 'PENDING,ACCEPTED,RESCHEDULE_REQUESTED,RESCHEDULE_MGR,CANCEL_REQUESTED';
                if (activeTab === 'ONGOING') statuses = 'ONGOING';
                if (activeTab === 'COMPLETED') {
                    if (subStatus === 'ALL') statuses = 'COMPLETED,CANCELLED';
                    else statuses = subStatus;
                }
            }

            let url = isHrView && hrSection === 'history'
                ? `/meetings/history?page=${page}&size=${pageSize}&sortBy=${sortBy}`
                : `/meetings/manager?statuses=${statuses}&page=${page}&size=${pageSize}&sortBy=${sortBy}`;
            if (statuses) url += `&statuses=${statuses}`;
            if (searchName) url += `&searchName=${encodeURIComponent(searchName)}`;
            if (selectedDept) url += `&departmentId=${selectedDept}`;
            if (activeTab === 'COMPLETED' || (isHrView && hrSection === 'history')) {
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

    const fetchEligibleEmployees = async () => {
        try {
            const resp = await axios.get('/meetings/eligible-employees');
            setEligibleEmployees(resp.data.data || []);
        } catch (err) {
            console.error('Failed to load eligible employees');
        }
    };

    const fetchDepartments = async () => {
        try {
            const resp = await axios.get('/departments');
            setDepartments(resp.data.data || []);
        } catch (err) {
            console.error('Failed to load departments');
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchMeetings();
    };

    const resetFilters = () => {
        setSearchName('');
        setSelectedDept('');
        setFromDate('');
        setToDate('');
        setSortBy('latest');
        setSubStatus('ALL');
        setPage(0);
        fetchMeetings();
    };

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                employeeId: parseInt(employeeId),
                title,
                description,
                scheduledTime: new Date(scheduledTime).toISOString(),
                durationMinutes
            };
            await axios.post('/meetings', payload);
            toast.success('Meeting scheduled successfully');
            setIsModalOpen(false);
            fetchMeetings();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to schedule meeting');
        }
    };

    const handleRescheduleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMeetingId) return;
        try {
            await axios.put(`/meetings/${selectedMeetingId}/reschedule`, {
                rescheduleReason,
                proposedTime: new Date(rescheduleProposedTime).toISOString()
            });
            toast.success('Reschedule request sent to employee');
            setIsRescheduleModalOpen(false);
            fetchMeetings();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to request reschedule');
        }
    };

    const openRescheduleModal = (m: any) => {
        setSelectedMeetingId(m.id);
        setRescheduleReason('');
        setRescheduleProposedTime('');
        setIsRescheduleModalOpen(true);
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

    const handleApproveCancel = async (id: number) => {
        try {
            await axios.put(`/meetings/${id}/approve-cancel`);
            toast.success('Cancellation approved');
            fetchMeetings();
        } catch (err) {
            toast.error('Failed to approve cancellation');
        }
    };

    const handleRejectCancel = async (id: number) => {
        try {
            await axios.put(`/meetings/${id}/reject-cancel`);
            toast.success('Cancellation rejected');
            fetchMeetings();
        } catch (err) {
            toast.error('Failed to reject cancellation');
        }
    };

    const handleFinishMeeting = (id: number) => {
        setEndMeetingId(id);
        setSummaryNotes('');
        setIsEndModalOpen(true);
    };

    const handleFinishSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!endMeetingId) return;
        try {
            await axios.put(`/meetings/${endMeetingId}/finish`, { summaryNotes });
            toast.success('Meeting ended and marked as completed');
            setIsEndModalOpen(false);
            fetchMeetings();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to end meeting');
        }
    };

    const handleStatusUpdate = async (id: number, status: string) => {
        try {
            await axios.put(`/meetings/${id}/status`, { status });
            toast.success('Status updated');
            fetchMeetings();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                        {isHrView && hrSection === 'history' ? 'Meeting History' : isHrView ? 'Schedule Meeting' : 'Manager Meetings'}
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        {isHrView && hrSection === 'history'
                            ? 'Review completed and cancelled meetings across all departments'
                            : 'Schedule and manage 1-on-1 meetings with your subordinates'}
                    </p>
                </div>
                {(!isHrView || hrSection === 'schedule') && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} /> Schedule Meeting
                    </button>
                )}
            </div>

            {(!isHrView || hrSection === 'schedule') && (
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
                                placeholder="Search employee..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-600'}`}
                        >
                            <Filter size={20} />
                        </button>
                    </div>
                )}
            </div>
            )}

            {isHrView && hrSection === 'history' && (
                <div className="flex items-center gap-2 justify-end">
                    <div className="relative group flex-1 md:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                            placeholder="Search employee or manager..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-600'}`}
                    >
                        <Filter size={20} />
                    </button>
                </div>
            )}

            {((activeTab === 'COMPLETED' && (!isHrView || hrSection === 'schedule')) || (isHrView && hrSection === 'history')) && showFilters && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status / Type</label>
                        <select 
                            value={subStatus}
                            onChange={(e) => { setSubStatus(e.target.value); setPage(0); }}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
                        >
                            <option value="ALL">{isHrView && hrSection === 'history' ? 'All completed/cancelled' : 'All (History)'}</option>
                            <option value="COMPLETED">Completed Only</option>
                            <option value="CANCELLED">Cancelled Only</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Department</label>
                        <select
                            value={selectedDept}
                            onChange={(e) => { setSelectedDept(e.target.value); setPage(0); }}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
                        >
                            <option value="">All Departments</option>
                            {departments.map((dept: any) => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">From Date</label>
                        <input 
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <div className="flex-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">To Date</label>
                            <input 
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
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
                {meetings.map(m => {
                    const canOpenDetails =
                        (isHrView && hrSection === 'history') ||
                        (!isHrView && (m.status === 'COMPLETED' || m.status === 'CANCELLED'));
                    const detailPath = isHrView ? `/hr/meetings/${m.id}` : `/manager/meetings/${m.id}`;

                    return (
                    <div 
                        key={m.id} 
                        onClick={() => canOpenDetails && navigate(detailPath)}
                        className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between transition-all group ${canOpenDetails ? 'cursor-pointer hover:border-emerald-200' : 'hover:border-emerald-200'}`}
                    >
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-emerald-700 transition-colors">{m.title}</h3>
                                    <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${m.status === 'CANCELLED' ? 'text-rose-500' : 'text-emerald-600'}`}>{m.status}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${m.status === 'CANCELLED' ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
                                    {m.status === 'CANCELLED' ? <XCircle size={18} /> : (m.status === 'COMPLETED' ? <CheckCircle size={18} /> : <User size={18} />)}
                                </div>
                            </div>
                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <User size={14} className="text-slate-400" />
                                    <span className="font-semibold">{m.employeeName}</span>
                                    {m.departmentName && <span className="text-xs text-slate-400">({m.departmentName})</span>}
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

                        {activeTab !== 'COMPLETED' && (!isHrView || hrSection === 'schedule') && (
                            <div className="space-y-4">
                                {m.status === 'RESCHEDULE_REQUESTED' && (
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                        <p className="text-xs font-bold text-amber-800 uppercase mb-1">Reschedule Requested</p>
                                        <p className="text-sm text-amber-900 mb-2 font-medium">Proposed: {new Date(m.proposedTime).toLocaleString()}</p>
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={(e) => { e.stopPropagation(); handleAcceptReschedule(m.id); }} className="flex-1 bg-amber-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors">Confirm</button>
                                            <button onClick={(e) => { e.stopPropagation(); openRescheduleModal(m); }} className="flex-1 bg-white border border-amber-200 text-amber-700 py-2 rounded-lg text-xs font-bold hover:bg-amber-50 transition-colors">Propose</button>
                                        </div>
                                    </div>
                                )}

                                {m.status === 'CANCEL_REQUESTED' && (
                                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                                        <p className="text-xs font-bold text-rose-800 uppercase mb-1">Cancellation Requested</p>
                                        <p className="text-xs text-rose-700 italic mb-3 line-clamp-2">"{m.cancellationReason}"</p>
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); handleApproveCancel(m.id); }} className="flex-1 bg-rose-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors">Approve</button>
                                            <button onClick={(e) => { e.stopPropagation(); handleRejectCancel(m.id); }} className="flex-1 bg-white border border-rose-200 text-rose-700 py-2 rounded-lg text-xs font-bold hover:bg-rose-50 transition-colors">Reject</button>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex gap-2 mt-auto">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); navigate(detailPath); }}
                                        className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MessageSquare size={16} /> Details
                                    </button>
                                    
                                    {activeTab === 'UPCOMING' && m.status === 'ACCEPTED' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(m.id, 'ONGOING'); }}
                                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 text-sm font-bold shadow-lg shadow-emerald-100"
                                        >
                                            <Play size={16} /> Start
                                        </button>
                                    )}

                                    {activeTab === 'ONGOING' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleFinishMeeting(m.id); }}
                                            className="flex-1 bg-rose-600 text-white py-2 rounded-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-rose-100"
                                        >
                                            <Square size={16} /> End Meeting
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'COMPLETED' && (!isHrView || hrSection === 'schedule') && (
                            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to view details</span>
                                <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 group-hover:text-emerald-500 transition-all" />
                            </div>
                        )}

                        {isHrView && hrSection === 'history' && (
                            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to view details</span>
                                <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 group-hover:text-emerald-500 transition-all" />
                            </div>
                        )}
                    </div>
                    );
                })}
            </div>

            {((activeTab === 'COMPLETED' && (!isHrView || hrSection === 'schedule')) || (isHrView && hrSection === 'history')) && totalPages > 1 && (
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
                                className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${page === i ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 border border-transparent'}`}
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

            {/* Schedule Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
                            <h2 className="text-xl font-black uppercase tracking-tight">Schedule Meeting</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSchedule} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Select Employee</label>
                                <select 
                                    required
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                >
                                    <option value="">Select a subordinate...</option>
                                    {eligibleEmployees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Meeting Title</label>
                                <input 
                                    required
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="e.g., Q2 Performance Review"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Date & Time</label>
                                <input 
                                    required
                                    type="datetime-local"
                                    min={minDateTime}
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Duration (mins)</label>
                                    <input 
                                        required
                                        type="number"
                                        min="15"
                                        step="15"
                                        value={durationMinutes}
                                        onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Description / Agenda</label>
                                <textarea 
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none"
                                    placeholder="Brief agenda or topics to discuss..."
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black uppercase tracking-wider text-sm hover:bg-emerald-700 transition-colors shadow-md mt-2"
                            >
                                Schedule Meeting
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Reschedule Modal */}
            {isRescheduleModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
                            <h2 className="text-xl font-black uppercase tracking-tight">Propose Reschedule</h2>
                            <button onClick={() => setIsRescheduleModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
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
                                    value={rescheduleProposedTime}
                                    onChange={(e) => setRescheduleProposedTime(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Reason</label>
                                <textarea 
                                    required
                                    rows={4}
                                    value={rescheduleReason}
                                    onChange={(e) => setRescheduleReason(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none"
                                    placeholder="Explain why you are proposing a new time..."
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black uppercase tracking-wider text-sm hover:bg-emerald-700 transition-colors shadow-md mt-2"
                            >
                                Send Proposal
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* End Meeting Modal */}
            {isEndModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <CheckCircle size={24} className="text-emerald-400" />
                                <h2 className="text-xl font-black uppercase tracking-tight">End Meeting & Finalize</h2>
                            </div>
                            <button onClick={() => setIsEndModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleFinishSubmit} className="p-6 space-y-5">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                    Are you sure you want to end this meeting? This will mark the meeting as <span className="font-bold text-emerald-600">COMPLETED</span> and record the actual end time.
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Final Summary Notes</label>
                                <textarea 
                                    required
                                    rows={5}
                                    value={summaryNotes}
                                    onChange={(e) => setSummaryNotes(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none shadow-inner"
                                    placeholder="Write a brief summary of the discussion, key takeaways, and any action items..."
                                />
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsEndModalOpen(false)}
                                    className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-xl font-black uppercase tracking-wider text-sm hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-[2] bg-emerald-600 text-white py-3.5 rounded-xl font-black uppercase tracking-wider text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={18} /> Confirm & End Meeting
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MeetingsPage;
