import React, { useRef, useState, useEffect, useMemo } from 'react';
import axios from '../../app/axiosInstance';
import { toast } from 'react-hot-toast';
import {
    Plus, Calendar, Clock, User, CheckCircle, XCircle,
    MessageSquare, Play, Square, Search, Filter,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

const isHrEmployeeOption = (employee: any) => {
    const searchableText = [employee.position, employee.department, employee.name]
        .filter(Boolean)
        .join(' ');
    return /(^|\W)(hr|human resources?)(\W|$)/i.test(searchableText);
};

const DISPLAY_DATE_TIME_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/;

const toLocalDateTimeValue = (value: string) => {
    const match = value.match(DISPLAY_DATE_TIME_PATTERN);
    if (!match) return '';
    const [, day, month, year, hour, minute] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    if (
        parsed.getFullYear() !== Number(year)
        || parsed.getMonth() !== Number(month) - 1
        || parsed.getDate() !== Number(day)
        || parsed.getHours() !== Number(hour)
        || parsed.getMinutes() !== Number(minute)
    ) return '';
    return `${year}-${month}-${day}T${hour}:${minute}`;
};

const toDisplayDateTimeFromLocal = (value: string) => {
    if (!value) return '';
    const [datePart, timePart] = value.split('T');
    if (!datePart || !timePart) return '';
    const [year, month, day] = datePart.split('-');
    const [hour, minute] = timePart.split(':');
    if (!year || !month || !day || !hour || !minute) return '';
    return `${day}/${month}/${year} ${hour}:${minute}`;
};

export function MeetingsPage() {
    const [meetings, setMeetings] = useState<any[]>([]);
    const [eligibleEmployees, setEligibleEmployees] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const location = useLocation();
    const isHrView = location.pathname.startsWith('/hr/');
    const isAuditView = location.pathname.startsWith('/audit/');
    const isHistoryOnlyView = (isHrView || isAuditView) && (isAuditView || searchParams.get('section') === 'history');
    const canManageMeetings = !isHistoryOnlyView;
    const hrSection = (searchParams.get('section') || 'schedule') as 'schedule' | 'history';
    const isFaqHrMeeting = searchParams.get('target') === 'hr';
    const activeTab = (searchParams.get('tab') || 'UPCOMING') as 'UPCOMING' | 'ONGOING' | 'COMPLETED';
    const setActiveTab = (tab: string) => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tab', tab);
        setSearchParams(nextParams);
    };
    const navigate = useNavigate();
    const meetingsPagePath = isHrView ? '/hr/meetings' : '/manager/meetings';

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
    const schedulePickerRef = useRef<HTMLInputElement | null>(null);
    const [durationMinutes, setDurationMinutes] = useState(45);
    const selectableEmployees = useMemo(
        () => (isFaqHrMeeting ? eligibleEmployees.filter(isHrEmployeeOption) : eligibleEmployees),
        [eligibleEmployees, isFaqHrMeeting]
    );

    const now = new Date();
    const minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const openDateTimePicker = (input: HTMLInputElement | null) => {
        if (!input) return;
        if (typeof input.showPicker === 'function') input.showPicker();
        else input.click();
    };

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
        if (canManageMeetings) fetchEligibleEmployees();
        fetchDepartments();
        const interval = setInterval(() => {
            if (canManageMeetings && activeTab !== 'COMPLETED') fetchMeetings();
        }, 30000); 
        return () => clearInterval(interval);
    }, [activeTab, page, sortBy, selectedDept, subStatus, hrSection, isHrView, isFaqHrMeeting, canManageMeetings]);

    useEffect(() => {
        const requestedEmployeeId = searchParams.get('employeeId');
        const requestedEmployeeName = searchParams.get('employeeName');
        const requestedTitle = searchParams.get('meetingTitle');
        const requestedDescription = searchParams.get('meetingDescription');
        const requestedAction = searchParams.get('action');
        if (requestedTitle) {
            setTitle(requestedTitle);
        }
        if (requestedDescription) {
            setDescription(requestedDescription);
            if (!requestedTitle) setTitle(requestedDescription);
        }
        if (isFaqHrMeeting && !requestedDescription && !title) {
            setTitle('FAQ clarification with HR');
            setDescription('Need more information about an FAQ topic.');
        }
        const matchedEmployee = selectableEmployees.find(emp => String(emp.id) === requestedEmployeeId)
            || selectableEmployees.find(emp => requestedEmployeeName && emp.name?.trim().toLowerCase() === requestedEmployeeName.trim().toLowerCase());
        if (matchedEmployee) {
            setEmployeeId(String(matchedEmployee.id));
            setIsModalOpen(true);
        } else if (requestedDescription || requestedAction === 'schedule') {
            setIsModalOpen(true);
        }
    }, [selectableEmployees, searchParams, isFaqHrMeeting, title]);

    const fetchMeetings = async () => {
        try {
            let statuses = '';
            if (isHistoryOnlyView) {
                statuses = subStatus === 'ALL' ? 'COMPLETED,CANCELLED' : subStatus;
            } else {
                if (activeTab === 'UPCOMING') statuses = 'PENDING,ACCEPTED,RESCHEDULE_REQUESTED,RESCHEDULE_MGR,CANCEL_REQUESTED';
                if (activeTab === 'ONGOING') statuses = 'ONGOING';
                if (activeTab === 'COMPLETED') {
                    if (subStatus === 'ALL') statuses = 'COMPLETED,CANCELLED';
                    else statuses = subStatus;
                }
            }

            let url = isHistoryOnlyView
                ? `/meetings/history?page=${page}&size=${pageSize}&sortBy=${sortBy}`
                : `/meetings/manager?statuses=${statuses}&page=${page}&size=${pageSize}&sortBy=${sortBy}`;
            if (statuses) url += `&statuses=${statuses}`;
            if (searchName) url += `&searchName=${encodeURIComponent(searchName)}`;
            if (selectedDept) url += `&departmentId=${selectedDept}`;
            if (activeTab === 'COMPLETED' || isHistoryOnlyView) {
                if (fromDate) url += `&fromDate=${new Date(fromDate).toISOString()}`;
                if (toDate) url += `&toDate=${new Date(toDate).toISOString()}`;
            }

            if (isHrView && hrSection === 'schedule' && activeTab !== 'COMPLETED') {
                let employeeUrl = `/meetings/employee?statuses=${statuses}&page=${page}&size=${pageSize}&sortBy=${sortBy}`;
                if (searchName) employeeUrl += `&searchName=${encodeURIComponent(searchName)}`;
                if (selectedDept) employeeUrl += `&departmentId=${selectedDept}`;

                const [managerResp, employeeResp] = await Promise.all([axios.get(url), axios.get(employeeUrl)]);
                const managerMeetings = (managerResp.data.data.content || []).map((meeting: any) => ({
                    ...meeting,
                    perspective: 'manager',
                }));
                const employeeMeetings = (employeeResp.data.data.content || []).map((meeting: any) => ({
                    ...meeting,
                    perspective: 'employee',
                }));
                const mergedMeetings = Array.from(
                    new Map([...managerMeetings, ...employeeMeetings].map((meeting) => [meeting.id, meeting])).values(),
                ).sort((a, b) => {
                    const aTime = new Date(a.scheduledTime || a.meetingTime || '').getTime();
                    const bTime = new Date(b.scheduledTime || b.meetingTime || '').getTime();
                    return sortBy === 'oldest' ? aTime - bTime : bTime - aTime;
                });
                setMeetings(mergedMeetings);
                setTotalPages(Math.max(managerResp.data.data.totalPages || 0, employeeResp.data.data.totalPages || 0));
                return;
            }

            const resp = await axios.get(url);
            setMeetings((resp.data.data.content || []).map((meeting: any) => ({ ...meeting, perspective: 'manager' })));
            setTotalPages(resp.data.data.totalPages || 0);
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to load meetings';
            toast.error(errorMsg);
        }
    };

    const fetchEligibleEmployees = async () => {
        try {
            const resp = await axios.get(isFaqHrMeeting ? '/meetings/hr-employees' : '/meetings/eligible-employees');
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

    const closeScheduleModal = () => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('action');
        nextParams.delete('employeeId');
        nextParams.delete('employeeName');
        nextParams.delete('meetingTitle');
        nextParams.delete('meetingDescription');
        setSearchParams(nextParams);
        setIsModalOpen(false);
    };

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        const scheduledTimeValue = toLocalDateTimeValue(scheduledTime);
        if (!scheduledTimeValue) {
            toast.error('Date & Time must be in dd/mm/yyyy HH:mm format');
            return;
        }
        try {
            const payload = {
                employeeId: parseInt(employeeId),
                title,
                description,
                scheduledTime: new Date(scheduledTimeValue).toISOString(),
                durationMinutes
            };
            await axios.post('/meetings', payload);
            toast.success('Meeting scheduled successfully');
            setIsModalOpen(false);
            setEmployeeId('');
            setTitle('');
            setDescription('');
            setScheduledTime('');
            setDurationMinutes(45);
            navigate(meetingsPagePath, { replace: true });
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

    const handleAccept = async (id: number) => {
        try {
            await axios.put(`/meetings/${id}/accept`);
            toast.success('Meeting accepted');
            fetchMeetings();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to accept meeting');
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
        <div className="meetings-theme max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                        {isHistoryOnlyView ? 'Meeting History' : isHrView ? 'Schedule Meeting' : 'Manager Meetings'}
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        {isHistoryOnlyView
                            ? 'Review completed and cancelled meetings across all departments'
                            : 'Schedule and manage 1-on-1 meetings with your subordinates'}
                    </p>
                </div>
                {canManageMeetings && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#2463eb] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#1d4ed8] transition-colors shadow-sm"
                    >
                        <Plus size={18} /> Schedule Meeting
                    </button>
                )}
            </div>

            {canManageMeetings && (
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
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none"
                            />
                        </div>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-[#dbeafe] border-[#bfdbfe] text-[#2463eb]' : 'bg-white border-slate-200 text-slate-600 hover:border-[#2463eb] hover:text-[#2463eb]'}`}
                        >
                            <Filter size={20} />
                        </button>
                    </div>
                )}
            </div>
            )}

            {isHistoryOnlyView && (
                <div className="flex items-center gap-2 justify-end">
                    <div className="relative group flex-1 md:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                            placeholder="Search employee or manager..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-[#dbeafe] border-[#bfdbfe] text-[#2463eb]' : 'bg-white border-slate-200 text-slate-600 hover:border-[#2463eb] hover:text-[#2463eb]'}`}
                    >
                        <Filter size={20} />
                    </button>
                </div>
            )}

            {((activeTab === 'COMPLETED' && canManageMeetings) || isHistoryOnlyView) && showFilters && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status / Type</label>
                        <select 
                            value={subStatus}
                            onChange={(e) => { setSubStatus(e.target.value); setPage(0); }}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#2463eb]"
                        >
                            <option value="ALL">{isHistoryOnlyView ? 'All completed/cancelled' : 'All (History)'}</option>
                            <option value="COMPLETED">Completed Only</option>
                            <option value="CANCELLED">Cancelled Only</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Department</label>
                        <select
                            value={selectedDept}
                            onChange={(e) => { setSelectedDept(e.target.value); setPage(0); }}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#2463eb]"
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
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#2463eb]"
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <div className="flex-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">To Date</label>
                            <input 
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#2463eb]"
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
                        isHistoryOnlyView ||
                        (!isHrView && !isAuditView && (m.status === 'COMPLETED' || m.status === 'CANCELLED'));
                    const detailPath = isAuditView ? `/audit/meetings/${m.id}` : isHrView ? `/hr/meetings/${m.id}` : `/manager/meetings/${m.id}`;
                    const isInvitedMeeting = isHrView && m.perspective === 'employee';

                    return (
                    <div 
                        key={m.id} 
                        onClick={() => canOpenDetails && navigate(detailPath)}
                        className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between transition-all group ${canOpenDetails ? 'cursor-pointer hover:border-[#bfdbfe]' : 'hover:border-[#bfdbfe]'}`}
                    >
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-[#1d4ed8] transition-colors">{m.title}</h3>
                                    <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${m.status === 'CANCELLED' ? 'text-rose-500' : 'text-[#2463eb]'}`}>{m.status}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${m.status === 'CANCELLED' ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500 group-hover:bg-[#dbeafe] group-hover:text-[#2463eb]'}`}>
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

                        {activeTab !== 'COMPLETED' && canManageMeetings && (
                            <div className="space-y-4">
                                {isInvitedMeeting && m.status === 'PENDING' && (
                                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                        <p className="text-xs font-bold text-emerald-800 uppercase mb-1">Meeting Invitation</p>
                                        <p className="text-xs text-emerald-700 mb-3">Accept the meeting or propose another time.</p>
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); handleAccept(m.id); }} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors">Accept</button>
                                            <button onClick={(e) => { e.stopPropagation(); openRescheduleModal(m); }} className="flex-1 bg-white border border-emerald-200 text-emerald-700 py-2 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-colors">Reschedule</button>
                                        </div>
                                    </div>
                                )}

                                {!isInvitedMeeting && m.status === 'RESCHEDULE_REQUESTED' && (
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                        <p className="text-xs font-bold text-amber-800 uppercase mb-1">Reschedule Requested</p>
                                        <p className="text-sm text-amber-900 mb-2 font-medium">Proposed: {new Date(m.proposedTime).toLocaleString()}</p>
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={(e) => { e.stopPropagation(); handleAcceptReschedule(m.id); }} className="flex-1 bg-amber-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors">Confirm</button>
                                            <button onClick={(e) => { e.stopPropagation(); openRescheduleModal(m); }} className="flex-1 bg-white border border-amber-200 text-amber-700 py-2 rounded-lg text-xs font-bold hover:bg-amber-50 transition-colors">Propose</button>
                                        </div>
                                    </div>
                                )}

                                {isInvitedMeeting && m.status === 'RESCHEDULE_MGR' && (
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <p className="text-xs font-bold text-blue-800 uppercase mb-1">Reschedule Proposed</p>
                                        <p className="text-sm text-blue-900 mb-2 font-medium">Proposed: {new Date(m.proposedTime).toLocaleString()}</p>
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={(e) => { e.stopPropagation(); handleAcceptReschedule(m.id); }} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">Accept</button>
                                            <button onClick={(e) => { e.stopPropagation(); openRescheduleModal(m); }} className="flex-1 bg-white border border-blue-200 text-blue-700 py-2 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors">Propose</button>
                                        </div>
                                    </div>
                                )}

                                {!isInvitedMeeting && m.status === 'CANCEL_REQUESTED' && (
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
                                    
                                    {activeTab === 'UPCOMING' && !isInvitedMeeting && m.status === 'ACCEPTED' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(m.id, 'ONGOING'); }}
                                            className="bg-[#2463eb] text-white px-4 py-2 rounded-xl hover:bg-[#1d4ed8] transition-all flex items-center gap-2 text-sm font-bold shadow-lg shadow-[#dbeafe]"
                                        >
                                            <Play size={16} /> Start
                                        </button>
                                    )}

                                    {activeTab === 'ONGOING' && !isInvitedMeeting && (
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
                        
                        {activeTab === 'COMPLETED' && canManageMeetings && (
                            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to view details</span>
                                <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 group-hover:text-[#2463eb] transition-all" />
                            </div>
                        )}

                        {isHistoryOnlyView && (
                            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to view details</span>
                                <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 group-hover:text-[#2463eb] transition-all" />
                            </div>
                        )}
                    </div>
                    );
                })}
            </div>

            {((activeTab === 'COMPLETED' && canManageMeetings) || isHistoryOnlyView) && totalPages > 1 && (
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
                                className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${page === i ? 'bg-[#2463eb] text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 border border-transparent'}`}
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
                            <button onClick={closeScheduleModal} className="text-slate-400 hover:text-white transition-colors">
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
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all"
                                >
                                    <option value="">
                                        {isFaqHrMeeting ? 'Select HR employee...' : 'Select a subordinate...'}
                                    </option>
                                    {selectableEmployees.length === 0 && (
                                        <option value="" disabled>
                                            {isFaqHrMeeting ? 'No HR employees available' : 'No employees available'}
                                        </option>
                                    )}
                                    {selectableEmployees.map(emp => (
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
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all"
                                    placeholder="e.g., Q2 Performance Review"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Date & Time</label>
                                <div className="relative">
                                    <input
                                        required
                                        type="text"
                                        placeholder="dd/mm/yyyy HH:mm"
                                        inputMode="numeric"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm font-semibold focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => openDateTimePicker(schedulePickerRef.current)}
                                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 hover:text-[#2463eb]"
                                        aria-label="Choose meeting date and time"
                                    >
                                        <Calendar size={18} />
                                        <input
                                            ref={schedulePickerRef}
                                            type="datetime-local"
                                            min={minDateTime}
                                            value={toLocalDateTimeValue(scheduledTime)}
                                            onChange={(e) => setScheduledTime(toDisplayDateTimeFromLocal(e.target.value))}
                                            className="pointer-events-none absolute h-px w-px opacity-0"
                                            tabIndex={-1}
                                            aria-hidden="true"
                                        />
                                    </button>
                                </div>
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
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Description / Agenda</label>
                                <textarea 
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all resize-none"
                                    placeholder="Brief agenda or topics to discuss..."
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full bg-[#2463eb] text-white py-3 rounded-xl font-black uppercase tracking-wider text-sm hover:bg-[#1d4ed8] transition-colors shadow-md mt-2"
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
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Reason</label>
                                <textarea 
                                    required
                                    rows={4}
                                    value={rescheduleReason}
                                    onChange={(e) => setRescheduleReason(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all resize-none"
                                    placeholder="Explain why you are proposing a new time..."
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full bg-[#2463eb] text-white py-3 rounded-xl font-black uppercase tracking-wider text-sm hover:bg-[#1d4ed8] transition-colors shadow-md mt-2"
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
                                <CheckCircle size={24} className="text-[#93c5fd]" />
                                <h2 className="text-xl font-black uppercase tracking-tight">End Meeting & Finalize</h2>
                            </div>
                            <button onClick={() => setIsEndModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleFinishSubmit} className="p-6 space-y-5">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                    Are you sure you want to end this meeting? This will mark the meeting as <span className="font-bold text-[#2463eb]">COMPLETED</span> and record the actual end time.
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Final Summary Notes</label>
                                <textarea 
                                    required
                                    rows={5}
                                    value={summaryNotes}
                                    onChange={(e) => setSummaryNotes(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all resize-none shadow-inner"
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
                                    className="flex-[2] bg-[#2463eb] text-white py-3.5 rounded-xl font-black uppercase tracking-wider text-sm hover:bg-[#1d4ed8] transition-colors shadow-lg shadow-[#dbeafe] flex items-center justify-center gap-2"
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
