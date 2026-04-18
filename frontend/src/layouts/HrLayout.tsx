import React from 'react';
import { 
  Users, 
  Target, 
  FileText, 
  Award, 
  MessageSquare, 
  Calendar, 
  BarChart, 
  LayoutDashboard,
  Bell,
  ChevronDown,
  ShieldCheck,
  Search,
  UserPlus,
  RefreshCcw,
  Zap,
  ClipboardList
} from 'lucide-react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { logout } from '../store/authSlice';

const HrLayout: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/hr/dashboard' },
    { icon: <Users size={20} />, label: 'Employees', path: '/hr/employees' },
    { icon: <Target size={20} />, label: 'KPI Management', path: '/hr/kpi-mgmt' },
    { icon: <ClipboardList size={20} />, label: 'Self Assessments', path: '/hr/assessments' },
    { icon: <ShieldCheck size={20} />, label: 'Assessment Questions', path: '/hr/assessment-subitems' },
    { icon: <Award size={20} />, label: 'Appraisals', path: '/hr/appraisals' },
    { icon: <RefreshCcw size={20} />, label: '360° Feedback', path: '/hr/360-feedback' },
    { icon: <Zap size={20} />, label: 'PIP Management', path: '/hr/pip' },
    { icon: <Calendar size={20} />, label: 'Meetings', path: '/hr/meetings' },
    { icon: <BarChart size={20} />, label: 'Reports', path: '/hr/reports' },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Brand Header */}
        <div className="p-6 bg-[#115e59] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
               <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight leading-none uppercase">EPMS</h1>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">Performance System</p>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="p-6 border-b border-slate-100">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold overflow-hidden">
                 {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                 <h4 className="text-sm font-bold text-slate-900 truncate uppercase mt-1">{user?.firstName} {user?.lastName}</h4>
                 <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase truncate">CEO</p>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase">HR</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className={isActive ? 'text-emerald-700' : 'text-slate-400'}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-400 hover:text-red-500 transition-colors"
            >
              <LayoutDashboard size={20} className="rotate-180" />
              Sign Out
           </button>
           <div className="mt-4 px-4 text-[9px] font-bold text-slate-300 uppercase letter-spacing-widest">
              EPMS v1.0 • 2026
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
           <div>
              <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
              <p className="text-xs font-bold text-slate-400 text-slate-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="relative group flex items-center bg-slate-100 rounded-full px-4 py-2 border border-transparent focus-within:border-emerald-200 focus-within:bg-white transition-all">
                 <Search size={18} className="text-slate-400" />
                 <input type="text" placeholder="Organizational search..." className="bg-transparent border-none focus:ring-0 text-sm font-medium ml-2 w-48" />
              </div>
              
              <button className="relative w-10 h-10 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-colors">
                 <Bell size={22} />
                 <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              
              <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                 <div className="text-right">
                    <p className="text-xs font-bold text-slate-900 truncate uppercase mt-1">{user?.firstName} {user?.lastName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">CEO</p>
                 </div>
                 <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                 </div>
                 <ChevronDown size={16} className="text-slate-400" />
              </div>
           </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default HrLayout;
