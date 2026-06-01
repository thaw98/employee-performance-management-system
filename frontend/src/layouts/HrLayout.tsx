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
  BarChart3,
  HelpCircle,
  Zap,
  RefreshCcw,
  Archive,
  Settings,
  TableProperties,
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
  '/hr/kpi-names',
  '/hr/kpi-units',
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

  const menuSections: DashMenuSection[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', path: '/hr/dashboard', icon: <LayoutDashboard size={18} /> },
      ],
    },
    {
      label: 'Organization',
      items: [
        {
          label: 'Employee',
          path: '/hr/employees',
          icon: <Users size={18} />,
          subItems: [
            { label: 'Employee List', path: '/hr/employees', icon: <List size={16} />, permission: { moduleKey: 'EMPLOYEE_PROFILE', actionKey: 'view_employee' } },
            { label: 'Create Employee Account', path: '/hr/employees/create-account', icon: <UserPlus size={16} />, permission: { moduleKey: 'EMPLOYEE_PROFILE', actionKey: 'manage_employee' } },
          ],
        },
        { label: 'Department', path: '/hr/departments', icon: <Building2 size={18} />, permission: { moduleKey: 'EMPLOYEE_PROFILE', actionKey: 'view_org_setup' } },
        { label: 'Positions', path: '/hr/positions', icon: <Briefcase size={18} />, permission: { moduleKey: 'EMPLOYEE_PROFILE', actionKey: 'view_org_setup' } },
        { label: 'Level Codes', path: '/hr/level-codes', icon: <Layers size={18} />, permission: { moduleKey: 'EMPLOYEE_PROFILE', actionKey: 'view_org_setup' } },
      ],
    },
    {
      label: 'Performance',
      items: [
        {
          label: 'KPI',
          path: '/hr/kpi-management',
          icon: <Target size={18} />,
          isActive: (pathname) => isHrKpiSection(pathname),
          isSubActive: (subPath, pathname, search) => matchesPath(subPath, pathname, search),
          subItems: [
            { label: 'KPI Modeler', path: '/hr/kpi-management', icon: <SlidersHorizontal size={16} />, permission: { moduleKey: 'KPI', actionKey: 'manage' } },
            { label: 'Assigned List', path: '/hr/kpi-assigned', icon: <ListChecks size={16} />, permission: { moduleKey: 'KPI', actionKey: 'assign' } },
            { label: 'History', path: '/hr/kpi-history', icon: <History size={16} />, permission: { moduleKey: 'KPI', actionKey: 'history' } },

          ],
        },
        {
          label: 'Appraisals',
          path: '/hr/appraisals',
          icon: <Award size={18} />,
          subItems: [
            { label: 'Management', path: '/hr/appraisals', icon: <LayoutDashboard size={16} /> },
            { label: 'Review Submissions', path: '/hr/appraisals/submissions', icon: <Inbox size={16} /> },
            { label: 'History', path: '/hr/appraisals/history', icon: <History size={16} /> },
          ],
        },
        {
          label: '360 Feedback',
          path: '/hr/360-feedback/management',
          icon: <RefreshCcw size={18} />,
          subItems: [
            { label: 'Management', path: '/hr/360-feedback/management', icon: <ListFilter size={16} />, permission: { moduleKey: '360_FEEDBACK', actionKey: 'configure' } },
            { label: 'Give Feedback', path: '/hr/360-feedback/give', icon: <Send size={16} />, permission: { moduleKey: '360_FEEDBACK', actionKey: 'give' } },
            { label: 'Receive Feedback', path: '/hr/360-feedback/received', icon: <Inbox size={16} />, permission: { moduleKey: '360_FEEDBACK', actionKey: 'view' } },
            { label: 'Feedback History', path: '/hr/360-feedback/history', icon: <History size={16} />, permission: { moduleKey: '360_FEEDBACK', actionKey: 'review_history' } },
          ],
        },
        {
          label: 'PIP',
          path: '/hr/pip-monitoring',
          icon: <Zap size={18} />,
          onMouseEnter: () => prefetchPips(),
          onFocus: () => prefetchPips(),
          subItems: [
            { label: 'PIP Management', path: '/hr/pip-monitoring', icon: <List size={16} />, permission: { moduleKey: 'PIP', actionKey: 'view' } },
            { label: 'PIP Note History', path: '/hr/pip-notes', icon: <FileText size={16} />, permission: { moduleKey: 'PIP', actionKey: 'review_notes' } },
          ],
        },
        {
          label: 'Continuous Feedback',
            path: '/hr/continuous-feedback',
            icon: <MessageSquare size={18} />,
            isActive: (pathname) => pathname.startsWith('/hr/continuous-feedback'),
            subItems: [
              { label: 'Feedback Review', path: '/hr/continuous-feedback', icon: <MessageSquare size={16} />, permission: { moduleKey: 'CONTINUOUS_FEEDBACK', actionKey: 'view' } },
              { label: 'New Feedback', path: '/hr/continuous-feedback/create', icon: <Plus size={16} />, permission: { moduleKey: 'CONTINUOUS_FEEDBACK', actionKey: 'create' } },
              { label: 'Dashboard', path: '/hr/continuous-feedback/dashboard', icon: <BarChart size={16} />, permission: { moduleKey: 'CONTINUOUS_FEEDBACK', actionKey: 'report' } },
            ],
          },
          {
            label: 'Self-Assessment',
          path: '/hr/self-assessment/templates',
          icon: <FileText size={18} />,
          subItems: [
            { label: 'Template Management', path: '/hr/self-assessment/templates', icon: <SlidersHorizontal size={16} />, permission: { moduleKey: 'SELF_ASSESSMENT', actionKey: 'manage_templates' } },
            { label: 'Assignments', path: '/hr/self-assessment/assignments', icon: <ClipboardList size={16} />, permission: { moduleKey: 'SELF_ASSESSMENT', actionKey: 'assign' } },
            { label: 'Assignment Coverage', path: '/hr/self-assessment/assignment-coverage', icon: <BarChart3 size={16} />, permission: { moduleKey: 'SELF_ASSESSMENT', actionKey: 'assign' } },
            { label: 'Assigned Forms', path: '/hr/self-assessment/forms', icon: <Inbox size={16} />, permission: { moduleKey: 'SELF_ASSESSMENT', actionKey: 'view' } },
            { label: 'Review Submissions', path: '/hr/self-assessment/review-queue', icon: <ListChecks size={16} />, permission: { moduleKey: 'SELF_ASSESSMENT', actionKey: 'review' } },
            { label: 'Unlock Requests', path: '/hr/self-assessment/unlock-requests', icon: <RefreshCcw size={16} />, permission: { moduleKey: 'SELF_ASSESSMENT', actionKey: 'unlock' } },
            { label: 'History', path: '/hr/self-assessment/history', icon: <History size={16} />, permission: { moduleKey: 'SELF_ASSESSMENT', actionKey: 'history' } },
            { label: 'Archive', path: '/hr/self-assessment/archive', icon: <Archive size={16} />, permission: { moduleKey: 'SELF_ASSESSMENT', actionKey: 'history' } },
          ],
        },
      ],
    },
    {
      label: 'Workspace',
      items: [
        {
          label: 'Meetings',
          path: '/hr/meetings?section=schedule',
          icon: <Calendar size={18} />,
          subItems: [
            { label: 'Schedule Meeting', path: '/hr/meetings?section=schedule', icon: <Calendar size={16} />, permission: { moduleKey: 'MEETINGS', actionKey: 'schedule' } },
            { label: 'Meeting History', path: '/hr/meetings?section=history', icon: <History size={16} />, permission: { moduleKey: 'MEETINGS', actionKey: 'history' } },
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
            { label: 'Performance Report', path: '/hr/performance-reports', icon: <Award size={16} className="shrink-0" />, permission: { moduleKey: 'REPORTS', actionKey: 'performance_report' } },
            { label: 'PIP Report', path: '/hr/reports', icon: <Zap size={16} className="shrink-0" />, permission: { moduleKey: 'REPORTS', actionKey: 'pip_report' } },
            { label: 'KPI Report', path: '/hr/kpi-reports', icon: <BarChart size={16} className="shrink-0" />, permission: { moduleKey: 'REPORTS', actionKey: 'kpi_report' } },
            { label: 'Feedback Report', path: '/hr/reports/feedback', icon: <RefreshCcw size={16} className="shrink-0" />, permission: { moduleKey: 'REPORTS', actionKey: 'feedback_report' } },
            { label: 'Appraisal Report', path: '/hr/reports/appraisal', icon: <Award size={16} className="shrink-0" />, permission: { moduleKey: 'REPORTS', actionKey: 'appraisal_report' } },
            { label: 'Self-Assessment Report', path: '/hr/reports/self-assessment', icon: <FileText size={16} className="shrink-0" />, permission: { moduleKey: 'REPORTS', actionKey: 'self_assessment_report' } },
          ],
        },
        { icon: <HelpCircle size={20} />, label: 'FAQ Support', path: '/hr/settings/faq-support' },
      ],
    },
    {
      label: 'Settings',
      items: [
        {
          label: 'System Settings',
          path: '/hr/settings/system/time',
          icon: <Settings size={18} />,
          isActive: (pathname) => pathname.startsWith('/hr/settings/system'),
          subItems: [
            { label: 'Time Settings', path: '/hr/settings/system/time', icon: <Calendar size={16} /> },
            { label: 'Score Band Settings', path: '/hr/settings/system/score-explanations', icon: <TableProperties size={16} /> },
            { label: 'Score Formula Settings', path: '/hr/settings/system/score-formulas', icon: <SlidersHorizontal size={16} /> },
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
    >
      <Outlet />
    </DashLayoutShell>
  );
};

export default HrLayout;
