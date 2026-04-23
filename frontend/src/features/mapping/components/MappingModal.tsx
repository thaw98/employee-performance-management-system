import { Dialog, Transition } from '@headlessui/react'
import { Fragment, memo } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { DepartmentPositionMappingDto, DepartmentOption, PositionOption } from '../api/mappingApi'

const mappingSchema = z.object({
  departmentId: z.number().min(1, 'Department is required'),
  positionId: z.number().min(1, 'Position is required'),
  status: z.enum(['ACTIVE', 'INACTIVE'], { message: 'Status must be ACTIVE or INACTIVE' }),
})

type MappingFormValues = z.infer<typeof mappingSchema>

interface MappingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: SubmitHandler<MappingFormValues>
  mapping?: DepartmentPositionMappingDto | null
  departments: DepartmentOption[]
  positions: PositionOption[]
  isLoading: boolean
  isEdit?: boolean
}

function MappingModal({
  isOpen,
  onClose,
  onSubmit,
  mapping,
  departments,
  positions,
  isLoading,
  isEdit = false,
}: MappingModalProps) {
  const methods = useForm<MappingFormValues>({
    resolver: zodResolver(mappingSchema),
    defaultValues: {
      departmentId: mapping?.departmentId || 0,
      positionId: mapping?.positionId || 0,
      status: (mapping?.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
    },
  })

  const { register, handleSubmit, formState: { errors } } = methods

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
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <Dialog.Title className="text-lg font-semibold">
                    {isEdit ? 'Edit Mapping' : 'Create Mapping'}
                  </Dialog.Title>
                  <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                <FormProvider {...methods}>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Department <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register('departmentId', { valueAsNumber: true })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                            errors.departmentId ? 'border-red-500' : 'border-gray-300'
                          }`}
                          disabled={isEdit}
                        >
                          <option value="">Select Department</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                        {errors.departmentId && (
                          <p className="mt-1 text-sm text-red-500">{errors.departmentId.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Position <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register('positionId', { valueAsNumber: true })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                            errors.positionId ? 'border-red-500' : 'border-gray-300'
                          }`}
                          disabled={isEdit}
                        >
                          <option value="">Select Position</option>
                          {positions.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.code})
                            </option>
                          ))}
                        </select>
                        {errors.positionId && (
                          <p className="mt-1 text-sm text-red-500">{errors.positionId.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register('status')}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                            errors.status ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                        {errors.status && (
                          <p className="mt-1 text-sm text-red-500">{errors.status.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="px-6 py-3 border-t bg-gray-50 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                            Saving...
                          </span>
                        ) : isEdit ? (
                          'Update Mapping'
                        ) : (
                          'Create Mapping'
                        )}
                      </button>
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

export default memo(MappingModal)