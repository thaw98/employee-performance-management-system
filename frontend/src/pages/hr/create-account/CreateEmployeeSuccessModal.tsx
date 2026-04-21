import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { CheckCircle, Mail, UserPlus, List, X } from 'lucide-react'

interface CreateEmployeeSuccessModalProps {
  open: boolean
  onClose: () => void
  employeeName: string
  email: string
  staffNo: string
  onCreateAnother: () => void
  onViewEmployeeList: () => void
  onResend: () => void
  resendLoading: boolean
}

export function CreateEmployeeSuccessModal({
  open,
  onClose,
  employeeName,
  email,
  staffNo,
  onCreateAnother,
  onViewEmployeeList,
  onResend,
  resendLoading,
}: CreateEmployeeSuccessModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* Accent strip */}
          <div className="h-1.5 bg-gradient-to-r from-teal-400 via-emerald-500 to-green-400" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>

          <div className="px-8 pt-8 pb-6">
            {/* Animated success icon */}
            <div className="mb-5 flex justify-center">
              <div className="animate-scale-in flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-500/30">
                <CheckCircle size={32} strokeWidth={2.5} />
              </div>
            </div>

            <DialogTitle className="text-center text-xl font-bold text-slate-900">
              Account Created Successfully
            </DialogTitle>

            <div className="mt-4 rounded-xl bg-slate-50 px-5 py-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500">Employee</span>
                  <span className="font-bold text-slate-900">{employeeName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500">Email</span>
                  <span className="font-semibold text-slate-800">{email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500">Staff ID</span>
                  <span className="font-mono font-bold text-teal-700">{staffNo}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50 px-4 py-3">
              <Mail size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-xs leading-relaxed text-amber-800">
                A temporary password has been sent to <strong>{email}</strong>. The employee must change their
                password on first login.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-8 py-5">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-center">
              <button
                type="button"
                onClick={onResend}
                disabled={resendLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50 disabled:opacity-60"
              >
                {resendLoading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-amber-800" />
                ) : (
                  <Mail size={15} />
                )}
                Resend Password
              </button>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={onCreateAnother}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-500/25 transition hover:shadow-lg active:scale-[0.98]"
                >
                  <UserPlus size={15} />
                  Create Another
                </button>
                <button
                  type="button"
                  onClick={onViewEmployeeList}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <List size={15} />
                  View Employee List
                </button>
              </div>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
