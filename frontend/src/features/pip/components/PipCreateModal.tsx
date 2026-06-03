import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ClipboardList, X } from 'lucide-react'
import { PipCreateForm } from '../../../pages/PipCreatePage'

type PipCreateModalProps = {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}

export function PipCreateModal({ isOpen, onClose, onCreated }: PipCreateModalProps) {
  const handleCreated = () => {
    onCreated?.()
    onClose()
  }

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 pt-6 sm:items-center sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-[0.98]"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-[0.98]"
            >
              <Dialog.Panel className="relative flex w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl">
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-8">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2463eb] text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.55)]">
                      <ClipboardList size={20} strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0">
                      <Dialog.Title className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                        Create New PIP
                      </Dialog.Title>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        Create a respectful, measurable Performance Improvement Plan.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="max-h-[min(82vh,900px)] overflow-y-auto px-4 pb-6 sm:px-6 sm:pb-8">
                  {isOpen ? (
                    <PipCreateForm embedded onCancel={onClose} onCreated={handleCreated} />
                  ) : null}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
