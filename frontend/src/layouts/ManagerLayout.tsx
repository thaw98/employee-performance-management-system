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
  Briefcase,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { useGetProfileQuery } from '../features/user/userApi';
import { pipApi } from '../features/pip/pipApi';
import { DashLayoutShell } from '../components/layout/DashLayoutShell';
import type { DashMenuSection } from '../components/layout/DashMenuNav';

const ManagerLayout: React.FC = () => {
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const { data: profileResponse } = useGetProfileQuery();
  const user = profileResponse?.data || authUser;
  const prefetchPips = pipApi.usePrefetch('getPips');

  const selfAssessmentTemplatesItem = {
    label: 'Templates',
    path: '/manager/self-assessment/templates',
    icon: <SlidersHorizontal size={16} />,
  };
  const selfAssessmentMyFormItem = {
    label: 'My Form',
    path: '/manager/self-assessment-forms/my-form',
    icon: <ClipboardCheck size={16} />,
  };
  const selfAssessmentSubItems = [
    ...(authUser?.roleId === 2
      ? [selfAssessmentMyFormItem, selfAssessmentTemplatesItem]
      : [selfAssessmentTemplatesItem, selfAssessmentMyFormItem]),
    { label: 'Assigned Forms', path: '/manager/self-assessment/forms', icon: <ClipboardList size={16} /> },
    { label: 'Review Submissions', path: '/manager/self-assessment-forms/review-queue', icon: <ListChecks size={16} /> },
    { label: 'History', path: '/manager/self-assessment-forms/history', icon: <History size={16} /> },
  ];

  const menuSections: DashMenuSection[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Overview', path: '/manager/dashboard', icon: <LayoutDashboard size={18} /> },
      ],
    },
    ...(authUser?.roleId === 2
      ? [{
          label: 'Organization',
          items: [
            { label: 'Employees', path: '/manager/employees', icon: <Users size={18} /> },
            { label: 'Positions', path: '/manager/positions', icon: <Briefcase size={18} /> },
            { label: 'Promotion Approvals', path: '/manager/promotions/approvals', icon: <ClipboardCheck size={18} /> },
          ],
        }]
      : []),
    {
      label: 'Performance',
      items: [
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
          label: 'Appraisals',
          path: '/manager/appraisals',
          icon: <Award size={18} />,
          subItems: [
            { label: 'Team Appraisals', path: '/manager/appraisals', icon: <ClipboardList size={16} /> },
            { label: 'History', path: '/manager/appraisals/history', icon: <History size={16} /> },
          ],
        },
        {
          label: '360 Feedback',
          path: '/manager/360-feedback/give',
          icon: <RefreshCcw size={18} />,
          subItems: [
            { label: 'Give Feedback', path: '/manager/360-feedback/give', icon: <Send size={16} /> },
            { label: 'Receive Feedback', path: '/manager/360-feedback/received', icon: <Inbox size={16} /> },
            { label: 'Feedback History', path: '/manager/360-feedback/history', icon: <History size={16} /> },
          ],
        },
        {
          label: 'Continuous Feedback',
          path: '/manager/continuous-feedback',
          icon: <MessageSquare size={18} />,
          isActive: (pathname) => pathname.startsWith('/manager/continuous-feedback'),
          subItems: [
            { label: 'Team Feedback', path: '/manager/continuous-feedback', icon: <MessageSquare size={16} /> },
            { label: 'New Feedback', path: '/manager/continuous-feedback/create', icon: <Plus size={16} /> },
          ],
        },
        {
          label: 'Team PIPs',
          path: '/manager/pip',
          icon: <Zap size={18} />,
          onMouseEnter: () => prefetchPips(),
          onFocus: () => prefetchPips(),
        },
        {
          label: 'Self-Assessment',
          path: authUser?.roleId === 2
            ? '/manager/self-assessment-forms/my-form'
            : '/manager/self-assessment/templates',
          icon: <FileText size={18} />,
          subItems: selfAssessmentSubItems,
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
      ],
    },
    {
      label: 'Dashboard',
      items: [
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
            { label: 'Appraisal Report', path: '/manager/reports/appraisal', icon: <Award size={16} /> },
            { label: 'Self-Assessment Report', path: '/manager/reports/self-assessment', icon: <FileText size={16} /> },
          ],
        },
      ],
    },
  ];

  return (
    <DashLayoutShell
      brandTitle="EPMS"
      brandSubtitle="Performance System"
      menuSections={menuSections}
      user={user}
      searchPlaceholder="Quick find..."
    >
      <Outlet />
    </DashLayoutShell>
  );
};

export default ManagerLayout;
