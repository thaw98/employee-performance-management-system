import React from 'react';
import {
  Target,
  Calendar,
  LayoutDashboard,
  RefreshCcw,
  TrendingUp,
  Send,
  Inbox,
  History,
  FileText,
  ClipboardList,
  BarChart,
  MessageSquare,
} from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { useGetProfileQuery } from '../features/user/userApi';
import { DashLayoutShell } from '../components/layout/DashLayoutShell';
import type { DashMenuItem, DashMenuSection } from '../components/layout/DashMenuNav';
import {
  EMPLOYEE_SELF_ASSESSMENT_BASE_PATH,
  EMPLOYEE_SELF_ASSESSMENT_HISTORY_PATH,
  EMPLOYEE_SELF_ASSESSMENT_MY_FORM_PATH,
} from '../routes/employeeSelfAssessmentRoutes';

const EmployeeLayout: React.FC = () => {
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const { data: profileResponse } = useGetProfileQuery();
  const user = profileResponse?.data || authUser;

  const reportsItem: DashMenuItem = {
    label: 'Reports',
    path: '/employee/reports',
    icon: <BarChart size={18} />,
    subItems: [
      { label: 'PIP Report', path: '/employee/reports', icon: <FileText size={16} />, permission: { moduleKey: 'REPORTS', actionKey: 'pip_report' } },
      { label: 'Feedback Report', path: '/employee/reports/feedback', icon: <RefreshCcw size={16} />, permission: { moduleKey: 'REPORTS', actionKey: 'feedback_report' } },
    ],
  };

  const selfAssessmentItem: DashMenuItem = {
    label: 'Self Assessment Form',
    path: EMPLOYEE_SELF_ASSESSMENT_BASE_PATH,
    icon: <FileText size={18} />,
    subItems: [
      { label: 'My Form', path: EMPLOYEE_SELF_ASSESSMENT_MY_FORM_PATH, icon: <ClipboardList size={16} />, permission: { moduleKey: 'SELF_ASSESSMENT', actionKey: 'view' } },
      { label: 'History', path: EMPLOYEE_SELF_ASSESSMENT_HISTORY_PATH, icon: <History size={16} />, permission: { moduleKey: 'SELF_ASSESSMENT', actionKey: 'history' } },
    ],
  };

  const isEmployeeRole = Number(user?.roleId) === 4;

  const menuSections: DashMenuSection[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Overview', path: '/employee/dashboard', icon: <LayoutDashboard size={18} /> },
      ],
    },
    {
      label: 'Performance',
      items: [
        { label: 'My KPIs', path: '/employee/kpis', icon: <Target size={18} />, permission: { moduleKey: 'KPI', actionKey: 'view' } },
        {
          label: 'Appraisals',
          path: '/employee/appraisals',
          icon: <FileText size={18} />,
          subItems: [
            { label: 'My Appraisals', path: '/employee/appraisals', icon: <ClipboardList size={16} /> },
            { label: 'History', path: '/employee/appraisals/history', icon: <History size={16} /> },
          ],
        },
        {
          label: '360 Feedback',
          path: '/employee/360-feedback/give',
          icon: <RefreshCcw size={18} />,
          subItems: [
            { label: 'Give Feedback', path: '/employee/360-feedback/give', icon: <Send size={16} />, permission: { moduleKey: '360_FEEDBACK', actionKey: 'give' } },
            { label: 'Receive Feedback', path: '/employee/360-feedback/received', icon: <Inbox size={16} />, permission: { moduleKey: '360_FEEDBACK', actionKey: 'view' } },
            { label: 'Feedback History', path: '/employee/360-feedback/history', icon: <History size={16} />, permission: { moduleKey: '360_FEEDBACK', actionKey: 'review_history' } },
          ],
        },
        { label: 'My Continuous Feedback', path: '/employee/continuous-feedback', icon: <MessageSquare size={18} />, permission: { moduleKey: 'CONTINUOUS_FEEDBACK', actionKey: 'view' } },
        { label: 'My PIPs', path: '/employee/pip', icon: <TrendingUp size={18} />, permission: { moduleKey: 'PIP', actionKey: 'view' } },
        ...(isEmployeeRole ? [selfAssessmentItem] : []),
      ],
    },
    {
      label: 'Workspace',
      items: [
        { label: 'Meetings', path: '/employee/meetings', icon: <Calendar size={18} />, permission: { moduleKey: 'MEETINGS', actionKey: 'view' } },
        reportsItem,
        ...(!isEmployeeRole ? [selfAssessmentItem] : []),
      ],
    },
  ];

  return (
    <DashLayoutShell
      brandTitle="EPMS"
      brandSubtitle="Performance System"
      menuSections={menuSections}
      user={user}
      searchPlaceholder="Search..."
    >
      <Outlet />
    </DashLayoutShell>
  );
};

export default EmployeeLayout;
