import { Dialog, Transition } from '@headlessui/react'
import { Fragment, memo, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Briefcase, Check, Layers, Loader2, Shield, X } from 'lucide-react'
import { useGetActiveRolesQuery } from '../../position/api/positionApi'
import type { LevelCodeDto } from '../api/levelCodeApi'
import { useGetLevelCodeDetailQuery, useUpdatePositionRoleMutation } from '../api/levelCodeApi'

interface PositionRoleEditModalProps {
  isOpen: boolean
  onClose: () => void
  levelCode: LevelCodeDto | null
}

function PositionRoleEditModal({ isOpen, onClose, levelCode }: PositionRoleEditModalProps) {
  const { data, isLoading, isFetching, isError, refetch } = useGetLevelCodeDetailQuery(levelCode?.id ?? 0, {
    skip: !isOpen || !levelCode,
  })
  const { data: rolesData, isLoading: isRolesLoading } = useGetActiveRolesQuery()
  const [updatePositionRole, { isLoading: isSaving }] = useUpdatePositionRoleMutation()
  const [selectedRoles, setSelectedRoles] = useState<Record<number, number>>({})

  const detail = data?.data
  const roles = rolesData?.data ?? []
  const positions = detail?.positions ?? []

  useEffect(() => {
    if (!detail) return
    setSelectedRoles(
      Object.fromEntries(detail.positions.map((position) => [position.positionId, position.roleId ?? 0])),
    )
  }, [detail])

  const handleSave = async (positionId: number) => {
    const roleId = selectedRoles[positionId]
    if (!roleId) {
      toast.error('Please select a role')
      return
    }

    try {
      await updatePositionRole({ positionId, body: { roleId } }).unwrap()
      toast.success('Position role updated successfully')
      refetch()
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } }
      toast.error(err?.data?.message || 'Failed to update position role')
    }
  }

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
                <div className="px-6 py-5 sm:px-8 border-b border-slate-200 bg-gradient-to-r from-[#2463eb]/5 to-[#1d4ed8]/5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] shadow-lg shadow-[#dbeafe]">
                        <Layers className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <Dialog.Title className="text-xl font-bold text-slate-900 truncate">
                          {levelCode?.code} - Position & Role Management
                        </Dialog.Title>
                        <p className="text-sm text-slate-500 mt-0.5">{positions.length} positions assigned to this level</p>
                      </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors" title="Close">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                </div>

                <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto">
                  {(isLoading || isFetching || isRolesLoading) && (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Loader2 className="w-10 h-10 text-[#2463eb] animate-spin" />
                      <p className="mt-3 text-sm text-slate-500 font-medium">Loading positions and roles...</p>
                    </div>
                  )}

                  {isError && !isLoading && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
                      Failed to load level code details.
                    </div>
                  )}

                  {!isLoading && !isFetching && !isError && positions.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
                      <Briefcase className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      <p className="font-semibold text-slate-700">No positions assigned to this level</p>
                    </div>
                  )}

                  {!isLoading && !isFetching && positions.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                          <tr>
                            <th className="px-5 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Position</th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Role</th>
                            <th className="px-5 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {positions.map((position) => {
                            const selectedRoleId = selectedRoles[position.positionId] ?? 0
                            const unchanged = selectedRoleId === (position.roleId ?? 0)
                            return (
                              <tr key={position.positionId}>
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-[#eff6ff] flex items-center justify-center">
                                      <Briefcase className="w-4 h-4 text-[#2463eb]" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-900">{position.positionCode}</p>
                                      <p className="text-sm text-slate-500">{position.positionName}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-4">
                                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${position.status?.toLowerCase() === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {position.status || 'UNKNOWN'}
                                  </span>
                                </td>
                                <td className="px-5 py-4">
                                  <div className="relative">
                                    <select
                                      value={selectedRoleId || ''}
                                      onChange={(event) => setSelectedRoles((current) => ({ ...current, [position.positionId]: Number(event.target.value) }))}
                                      className="w-full min-w-56 pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl appearance-none bg-white text-sm font-medium text-slate-700 focus:ring-2 focus:ring-[#dbeafe] focus:border-[#2463eb] focus:outline-none"
                                    >
                                      <option value="">Select Role</option>
                                      {roles.map((role) => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                      ))}
                                    </select>
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleSave(position.positionId)}
                                    disabled={isSaving || unchanged || !selectedRoleId}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Check className="w-4 h-4" />
                                    Save
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default memo(PositionRoleEditModal)
