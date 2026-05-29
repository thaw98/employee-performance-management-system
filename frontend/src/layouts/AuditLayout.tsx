// src/layouts/AuditLayout.tsx
import React from 'react';
import {
    LayoutDashboard,
    Activity,
    BarChart,
    Users,
    List,
    UserPlus,
    Building2,
    Briefcase,
    Layers,
    Target,
    ListChecks,
    History,
    Award,
    RefreshCcw,
    Zap,
    FileText,
    Calendar,
    Shield,
    Archive,
} from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { useGetProfileQuery } from '../features/user/userApi';
import { DashLayoutShell } from '../components/layout/DashLayoutShell';
import type { DashMenuSection } from '../components/layout/DashMenuNav';

const AuditLayout: React.FC = () => {
    const { user: authUser } = useSelector((state: RootState) => state.auth);
    const { data: profileResponse } = useGetProfileQuery();
    const user = profileResponse?.data || authUser;

    const menuSections: DashMenuSection[] = [
        {
            label: 'Overview',
            items: [
                { label: 'Dashboard', path: '/audit/dashboard', icon: <LayoutDashboard size={18} /> },
            ],
        },
        {
            label: 'Organization',
            items: [
                {
                    label: 'Employee',
                    path: '/audit/employees',
                    icon: <Users size={18} />,
                    subItems: [
                        { label: 'Employee List', path: '/audit/employees', icon: <List size={16} /> },
                        { label: 'Create Employee Account', path: '/audit/employees/create-account', icon: <UserPlus size={16} /> },
                    ],
                },
                { label: 'Department', path: '/audit/departments', icon: <Building2 size={18} /> },
                { label: 'Positions', path: '/audit/positions', icon: <Briefcase size={18} /> },
                { label: 'Level Codes', path: '/audit/level-codes', icon: <Layers size={18} /> },
            ],
        },
        {
            label: 'Performance',
            items: [
                {
                    label: 'KPI',
                    path: '/audit/kpi-assigned',
                    icon: <Target size={18} />,
                    isActive: (pathname) =>
                        pathname === '/audit/kpi-assigned'
                        || pathname === '/audit/kpi-history'
                        || pathname.startsWith('/audit/kpi-detail')
                        || pathname.startsWith('/audit/department-kpi-detail')
                        || pathname.startsWith('/audit/position-kpi-detail'),
                    subItems: [
                        { label: 'Assigned List', path: '/audit/kpi-assigned', icon: <ListChecks size={16} /> },
                        { label: 'History', path: '/audit/kpi-history', icon: <History size={16} /> },
                    ],
                },
            ],
        },
        {
            label: 'Management',
            items: [
                {
                    label: 'Appraisals',
                    path: '/audit/appraisals',
                    icon: <Award size={18} />,
                    subItems: [{ label: 'History', path: '/audit/appraisals/history', icon: <History size={16} /> }],
                },
                {
                    label: 'PIP',
                    path: '/audit/pip-monitoring',
                    icon: <FileText size={18} />,
                    isActive: (pathname) =>
                        pathname === '/audit/pip-monitoring'
                        || pathname === '/audit/pip-notes'
                        || pathname.startsWith('/audit/pip-monitoring/'),
                    subItems: [
                        { label: 'PIP Monitoring', path: '/audit/pip-monitoring', icon: <ListChecks size={16} /> },
                        { label: 'PIP Notes', path: '/audit/pip-notes', icon: <FileText size={16} /> },
                    ],
                },
                {
                    label: 'Self-Assessment',
                    path: '/audit/self-assessment/history',
                    icon: <FileText size={18} />,
                    subItems: [
                        { label: 'History', path: '/audit/self-assessment/history', icon: <History size={16} /> },
                        { label: 'Archive', path: '/audit/self-assessment/archive', icon: <Archive size={16} /> },
                    ],
                },
                {
                    label: 'Meetings',
                    path: '/audit/meetings?section=history',
                    icon: <Calendar size={18} />,
                    subItems: [
                        { label: 'Meeting History', path: '/audit/meetings?section=history', icon: <History size={16} /> },
                    ],
                },
                {
                    label: '360 Feedback',
                    path: '/audit/360-feedback/history',
                    icon: <RefreshCcw size={18} />,
                    subItems: [{ label: 'Feedback History', path: '/audit/360-feedback/history', icon: <History size={16} /> }],
                },
            ],
        },
        {
            label: 'Analytics',
            items: [
                {
                    label: 'Reports',
                    path: '/audit/reports',
                    icon: <BarChart size={18} />,
                    isActive: (pathname) =>
                        pathname === '/audit/reports'
                        || pathname.startsWith('/audit/performance-reports')
                        || pathname.startsWith('/audit/kpi-reports')
                        || pathname.startsWith('/audit/reports/'),
                    subItems: [
                        { label: 'Performance Report', path: '/audit/performance-reports', icon: <Award size={16} /> },
                        { label: 'PIP Report', path: '/audit/reports', icon: <Zap size={16} /> },
                        { label: 'KPI Report', path: '/audit/kpi-reports', icon: <BarChart size={16} /> },
                        { label: 'Feedback Report', path: '/audit/reports/feedback', icon: <RefreshCcw size={16} /> },
                        { label: 'Appraisal Report', path: '/audit/reports/appraisal', icon: <Award size={16} /> },
                        { label: 'Self-Assessment Report', path: '/audit/reports/self-assessment', icon: <FileText size={16} /> },
                    ],
                },
            ],
        },
        {
            label: 'Audit',
            items: [
                { label: 'Activity Monitor', path: '/audit/activity-monitor', icon: <Activity size={18} /> },
                { label: 'Permission Matrix', path: '/audit/permissions', icon: <Shield size={18} /> },
            ],
        },
    ];

    return (
        <DashLayoutShell
            brandTitle="EPMS"
            brandSubtitle="Audit Console"
            menuSections={menuSections}
            user={user}
            searchPlaceholder="Search audit logs..."
        >
            <Outlet />
        </DashLayoutShell>
    );
};

export default AuditLayout;
