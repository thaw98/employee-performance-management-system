import React from 'react';
import { 
  Users, 
  RefreshCcw, 
  Zap, 
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface DeptData {
  name: string;
  value: number;
  color: string;
}

interface RatingData {
  range: string;
  count: number;
}

const deptData: DeptData[] = [];
const ratingData: RatingData[] = [];

export function HRDashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight text-xl">Dashboard</h1>
          <p className="text-slate-500 font-medium text-xs">Overview of organizational performance and activities</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Employees</p>
            <h3 className="text-3xl font-black text-slate-900">18</h3>
            <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1 flex items-center gap-1">
               <TrendingUp size={10} /> Active
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
             <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Reviews</p>
            <h3 className="text-3xl font-black text-slate-900">1</h3>
            <p className="text-[10px] font-bold text-amber-600 uppercase mt-1 flex items-center gap-1">
               <Clock size={10} /> Needs attention
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
             <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active PIPs</p>
            <h3 className="text-3xl font-black text-slate-900">1</h3>
            <p className="text-[10px] font-bold text-red-600 uppercase mt-1 flex items-center gap-1">
               <AlertCircle size={10} /> In progress
            </p>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-sm">
             <Zap size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Performance</p>
            <h3 className="text-3xl font-black text-slate-900">78.8</h3>
            <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1 flex items-center gap-1">
               <TrendingUp size={10} /> Out of 100
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
             <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Main Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Department Distribution */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
           <div>
              <h3 className="text-lg font-black text-slate-900">Department Distribution</h3>
              <p className="text-xs font-bold text-slate-400">Employee count by department</p>
           </div>
           
           <div className="h-80 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={deptData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={100}
                   paddingAngle={5}
                   dataKey="value"
                   label={({ name, value }) => `${name}: ${value}`}
                 >
                   {deptData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
           <div>
              <h3 className="text-lg font-black text-slate-900">Rating Distribution</h3>
              <p className="text-xs font-bold text-slate-400">Employee performance ratings across the organization</p>
           </div>

           <div className="h-80 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={ratingData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="range" tick={{ fontSize: 12, fontWeight: 700 }} />
                 <YAxis tick={{ fontSize: 12, fontWeight: 700 }} />
                 <Tooltip cursor={{ fill: '#f8fafc' }} />
                 <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                   {ratingData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={index === 2 ? '#ca8a04' : '#16a34a'} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};


