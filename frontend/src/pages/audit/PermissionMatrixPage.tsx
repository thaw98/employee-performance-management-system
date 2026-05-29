import React, { useState, useMemo, useCallback } from 'react';
import {
    Shield,
    Check,
    X,
    Save,
    Loader2,
    AlertCircle,
    Filter,
    ChevronDown,
    ChevronUp,
    Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    useGetPermissionMatrixQuery,
    useUpdatePositionPermissionsMutation,
    type PermissionMatrixPositionRow,
    type PermissionToggle,
} from '../../features/permission/permissionApi';

const PermissionMatrixPage: React.FC = () => {
    const [selectedLevelCode, setSelectedLevelCode] = useState<number | undefined>(undefined);
    const [selectedRoleId, setSelectedRoleId] = useState<number | undefined>(undefined);
    const [selectedModule, setSelectedModule] = useState<string | undefined>(undefined);
    const [expandedPositions, setExpandedPositions] = useState<Set<number>>(new Set());
    const [pendingChanges, setPendingChanges] = useState<
        Map<string, Map<string, boolean>>
    >(new Map());

    const { data: matrixResponse, isLoading, isFetching } = useGetPermissionMatrixQuery({
        levelCodeId: selectedLevelCode,
        roleId: selectedRoleId,
        moduleKey: selectedModule,
    });

    const [updatePermissions, { isLoading: isSaving }] =
        useUpdatePositionPermissionsMutation();

    const matrix = matrixResponse?.data;

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

    const groupedPositions = useMemo(() => {
        if (!matrix) return [];
        const groups = new Map<string, PermissionMatrixPositionRow[]>();
        for (const pos of matrix.positions) {
            const groupKey = pos.levelCode || 'Unassigned';
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey)!.push(pos);
        }
        return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [matrix]);

    const getEffectiveAllowed = useCallback(
        (positionId: number, moduleKey: string, actionKey: string, original: boolean): boolean => {
            const posChanges = pendingChanges.get(String(positionId));
            if (posChanges) {
                const key = `${moduleKey}:${actionKey}`;
                if (posChanges.has(key)) {
                    return posChanges.get(key)!;
                }
            }
            return original;
        },
        [pendingChanges]
    );

    const togglePermission = useCallback(
        (positionId: number, moduleKey: string, actionKey: string, currentAllowed: boolean) => {
            setPendingChanges((prev) => {
                const next = new Map(prev);
                const posKey = String(positionId);
                if (!next.has(posKey)) {
                    next.set(posKey, new Map());
                }
                const posMap = next.get(posKey)!;
                const changeKey = `${moduleKey}:${actionKey}`;
                posMap.set(changeKey, !currentAllowed);
                return next;
            });
        },
        []
    );

    const toggleAllForPosition = useCallback(
        (positionId: number, actions: { moduleKey: string; actionKey: string }[], allowed: boolean) => {
            setPendingChanges((prev) => {
                const next = new Map(prev);
                const posKey = String(positionId);
                if (!next.has(posKey)) {
                    next.set(posKey, new Map());
                }
                const posMap = next.get(posKey)!;
                for (const action of actions) {
                    posMap.set(`${action.moduleKey}:${action.actionKey}`, allowed);
                }
                return next;
            });
        },
        []
    );

    const toggleAllForModule = useCallback(
        (moduleKey: string, positions: PermissionMatrixPositionRow[], allowed: boolean) => {
            setPendingChanges((prev) => {
                const next = new Map(prev);
                for (const pos of positions) {
                    const posKey = String(pos.positionId);
                    if (!next.has(posKey)) {
                        next.set(posKey, new Map());
                    }
                    const posMap = next.get(posKey)!;
                    for (const perm of pos.permissions) {
                        if (perm.moduleKey === moduleKey) {
                            posMap.set(`${perm.moduleKey}:${perm.actionKey}`, allowed);
                        }
                    }
                }
                return next;
            });
        },
        []
    );

    const hasChanges = pendingChanges.size > 0;

    const getChangedPositionsCount = useCallback(() => {
        return pendingChanges.size;
    }, [pendingChanges]);

    const handleSave = async () => {
        const promises: Promise<unknown>[] = [];

        for (const [posKey, changes] of pendingChanges) {
            const positionId = Number(posKey);
            const permissions = Array.from(changes.entries()).map(([key, allowed]) => {
                const [moduleKey, actionKey] = key.split(':');
                return { moduleKey, actionKey, allowed };
            });

            promises.push(
                updatePermissions({
                    positionId,
                    request: { permissions },
                }).unwrap()
            );
        }

        try {
            await Promise.all(promises);
            toast.success(`Permissions updated for ${pendingChanges.size} position(s)`);
            setPendingChanges(new Map());
        } catch {
            toast.error('Failed to update permissions');
        }
    };

    const handleDiscard = () => {
        setPendingChanges(new Map());
        toast.success('Changes discarded');
    };

    const toggleExpand = (positionId: number) => {
        setExpandedPositions((prev) => {
            const next = new Set(prev);
            if (next.has(positionId)) {
                next.delete(positionId);
            } else {
                next.add(positionId);
            }
            return next;
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
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
                        Permission Matrix
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage permissions by position. Changes apply on the next page load.
                    </p>
                </div>
                {hasChanges && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-amber-600 dark:text-amber-400">
                            {getChangedPositionsCount()} unsaved change(s)
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Level Code
                        </label>
                        <select
                            value={selectedLevelCode ?? ''}
                            onChange={(e) =>
                                setSelectedLevelCode(e.target.value ? Number(e.target.value) : undefined)
                            }
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
                            onChange={(e) =>
                                setSelectedRoleId(e.target.value ? Number(e.target.value) : undefined)
                            }
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
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Module
                        </label>
                        <select
                            value={selectedModule ?? ''}
                            onChange={(e) => setSelectedModule(e.target.value || undefined)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="">All Modules</option>
                            {matrix?.modules.map((m) => (
                                <option key={m.moduleKey} value={m.moduleKey}>
                                    {m.displayName}
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
                    Permissions are resolved by position. Missing permission rows default to <strong>allowed</strong>.
                    Denying an action requires an explicit toggle to off. Audit role (ID 5) always has full access.
                </p>
            </div>

            {/* Permission Matrix Table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                {isFetching && !isLoading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 z-10 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                    </div>
                )}

                {matrix && matrix.positions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                        <p className="text-slate-500 dark:text-slate-400">No positions found matching the filters</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300 min-w-[200px]">
                                        Position
                                    </th>
                                    <th className="px-2 py-3 text-center font-medium text-slate-600 dark:text-slate-300 w-[80px]">
                                        Role
                                    </th>
                                    {matrix.actions.map((action) => (
                                        <th
                                            key={`${action.moduleKey}:${action.actionKey}`}
                                            className="px-2 py-2 text-center font-medium text-slate-600 dark:text-slate-300 min-w-[60px]"
                                            title={`${action.displayName} (${action.moduleKey})`}
                                        >
                                            <div className="text-[10px] leading-tight">{action.displayName}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {groupedPositions.map(([levelCode, positions]) => (
                                    <React.Fragment key={levelCode}>
                                        {/* Group header */}
                                        <tr className="bg-slate-100 dark:bg-slate-700/30 border-t border-slate-200 dark:border-slate-700">
                                            <td
                                                colSpan={2 + matrix.actions.length}
                                                className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wide"
                                            >
                                                Level Code: {levelCode}
                                                <span className="ml-2 text-slate-500 dark:text-slate-400 font-normal">
                                                    ({positions.length} position{positions.length !== 1 ? 's' : ''})
                                                </span>
                                            </td>
                                        </tr>

                                        {positions.map((pos) => {
                                            const isExpanded = expandedPositions.has(pos.positionId);
                                            const posChanges = pendingChanges.get(String(pos.positionId));
                                            const hasPosChanges = posChanges && posChanges.size > 0;

                                            return (
                                                <React.Fragment key={pos.positionId}>
                                                    <tr
                                                        className={`border-t border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 ${
                                                            hasPosChanges
                                                                ? 'bg-amber-50/50 dark:bg-amber-900/10'
                                                                : ''
                                                        }`}
                                                    >
                                                        <td className="px-4 py-2">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => toggleExpand(pos.positionId)}
                                                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                                                >
                                                                    {isExpanded ? (
                                                                        <ChevronUp size={14} />
                                                                    ) : (
                                                                        <ChevronDown size={14} />
                                                                    )}
                                                                </button>
                                                                <div>
                                                                    <div className="font-medium text-slate-900 dark:text-white text-sm">
                                                                        {pos.positionName}
                                                                    </div>
                                                                    {pos.positionCode && (
                                                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                                                            {pos.positionCode}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {hasPosChanges && (
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                                        Modified
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-2 py-2 text-center">
                                                            <span className="text-xs text-slate-600 dark:text-slate-400">
                                                                {pos.roleName}
                                                            </span>
                                                        </td>
                                                        {pos.permissions.map((perm) => {
                                                            const effective = getEffectiveAllowed(
                                                                pos.positionId,
                                                                perm.moduleKey,
                                                                perm.actionKey,
                                                                perm.allowed
                                                            );
                                                            const isChanged =
                                                                posChanges?.get(
                                                                    `${perm.moduleKey}:${perm.actionKey}`
                                                                ) !== undefined;

                                                            return (
                                                                <td
                                                                    key={`${perm.moduleKey}:${perm.actionKey}`}
                                                                    className="px-2 py-2 text-center"
                                                                >
                                                                    <button
                                                                        onClick={() =>
                                                                            togglePermission(
                                                                                pos.positionId,
                                                                                perm.moduleKey,
                                                                                perm.actionKey,
                                                                                effective
                                                                            )
                                                                        }
                                                                        className={`inline-flex items-center justify-center w-7 h-7 rounded-md border transition-colors ${
                                                                            effective
                                                                                ? 'bg-emerald-100 border-emerald-300 text-emerald-600 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400'
                                                                                : 'bg-red-100 border-red-300 text-red-600 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400'
                                                                        } ${
                                                                            isChanged
                                                                                ? 'ring-2 ring-amber-400 dark:ring-amber-500'
                                                                                : ''
                                                                        }`}
                                                                        title={`${effective ? 'Allowed' : 'Denied'} - Click to toggle`}
                                                                    >
                                                                        {effective ? (
                                                                            <Check size={14} />
                                                                        ) : (
                                                                            <X size={14} />
                                                                        )}
                                                                    </button>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>

                                                    {/* Expanded details row */}
                                                    {isExpanded && (
                                                        <tr className="bg-slate-50 dark:bg-slate-700/20">
                                                            <td
                                                                colSpan={2 + matrix.actions.length}
                                                                className="px-6 py-3"
                                                            >
                                                                <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                                                                    <span>
                                                                        <strong>Position ID:</strong> {pos.positionId}
                                                                    </span>
                                                                    <span>
                                                                        <strong>Level:</strong> {pos.levelCode} ({pos.levelCodeDescription})
                                                                    </span>
                                                                    <span>
                                                                        <strong>Role:</strong> {pos.roleName} (ID: {pos.roleId})
                                                                    </span>
                                                                    <div className="flex gap-2 ml-auto">
                                                                        <button
                                                                            onClick={() =>
                                                                                toggleAllForPosition(
                                                                                    pos.positionId,
                                                                                    pos.permissions.map((p) => ({
                                                                                        moduleKey: p.moduleKey,
                                                                                        actionKey: p.actionKey,
                                                                                    })),
                                                                                    true
                                                                                )
                                                                            }
                                                                            className="px-2 py-1 text-[10px] bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                                        >
                                                                            Allow All
                                                                        </button>
                                                                        <button
                                                                            onClick={() =>
                                                                                toggleAllForPosition(
                                                                                    pos.positionId,
                                                                                    pos.permissions.map((p) => ({
                                                                                        moduleKey: p.moduleKey,
                                                                                        actionKey: p.actionKey,
                                                                                    })),
                                                                                    false
                                                                                )
                                                                            }
                                                                            className="px-2 py-1 text-[10px] bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                                                                        >
                                                                            Deny All
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Summary */}
            {matrix && (
                <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
                    Showing {matrix.positions.length} position(s), {matrix.actions.length} action(s)
                </div>
            )}
        </div>
    );
};

export default PermissionMatrixPage;
