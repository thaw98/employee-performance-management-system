import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { useGetProfileQuery } from '../features/user/userApi';

/** HR KPI pages reused under /audit with read-only access (role_id = 5). */
export function useKpiViewContext() {
  const location = useLocation();
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const { data: profileResponse } = useGetProfileQuery();
  const user = profileResponse?.data || authUser;

  const isAuditRoute = location.pathname.startsWith('/audit/');
  const isAuditRole = user?.roleId === 5;
  const isViewOnly = isAuditRoute || isAuditRole;
  const basePath = isViewOnly ? '/audit' : '/hr';

  return { isViewOnly, basePath, isAuditRoute, isAuditRole };
}
