import React from 'react';
import {
  Users,
  User,
  Target,
  Award,
  Calendar,
  BarChart,
  LayoutDashboard,
  ChevronDown,
  ShieldCheck,
  Search,
  Zap,
  RefreshCcw,
  Send,
  Inbox,
  History,
  FileText,
  ListChecks,
  SlidersHorizontal,
  Settings,
  PenLine,
  ClipboardList,
  ClipboardCheck,
} from 'lucide-react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { logout } from '../features/auth/authSlice';
import { resolveProfilePictureSrc } from '../utils/mediaUrl';
import { useGetProfileQuery } from '../features/user/userApi';
import { pipApi } from '../features/pip/pipApi';
import { ProfileDropdown } from '../components/layout/ProfileDropdown';
import { NotificationBell } from '../components/common/NotificationBell';
import { usePersistentSidebarCollapse } from '../components/layout/usePersistentSidebarCollapse';

const ManagerLayout: React.FC = () => {
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const { data: profileResponse } = useGetProfileQuery();
  const user = profileResponse?.data || authUser;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const prefetchPips = pipApi.usePrefetch('getPips');
  const { isSidebarCollapsed, toggleSidebarCollapsed } = usePersistentSidebarCollapse(user);
  const roleLabel = (user?.role || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase()) || 'Manager';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const [expandedMenus, setExpandedMenus] = React.useState<Record<string, boolean>>({});

  const toggleExpand = (label: string) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/manager/dashboard' },
    ...(authUser?.roleId === 2
      ? [{ icon: <Users size={20} />, label: 'Employees', path: '/manager/employees' }]
      : []),
    {
      icon: <Target size={20} />,
      label: 'KPI',
      path: '/manager/kpis',
      subItems: [
        { label: 'KPIs', path: '/manager/kpis', icon: <ListChecks size={16} className="shrink-0" /> },
        { label: 'My KPIs', path: '/manager/my-kpis', icon: <User size={16} className="shrink-0" /> }
      ]
    },
    { icon: <Zap size={20} />, label: 'Team PIPs', path: '/manager/pip' },
    { icon: <Award size={20} />, label: 'Appraisals', path: '/manager/appraisals' },
    {
      icon: <FileText size={20} />,
      label: 'Self-Assessment',
      path: '/manager/self-assessment/templates',
      subItems: [
        { label: 'Templates', path: '/manager/self-assessment/templates', icon: <SlidersHorizontal size={16} className="shrink-0" /> },
        { label: 'My Form', path: '/manager/self-assessment-forms/my-form', icon: <ClipboardCheck size={16} className="shrink-0" /> },
        { label: 'Assigned Forms', path: '/manager/self-assessment/forms', icon: <ClipboardList size={16} className="shrink-0" /> },
        { label: 'Review Submissions', path: '/manager/self-assessment-forms/review-queue', icon: <ListChecks size={16} className="shrink-0" /> },
        { label: 'History', path: '/manager/self-assessment-forms/history', icon: <History size={16} className="shrink-0" /> }
      ]
    },
    {
      icon: <RefreshCcw size={20} />,
      label: '360 Feedback',
      path: '/manager/360-feedback/give',
      subItems: [
        { label: 'Give Feedback', path: '/manager/360-feedback/give', icon: <Send size={16} className="shrink-0" /> },
        { label: 'Get Feedback', path: '/manager/360-feedback/received', icon: <Inbox size={16} className="shrink-0" /> },
        { label: 'Feedback History', path: '/manager/360-feedback/history', icon: <History size={16} className="shrink-0" /> }
      ]
    },
    ...(authUser?.roleId !== 2
      ? [{
          icon: <Settings size={20} />,
          label: 'Settings',
          path: '/manager/settings/signature',
          subItems: [
            { label: 'Signature', path: '/manager/settings/signature', icon: <PenLine size={16} className="shrink-0" /> },
            { label: 'System', path: '/manager/settings/system', icon: <Settings size={16} className="shrink-0" /> },
          ]
        }]
      : []),
    { icon: <Calendar size={20} />, label: 'Meetings', path: '/manager/meetings' },
    {
      icon: <BarChart size={20} />,
      label: 'Reports',
      path: '/manager/reports',
      subItems: [
        { label: 'PIP Report', path: '/manager/reports', icon: <BarChart size={16} className="shrink-0" /> },
        { label: 'KPI Report', path: '/manager/reports/kpi', icon: <Target size={16} className="shrink-0" /> },
        { label: 'Feedback Report', path: '/manager/reports/feedback', icon: <RefreshCcw size={16} className="shrink-0" /> },
        { label: 'Self-Assessment Report', path: '/manager/reports/self-assessment', icon: <FileText size={16} className="shrink-0" /> },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-transparent font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300`}>
        {/* Brand Header */}
        <div className={`${isSidebarCollapsed ? 'p-4' : 'p-6'} bg-[#9a3412] text-white`}>
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between gap-3'}`}>
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 transition-colors hover:bg-white/30"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ShieldCheck size={24} />
            </button>
            {!isSidebarCollapsed && <div>
              <h1 className="font-black text-xl tracking-tight leading-none uppercase">EPMS</h1>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">Performance System</p>
            </div>}
          </div>
        </div>

        {/* User Profile Card */}
        <div className={`${isSidebarCollapsed ? 'p-4' : 'p-6'} border-b border-slate-100 dark:border-slate-800`}>
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold overflow-hidden shadow-inner shrink-0">
              {user?.profilePictureUrl ? (
                <img src={resolveProfilePictureSrc(user.profilePictureUrl)} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                user?.name?.charAt(0)
              )}
            </div>
            {!isSidebarCollapsed && <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate uppercase mt-1">{user?.name}</h4>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate">{roleLabel}</p>
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-[8px] font-black uppercase">MANAGER</span>
              </div>
            </div>}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`${isSidebarCollapsed ? 'p-3' : 'p-4'} flex-1 overflow-y-auto space-y-1 dark:bg-slate-900 transition-colors duration-300`}>
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.subItems &&
                item.subItems.some(
                  (sub) =>
                    location.pathname === sub.path || location.pathname.startsWith(`${sub.path}/`),
                ));

            if (item.subItems) {
              const isExpanded =
                expandedMenus[item.label] !== undefined ? expandedMenus[item.label] : isActive;

              return (
                <div key={item.label} className="space-y-1">
                  <div
                    className={`w-full flex items-center justify-between gap-2 rounded-xl text-sm font-bold transition-all ${isActive
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                  >
                    <Link
                      to={item.path || '#'}
                      title={item.label}
                      className={`${isSidebarCollapsed ? 'h-12 w-full justify-center px-0' : 'flex-1 gap-3 px-4 py-3'} flex items-center`}
                    >
                      <span className={`${isActive ? 'text-amber-700' : 'text-slate-400'} flex h-5 w-5 shrink-0 items-center justify-center`}>
                        {item.icon}
                      </span>
                      {!isSidebarCollapsed && item.label}
                    </Link>

                    {!isSidebarCollapsed && <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleExpand(item.label);
                      }}
                      className="p-3 text-slate-400 hover:text-amber-600 transition-colors"
                    >
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>}
                  </div>

                  {isExpanded && !isSidebarCollapsed && (
                    <div className="pl-7 pr-3 space-y-1 mt-1">
                      {item.subItems.map((subItem) => {
                        const isReportRoot = subItem.path === '/manager/reports';
                        const isSubActive = isReportRoot
                          ? location.pathname === subItem.path
                          : location.pathname === subItem.path ||
                            location.pathname.startsWith(`${subItem.path}/`);

                        return (
                          <Link
                            key={subItem.label}
                            to={subItem.path}
                            className={`flex items-center gap-2.5 pl-2 pr-2.5 py-2 text-sm font-semibold rounded-lg transition-colors ${isSubActive
                              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                              }`}
                          >
                            <span className={isSubActive ? 'text-amber-800 dark:text-amber-300' : 'text-slate-400'}>
                              {subItem.icon}
                            </span>
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
                title={item.label}
                onMouseEnter={item.path === '/manager/pip' ? () => prefetchPips() : undefined}
                onFocus={item.path === '/manager/pip' ? () => prefetchPips() : undefined}
                className={`flex items-center ${isSidebarCollapsed ? 'h-12 justify-center px-0' : 'gap-3 px-4 py-3'} rounded-xl text-sm font-bold transition-all ${isActive
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
              >
                <span className={`${isActive ? 'text-amber-700' : 'text-slate-400'} flex h-5 w-5 shrink-0 items-center justify-center`}>{item.icon}</span>
                {!isSidebarCollapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`${isSidebarCollapsed ? 'p-3' : 'p-4'} border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300`}>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors`}
          >
            <LayoutDashboard size={20} className="rotate-180" />
            {!isSidebarCollapsed && 'Sign Out'}
          </button>
          {!isSidebarCollapsed && <div className="mt-4 px-4 text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase transition-colors">
            EPMS v1.0 • 2026
          </div>}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-transparent transition-colors duration-300">
        {/* Top Header */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between transition-colors duration-300">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h2>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 border border-transparent focus-within:border-amber-200 dark:focus-within:border-amber-900/50 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
              <Search size={18} className="text-slate-400 dark:text-slate-500" />
              <input type="text" placeholder="Quick find..." className="bg-transparent border-none focus:ring-0 text-sm font-medium ml-2 w-48 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600" />
            </div>

            <NotificationBell />

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

export default ManagerLayout;
