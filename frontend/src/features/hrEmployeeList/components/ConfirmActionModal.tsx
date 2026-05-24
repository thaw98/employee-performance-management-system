import { Dialog, Transition } from '@headlessui/react'
import { Fragment, memo, type ReactNode } from 'react'
import {
    AlertTriangle,
    CheckCircle2,
    Lock,
    LockOpen,
    RotateCcw,
    ShieldCheck,
    XCircle,
    ArrowLeft,
    Loader2,
} from 'lucide-react'

type ActionVariant = 'danger' | 'primary' | 'warning' | 'success' | 'info' | 'dark'

interface ConfirmActionModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    isLoading?: boolean
    variant?: ActionVariant
    icon?: ReactNode
    description?: string
    warningItems?: string[]
    employeeName?: string
}

const variantConfig: Record<ActionVariant, {
    iconBg: string
    iconText: string
    iconRing: string
    headerAccent: string
    confirmBg: string
    confirmHover: string
    confirmShadow: string
    badgeBg: string
    badgeText: string
    warningBg: string
    warningBorder: string
    warningText: string
    warningDot: string
    dividerGradient: string
}> = {
    danger: {
        iconBg: 'bg-red-50',
        iconText: 'text-red-600',
        iconRing: 'ring-red-100',
        headerAccent: 'from-red-50 to-white',
        confirmBg: 'bg-red-600',
        confirmHover: 'hover:bg-red-700',
        confirmShadow: 'shadow-red-200',
        badgeBg: 'bg-red-50',
        badgeText: 'text-red-700',
        warningBg: 'bg-red-50/60',
        warningBorder: 'border-red-200/80',
        warningText: 'text-red-700',
        warningDot: 'bg-red-400',
        dividerGradient: 'from-transparent via-red-200 to-transparent',
    },
    primary: {
        iconBg: 'bg-blue-50',
        iconText: 'text-blue-600',
        iconRing: 'ring-blue-100',
        headerAccent: 'from-blue-50/60 to-white',
        confirmBg: 'bg-gradient-to-r from-[#2463eb] to-[#1d4ed8]',
        confirmHover: 'hover:from-[#1d4ed8] hover:to-[#1e40af]',
        confirmShadow: 'shadow-blue-200',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-700',
        warningBg: 'bg-blue-50/50',
        warningBorder: 'border-blue-200/80',
        warningText: 'text-blue-700',
        warningDot: 'bg-blue-400',
        dividerGradient: 'from-transparent via-blue-200 to-transparent',
    },
    warning: {
        iconBg: 'bg-amber-50',
        iconText: 'text-amber-600',
        iconRing: 'ring-amber-100',
        headerAccent: 'from-amber-50/60 to-white',
        confirmBg: 'bg-amber-600',
        confirmHover: 'hover:bg-amber-700',
        confirmShadow: 'shadow-amber-200',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-700',
        warningBg: 'bg-amber-50/50',
        warningBorder: 'border-amber-200/80',
        warningText: 'text-amber-700',
        warningDot: 'bg-amber-400',
        dividerGradient: 'from-transparent via-amber-200 to-transparent',
    },
    success: {
        iconBg: 'bg-emerald-50',
        iconText: 'text-emerald-600',
        iconRing: 'ring-emerald-100',
        headerAccent: 'from-emerald-50/60 to-white',
        confirmBg: 'bg-emerald-600',
        confirmHover: 'hover:bg-emerald-700',
        confirmShadow: 'shadow-emerald-200',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-700',
        warningBg: 'bg-emerald-50/50',
        warningBorder: 'border-emerald-200/80',
        warningText: 'text-emerald-700',
        warningDot: 'bg-emerald-400',
        dividerGradient: 'from-transparent via-emerald-200 to-transparent',
    },
    info: {
        iconBg: 'bg-sky-50',
        iconText: 'text-sky-600',
        iconRing: 'ring-sky-100',
        headerAccent: 'from-sky-50/60 to-white',
        confirmBg: 'bg-sky-600',
        confirmHover: 'hover:bg-sky-700',
        confirmShadow: 'shadow-sky-200',
        badgeBg: 'bg-sky-50',
        badgeText: 'text-sky-700',
        warningBg: 'bg-sky-50/50',
        warningBorder: 'border-sky-200/80',
        warningText: 'text-sky-700',
        warningDot: 'bg-sky-400',
        dividerGradient: 'from-transparent via-sky-200 to-transparent',
    },
    dark: {
        iconBg: 'bg-slate-100',
        iconText: 'text-slate-700',
        iconRing: 'ring-slate-200',
        headerAccent: 'from-slate-50 to-white',
        confirmBg: 'bg-slate-900',
        confirmHover: 'hover:bg-black',
        confirmShadow: 'shadow-slate-300',
        badgeBg: 'bg-slate-100',
        badgeText: 'text-slate-700',
        warningBg: 'bg-slate-50',
        warningBorder: 'border-slate-200',
        warningText: 'text-slate-700',
        warningDot: 'bg-slate-400',
        dividerGradient: 'from-transparent via-slate-200 to-transparent',
    },
}

const defaultIcons: Partial<Record<ActionVariant, ReactNode>> = {
    danger: <XCircle size={22} />,
    primary: <ShieldCheck size={22} />,
    warning: <AlertTriangle size={22} />,
    success: <CheckCircle2 size={22} />,
}

function ConfirmActionModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isLoading = false,
    variant = 'primary',
    icon,
    description,
    warningItems,
    employeeName,
}: ConfirmActionModalProps) {
    const cfg = variantConfig[variant]
    const displayIcon = icon ?? defaultIcons[variant] ?? <ShieldCheck size={22} />

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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl sm:my-8 sm:w-full sm:max-w-[480px] border border-slate-200/60">
                                <div className={`bg-gradient-to-b ${cfg.headerAccent} px-7 pt-7 pb-5`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${cfg.iconBg} ring-1 ${cfg.iconRing} ${cfg.iconText} shadow-sm`}>
                                            {displayIcon}
                                        </div>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <Dialog.Title as="h3" className="text-[17px] font-bold leading-snug text-slate-900">
                                                {title}
                                            </Dialog.Title>
                                            {employeeName && (
                                                <p className="mt-1 text-[13px] font-medium text-slate-500">
                                                    {employeeName}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 ml-0">
                                        <p className="text-[13px] leading-relaxed text-slate-600">
                                            {message}
                                        </p>
                                    </div>

                                    {description && (
                                        <div className="mt-3 ml-0">
                                            <p className="text-[12px] leading-relaxed text-slate-500">
                                                {description}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {warningItems && warningItems.length > 0 && (
                                    <>
                                        <div className={`h-px bg-gradient-to-r ${cfg.dividerGradient}`} />
                                        <div className="px-7 py-4">
                                            <div className={`rounded-xl border ${cfg.warningBorder} ${cfg.warningBg} p-4`}>
                                                <p className={`text-[10px] font-bold uppercase tracking-widest ${cfg.warningText} mb-2.5`}>
                                                    Please note
                                                </p>
                                                <ul className="space-y-2">
                                                    {warningItems.map((item, idx) => (
                                                        <li key={idx} className="flex items-start gap-2.5">
                                                            <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${cfg.warningDot} shrink-0`} />
                                                            <span className={`text-[12px] leading-relaxed ${cfg.warningText}`}>
                                                                {item}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className={`h-px bg-gradient-to-r ${cfg.dividerGradient}`} />

                                <div className="bg-slate-50/60 px-7 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={onClose}
                                    >
                                        <ArrowLeft size={15} />
                                        {cancelText}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg ${cfg.confirmBg} ${cfg.confirmHover} shadow-sm ${cfg.confirmShadow} transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]`}
                                        onClick={onConfirm}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 size={15} className="animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            confirmText
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

export default memo(ConfirmActionModal)
