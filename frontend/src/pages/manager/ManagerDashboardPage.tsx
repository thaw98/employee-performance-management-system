import React from 'react';
import {
  Users,
  Calendar,
  Target,
  MessageSquare,
  TrendingUp,
  ExternalLink,
  FileText,
  Zap
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface PerformanceData {
  name: string;
  score: number;
}

interface TeamMember {
  name: string;
  role: string;
  status: string;
  score: number;
  initial: string;
  color: string;
}

const data: PerformanceData[] = [];
const teamMembers: TeamMember[] = [];

export function ManagerDashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manager Dashboard</h1>
          <p className="text-slate-500 font-medium">Monitor and manage your team's performance</p>
        </div>
        <div className="flex gap-3">
          <a href="/manager/assessments" className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 hover:shadow-md transition-all">
            <FileText size={14} className="text-blue-600" />
            Team Assessments
          </a>
          <a href="/manager/pip" className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-xl text-xs font-black text-white hover:shadow-lg transition-all">
            <Zap size={14} className="text-amber-400" />
            Team PIPs
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Team Size</p>
            <h3 className="text-3xl font-black text-slate-900">3</h3>
            <p className="text-[10px] font-bold text-amber-600 uppercase mt-1">Direct reports</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending 1-on-1s</p>
            <h3 className="text-3xl font-black text-slate-900">0</h3>
            <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">Scheduled meetings</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
            <Calendar size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Team Avg Score</p>
            <h3 className="text-3xl font-black text-slate-900">86.4</h3>
            <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">KPI average</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Feedback</p>
            <h3 className="text-3xl font-black text-slate-900">0%</h3>
            <p className="text-[10px] font-bold text-amber-600 uppercase mt-1">Completion rate</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-700 shadow-sm">
            <MessageSquare size={24} />
          </div>
        </div>
      </div>

      {/* Main Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-900">Team KPI Performance</h3>
              <p className="text-xs font-bold text-slate-400">Average KPI scores by team member</p>
            </div>
            <button className="text-slate-400 hover:text-slate-900 transition-colors">
              <ExternalLink size={18} />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                barSize={40}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="score" fill="#c2410c" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Members List */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-900">Team Members</h3>
              <p className="text-xs font-bold text-slate-400">Status of your direct reports</p>
            </div>
          </div>

          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member.name} className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-24 transition-all hover:shadow-md cursor-pointer border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${member.color} rounded-full flex items-center justify-center font-black text-xs`}>
                    {member.initial}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 leading-none mb-1 uppercase tracking-tight">{member.name}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{member.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900 tracking-tighter mb-1">{member.score}</p>
                  <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${member.status === 'SUBMITTED' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                    {member.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


