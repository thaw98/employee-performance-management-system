import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEmployeePendingChanges } from '../permissionHooks';

describe('useEmployeePendingChanges', () => {
  beforeEach(() => {
  });

  it('starts with no changes', () => {
    const { result } = renderHook(() => useEmployeePendingChanges());
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.changes).toHaveLength(0);
  });

  it('sets an allow override via setOverride', () => {
    const { result } = renderHook(() => useEmployeePendingChanges());

    act(() => {
      result.current.setOverride(1, 'KPI', 'view', true, null);
    });
    expect(result.current.hasChanges).toBe(true);
    expect(result.current.changes).toHaveLength(1);
    expect(result.current.changes[0]).toEqual({
      employeeId: 1,
      moduleKey: 'KPI',
      actionKey: 'view',
      override: true,
      original: null,
    });
  });

  it('sets a deny override via setOverride', () => {
    const { result } = renderHook(() => useEmployeePendingChanges());

    act(() => {
      result.current.setOverride(1, 'KPI', 'view', false, null);
    });
    expect(result.current.changes).toHaveLength(1);
    expect(result.current.changes[0].override).toBe(false);
  });

  it('clears override back to inherit via setOverride with null matching original', () => {
    const { result } = renderHook(() => useEmployeePendingChanges());

    act(() => {
      result.current.setOverride(1, 'KPI', 'view', null, null);
    });
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.changes).toHaveLength(0);
  });

  it('cycles from inherit to allow', () => {
    const { result } = renderHook(() => useEmployeePendingChanges());

    act(() => {
      result.current.cycle(1, 'KPI', 'view', null);
    });
    expect(result.current.hasChanges).toBe(true);
    expect(result.current.changes[0].override).toBe(true);
  });

  it('returns correct effective value for inherit', () => {
    const { result } = renderHook(() => useEmployeePendingChanges());

    const effective = result.current.getEffective(1, 'KPI', 'view', false, null);
    expect(effective).toBe(false);
  });

  it('returns correct effective value for allow override', () => {
    const { result } = renderHook(() => useEmployeePendingChanges());

    act(() => {
      result.current.setOverride(1, 'KPI', 'view', true, null);
    });

    const effective = result.current.getEffective(1, 'KPI', 'view', false, null);
    expect(effective).toBe(true);
  });

  it('returns correct effective value for deny override', () => {
    const { result } = renderHook(() => useEmployeePendingChanges());

    act(() => {
      result.current.setOverride(1, 'KPI', 'view', false, null);
    });

    const effective = result.current.getEffective(1, 'KPI', 'view', true, null);
    expect(effective).toBe(false);
  });

  it('clears all changes', () => {
    const { result } = renderHook(() => useEmployeePendingChanges());

    act(() => {
      result.current.setOverride(1, 'KPI', 'view', true, null);
      result.current.setOverride(1, 'KPI', 'manage', false, null);
    });
    expect(result.current.hasChanges).toBe(true);
    expect(result.current.changes).toHaveLength(2);

    act(() => {
      result.current.clear();
    });
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.changes).toHaveLength(0);
  });

  it('filters changes by employee ID', () => {
    const { result } = renderHook(() => useEmployeePendingChanges());

    act(() => {
      result.current.setOverride(1, 'KPI', 'view', true, null);
      result.current.setOverride(2, 'KPI', 'view', false, null);
      result.current.setOverride(1, 'MEETINGS', 'view', true, null);
    });

    const emp1Changes = result.current.getChangesForEmployee(1);
    expect(emp1Changes).toHaveLength(2);
    expect(emp1Changes.every((c) => c.employeeId === 1)).toBe(true);

    const emp2Changes = result.current.getChangesForEmployee(2);
    expect(emp2Changes).toHaveLength(1);
    expect(emp2Changes[0].employeeId).toBe(2);
  });

  it('filters changes by module key', () => {
    const { result } = renderHook(() => useEmployeePendingChanges());

    act(() => {
      result.current.setOverride(1, 'KPI', 'view', true, null);
      result.current.setOverride(1, 'KPI', 'manage', false, null);
      result.current.setOverride(1, 'MEETINGS', 'view', true, null);
    });

    const kpiChanges = result.current.getChangesForModule('KPI');
    expect(kpiChanges).toHaveLength(2);
    expect(kpiChanges.every((c) => c.moduleKey === 'KPI')).toBe(true);

    const meetingsChanges = result.current.getChangesForModule('MEETINGS');
    expect(meetingsChanges).toHaveLength(1);
    expect(meetingsChanges[0].moduleKey).toBe('MEETINGS');
  });

  it('does not add a change when override matches original', () => {
    const { result } = renderHook(() => useEmployeePendingChanges());

    act(() => {
      result.current.setOverride(1, 'KPI', 'view', true, true);
    });
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.changes).toHaveLength(0);

    act(() => {
      result.current.setOverride(1, 'KPI', 'view', null, null);
    });
    expect(result.current.hasChanges).toBe(false);
  });
});
