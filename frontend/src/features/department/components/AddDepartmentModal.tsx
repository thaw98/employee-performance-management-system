import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { X, Save, Building2, Hash, AlertCircle } from 'lucide-react'
import { useCreateDepartmentMutation } from '../api/departmentApi'

const departmentSchema = z.object({
  departmentCode: z.string().trim().min(1, 'Department code is required.'),
  departmentName: z.string().trim().min(1, 'Department name is required.'),
  status: z.enum(['Active', 'Inactive']),
})

type DepartmentFormValues = z.infer<typeof departmentSchema>

interface AddDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  /** Called after a department is created successfully (e.g. refetch the list). */
  onSuccess?: () => void | Promise<void>
}

export default function AddDepartmentModal({ isOpen, onClose, onSuccess }: AddDepartmentModalProps) {
  const [createDepartment, { isLoading }] = useCreateDepartmentMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { status: 'Active' },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (data: DepartmentFormValues) => {
    try {
      await createDepartment(data).unwrap()
      toast.success('Department created successfully.')
      await onSuccess?.()
      reset()
      onClose()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create department.')
    }
  }

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>

        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
        </Transition.Child>

        {/* Panel */}
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 transition-all">

                {/* Gradient Header */}
                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-5 overflow-hidden">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />
                  <div className="absolute bottom-0 left-16 w-16 h-16 bg-white/5 rounded-full pointer-events-none" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 flex-shrink-0">
                        <Building2 size={20} className="text-white" />
                      </div>
                      <div>
                        <Dialog.Title as="h2" className="text-base font-bold text-white leading-tight">
                          Add New Department
                        </Dialog.Title>
                        <p className="text-blue-100 text-xs mt-0.5">Fill in the details to create a department</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors flex-shrink-0 mt-0.5"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">

                  {/* Department Code */}
                  <div>
                    <label htmlFor="add-dept-code" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      <Hash size={11} className="text-slate-400" />
                      Department Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="add-dept-code"
                      {...register('departmentCode')}
                      placeholder="e.g. ENG"
                      autoComplete="off"
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none
                        focus:ring-2 focus:ring-offset-0 placeholder:font-normal placeholder:text-slate-400
                        ${errors.departmentCode
                          ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-100 text-red-900'
                          : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-blue-100 text-slate-800'
                        }`}
                    />
                    {errors.departmentCode && (
                      <p className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1.5">
                        <AlertCircle size={12} />
                        {errors.departmentCode.message}
                      </p>
                    )}
                  </div>

                  {/* Department Name */}
                  <div>
                    <label htmlFor="add-dept-name" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      <Building2 size={11} className="text-slate-400" />
                      Department Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="add-dept-name"
                      {...register('departmentName')}
                      placeholder="e.g. Engineering"
                      autoComplete="off"
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none
                        focus:ring-2 focus:ring-offset-0 placeholder:font-normal placeholder:text-slate-400
                        ${errors.departmentName
                          ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-100 text-red-900'
                          : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-blue-100 text-slate-800'
                        }`}
                    />
                    {errors.departmentName && (
                      <p className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1.5">
                        <AlertCircle size={12} />
                        {errors.departmentName.message}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label htmlFor="add-dept-status" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Status
                    </label>
                    <select
                      id="add-dept-status"
                      {...register('status')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800
                        focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:ring-offset-0
                        outline-none transition-all cursor-pointer appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 14px center',
                      }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100 pt-1" />

                  {/* Footer Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold
                        hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                        bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold
                        shadow-lg shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700
                        active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save size={15} />
                      )}
                      {isLoading ? 'Saving...' : 'Save Department'}
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
