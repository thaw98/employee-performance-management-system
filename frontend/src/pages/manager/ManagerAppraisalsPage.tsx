import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { 
    Award, 
    Search, 
    Filter, 
    ChevronRight, 
    Clock, 
    User, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight,
    Building2,
    Calendar
} from 'lucide-react';

interface AppraisalAssignment {
    id: number;
    employee: {
        id: number;
        employeeId: string;
        employeeName: string;
        department?: { name: string };
        position?: { name: string };
    };
    period: {
        name: string;
        startDate: string;
        endDate: string;
    };
    status: string;
    totalScore?: number;
    ratingCategory?: string;
    updatedAt: string;
}

export const ManagerAppraisalsPage: React.FC = () => {
    const [assignments, setAssignments] = useState<AppraisalAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const resp = await axios.get('/appraisal-assignments/my-team');
            setAssignments(resp.data.data || []);
        } catch (err) {
            console.error("Failed to fetch assignments", err);
            toast.error("Failed to load appraisals");
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PENDING_MANAGER':
                return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'SUBMITTED':
                return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'HR_APPROVED':
                return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'REJECTED':
                return 'bg-red-50 text-red-600 border-red-100';
            default:
                return 'bg-slate-50 text-slate-400 border-slate-100';
        }
    };

    const filteredAssignments = assignments.filter(a => {
        const matchesSearch = a.employee.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             a.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                            <Award size={24} />
                        </div>
                        Team Appraisals
                    </h1>
                    <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">
                        Manage and fill out performance appraisals for your direct reports
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all font-medium text-sm"
                        />
                    </div>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                        {['ALL', 'PENDING_MANAGER', 'SUBMITTED'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {status.replace('PENDING_', '')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white h-64 rounded-[2rem] border border-slate-100 animate-pulse" />
                    ))}
                </div>
            ) : filteredAssignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-24 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200">
                        <AlertCircle size={40} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">No Appraisals Found</h3>
                        <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest max-w-xs mx-auto">
                            There are currently no appraisals assigned to you for review.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAssignments.map((assignment) => (
                        <div 
                            key={assignment.id}
                            className="group bg-white rounded-[2.5rem] border border-slate-100 p-6 hover:shadow-2xl hover:shadow-amber-100/50 hover:translate-y-[-8px] transition-all duration-500 relative overflow-hidden"
                        >
                            {/* Status Badge */}
                            <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight border ${getStatusStyle(assignment.status)}`}>
                                {assignment.status.replace('_', ' ')}
                            </div>

                            <div className="space-y-6">
                                {/* Employee Profile */}
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 font-black text-xl border border-slate-100 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                                        {assignment.employee.employeeName.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 uppercase tracking-tight group-hover:text-amber-600 transition-colors">
                                            {assignment.employee.employeeName}
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                            ID: {assignment.employee.employeeId}
                                        </p>
                                    </div>
                                </div>

                                {/* Dept & Position */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-50">
                                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                            <Building2 size={12} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Department</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-700 uppercase truncate">
                                            {assignment.employee.department?.name || 'General'}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-50">
                                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                            <Award size={12} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Position</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-700 uppercase truncate">
                                            {assignment.employee.position?.name || 'Staff'}
                                        </p>
                                    </div>
                                </div>

                                {/* Cycle Info */}
                                <div className="bg-amber-50/30 p-4 rounded-3xl border border-amber-100/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-amber-600">
                                            <Calendar size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Active Cycle</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-amber-500">{assignment.period.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="font-bold text-slate-400 uppercase">Deadline:</span>
                                        <span className="font-black text-slate-700 uppercase tracking-tighter italic">
                                            {new Date(assignment.period.endDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <Link 
                                    to={`/manager/appraisals/${assignment.id}/evaluate`}
                                    className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm ${
                                        assignment.status === 'PENDING_MANAGER'
                                        ? 'bg-slate-900 text-white hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-200'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    {assignment.status === 'PENDING_MANAGER' ? (
                                        <>
                                            Start Evaluation <ArrowRight size={14} />
                                        </>
                                    ) : (
                                        <>View Details <ChevronRight size={14} /></>
                                    )}
                                </Link>
                            </div>

                            {/* Background Decoration */}
                            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
