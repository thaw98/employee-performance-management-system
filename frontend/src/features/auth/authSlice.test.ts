import { describe, expect, it, beforeEach, vi } from 'vitest';

const user = {
  id: 1,
  employeeId: 'EMP-001',
  name: 'Test User',
  email: 'test@example.com',
  role: 'HR',
  roleId: 1,
};

describe('authSlice', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('restores authentication from token and user without expiresAt', async () => {
    localStorage.setItem('epms_token', 'token');
    localStorage.setItem('epms_user', JSON.stringify(user));

    const { default: reducer } = await import('./authSlice');
    const state = reducer(undefined, { type: '@@INIT' });

    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('token');
    expect(state.user).toEqual(user);
    expect(state.expiresAt).toBeNull();
  });

  it('cleans up legacy expiresAt storage on login', async () => {
    localStorage.setItem('epms_expires_at', '2026-05-20T00:00:00Z');
    sessionStorage.setItem('epms_expires_at', '2026-05-20T00:00:00Z');

    const { default: reducer, setCredentials } = await import('./authSlice');
    const state = reducer(
      undefined,
      setCredentials({ token: 'token', user, expiresAt: null })
    );

    expect(state.isAuthenticated).toBe(true);
    expect(state.expiresAt).toBeNull();
    expect(localStorage.getItem('epms_expires_at')).toBeNull();
    expect(sessionStorage.getItem('epms_expires_at')).toBeNull();
  });
});
