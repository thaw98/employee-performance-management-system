import { Dialog, Transition, Tab } from '@headlessui/react'
import { Fragment, useState, useMemo, memo, useCallback, useEffect } from 'react'
import { CheckCircle2, RotateCcw } from 'lucide-react'
import type { EmployeeViewDetail } from '../hrEmployeeApi'
import { useGetTransferHistoryQuery } from '../employeeTransferApi'
import { TransferHistoryTable } from './TransferHistoryTable'
import { ReturnModal } from './ReturnModal'
import { MakePermanentModal } from './MakePermanentModal'

interface EmployeeViewModalProps {
  isOpen: boolean
  onClose: () => void
  employeeId?: number | null
  data: EmployeeViewDetail | null
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  hideSensitiveFields?: boolean
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  } catch {
    return '-'
  }
}

function displayValue(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') return '-'
  return String(val)
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start py-2.5 border-b border-gray-50 last:border-b-0">
      <dt className="text-sm font-medium text-gray-500 sm:w-44 sm:shrink-0">{label}</dt>
      <dd className="mt-0.5 sm:mt-0 text-sm text-gray-900 wrap-break-word whitespace-pre-wrap">{value}</dd>
    </div>
  )
}

function EmployeeViewModal({
  isOpen,
  onClose,
  employeeId,
  data,
  isLoading,
  isError,
  onRetry,
  hideSensitiveFields = false,
}: EmployeeViewModalProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const [showReturn, setShowReturn] = useState(false)
  const [showMakePermanent, setShowMakePermanent] = useState(false)

  const { data: transferRes, isLoading: transferLoading, refetch: refetchTransfers } = useGetTransferHistoryQuery(employeeId ?? 0, {
    skip: !isOpen || !employeeId || hideSensitiveFields,
  })
  const transferHistory = transferRes?.data ?? []
  const currentTransfer = transferHistory.find((row) => row.isCurrent) ?? null

  useEffect(() => {
    if (!isOpen) {
      setShowReturn(false)
      setShowMakePermanent(false)
    }
  }, [isOpen])

  const profilePictureUrl = data?.profilePictureUrl ?? null
  const fullName = data?.fullName ?? null

  const initials = useMemo(() => {
    if (!fullName) return '?'
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }, [fullName])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  const tabClasses = useCallback(
    ({ selected }: { selected: boolean }) =>
      `px-4 py-2.5 text-sm font-medium leading-5 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 ${
        selected
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`,
    []
  )

  return (
    <>
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose} onKeyDown={handleKeyDown}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-linear-to-r from-indigo-50 to-white">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Employee Details
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    title="Close"
                  >
                    <i className="bi bi-x-lg text-lg"></i>
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
                  {isLoading && (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                      <p className="text-sm text-gray-500">Loading employee details…</p>
                    </div>
                  )}

                  {isError && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                        <i className="bi bi-exclamation-triangle-fill text-2xl text-red-500"></i>
                      </div>
                      <p className="text-gray-700 font-medium mb-1">Failed to load employee details</p>
                      <p className="text-sm text-gray-500 mb-4">Please try again.</p>
                      <button
                        onClick={onRetry}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                      >
                        <i className="bi bi-arrow-clockwise"></i>
                        Retry
                      </button>
                    </div>
                  )}

                  {!isLoading && !isError && data && (
                    <>
                      {/* Profile Header */}
                      <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
                        {profilePictureUrl && failedImageUrl !== profilePictureUrl ? (
                          <img
                            src={profilePictureUrl}
                            alt={data.fullName}
                            className="h-16 w-16 rounded-full object-cover border-2 border-indigo-100 shadow-sm"
                            onError={() => setFailedImageUrl(profilePictureUrl)}
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xl font-bold border-2 border-indigo-200">
                            {initials}
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {displayValue(data.fullName)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {displayValue(data.staffNo)} · {displayValue(data.position?.positionName)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                data.status === 'Active'
                                  ? 'bg-green-100 text-green-700'
                                  : data.status === 'Resigned'
                                  ? 'bg-gray-100 text-gray-600'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {displayValue(data.status)}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                data.employmentStatus === 'Probation'
                                  ? 'bg-amber-100 text-amber-700'
                                  : data.employmentStatus === 'Permanent'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {displayValue(data.employmentStatus)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tabs */}
                      <Tab.Group>
                        <Tab.List className="flex gap-1 p-1 bg-gray-50 rounded-xl mb-5">
                          <Tab className={tabClasses}>Personal</Tab>
                          <Tab className={tabClasses}>Employment</Tab>
                          {!hideSensitiveFields && <Tab className={tabClasses}>Emergency</Tab>}
                          {!hideSensitiveFields && <Tab className={tabClasses}>Father</Tab>}
                          {!hideSensitiveFields && <Tab className={tabClasses}>Transfer History</Tab>}
                        </Tab.List>

                        <Tab.Panels>
                          {/* 1. Personal Information */}
                          <Tab.Panel>
                            <dl className="space-y-0">
                              <InfoRow label="Staff No" value={displayValue(data.staffNo)} />
                              <InfoRow label="Full Name" value={displayValue(data.fullName)} />
                              <InfoRow label="Phone Number" value={displayValue(data.phoneNumber)} />
                              <InfoRow label="Gender" value={displayValue(data.gender)} />
                              {!hideSensitiveFields && (
                                <>
                                  <InfoRow label="Email" value={displayValue(data.email)} />
                                  <InfoRow label="Date of Birth" value={formatDate(data.dateOfBirth)} />
                                  <InfoRow label="Staff NRC Number" value={displayValue(data.staffNrcNumber)} />
                                  <InfoRow label="Address" value={displayValue(data.address)} />
                                  <InfoRow label="Race" value={displayValue(data.race)} />
                                  <InfoRow label="Marital status" value={displayValue(data.maritalStatus)} />
                                  {data.maritalStatus === 'Married' && data.spouse ? (
                                    <>
                                      <InfoRow label="Spouse name" value={displayValue(data.spouse.spouseName)} />
                                      <InfoRow label="Spouse NRC" value={displayValue(data.spouse.spouseNrc)} />
                                    </>
                                  ) : null}
                                </>
                              )}
                            </dl>
                          </Tab.Panel>

                          {/* 2. Employment Information */}
                          <Tab.Panel>
                            <dl className="space-y-0">
                              <InfoRow
                                label="Department"
                                value={displayValue(data.department?.departmentName)}
                              />
                              <InfoRow
                                label="Position"
                                value={displayValue(data.position?.positionName)}
                              />
                              <InfoRow label="Hire Date" value={formatDate(data.hireDate)} />
                              <InfoRow label="Status" value={displayValue(data.status)} />
                              <InfoRow
                                label="Employment Status"
                                value={displayValue(data.employmentStatus)}
                              />
                              <InfoRow
                                label="Staff Type"
                                value={displayValue(data.staffType?.staffTypeName)}
                              />
                            </dl>

                            {/* Probation dates section */}
                            {data.probationInfo?.hasProbationRecord && (
                              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <i className="bi bi-calendar-event text-amber-600"></i>
                                  <span className="text-sm font-medium text-amber-800">
                                    {data.employmentStatus === 'Probation'
                                      ? 'Probation Period'
                                      : 'Probation History'}
                                  </span>
                                </div>
                                <dl className="space-y-0">
                                  <InfoRow
                                    label="Probation Start"
                                    value={formatDate(data.probationInfo.probationStartDate)}
                                  />
                                  <InfoRow
                                    label="Probation End"
                                    value={data.probationInfo.probationEndDate
                                      ? formatDate(data.probationInfo.probationEndDate)
                                      : 'Not set'}
                                  />
                                </dl>
                              </div>
                            )}
                          </Tab.Panel>

                          {/* 3. Emergency Contact */}
                          {!hideSensitiveFields && (
                            <Tab.Panel>
                              <dl className="space-y-0">
                                <InfoRow
                                  label="Phone"
                                  value={displayValue(data.emergencyContact?.employeePhone)}
                                />
                                <InfoRow
                                  label="Relation"
                                  value={displayValue(data.emergencyContact?.relation)}
                                />
                              </dl>
                              {!data.emergencyContact && (
                                <p className="text-sm text-gray-400 italic mt-4">
                                  No emergency contact information available.
                                </p>
                              )}
                            </Tab.Panel>
                          )}

                          {/* 4. Father Information */}
                          {!hideSensitiveFields && (
                            <Tab.Panel>
                              <dl className="space-y-0">
                                <InfoRow
                                  label="Father Name"
                                  value={displayValue(data.father?.fatherName)}
                                />
                                <InfoRow
                                  label="Father NRC No"
                                  value={displayValue(data.father?.fatherNrcNo)}
                                />
                                <InfoRow
                                  label="Father Occupation"
                                  value={displayValue(data.father?.fatherOccupation)}
                                />
                              </dl>
                              {!data.father && (
                                <p className="text-sm text-gray-400 italic mt-4">
                                  No father information available.
                                </p>
                              )}
                            </Tab.Panel>
                          )}

                          {/* 5. Transfer History */}
                          {!hideSensitiveFields && (
                            <Tab.Panel className="space-y-4">
                              {currentTransfer?.transferType === 'TEMPORARY' && (
                                <div className="flex flex-wrap justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setShowMakePermanent(true)}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
                                  >
                                    <CheckCircle2 size={13} />
                                    Make Permanent
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setShowReturn(true)}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                                  >
                                    <RotateCcw size={13} />
                                    Return
                                  </button>
                                </div>
                              )}
                              <TransferHistoryTable
                                history={transferHistory}
                                isLoading={transferLoading}
                              />
                            </Tab.Panel>
                          )}
                        </Tab.Panels>
                      </Tab.Group>
                    </>
                  )}
                </div>

                {/* Footer */}
                {!isLoading && (
                  <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      Close
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
        </Dialog>
      </Transition>
      <ReturnModal
        isOpen={showReturn}
        employeeId={employeeId ?? null}
        employeeName={fullName ?? ''}
        onClose={() => setShowReturn(false)}
        onSuccess={() => { void refetchTransfers() }}
      />
      <MakePermanentModal
        isOpen={showMakePermanent}
        employeeId={employeeId ?? null}
        employeeName={fullName ?? ''}
        currentTransfer={currentTransfer}
        onClose={() => setShowMakePermanent(false)}
        onSuccess={() => { void refetchTransfers() }}
      />
    </>
  )
}

export default memo(EmployeeViewModal)
