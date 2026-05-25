import { Dialog, Transition } from '@headlessui/react'
import { Fragment, memo } from 'react'
import {
    RotateCcw,
    ArrowLeft,
    Loader2,
    FileText,
    User,
    Award,
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
        title: 'Appraisal Returned',
        description: 'Status changes to Returned and the manager is notified immediately',
    },
    {
        icon: ClipboardCheck,
        title: 'Manager Revises',
        description: 'The manager reviews your comments, updates scores, and resubmits',
    },
    {
        icon: FileText,
        title: 'HR Re-reviews',
        description: 'The revised appraisal reappears here for your final approval',
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

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl sm:my-8 sm:w-full sm:max-w-[540px] border border-slate-200/60">
                                <div className="bg-gradient-to-b from-amber-50/80 to-white px-7 pt-7 pb-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 ring-1 ring-amber-200 text-amber-600 shadow-sm">
                                            <RotateCcw size={22} />
                                        </div>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <Dialog.Title as="h3" className="text-[17px] font-bold leading-snug text-slate-900">
                                                Return Appraisal for Correction
                                            </Dialog.Title>
                                            <p className="mt-1 text-[13px] font-medium text-slate-500">
                                                Send this evaluation back to the manager for revision
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 rounded-xl bg-white border border-amber-200/60 p-4 shadow-sm">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                                <User size={16} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-slate-900 truncate">{employeeName}</p>
                                                <p className="text-[11px] text-slate-500 font-medium truncate">
                                                    {[employeeId, department, position].filter(Boolean).join(' \u00b7 ')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {period && (
                                                <div className="rounded-lg bg-slate-50 px-2.5 py-2 text-center">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Period</p>
                                                    <p className="text-[11px] font-semibold text-slate-700 mt-0.5 truncate">{period}</p>
                                                </div>
                                            )}
                                            {totalScore != null && (
                                                <div className="rounded-lg bg-amber-50 px-2.5 py-2 text-center">
                                                    <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Score</p>
                                                    <p className="text-[11px] font-bold text-amber-700 mt-0.5">{totalScore.toFixed(1)}%</p>
                                                </div>
                                            )}
                                            {ratingCategory && (
                                                <div className="rounded-lg bg-slate-50 px-2.5 py-2 text-center">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Rating</p>
                                                    <p className="text-[11px] font-semibold text-slate-700 mt-0.5 truncate">{ratingCategory}</p>
                                                </div>
                                            )}
                                        </div>
                                        {currentStatus && (
                                            <div className="mt-3 flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current:</span>
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border bg-amber-50 text-amber-700 border-amber-200">
                                                    {currentStatus.replace(/_/g, ' ')}
                                                </span>
                                                <ArrowRight size={12} className="text-slate-300" />
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border bg-blue-50 text-blue-700 border-blue-200">
                                                    Returned
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {comments.trim() && (
                                    <>
                                        <div className="h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
                                        <div className="px-7 py-4">
                                            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                                                <MessageSquare size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Your Comments (will be sent to manager)</p>
                                                    <p className="text-[12px] leading-relaxed text-slate-600 italic line-clamp-3">
                                                        &ldquo;{comments.trim()}&rdquo;
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
                                <div className="px-7 py-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">What happens next</p>
                                    <div className="space-y-3">
                                        {workflowSteps.map((step, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <div className="flex flex-col items-center">
                                                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                                        idx === 0
                                                            ? 'bg-amber-100 text-amber-600'
                                                            : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                        <step.icon size={14} />
                                                    </div>
                                                    {idx < workflowSteps.length - 1 && (
                                                        <div className="w-px h-3 bg-slate-200 mt-1" />
                                                    )}
                                                </div>
                                                <div className="pt-0.5">
                                                    <p className={`text-[12px] font-semibold ${idx === 0 ? 'text-slate-800' : 'text-slate-600'}`}>
                                                        {step.title}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                                        {step.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
                                <div className="px-7 py-3">
                                    <div className="flex items-start gap-2.5 rounded-lg border border-amber-200/60 bg-amber-50/40 px-3.5 py-2.5">
                                        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-[11px] leading-relaxed text-amber-700">
                                            The manager must revise and resubmit the appraisal before it can be reviewed again. This action is recorded in the audit trail.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-slate-50/60 px-7 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={onClose}
                                    >
                                        <ArrowLeft size={15} />
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-amber-200 hover:bg-amber-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
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
