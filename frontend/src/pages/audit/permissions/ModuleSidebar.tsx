import { Shield } from 'lucide-react';
import type { PermissionModuleDto, PermissionActionDto } from '../../../features/permission/permissionApi';

interface ModuleSidebarProps {
  modules: PermissionModuleDto[];
  actionsByModule: Map<string, PermissionActionDto[]>;
  selectedModule: PermissionModuleDto | undefined;
  onSelect: (moduleKey: string) => void;
}

export function ModuleSidebar({ modules, actionsByModule, selectedModule, onSelect }: ModuleSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
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
                  onClick={() => onSelect(mod.moduleKey)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium ring-1 ring-indigo-200 dark:ring-indigo-800'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                  title={mod.description || mod.displayName}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{mod.displayName}</span>
                    <span
                      className={`shrink-0 ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-indigo-100 dark:bg-indigo-800/30 text-indigo-600 dark:text-indigo-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile horizontal scroll */}
      <div className="lg:hidden overflow-x-auto -mx-1 pb-1 scrollbar-thin">
        <div className="flex gap-2">
          {modules.map((mod) => {
            const isActive = selectedModule?.moduleKey === mod.moduleKey;
            return (
              <button
                key={mod.moduleKey}
                onClick={() => onSelect(mod.moduleKey)}
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
    </>
  );
}
