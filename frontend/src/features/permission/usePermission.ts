import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetMyPermissionsQuery } from './permissionApi';
import { setPermissions, clearPermissions } from './permissionSlice';

export function usePermissionState() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { permissions, loaded } = useSelector((state: RootState) => state.permission);
  const dispatch = useDispatch();

  const isAudit = user?.roleId === 5;

  const { data, isSuccess, isLoading, isFetching } = useGetMyPermissionsQuery(undefined, {
    skip: !user || isAudit,
  });

  useEffect(() => {
    if (isAudit) {
      if (!loaded) {
        dispatch(setPermissions({}));
      }
      return;
    }
    if (isSuccess && data?.data) {
      dispatch(setPermissions(data.data.permissions));
    }
  }, [isSuccess, data, isAudit, loaded, dispatch]);

  useEffect(() => {
    if (!user) {
      dispatch(clearPermissions());
    }
  }, [user, dispatch]);

  const hasPermission = useCallback(
    (moduleKey: string, actionKey: string): boolean => {
      if (isAudit) return true;
      if (!loaded) return false;
      return permissions[moduleKey]?.[actionKey] ?? false;
    },
    [isAudit, loaded, permissions]
  );

  const hasAnyPermission = useCallback(
    (moduleKey: string, actionKeys: string[]): boolean => {
      if (isAudit) return true;
      return actionKeys.some((action) => hasPermission(moduleKey, action));
    },
    [isAudit, hasPermission]
  );

  const hasAllPermissions = useCallback(
    (moduleKey: string, actionKeys: string[]): boolean => {
      if (isAudit) return true;
      return actionKeys.every((action) => hasPermission(moduleKey, action));
    },
    [isAudit, hasPermission]
  );

  const canViewModule = useCallback(
    (moduleKey: string): boolean => {
      return hasPermission(moduleKey, 'view');
    },
    [hasPermission]
  );

  const canViewMeetings = useCallback(
    (): boolean => canViewModule('MEETINGS'),
    [canViewModule]
  );

  return {
    permissions,
    loaded,
    isLoading: isLoading || isFetching || Boolean(user && !isAudit && !loaded),
    isReady: isAudit || loaded,
    isAudit,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canViewModule,
    canViewMeetings,
  };
}
