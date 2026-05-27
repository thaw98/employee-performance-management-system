// src/layouts/AuditLayout.tsx
import React from 'react';
import {
    LayoutDashboard,
    Activity,
    TrendingUp,
    Users,
    Building2,
    Layers,
    Target,
    ListChecks,
    History,
    Award,
    RefreshCcw,
    FileText,
} from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { useGetProfileQuery } from '../features/user/userApi';
import { DashLayoutShell } from '../components/layout/DashLayoutShell';
import type { DashMenuItem } from '../components/layout/DashMenuNav';

const AuditLayout: React.FC = () => {
    const { user: authUser } = useSelector((state: RootState) => state.auth);
    const { data: profileResponse } = useGetProfileQuery();
    const user = profileResponse?.data || authUser;

    const menuItems: DashMenuItem[] = [
        { label: 'Dashboard', path: '/audit/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Employee List', path: '/audit/employees', icon: <Users size={18} /> },
        { label: 'Department', path: '/audit/departments', icon: <Building2 size={18} /> },
        { label: 'Level Codes', path: '/audit/level-codes', icon: <Layers size={18} /> },
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
            ],
        },
        {
            label: '360 Feedback',
            path: '/audit/360-feedback/history',
            icon: <RefreshCcw size={18} />,
            subItems: [{ label: 'Feedback History', path: '/audit/360-feedback/history', icon: <History size={16} /> }],
        },
        { label: 'Activity Monitor', path: '/audit/activity-monitor', icon: <Activity size={18} /> },
        { label: 'Security Analytics', path: '/audit/security-analytics', icon: <TrendingUp size={18} /> },
    ];

    return (
        <DashLayoutShell
            brandTitle="EPMS"
            brandSubtitle="Audit Console"
            menuItems={menuItems}
            user={user}
            searchPlaceholder="Search audit logs..."
        >
            <Outlet />
        </DashLayoutShell>
    );
};

export default AuditLayout;
