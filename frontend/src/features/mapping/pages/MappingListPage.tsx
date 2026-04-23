import { useState, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { useGetMappingsQuery, useCreateMappingMutation, useUpdateMappingMutation, useToggleMappingStatusMutation, useGetActiveDepartmentsQuery, useGetActivePositionsQuery, type DepartmentPositionMappingDto } from '../api/mappingApi'
import MappingTable from '../components/MappingTable'
import MappingModal from '../components/MappingModal'
import MappingFilters from '../components/MappingFilters'

function MappingListPage() {
  const [page, setPage] = useState(0)
  const size = 10
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMapping, setEditingMapping] = useState<DepartmentPositionMappingDto | null>(null)
  const searchDebounceRef = useRef<number | null>(null)

  const { data: mappingsData, isLoading, refetch } = useGetMappingsQuery({
    page,
    size,
    search: debouncedSearch,
  })

  const { data: departmentsData } = useGetActiveDepartmentsQuery()
  const { data: positionsData } = useGetActivePositionsQuery()
  const [createMapping] = useCreateMappingMutation()
  const [updateMapping] = useUpdateMappingMutation()
  const [toggleMappingStatus] = useToggleMappingStatusMutation()

  const departments = departmentsData?.data || []
  const positions = positionsData?.data || []

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current)
    }
    searchDebounceRef.current = window.setTimeout(() => {
      setDebouncedSearch(value)
      setPage(0)
    }, 300)
  }, [])

  const handleEdit = useCallback((id: number) => {
    const mapping = mappingsData?.data?.content.find(m => m.id === id)
    if (mapping) {
      setEditingMapping(mapping)
      setIsModalOpen(true)
    }
  }, [mappingsData])

  const handleToggleStatus = useCallback(async (id: number, currentStatus: string) => {
    try {
      await toggleMappingStatus(id).unwrap()
      toast.success(`Mapping ${currentStatus === 'ACTIVE' ? 'deactivated' : 'activated'} successfully`)
      refetch()
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } }
      toast.error(err?.data?.message || 'Failed to update mapping status')
    }
  }, [toggleMappingStatus, refetch])

  const handleCreateMapping = useCallback(async (data: { departmentId: number; positionId: number; status: string }) => {
    try {
      await createMapping(data).unwrap()
      toast.success('Mapping created successfully')
      setIsModalOpen(false)
      setEditingMapping(null)
      refetch()
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } }
      toast.error(err?.data?.message || 'Failed to create mapping')
      throw error
    }
  }, [createMapping, refetch])

  const handleUpdateMapping = useCallback(async (data: { departmentId: number; positionId: number; status: string }) => {
    if (!editingMapping) return
    try {
      await updateMapping({ id: editingMapping.id, body: data }).unwrap()
      toast.success('Mapping updated successfully')
      setIsModalOpen(false)
      setEditingMapping(null)
      refetch()
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } }
      toast.error(err?.data?.message || 'Failed to update mapping')
      throw error
    }
  }, [updateMapping, editingMapping, refetch])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingMapping(null)
  }, [])

  const handleOpenCreate = useCallback(() => {
    setEditingMapping(null)
    setIsModalOpen(true)
  }, [])

  const mappings = mappingsData?.data?.content || []
  const totalElements = mappingsData?.data?.totalElements || 0
  const totalPages = mappingsData?.data?.totalPages || 0

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department-Position Mapping</h1>
          <p className="text-sm text-gray-500 mt-1">Manage department-position mappings</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <i className="bi bi-plus-lg"></i>
          Create Mapping
        </button>
      </div>

      <MappingFilters search={search} onSearchChange={handleSearchChange} />

      <MappingTable
        data={mappings}
        isLoading={isLoading}
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">
            Showing {page * size + 1} to {Math.min((page + 1) * size, totalElements)} of {totalElements} entries
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <MappingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={editingMapping ? handleUpdateMapping : handleCreateMapping}
        mapping={editingMapping}
        departments={departments}
        positions={positions}
        isLoading={isLoading}
        isEdit={!!editingMapping}
      />
    </div>
  )
}

export default MappingListPage