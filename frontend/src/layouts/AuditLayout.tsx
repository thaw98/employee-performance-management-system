// src/layouts/AuditLayout.tsx
import React from 'react';
import {
    LayoutDashboard,
    List,
    Activity,
    FileText,
    TrendingUp,
    AlertTriangle,
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
