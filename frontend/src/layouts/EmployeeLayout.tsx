import React from 'react';
import {
  Target,
  FileText,
  MessageSquare,
  Calendar,
  LayoutDashboard,
  Bell,
  ChevronDown,
  ShieldCheck,
  Search,
  RefreshCcw,
  BellRing,
  Inbox
} from 'lucide-react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { logout } from '../store/authSlice';
import { ProfileDropdown } from '../components/layout/ProfileDropdown';

function initialsFromName(name: string | undefined) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const EmployeeLayout: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const [expandedMenus, setExpandedMenus] = React.useState<Record<string, boolean>>({});

  const toggleExpand = (label: string) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/employee/dashboard' },
    { icon: <Target size={20} />, label: 'My KPIs', path: '/employee/kpis' },
    { icon: <FileText size={20} />, label: 'Self Assessment', path: '/employee/assessment' },
    {
      icon: <RefreshCcw size={20} />,
      label: '360 Feedback',
      path: '/employee/360-feedback/give',
      subItems: [
        { label: 'Give Feedback', path: '/employee/360-feedback/give' },
        { label: 'Get Feedback', path: '/employee/360-feedback/received' },
        { label: 'Feedback History', path: '/employee/360-feedback/history' }
      ]
    },
    { icon: <Calendar size={20} />, label: 'Meetings', path: '/employee/meetings' },
    { icon: <BellRing size={20} />, label: 'Notifications', path: '/employee/notifications' },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-300">
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
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold overflow-hidden shadow-inner">
                 {initialsFromName(user?.name)}
              </div>
              <div className="flex-1 min-w-0">
                 <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate uppercase mt-1">{user?.name}</h4>
                 <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate">SE</p>
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[8px] font-black uppercase">EMPLOYEE</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 dark:bg-slate-900 transition-colors duration-300">
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.subItems && item.subItems.some((sub) => location.pathname.startsWith(sub.path)));

            if (item.subItems) {
              const isExpanded =
                expandedMenus[item.label] !== undefined ? expandedMenus[item.label] : isActive;

              return (
                <div key={item.label} className="space-y-1">
                  <div
                    className={`w-full flex items-center justify-between gap-2 rounded-xl text-sm font-bold transition-all ${isActive
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                  >
                    <Link to={item.path || '#'} className="flex-1 flex items-center gap-3 px-4 py-3">
                      <span className={isActive ? 'text-emerald-700' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleExpand(item.label);
                      }}
                      className="p-3 text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="pl-11 pr-4 space-y-1 mt-1">
                      {item.subItems.map((subItem) => {
                        const isSubActive = location.pathname === subItem.path;

                        return (
                          <Link
                            key={subItem.label}
                            to={subItem.path}
                            className={`block px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${isSubActive
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                              }`}
                          >
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
              >
                <span className={isActive ? 'text-emerald-700' : 'text-slate-400'}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <LayoutDashboard size={20} className="rotate-180" />
            Sign Out
          </button>
          <div className="mt-4 px-4 text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase transition-colors">
            EPMS v1.0 • 2026
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300">
        {/* Top Header */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between transition-colors duration-300">
           <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h2>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="relative group flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 border border-transparent focus-within:border-emerald-200 dark:focus-within:border-emerald-900/50 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
                 <Search size={18} className="text-slate-400 dark:text-slate-500" />
                 <input type="text" placeholder="Search..." className="bg-transparent border-none focus:ring-0 text-sm font-medium ml-2 w-48 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600" />
              </div>
              
              <button className="relative w-10 h-10 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                 <Bell size={22} />
                 <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              </button>
              
              <ProfileDropdown />
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

export default EmployeeLayout;
