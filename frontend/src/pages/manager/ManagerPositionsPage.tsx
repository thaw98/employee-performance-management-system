import { useMemo, useState, useCallback } from 'react'
import type { SortingState } from '@tanstack/react-table'
import { Briefcase, Building2, Filter, Shield, Users } from 'lucide-react'
import { useGetMyManagedDepartmentPositionsQuery } from '../../features/departmentPositions/api/departmentPositionsApi'
import type { DepartmentPositionMappingDto } from '../../features/departmentPositions/api/departmentPositionsApi'
import PositionFilters from '../../features/position/components/PositionFilters'
import PositionTable from '../../features/position/components/PositionTable'
import type { LevelCodeOption, PositionDto, RoleOption } from '../../features/position/api/positionApi'

const toPosition = (mapping: DepartmentPositionMappingDto): PositionDto => ({
  positionId: mapping.positionId,
  positionCode: mapping.positionCode,
  positionName: mapping.positionName,
  status: mapping.status,
  levelCodeId: mapping.levelCodeId ?? 0,
  levelCodeName: mapping.levelCodeName ?? 'Unassigned',
  roleId: mapping.roleId ?? 0,
  roleName: mapping.roleName ?? 'Unassigned',
  createdDate: mapping.createdOn,
  updatedDate: mapping.updatedOn,
})

const uniqueById = <T extends { id: number }>(items: T[]) => {
  const seen = new Set<number>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

function ManagerPositionsPage() {
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [selectedLevelCodeId, setSelectedLevelCodeId] = useState<number | null>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'positionCode', desc: false }])

  const { data: mappings = [], isLoading } = useGetMyManagedDepartmentPositionsQuery()

  const departmentName = mappings[0]?.departmentName ?? null
  const allPositions = useMemo(() => mappings.map(toPosition), [mappings])

  const roles = useMemo<RoleOption[]>(() => {
    return uniqueById(
      mappings
        .filter((mapping) => mapping.roleId != null)
        .map((mapping) => ({
          id: mapping.roleId as number,
          name: mapping.roleName ?? `Role #${mapping.roleId}`,
          description: null,
        }))
    )
  }, [mappings])

  const levelCodes = useMemo<LevelCodeOption[]>(() => {
    return uniqueById(
      mappings
        .filter((mapping) => mapping.levelCodeId != null)
        .map((mapping) => ({
          id: mapping.levelCodeId as number,
          code: mapping.levelCodeName ?? `Level #${mapping.levelCodeId}`,
          description: null,
        }))
    )
  }, [mappings])

  const filteredPositions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const sort = sorting[0] ?? { id: 'positionCode', desc: false }

    return allPositions
      .filter((position) => {
        const matchesSearch = !normalizedSearch || [
          position.positionCode,
          position.positionName,
          position.levelCodeName,
          position.roleName,
          position.status,
        ].some((value) => value.toLowerCase().includes(normalizedSearch))

        const matchesStatus = !selectedStatus || position.status?.toUpperCase() === selectedStatus
        const matchesRole = selectedRoleId == null || position.roleId === selectedRoleId
        const matchesLevel = selectedLevelCodeId == null || position.levelCodeId === selectedLevelCodeId

        return matchesSearch && matchesStatus && matchesRole && matchesLevel
      })
      .sort((a, b) => {
        const aValue = String(a[sort.id as keyof PositionDto] ?? '').toLowerCase()
        const bValue = String(b[sort.id as keyof PositionDto] ?? '').toLowerCase()
        const result = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' })
        return sort.desc ? -result : result
      })
  }, [allPositions, search, selectedLevelCodeId, selectedRoleId, selectedStatus, sorting])

  const clearFilters = useCallback(() => {
    setSearch('')
    setSelectedStatus(null)
    setSelectedRoleId(null)
    setSelectedLevelCodeId(null)
  }, [])

  const hasFilters = Boolean(search || selectedStatus || selectedRoleId || selectedLevelCodeId)
  const activeCount = allPositions.filter((position) => position.status?.toUpperCase() === 'ACTIVE').length
  const emptyDescription = allPositions.length === 0
    ? 'Your account is not currently mapped as a department manager, or the department has no mapped positions.'
    : 'Try adjusting your search or filters.'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] rounded-2xl flex items-center justify-center shadow-lg shadow-[#dbeafe]">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Department Positions</h1>
                  <p className="text-slate-500 text-sm font-medium">
                    {departmentName ? `${departmentName} mapped positions` : 'Mapped positions for your managed department'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Department</p>
                  <h3 className="text-2xl font-bold text-slate-900">{departmentName ?? 'Not assigned'}</h3>
                </div>
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mapped Positions</p>
                  <h3 className="text-3xl font-bold text-slate-900">{allPositions.length}</h3>
                </div>
                <div className="w-14 h-14 bg-[#eff6ff] rounded-2xl flex items-center justify-center">
                  <Users className="w-7 h-7 text-[#2463eb]" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Active Mappings</p>
                  <h3 className="text-3xl font-bold text-slate-900">{activeCount}</h3>
                </div>
                <div className="w-14 h-14 bg-[#eff6ff] rounded-2xl flex items-center justify-center">
                  <Shield className="w-7 h-7 text-[#2463eb]" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-slate-400" />
                  <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
                </div>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-medium text-[#2463eb] hover:text-[#1d4ed8] flex items-center gap-1 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <PositionFilters
                search={search}
                onSearchChange={setSearch}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                selectedRoleId={selectedRoleId}
                onRoleChange={setSelectedRoleId}
                roles={roles}
                selectedLevelCodeId={selectedLevelCodeId}
                onLevelCodeChange={setSelectedLevelCodeId}
                levelCodes={levelCodes}
              />
            </div>

            <div className="p-6">
              <PositionTable
                data={filteredPositions}
                isLoading={isLoading}
                sorting={sorting}
                setSorting={setSorting}
                showStatus
                emptyTitle="No mapped positions found"
                emptyDescription={emptyDescription}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManagerPositionsPage
