import React from 'react';
import {
  Users,
  Target,
  Award,
  Calendar,
  BarChart,
  LayoutDashboard,
  Building2,
  Briefcase,
  List,
  UserPlus,
  SlidersHorizontal,
  ListChecks,
  Inbox,
  ListFilter,
  Send,
  History,
  Layers,
  FileText,
  ClipboardList,
  HelpCircle,
  Zap,
  RefreshCcw,
} from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { useGetProfileQuery } from '../features/user/userApi';
import { pipApi } from '../features/pip/pipApi';
import { DashLayoutShell } from '../components/layout/DashLayoutShell';
import type { DashMenuItem } from '../components/layout/DashMenuNav';

function matchesPath(targetPath: string, pathname: string, search: string) {
  const [targetPathname, targetQuery] = targetPath.split('?');
  if (pathname !== targetPathname) return false;
  const currentParams = new URLSearchParams(search);
  if (!targetQuery) {
    return !currentParams.has('section') && !currentParams.has('action');
  }
  const targetParams = new URLSearchParams(targetQuery);
  return Array.from(targetParams.entries()).every(([key, value]) => currentParams.get(key) === value);
}

const HR_KPI_SECTION_PATHS = [
  '/hr/kpi-management',
  '/hr/kpi-assigned',
  '/hr/kpi-history',
  '/hr/kpi-audit-logs',
  '/hr/kpi-categories',
  '/hr/kpi-detail',
  '/hr/department-kpi-detail',
  '/hr/position-kpi-detail',
] as const;

function isHrKpiSection(pathname: string) {
  if (pathname.startsWith('/hr/kpi-reports')) return false;
  if (HR_KPI_SECTION_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  return pathname.startsWith('/hr/kpi');
}

const HrLayout: React.FC = () => {
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const { data: profileResponse } = useGetProfileQuery();
  const user = profileResponse?.data || authUser;
  const prefetchPips = pipApi.usePrefetch('getPips');

  const menuItems: DashMenuItem[] = [
    { label: 'Dashboard', path: '/hr/dashboard', icon: <LayoutDashboard size={18} /> },
    {
      label: 'Employee',
      path: '/hr/employees',
      icon: <Users size={18} />,
      subItems: [
        { label: 'Employee List', path: '/hr/employees', icon: <List size={16} /> },
        { label: 'Create Employee Account', path: '/hr/employees/create-account', icon: <UserPlus size={16} /> },
      ],
    },
    { label: 'Department', path: '/hr/departments', icon: <Building2 size={18} /> },
    { label: 'Positions', path: '/hr/positions', icon: <Briefcase size={18} /> },
    { label: 'Level Codes', path: '/hr/level-codes', icon: <Layers size={18} /> },
    {
      label: 'KPI',
      path: '/hr/kpi-management',
      icon: <Target size={18} />,
      isActive: (pathname) => isHrKpiSection(pathname),
      isSubActive: (subPath, pathname, search) => matchesPath(subPath, pathname, search),
      subItems: [
        { label: 'KPI Modeler', path: '/hr/kpi-management', icon: <SlidersHorizontal size={16} /> },
        { label: 'Assigned List', path: '/hr/kpi-assigned', icon: <ListChecks size={16} /> },
        { label: 'History', path: '/hr/kpi-history', icon: <History size={16} /> },
        { label: 'Audit Logs', path: '/hr/kpi-audit-logs', icon: <ClipboardList size={16} /> },
      ],
    },
    {
      label: 'Appraisals',
      path: '/hr/appraisals',
      icon: <Award size={18} />,
      subItems: [
        { label: 'Management', path: '/hr/appraisals', icon: <LayoutDashboard size={16} /> },
        { label: 'Review Submissions', path: '/hr/appraisals/submissions', icon: <Inbox size={16} /> },
      ],
    },
    {
      label: '360 Feedback',
      path: '/hr/360-feedback/criteria',
      icon: <RefreshCcw size={18} />,
      subItems: [
        { label: 'Criteria', path: '/hr/360-feedback/criteria', icon: <ListFilter size={16} /> },
        { label: 'Give Feedback', path: '/hr/360-feedback/give', icon: <Send size={16} /> },
        { label: 'Get Feedback', path: '/hr/360-feedback/received', icon: <Inbox size={16} /> },
        { label: 'Feedback History', path: '/hr/360-feedback/history', icon: <History size={16} /> },
      ],
    },
    {
      label: 'PIP',
      path: '/hr/pip-monitoring',
      icon: <Zap size={18} />,
      onMouseEnter: () => prefetchPips(),
      onFocus: () => prefetchPips(),
      subItems: [
        { label: 'PIP Management', path: '/hr/pip-monitoring', icon: <List size={16} /> },
        { label: 'PIP Note History', path: '/hr/pip-notes', icon: <FileText size={16} /> },
      ],
    },
    {
      label: 'Self-Assessment',
      path: '/hr/self-assessment/templates',
      icon: <FileText size={18} />,
      subItems: [
        { label: 'Template Management', path: '/hr/self-assessment/templates', icon: <SlidersHorizontal size={16} /> },
        { label: 'Assignments', path: '/hr/self-assessment/assignments', icon: <ClipboardList size={16} /> },
        { label: 'Assigned Forms', path: '/hr/self-assessment/forms', icon: <Inbox size={16} /> },
        { label: 'Review Submissions', path: '/hr/self-assessment/review-queue', icon: <ListChecks size={16} /> },
        { label: 'History', path: '/hr/self-assessment/history', icon: <History size={16} /> },
        { label: 'Audit Logs', path: '/hr/self-assessment/audit-logs', icon: <ClipboardList size={16} /> },
      ],
    },
    {
      label: 'Meetings',
      path: '/hr/meetings?section=schedule',
      icon: <Calendar size={18} />,
      subItems: [
        { label: 'Schedule Meeting', path: '/hr/meetings?section=schedule', icon: <Calendar size={16} /> },
        { label: 'Meeting History', path: '/hr/meetings?section=history', icon: <History size={16} /> },
      ],
    },
    {
      label: 'Reports',
      path: '/hr/reports',
      icon: <BarChart size={18} />,
      isActive: (pathname, search) => {
        const currentPath = `${pathname}${search}`;
        const isOwnActive = currentPath === '/hr/reports' || pathname === '/hr/reports';
        const hasActiveSub = [
          '/hr/reports',
          '/hr/kpi-reports',
          '/hr/reports/feedback',
          '/hr/reports/appraisal',
          '/hr/reports/self-assessment',
        ].some((p) => matchesPath(p, pathname, search) || (p !== '/hr/reports' && pathname.startsWith(p)));
        return isOwnActive || hasActiveSub;
      },
      isSubActive: (subPath, pathname, search) => matchesPath(subPath, pathname, search),
      subItems: [
        { label: 'PIP Report', path: '/hr/reports', icon: <Zap size={16} className="shrink-0" /> },
        { label: 'KPI Report', path: '/hr/kpi-reports', icon: <BarChart size={16} className="shrink-0" /> },
        { label: 'Feedback Report', path: '/hr/reports/feedback', icon: <RefreshCcw size={16} className="shrink-0" /> },
        { label: 'Appraisal Report', path: '/hr/reports/appraisal', icon: <Award size={16} className="shrink-0" /> },
        { label: 'Self-Assessment Report', path: '/hr/reports/self-assessment', icon: <FileText size={16} className="shrink-0" /> }
      ]
    },
    { icon: <HelpCircle size={20} />, label: 'FAQ Support', path: '/hr/settings/faq-support' }
  ];

  return (
    <DashLayoutShell
      brandTitle="EPMS"
      brandSubtitle="Performance System"
      menuItems={menuItems}
      user={user}
      searchPlaceholder="Organizational search..."
    >
      <Outlet />
    </DashLayoutShell>
  );
};

export default HrLayout;
