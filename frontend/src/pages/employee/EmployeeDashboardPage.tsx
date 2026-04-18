import React from 'react';
import {
  Target,
  FileText,
  MessageSquare,
  Calendar,
  ChevronRight,
} from 'lucide-react';

interface KPI {
  name: string;
  score: number;
  target: string;
  category: string;
  progress: number;
}

const kpis: KPI[] = [];

export function EmployeeDashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Dashboard</h1>
          <p className="text-slate-500 font-medium text-xs">Track your performance, assessments, and feedback</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">My KPI Score</p>
            <h3 className="text-3xl font-black text-slate-900">87.3</h3>
            <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">Weighted: 87.5</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
            <Target size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Self Assessment</p>
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Submitted</h3>
            <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">✓ Submitted</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
            <FileText size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Feedback</p>
            <h3 className="text-3xl font-black text-slate-900">1</h3>
            <p className="text-[10px] font-bold text-amber-600 uppercase mt-1">To complete</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
            <MessageSquare size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Upcoming Meetings</p>
            <h3 className="text-3xl font-black text-slate-900">1</h3>
            <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">Scheduled</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
            <Calendar size={24} />
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-slate-900">My KPIs</h3>
            <p className="text-xs font-bold text-slate-400">Current period performance indicators</p>
          </div>
          <button className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 transition-colors border border-slate-200 px-3 py-1.5 rounded-lg">
            View All <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {kpis.map((kpi) => (
            <div key={kpi.name} className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="text-sm font-black text-slate-800 tracking-tight">{kpi.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-black text-slate-500">{kpi.target}</span> • {kpi.category}
                  </p>
                </div>
                <div className="text-emerald-600 font-black text-lg tracking-tighter">
                  {kpi.score}
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-slate-900 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${kpi.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


