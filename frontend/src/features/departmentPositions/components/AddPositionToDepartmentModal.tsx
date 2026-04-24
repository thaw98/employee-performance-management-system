import { Fragment, useMemo, useState, type FormEvent } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import toast from 'react-hot-toast'
import { AlertCircle, BriefcaseBusiness, CheckCircle2, Save, Search, X } from 'lucide-react'
import {
  useAddPositionToDepartmentMutation,
} from '../api/departmentPositionsApi'
import {
  useGetPositionsQuery,
  type PositionDto,
} from '../../position/api/positionApi'

interface AddPositionToDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  departmentId: number
  existingPositionIds: number[]
  onSuccess?: () => void | Promise<void>
}

const isActive = (status: unknown) => String(status ?? '').trim().toLowerCase() === 'active'

export default function AddPositionToDepartmentModal({
  isOpen,
  onClose,
  departmentId,
  existingPositionIds,
  onSuccess,
}: AddPositionToDepartmentModalProps) {
  const [query, setQuery] = useState('')
  const [positionId, setPositionId] = useState<number | ''>('')
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active')
  const [addPosition, { isLoading: isSaving }] = useAddPositionToDepartmentMutation()
  const { data: positionsResponse, isFetching } = useGetPositionsQuery({ page: 0, size: 500, sortBy: 'positionName', sortDir: 'asc' }, { skip: !isOpen })

  const existingIds = useMemo(() => new Set(existingPositionIds), [existingPositionIds])
  const positions = useMemo(() => positionsResponse?.data?.content ?? [], [positionsResponse?.data?.content])
  const availablePositions = useMemo(() => {
    const q = query.trim().toLowerCase()
    return positions
      .filter((position: PositionDto) => !existingIds.has(position.positionId))
      .filter((position: PositionDto) => {
        if (!q) return true
        return `${position.positionCode} ${position.positionName}`.toLowerCase().includes(q)
      })
  }, [existingIds, positions, query])

  const handleClose = () => {
    setQuery('')
    setPositionId('')
    setStatus('Active')
    onClose()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!positionId) {
      toast.error('Please select a position.')
      return
    }

    try {
      await addPosition({ departmentId, positionId, status }).unwrap()
      toast.success('Position added to department.')
      await onSuccess?.()
      handleClose()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to add position.')
    }
  }

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 transition-all">
                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-5 overflow-hidden">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />
                  <div className="absolute bottom-0 left-16 w-16 h-16 bg-white/5 rounded-full pointer-events-none" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 flex-shrink-0">
                        <BriefcaseBusiness size={20} className="text-white" />
                      </div>
                      <div>
                        <Dialog.Title as="h2" className="text-base font-bold text-white leading-tight">
                          Add Position
                        </Dialog.Title>
                        <p className="text-blue-100 text-xs mt-0.5">Map an existing position to this department</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors flex-shrink-0 mt-0.5"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                  <div>
                    <label htmlFor="position-search" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      <Search size={11} className="text-slate-400" />
                      Search Position
                    </label>
                    <input
                      id="position-search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search by code or name"
                      autoComplete="off"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 transition-all outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:font-normal placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label htmlFor="position-picker" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      <BriefcaseBusiness size={11} className="text-slate-400" />
                      Position <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="position-picker"
                      value={positionId}
                      onChange={(event) => setPositionId(event.target.value ? Number(event.target.value) : '')}
                      disabled={isFetching || availablePositions.length === 0}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:ring-offset-0 outline-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
                    >
                      <option value="">{isFetching ? 'Loading positions...' : 'Select a position'}</option>
                      {availablePositions.map((position) => (
                        <option key={position.positionId} value={position.positionId}>
                          {position.positionCode} - {position.positionName}{isActive(position.status) ? '' : ' (Inactive)'}
                        </option>
                      ))}
                    </select>
                    {!isFetching && availablePositions.length === 0 && (
                      <p className="mt-2 text-xs text-amber-600 font-medium flex items-center gap-1.5">
                        <AlertCircle size={12} />
                        No available positions match your search.
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="mapping-status" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      <CheckCircle2 size={11} className="text-slate-400" />
                      Status
                    </label>
                    <select
                      id="mapping-status"
                      value={status}
                      onChange={(event) => setStatus(event.target.value as 'Active' | 'Inactive')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:ring-offset-0 outline-none transition-all cursor-pointer appearance-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="border-t border-slate-100 pt-1" />

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving || !positionId}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save size={15} />
                      )}
                      {isSaving ? 'Saving...' : 'Add Position'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
