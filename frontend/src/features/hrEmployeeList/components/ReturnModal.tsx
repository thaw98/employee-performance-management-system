import { useState } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import toast from 'react-hot-toast'
import { RotateCcw, X } from 'lucide-react'

import {
  useGetDepartmentPositionsQuery,
  type PositionOptionDto,
} from '../../hrCreateEmployee/hrEmployeeAccountApi'
import { useReturnFromTemporaryMutation, useGetHomeDepartmentQuery } from '../employeeTransferApi'
import { employeeListInputBase as inputBase } from '../employeeListTheme'

interface ReturnModalProps {
  isOpen: boolean
  employeeId: number | null
  employeeName: string
  onClose: () => void
  onSuccess?: () => void
}

const readOnlyInput = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 cursor-not-allowed'

export function ReturnModal({ isOpen, employeeId, employeeName, onClose, onSuccess }: ReturnModalProps) {
  const [toPositionId, setToPositionId] = useState<number | ''>('')
  const [effectiveStartDate, setEffectiveStartDate] = useState('')
  const [reason, setReason] = useState('')
  const [remarks, setRemarks] = useState('')

  const { data: homeRes, isLoading: homeLoading } = useGetHomeDepartmentQuery(employeeId ?? 0, {
    skip: !isOpen || !employeeId,
  })
  const homeDept = homeRes?.data

  const { data: posRes, isLoading: posLoading } = useGetDepartmentPositionsQuery(
    isOpen && !!homeDept?.departmentId ? homeDept.departmentId : skipToken,
  )
  const positions: PositionOptionDto[] = posRes?.data ?? []

  const [returnFromTemporary, { isLoading }] = useReturnFromTemporaryMutation()

  const reset = () => {
    setToPositionId('')
    setEffectiveStartDate('')
    setReason('')
    setRemarks('')
  }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeId || !toPositionId || !effectiveStartDate) {
      toast.error('Please fill in all required fields')
      return
    }
    try {
      await returnFromTemporary({
        employeeId,
        body: {
          toPositionId: toPositionId as number,
          effectiveStartDate,
          reason: reason || undefined,
          remarks: remarks || undefined,
        },
      }).unwrap()
      toast.success('Return completed')
      reset()
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } }
      toast.error(e?.data?.message || 'Return failed')
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white">
                <RotateCcw size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Return from Temporary</h2>
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
                Home Department (derived)
              </label>
              {homeLoading ? (
                <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
              ) : (
                <input
                  type="text"
                  className={readOnlyInput}
                  value={homeDept?.departmentName ?? 'Unable to determine home department'}
                  readOnly
                />
              )}
              <p className="mt-1 text-xs text-gray-400">Automatically derived from transfer history.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Return Position <span className="text-red-400">*</span>
              </label>
              <select
                className={inputBase}
                value={toPositionId}
                onChange={(e) => setToPositionId(Number(e.target.value) || '')}
                disabled={!homeDept || posLoading}
                required
              >
                <option value="">{!homeDept ? 'Loading home department…' : 'Select position…'}</option>
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
                placeholder="Reason for return…"
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
                disabled={isLoading || homeLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : null}
                Confirm Return
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
