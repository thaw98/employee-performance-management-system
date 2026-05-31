import { useState, useMemo, useCallback } from 'react';

export interface PendingChange {
  positionId: number;
  moduleKey: string;
  actionKey: string;
  allowed: boolean;
}

export function usePendingChanges() {
  const [pending, setPending] = useState<Map<string, boolean>>(new Map());

  const getKey = (positionId: number, moduleKey: string, actionKey: string) =>
    `${positionId}:${moduleKey}:${actionKey}`;

  const getEffective = useCallback(
    (positionId: number, moduleKey: string, actionKey: string, original: boolean): boolean => {
      const k = getKey(positionId, moduleKey, actionKey);
      return pending.has(k) ? pending.get(k)! : original;
    },
    [pending]
  );

  const toggle = useCallback(
    (positionId: number, moduleKey: string, actionKey: string, currentAllowed: boolean) => {
      setPending((prev) => {
        const next = new Map(prev);
        const k = getKey(positionId, moduleKey, actionKey);
        next.set(k, !currentAllowed);
        return next;
      });
    },
    []
  );

  const setAll = useCallback(
    (entries: { positionId: number; moduleKey: string; actionKey: string; allowed: boolean }[]) => {
      setPending((prev) => {
        const next = new Map(prev);
        for (const e of entries) {
          next.set(getKey(e.positionId, e.moduleKey, e.actionKey), e.allowed);
        }
        return next;
      });
    },
    []
  );

  const clear = useCallback(() => setPending(new Map()), []);

  const changes = useMemo(() => {
    const result: PendingChange[] = [];
    for (const [key, allowed] of pending) {
      const [positionId, moduleKey, actionKey] = key.split(':');
      result.push({ positionId: Number(positionId), moduleKey, actionKey, allowed });
    }
    return result;
  }, [pending]);

  return { changes, hasChanges: pending.size > 0, getEffective, toggle, setAll, clear };
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
