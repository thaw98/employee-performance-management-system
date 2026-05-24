import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle2, X } from 'lucide-react'

import { useMakePermanentMutation, type TransferHistoryItem } from '../employeeTransferApi'
import { employeeListInputBase as inputBase } from '../employeeListTheme'

interface MakePermanentModalProps {
  isOpen: boolean
  employeeId: number | null
  employeeName: string
  currentTransfer: TransferHistoryItem | null
  onClose: () => void
  onSuccess?: () => void
}

const readOnlyInput = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600'

function todayString() {
  return new Date().toISOString().split('T')[0]
}

export function MakePermanentModal({
  isOpen,
  employeeId,
  employeeName,
  currentTransfer,
  onClose,
  onSuccess,
}: MakePermanentModalProps) {
  const [effectiveStartDate, setEffectiveStartDate] = useState(todayString())
  const [reason, setReason] = useState('')
  const [remarks, setRemarks] = useState('')
  const [makePermanent, { isLoading }] = useMakePermanentMutation()

  const minDate = currentTransfer?.effectiveStartDate ?? ''
  const maxDate = currentTransfer?.effectiveEndDate ?? ''
  const defaultDate = useMemo(() => {
    const today = todayString()
    if (minDate && today < minDate) return minDate
    if (maxDate && today > maxDate) return maxDate
    return today
  }, [minDate, maxDate])

  useEffect(() => {
    if (isOpen) {
      setEffectiveStartDate(defaultDate)
      setReason('')
      setRemarks('')
    }
  }, [defaultDate, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeId || !currentTransfer || !effectiveStartDate) {
      toast.error('Please fill in all required fields')
      return
    }
    if (minDate && effectiveStartDate < minDate) {
      toast.error('Effective start date must be on or after the temporary start date')
      return
    }
    if (maxDate && effectiveStartDate > maxDate) {
      toast.error('Effective start date must be on or before the temporary end date')
      return
    }

    try {
      await makePermanent({
        employeeId,
        body: {
          effectiveStartDate,
          reason: reason || undefined,
          remarks: remarks || undefined,
        },
      }).unwrap()
      toast.success('Transfer made permanent')
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } }
      toast.error(e?.data?.message || 'Failed to make transfer permanent')
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] text-white shadow-sm shadow-[#dbeafe]">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Make Permanent</h2>
                <p className="text-xs text-gray-500">{employeeName}</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Temporary Department</label>
                <input className={readOnlyInput} value={currentTransfer?.toDepartmentName ?? '-'} readOnly />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Temporary Position</label>
                <input className={readOnlyInput} value={currentTransfer?.toPositionName ?? '-'} readOnly />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Temporary Start</label>
                <input className={readOnlyInput} value={currentTransfer?.effectiveStartDate ?? '-'} readOnly />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Temporary End</label>
                <input className={readOnlyInput} value={currentTransfer?.effectiveEndDate ?? '-'} readOnly />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Effective Start Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                className={inputBase}
                value={effectiveStartDate}
                min={minDate || undefined}
                max={maxDate || undefined}
                onChange={(e) => setEffectiveStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Reason</label>
              <textarea className={inputBase} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Remarks</label>
              <textarea className={inputBase} rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:from-[#1d4ed8] hover:to-[#1e40af] disabled:opacity-50 shadow-sm shadow-[#dbeafe]"
              >
                {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}
                Make Permanent
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
