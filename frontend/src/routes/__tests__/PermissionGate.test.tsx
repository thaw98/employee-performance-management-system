import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import permissionReducer from '../../features/permission/permissionSlice';
import authReducer from '../../features/auth/authSlice';
import { PermissionGate } from '../PermissionGate';

vi.mock('../../features/permission/usePermission', () => ({
  usePermissionState: () => ({
    permissions: { KPI: { view: true }, PIP: { view: false } },
    loaded: true,
    isLoading: false,
    isReady: true,
    isAudit: false,
    hasPermission: (moduleKey: string, actionKey: string) => {
      return moduleKey === 'KPI' && actionKey === 'view';
    },
    hasAnyPermission: () => false,
    hasAllPermissions: () => false,
    canViewModule: () => false,
  }),
}));

function createTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      permission: permissionReducer,
    },
    preloadedState: {
      auth: {
        user: { id: 1, employeeId: null, roleId: 4, name: 'Test', email: 'test@test.com', role: 'EMPLOYEE' },
        token: 'test-token',
        expiresAt: null,
        isAuthenticated: true,
      },
      permission: { permissions: { KPI: { view: true } }, loaded: true },
    },
  });
}

describe('PermissionGate', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders children when permission is granted', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/test']}>
          <Routes>
            <Route path="/test" element={<PermissionGate moduleKey="KPI" actionKey="view"><div>Content</div></PermissionGate>} />
            <Route path=".." element={<div>Redirected</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('Content')).toBeTruthy();
  });

  it('redirects when permission is denied', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/test']}>
          <Routes>
            <Route path="/test" element={<PermissionGate moduleKey="PIP" actionKey="view"><div>Content</div></PermissionGate>} />
            <Route path="/" element={<div>Redirected</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('Redirected')).toBeTruthy();
  });

  it('uses view as default actionKey', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/test']}>
          <Routes>
            <Route path="/test" element={<PermissionGate moduleKey="KPI"><div>KPI Content</div></PermissionGate>} />
            <Route path=".." element={<div>Redirected</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('KPI Content')).toBeTruthy();
  });
});
