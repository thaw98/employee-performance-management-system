import { useState } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import toast from 'react-hot-toast'
import { ArrowLeftRight, X } from 'lucide-react'

import {
  useGetDepartmentsQuery,
  useGetDepartmentPositionsQuery,
  type DepartmentOptionDto,
  type PositionOptionDto,
} from '../../hrCreateEmployee/hrEmployeeAccountApi'
import { useTemporaryTransferMutation } from '../employeeMovementApi'

interface TemporaryTransferModalProps {
  isOpen: boolean
  employeeId: number | null
  employeeName: string
  onClose: () => void
  onSuccess?: () => void
}

const inputBase = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]'

export function TemporaryTransferModal({ isOpen, employeeId, employeeName, onClose, onSuccess }: TemporaryTransferModalProps) {
  const [toDepartmentId, setToDepartmentId] = useState<number | ''>('')
  const [toPositionId, setToPositionId] = useState<number | ''>('')
  const [effectiveStartDate, setEffectiveStartDate] = useState('')
  const [reason, setReason] = useState('')
  const [remarks, setRemarks] = useState('')

  const { data: deptRes, isLoading: deptLoading } = useGetDepartmentsQuery(undefined, { skip: !isOpen })
  const departments: DepartmentOptionDto[] = deptRes?.data ?? []

  const { data: posRes, isLoading: posLoading } = useGetDepartmentPositionsQuery(
    isOpen && !!toDepartmentId ? Number(toDepartmentId) : skipToken,
  )
  const positions: PositionOptionDto[] = posRes?.data ?? []

  const [temporaryTransfer, { isLoading }] = useTemporaryTransferMutation()

  const reset = () => {
    setToDepartmentId('')
    setToPositionId('')
    setEffectiveStartDate('')
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
    try {
      await temporaryTransfer({
        employeeId,
        body: {
          toDepartmentId: toDepartmentId as number,
          toPositionId: toPositionId as number,
          effectiveStartDate,
          reason: reason || undefined,
          remarks: remarks || undefined,
        },
      }).unwrap()
      toast.success('Temporary transfer completed')
      reset()
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } }
      toast.error(e?.data?.message || 'Temporary transfer failed')
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={handleClose} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
                <ArrowLeftRight size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Temporary Transfer</h2>
                <p className="text-xs text-gray-500">{employeeName}</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Effective Start Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                className={inputBase}
                value={effectiveStartDate}
                onChange={(e) => setEffectiveStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Reason</label>
              <textarea
                className={inputBase}
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for temporary transfer…"
              />
            </div>

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

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : null}
                Confirm Transfer
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
