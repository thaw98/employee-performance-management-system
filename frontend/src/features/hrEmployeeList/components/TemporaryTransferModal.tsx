import { Fragment, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { skipToken } from '@reduxjs/toolkit/query'
import toast from 'react-hot-toast'
import { ArrowLeftRight, X } from 'lucide-react'

import {
  useGetDepartmentsQuery,
  useGetDepartmentPositionsQuery,
  type DepartmentOptionDto,
  type PositionOptionDto,
} from '../../hrCreateEmployee/hrEmployeeAccountApi'
import { useGetCurrentTransferQuery, useTemporaryTransferMutation, usePermanentTransferMutation } from '../employeeTransferApi'
import { employeeListInputBaseCompact as inputBase } from '../employeeListTheme'

interface TransferModalProps {
  isOpen: boolean
  employeeId: number | null
  employeeName: string
  onClose: () => void
  onSuccess?: () => void
}

type TransferType = 'TEMPORARY' | 'PERMANENT'

const addDaysToIsoDate = (date: string, days: number) => {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return ''

  const value = new Date(Date.UTC(year, month - 1, day + days))
  return value.toISOString().slice(0, 10)
}

function todayString() {
  // ISO input format for <input type="date">: YYYY-MM-DD
  return new Date().toISOString().split('T')[0]
}

export function TemporaryTransferModal({ isOpen, employeeId, employeeName, onClose, onSuccess }: TransferModalProps) {
  const [transferType, setTransferType] = useState<TransferType>('TEMPORARY')
  const [toDepartmentId, setToDepartmentId] = useState<number | ''>('')
  const [toPositionId, setToPositionId] = useState<number | ''>('')
  const [effectiveStartDate, setEffectiveStartDate] = useState(todayString())
  const [effectiveEndDate, setEffectiveEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [remarks, setRemarks] = useState('')

  const isTemporary = transferType === 'TEMPORARY'

  const { data: deptRes, isLoading: deptLoading } = useGetDepartmentsQuery(undefined, { skip: !isOpen })
  const departments: DepartmentOptionDto[] = deptRes?.data ?? []

  const { data: posRes, isLoading: posLoading } = useGetDepartmentPositionsQuery(
    isOpen && !!toDepartmentId ? Number(toDepartmentId) : skipToken,
  )
  const positions: PositionOptionDto[] = posRes?.data ?? []

  const { data: currentTransferRes } = useGetCurrentTransferQuery(employeeId ?? 0, {
    skip: !isOpen || !employeeId,
  })
  const currentTransfer = currentTransferRes?.data ?? null
  const previousEffectiveStartDate = currentTransfer?.effectiveStartDate ?? ''
  const minEffectiveStartDate = useMemo(
    () => previousEffectiveStartDate ? previousEffectiveStartDate : undefined,
    [previousEffectiveStartDate],
  )
  const minEffectiveEndDate = useMemo(
    () => effectiveStartDate ? addDaysToIsoDate(effectiveStartDate, 1) : undefined,
    [effectiveStartDate],
  )
  const hasInvalidStartDate = Boolean(
    previousEffectiveStartDate && effectiveStartDate && effectiveStartDate < previousEffectiveStartDate,
  )
  const hasInvalidEndDate = Boolean(
    effectiveStartDate && effectiveEndDate && effectiveEndDate <= effectiveStartDate,
  )

  const [temporaryTransfer, { isLoading: tempLoading }] = useTemporaryTransferMutation()
  const [permanentTransfer, { isLoading: permLoading }] = usePermanentTransferMutation()
  const isLoading = tempLoading || permLoading

  const reset = () => {
    setTransferType('TEMPORARY')
    setToDepartmentId('')
    setToPositionId('')
    setEffectiveStartDate(todayString())
    setEffectiveEndDate('')
    setReason('')
    setRemarks('')
  }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeId || !toDepartmentId || !toPositionId || !effectiveStartDate) {
      toast.error('Please fill in all required fields')
      return
    }
    if (isTemporary && !effectiveEndDate) {
      toast.error('Please fill in all required fields')
      return
    }
    if (hasInvalidStartDate) {
      return
    }
    if (isTemporary && hasInvalidEndDate) {
      toast.error('Effective end date must be after effective start date')
      return
    }
    try {
      if (isTemporary) {
        await temporaryTransfer({
          employeeId,
          body: {
            toDepartmentId: toDepartmentId as number,
            toPositionId: toPositionId as number,
            effectiveStartDate,
            effectiveEndDate,
            reason: reason || undefined,
            remarks: remarks || undefined,
          },
        }).unwrap()
        toast.success('Temporary transfer completed')
      } else {
        await permanentTransfer({
          employeeId,
          body: {
            toDepartmentId: toDepartmentId as number,
            toPositionId: toPositionId as number,
            effectiveStartDate,
            reason: reason || undefined,
            remarks: remarks || undefined,
          },
        }).unwrap()
        toast.success('Permanent transfer completed')
      }
      reset()
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } }
      toast.error(e?.data?.message || 'Transfer failed')
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                      <ArrowLeftRight size={18} />
                    </div>
                    <div className="min-w-0">
                      <Dialog.Title className="text-base font-bold text-gray-900">Transfer</Dialog.Title>
                      <p className="truncate text-xs text-gray-500">{employeeName}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="shrink-0 rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5 p-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Transfer Type <span className="text-red-400">*</span>
                    </label>
                    <select
                      className={inputBase}
                      value={transferType}
                      onChange={(e) => setTransferType(e.target.value as TransferType)}
                    >
                      <option value="TEMPORARY">Temporary Transfer</option>
                      <option value="PERMANENT">Permanent Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Target Department <span className="text-red-400">*</span>
                    </label>
                    <select
                      className={inputBase}
                      value={toDepartmentId}
                      onChange={(e) => { setToDepartmentId(Number(e.target.value) || ''); setToPositionId('') }}
                      disabled={deptLoading}
                      required
                    >
                      <option value="">Select department…</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Target Position <span className="text-red-400">*</span>
                    </label>
                    <select
                      className={inputBase}
                      value={toPositionId}
                      onChange={(e) => setToPositionId(Number(e.target.value) || '')}
                      disabled={!toDepartmentId || posLoading}
                      required
                    >
                      <option value="">{!toDepartmentId ? 'Select a department first' : 'Select position…'}</option>
                      {positions.map((p) => (
                        <option key={p.id} value={p.positionId}>{p.positionName} ({p.positionCode})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        {isTemporary ? 'Effective Start' : 'Effective Date'} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        className={inputBase}
                        value={effectiveStartDate}
                        min={minEffectiveStartDate}
                        onChange={(e) => setEffectiveStartDate(e.target.value)}
                        required
                      />
                      {hasInvalidStartDate ? (
                        <p className="mt-1 text-xs font-medium text-red-500">
                          Start date must be on or after the previous transfer ({previousEffectiveStartDate})
                        </p>
                      ) : null}
                    </div>

                    {isTemporary && (
                      <div className="min-w-0">
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                          Effective End <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="date"
                          className={inputBase}
                          value={effectiveEndDate}
                          min={minEffectiveEndDate}
                          onChange={(e) => setEffectiveEndDate(e.target.value)}
                          required
                        />
                        {hasInvalidEndDate ? (
                          <p className="mt-1 text-xs font-medium text-red-500">End date must be after the start date.</p>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Reason</label>
                    <select
                      className={inputBase}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    >
                      <option value="">Select reason…</option>
                      <option value="Project Assignment">Project Assignment</option>
                      <option value="Role Change">Role Change</option>
                      <option value="Team Restructuring">Team Restructuring</option>
                      <option value="Department Needs">Department Needs</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {reason === 'Other' && (
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">Remarks</label>
                      <textarea
                        className={inputBase}
                        rows={2}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Additional remarks…"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                    >
                      {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : null}
                      {isTemporary ? 'Confirm Temporary Transfer' : 'Confirm Permanent Transfer'}
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
