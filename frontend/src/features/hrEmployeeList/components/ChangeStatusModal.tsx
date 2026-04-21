import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState, useMemo, memo } from 'react'

interface ChangeStatusModalProps {
  isOpen: boolean
  currentStatus: 'Probation' | 'Permanent' | 'Resigned' | 'Terminated'
  onClose: () => void
  onConfirm: (targetStatus: string, probationEndDate?: string) => void
  isLoading?: boolean
}

function ChangeStatusModal({
  isOpen,
  currentStatus,
  onClose,
  onConfirm,
  isLoading = false,
}: ChangeStatusModalProps) {
  const [probationEndDate, setProbationEndDate] = useState('')
  const [selectedTarget, setSelectedTarget] = useState<string>('')

  // Determine available target statuses based on current status - memoized
  const targetOptions = useMemo(() => {
    if (currentStatus === 'Probation') {
      return [
        { value: 'Permanent', label: 'Permanent', icon: 'bi-check-circle', color: 'text-green-700' },
        { value: 'Resigned', label: 'Resigned', icon: 'bi-box-arrow-right', color: 'text-gray-600' },
        { value: 'Terminated', label: 'Terminated', icon: 'bi-x-circle', color: 'text-red-600' },
      ]
    }
    if (currentStatus === 'Permanent') {
      return [
        { value: 'Resigned', label: 'Resigned', icon: 'bi-box-arrow-right', color: 'text-gray-600' },
        { value: 'Terminated', label: 'Terminated', icon: 'bi-x-circle', color: 'text-red-600' },
      ]
    }
    return []
  }, [currentStatus])

  // Auto-select if there's only one option - memoized
  const effectiveTarget = useMemo(
    () => targetOptions.length === 1 ? targetOptions[0].value : selectedTarget,
    [targetOptions, selectedTarget]
  )

  const handleConfirm = () => {
    if (!effectiveTarget) return
    if (effectiveTarget === 'Probation') {
      onConfirm(effectiveTarget, probationEndDate)
    } else {
      onConfirm(effectiveTarget)
    }
  }

  const handleClose = () => {
    setProbationEndDate('')
    setSelectedTarget('')
    onClose()
  }

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  const isValid = useMemo(() => {
    if (!effectiveTarget) return false
    if (effectiveTarget === 'Probation') return probationEndDate > today
    return true
  }, [effectiveTarget, probationEndDate, today])

  const isDangerAction = useMemo(
    () => effectiveTarget === 'Resigned' || effectiveTarget === 'Terminated',
    [effectiveTarget]
  )

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
          <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className={`mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${isDangerAction ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      <i className={`bi ${isDangerAction ? 'bi-exclamation-triangle' : 'bi-arrow-left-right'} text-xl`}></i>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        Change Employment Status
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Current status:{' '}
                          <span className={`font-medium ${
                            currentStatus === 'Probation' ? 'text-amber-700' :
                            currentStatus === 'Permanent' ? 'text-green-700' :
                            'text-gray-700'
                          }`}>
                            {currentStatus}
                          </span>
                        </p>

                        {/* Target status selection */}
                        {targetOptions.length > 1 && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Change to <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-2">
                              {targetOptions.map((option) => (
                                <label
                                  key={option.value}
                                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                    selectedTarget === option.value
                                      ? option.value === 'Resigned' || option.value === 'Terminated'
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-indigo-300 bg-indigo-50'
                                      : 'border-gray-200 hover:bg-gray-50'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="targetStatus"
                                    value={option.value}
                                    checked={selectedTarget === option.value}
                                    onChange={(e) => setSelectedTarget(e.target.value)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                  />
                                  <i className={`bi ${option.icon} ${option.color}`}></i>
                                  <span className={`text-sm font-medium ${option.color}`}>
                                    {option.label}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Single target (Probation -> Permanent) */}
                        {targetOptions.length === 1 && (
                          <p className="mt-2 text-sm text-gray-500">
                            Change to{' '}
                            <span className={`font-medium ${targetOptions[0].color}`}>
                              {targetOptions[0].label}
                            </span>
                          </p>
                        )}

                        {/* Probation end date input */}
                        {effectiveTarget === 'Probation' && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Probation End Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              min={today}
                              value={probationEndDate}
                              onChange={(e) => setProbationEndDate(e.target.value)}
                              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                            />
                            {probationEndDate && probationEndDate <= today && (
                              <p className="mt-1 text-xs text-red-500">Probation end date must be in the future.</p>
                            )}
                          </div>
                        )}

                        {/* Permanent confirmation */}
                        {effectiveTarget === 'Permanent' && (
                          <p className="mt-3 text-sm text-gray-500">
                            The probation period will be ended immediately.
                          </p>
                        )}

                        {/* Resigned warning */}
                        {effectiveTarget === 'Resigned' && (
                          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-sm text-gray-600">
                              <i className="bi bi-info-circle mr-1"></i>
                              This will mark the employee as <span className="font-semibold text-gray-700">Resigned</span>. 
                              This action indicates the employee has voluntarily left the organization.
                            </p>
                          </div>
                        )}

                        {/* Terminated warning */}
                        {effectiveTarget === 'Terminated' && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">
                              <i className="bi bi-exclamation-triangle mr-1"></i>
                              This will mark the employee as <span className="font-semibold">Terminated</span>. 
                              This action indicates the employee's contract has been ended by the organization.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    disabled={isLoading || !isValid}
                    className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${
                      isDangerAction
                        ? 'bg-red-600 hover:bg-red-500 disabled:bg-red-300'
                        : 'bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300'
                    }`}
                    onClick={handleConfirm}
                  >
                    {isLoading ? 'Saving...' : effectiveTarget ? `Set as ${effectiveTarget}` : 'Select a status'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={handleClose}
                  >
                    Cancel
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

export default memo(ChangeStatusModal)
