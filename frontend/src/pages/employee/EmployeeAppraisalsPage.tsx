import React, { useState, useEffect } from 'react';
import axios from '../../app/axiosInstance';
import { 
    FileText, 
    ChevronRight, 
    Calendar, 
    ShieldCheck, 
    Building2,
    Search,
    ArrowRight,
    Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface AppraisalAssignment {
    id: number;
    period: { name: string; startDate: string; endDate: string };
    evaluator: { employeeName: string };
    status: string;
    totalScore: number;
    ratingCategory: string;
    updatedAt: string;
    template: { name: string };
}

export function EmployeeAppraisalsPage() {
    const [assignments, setAssignments] = useState<AppraisalAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get('/appraisal-assignments/my-assignments');
            // Only show those that are HR_APPROVED or similar, or all if we want to show progress
            setAssignments(response.data.data || []);
        } catch (error) {
            toast.error('Failed to load appraisals');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredAssignments = assignments.filter(a => 
        a.template?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.evaluator?.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'HR_APPROVED':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'SUBMITTED':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'PENDING_MANAGER':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            default:
                return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Appraisals</h1>
                    <p className="text-slate-500 font-medium text-xs mt-1">View your performance evaluations and feedback</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl">
                        <ShieldCheck size={18} className="text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                            {assignments.filter(a => a.status === 'HR_APPROVED').length} Completed
                        </span>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by period or evaluator..." 
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Assignments List */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading appraisals...</p>
                </div>
            ) : filteredAssignments.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredAssignments.map((assignment) => (
                        <div key={assignment.id} className="group bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500 overflow-hidden">
                            <div className="p-8 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-xl shadow-inner group-hover:scale-110 transition-transform">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                                                {assignment.template?.name || 'Performance Appraisal'}
                                            </h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                                <Calendar size={12} /> {assignment.period?.name || 'Current Cycle'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${getStatusStyle(assignment.status)}`}>
                                        {assignment.status.replace('_', ' ')}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                                            <Building2 size={14} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Evaluator</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-700">{assignment.evaluator?.employeeName || 'Assigned Manager'}</p>
                                    </div>
                                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                                            <ShieldCheck size={14} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Score Rate</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-700">
                                            {assignment.status === 'HR_APPROVED' ? `${assignment.totalScore?.toFixed(1) || '0.0'}%` : 'Pending'}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Updated</span>
                                        <span className="text-xs font-bold text-slate-600">
                                            {assignment.updatedAt ? new Date(assignment.updatedAt).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>

                                    {assignment.status === 'HR_APPROVED' ? (
                                        <Link 
                                            to={`/employee/appraisals/${assignment.id}/view`}
                                            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all"
                                        >
                                            View Report <ArrowRight size={16} />
                                        </Link>
                                    ) : (
                                        <div className="flex items-center gap-2 text-slate-400 px-4 py-3 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                                            <Lock size={14} /> Under Review
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-20 text-center space-y-6">
                    <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto">
                        <FileText size={48} className="text-slate-200" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800">No Appraisals Yet</h3>
                        <p className="text-slate-400 font-medium text-sm mt-2 max-w-xs mx-auto">
                            Your performance appraisals will appear here once they are initiated by HR.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
