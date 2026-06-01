import { useState, useMemo, useCallback } from 'react';

export interface PendingChange {
  positionId: number;
  moduleKey: string;
  actionKey: string;
  allowed: boolean;
  original: boolean;
}

export interface EmployeePendingChange {
  employeeId: number;
  moduleKey: string;
  actionKey: string;
  override: boolean | null;
  original: boolean | null;
}

export function usePendingChanges() {
  const [pending, setPending] = useState<Map<string, { newValue: boolean; original: boolean }>>(new Map());

  const getKey = (positionId: number, moduleKey: string, actionKey: string) =>
    `${positionId}:${moduleKey}:${actionKey}`;

  const getEffective = useCallback(
    (positionId: number, moduleKey: string, actionKey: string, original: boolean): boolean => {
      const k = getKey(positionId, moduleKey, actionKey);
      return pending.has(k) ? pending.get(k)!.newValue : original;
    },
    [pending]
  );

  const toggle = useCallback(
    (positionId: number, moduleKey: string, actionKey: string, currentAllowed: boolean) => {
      setPending((prev) => {
        const next = new Map(prev);
        const k = getKey(positionId, moduleKey, actionKey);
        const existing = next.get(k);
        const original = existing?.original ?? currentAllowed;
        next.set(k, { newValue: !currentAllowed, original });
        return next;
      });
    },
    []
  );

  const setAll = useCallback(
    (entries: { positionId: number; moduleKey: string; actionKey: string; allowed: boolean; original: boolean }[]) => {
      setPending((prev) => {
        const next = new Map(prev);
        for (const e of entries) {
          const k = getKey(e.positionId, e.moduleKey, e.actionKey);
          next.set(k, { newValue: e.allowed, original: e.original });
        }
        return next;
      });
    },
    []
  );

  const clear = useCallback(() => setPending(new Map()), []);

  const changes = useMemo(() => {
    const result: PendingChange[] = [];
    for (const [key, value] of pending) {
      const [positionId, moduleKey, actionKey] = key.split(':');
      result.push({
        positionId: Number(positionId),
        moduleKey,
        actionKey,
        allowed: value.newValue,
        original: value.original,
      });
    }
    return result;
  }, [pending]);

  const getChangesForModule = useCallback(
    (moduleKey: string): PendingChange[] => {
      return changes.filter((c) => c.moduleKey === moduleKey);
    },
    [changes]
  );

  const hasChangesForModule = useCallback(
    (moduleKey: string): boolean => {
      return changes.some((c) => c.moduleKey === moduleKey);
    },
    [changes]
  );

  return { changes, hasChanges: pending.size > 0, getEffective, toggle, setAll, clear, getChangesForModule, hasChangesForModule };
}

export function useEmployeePendingChanges() {
  const [pending, setPending] = useState<Map<string, { newValue: boolean | null; original: boolean | null }>>(new Map());

  const getKey = (employeeId: number, moduleKey: string, actionKey: string) =>
    `emp:${employeeId}:${moduleKey}:${actionKey}`;

  const resolveEffective = (positionAllowed: boolean | null, override: boolean | null): boolean | null => {
    const position = positionAllowed ?? false;
    if (override === null) {
      return positionAllowed;
    }
    return position && override;
  };

  const getEffective = useCallback(
    (employeeId: number, moduleKey: string, actionKey: string, positionAllowed: boolean | null, override: boolean | null): boolean | null => {
      const k = getKey(employeeId, moduleKey, actionKey);
      if (pending.has(k)) {
        const val = pending.get(k)!.newValue;
        return resolveEffective(positionAllowed, val);
      }
      return resolveEffective(positionAllowed, override);
    },
    [pending]
  );

  const cycle = useCallback(
    (employeeId: number, moduleKey: string, actionKey: string, currentOverride: boolean | null) => {
      setPending((prev) => {
        const next = new Map(prev);
        const k = getKey(employeeId, moduleKey, actionKey);
        const existing = next.get(k);
        const original = existing?.original ?? currentOverride;

        let newValue: boolean | null;
        const current = existing?.newValue ?? currentOverride;
        if (current === null) newValue = true;
        else if (current === true) newValue = false;
        else newValue = null;

        if (newValue === original) {
          next.delete(k);
        } else {
          next.set(k, { newValue, original });
        }
        return next;
      });
    },
    []
  );

  const setOverride = useCallback(
    (employeeId: number, moduleKey: string, actionKey: string, value: boolean | null, original: boolean | null) => {
      setPending((prev) => {
        const next = new Map(prev);
        const k = getKey(employeeId, moduleKey, actionKey);
        if (value === original) {
          next.delete(k);
        } else {
          next.set(k, { newValue: value, original });
        }
        return next;
      });
    },
    []
  );

  const clear = useCallback(() => setPending(new Map()), []);

  const changes = useMemo(() => {
    const result: EmployeePendingChange[] = [];
    for (const [key, value] of pending) {
      const parts = key.split(':');
      const employeeId = Number(parts[1]);
      const moduleKey = parts[2];
      const actionKey = parts[3];
      result.push({
        employeeId,
        moduleKey,
        actionKey,
        override: value.newValue,
        original: value.original,
      });
    }
    return result;
  }, [pending]);

  const getChangesForEmployee = useCallback(
    (employeeId: number): EmployeePendingChange[] => {
      return changes.filter((c) => c.employeeId === employeeId);
    },
    [changes]
  );

  const getChangesForModule = useCallback(
    (moduleKey: string): EmployeePendingChange[] => {
      return changes.filter((c) => c.moduleKey === moduleKey);
    },
    [changes]
  );

  return { changes, hasChanges: pending.size > 0, getEffective, cycle, setOverride, clear, getChangesForEmployee, getChangesForModule };
}

export function usePositionSearch<T extends { positionName: string; positionCode: string }>(positions: T[]) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search.trim()) return positions;
    const q = search.toLowerCase();
    return positions.filter(
      (p) =>
        p.positionName.toLowerCase().includes(q) || p.positionCode.toLowerCase().includes(q)
    );
  }, [positions, search]);

  return { search, setSearch, filtered };
}
