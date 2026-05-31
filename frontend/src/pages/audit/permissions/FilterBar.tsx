import { Filter, Search, X } from 'lucide-react';

interface FilterBarProps {
  levelCodes: { id: number; code: string; description: string }[];
  roles: { id: number; name: string }[];
  selectedLevelCode: number | undefined;
  selectedRoleId: number | undefined;
  positionSearch: string;
  onLevelCodeChange: (value: number | undefined) => void;
  onRoleChange: (value: number | undefined) => void;
  onPositionSearchChange: (value: string) => void;
}

export function FilterBar({
  levelCodes,
  roles,
  selectedLevelCode,
  selectedRoleId,
  positionSearch,
  onLevelCodeChange,
  onRoleChange,
  onPositionSearchChange,
}: FilterBarProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Filters</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Level Code
          </label>
          <select
            value={selectedLevelCode ?? ''}
            onChange={(e) => onLevelCodeChange(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
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
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Role
          </label>
          <select
            value={selectedRoleId ?? ''}
            onChange={(e) => onRoleChange(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Search Position
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={positionSearch}
              onChange={(e) => onPositionSearchChange(e.target.value)}
              placeholder="Search by name or code..."
              className="w-full pl-9 pr-8 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
            />
            {positionSearch && (
              <button
                onClick={() => onPositionSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
