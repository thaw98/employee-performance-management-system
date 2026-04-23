import { memo } from 'react'
import type { RoleOption } from '../api/positionApi'

interface PositionFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  selectedRoleId: number | null
  onRoleChange: (roleId: number | null) => void
  selectedStatus: string | null
  onStatusChange: (status: string | null) => void
  roles: RoleOption[]
}

function PositionFilters({
  search,
  onSearchChange,
  selectedRoleId,
  onRoleChange,
  selectedStatus,
  onStatusChange,
  roles,
}: PositionFiltersProps) {
  return (
    <div className="p-6 border-b border-gray-100">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by position code, name, or level code..."
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-56">
            <div className="relative">
              <i className="bi bi-person-badge absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <select
                value={selectedRoleId ?? ''}
                onChange={(e) => onRoleChange(e.target.value ? Number(e.target.value) : null)}
                className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow appearance-none bg-white text-sm cursor-pointer"
              >
                <option value="">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
            </div>
          </div>

          <div className="w-48">
            <div className="relative">
              <i className="bi bi-flag absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <select
                value={selectedStatus ?? ''}
                onChange={(e) => onStatusChange(e.target.value ? e.target.value : null)}
                className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow appearance-none bg-white text-sm cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(PositionFilters)