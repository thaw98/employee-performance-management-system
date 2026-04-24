import { Dialog, Transition } from '@headlessui/react'
import { Fragment, memo, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { PositionDto, LevelCodeOption, RoleOption } from '../api/positionApi'

const positionSchema = z.object({
  positionCode: z.string().min(1, 'Position code is required'),
  positionName: z.string().min(1, 'Position name is required'),
  levelCodeId: z.number().min(1, 'Level code is required'),
  roleId: z.number().min(1, 'Role is required'),
  status: z.enum(['ACTIVE', 'INACTIVE'], { message: 'Status must be ACTIVE or INACTIVE' }),
})

type PositionFormValues = z.infer<typeof positionSchema>

interface PositionModalProps {
  isOpen: boolean
  onClose: () => void
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
  status: (position?.status as 'ACTIVE' | 'INACTIVE') ?? 'ACTIVE',
})

function PositionModal({
  isOpen,
  onClose,
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

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, watch } = methods
  const statusValue = watch('status')

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
                  <div className={`absolute inset-0 bg-gradient-to-r ${isEdit ? 'from-blue-500/5 to-purple-500/5' : 'from-indigo-500/5 to-purple-500/5'}`} />

                  <div className="relative px-6 py-5 sm:px-8 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isEdit 
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200' 
                            : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200'
                        }`}>
                          <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-plus-lg'} text-white text-lg`}></i>
                        </div>
                        <div>
                          <Dialog.Title className="text-xl font-bold text-gray-900">
                            {isEdit ? 'Edit Position' : 'Create Position'}
                          </Dialog.Title>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {isEdit ? 'Update position details' : 'Fill in the information below to create a new position'}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors group"
                        title="Close"
                      >
                        <i className="bi bi-x-lg text-gray-400 group-hover:text-gray-600 transition-colors"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <FormProvider {...methods}>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="relative px-6 py-6 sm:px-8 space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <i className="bi bi-hash text-gray-400 text-sm"></i>
                            Position Code
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              {...register('positionCode')}
                              type="text"
                              disabled={isEdit}
                              className={`w-full pl-11 pr-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:outline-none ${
                                errors.positionCode 
                                  ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
                                  : 'border-gray-200 focus:ring-indigo-100 focus:border-indigo-500 hover:border-gray-300'
                              } ${isEdit ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                              placeholder="e.g. SE001"
                            />
                            <i className="bi bi-code-slash absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"></i>
                          </div>
                          {errors.positionCode && (
                            <div className="flex items-start gap-1.5 text-sm text-red-500 mt-1">
                              <i className="bi bi-exclamation-circle mt-0.5 flex-shrink-0"></i>
                              <span>{errors.positionCode.message}</span>
                            </div>
                          )}
                          {isEdit && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <i className="bi bi-lock-fill"></i>
                              Position code cannot be modified
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <i className="bi bi-person-badge text-gray-400 text-sm"></i>
                            Position Name
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              {...register('positionName')}
                              type="text"
                              className={`w-full pl-11 pr-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:outline-none ${
                                errors.positionName 
                                  ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
                                  : 'border-gray-200 focus:ring-indigo-100 focus:border-indigo-500 hover:border-gray-300'
                              } bg-white`}
                              placeholder="e.g. Software Engineer"
                            />
                            <i className="bi bi-textarea-t absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"></i>
                          </div>
                          {errors.positionName && (
                            <div className="flex items-start gap-1.5 text-sm text-red-500 mt-1">
                              <i className="bi bi-exclamation-circle mt-0.5 flex-shrink-0"></i>
                              <span>{errors.positionName.message}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <i className="bi bi-layers text-gray-400 text-sm"></i>
                            Level Code
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              {...register('levelCodeId', { valueAsNumber: true })}
                              className={`w-full pl-11 pr-10 py-3 border rounded-xl appearance-none transition-all duration-200 focus:ring-2 focus:outline-none bg-white cursor-pointer ${
                                errors.levelCodeId 
                                  ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
                                  : 'border-gray-200 focus:ring-indigo-100 focus:border-indigo-500 hover:border-gray-300'
                              }`}
                            >
                              <option value="">Select Level Code</option>
                              {levelCodes.map((lc) => (
                                <option key={lc.id} value={lc.id}>
                                  {lc.code}
                                </option>
                              ))}
                            </select>
                            <i className="bi bi-box-seam absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                          </div>
                          {errors.levelCodeId && (
                            <div className="flex items-start gap-1.5 text-sm text-red-500 mt-1">
                              <i className="bi bi-exclamation-circle mt-0.5 flex-shrink-0"></i>
                              <span>{errors.levelCodeId.message}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <i className="bi bi-shield-check text-gray-400 text-sm"></i>
                            Role
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              {...register('roleId', { valueAsNumber: true })}
                              className={`w-full pl-11 pr-10 py-3 border rounded-xl appearance-none transition-all duration-200 focus:ring-2 focus:outline-none bg-white cursor-pointer ${
                                errors.roleId 
                                  ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
                                  : 'border-gray-200 focus:ring-indigo-100 focus:border-indigo-500 hover:border-gray-300'
                              }`}
                            >
                              <option value="">Select Role</option>
                              {roles.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                            <i className="bi bi-person-gear absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                          </div>
                          {errors.roleId && (
                            <div className="flex items-start gap-1.5 text-sm text-red-500 mt-1">
                              <i className="bi bi-exclamation-circle mt-0.5 flex-shrink-0"></i>
                              <span>{errors.roleId.message}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <i className="bi bi-flag text-gray-400 text-sm"></i>
                          Status
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => methods.setValue('status', 'ACTIVE')}
                            className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2.5 ${
                              statusValue === 'ACTIVE'
                                ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                              statusValue === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-200'
                            }`}>
                              {statusValue === 'ACTIVE' && (
                                <i className="bi bi-check text-white text-xs"></i>
                              )}
                            </div>
                            <span className={`font-medium ${statusValue === 'ACTIVE' ? 'text-emerald-700' : 'text-gray-600'}`}>
                              Active
                            </span>
                            <i className={`bi bi-circle-fill text-xs ${statusValue === 'ACTIVE' ? 'text-emerald-500' : 'text-gray-300'}`}></i>
                          </button>

                          <button
                            type="button"
                            onClick={() => methods.setValue('status', 'INACTIVE')}
                            className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2.5 ${
                              statusValue === 'INACTIVE'
                                ? 'border-gray-400 bg-gradient-to-br from-gray-50 to-slate-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                              statusValue === 'INACTIVE' ? 'bg-gray-500' : 'bg-gray-200'
                            }`}>
                              {statusValue === 'INACTIVE' && (
                                <i className="bi bi-check text-white text-xs"></i>
                              )}
                            </div>
                            <span className={`font-medium ${statusValue === 'INACTIVE' ? 'text-gray-700' : 'text-gray-600'}`}>
                              Inactive
                            </span>
                            <i className={`bi bi-circle-fill text-xs ${statusValue === 'INACTIVE' ? 'text-gray-500' : 'text-gray-300'}`}></i>
                          </button>
                        </div>
                        <input {...register('status')} type="hidden" />
                        {errors.status && (
                          <div className="flex items-start gap-1.5 text-sm text-red-500 mt-1">
                            <i className="bi bi-exclamation-circle mt-0.5 flex-shrink-0"></i>
                            <span>{errors.status.message}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-6 py-4 sm:px-8 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
                      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                        <button
                          type="button"
                          onClick={onClose}
                          disabled={isSubmitting}
                          className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <i className="bi bi-x-circle"></i>
                          <span>Cancel</span>
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || isLoading}
                          className={`px-6 py-3 text-sm font-semibold text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                            isEdit 
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300' 
                              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300'
                          }`}
                        >
                          {(isSubmitting || isLoading) ? (
                            <>
                              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                              <span>Saving...</span>
                            </>
                          ) : isEdit ? (
                            <>
                              <i className="bi bi-check-circle"></i>
                              <span>Update Position</span>
                            </>
                          ) : (
                            <>
                              <i className="bi bi-plus-circle"></i>
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
