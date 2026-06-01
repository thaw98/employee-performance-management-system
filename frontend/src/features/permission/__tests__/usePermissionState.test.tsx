import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { ReactNode } from 'react';
import permissionReducer, { setPermissions, clearPermissions } from '../permissionSlice';
import { usePermissionState } from '../usePermission';
import authReducer from '../../auth/authSlice';
import { baseApi } from '../../../app/baseApi';

function createTestStore({
  permissions = {},
  loaded = false,
  user = null,
}: {
  permissions?: Record<string, Record<string, boolean>>;
  loaded?: boolean;
  user?: { roleId: number } | null;
}) {
  return configureStore({
    reducer: {
      auth: authReducer,
      permission: permissionReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
    preloadedState: {
      auth: {
        user: user as never,
        token: 'test-token',
        expiresAt: null,
        isAuthenticated: !!user,
      },
      permission: { permissions, loaded },
    },
  });
}

function wrapper(store: ReturnType<typeof createTestStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe('usePermissionState', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('audit user always has permission', () => {
    const store = createTestStore({ user: { roleId: 5 } });
    const { result } = renderHook(() => usePermissionState(), { wrapper: wrapper(store) });

    expect(result.current.isAudit).toBe(true);
    expect(result.current.isReady).toBe(true);
    expect(result.current.hasPermission('KPI', 'view')).toBe(true);
    expect(result.current.hasPermission('ANYTHING', 'nonexistent')).toBe(true);
  });

  it('non-audit employee returns permissions from store', () => {
    const store = createTestStore({
      user: { roleId: 4 },
      permissions: { KPI: { view: true }, MEETINGS: { view: false } },
      loaded: true,
    });
    const { result } = renderHook(() => usePermissionState(), { wrapper: wrapper(store) });

    expect(result.current.isAudit).toBe(false);
    expect(result.current.loaded).toBe(true);
    expect(result.current.hasPermission('KPI', 'view')).toBe(true);
    expect(result.current.hasPermission('MEETINGS', 'view')).toBe(false);
  });

  it('missing permission defaults to false', () => {
    const store = createTestStore({
      user: { roleId: 4 },
      permissions: { KPI: { view: true } },
      loaded: true,
    });
    const { result } = renderHook(() => usePermissionState(), { wrapper: wrapper(store) });

    expect(result.current.hasPermission('KPI', 'manage')).toBe(false);
    expect(result.current.hasPermission('NONEXISTENT', 'view')).toBe(false);
  });

  it('canViewModule checks view action', () => {
    const store = createTestStore({
      user: { roleId: 4 },
      permissions: { KPI: { view: true }, PIP: { view: false } },
      loaded: true,
    });
    const { result } = renderHook(() => usePermissionState(), { wrapper: wrapper(store) });

    expect(result.current.canViewModule('KPI')).toBe(true);
    expect(result.current.canViewModule('PIP')).toBe(false);
  });

  it('canViewMeetings checks MEETINGS view permission', async () => {
    const store = createTestStore({
      user: { roleId: 4 },
      permissions: { MEETINGS: { view: true } },
      loaded: true,
    });
    const { result } = renderHook(() => usePermissionState(), { wrapper: wrapper(store) });

    expect(result.current.canViewMeetings()).toBe(true);

    store.dispatch(setPermissions({ MEETINGS: { view: false } }));

    await waitFor(() => {
      expect(result.current.canViewMeetings()).toBe(false);
    });
  });

  it('hasAnyPermission returns true if any action matches', () => {
    const store = createTestStore({
      user: { roleId: 4 },
      permissions: { KPI: { view: true, manage: false } },
      loaded: true,
    });
    const { result } = renderHook(() => usePermissionState(), { wrapper: wrapper(store) });

    expect(result.current.hasAnyPermission('KPI', ['view', 'manage'])).toBe(true);
    expect(result.current.hasAnyPermission('KPI', ['manage', 'assign'])).toBe(false);
  });

  it('hasAllPermissions returns true only if all actions match', () => {
    const store = createTestStore({
      user: { roleId: 4 },
      permissions: { KPI: { view: true, manage: true } },
      loaded: true,
    });
    const { result } = renderHook(() => usePermissionState(), { wrapper: wrapper(store) });

    expect(result.current.hasAllPermissions('KPI', ['view', 'manage'])).toBe(true);
    expect(result.current.hasAllPermissions('KPI', ['view', 'assign'])).toBe(false);
  });

  it('clearPermissions resets loaded state', async () => {
    const store = createTestStore({
      user: { roleId: 4 },
      permissions: { KPI: { view: true } },
      loaded: true,
    });
    const { result } = renderHook(() => usePermissionState(), { wrapper: wrapper(store) });

    store.dispatch(clearPermissions());

    await waitFor(() => {
      expect(result.current.loaded).toBe(false);
    });
    expect(result.current.hasPermission('KPI', 'view')).toBe(false);
  });

  it('setPermissions with employee override overrides position permission', async () => {
    const store = createTestStore({
      user: { roleId: 4 },
      permissions: { KPI: { view: true } },
      loaded: true,
    });
    const { result } = renderHook(() => usePermissionState(), { wrapper: wrapper(store) });

    store.dispatch(setPermissions({ KPI: { view: false } }));

    await waitFor(() => {
      expect(result.current.hasPermission('KPI', 'view')).toBe(false);
    });
  });
});
