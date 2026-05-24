import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState, useMemo, memo, useEffect } from 'react'
import type { ProbationInfo, UpdateEmploymentStatusRequest } from '../hrEmployeeApi'

interface ChangeStatusModalProps {
  isOpen: boolean
  currentStatus: 'Probation' | 'Permanent' | 'Resigned' | 'Terminated'
  probationInfo: ProbationInfo | null
  onClose: () => void
  onConfirm: (request: UpdateEmploymentStatusRequest) => void
  isLoading?: boolean
}

function formatDateDisplay(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr + 'T00:00:00')
    if (isNaN(date.getTime())) return '-'
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  } catch {
    return '-'
  }
}

function ChangeStatusModal({
  isOpen,
  currentStatus,
  probationInfo,
  onClose,
  onConfirm,
  isLoading = false,
}: ChangeStatusModalProps) {
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [transitionMode, setTransitionMode] = useState<string>('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [reason, setReason] = useState('')

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedTarget('')
      setTransitionMode('')
      setEffectiveDate('')
      setReason('')
    }
  }, [isOpen])

  // Determine available target statuses based on current status
  const targetOptions = useMemo(() => {
    if (currentStatus === 'Probation') {
      return [
        { value: 'PERMANENT', label: 'Permanent', icon: 'bi-check-circle', color: 'text-green-700' },
        { value: 'RESIGNED', label: 'Resigned', icon: 'bi-box-arrow-right', color: 'text-gray-600' },
        { value: 'TERMINATED', label: 'Terminated', icon: 'bi-x-circle', color: 'text-red-600' },
      ]
    }
    if (currentStatus === 'Permanent') {
      return [
        { value: 'RESIGNED', label: 'Resigned', icon: 'bi-box-arrow-right', color: 'text-gray-600' },
        { value: 'TERMINATED', label: 'Terminated', icon: 'bi-x-circle', color: 'text-red-600' },
      ]
    }
    return []
  }, [currentStatus])

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Derive the minimum allowed date for date pickers (day after probation start)
  const minEffectiveDate = useMemo(() => {
    if (probationInfo?.probationStartDate) {
      const startDate = new Date(probationInfo.probationStartDate + 'T00:00:00')
      startDate.setDate(startDate.getDate() + 1)
      return startDate.toISOString().split('T')[0]
    }
    return today
  }, [probationInfo?.probationStartDate, today])

  // Date validation error
  const dateError = useMemo(() => {
    if (!effectiveDate) return ''
    if (probationInfo?.probationStartDate && effectiveDate <= probationInfo.probationStartDate) {
      return `Date must be after probation start date (${formatDateDisplay(probationInfo.probationStartDate)})`
    }
    return ''
  }, [effectiveDate, probationInfo?.probationStartDate])

  const handleConfirm = () => {
    if (!selectedTarget) return

    const request: UpdateEmploymentStatusRequest = {
      targetStatus: selectedTarget,
    }
    const trimmedReason = reason.trim()
    if (trimmedReason) {
      request.reason = trimmedReason
    }

    if (selectedTarget === 'PERMANENT') {
      request.transitionMode = transitionMode
      if (transitionMode === 'CUSTOM') {
        request.effectiveDate = effectiveDate
      }
    } else if (selectedTarget === 'RESIGNED' || selectedTarget === 'TERMINATED') {
      if (currentStatus === 'Probation') {
        request.effectiveDate = effectiveDate
      }
    }

    onConfirm(request)
  }

  const handleClose = () => {
    onClose()
  }

  // Validation
  const isValid = useMemo(() => {
    if (!selectedTarget) return false

    if (selectedTarget === 'PERMANENT') {
      if (!transitionMode) return false
      if (transitionMode === 'CUSTOM') {
        if (!effectiveDate || dateError) return false
      }
      return true
    }

    if (selectedTarget === 'RESIGNED' || selectedTarget === 'TERMINATED') {
      if (currentStatus === 'Probation') {
        if (!effectiveDate || dateError) return false
      }
      return true
    }

    return true
  }, [selectedTarget, transitionMode, effectiveDate, dateError, currentStatus])

  const isDangerAction = useMemo(
    () => selectedTarget === 'RESIGNED' || selectedTarget === 'TERMINATED',
    [selectedTarget]
  )

  const confirmLabel = useMemo(() => {
    if (!selectedTarget) return 'Select a status'
    const labels: Record<string, string> = {
      PERMANENT: 'Set as Permanent',
      RESIGNED: 'Set as Resigned',
      TERMINATED: 'Set as Terminated',
    }
    return labels[selectedTarget] || 'Confirm'
  }, [selectedTarget])

  // Should show date picker for Resigned/Terminated only if current status is Probation
  const showEffectiveDateForResignedTerminated =
    (selectedTarget === 'RESIGNED' || selectedTarget === 'TERMINATED') && currentStatus === 'Probation'

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
                    <div className={`mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${isDangerAction ? 'bg-red-100 text-red-600' : 'bg-[#dbeafe] text-[#2463eb]'}`}>
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

                        {/* Probation dates display */}
                        {probationInfo?.hasProbationRecord && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <i className="bi bi-calendar-event text-amber-600"></i>
                              <span className="text-sm font-medium text-amber-800">Probation Period</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs text-amber-600">Start Date</p>
                                <p className="text-sm font-medium text-amber-900">
                                  {formatDateDisplay(probationInfo.probationStartDate)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-amber-600">End Date</p>
                                <p className="text-sm font-medium text-amber-900">
                                  {probationInfo.probationEndDate
                                    ? formatDateDisplay(probationInfo.probationEndDate)
                                    : 'Not set'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Target status selection */}
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
                                    ? option.value === 'RESIGNED' || option.value === 'TERMINATED'
                                      ? 'border-red-300 bg-red-50'
                                      : 'border-[#93c5fd] bg-[#eff6ff]'
                                    : 'border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="targetStatus"
                                  value={option.value}
                                  checked={selectedTarget === option.value}
                                  onChange={(e) => {
                                    setSelectedTarget(e.target.value)
                                    setTransitionMode('')
                                    setEffectiveDate('')
                                  }}
                                  className="h-4 w-4 text-[#2463eb] focus:ring-[#dbeafe] border-gray-300"
                                />
                                <i className={`bi ${option.icon} ${option.color}`}></i>
                                <span className={`text-sm font-medium ${option.color}`}>
                                  {option.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Permanent: Now / Custom radio group */}
                        {selectedTarget === 'PERMANENT' && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              When to make permanent <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-2">
                              <label
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  transitionMode === 'NOW'
                                    ? 'border-green-300 bg-green-50'
                                    : 'border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="transitionMode"
                                  value="NOW"
                                  checked={transitionMode === 'NOW'}
                                  onChange={(e) => {
                                    setTransitionMode(e.target.value)
                                    setEffectiveDate('')
                                  }}
                                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                                />
                                <i className="bi bi-lightning-charge text-green-600"></i>
                                <div>
                                  <span className="text-sm font-medium text-green-700">Now</span>
                                  <p className="text-xs text-gray-500">Probation ends today, status changes immediately</p>
                                </div>
                              </label>
                              <label
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  transitionMode === 'CUSTOM'
                                    ? 'border-green-300 bg-green-50'
                                    : 'border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="transitionMode"
                                  value="CUSTOM"
                                  checked={transitionMode === 'CUSTOM'}
                                  onChange={(e) => setTransitionMode(e.target.value)}
                                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                                />
                                <i className="bi bi-calendar-check text-green-600"></i>
                                <div>
                                  <span className="text-sm font-medium text-green-700">Custom Date</span>
                                  <p className="text-xs text-gray-500">Choose a specific probation end date</p>
                                </div>
                              </label>
                            </div>

                            {/* Custom date picker for Permanent */}
                            {transitionMode === 'CUSTOM' && (
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Probation End Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="date"
                                  min={minEffectiveDate}
                                  value={effectiveDate}
                                  onChange={(e) => setEffectiveDate(e.target.value)}
                                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#2463eb] focus:ring-[#dbeafe] focus:outline-none"
                                />
                                {dateError && (
                                  <p className="mt-1 text-xs text-red-500">{dateError}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Resigned/Terminated effective date (from Probation) */}
                        {showEffectiveDateForResignedTerminated && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Effective Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              min={minEffectiveDate}
                              value={effectiveDate}
                              onChange={(e) => setEffectiveDate(e.target.value)}
                              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#2463eb] focus:ring-[#dbeafe] focus:outline-none"
                            />
                            {dateError && (
                              <p className="mt-1 text-xs text-red-500">{dateError}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                              This date will be saved as the probation end date.
                            </p>
                          </div>
                        )}

                        {selectedTarget && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Reason
                            </label>
                            <textarea
                              value={reason}
                              onChange={(e) => setReason(e.target.value.slice(0, 255))}
                              rows={3}
                              maxLength={255}
                              className="block w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#2463eb] focus:ring-[#dbeafe] focus:outline-none"
                              placeholder="Optional"
                            />
                            <p className="mt-1 text-xs text-gray-500 text-right">{reason.length}/255</p>
                          </div>
                        )}

                        {/* Resigned warning */}
                        {selectedTarget === 'RESIGNED' && (
                          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-sm text-gray-600">
                              <i className="bi bi-info-circle mr-1"></i>
                              This will mark the employee as <span className="font-semibold text-gray-700">Resigned</span>.
                              This action indicates the employee has voluntarily left the organization.
                            </p>
                          </div>
                        )}

                        {/* Terminated warning */}
                        {selectedTarget === 'TERMINATED' && (
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
                        : 'bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] disabled:opacity-50'
                    }`}
                    onClick={handleConfirm}
                  >
                    {isLoading ? 'Saving...' : confirmLabel}
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
