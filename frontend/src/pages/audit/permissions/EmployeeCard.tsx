import { CheckSquare, XSquare, RotateCcw } from 'lucide-react';
import { TriStateToggle } from './TriStateToggle';
import { useEmployeePendingChanges } from './permissionHooks';
import type { PermissionActionDto, EmployeePermissionRow, EmployeePermissionToggle } from '../../../features/permission/permissionApi';

interface EmployeeCardProps {
  employee: EmployeePermissionRow;
  actions: PermissionActionDto[];
  getEffective: ReturnType<typeof useEmployeePendingChanges>['getEffective'];
  onCycle: ReturnType<typeof useEmployeePendingChanges>['cycle'];
  setOverride: ReturnType<typeof useEmployeePendingChanges>['setOverride'];
  changes: ReturnType<typeof useEmployeePendingChanges>['changes'];
  disabled?: boolean;
}

export function EmployeeCard({
  employee,
  actions,
  getEffective,
  onCycle,
  setOverride,
  changes,
  disabled = false,
}: EmployeeCardProps) {
  const hasChanges = changes.some((c) => c.employeeId === employee.employeeId);
  const changeCount = changes.filter((c) => c.employeeId === employee.employeeId).length;

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
                {employee.employeeName}
              </span>
              {hasChanges && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                  {changeCount} changed
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {employee.employeeCode && `${employee.employeeCode} · `}
              {employee.positionName} · {employee.departmentName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <button
            onClick={() =>
              actions.forEach((a) => {
                const perm = employee.permissions.find(
                  (p) => p.moduleKey === a.moduleKey && p.actionKey === a.actionKey
                );
                setOverride(
                  employee.employeeId,
                  a.moduleKey,
                  a.actionKey,
                  true,
                  perm?.override ?? null
                );
              })
            }
            disabled={disabled}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Allow All
          </button>
          <button
            onClick={() =>
              actions.forEach((a) => {
                const perm = employee.permissions.find(
                  (p) => p.moduleKey === a.moduleKey && p.actionKey === a.actionKey
                );
                setOverride(
                  employee.employeeId,
                  a.moduleKey,
                  a.actionKey,
                  false,
                  perm?.override ?? null
                );
              })
            }
            disabled={disabled}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <XSquare className="h-3.5 w-3.5" />
            Deny All
          </button>
          <button
            onClick={() =>
              actions.forEach((a) => {
                const perm = employee.permissions.find(
                  (p) => p.moduleKey === a.moduleKey && p.actionKey === a.actionKey
                );
                setOverride(
                  employee.employeeId,
                  a.moduleKey,
                  a.actionKey,
                  null,
                  perm?.override ?? null
                );
              })
            }
            disabled={disabled}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset All
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
              const perm = employee.permissions.find(
                (p) => p.moduleKey === action.moduleKey && p.actionKey === action.actionKey
              );
              const positionAllowed = perm?.positionAllowed ?? null;
              const currentOverride = perm?.override ?? null;
              const effective = getEffective(
                employee.employeeId,
                action.moduleKey,
                action.actionKey,
                positionAllowed,
                currentOverride
              );
              const isChanged = changes.some(
                (c) =>
                  c.employeeId === employee.employeeId &&
                  c.moduleKey === action.moduleKey &&
                  c.actionKey === action.actionKey
              );

              return (
                <TriStateToggle
                  key={`${action.moduleKey}:${action.actionKey}`}
                  displayName={action.displayName}
                  positionAllowed={positionAllowed}
                  override={isChanged ? undefined : currentOverride}
                  isChanged={isChanged}
                  disabled={disabled}
                  onCycle={() => {
                    const current = isChanged
                      ? changes.find(
                          (c) =>
                            c.employeeId === employee.employeeId &&
                            c.moduleKey === action.moduleKey &&
                            c.actionKey === action.actionKey
                        )?.override ?? currentOverride
                      : currentOverride;
                    onCycle(employee.employeeId, action.moduleKey, action.actionKey, current);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
