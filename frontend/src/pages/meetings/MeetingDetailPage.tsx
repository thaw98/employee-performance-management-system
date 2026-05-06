import React, { useState, useEffect } from 'react';
import axios from '../../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Send, MessageSquare, Clock, User, 
    Calendar, CheckCircle, XCircle, Timer, History, 
    PlayCircle, StopCircle, ClipboardList, Info
} from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';

export function MeetingDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const [meeting, setMeeting] = useState<any>(null);
    const [notes, setNotes] = useState<any[]>([]);
    const [newNote, setNewNote] = useState('');
    const [duration, setDuration] = useState<string>('00:00:00');

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    useEffect(() => {
        if (id) {
            fetchMeetingDetails();
            fetchNotes();
        }
    }, [id]);

    useEffect(() => {
        let interval: any;
        if (meeting?.status === 'ONGOING' && meeting?.actualStartTime) {
            const updateDuration = () => {
                const startTime = meeting.actualStartTime;
                if (!startTime) return;

                const start = new Date(startTime).getTime();
                const now = new Date().getTime();
                const diff = Math.max(0, now - start);
                
                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                
                setDuration(
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                );
            };
            
            updateDuration();
            interval = setInterval(updateDuration, 1000);
        } else if (meeting?.status === 'COMPLETED' && meeting?.actualStartTime && meeting?.actualEndTime) {
            const start = new Date(meeting.actualStartTime).getTime();
            const end = new Date(meeting.actualEndTime).getTime();
            const diff = end - start;
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            setDuration(`${mins}m ${secs}s`);
        } else {
            setDuration('00:00:00');
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [meeting?.status, meeting?.actualStartTime, meeting?.actualEndTime]);

    const fetchMeetingDetails = async () => {
        try {
            const resp = await axios.get(`/meetings/${id}`);
            setMeeting(resp.data.data);
        } catch (err) {
            toast.error('Failed to load meeting details');
        }
    };

    const fetchNotes = async () => {
        try {
            const resp = await axios.get(`/meetings/${id}/notes`);
            setNotes(resp.data.data || []);
        } catch (err) {
            toast.error('Failed to load notes');
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;
        try {
            await axios.post(`/meetings/${id}/notes`, { content: newNote });
            setNewNote('');
            fetchNotes();
            toast.success('Note added');
        } catch (err) {
            toast.error('Failed to add note');
        }
    };

    const handleFinishMeeting = async () => {
        if (!window.confirm('Are you sure you want to finish this meeting? This will close all meeting notes.')) return;
        try {
            await axios.put(`/meetings/${id}/finish`);
            toast.success('Meeting finished');
            fetchMeetingDetails();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to finish meeting');
        }
    };

    if (!meeting) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold animate-pulse">Loading meeting details...</p>
        </div>
    );

    const managerNotes = notes.filter(n => n.noteType === 'MANAGER_NOTE');
    const employeeNotes = notes.filter(n => n.noteType === 'EMPLOYEE_NOTE');
    const isManager = user?.id === meeting.managerUserId;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4">
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm"
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="flex items-center gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        meeting.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        meeting.status === 'ONGOING' ? 'bg-blue-100 text-blue-700 border border-blue-200 animate-pulse' :
                        meeting.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                        {meeting.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Header Card */}
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100px] -mr-10 -mt-10 opacity-50"></div>
                        <div className="relative">
                            <div className="flex items-center gap-2 text-emerald-600 mb-4">
                                <ClipboardList size={18} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Meeting Details</span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-6">{meeting.title}</h1>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Participants</p>
                                            <p className="text-sm font-bold text-slate-700">{meeting.managerName} & {meeting.employeeName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scheduled</p>
                                            <p className="text-sm font-bold text-slate-700">{formatDateTime(meeting.scheduledTime)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                            <Timer size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
                                            <p className="text-sm font-bold text-slate-700">{meeting.durationMinutes} minutes (Planned)</p>
                                        </div>
                                    </div>
                                    {meeting.departmentName && (
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Info size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</p>
                                                <p className="text-sm font-bold text-slate-700">{meeting.departmentName}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline & Stats Card */}
                    {(meeting.status === 'COMPLETED' || meeting.status === 'ONGOING' || meeting.status === 'CANCELLED') && (
                        <div className={`p-8 rounded-[32px] shadow-xl border ${meeting.status === 'CANCELLED' ? 'bg-rose-950/20 border-rose-900/30' : 'bg-slate-900 border-slate-800'} text-white`}>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    {meeting.status === 'CANCELLED' ? <XCircle className="text-rose-400" size={20} /> : <History className="text-emerald-400" size={20} />}
                                    <h3 className="font-black uppercase tracking-widest text-sm">{meeting.status === 'CANCELLED' ? 'Cancellation Details' : 'Meeting Timeline'}</h3>
                                </div>
                                {meeting.status === 'ONGOING' ? (
                                    <div className="flex items-center gap-3 bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                                        <span className="text-emerald-400 font-black text-xs uppercase tracking-widest">Live: {duration}</span>
                                    </div>
                                ) : (
                                    <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                                        <span className="text-slate-400 font-black text-xs uppercase tracking-widest">Total: {duration}</span>
                                    </div>
                                )}
                            </div>

                            <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-700">
                                <div className="relative">
                                    <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-slate-700 border-4 border-slate-900"></div>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                        <div>
                                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Scheduled Start</p>
                                            <p className="text-sm font-bold">{formatDateTime(meeting.scheduledTime)}</p>
                                        </div>
                                    </div>
                                </div>

                                {meeting.actualStartTime && (
                                    <div className="relative">
                                        <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Actual Start</p>
                                                <p className="text-sm font-bold">{formatDateTime(meeting.actualStartTime)}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 bg-white/5 px-3 py-1 rounded-lg">
                                                <PlayCircle size={12} />
                                                STARTED
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {meeting.actualEndTime && (
                                    <div className="relative">
                                        <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-rose-500 border-4 border-slate-900"></div>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-black text-rose-500 uppercase tracking-widest">Actual End</p>
                                                <p className="text-sm font-bold">{formatDateTime(meeting.actualEndTime)}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 bg-white/5 px-3 py-1 rounded-lg">
                                                <StopCircle size={12} />
                                                FINISHED
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {meeting.status === 'CANCELLED' && meeting.cancellationReason && (
                                    <div className="relative">
                                        <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-rose-600 border-4 border-slate-900 shadow-[0_0_10px_rgba(225,29,72,0.5)]"></div>
                                        <div>
                                            <p className="text-xs font-black text-rose-400 uppercase tracking-widest">Cancelled</p>
                                            <p className="text-sm font-bold mt-1">Reason: <span className="text-slate-300 font-medium italic">"{meeting.cancellationReason}"</span></p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {isManager && meeting.status === 'ONGOING' && (
                                <button 
                                    onClick={handleFinishMeeting}
                                    className="w-full mt-10 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-[20px] font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-3"
                                >
                                    <CheckCircle size={20} /> End Meeting & Save Notes
                                </button>
                            )}
                        </div>
                    )}

                    {/* Description Section */}
                    {meeting.description && (
                        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-400 mb-4">
                                <MessageSquare size={16} />
                                <h3 className="text-[10px] font-black uppercase tracking-widest">Agenda / Notes</h3>
                            </div>
                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm font-medium">{meeting.description}</p>
                        </div>
                    )}
                </div>

                {/* Sidebar Column: Notes */}
                <div className="space-y-8">
                    {/* Manager Notes */}
                    <div className="bg-indigo-50/50 p-6 rounded-[32px] border border-indigo-100 flex flex-col h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-tighter">Manager's Notes</h3>
                                    <p className="text-[10px] text-slate-400 font-bold">{meeting.managerName}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-indigo-200">
                            {managerNotes.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center opacity-40">
                                    <MessageSquare size={32} className="text-indigo-300 mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No notes yet</p>
                                </div>
                            )}
                            {managerNotes.map(note => (
                                <div key={note.id} className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
                                    <p className="text-slate-700 text-sm whitespace-pre-wrap font-medium">{note.content}</p>
                                    <p className="text-[10px] text-slate-400 mt-2 font-bold text-right">
                                        {formatDate(note.createdDate)} {new Date(note.createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {isManager && meeting.status !== 'COMPLETED' && (
                            <form onSubmit={handleAddNote} className="mt-4">
                                <div className="relative">
                                    <textarea
                                        value={newNote}
                                        onChange={e => setNewNote(e.target.value)}
                                        placeholder="Add a manager note..."
                                        className="w-full bg-white border border-indigo-100 rounded-2xl pl-4 pr-12 py-3 text-xs font-bold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none h-20 shadow-sm"
                                    />
                                    <button type="submit" className="absolute bottom-3 right-3 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-md">
                                        <Send size={14} />
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Employee Notes */}
                    <div className="bg-teal-50/50 p-6 rounded-[32px] border border-teal-100 flex flex-col h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-200">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-tighter">Employee's Notes</h3>
                                    <p className="text-[10px] text-slate-400 font-bold">{meeting.employeeName}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-teal-200">
                            {employeeNotes.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center opacity-40">
                                    <MessageSquare size={32} className="text-teal-300 mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No notes yet</p>
                                </div>
                            )}
                            {employeeNotes.map(note => (
                                <div key={note.id} className="bg-white p-4 rounded-2xl shadow-sm border border-teal-50">
                                    <p className="text-slate-700 text-sm whitespace-pre-wrap font-medium">{note.content}</p>
                                    <p className="text-[10px] text-slate-400 mt-2 font-bold text-right">
                                        {formatDate(note.createdDate)} {new Date(note.createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {!isManager && meeting.status !== 'COMPLETED' && (
                            <form onSubmit={handleAddNote} className="mt-4">
                                <div className="relative">
                                    <textarea
                                        value={newNote}
                                        onChange={e => setNewNote(e.target.value)}
                                        placeholder="Add an employee note..."
                                        className="w-full bg-white border border-teal-100 rounded-2xl pl-4 pr-12 py-3 text-xs font-bold outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none h-20 shadow-sm"
                                    />
                                    <button type="submit" className="absolute bottom-3 right-3 w-8 h-8 bg-teal-600 text-white rounded-xl flex items-center justify-center hover:bg-teal-700 transition-colors shadow-md">
                                        <Send size={14} />
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
