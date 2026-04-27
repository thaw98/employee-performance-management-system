import { Dialog, Transition } from '@headlessui/react'
import { Fragment, memo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, FileText, Hash, Layers, Plus, X } from 'lucide-react'
import type { LevelCodeDto } from '../api/levelCodeApi'

const schema = z.object({
  code: z.string().min(1, 'Level code is required').max(10, 'Level code must be at most 10 characters'),
  description: z.string().max(50, 'Description must be at most 50 characters').optional(),
})

export type LevelCodeFormValues = z.infer<typeof schema>

interface LevelCodeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: SubmitHandler<LevelCodeFormValues>
  levelCode?: LevelCodeDto | null
  existingCodes: string[]
  isLoading: boolean
}

function LevelCodeModal({ isOpen, onClose, onSubmit, levelCode, existingCodes, isLoading }: LevelCodeModalProps) {
  const isEdit = !!levelCode
  const methods = useForm<LevelCodeFormValues>({
    resolver: zodResolver(schema.refine(
      (data) => isEdit || !existingCodes.some((code) => code.toLowerCase() === data.code.trim().toLowerCase()),
      { message: 'Level code already exists', path: ['code'] },
    )),
    defaultValues: { code: '', description: '' },
  })
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = methods

  useEffect(() => {
    if (!isOpen) return
    reset({ code: levelCode?.code ?? '', description: levelCode?.description ?? '' })
  }, [isOpen, levelCode, reset])

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
                <div className="px-6 py-5 sm:px-8 border-b border-slate-200 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200">
                        {isEdit ? <Layers className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                      </div>
                      <Dialog.Title className="text-xl font-bold text-slate-900">{isEdit ? 'Edit Level Code' : 'Create Level Code'}</Dialog.Title>
                    </div>
                    <button type="button" onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors" title="Close">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="px-6 py-6 sm:px-8 space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Hash className="w-4 h-4 text-slate-400" />Level Code<span className="text-red-500">*</span></label>
                      <input {...register('code')} disabled={isEdit} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500" placeholder="e.g. L10" />
                      {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" />Description</label>
                      <input {...register('description')} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none" placeholder="Optional description" />
                      {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
                    </div>
                  </div>
                  <div className="px-6 py-4 sm:px-8 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/50 flex justify-end gap-3">
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-3 text-sm font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                    <button type="submit" disabled={isSubmitting || isLoading} className="px-5 py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      {isEdit ? 'Update Level Code' : 'Create Level Code'}
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

export default memo(LevelCodeModal)
