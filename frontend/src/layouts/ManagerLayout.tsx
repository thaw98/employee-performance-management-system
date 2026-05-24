import React from 'react';
import {
  Users,
  User,
  Target,
  Award,
  Calendar,
  BarChart,
  LayoutDashboard,
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
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { useGetProfileQuery } from '../features/user/userApi';
import { pipApi } from '../features/pip/pipApi';
import { DashLayoutShell } from '../components/layout/DashLayoutShell';
import type { DashMenuItem } from '../components/layout/DashMenuNav';

const ManagerLayout: React.FC = () => {
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const { data: profileResponse } = useGetProfileQuery();
  const user = profileResponse?.data || authUser;
  const prefetchPips = pipApi.usePrefetch('getPips');

  const menuItems: DashMenuItem[] = [
    { label: 'Dashboard', path: '/manager/dashboard', icon: <LayoutDashboard size={18} /> },
    ...(authUser?.roleId === 2
      ? [{ label: 'Employees', path: '/manager/employees', icon: <Users size={18} /> }]
      : []),
    {
      label: 'KPI',
      path: '/manager/kpis',
      icon: <Target size={18} />,
      subItems: [
        { label: 'KPIs', path: '/manager/kpis', icon: <ListChecks size={16} /> },
        { label: 'My KPIs', path: '/manager/my-kpis', icon: <User size={16} /> },
      ],
    },
    {
      label: 'Team PIPs',
      path: '/manager/pip',
      icon: <Zap size={18} />,
      onMouseEnter: () => prefetchPips(),
      onFocus: () => prefetchPips(),
    },
    { label: 'Appraisals', path: '/manager/appraisals', icon: <Award size={18} /> },
    {
      label: 'Self-Assessment',
      path: '/manager/self-assessment/templates',
      icon: <FileText size={18} />,
      subItems: [
        { label: 'Templates', path: '/manager/self-assessment/templates', icon: <SlidersHorizontal size={16} /> },
        { label: 'My Form', path: '/manager/self-assessment-forms/my-form', icon: <ClipboardCheck size={16} /> },
        { label: 'Assigned Forms', path: '/manager/self-assessment/forms', icon: <ClipboardList size={16} /> },
        { label: 'Review Submissions', path: '/manager/self-assessment-forms/review-queue', icon: <ListChecks size={16} /> },
        { label: 'History', path: '/manager/self-assessment-forms/history', icon: <History size={16} /> },
      ],
    },
    {
      label: '360 Feedback',
      path: '/manager/360-feedback/give',
      icon: <RefreshCcw size={18} />,
      subItems: [
        { label: 'Give Feedback', path: '/manager/360-feedback/give', icon: <Send size={16} /> },
        { label: 'Get Feedback', path: '/manager/360-feedback/received', icon: <Inbox size={16} /> },
        { label: 'Feedback History', path: '/manager/360-feedback/history', icon: <History size={16} /> },
      ],
    },
    ...(authUser?.roleId !== 2
      ? [{
          label: 'Settings',
          path: '/manager/settings/signature',
          icon: <Settings size={18} />,
          subItems: [
            { label: 'Signature', path: '/manager/settings/signature', icon: <PenLine size={16} /> },
            { label: 'System', path: '/manager/settings/system', icon: <Settings size={16} /> },
          ],
        }]
      : []),
    { label: 'Meetings', path: '/manager/meetings', icon: <Calendar size={18} /> },
    {
      label: 'Reports',
      path: '/manager/reports',
      icon: <BarChart size={18} />,
      isActive: (pathname) => pathname.startsWith('/manager/reports'),
      isSubActive: (subPath, pathname) => {
        if (subPath === '/manager/reports') return pathname === subPath;
        return pathname === subPath || pathname.startsWith(`${subPath}/`);
      },
      subItems: [
        { label: 'PIP Report', path: '/manager/reports', icon: <BarChart size={16} /> },
        { label: 'KPI Report', path: '/manager/reports/kpi', icon: <Target size={16} /> },
        { label: 'Feedback Report', path: '/manager/reports/feedback', icon: <RefreshCcw size={16} /> },
        { label: 'Self-Assessment Report', path: '/manager/reports/self-assessment', icon: <FileText size={16} /> },
      ],
    },
  ];

  return (
    <DashLayoutShell
      brandTitle="EPMS"
      brandSubtitle="Performance System"
      menuItems={menuItems}
      user={user}
      searchPlaceholder="Quick find..."
    >
      <Outlet />
    </DashLayoutShell>
  );
};

export default ManagerLayout;
