import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import toast from 'react-hot-toast'
import { BriefcaseBusiness, ChevronRight, Save, Search, X } from 'lucide-react'
import {
  useAddPositionToDepartmentMutation,
} from '../api/departmentPositionsApi'
import {
  useGetPositionsQuery,
  type PositionDto,
} from '../../position/api/positionApi'
import {
  departmentsGradientBr,
  departmentsGradientR,
  departmentsGradientRHover,
} from '../../department/departmentsTheme'

interface AddPositionToDepartmentDrawerProps {
  isOpen: boolean
  onClose: () => void
  departmentId: number
  existingPositionIds: number[]
  onSuccess?: () => void | Promise<void>
}

export default function AddPositionToDepartmentDrawer({
  isOpen,
  onClose,
  departmentId,
  existingPositionIds,
  onSuccess,
}: AddPositionToDepartmentDrawerProps) {
  const [query, setQuery] = useState('')
  const [positionId, setPositionId] = useState<number | ''>('')
  const [showDropdown, setShowDropdown] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
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
  const selectedPosition = useMemo(() => positions.find((p: PositionDto) => p.positionId === positionId), [positions, positionId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClose = () => {
    setQuery('')
    setPositionId('')
    setShowDropdown(false)
    onClose()
  }

  const handleSelectPosition = (position: PositionDto) => {
    setPositionId(position.positionId)
    setQuery(`${position.positionCode} - ${position.positionName}`)
    setShowDropdown(false)
  }

  const handleSearchChange = (value: string) => {
    setQuery(value)
    setPositionId('')
    setShowDropdown(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!positionId) {
      toast.error('Please select a position.')
      return
    }

    try {
      await addPosition({ departmentId, positionId, status: 'Active' }).unwrap()
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

        <div className="fixed inset-0 z-10 overflow-hidden">
          <div className="absolute inset-y-0 right-0 flex max-w-full">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300 sm:duration-500"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-300 sm:duration-500"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                  <div className={`relative ${departmentsGradientBr} px-6 py-5 overflow-hidden flex-shrink-0`}>
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
                          <p className="text-[#dbeafe] text-xs mt-0.5">Map an existing position to this department</p>
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

                  <form id="add-position-form" onSubmit={handleSubmit} className="flex-1 px-6 py-5 space-y-4">
                    <div className="relative">
                      <label htmlFor="position-search" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                        <Search size={11} className="text-slate-400" />
                        Search Position <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          ref={searchInputRef}
                          id="position-search"
                          value={query}
                          onChange={(event) => handleSearchChange(event.target.value)}
                          onFocus={() => setShowDropdown(true)}
                          placeholder="Type to search positions..."
                          autoComplete="off"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 transition-all outline-none focus:bg-white focus:border-[#2463eb] focus:ring-2 focus:ring-[#dbeafe] placeholder:font-normal placeholder:text-slate-400"
                        />
                        {positionId && (
                          <button
                            type="button"
                            onClick={() => {
                              setQuery('')
                              setPositionId('')
                              setShowDropdown(false)
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>

                      {showDropdown && !positionId && (
                        <div
                          ref={dropdownRef}
                          className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50"
                        >
                          {isFetching ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="h-5 w-5 border-2 border-[#2463eb]/30 border-t-[#2463eb] rounded-full animate-spin" />
                            </div>
                          ) : availablePositions.length > 0 ? (
                            availablePositions.map((position) => (
                              <button
                                key={position.positionId}
                                type="button"
                                onClick={() => handleSelectPosition(position)}
                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#eff6ff] transition-colors border-b border-slate-100 last:border-b-0"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${departmentsGradientBr} flex items-center justify-center`}>
                                    <BriefcaseBusiness size={14} className="text-white" />
                                  </div>
                                  <div className="flex flex-col items-start">
                                    <span className="font-semibold text-slate-800 text-sm">{position.positionName}</span>
                                    <span className="font-mono font-semibold text-[#1d4ed8] text-xs">{position.positionCode}</span>
                                  </div>
                                </div>
                                <ChevronRight size={16} className="text-slate-300" />
                              </button>
                            ))
                          ) : (
                            <div className="py-8 text-center">
                              <p className="text-sm font-semibold text-slate-500">No positions found</p>
                              <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1" />
                  </form>

                  <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="add-position-form"
                      disabled={isSaving || !positionId}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl ${departmentsGradientR} text-white text-sm font-bold shadow-lg shadow-[#2463eb]/25 ${departmentsGradientRHover} active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {isSaving ? (
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save size={15} />
                      )}
                      {isSaving ? 'Saving...' : 'Add Position'}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
