import { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Shield, ClipboardList, Loader2, AlertCircle, Info, X, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import type { RootState } from '../../../app/store';
import {
  useGetPermissionMatrixQuery,
  useUpdatePositionPermissionsMutation,
  type PermissionActionDto,
} from '../../../features/permission/permissionApi';
import { usePendingChanges, usePositionSearch } from './permissionHooks';
import { ModuleSidebar } from './ModuleSidebar';
import { FilterBar } from './FilterBar';
import { PositionCard } from './PositionCard';
import { ChangesReviewModal } from './ChangesReviewModal';
import { EmployeePermissionTab } from './EmployeePermissionTab';

type Tab = 'groups' | 'employees';

export default function PermissionMatrixPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<Tab>('groups');
  const [selectedLevelCode, setSelectedLevelCode] = useState<number | undefined>(undefined);
  const [selectedRoleId, setSelectedRoleId] = useState<number | undefined>(undefined);
  const [selectedModuleKey, setSelectedModuleKey] = useState<string | undefined>(undefined);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const isAuthorized = user?.roleId === 1 || user?.roleId === 5;

  const { changes, hasChanges, getEffective, toggle, setAll, clear, getChangesForModule } = usePendingChanges();

  const { data: matrixResponse, isLoading, isFetching } = useGetPermissionMatrixQuery({
    levelCodeId: selectedLevelCode,
    roleId: selectedRoleId,
    moduleKey: undefined,
  });

  const [updatePermissions, { isLoading: isSaving }] = useUpdatePositionPermissionsMutation();

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

  const levelCodes = useMemo(() => {
    if (!matrix) return [];
    const seen = new Map<number, { id: number; code: string; description: string }>();
    for (const pos of matrix.positions) {
      if (pos.levelCodeId && !seen.has(pos.levelCodeId)) {
        seen.set(pos.levelCodeId, {
          id: pos.levelCodeId,
          code: pos.levelCode,
          description: pos.levelCodeDescription,
        });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [matrix]);

  const roles = useMemo(() => {
    if (!matrix) return [];
    const seen = new Map<number, { id: number; name: string }>();
    for (const pos of matrix.positions) {
      if (pos.roleId && !seen.has(pos.roleId)) {
        seen.set(pos.roleId, { id: pos.roleId, name: pos.roleName });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [matrix]);

  const { search: positionSearch, setSearch: setPositionSearch, filtered: filteredPositions } =
    usePositionSearch(matrix?.positions || []);

  const positionNames = useMemo(() => {
    const map = new Map<number, { name: string; code: string; roleName: string }>();
    if (!matrix) return map;
    for (const pos of matrix.positions) {
      map.set(pos.positionId, { name: pos.positionName, code: pos.positionCode, roleName: pos.roleName });
    }
    return map;
  }, [matrix]);

  const moduleChanges = useMemo(() => {
    if (!selectedModule) return [];
    return getChangesForModule(selectedModule.moduleKey);
  }, [selectedModule, getChangesForModule]);

  const allActions = useMemo(() => {
    if (!matrix) return [];
    return matrix.actions;
  }, [matrix]);

  const handleConfirmSave = async () => {
    if (!moduleChanges.length || !selectedModule) return;

    const byPosition = new Map<number, { moduleKey: string; actionKey: string; allowed: boolean }[]>();
    for (const c of moduleChanges) {
      if (!byPosition.has(c.positionId)) {
        byPosition.set(c.positionId, []);
      }
      byPosition.get(c.positionId)!.push({ moduleKey: c.moduleKey, actionKey: c.actionKey, allowed: c.allowed });
    }

    const moduleKey = selectedModule.moduleKey;

    try {
      const promises: Promise<unknown>[] = [];
      for (const [positionId, permissions] of byPosition) {
        promises.push(
          updatePermissions({
            positionId,
            request: { moduleKey, permissions },
          }).unwrap()
        );
      }
      await Promise.all(promises);
      toast.success(`Permissions saved for ${byPosition.size} position(s) in "${selectedModule.displayName}"`);
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

  const tabs = (
    <div className="flex border-b border-slate-200 dark:border-slate-700">
      <button
        onClick={() => setActiveTab('groups')}
        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'groups'
            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
        }`}
      >
        <Shield className="h-4 w-4" />
        Groups
      </button>
      <button
        onClick={() => setActiveTab('employees')}
        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'employees'
            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
        }`}
      >
        <Users className="h-4 w-4" />
        Employees
      </button>
    </div>
  );

  if (activeTab === 'employees') {
    return (
      <div className="space-y-5">
        {tabs}
        <EmployeePermissionTab />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        {tabs}
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading permission matrix...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!matrix) {
    return (
      <div className="space-y-5">
        {tabs}
        <div className="flex flex-col items-center justify-center py-24">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm">
            <AlertCircle className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">No Data Available</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Permission data is not available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {tabs}

      {/* Sticky header bar */}
      <div className="sticky top-0 z-10 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Shield className="h-6 w-6 text-indigo-500" />
              Permission Groups
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage permissions by group and position
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
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Changes</span>
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

      {/* Filters */}
      <FilterBar
        levelCodes={levelCodes}
        roles={roles}
        selectedLevelCode={selectedLevelCode}
        selectedRoleId={selectedRoleId}
        positionSearch={positionSearch}
        onLevelCodeChange={setSelectedLevelCode}
        onRoleChange={setSelectedRoleId}
        onPositionSearchChange={setPositionSearch}
      />

      {/* Info banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3.5 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
          Permissions are resolved by position. <strong>Green</strong> means the permission is explicitly
          allowed. Admin (HR) and Audit roles can manage permissions. Use <strong>Changes</strong> to
          review and confirm staged edits for the current module only.
        </p>
      </div>

      {/* Two-pane layout */}
      <div className="flex flex-col lg:flex-row gap-5">
        <ModuleSidebar
          modules={modules}
          actionsByModule={actionsByModule}
          selectedModule={selectedModule}
          onSelect={setSelectedModuleKey}
        />

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
              <p className="text-slate-500 dark:text-slate-400 font-medium">No permission groups available</p>
            </div>
          ) : filteredPositions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <AlertCircle className="h-14 w-14 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {positionSearch ? 'No positions match your search' : 'No positions found matching the filters'}
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

              {/* Position cards */}
              {filteredPositions.map((pos) => (
                <PositionCard
                  key={pos.positionId}
                  position={pos}
                  actions={actions}
                  getEffective={getEffective}
                  onToggle={toggle}
                  onSetAll={setAll}
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
            You do not have permission to edit permissions. Contact an Admin or Audit user to make changes.
          </p>
        </div>
      )}

      {/* Summary */}
      {matrix && selectedModule && filteredPositions.length > 0 && (
        <div className="text-xs text-slate-400 dark:text-slate-500 text-right border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
          Showing <strong className="text-slate-500 dark:text-slate-400">{filteredPositions.length}</strong>{' '}
          position{filteredPositions.length !== 1 ? 's' : ''},{' '}
          <strong className="text-slate-500 dark:text-slate-400">{actions.length}</strong> action
          {actions.length !== 1 ? 's' : ''} in &ldquo;{selectedModule.displayName}&rdquo;
        </div>
      )}

      {/* Changes Review Modal */}
      {showReviewModal && selectedModule && (
        <ChangesReviewModal
          changes={moduleChanges}
          moduleDisplayName={selectedModule.displayName}
          positionNames={positionNames}
          allActions={allActions}
          onConfirm={handleConfirmSave}
          onCancel={() => setShowReviewModal(false)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
