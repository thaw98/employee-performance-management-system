import { memo } from 'react'
import { Search, Shield, ChevronDown } from 'lucide-react'
import type { RoleOption } from '../api/positionApi'

interface PositionFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  selectedRoleId: number | null
  onRoleChange: (roleId: number | null) => void
  roles: RoleOption[]
}

function PositionFilters({
  search,
  onSearchChange,
  selectedRoleId,
  onRoleChange,
  roles,
}: PositionFiltersProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="flex-1 min-w-[280px]">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by position code, name, or level code..."
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 group-focus-within:shadow-lg group-focus-within:shadow-indigo-100"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="w-72">
          <div className="relative group">
            <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <select
              value={selectedRoleId ?? ''}
              onChange={(e) => onRoleChange(e.target.value ? Number(e.target.value) : null)}
              className="w-full pl-11 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all appearance-none bg-white text-sm text-slate-700 cursor-pointer hover:border-slate-300 group-focus-within:shadow-lg group-focus-within:shadow-indigo-100"
            >
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(PositionFilters)