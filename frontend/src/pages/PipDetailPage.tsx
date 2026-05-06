import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  useGetPipByIdQuery,
  useUpdateProgressMutation,
  useScheduleMeetingMutation,
  useClosePipMutation,
  useEmployeeSignMutation,
  useManagerSignMutation,
  useMarkPipCompletedMutation,
  useReopenPipMutation,
  useReviewPipMutation,
  useGetTrainingHistoryQuery,
} from '../features/pip/pipApi'
import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'
import { formatDate, formatDateTime } from '../utils/dateUtils'
import { useGetDefaultSignatureQuery } from '../features/user/userApi'
import { resolveMediaSrc } from '../utils/mediaUrl'

const isImageSignature = (signature?: string) => {
  if (!signature) return false
  const value = signature.trim()
  return value.startsWith('data:image/') || value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://')
}

export default function PipDetailPage() {
  const { id } = useParams<{ id: string }>()
  const pipId = parseInt(id!)
  const { data: pip, isLoading } = useGetPipByIdQuery(pipId)
  const { user } = useSelector((state: RootState) => state.auth)
  const { data: defaultSigResponse, isLoading: isDefaultSigLoading } = useGetDefaultSignatureQuery()
  const defaultSignature = defaultSigResponse?.data ?? null
  const hasDefaultSignature = Boolean(defaultSignature?.signatureData)

  const [updateProgress] = useUpdateProgressMutation()
  const [scheduleMeeting] = useScheduleMeetingMutation()
  const [closePip] = useClosePipMutation()
  const [employeeSign, { isLoading: isSigningEmployee }] = useEmployeeSignMutation()
  const [managerSign, { isLoading: isSigningManager }] = useManagerSignMutation()
  const [markPipCompleted, { isLoading: isMarkingCompleted }] = useMarkPipCompletedMutation()
  const [reopenPip] = useReopenPipMutation()
  const [reviewPip] = useReviewPipMutation()

  const employeeRecordId = pip?.employee?.id
  const { data: trainingHistory, isLoading: isTrainingHistoryLoading } = useGetTrainingHistoryQuery(
    employeeRecordId != null ? String(employeeRecordId) : '',
    {
      skip: employeeRecordId == null,
    },
  )
  const [showUpdateModal, setShowUpdateModal] = useState<{ open: boolean; objectiveId: number | null }>({
    open: false,
    objectiveId: null,
  })
  const [updateValue, setUpdateValue] = useState({ percentage: 0, completedHours: 0, feedback: '' })
  const [trainingHistoryFilter, setTrainingHistoryFilter] = useState<'IN_PROGRESS' | 'ALL'>('IN_PROGRESS')

  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingHour, setMeetingHour] = useState('12')
  const [meetingMinute, setMeetingMinute] = useState('00')
  const [meetingPeriod, setMeetingPeriod] = useState('AM')

  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closeData, setCloseData] = useState({ finalOutcome: '', closingRemarks: '' })
  const [showEmployeeSignModal, setShowEmployeeSignModal] = useState(false)
  const [showManagerSignModal, setShowManagerSignModal] = useState(false)

  const [showReopenModal, setShowReopenModal] = useState(false)
  const [reopenReasonType, setReopenReasonType] = useState('Incomplete Goals')
  const [customReason, setCustomReason] = useState('')
  const [showReviewDenyModal, setShowReviewDenyModal] = useState(false)
  const [showApproveReopenModal, setShowApproveReopenModal] = useState(false)
  const [extendedEndDate, setExtendedEndDate] = useState('')
  const [reviewReasonType, setReviewReasonType] = useState('Policy Not Met')
  const [reviewCustomReason, setReviewCustomReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const userRole = user?.role?.toUpperCase().replace(/\s+/g, '_') || ''
  const isManager = userRole === 'DEPARTMENT_HEAD' || userRole === 'TEAM_HEAD' || userRole === 'MANAGER'
  const isAdmin = userRole === 'HR'
  const isEmployee = userRole === 'EMPLOYEE'
  const signatureSettingsPath = isAdmin
    ? '/hr/settings/signature'
    : isEmployee
      ? '/employee/settings/signature'
      : '/manager/settings/signature'
  const getStatusLabel = (status: string) => {
    if (status === 'COMPLETED') return 'Completed'
    if (status === 'AUTO_CLOSED') return 'Auto Closed'
    if (status === 'REOPEN_REQUESTED') return 'Reopen Requested'
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
  }
  const getStatusClass = (status: string) => {
    if (status === 'COMPLETED') return 'bg-emerald-100 text-emerald-700'
    if (status === 'CLOSED') return 'bg-slate-100 text-slate-700'
    if (status === 'AUTO_CLOSED') return 'bg-amber-100 text-amber-700'
    if (status === 'REOPEN_REQUESTED') return 'bg-orange-100 text-orange-700'
    if (status === 'DENIED') return 'bg-red-100 text-red-700'
    return 'bg-blue-100 text-blue-700'
  }
  const getTrainingStatusClass = (status?: string) => {
    const normalized = status?.trim().toUpperCase()
    if (normalized === 'COMPLETED') return 'bg-emerald-100 text-emerald-700'
    if (normalized === 'IN_PROGRESS') return 'bg-blue-100 text-blue-700'
    if (normalized === 'NOT_STARTED') return 'bg-slate-100 text-slate-600'
    return 'bg-amber-100 text-amber-700'
  }
  const formatTrainingStatus = (status?: string) => {
    if (!status) return '-'
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
  }
  const filteredTrainingHistory = (trainingHistory ?? []).filter((entry) => {
    if (trainingHistoryFilter === 'ALL') return true
    return (entry.completionStatus || entry.status).toUpperCase() === 'IN_PROGRESS'
  })
  const getTrainingCompletionPercentage = (percentage?: number, status?: string) => {
    if (typeof percentage === 'number' && Number.isFinite(percentage)) {
      return `${percentage}%`
    }
    return (status || '').toUpperCase() === 'COMPLETED' ? '100%' : '-'
  }
  const getLocalDateString = (dateString?: string | Date) => {
    if (!dateString) return undefined;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return undefined;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const minMeetingDate = pip?.startDate ? getLocalDateString(pip.startDate) : getLocalDateString(new Date());
  const applicableEndDate = pip?.extendedEndDate ? pip.extendedEndDate : (pip?.originalEndDate || pip?.endDate);
  const maxMeetingDate = applicableEndDate ? getLocalDateString(applicableEndDate) : undefined;

  const isDirectManager = Boolean(
    isManager &&
    pip &&
    (
      (user?.id != null && user.id === pip.manager?.id) ||
      (user?.email && pip.manager?.email && user.email.toLowerCase() === pip.manager.email.toLowerCase()) ||
      (user?.employeeId && pip.manager?.employeeId && user.employeeId === pip.manager.employeeId)
    )
  )
  const routeBase = isAdmin ? '/hr/pip-monitoring' : isEmployee ? '/employee/pip' : '/manager/pip'

  if (isLoading || !pip) return <div className="p-8">Loading PIP details...</div>

  const isAverageProgressComplete = Number(pip.overallProgressPercentage) >= 100
  const canMarkCompleted = isDirectManager && pip.status === 'CLOSED' && isAverageProgressComplete
  const canEmployeeSign = isEmployee
    && pip.status === 'AUTO_CLOSED'
    && !pip.finalOutcome
    && !pip.reopenReason
    && !pip.employeeSignatureDate
  const canEmployeeRequestReopen = isEmployee
    && pip.status === 'AUTO_CLOSED'
    && !pip.finalOutcome
    && !pip.reopenReason
    && !pip.employeeSignatureDate
  const canManagerSign = isDirectManager
    && pip.status === 'AUTO_CLOSED'
    && !pip.finalOutcome
    && Boolean(pip.employeeSignatureDate)
    && !pip.managerSignatureDate
  const canManagerMarkResult = isDirectManager
    && pip.status === 'AUTO_CLOSED'
    && !pip.finalOutcome
    && Boolean(pip.employeeSignatureDate)
    && Boolean(pip.managerSignatureDate)
  const shouldShowSignatureSummary = Boolean(
    pip.finalOutcome
    || pip.employeeSignatureDate
    || pip.managerSignatureDate
    || pip.status === 'AUTO_CLOSED'
  )

  const handleUpdateProgress = async () => {
    if (showUpdateModal.objectiveId) {
      try {
        setActionError(null)
        await updateProgress({
          objectiveId: showUpdateModal.objectiveId,
          progressPercentage: updateValue.percentage,
          completedHours: updateValue.completedHours,
          feedback: updateValue.feedback,
        }).unwrap()
        setShowUpdateModal({ open: false, objectiveId: null })
        setUpdateValue({ percentage: 0, completedHours: 0, feedback: '' })
      } catch (error: any) {
        console.error('[PIP Detail] Update progress failed:', error)
        setActionError(error?.data?.message || error?.error || 'Failed to update progress.')
      }
    }
  }

  const handleScheduleMeeting = async () => {
    if (!meetingDate) {
      setActionError('Meeting date is required.')
      return
    }

    // Convert AM/PM to 24-hour format for the backend
    let hour = parseInt(meetingHour)
    if (meetingPeriod === 'PM' && hour < 12) hour += 12
    if (meetingPeriod === 'AM' && hour === 12) hour = 0

    const timeStr = `${hour.toString().padStart(2, '0')}:${meetingMinute}:00`
    const isoTime = `${meetingDate}T${timeStr}`

    try {
      setActionError(null)
      await scheduleMeeting({ pipId, meetingTime: isoTime }).unwrap()
      setShowMeetingModal(false)
      setMeetingDate('')
    } catch (error: any) {
      console.error('[PIP Detail] Schedule meeting failed:', error)
      setActionError(error?.data?.message || error?.error || 'Failed to schedule meeting.')
    }
  }

  const handleClosePip = async () => {
    if (!closeData.finalOutcome.trim()) {
      setActionError('Final outcome is required.')
      return
    }
    if (!closeData.closingRemarks.trim()) {
      setActionError('Closing remarks are required.')
      return
    }

    try {
      setActionError(null)
      await closePip({
        pipId,
        finalOutcome: closeData.finalOutcome,
        closingRemarks: closeData.closingRemarks,
      }).unwrap()
      setShowCloseModal(false)
      setCloseData({ finalOutcome: '', closingRemarks: '' })
    } catch (error: any) {
      console.error('[PIP Detail] Close PIP failed:', error)
      setActionError(error?.data?.message || error?.error || 'Failed to close PIP.')
    }
  }

  const handleEmployeeSign = async () => {
    if (!defaultSignature?.signatureData) {
      setActionError('Set a default signature in Signature Settings before signing.')
      return
    }

    try {
      setActionError(null)
      await employeeSign({ pipId }).unwrap()
      setShowEmployeeSignModal(false)
    } catch (error: any) {
      console.error('[PIP Detail] Employee signature failed:', error)
      setActionError(error?.data?.message || error?.error || 'Failed to sign PIP.')
    }
  }

  const handleManagerSign = async () => {
    if (!defaultSignature?.signatureData) {
      setActionError('Set a default signature in Signature Settings before signing.')
      return
    }

    try {
      setActionError(null)
      await managerSign({ pipId }).unwrap()
      setShowManagerSignModal(false)
    } catch (error: any) {
      console.error('[PIP Detail] Manager signature failed:', error)
      setActionError(error?.data?.message || error?.error || 'Failed to sign PIP.')
    }
  }

  const handleMarkPipCompleted = async () => {
    try {
      setActionError(null)
      await markPipCompleted(pipId).unwrap()
    } catch (error: any) {
      console.error('[PIP Detail] Mark PIP completed failed:', error)
      setActionError(error?.data?.message || error?.error || 'Failed to mark PIP completed.')
    }
  }

  const handleReopenPip = async () => {
    const finalReason = reopenReasonType === 'Other' ? customReason : reopenReasonType
    if (!finalReason.trim()) {
      setActionError('Reopen reason is required.')
      return
    }
    try {
      setActionError(null)
      await reopenPip({ pipId, reason: finalReason }).unwrap()
      setShowReopenModal(false)
      setReopenReasonType('Incomplete Goals')
      setCustomReason('')
    } catch (error: any) {
      console.error('[PIP Detail] Reopen PIP failed:', error)
      setActionError(error?.data?.message || error?.error || 'Failed to reopen PIP.')
    }
  }

  const handleApproveReopen = async () => {
    if (!extendedEndDate) {
      setActionError('Extended end date is required.')
      return
    }
    try {
      setActionError(null)
      await reviewPip({ pipId, action: 'CONFIRMED', extendedEndDate }).unwrap()
      setShowApproveReopenModal(false)
      setExtendedEndDate('')
    } catch (error: any) {
      console.error('[PIP Detail] Approve reopen failed:', error)
      setActionError(error?.data?.message || error?.error || 'Failed to approve reopen request.')
    }
  }

  const handleDenyReview = async () => {
    const finalReason = reviewReasonType === 'Other' ? reviewCustomReason : reviewReasonType
    if (!finalReason.trim()) {
      setActionError('Deny reason is required.')
      return
    }

    try {
      setActionError(null)
      await reviewPip({ pipId, action: 'DENIED', reason: finalReason }).unwrap()
      setShowReviewDenyModal(false)
      setReviewReasonType('Policy Not Met')
      setReviewCustomReason('')
    } catch (error: any) {
      console.error('[PIP Detail] Deny review failed:', error)
      setActionError(error?.data?.message || error?.error || 'Failed to deny request.')
    }
  }

  return (
    <div className="p-8 pb-20">
      {actionError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {actionError}
        </div>
      )}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={routeBase} className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
            <i className="bi bi-chevron-left" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">PIP Details: {pip.employee.employee?.employeeName}</h1>
            <p className="text-slate-500">
              Employee ID: {pip.employee.employee?.id ?? '—'} |
              Dept: {pip.employee.employee?.department?.departmentName || '—'} |
              Position: {pip.employee.employee?.position?.positionName || '—'} |
              Duration: {formatDate(pip.startDate)} – {formatDate(pip.endDate)} |
              Status: <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold uppercase ${getStatusClass(pip.status)}`}>{getStatusLabel(pip.status)}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {isDirectManager && pip.status === 'ACTIVE' && (
            <>
              <button
                onClick={() => setShowMeetingModal(true)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <i className="bi bi-calendar-event" /> Schedule Meeting
              </button>
            </>
          )}
          {canManagerMarkResult && (
            <button
              onClick={() => setShowCloseModal(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <i className="bi bi-check-circle" /> Mark Result
            </button>
          )}
          {canEmployeeSign && (
            <button
              onClick={() => setShowEmployeeSignModal(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <i className="bi bi-pen" /> Sign PIP
            </button>
          )}
          {canManagerSign && (
            <button
              onClick={() => setShowManagerSignModal(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <i className="bi bi-pen" /> Sign PIP
            </button>
          )}
          {canMarkCompleted && (
            <button
              onClick={handleMarkPipCompleted}
              disabled={isMarkingCompleted}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              <i className="bi bi-check2-circle" /> {isMarkingCompleted ? 'Marking...' : 'Mark Completed'}
            </button>
          )}
          {canEmployeeRequestReopen && (
            <button
              onClick={() => setShowReopenModal(true)}
              className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              <i className="bi bi-arrow-counterclockwise" /> Request More Time
            </button>
          )}
          {isDirectManager && pip.status === 'REOPEN_REQUESTED' && (
            <>
              <button
                onClick={() => setShowApproveReopenModal(true)}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <i className="bi bi-check-lg" /> Approve Reopen
              </button>
              <button
                onClick={() => setShowReviewDenyModal(true)}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                <i className="bi bi-x-lg" /> Deny
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Objectives Section */}
        <div className="lg:col-span-2 space-y-8">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-slate-900">Improvement Objectives</h2>
            <div className="space-y-8">
              {pip.objectives.map((obj) => (
                <div key={obj.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">{obj.description}</span>
                    {isDirectManager && pip.status === 'ACTIVE' && (
                      <button
                        onClick={() => {
                          setShowUpdateModal({ open: true, objectiveId: obj.id })
                          setUpdateValue({
                            percentage: obj.progressPercentage,
                            completedHours: pip.completedHours,
                            feedback: ''
                          })
                        }}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Update
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${obj.progressPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${obj.progressPercentage}%` }}
                      />
                    </div>
                    <span className={`min-w-[40px] text-sm font-bold ${obj.progressPercentage === 100 ? 'text-green-600' : 'text-slate-700'}`}>
                      {obj.progressPercentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {(pip.expectedImprovements || pip.reasonForPlan) && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-slate-900">PIP Details</h2>
              <div className="space-y-4">
                {pip.expectedImprovements && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Expected Improvements</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{pip.expectedImprovements}</p>
                  </div>
                )}
                {pip.reasonForPlan && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Reason for Plan</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{pip.reasonForPlan}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Follow-up Meetings Section */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-slate-900">Follow-Up Meetings</h2>
            <div className="space-y-4">
              {pip.followUpMeetings?.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <i className="bi bi-calendar-check" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{formatDateTime(m.meetingTime)}</p>
                      <p className="text-xs text-slate-500">{m.status}</p>
                    </div>
                  </div>
                  {m.reminderSent && <span className="text-xs text-green-600 font-medium"><i className="bi bi-bell-fill" /> Reminder sent</span>}
                </div>
              ))}
              {(!pip.followUpMeetings || pip.followUpMeetings.length === 0) && (
                <p className="py-4 text-center text-slate-500">No meetings scheduled yet.</p>
              )}
            </div>
          </section>

          {/* Training History Section */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-slate-900">Training & Development History</h2>
              <div className="inline-flex w-fit rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setTrainingHistoryFilter('IN_PROGRESS')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${trainingHistoryFilter === 'IN_PROGRESS' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  In Progress
                </button>
                <button
                  type="button"
                  onClick={() => setTrainingHistoryFilter('ALL')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${trainingHistoryFilter === 'ALL' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  All
                </button>
              </div>
            </div>
            <div>
              {isTrainingHistoryLoading && (
                <p className="py-4 text-center text-slate-500">Loading training records...</p>
              )}
              {!isTrainingHistoryLoading && filteredTrainingHistory.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                    <thead>
                      <tr className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        <th className="whitespace-nowrap px-3 py-3">Training</th>
                        <th className="whitespace-nowrap px-3 py-3">Provider</th>
                        <th className="whitespace-nowrap px-3 py-3">Start Date</th>
                        <th className="whitespace-nowrap px-3 py-3">End Date</th>
                        <th className="whitespace-nowrap px-3 py-3">Status</th>
                        <th className="whitespace-nowrap px-3 py-3">Completed Hours</th>
                        <th className="whitespace-nowrap px-3 py-3">Completion %</th>
                        <th className="min-w-48 px-3 py-3">Feedback / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTrainingHistory.map((t) => (
                        <tr key={t.id} className="align-top">
                          <td className="px-3 py-4">
                            <p className="font-medium text-slate-800">{t.trainingName || '-'}</p>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-slate-600">{t.trainingProvider || '-'}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-slate-600">{formatDate(t.startDate)}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-slate-600">{formatDate(t.endDate ?? t.completionDate)}</td>
                          <td className="whitespace-nowrap px-3 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getTrainingStatusClass(t.completionStatus || t.status)}`}>
                              {formatTrainingStatus(t.completionStatus || t.status)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-slate-600">
                            {t.totalCompletedHours ?? pip.completedHours ?? 0} / {pip.totalHours ?? 0}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getTrainingStatusClass(t.completionStatus || t.status)}`}>
                              {getTrainingCompletionPercentage(t.percentageCompletion, t.completionStatus || t.status)}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-slate-600">{t.feedbackNotes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!isTrainingHistoryLoading && filteredTrainingHistory.length === 0 && (
                <p className="py-4 text-center text-slate-500">
                  {trainingHistoryFilter === 'IN_PROGRESS' ? 'No in-progress training history records found.' : 'No training records found for this employee.'}
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Info Section */}
        <div className="space-y-8">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">PIP Summary</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500">Current Status</p>
                <span className={`mt-1 inline-flex rounded-md px-2.5 py-1 text-xs font-bold uppercase ${getStatusClass(pip.status)}`}>
                  {getStatusLabel(pip.status)}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500">Assigned Manager</p>
                <p className="font-medium text-slate-800">{pip.manager.employee?.employeeName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">PIP Duration</p>
                <p className="font-medium text-slate-800">
                  {formatDate(pip.startDate)} — {formatDate(pip.endDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Original End Date</p>
                <p className="font-medium text-slate-800">{formatDate(pip.originalEndDate || pip.endDate)}</p>
              </div>
              {pip.autoCloseDate && (
                <div>
                  <p className="text-xs text-slate-500">Auto-Close Date</p>
                  <p className="font-medium text-amber-700">{formatDate(pip.autoCloseDate)}</p>
                </div>
              )}
              {pip.extendedEndDate && (
                <div>
                  <p className="text-xs text-slate-500">Extended End Date</p>
                  <p className="font-medium text-blue-700">{formatDate(pip.extendedEndDate)}</p>
                </div>
              )}
              {pip.finalCloseDate && (
                <div>
                  <p className="text-xs text-slate-500">Final Close Date</p>
                  <p className="font-medium text-slate-800">{formatDate(pip.finalCloseDate)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500">Created On</p>
                <p className="font-medium text-slate-800">{formatDateTime(pip.createdAt)}</p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-500">Total Hours</p>
                  <p className="text-lg font-bold text-slate-900">{pip.totalHours}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Completed</p>
                  <p className="text-lg font-bold text-blue-600">{pip.completedHours}</p>
                </div>
              </div>
              {pip.finalOutcome && (
                <>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500">Final Outcome</p>
                    <p className="font-bold text-blue-600">{pip.finalOutcome}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Closing Remarks</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{pip.closingRemarks}</p>
                  </div>
                </>
              )}
              {shouldShowSignatureSummary && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">Manager Signature</p>
                    {pip.managerSignature && isImageSignature(pip.managerSignature) ? (
                      <div className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                        <img
                          src={resolveMediaSrc(pip.managerSignature)}
                          alt="Manager signature"
                          className="max-h-14 max-w-full object-contain"
                        />
                      </div>
                    ) : pip.managerSignature ? (
                      <p className="text-sm font-medium text-slate-800">{pip.managerSignature}</p>
                    ) : null}
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {pip.managerSignatureDate ? `Signed on ${formatDateTime(pip.managerSignatureDate)}` : 'Pending'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Employee Signature</p>
                    {pip.employeeSignature && isImageSignature(pip.employeeSignature) ? (
                      <div className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                        <img
                          src={resolveMediaSrc(pip.employeeSignature)}
                          alt="Employee signature"
                          className="max-h-14 max-w-full object-contain"
                        />
                      </div>
                    ) : pip.employeeSignature ? (
                      <p className="text-sm font-medium text-slate-800">{pip.employeeSignature}</p>
                    ) : null}
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {pip.employeeSignatureDate ? `Signed on ${formatDateTime(pip.employeeSignatureDate)}` : 'Pending'}
                    </p>
                  </div>
                </div>
              )}
              {pip.reopenReason && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500">Employee Reopen Reason</p>
                  <p className="text-sm font-medium text-orange-600 whitespace-pre-wrap">{pip.reopenReason}</p>
                </div>
              )}
              {pip.reopenDecision && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500">Manager Reopen Decision</p>
                  <p className="text-sm font-medium text-slate-800">
                    {pip.reopenDecision}
                    {pip.reopenDecisionDate ? ` on ${formatDateTime(pip.reopenDecisionDate)}` : ''}
                  </p>
                </div>
              )}
              {pip.reviewReason && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500">Manager Rejection Reason</p>
                  <p className="text-sm font-medium text-red-600 whitespace-pre-wrap">{pip.reviewReason}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* MODALS (Simplified using standard positioning) */}
      {showUpdateModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">Update Progress</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Percentage Completion</label>
                <div className="mt-1 flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200"
                    value={updateValue.percentage}
                    onChange={(e) => setUpdateValue({ ...updateValue, percentage: parseInt(e.target.value) })}
                  />
                  <span className="text-sm font-bold text-blue-600">{updateValue.percentage}%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Total Completed Hours</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={updateValue.completedHours}
                  onChange={(e) => setUpdateValue({ ...updateValue, completedHours: parseInt(e.target.value) })}
                />
                <p className="text-[10px] text-slate-400 mt-1">Target: {pip.totalHours} hours</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Feedback / Notes</label>
                <textarea
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="Describe progress made..."
                  value={updateValue.feedback}
                  onChange={(e) => setUpdateValue({ ...updateValue, feedback: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowUpdateModal({ open: false, objectiveId: null })} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
              <button onClick={handleUpdateProgress} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save Update</button>
            </div>
          </div>
        </div>
      )}

      {showMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">Schedule Follow-Up Meeting</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  required
                  min={minMeetingDate}
                  max={maxMeetingDate}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Hour</label>
                  <select
                    value={meetingHour}
                    onChange={e => setMeetingHour(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2 py-2 focus:border-blue-500 outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Minute</label>
                  <select
                    value={meetingMinute}
                    onChange={e => setMeetingMinute(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2 py-2 focus:border-blue-500 outline-none"
                  >
                    {['00', '15', '30', '45'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">AM/PM</label>
                  <select
                    value={meetingPeriod}
                    onChange={e => setMeetingPeriod(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2 py-2 focus:border-blue-500 outline-none"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowMeetingModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
              <button onClick={handleScheduleMeeting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Schedule</button>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">Mark PIP Result</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Result</label>
                <select
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  value={closeData.finalOutcome}
                  onChange={(e) => setCloseData({ ...closeData, finalOutcome: e.target.value })}
                >
                  <option value="">Select Outcome...</option>
                  <option value="SUCCESSFUL">Successful</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Manager Comments</label>
                <textarea
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
                  rows={4}
                  placeholder="Sum up the improvement journey..."
                  value={closeData.closingRemarks}
                  onChange={(e) => setCloseData({ ...closeData, closingRemarks: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCloseModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
              <button
                onClick={handleClosePip}
                disabled={!closeData.finalOutcome.trim() || !closeData.closingRemarks.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                Save Result
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmployeeSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">Sign PIP Acknowledgement</h3>
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Default Signature</p>
                    <p className="mt-1 text-xs text-slate-500">Your signature from Signature Settings will be recorded for this PIP.</p>
                  </div>
                  <Link to={signatureSettingsPath} className="shrink-0 text-xs font-semibold text-blue-600 hover:underline">
                    Signature Settings
                  </Link>
                </div>
                <div className="mt-3 flex min-h-[72px] items-center justify-center rounded-md border border-dashed border-slate-300 bg-white px-3 py-2">
                  {isDefaultSigLoading ? (
                    <span className="text-xs text-slate-500">Loading signature...</span>
                  ) : defaultSignature?.signatureData ? (
                    <img
                      src={resolveMediaSrc(defaultSignature.signatureData)}
                      alt="Your default signature"
                      className="max-h-14 max-w-full object-contain"
                    />
                  ) : (
                    <p className="text-center text-xs text-slate-500">No default signature yet.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowEmployeeSignModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
              <button
                onClick={handleEmployeeSign}
                disabled={isSigningEmployee || isDefaultSigLoading || !hasDefaultSignature}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isSigningEmployee ? 'Signing...' : 'Sign PIP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showManagerSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">Sign PIP Result</h3>
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Default Signature</p>
                    <p className="mt-1 text-xs text-slate-500">Your signature from Signature Settings will be recorded for this PIP.</p>
                  </div>
                  <Link to={signatureSettingsPath} className="shrink-0 text-xs font-semibold text-blue-600 hover:underline">
                    Signature Settings
                  </Link>
                </div>
                <div className="mt-3 flex min-h-[72px] items-center justify-center rounded-md border border-dashed border-slate-300 bg-white px-3 py-2">
                  {isDefaultSigLoading ? (
                    <span className="text-xs text-slate-500">Loading signature...</span>
                  ) : defaultSignature?.signatureData ? (
                    <img
                      src={resolveMediaSrc(defaultSignature.signatureData)}
                      alt="Your default signature"
                      className="max-h-14 max-w-full object-contain"
                    />
                  ) : (
                    <p className="text-center text-xs text-slate-500">No default signature yet.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowManagerSignModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
              <button
                onClick={handleManagerSign}
                disabled={isSigningManager || isDefaultSigLoading || !hasDefaultSignature}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isSigningManager ? 'Signing...' : 'Sign PIP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">Submit Reopen Request</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Reason for Reopening</label>
                <select
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  value={reopenReasonType}
                  onChange={(e) => setReopenReasonType(e.target.value)}
                >
                  <option value="Incomplete Goals">Incomplete Goals</option>
                  <option value="Follow-up Required">Follow-up Required</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {reopenReasonType === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Custom Reason</label>
                  <textarea
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
                    rows={4}
                    placeholder="State the reason for further action..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowReopenModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
              <button onClick={handleReopenPip} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">Submit Request</button>
            </div>
          </div>
        </div>
      )}

      {showApproveReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">Approve Reopen Request</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700">Extended End Date</label>
              <input
                type="date"
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                value={extendedEndDate}
                onChange={(e) => setExtendedEndDate(e.target.value)}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowApproveReopenModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
              <button
                onClick={handleApproveReopen}
                disabled={!extendedEndDate}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewDenyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">Deny Request</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Reason</label>
                <select
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  value={reviewReasonType}
                  onChange={(e) => setReviewReasonType(e.target.value)}
                >
                  <option value="Policy Not Met">Policy Not Met</option>
                  <option value="Insufficient Evidence">Insufficient Evidence</option>
                  <option value="Need More Manager Notes">Need More Manager Notes</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {reviewReasonType === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Custom Reason</label>
                  <textarea
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
                    rows={4}
                    placeholder="Enter deny reason..."
                    value={reviewCustomReason}
                    onChange={(e) => setReviewCustomReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowReviewDenyModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
              <button onClick={handleDenyReview} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Deny Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
