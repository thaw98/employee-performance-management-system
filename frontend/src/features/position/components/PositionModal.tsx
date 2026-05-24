import { Dialog, Transition } from '@headlessui/react'
import { Fragment, memo, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Hash, Briefcase, Layers, Shield,
  X, Check, Plus, Pencil,
} from 'lucide-react'
import type { PositionDto, LevelCodeOption, RoleOption } from '../api/positionApi'

const positionSchema = z.object({
  positionCode: z.string().min(1, 'Position code is required'),
  positionName: z.string().min(1, 'Position name is required'),
  levelCodeId: z.number().min(1, 'Level code is required'),
  roleId: z.number().min(1, 'Role is required'),
})

type PositionFormValues = z.infer<typeof positionSchema>

interface PositionModalProps {
  isOpen: boolean
  onClose: () => void
  onCancel?: () => void
  onSubmit: SubmitHandler<PositionFormValues>
  position?: PositionDto | null
  levelCodes: LevelCodeOption[]
  roles: RoleOption[]
  isLoading: boolean
  isEdit?: boolean
}

const getFormValues = (position?: PositionDto | null): PositionFormValues => ({
  positionCode: position?.positionCode ?? '',
  positionName: position?.positionName ?? '',
  levelCodeId: position?.levelCodeId ?? 0,
  roleId: position?.roleId ?? 0,
})

function PositionModal({
  isOpen,
  onClose,
  onCancel,
  onSubmit,
  position,
  levelCodes,
  roles,
  isLoading,
  isEdit = false,
}: PositionModalProps) {
  const methods = useForm<PositionFormValues>({
    resolver: zodResolver(positionSchema),
    defaultValues: getFormValues(position),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = methods

  useEffect(() => {
    if (!isOpen) return
    reset(getFormValues(position))
  }, [isOpen, position, reset])

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
          <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#2463eb]/5 to-[#1d4ed8]/5" />

                  <div className="relative px-6 py-5 sm:px-8 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] shadow-lg shadow-[#dbeafe]">
                          {isEdit ? (
                            <Pencil className="w-5 h-5 text-white" />
                          ) : (
                            <Plus className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <Dialog.Title className="text-xl font-bold text-slate-900">
                            {isEdit ? 'Edit Position' : 'Create Position'}
                          </Dialog.Title>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {isEdit ? 'Update position details' : 'Fill in the information below to create a new position'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={onClose}
                        className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors group"
                        title="Close"
                      >
                        <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>

                <FormProvider {...methods}>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="relative px-6 py-6 sm:px-8 space-y-5">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                         <div className="space-y-2">
                           <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                             <Hash className="w-4 h-4 text-slate-400" />
                             Position Code
                             <span className="text-red-500">*</span>
                           </label>
                           <div className="relative group">
                             <input
                               {...register('positionCode')}
                               type="text"
                               className={`w-full pl-11 pr-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:outline-none ${
                                 errors.positionCode
                                   ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                                   : 'border-slate-200 focus:ring-[#dbeafe] focus:border-[#2463eb] hover:border-slate-300'
                               } bg-white`}
                               placeholder="e.g. SE001"
                             />
                             <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#2463eb] transition-colors" />
                           </div>
                           {errors.positionCode && (
                             <div className="flex items-start gap-1.5 text-sm text-red-500 mt-1">
                               <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                               <span>{errors.positionCode.message}</span>
                             </div>
                           )}
                         </div>

                         <div className="space-y-2">
                           <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                             <Briefcase className="w-4 h-4 text-slate-400" />
                             Position Name
                             <span className="text-red-500">*</span>
                           </label>
                           <div className="relative group">
                             <input
                               {...register('positionName')}
                               type="text"
                               className={`w-full pl-11 pr-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:outline-none ${
                                 errors.positionName
                                   ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                                   : 'border-slate-200 focus:ring-[#dbeafe] focus:border-[#2463eb] hover:border-slate-300'
                               } bg-white`}
                               placeholder="e.g. Software Engineer"
                             />
                             <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#2463eb] transition-colors" />
                           </div>
                           {errors.positionName && (
                             <div className="flex items-start gap-1.5 text-sm text-red-500 mt-1">
                               <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                               <span>{errors.positionName.message}</span>
                             </div>
                           )}
                         </div>
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                         <div className="space-y-2">
                           <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                             <Layers className="w-4 h-4 text-slate-400" />
                             Level Code
                             <span className="text-red-500">*</span>
                           </label>
                           <div className="relative group">
                             <select
                               {...register('levelCodeId', { valueAsNumber: true })}
                               className={`w-full pl-11 pr-10 py-3 border rounded-xl appearance-none transition-all duration-200 focus:ring-2 focus:outline-none bg-white cursor-pointer ${
                                 errors.levelCodeId
                                   ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                                   : 'border-slate-200 focus:ring-[#dbeafe] focus:border-[#2463eb] hover:border-slate-300'
                               }`}
                             >
                               <option value="">Select Level Code</option>
                               {levelCodes.map((lc) => (
                                 <option key={lc.id} value={lc.id}>
                                   {lc.code}
                                 </option>
                               ))}
                             </select>
                             <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#2463eb] transition-colors" />
                             <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none flex items-center justify-center">
                               <X className="w-3 h-3 rotate-45" />
                             </div>
                           </div>
                           {errors.levelCodeId && (
                             <div className="flex items-start gap-1.5 text-sm text-red-500 mt-1">
                               <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                               <span>{errors.levelCodeId.message}</span>
                             </div>
                           )}
                         </div>

                         <div className="space-y-2">
                           <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                             <Shield className="w-4 h-4 text-slate-400" />
                             Role
                             <span className="text-red-500">*</span>
                           </label>
                           <div className="relative group">
                             <select
                               {...register('roleId', { valueAsNumber: true })}
                               className={`w-full pl-11 pr-10 py-3 border rounded-xl appearance-none transition-all duration-200 focus:ring-2 focus:outline-none bg-white cursor-pointer ${
                                 errors.roleId
                                   ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                                   : 'border-slate-200 focus:ring-[#dbeafe] focus:border-[#2463eb] hover:border-slate-300'
                               }`}
                             >
                               <option value="">Select Role</option>
                               {roles.map((r) => (
                                 <option key={r.id} value={r.id}>
                                   {r.name}
                                 </option>
                               ))}
                             </select>
                             <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#2463eb] transition-colors" />
                             <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none flex items-center justify-center">
                               <X className="w-3 h-3 rotate-45" />
                             </div>
                           </div>
                           {errors.roleId && (
                             <div className="flex items-start gap-1.5 text-sm text-red-500 mt-1">
                               <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                               <span>{errors.roleId.message}</span>
                             </div>
                           )}
                         </div>
                       </div>

                    </div>

                     <div className="px-6 py-4 sm:px-8 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/50">
                       <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                         {!isEdit && (
                           <button
                             type="button"
                             onClick={onCancel ?? onClose}
                             disabled={isSubmitting}
                             className="px-6 py-3 text-sm font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                           >
                             <X className="w-4 h-4" />
                             <span>Cancel</span>
                           </button>
                         )}
                         <button
                           type="submit"
                           disabled={isSubmitting || isLoading}
                           className="px-6 py-3 text-sm font-semibold text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] shadow-lg shadow-[#dbeafe] hover:shadow-xl"
                         >
                           {(isSubmitting || isLoading) ? (
                             <>
                               <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                               <span>Saving...</span>
                             </>
                           ) : isEdit ? (
                             <>
                               <Check className="w-4 h-4" />
                               <span>Update Position</span>
                             </>
                           ) : (
                             <>
                               <Plus className="w-4 h-4" />
                               <span>Create Position</span>
                             </>
                           )}
                         </button>
                       </div>
                     </div>
                  </form>
                </FormProvider>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default memo(PositionModal)
