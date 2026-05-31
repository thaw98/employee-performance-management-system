import { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Shield, Users, Loader2, AlertCircle, Info, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import type { RootState } from '../../../app/store';
import {
  useGetEmployeePermissionMatrixQuery,
  useSaveEmployeePermissionsMutation,
  type PermissionActionDto,
} from '../../../features/permission/permissionApi';
import { useEmployeePendingChanges } from './permissionHooks';
import { EmployeeCard } from './EmployeeCard';
import { EmployeeChangesReviewModal } from './EmployeeChangesReviewModal';

export function EmployeePermissionTab() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedModuleKey, setSelectedModuleKey] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);

  const isAuthorized = user?.roleId === 5;

  const { changes, hasChanges, getEffective, cycle, setOverride, clear, getChangesForModule } = useEmployeePendingChanges();

  const { data: matrixResponse, isLoading, isFetching } = useGetEmployeePermissionMatrixQuery({
    search: search || undefined,
    moduleKey: undefined,
  });

  const [savePermissions, { isLoading: isSaving }] = useSaveEmployeePermissionsMutation();

  const matrix = matrixResponse?.data;

  const modules = useMemo(() => {
    if (!matrix) return [];
    return [...matrix.modules].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [matrix]);

  const actionsByModule = useMemo(() => {
    if (!matrix) return new Map<string, PermissionActionDto[]>();
    const map = new Map<string, PermissionActionDto[]>();
    for (const action of matrix.actions) {
      if (!map.has(action.moduleKey)) {
        map.set(action.moduleKey, []);
      }
      map.get(action.moduleKey)!.push(action);
    }
    return map;
  }, [matrix]);

  const selectedModule = useMemo(() => {
    if (!modules.length) return undefined;
    const key = selectedModuleKey || modules[0].moduleKey;
    return modules.find((m) => m.moduleKey === key) || modules[0];
  }, [modules, selectedModuleKey]);

  useEffect(() => {
    if (modules.length > 0 && !selectedModuleKey) {
      setSelectedModuleKey(modules[0].moduleKey);
    }
  }, [modules, selectedModuleKey]);

  const actions = useMemo(() => {
    if (!selectedModule || !matrix) return [];
    return actionsByModule.get(selectedModule.moduleKey) || [];
  }, [selectedModule, actionsByModule, matrix]);

  const filteredEmployees = useMemo(() => {
    if (!matrix) return [];
    if (!search.trim()) return matrix.employees;
    const q = search.toLowerCase();
    return matrix.employees.filter(
      (e) =>
        e.employeeName.toLowerCase().includes(q) ||
        (e.employeeCode && e.employeeCode.toLowerCase().includes(q)) ||
        e.positionName.toLowerCase().includes(q) ||
        e.departmentName.toLowerCase().includes(q)
    );
  }, [matrix, search]);

  const moduleChanges = useMemo(() => {
    if (!selectedModule) return [];
    return getChangesForModule(selectedModule.moduleKey);
  }, [selectedModule, getChangesForModule]);

  const allActions = useMemo(() => {
    if (!matrix) return [];
    return matrix.actions;
  }, [matrix]);

  const employeeNames = useMemo(() => {
    const map = new Map<number, { name: string; code: string }>();
    if (!matrix) return map;
    for (const emp of matrix.employees) {
      map.set(emp.employeeId, { name: emp.employeeName, code: emp.employeeCode || '' });
    }
    return map;
  }, [matrix]);

  const handleConfirmSave = async () => {
    if (!moduleChanges.length || !selectedModule) return;

    const byEmployee = new Map<number, { moduleKey: string; actionKey: string; override: boolean | null }[]>();
    for (const c of moduleChanges) {
      if (!byEmployee.has(c.employeeId)) {
        byEmployee.set(c.employeeId, []);
      }
      byEmployee.get(c.employeeId)!.push({ moduleKey: c.moduleKey, actionKey: c.actionKey, override: c.override });
    }

    const moduleKey = selectedModule.moduleKey;

    try {
      const promises: Promise<unknown>[] = [];
      for (const [employeeId, permissions] of byEmployee) {
        promises.push(
          savePermissions({
            employeeId,
            request: { moduleKey, permissions },
          }).unwrap()
        );
      }
      await Promise.all(promises);
      toast.success(`Employee overrides saved for ${byEmployee.size} employee(s) in "${selectedModule.displayName}"`);
      clear();
      setShowReviewModal(false);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? (err as { data: { message?: string } }).data?.message
          : undefined;
      toast.error(msg || 'Failed to save permissions. Your changes are still staged.');
    }
  };

  const handleDiscard = () => {
    clear();
    toast.success('Changes discarded');
  };

  const handleChangesClick = () => {
    setShowReviewModal(true);
  };

  const otherModuleChangesCount = changes.length - moduleChanges.length;
  const hasOtherModuleChanges = otherModuleChangesCount > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading employee permission matrix...</p>
        </div>
      </div>
    );
  }

  if (!matrix) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm">
          <AlertCircle className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">No Data Available</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Employee permission data is not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Sticky header bar */}
      <div className="sticky top-0 z-10 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Users className="h-6 w-6 text-indigo-500" />
              Employee Permissions
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage per-employee permission overrides
            </p>
          </div>
          {hasChanges && (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-amber-600 dark:text-amber-400 font-medium">
                {changes.length} unsaved change{changes.length !== 1 ? 's' : ''}
                {hasOtherModuleChanges && (
                  <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">
                    ({moduleChanges.length} in current module)
                  </span>
                )}
              </span>
              <button
                onClick={handleDiscard}
                className="px-3 py-2 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Discard</span>
              </button>
              <button
                onClick={handleChangesClick}
                disabled={!isAuthorized}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
              >
                <span>Changes</span>
                {moduleChanges.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-white/20 rounded-full">
                    {moduleChanges.length}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
        {hasChanges && (
          <div className="sm:hidden mt-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
            {changes.length} unsaved change{changes.length !== 1 ? 's' : ''}
            {hasOtherModuleChanges && (
              <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">
                ({moduleChanges.length} in current module)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, position, or department..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-400"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3.5 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
          Employee overrides take precedence over position permissions. Click a toggle to cycle through{' '}
          <strong>Inherit</strong> (position default), <strong>Allow</strong> (override grant), and{' '}
          <strong>Deny</strong> (override restriction). Only Audit users can manage overrides.
        </p>
      </div>

      {/* Two-pane layout */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Module sidebar */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden sticky top-24">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Modules</span>
            </div>
            <nav className="p-2 space-y-1 max-h-[calc(100vh-12rem)] overflow-y-auto">
              {modules.map((mod) => {
                const isActive = selectedModule?.moduleKey === mod.moduleKey;
                const count = actionsByModule.get(mod.moduleKey)?.length || 0;
                return (
                  <button
                    key={mod.moduleKey}
                    onClick={() => setSelectedModuleKey(mod.moduleKey)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium ring-1 ring-indigo-200 dark:ring-indigo-800'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{mod.displayName}</span>
                      <span className={`shrink-0 ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-indigo-100 dark:bg-indigo-800/30 text-indigo-600 dark:text-indigo-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-600'
                      }`}>
                        {count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Mobile horizontal scroll for modules */}
        <div className="lg:hidden overflow-x-auto -mx-1 pb-1 scrollbar-thin">
          <div className="flex gap-2">
            {modules.map((mod) => {
              const isActive = selectedModule?.moduleKey === mod.moduleKey;
              return (
                <button
                  key={mod.moduleKey}
                  onClick={() => setSelectedModuleKey(mod.moduleKey)}
                  className={`shrink-0 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium ring-1 ring-indigo-200 dark:ring-indigo-800'
                      : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 shadow-sm'
                  }`}
                >
                  {mod.displayName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main pane */}
        <div className="flex-1 min-w-0">
          {isFetching && !isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          )}

          {!selectedModule ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <AlertCircle className="h-14 w-14 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No permission modules available</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <AlertCircle className="h-14 w-14 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {search ? 'No employees match your search' : 'No employees with user accounts found'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Module header card */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                    <Shield className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {selectedModule.displayName}
                    </h2>
                    {selectedModule.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {selectedModule.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Employee cards */}
              {filteredEmployees.map((emp) => (
                <EmployeeCard
                  key={emp.employeeId}
                  employee={emp}
                  actions={actions}
                  getEffective={getEffective}
                  onCycle={cycle}
                  setOverride={setOverride}
                  changes={changes}
                  disabled={!isAuthorized}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Unauthorized warning */}
      {!isAuthorized && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3.5 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
            Only Audit users can manage employee permission overrides.
          </p>
        </div>
      )}

      {/* Summary */}
      {matrix && selectedModule && filteredEmployees.length > 0 && (
        <div className="text-xs text-slate-400 dark:text-slate-500 text-right border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
          Showing <strong className="text-slate-500 dark:text-slate-400">{filteredEmployees.length}</strong>{' '}
          employee{filteredEmployees.length !== 1 ? 's' : ''},{' '}
          <strong className="text-slate-500 dark:text-slate-400">{actions.length}</strong> action
          {actions.length !== 1 ? 's' : ''} in &ldquo;{selectedModule.displayName}&rdquo;
        </div>
      )}

      {/* Changes Review Modal */}
      {showReviewModal && selectedModule && (
        <EmployeeChangesReviewModal
          changes={moduleChanges}
          moduleDisplayName={selectedModule.displayName}
          employeeNames={employeeNames}
          allActions={allActions}
          onConfirm={handleConfirmSave}
          onCancel={() => setShowReviewModal(false)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
