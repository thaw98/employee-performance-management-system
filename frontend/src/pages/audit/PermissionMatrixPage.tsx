import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    Shield,
    Check,
    X,
    Save,
    Loader2,
    AlertCircle,
    Filter,
    Info,
    Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    useGetPermissionMatrixQuery,
    useUpdatePositionPermissionsMutation,
    type PermissionActionDto,
} from '../../features/permission/permissionApi';

interface PendingChange {
    positionId: number;
    moduleKey: string;
    actionKey: string;
    allowed: boolean;
}

function usePendingChanges() {
    const [pending, setPending] = useState<Map<string, boolean>>(new Map());

    const getKey = (positionId: number, moduleKey: string, actionKey: string) =>
        `${positionId}:${moduleKey}:${actionKey}`;

    const getEffective = useCallback(
        (positionId: number, moduleKey: string, actionKey: string, original: boolean): boolean => {
            const k = getKey(positionId, moduleKey, actionKey);
            return pending.has(k) ? pending.get(k)! : original;
        },
        [pending, getKey]
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
        [getKey]
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
        [getKey]
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

const PermissionMatrixPage: React.FC = () => {
    const [selectedLevelCode, setSelectedLevelCode] = useState<number | undefined>(undefined);
    const [selectedRoleId, setSelectedRoleId] = useState<number | undefined>(undefined);
    const [selectedModuleKey, setSelectedModuleKey] = useState<string | undefined>(undefined);

    const { changes, hasChanges, getEffective, toggle, setAll, clear } = usePendingChanges();

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
                seen.set(pos.levelCodeId, { id: pos.levelCodeId, code: pos.levelCode, description: pos.levelCodeDescription });
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

    const filteredPositions = useMemo(() => {
        if (!matrix) return [];
        return matrix.positions;
    }, [matrix]);

    const handleSave = async () => {
        if (!changes.length) return;

        const byPosition = new Map<number, { moduleKey: string; actionKey: string; allowed: boolean }[]>();
        for (const c of changes) {
            if (!byPosition.has(c.positionId)) {
                byPosition.set(c.positionId, []);
            }
            byPosition.get(c.positionId)!.push({ moduleKey: c.moduleKey, actionKey: c.actionKey, allowed: c.allowed });
        }

        const promises: Promise<unknown>[] = [];
        for (const [positionId, permissions] of byPosition) {
            promises.push(updatePermissions({ positionId, request: { permissions } }).unwrap());
        }

        try {
            await Promise.all(promises);
            toast.success(`Permissions updated for ${byPosition.size} position(s)`);
            clear();
        } catch {
            toast.error('Failed to update permissions');
        }
    };

    const handleDiscard = () => {
        clear();
        toast.success('Changes discarded');
    };

    const positionHasChanges = (positionId: number) => {
        return changes.some((c) => c.positionId === positionId);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!matrix) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400">Permission data is not available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Shield className="h-6 w-6 text-indigo-500" />
                        Permission Groups
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage permissions by group and position
                    </p>
                </div>
                {hasChanges && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-amber-600 dark:text-amber-400">
                            {changes.length} unsaved change(s)
                        </span>
                        <button
                            onClick={handleDiscard}
                            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Save Changes
                        </button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Level Code
                        </label>
                        <select
                            value={selectedLevelCode ?? ''}
                            onChange={(e) => setSelectedLevelCode(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="">All Level Codes</option>
                            {levelCodes.map((lc) => (
                                <option key={lc.id} value={lc.id}>
                                    {lc.code} - {lc.description}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Role
                        </label>
                        <select
                            value={selectedRoleId ?? ''}
                            onChange={(e) => setSelectedRoleId(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="">All Roles</option>
                            {roles.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Info banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    Permissions are resolved by position. Green means the permission is explicitly allowed.
                    Audit role (ID 5) always has full access.
                </p>
            </div>

            {/* Two-pane layout */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left pane: module list */}
                <div className="w-full lg:w-64 shrink-0">
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                            <Layers className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Groups
                            </span>
                        </div>
                        <nav className="p-2 space-y-1">
                            {modules.map((mod) => {
                                const isActive = selectedModule?.moduleKey === mod.moduleKey;
                                const moduleActionCount = actionsByModule.get(mod.moduleKey)?.length || 0;
                                return (
                                    <button
                                        key={mod.moduleKey}
                                        onClick={() => setSelectedModuleKey(mod.moduleKey)}
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                            isActive
                                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{mod.displayName}</span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                                isActive
                                                    ? 'bg-indigo-100 dark:bg-indigo-800/30 text-indigo-600 dark:text-indigo-300'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                            }`}>
                                                {moduleActionCount}
                                            </span>
                                        </div>
                                        {mod.description && (
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                                {mod.description}
                                            </p>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Responsive: horizontally scrollable module list on small screens */}
                    <div className="lg:hidden mt-3 overflow-x-auto">
                        <div className="flex gap-2 pb-2">
                            {modules.map((mod) => {
                                const isActive = selectedModule?.moduleKey === mod.moduleKey;
                                return (
                                    <button
                                        key={mod.moduleKey}
                                        onClick={() => setSelectedModuleKey(mod.moduleKey)}
                                        className={`shrink-0 px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${
                                            isActive
                                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800'
                                                : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                        }`}
                                    >
                                        {mod.displayName}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Main pane: selected group details */}
                <div className="flex-1 min-w-0">
                    {isFetching && !isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                        </div>
                    )}

                    {!selectedModule ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-slate-500 dark:text-slate-400">No permission groups available</p>
                        </div>
                    ) : filteredPositions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-slate-500 dark:text-slate-400">No positions found matching the filters</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Module header */}
                            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-indigo-500" />
                                    {selectedModule.displayName}
                                </h2>
                                {selectedModule.description && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        {selectedModule.description}
                                    </p>
                                )}
                            </div>

                            {/* Position permission sections */}
                            {filteredPositions.map((pos) => {
                                const hasPosChanges = positionHasChanges(pos.positionId);

                                return (
                                    <div
                                        key={pos.positionId}
                                        className={`bg-white dark:bg-slate-800 rounded-lg border ${
                                            hasPosChanges
                                                ? 'border-amber-300 dark:border-amber-700'
                                                : 'border-slate-200 dark:border-slate-700'
                                        } overflow-hidden transition-colors`}
                                    >
                                        {/* Position header */}
                                        <div
                                            className={`flex items-center justify-between px-5 py-3 ${
                                                hasPosChanges ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {pos.positionName}
                                                    </span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                        {pos.positionCode} &middot; {pos.roleName} &middot; {pos.levelCode}
                                                    </span>
                                                </div>
                                                {hasPosChanges && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                        Modified
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() =>
                                                        setAll(
                                                            actions.map((a) => ({
                                                                positionId: pos.positionId,
                                                                moduleKey: a.moduleKey,
                                                                actionKey: a.actionKey,
                                                                allowed: true,
                                                            }))
                                                        )
                                                    }
                                                    className="px-2 py-1 text-[10px] bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                >
                                                    Allow All
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setAll(
                                                            actions.map((a) => ({
                                                                positionId: pos.positionId,
                                                                moduleKey: a.moduleKey,
                                                                actionKey: a.actionKey,
                                                                allowed: false,
                                                            }))
                                                        )
                                                    }
                                                    className="px-2 py-1 text-[10px] bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                                                >
                                                    Deny All
                                                </button>
                                            </div>
                                        </div>

                                        {/* Action cards */}
                                        <div className="px-5 pb-5">
                                            {actions.length === 0 ? (
                                                <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
                                                    No actions defined for this group
                                                </p>
                                            ) : (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-3">
                                                    {actions.map((action) => {
                                                        const perm = pos.permissions.find(
                                                            (p) => p.moduleKey === action.moduleKey && p.actionKey === action.actionKey
                                                        );
                                                        const original = perm?.allowed ?? false;
                                                        const effective = getEffective(
                                                            pos.positionId,
                                                            action.moduleKey,
                                                            action.actionKey,
                                                            original
                                                        );
                                                        const isChanged = changes.some(
                                                            (c) =>
                                                                c.positionId === pos.positionId &&
                                                                c.moduleKey === action.moduleKey &&
                                                                c.actionKey === action.actionKey
                                                        );

                                                        return (
                                                            <button
                                                                key={`${action.moduleKey}:${action.actionKey}`}
                                                                onClick={() =>
                                                                    toggle(
                                                                        pos.positionId,
                                                                        action.moduleKey,
                                                                        action.actionKey,
                                                                        effective
                                                                    )
                                                                }
                                                                className={`relative flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-lg border-2 transition-all ${
                                                                    effective
                                                                        ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-300'
                                                                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300 dark:bg-slate-700/30 dark:border-slate-600 dark:text-slate-500 dark:hover:border-slate-500'
                                                                } ${
                                                                    isChanged
                                                                        ? 'ring-2 ring-amber-400 dark:ring-amber-500'
                                                                        : ''
                                                                }`}
                                                                title={`${action.displayName} - Click to ${effective ? 'deny' : 'allow'}`}
                                                            >
                                                                {effective ? (
                                                                    <Check className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                                                                ) : (
                                                                    <X className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                                                                )}
                                                                <span className="text-xs font-medium leading-tight text-center">
                                                                    {action.displayName}
                                                                </span>
                                                                {isChanged && (
                                                                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-400 rounded-full" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Summary */}
            {matrix && selectedModule && (
                <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
                    Showing {filteredPositions.length} position(s), {actions.length} action(s) in &ldquo;{selectedModule.displayName}&rdquo;
                </div>
            )}
        </div>
    );
};

export default PermissionMatrixPage;
