import { Shield, Check, X, Loader2, AlertTriangle, Save } from 'lucide-react';
import type { PendingChange } from './permissionHooks';

interface ChangeGroup {
  positionId: number;
  positionName: string;
  positionCode: string;
  roleName: string;
  allowed: { moduleKey: string; actionKey: string; actionName: string }[];
  denied: { moduleKey: string; actionKey: string; actionName: string }[];
}

interface ChangesReviewModalProps {
  changes: PendingChange[];
  moduleDisplayName: string;
  positionNames: Map<number, { name: string; code: string; roleName: string }>;
  allActions: { moduleKey: string; actionKey: string; displayName: string }[];
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export function ChangesReviewModal({
  changes,
  moduleDisplayName,
  positionNames,
  allActions,
  onConfirm,
  onCancel,
  isSaving,
}: ChangesReviewModalProps) {
  const actionNameMap = new Map<string, string>();
  for (const a of allActions) {
    actionNameMap.set(`${a.moduleKey}:${a.actionKey}`, a.displayName);
  }

  const groups = new Map<number, ChangeGroup>();
  for (const c of changes) {
    if (!groups.has(c.positionId)) {
      const info = positionNames.get(c.positionId) ?? { name: `Position #${c.positionId}`, code: '', roleName: '' };
      groups.set(c.positionId, {
        positionId: c.positionId,
        positionName: info.name,
        positionCode: info.code,
        roleName: info.roleName,
        allowed: [],
        denied: [],
      });
    }
    const group = groups.get(c.positionId)!;
    const actionName = actionNameMap.get(`${c.moduleKey}:${c.actionKey}`) || c.actionKey;
    if (c.allowed) {
      group.allowed.push({ moduleKey: c.moduleKey, actionKey: c.actionKey, actionName });
    } else {
      group.denied.push({ moduleKey: c.moduleKey, actionKey: c.actionKey, actionName });
    }
  }

  const groupedList = Array.from(groups.values());

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={isSaving ? undefined : onCancel} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
              <Shield className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Review Changes</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {changes.length} change{changes.length !== 1 ? 's' : ''} in &ldquo;{moduleDisplayName}&rdquo;
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {groupedList.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No changes to review.</p>
          ) : (
            groupedList.map((group) => (
              <div
                key={group.positionId}
                className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {group.positionName}
                    </span>
                    {group.positionCode && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        ({group.positionCode})
                      </span>
                    )}
                  </div>
                  {group.roleName && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{group.roleName}</p>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  {group.allowed.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" />
                        Allowed ({group.allowed.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.allowed.map((p) => (
                          <span
                            key={`allow-${p.moduleKey}:${p.actionKey}`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                          >
                            <Check className="h-3 w-3" />
                            {p.actionName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {group.denied.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1.5">
                        <X className="h-3.5 w-3.5" />
                        Denied ({group.denied.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.denied.map((p) => (
                          <span
                            key={`deny-${p.moduleKey}:${p.actionKey}`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-md border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                          >
                            <X className="h-3 w-3" />
                            {p.actionName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Warning */}
        <div className="px-6 py-3 bg-amber-50 dark:bg-amber-900/10 border-t border-amber-200 dark:border-amber-800 shrink-0">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              These changes will be applied immediately upon confirmation. Audit logging will record all
              permission changes with actor, timestamp, and before/after values.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSaving || changes.length === 0}
            className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Saving...' : `Confirm & Save (${changes.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
