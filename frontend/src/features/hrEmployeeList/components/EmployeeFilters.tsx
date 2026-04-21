interface EmployeeFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  departmentId?: number
  onDepartmentChange: (value?: number) => void
  positionId?: number
  onPositionChange: (value?: number) => void
  employmentStatus?: string
  onStatusChange: (value?: string) => void
  departments: { departmentId: number; departmentName: string }[]
  positions: { positionId: number; positionName: string }[]
  onReset: () => void
}

export default function EmployeeFilters({
  search,
  onSearchChange,
  departmentId,
  onDepartmentChange,
  positionId,
  onPositionChange,
  employmentStatus,
  onStatusChange,
  departments,
  positions,
  onReset,
}: EmployeeFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Department */}
        <select
          className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={departmentId || ''}
          onChange={(e) => onDepartmentChange(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.departmentId} value={d.departmentId}>
              {d.departmentName}
            </option>
          ))}
        </select>

        {/* Position */}
        <select
          className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={positionId || ''}
          onChange={(e) => onPositionChange(e.target.value ? Number(e.target.value) : undefined)}
          disabled={!departmentId}
        >
          <option value="">All Positions</option>
          {positions.map((p) => (
            <option key={p.positionId} value={p.positionId}>
              {p.positionName}
            </option>
          ))}
        </select>

        {/* Employment Status */}
        <select
          className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={employmentStatus || ''}
          onChange={(e) => onStatusChange(e.target.value || undefined)}
        >
          <option value="">All Statuses</option>
          <option value="Probation">Probation</option>
          <option value="Permanent">Permanent</option>
          <option value="Resigned">Resigned</option>
          <option value="Terminated">Terminated</option>
        </select>

        {/* Reset */}
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <i className="bi bi-arrow-counterclockwise mr-2"></i>
          Reset Filters
        </button>
      </div>
    </div>
  )
}
