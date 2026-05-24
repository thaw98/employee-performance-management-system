import { Dialog, Transition } from '@headlessui/react'
import { Fragment, memo } from 'react'
import {
    RotateCcw,
    ArrowLeft,
    Loader2,
    FileText,
    User,
    MessageSquare,
    ClipboardCheck,
    ArrowRight,
    AlertTriangle,
} from 'lucide-react'

interface ReturnConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    isLoading: boolean
    employeeName: string
    employeeId?: string
    department?: string
    position?: string
    period?: string
    totalScore?: number
    ratingCategory?: string
    currentStatus?: string
    comments: string
}

const workflowSteps = [
    {
        icon: RotateCcw,
        title: 'Returned',
        description: 'Manager notified',
    },
    {
        icon: ClipboardCheck,
        title: 'Revised',
        description: 'Scores updated',
    },
    {
        icon: FileText,
        title: 'Re-reviewed',
        description: 'HR approves',
    },
]

function ReturnConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    employeeName,
    employeeId,
    department,
    position,
    period,
    totalScore,
    ratingCategory,
    currentStatus,
    comments,
}: ReturnConfirmationModalProps) {
    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[70]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[3px] transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-hidden p-3 sm:p-4">
                    <div className="flex h-full items-center justify-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative flex w-full max-w-[540px] max-h-full flex-col overflow-hidden rounded-xl bg-white text-left shadow-2xl border border-slate-200/60">
                                <div className="shrink-0 bg-gradient-to-b from-amber-50/80 to-white px-5 pt-5 pb-3.5">
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 ring-1 ring-amber-200 text-amber-600">
                                            <RotateCcw size={22} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <Dialog.Title as="h3" className="text-lg font-bold leading-snug text-slate-900">
                                                Return Appraisal for Correction
                                            </Dialog.Title>
                                            <p className="text-sm font-medium text-slate-500">
                                                Send back to the manager for revision
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3.5 rounded-lg border border-amber-200/60 bg-white p-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                                <User size={16} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-slate-900 truncate">{employeeName}</p>
                                                <p className="text-xs text-slate-500 font-medium truncate">
                                                    {[employeeId, department, position].filter(Boolean).join(' \u00b7 ')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                                            {period && (
                                                <div className="rounded-md bg-slate-50 px-2.5 py-2 text-center">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Period</p>
                                                    <p className="text-xs font-semibold text-slate-700 truncate">{period}</p>
                                                </div>
                                            )}
                                            {totalScore != null && (
                                                <div className="rounded-md bg-amber-50 px-2.5 py-2 text-center">
                                                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Score</p>
                                                    <p className="text-xs font-bold text-amber-700">{totalScore.toFixed(1)}%</p>
                                                </div>
                                            )}
                                            {ratingCategory && (
                                                <div className="rounded-md bg-slate-50 px-2.5 py-2 text-center">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rating</p>
                                                    <p className="text-xs font-semibold text-slate-700 truncate">{ratingCategory}</p>
                                                </div>
                                            )}
                                        </div>
                                        {currentStatus && (
                                            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase">Current:</span>
                                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border bg-amber-50 text-amber-700 border-amber-200">
                                                    {currentStatus.replace(/_/g, ' ')}
                                                </span>
                                                <ArrowRight size={13} className="text-slate-300" />
                                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border bg-blue-50 text-blue-700 border-blue-200">
                                                    Returned
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="shrink-0 min-h-0 flex-1 overflow-hidden px-5 pb-3.5 space-y-3">
                                    {comments.trim() && (
                                        <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5">
                                            <MessageSquare size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                                                    Your comments (sent to manager)
                                                </p>
                                                <p className="text-sm leading-snug text-slate-600 italic line-clamp-2">
                                                    &ldquo;{comments.trim()}&rdquo;
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2.5">
                                            What happens next
                                        </p>
                                        <div className="grid grid-cols-3 gap-3">
                                            {workflowSteps.map((step, idx) => (
                                                <div key={idx} className="relative text-center">
                                                    {idx < workflowSteps.length - 1 && (
                                                        <div
                                                            className="absolute top-4 left-[calc(50%+16px)] right-0 h-px bg-slate-200"
                                                            aria-hidden
                                                        />
                                                    )}
                                                    <div
                                                        className={`relative z-[1] mx-auto flex h-8 w-8 items-center justify-center rounded-lg ${
                                                            idx === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                                                        }`}
                                                    >
                                                        <step.icon size={15} />
                                                    </div>
                                                    <p
                                                        className={`mt-1.5 text-xs font-semibold leading-tight ${
                                                            idx === 0 ? 'text-slate-800' : 'text-slate-600'
                                                        }`}
                                                    >
                                                        {step.title}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 leading-snug">{step.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2.5 rounded-lg border border-amber-200/60 bg-amber-50/40 px-3.5 py-2.5">
                                        <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-xs leading-relaxed text-amber-700">
                                            Manager must revise and resubmit before re-review. Action is logged in the audit trail.
                                        </p>
                                    </div>
                                </div>

                                <div className="shrink-0 bg-slate-50/60 px-5 py-3.5 flex items-center justify-end gap-3 rounded-b-xl border-t border-slate-100">
                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={onClose}
                                    >
                                        <ArrowLeft size={15} />
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-200/80 hover:bg-amber-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                                        onClick={onConfirm}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 size={15} className="animate-spin" />
                                                Returning...
                                            </>
                                        ) : (
                                            <>
                                                <RotateCcw size={15} />
                                                Yes, Return Appraisal
                                            </>
                                        )}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}

export default memo(ReturnConfirmationModal)
