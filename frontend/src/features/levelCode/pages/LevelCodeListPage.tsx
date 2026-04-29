import { useMemo, useState } from 'react'
import type { SortingState } from '@tanstack/react-table'
import toast from 'react-hot-toast'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Layers,
  Plus,
  Search,
  Shield,
  Users,
} from 'lucide-react'
import {
  useCreateLevelCodeMutation,
  useGetLevelCodesQuery,
  useUpdateLevelCodeMutation,
  type LevelCodeDto,
} from '../api/levelCodeApi'
import LevelCodeTable from '../components/LevelCodeTable'
import LevelCodeModal, { type LevelCodeFormValues } from '../components/LevelCodeModal'
import PositionRoleEditModal from '../components/PositionRoleEditModal'
import { useGetActiveRolesQuery } from '../../position/api/positionApi'

function LevelCodeListPage() {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [search, setSearch] = useState('')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'code', desc: false }])
  const [isLevelCodeModalOpen, setIsLevelCodeModalOpen] = useState(false)
  const [editingLevelCode, setEditingLevelCode] = useState<LevelCodeDto | null>(null)
  const [roleModalLevelCode, setRoleModalLevelCode] = useState<LevelCodeDto | null>(null)

  const { data, isLoading, refetch } = useGetLevelCodesQuery()
  const { data: rolesData } = useGetActiveRolesQuery()
  const [createLevelCode, { isLoading: isCreating }] = useCreateLevelCodeMutation()
  const [updateLevelCode, { isLoading: isUpdating }] = useUpdateLevelCodeMutation()

  const levelCodes = data?.data?.data ?? []
  const roles = rolesData?.data ?? []
  const totalPositions = levelCodes.reduce((sum, levelCode) => sum + levelCode.positionCount, 0)

  const filteredLevelCodes = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = query
      ? levelCodes.filter((levelCode) =>
          levelCode.code.toLowerCase().includes(query) ||
          (levelCode.description ?? '').toLowerCase().includes(query),
        )
      : levelCodes

    const [{ id, desc } = { id: 'code', desc: false }] = sorting
    return [...filtered].sort((a, b) => {
      const direction = desc ? -1 : 1
      if (id === 'positionCount') return (a.positionCount - b.positionCount) * direction
      const left = String(a[id as keyof LevelCodeDto] ?? '').toLowerCase()
      const right = String(b[id as keyof LevelCodeDto] ?? '').toLowerCase()
      return left.localeCompare(right) * direction
    })
  }, [levelCodes, search, sorting])

  const totalElements = filteredLevelCodes.length
  const totalPages = Math.ceil(totalElements / size)
  const pagedLevelCodes = filteredLevelCodes.slice(page * size, page * size + size)

  const handleSubmitLevelCode = async (values: LevelCodeFormValues) => {
    try {
      if (editingLevelCode) {
        await updateLevelCode({ id: editingLevelCode.id, body: { description: values.description?.trim() || undefined } }).unwrap()
        toast.success('Level code updated successfully')
      } else {
        await createLevelCode({ code: values.code.trim(), description: values.description?.trim() || undefined }).unwrap()
        toast.success('Level code created successfully')
      }
      setIsLevelCodeModalOpen(false)
      setEditingLevelCode(null)
      refetch()
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } }
      toast.error(err?.data?.message || 'Failed to save level code')
      throw error
    }
  }

  const getPageItems = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index)
    }

    const candidatePages = new Set<number>([
      0, 1, 2,
      totalPages - 3, totalPages - 2, totalPages - 1,
      page - 1, page, page + 1,
    ])

    const normalizedPages = [...candidatePages]
      .filter((value) => value >= 0 && value < totalPages)
      .sort((left, right) => left - right)

    const items: (number | 'ellipsis')[] = []
    let previous: number | null = null
    for (const pageNumber of normalizedPages) {
      if (previous !== null && pageNumber - previous > 1) {
        items.push('ellipsis')
      }
      items.push(pageNumber)
      previous = pageNumber
    }
    return items
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Level Code Management</h1>
                <p className="text-slate-500 text-sm font-medium">Manage level codes and role assignments by position</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingLevelCode(null)
                setIsLevelCodeModalOpen(true)
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 transition-all duration-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Create Level Code
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Level Codes</p>
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-bold text-slate-900">{levelCodes.length}</h3>
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl flex items-center justify-center">
                  <Layers className="w-7 h-7 text-indigo-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assigned Positions</p>
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-bold text-slate-900">{totalPositions}</h3>
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center">
                  <Users className="w-7 h-7 text-emerald-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">System Roles</p>
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-bold text-slate-900">{roles.length}</h3>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl flex items-center justify-center">
                  <Shield className="w-7 h-7 text-purple-600" />
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
                {search && (
                  <button type="button" onClick={() => { setSearch(''); setPage(0) }} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                    Clear all
                  </button>
                )}
              </div>
              <div className="relative max-w-xl">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => { setSearch(event.target.value); setPage(0) }}
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none"
                  placeholder="Search by level code or description"
                />
              </div>
            </div>

            <div className="p-6">
              <LevelCodeTable
                data={pagedLevelCodes}
                isLoading={isLoading}
                onRowClick={setRoleModalLevelCode}
                onEdit={(levelCode) => {
                  setEditingLevelCode(levelCode)
                  setIsLevelCodeModalOpen(true)
                }}
                sorting={sorting}
                setSorting={setSorting}
              />
            </div>

            {totalPages > 0 && (
              <div className="px-6 py-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500">Rows per page:</span>
                    <select value={size} onChange={(event) => { setSize(Number(event.target.value)); setPage(0) }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white">
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setPage(0)} disabled={page === 0} className="p-2 rounded-lg border border-slate-200 disabled:opacity-40"><ChevronsLeft className="w-4 h-4 text-slate-600" /></button>
                    <button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0} className="p-2 rounded-lg border border-slate-200 disabled:opacity-40"><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
                    {getPageItems().map((item, index) =>
                      item === 'ellipsis' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-slate-400 text-sm select-none">...</span>
                      ) : (
                        <button key={item} type="button" onClick={() => setPage(item)} className={`min-w-[38px] h-10 px-3 rounded-lg text-sm font-semibold ${page === item ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'border border-slate-200 text-slate-700 hover:bg-indigo-50'}`}>
                          {item + 1}
                        </button>
                      )
                    )}
                    <button type="button" onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))} disabled={page >= totalPages - 1} className="p-2 rounded-lg border border-slate-200 disabled:opacity-40"><ChevronRight className="w-4 h-4 text-slate-600" /></button>
                    <button type="button" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="p-2 rounded-lg border border-slate-200 disabled:opacity-40"><ChevronsRight className="w-4 h-4 text-slate-600" /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <LevelCodeModal
        isOpen={isLevelCodeModalOpen}
        onClose={() => setIsLevelCodeModalOpen(false)}
        onSubmit={handleSubmitLevelCode}
        levelCode={editingLevelCode}
        existingCodes={levelCodes.map((levelCode) => levelCode.code)}
        isLoading={isCreating || isUpdating}
      />
      <PositionRoleEditModal
        isOpen={!!roleModalLevelCode}
        onClose={() => setRoleModalLevelCode(null)}
        levelCode={roleModalLevelCode}
      />
    </div>
  )
}

export default LevelCodeListPage
