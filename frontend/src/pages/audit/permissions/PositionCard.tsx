import { CheckSquare, XSquare } from 'lucide-react';
import { ActionToggle } from './ActionToggle';
import { usePendingChanges } from './permissionHooks';
import type { PermissionActionDto, PermissionMatrixPositionRow } from '../../../features/permission/permissionApi';

interface PositionCardProps {
  position: PermissionMatrixPositionRow;
  actions: PermissionActionDto[];
  getEffective: ReturnType<typeof usePendingChanges>['getEffective'];
  onToggle: ReturnType<typeof usePendingChanges>['toggle'];
  onSetAll: ReturnType<typeof usePendingChanges>['setAll'];
  changes: ReturnType<typeof usePendingChanges>['changes'];
  disabled?: boolean;
}

export function PositionCard({
  position,
  actions,
  getEffective,
  onToggle,
  onSetAll,
  changes,
  disabled = false,
}: PositionCardProps) {
  const hasChanges = changes.some((c) => c.positionId === position.positionId);
  const changeCount = changes.filter((c) => c.positionId === position.positionId).length;

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border-2 transition-all duration-200 overflow-hidden ${
        hasChanges
          ? 'border-amber-300 dark:border-amber-700 shadow-md shadow-amber-200/20 dark:shadow-amber-900/20'
          : 'border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      <div
        className={`flex items-center justify-between px-5 py-3.5 border-b ${
          hasChanges
            ? 'bg-amber-50/80 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
            : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {position.positionName}
              </span>
              {hasChanges && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                  {changeCount} changed
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {position.positionCode} &middot; {position.roleName} &middot; {position.levelCode}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <button
            onClick={() =>
              onSetAll(
                actions.map((a) => {
                  const perm = position.permissions.find(
                    (p) => p.moduleKey === a.moduleKey && p.actionKey === a.actionKey
                  );
                  return {
                    positionId: position.positionId,
                    moduleKey: a.moduleKey,
                    actionKey: a.actionKey,
                    allowed: true,
                    original: perm?.allowed ?? false,
                  };
                })
              )
            }
            disabled={disabled}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Allow All
          </button>
          <button
            onClick={() =>
              onSetAll(
                actions.map((a) => {
                  const perm = position.permissions.find(
                    (p) => p.moduleKey === a.moduleKey && p.actionKey === a.actionKey
                  );
                  return {
                    positionId: position.positionId,
                    moduleKey: a.moduleKey,
                    actionKey: a.actionKey,
                    allowed: false,
                    original: perm?.allowed ?? false,
                  };
                })
              )
            }
            disabled={disabled}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <XSquare className="h-3.5 w-3.5" />
            Deny All
          </button>
        </div>
      </div>

      <div className="px-5 py-4">
        {actions.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center">
            No actions defined for this group
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
            {actions.map((action) => {
              const perm = position.permissions.find(
                (p) => p.moduleKey === action.moduleKey && p.actionKey === action.actionKey
              );
              const original = perm?.allowed ?? false;
              const effective = getEffective(
                position.positionId,
                action.moduleKey,
                action.actionKey,
                original
              );
              const isChanged = changes.some(
                (c) =>
                  c.positionId === position.positionId &&
                  c.moduleKey === action.moduleKey &&
                  c.actionKey === action.actionKey
              );

              return (
                <ActionToggle
                  key={`${action.moduleKey}:${action.actionKey}`}
                  displayName={action.displayName}
                  allowed={effective}
                  isChanged={isChanged}
                  disabled={disabled}
                  onToggle={() =>
                    onToggle(position.positionId, action.moduleKey, action.actionKey, effective)
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
