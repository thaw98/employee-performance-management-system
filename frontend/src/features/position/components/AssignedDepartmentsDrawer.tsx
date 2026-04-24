import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Loader2, X } from 'lucide-react'
import { useGetDepartmentsByPositionIdQuery } from '../api/positionApi'

interface AssignedDepartmentsDrawerProps {
  isOpen: boolean
  onClose: () => void
  position: {
    id: number
    name: string
  } | null
}

export default function AssignedDepartmentsDrawer({
  isOpen,
  onClose,
  position,
}: AssignedDepartmentsDrawerProps) {
  const {
    data: departments = [],
    isFetching,
    isError,
  } = useGetDepartmentsByPositionIdQuery(position?.id ?? 0, {
    skip: !isOpen || !position,
  })

  const handleClose = () => {
    onClose()
  }

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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

        <div className="fixed inset-0 z-10 overflow-hidden">
          <div className="absolute inset-y-0 right-0 flex max-w-full">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300 sm:duration-500"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-300 sm:duration-500"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                <div className="flex h-full flex-col bg-white shadow-xl">
                  <div className="relative flex-shrink-0 overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-900 px-6 py-5">
                    <div className="relative flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-white">
                          <i className="bi bi-diagram-3 text-lg" aria-hidden />
                        </div>
                        <div className="min-w-0">
                          <Dialog.Title as="h2" className="text-lg font-bold leading-tight text-white">
                            Assigned Departments
                          </Dialog.Title>
                          <p className="mt-1 truncate text-sm font-medium text-indigo-100">
                            Departments assigned to {position?.name ?? 'this position'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/15 hover:text-white"
                        title="Close"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-5">
                    {isFetching ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                        <p className="mt-4 text-sm font-semibold text-slate-600">Loading assigned departments...</p>
                      </div>
                    ) : isError ? (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-700">
                        Failed to load assigned departments.
                      </div>
                    ) : departments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <i className="bi bi-building text-2xl" aria-hidden />
                        </div>
                        <p className="mt-4 max-w-sm text-sm font-semibold text-slate-600">
                          This position is not assigned to any department yet.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                Department Code
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                Department Name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {departments.map((department) => (
                              <tr key={department.departmentId}>
                                <td className="px-4 py-4 text-sm">
                                  <span className="font-mono font-semibold text-indigo-700">
                                    {department.departmentCode}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-sm font-medium text-slate-700">
                                  {department.departmentName}
                                </td>
                                <td className="px-4 py-4 text-sm">
                                  <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                                    View Only
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-shrink-0 justify-end border-t border-slate-100 bg-slate-50/80 px-6 py-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
