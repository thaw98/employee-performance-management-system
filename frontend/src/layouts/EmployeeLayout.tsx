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
      { label: 'PIP Report', path: '/employee/reports', icon: <FileText size={16} /> },
      { label: 'Feedback Report', path: '/employee/reports/feedback', icon: <RefreshCcw size={16} /> },
    ],
  };

  const selfAssessmentItem: DashMenuItem = {
    label: 'Self Assessment Form',
    path: EMPLOYEE_SELF_ASSESSMENT_BASE_PATH,
    icon: <FileText size={18} />,
    subItems: [
      { label: 'My Form', path: EMPLOYEE_SELF_ASSESSMENT_MY_FORM_PATH, icon: <ClipboardList size={16} /> },
      { label: 'History', path: EMPLOYEE_SELF_ASSESSMENT_HISTORY_PATH, icon: <History size={16} /> },
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
        { label: 'My KPIs', path: '/employee/kpis', icon: <Target size={18} /> },
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
            { label: 'Give Feedback', path: '/employee/360-feedback/give', icon: <Send size={16} /> },
            { label: 'Receive Feedback', path: '/employee/360-feedback/received', icon: <Inbox size={16} /> },
            { label: 'Feedback History', path: '/employee/360-feedback/history', icon: <History size={16} /> },
          ],
        },
        { label: 'My PIPs', path: '/employee/pip', icon: <TrendingUp size={18} /> },
        ...(isEmployeeRole ? [selfAssessmentItem] : []),
      ],
    },
    {
      label: 'Workspace',
      items: [
        { label: 'Meetings', path: '/employee/meetings', icon: <Calendar size={18} /> },
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
