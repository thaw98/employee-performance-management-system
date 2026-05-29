import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom'
import {
  useGetPipByIdQuery,
  useGetPipOneOnOneMeetingsQuery,
  useIncreaseObjectiveHoursMutation,
  useStartObjectiveSessionMutation,
  useEndObjectiveSessionMutation,
  useEndActivePipSessionsMutation,
  useClosePipMutation,
  useManualClosePipMutation,
  useEmployeeSignMutation,
  useManagerSignMutation,
  useMarkPipCompletedMutation,
  useReopenPipMutation,
  useReviewPipMutation,
  useGetTrainingHistoryQuery,
} from '../features/pip/pipApi'
import type { PipObjective, TrainingRecord } from '../features/pip/pipApi'
import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'
import { formatDate, formatDateTime } from '../utils/dateUtils'
import { useGetDefaultSignatureQuery } from '../features/user/userApi'
import { resolveMediaSrc } from '../utils/mediaUrl'
import { PipCommunicationNotes } from '../features/pip/components/PipCommunicationNotes'
import PipUnifiedLog from '../features/pip/components/PipUnifiedLog'

const isImageSignature = (signature?: string) => {
  if (!signature) return false
  const value = signature.trim()
  return value.startsWith('data:image/') || value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://')
}

const getActionErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null) return fallback
  const candidate = error as { data?: { message?: unknown }; error?: unknown }
  if (typeof candidate.data?.message === 'string' && candidate.data.message.trim()) return candidate.data.message
  if (typeof candidate.error === 'string' && candidate.error.trim()) return candidate.error
  return fallback
}

const DISPLAY_DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/

const parseDisplayDate = (value: string) => {
  if (!DISPLAY_DATE_PATTERN.test(value)) return null
  const [day, month, year] = value.split('/').map(Number)
  const parsed = new Date(year, month - 1, day)
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null
  return parsed
}

const toIsoDate = (value: string) => {
  const parsed = parseDisplayDate(value)
  if (!parsed) return ''
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
}

const toDisplayDateFromIso = (value: string) => {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return ''
  return `${day}/${month}/${year}`
}

export default function PipDetailPage() {
  const { id } = useParams<{ id: string }>()
  const pipId = parseInt(id!)
  const location = useLocation()
  const navigate = useNavigate()
  const { data: pip, isLoading } = useGetPipByIdQuery(pipId)
  const { data: oneOnOnePipMeetings = [], isLoading: isPipMeetingsLoading } = useGetPipOneOnOneMeetingsQuery(pipId, {
    refetchOnMountOrArgChange: true,
  })
  const { user } = useSelector((state: RootState) => state.auth)
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
  const [updateValue, setUpdateValue] = useState({ additionalHours: 0, note: '' })
  const [trainingHistoryFilter, setTrainingHistoryFilter] = useState<'IN_PROGRESS' | 'COMPLETED' | 'NOT_STARTED' | 'ALL'>('IN_PROGRESS')

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
  const [minReopenApprovalDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split('T')[0])
  const [reviewReasonType, setReviewReasonType] = useState('Policy Not Met')
  const [reviewCustomReason, setReviewCustomReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [timerNow, setTimerNow] = useState(() => Date.now())

  const userRole = user?.role?.toUpperCase().replace(/\s+/g, '_') || ''
  const isManager = userRole === 'DEPARTMENT_HEAD' || userRole === 'TEAM_HEAD' || userRole === 'MANAGER'
  const isAdmin = userRole === 'HR'
  const isAudit = user?.roleId === 5 || userRole === 'AUDIT' || location.pathname.startsWith('/audit/')
  const isEmployee = userRole === 'EMPLOYEE'
  const { data: defaultSigResponse, isLoading: isDefaultSigLoading } = useGetDefaultSignatureQuery(undefined, {
    skip: isAudit,
  })
  const defaultSignature = defaultSigResponse?.data ?? null
  const hasDefaultSignature = Boolean(defaultSignature?.signatureData)

  const [increaseObjectiveHours] = useIncreaseObjectiveHoursMutation()
  const [startObjectiveSession] = useStartObjectiveSessionMutation()
  const [endObjectiveSession] = useEndObjectiveSessionMutation()
  const [endActivePipSessions] = useEndActivePipSessionsMutation()

  const selectedObjective = pip?.objectives.find((objective) => objective.id === showUpdateModal.objectiveId)
  const hasActivePipTimer = Boolean(isEmployee && pip?.objectives.some((objective) => objective.timerRunning))

  useEffect(() => {
    if (!hasActivePipTimer) return

    const endActiveSessions = () => {
      const token = localStorage.getItem('epms_token') || sessionStorage.getItem('epms_token')
      if (!token) return
      void fetch('/api/pips/sessions/end-active', {
        method: 'POST',
        keepalive: true,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).catch(() => undefined)
    }

    window.addEventListener('pagehide', endActiveSessions)
    window.addEventListener('beforeunload', endActiveSessions)

    return () => {
      window.removeEventListener('pagehide', endActiveSessions)
      window.removeEventListener('beforeunload', endActiveSessions)
      void endActivePipSessions().catch(() => undefined)
    }
  }, [endActivePipSessions, hasActivePipTimer])

  useEffect(() => {
    if (!hasActivePipTimer) return
    const intervalId = window.setInterval(() => setTimerNow(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [hasActivePipTimer])

  const formatHours = (value: number) => {
    if (!Number.isFinite(value)) return '0'
    return value.toFixed(2).replace(/\.?0+$/, '')
  }

  const formatLiveTimer = (milliseconds: number) => {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const getActualMeetingDuration = (start?: string, end?: string) => {
    if (!start || !end) return 'Actual duration: -'
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) return 'Actual duration: -'
    const totalMinutes = Math.max(1, Math.round((endTime - startTime) / 60000))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours > 0 && minutes > 0) return `Actual duration: ${hours}h ${minutes}m`
    if (hours > 0) return `Actual duration: ${hours}h`
    return `Actual duration: ${minutes}m`
  }

  const getObjectiveRuntimeMetrics = (objective: PipObjective) => {
    const totalHours = Number(objective.totalHours ?? 0)
    const savedCompletedHours = Number(objective.completedHours ?? 0)
    const sessionStartedAt = objective.activeSessionStart ? Date.parse(objective.activeSessionStart) : NaN
    const elapsedHours =
      objective.timerRunning && Number.isFinite(sessionStartedAt)
        ? Math.max(0, (timerNow - sessionStartedAt) / 3600000)
        : 0
    const completedHours = totalHours > 0
      ? Math.min(totalHours, savedCompletedHours + elapsedHours)
      : savedCompletedHours + elapsedHours
    const remainingHours = Math.max(0, totalHours - completedHours)
    const progressPercentage = totalHours > 0
      ? Math.min(100, Math.round((completedHours / totalHours) * 100))
      : 0

    return {
      totalHours,
      completedHours,
      remainingHours,
      progressPercentage,
      elapsedMilliseconds: elapsedHours * 3600000,
    }
  }

  const mergedMeetingNotes = useMemo(() => {
    const notes = oneOnOnePipMeetings.flatMap((meeting) => {
      const meetingTitle = meeting.title || 'PIP meeting'
      const typedNotes = meeting.notes.map((note) => ({
        id: `meeting-note-${note.id}`,
        noteType: note.noteType === 'MANAGER_NOTE' ? 'Meeting Note - Manager' : 'Meeting Note - Employee',
        authorName: note.authorName || 'Unknown author',
        createdAt: note.createdDate,
        content: note.content,
      }))
      const summaryNote = meeting.summaryNotes
        ? [{
            id: `meeting-summary-${meeting.id}`,
            noteType: 'Meeting Summary',
            authorName: meeting.managerName || 'Meeting',
            createdAt: meeting.actualEndTime || meeting.scheduledTime,
            content: `${meetingTitle}\n${meeting.summaryNotes}`,
          }]
        : []
      return [...typedNotes, ...summaryNote]
    })
    return notes
  }, [oneOnOnePipMeetings])
  const [closePip] = useClosePipMutation()
  const [manualClosePip, { isLoading: isManualClosing }] = useManualClosePipMutation()
  const [employeeSign, { isLoading: isSigningEmployee }] = useEmployeeSignMutation()
  const [managerSign, { isLoading: isSigningManager }] = useManagerSignMutation()
  const [markPipCompleted, { isLoading: isMarkingCompleted }] = useMarkPipCompletedMutation()
  const [reopenPip] = useReopenPipMutation()
  const [reviewPip] = useReviewPipMutation()

  const signatureSettingsPath = isAdmin
    ? '/hr/settings/signature'
    : isEmployee
      ? '/employee/settings/signature'
      : '/manager/settings/signature'
  const getStatusLabel = (status: string) => {
    if (status === 'COMPLETED') return 'Completed'
    if (status === 'AUTO_CLOSED') return 'auto-close'
    if (status === 'REOPEN_REQUESTED') return 'Reopen Requested'
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
  }
  const getStatusClass = (status: string) => {
    if (status === 'COMPLETED') return 'bg-emerald-100 text-emerald-700'
    if (status === 'CLOSED') return 'bg-slate-100 text-slate-700'
    if (status === 'AUTO_CLOSED') return 'bg-amber-100 text-amber-700'
    if (status === 'REOPEN_REQUESTED') return 'bg-orange-100 text-orange-700'
    if (status === 'DENIED') return 'bg-red-100 text-red-700'
    return 'bg-[#dbeafe] text-[#1d4ed8]'
  }
  const getTrainingStatusClass = (status?: string) => {
    const normalized = status?.trim().toUpperCase()
    if (normalized === 'COMPLETED') return 'bg-emerald-100 text-emerald-700'
    if (normalized === 'IN_PROGRESS') return 'bg-[#dbeafe] text-[#1d4ed8]'
    if (normalized === 'NOT_STARTED') return 'bg-slate-100 text-slate-600'
    return 'bg-amber-100 text-amber-700'
  }
  const formatTrainingStatus = (status?: string) => {
    if (!status) return '-'
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
  }
  const filteredTrainingHistory = (trainingHistory ?? []).filter((entry) => {
    if (trainingHistoryFilter === 'ALL') return true
    return (entry.completionStatus || entry.status).toUpperCase() === trainingHistoryFilter
  })
  const groupedTrainingHistory = Object.values(
    filteredTrainingHistory.reduce<Record<string, TrainingRecord>>((groups, entry) => {
      const key = entry.pipId == null
        ? [
          entry.trainingProvider || '',
          entry.startDate || '',
          entry.endDate || entry.completionDate || '',
          entry.completionStatus || entry.status || '',
          entry.totalCompletedHours ?? '',
        ].join('|')
        : `pip-${entry.pipId}`
      const existing = groups[key]
      if (!existing) {
        groups[key] = { ...entry }
        return groups
      }

      const names = new Set(
        [existing.trainingName, entry.trainingName]
          .flatMap((name) => (name || '').split('\n'))
          .map((name) => name.trim())
          .filter(Boolean),
      )
      groups[key] = {
        ...existing,
        trainingName: Array.from(names).join('\n'),
        percentageCompletion: Math.max(existing.percentageCompletion ?? 0, entry.percentageCompletion ?? 0),
        feedbackNotes: [existing.feedbackNotes, entry.feedbackNotes]
          .map((note) => note?.trim())
          .filter(Boolean)
          .filter((note, index, notes) => notes.indexOf(note) === index)
          .join('\n'),
      }
      return groups
    }, {}),
  )
  const getTrainingCompletionPercentage = (percentage?: number, status?: string) => {
    if (typeof percentage === 'number' && Number.isFinite(percentage)) {
      return `${percentage}%`
    }
    return (status || '').toUpperCase() === 'COMPLETED' ? '100%' : '-'
  }
  const isDirectManager = Boolean(
    isManager &&
    pip &&
    (
      (user?.id != null && user.id === pip.manager?.id) ||
      (user?.email && pip.manager?.email && user.email.toLowerCase() === pip.manager.email.toLowerCase()) ||
      (user?.employeeId && pip.manager?.employeeId && user.employeeId === pip.manager.employeeId)
    )
  )
  const routeBase = isAudit ? '/audit/pip-monitoring' : isAdmin ? '/hr/pip-monitoring' : isEmployee ? '/employee/pip' : '/manager/pip'
  const meetingRouteBase = isAudit ? '/audit' : isAdmin ? '/hr' : isEmployee ? '/employee' : '/manager'

  if (isLoading || !pip) return <div className="p-8">Loading PIP details...</div>

  const isAverageProgressComplete = Number(pip.overallProgressPercentage) >= 100
  const canManualClose = isDirectManager && pip.status === 'ACTIVE'
  const canMarkCompleted = isDirectManager && pip.status === 'CLOSED' && isAverageProgressComplete
  const isApprovedReopenedPip = pip.reopenDecision === 'APPROVED'
  const canEmployeeSign = isEmployee
    && pip.status === 'AUTO_CLOSED'
    && !pip.finalOutcome
    && (!pip.reopenReason || isApprovedReopenedPip)
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
  const canAddCommunicationNote = pip.status === 'ACTIVE' && (isEmployee || isDirectManager)
  const goToPipMeetingScheduler = () => {
    const employeeRecordId = pip.employee.employee?.id
    const employeeName = pip.employee.employee?.employeeName
    const description = [
      `[PIP_ID:${pip.id}]`,
      `PIP #${pip.id} follow-up discussion for ${employeeName || 'employee'}.`,
    ].join('\n')
    const params = new URLSearchParams({
      action: 'schedule',
      meetingTitle: 'PIP follow up meeting',
      meetingDescription: description,
    })
    if (employeeRecordId != null) params.set('employeeId', String(employeeRecordId))
    if (employeeName) params.set('employeeName', employeeName)
    navigate(`/manager/meetings?${params.toString()}`)
  }
  const shouldShowSignatureSummary = Boolean(
    pip.finalOutcome
    || pip.employeeSignatureDate
    || pip.managerSignatureDate
    || pip.status === 'AUTO_CLOSED'
  )
  const handleUpdateProgress = async () => {
    if (showUpdateModal.objectiveId) {
      if (updateValue.additionalHours <= 0) {
        setActionError('Additional hours must be greater than 0.')
        return
      }
      if (!updateValue.note.trim()) {
        setActionError('A note is required when increasing PIP hours.')
        return
      }

      try {
        setActionError(null)
        await increaseObjectiveHours({
          objectiveId: showUpdateModal.objectiveId,
          additionalHours: updateValue.additionalHours,
          note: updateValue.note,
        }).unwrap()
        setShowUpdateModal({ open: false, objectiveId: null })
        setUpdateValue({ additionalHours: 0, note: '' })
      } catch (error) {
        console.error('[PIP Detail] Increase objective hours failed:', error)
        setActionError(getActionErrorMessage(error, 'Failed to increase objective hours.'))
      }
    }
  }

  const handleToggleObjectiveTimer = async (objectiveId: number, isRunning?: boolean) => {
    try {
      setActionError(null)
      if (isRunning) {
        await endObjectiveSession(objectiveId).unwrap()
      } else {
        await startObjectiveSession(objectiveId).unwrap()
      }
    } catch (error) {
      console.error('[PIP Detail] Toggle objective timer failed:', error)
      setActionError(getActionErrorMessage(error, 'Failed to update PIP timer.'))
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
    } catch (error) {
      console.error('[PIP Detail] Close PIP failed:', error)
      setActionError(getActionErrorMessage(error, 'Failed to close PIP.'))
    }
  }

  const handleManualClosePip = async () => {
    try {
      setActionError(null)
      await manualClosePip(pipId).unwrap()
    } catch (error) {
      console.error('[PIP Detail] Manual close failed:', error)
      setActionError(getActionErrorMessage(error, 'Failed to manually close PIP.'))
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
    } catch (error) {
      console.error('[PIP Detail] Employee signature failed:', error)
      setActionError(getActionErrorMessage(error, 'Failed to sign PIP.'))
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
    } catch (error) {
      console.error('[PIP Detail] Manager signature failed:', error)
      setActionError(getActionErrorMessage(error, 'Failed to sign PIP.'))
    }
  }

  const handleMarkPipCompleted = async () => {
    try {
      setActionError(null)
      await markPipCompleted(pipId).unwrap()
    } catch (error) {
      console.error('[PIP Detail] Mark PIP completed failed:', error)
      setActionError(getActionErrorMessage(error, 'Failed to mark PIP completed.'))
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
    } catch (error) {
      console.error('[PIP Detail] Reopen PIP failed:', error)
      setActionError(getActionErrorMessage(error, 'Failed to reopen PIP.'))
    }
  }

  const handleApproveReopen = async () => {
    const extendedEndDateIso = toIsoDate(extendedEndDate)
    if (!extendedEndDate.trim()) {
      setActionError('Extended end date is required.')
      return
    }
    if (!extendedEndDateIso) {
      setActionError('Extended end date must be in dd/mm/yyyy format.')
      return
    }
    try {
      setActionError(null)
      await reviewPip({ pipId, action: 'CONFIRMED', extendedEndDate: extendedEndDateIso }).unwrap()
      setShowApproveReopenModal(false)
      setExtendedEndDate('')
    } catch (error) {
      console.error('[PIP Detail] Approve reopen failed:', error)
      setActionError(getActionErrorMessage(error, 'Failed to approve reopen request.'))
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
    } catch (error) {
      console.error('[PIP Detail] Deny review failed:', error)
      setActionError(getActionErrorMessage(error, 'Failed to deny request.'))
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
                onClick={goToPipMeetingScheduler}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <i className="bi bi-calendar-event" /> Schedule Meeting
              </button>
            </>
          )}
          {canManualClose && (
            <button
              onClick={handleManualClosePip}
              disabled={isManualClosing}
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
            >
              <i className="bi bi-lock" /> {isManualClosing ? 'Closing...' : 'Manual Close'}
            </button>
          )}
          {canManagerMarkResult && (
            <button
              onClick={() => setShowCloseModal(true)}
              className="flex items-center gap-2 rounded-lg bg-[#2463eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
            >
              <i className="bi bi-check-circle" /> Mark Result
            </button>
          )}
          {canEmployeeSign && (
            <button
              onClick={() => setShowEmployeeSignModal(true)}
              className="flex items-center gap-2 rounded-lg bg-[#2463eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
            >
              <i className="bi bi-pen" /> Sign PIP
            </button>
          )}
          {canManagerSign && (
            <button
              onClick={() => setShowManagerSignModal(true)}
              className="flex items-center gap-2 rounded-lg bg-[#2463eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
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
              {pip.objectives.map((obj) => {
                const metrics = getObjectiveRuntimeMetrics(obj)
                return (
                <div key={obj.id} className="space-y-3">
                  {isEmployee && pip.status === 'ACTIVE' && (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void handleToggleObjectiveTimer(obj.id, obj.timerRunning)}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${obj.timerRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-[#2463eb] hover:bg-[#1d4ed8]'}`}
                      >
                        {obj.timerRunning ? 'End PIP' : 'Start PIP'}
                      </button>
                      {obj.timerRunning && (
                        <span className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 font-mono text-sm font-bold text-blue-700">
                          {formatLiveTimer(metrics.elapsedMilliseconds)}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <span className="min-w-0 break-words font-medium text-slate-800">{obj.description}</span>
                    {isDirectManager && pip.status === 'ACTIVE' && (
                      <button
                        onClick={() => {
                          setShowUpdateModal({ open: true, objectiveId: obj.id })
                          setUpdateValue({
                            additionalHours: 0,
                            note: ''
                          })
                        }}
                        className="shrink-0 text-sm font-semibold text-[#2463eb] hover:text-[#1e40af]"
                      >
                        Increase Hours
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-4">
                    <div><span className="block font-bold text-slate-900">{formatHours(metrics.totalHours)}</span>Total Hours</div>
                    <div><span className="block font-bold text-slate-900">{formatHours(metrics.completedHours)}</span>Completed</div>
                    <div><span className="block font-bold text-slate-900">{formatHours(metrics.remainingHours)}</span>Remaining</div>
                    <div><span className="block font-bold text-slate-900">{metrics.progressPercentage}%</span>Progress</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${metrics.progressPercentage === 100 ? 'bg-green-500' : 'bg-[#2463eb]'}`}
                        style={{ width: `${metrics.progressPercentage}%` }}
                      />
                    </div>
                    <span className={`min-w-[40px] text-sm font-bold ${metrics.progressPercentage === 100 ? 'text-green-600' : 'text-slate-700'}`}>
                      {metrics.progressPercentage}%
                    </span>
                  </div>
                </div>
                )
              })}
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
              {isPipMeetingsLoading && (
                <p className="py-4 text-center text-slate-500">Loading meetings...</p>
              )}
              {!isPipMeetingsLoading && oneOnOnePipMeetings.map((m) => (
                <div key={`one-on-one-${m.id}`} className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dbeafe] text-[#2463eb]">
                      <i className="bi bi-calendar-check" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {formatDateTime(m.scheduledTime)}
                      </p>
                      <p className="text-xs text-slate-500">
                        One-on-one meeting | {m.status} | {getActualMeetingDuration(m.actualStartTime, m.actualEndTime)}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`${meetingRouteBase}/meetings/${m.id}`}
                    className="text-sm font-semibold text-[#2463eb] hover:text-[#1d4ed8]"
                  >
                    View meeting
                  </Link>
                </div>
              ))}
              {!isPipMeetingsLoading && pip.followUpMeetings?.map((m) => (
                <div key={`pip-${m.id}`} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dbeafe] text-[#2463eb]">
                      <i className="bi bi-calendar-check" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {formatDateTime(m.startMeetingTime || m.meetingTime)} - {m.endMeetingTime ? formatDateTime(m.endMeetingTime) : 'No end time'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {m.status}
                      </p>
                    </div>
                  </div>
                  {m.reminderSent && <span className="text-xs text-green-600 font-medium"><i className="bi bi-bell-fill" /> Reminder sent</span>}
                </div>
              ))}
              {!isPipMeetingsLoading && oneOnOnePipMeetings.length === 0 && (!pip.followUpMeetings || pip.followUpMeetings.length === 0) && (
                <p className="py-4 text-center text-slate-500">No meetings scheduled yet.</p>
              )}
            </div>
          </section>

          <PipCommunicationNotes
            pipId={pipId}
            pipStatus={pip.status}
            canAdd={canAddCommunicationNote}
            currentUserId={user?.id}
            isHr={isAdmin}
            followUpMeetings={pip.followUpMeetings}
            meetingNotes={mergedMeetingNotes}
            onError={setActionError}
          />

          <PipUnifiedLog pipId={pip.id} />

          {/* Training History Section */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-slate-900">Training & Development History</h2>
              <div className="inline-flex w-fit flex-wrap rounded-lg border border-slate-200 bg-slate-50 p-1">
                {[
                  ['IN_PROGRESS', 'In Progress'],
                  ['COMPLETED', 'Completed'],
                  ['NOT_STARTED', 'Not Started'],
                  ['ALL', 'All'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTrainingHistoryFilter(value as typeof trainingHistoryFilter)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${trainingHistoryFilter === value ? 'bg-white text-[#1d4ed8] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-h-[460px] overflow-auto pr-1">
              {isTrainingHistoryLoading && (
                <p className="py-4 text-center text-slate-500">Loading training records...</p>
              )}
              {!isTrainingHistoryLoading && groupedTrainingHistory.length > 0 && (
                <div className="min-w-[980px]">
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
                      {groupedTrainingHistory.map((t) => (
                        <tr key={t.id} className="align-top">
                          <td className="px-3 py-4">
                            <p className="whitespace-pre-wrap font-medium text-slate-800">{t.trainingName || '-'}</p>
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
              {!isTrainingHistoryLoading && groupedTrainingHistory.length === 0 && (
                <p className="py-4 text-center text-slate-500">
                  {trainingHistoryFilter === 'ALL' ? 'No training records found for this employee.' : `No ${formatTrainingStatus(trainingHistoryFilter).toLowerCase()} training history records found.`}
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Info Section */}
        <div className="space-y-8 lg:sticky lg:top-6 lg:self-start">
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
                  <p className="font-medium text-[#1d4ed8]">{formatDate(pip.extendedEndDate)}</p>
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
                  <p className="text-lg font-bold text-[#2463eb]">{pip.completedHours}</p>
                </div>
              </div>
              {pip.finalOutcome && (
                <>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500">Final Outcome</p>
                    <p className="font-bold text-[#2463eb]">{pip.finalOutcome}</p>
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
            <h3 className="mb-4 text-lg font-bold">Increase Objective Hours</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Current Total Hours</label>
                <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700">
                  {selectedObjective?.totalHours ?? 0} hours
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Additional Hours</label>
                <input
                  type="number"
                  min="0.25"
                  step="0.25"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-[#2463eb] focus:outline-none"
                  value={updateValue.additionalHours || ''}
                  onChange={(e) => setUpdateValue({ ...updateValue, additionalHours: Number(e.target.value) })}
                />
                <p className="mt-1 text-[10px] text-slate-400">Managers can only increase objective hours.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Required Note</label>
                <textarea
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-[#2463eb] focus:outline-none"
                  rows={3}
                  placeholder="Explain why these hours are being increased..."
                  value={updateValue.note}
                  onChange={(e) => setUpdateValue({ ...updateValue, note: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowUpdateModal({ open: false, objectiveId: null })} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
              <button
                onClick={handleUpdateProgress}
                disabled={updateValue.additionalHours <= 0 || !updateValue.note.trim()}
                className="rounded-lg bg-[#2463eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Increase Hours
              </button>
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
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-[#2463eb] focus:outline-none"
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
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-[#2463eb] focus:outline-none"
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
                className="rounded-lg bg-[#2463eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#93c5fd]"
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
                  <Link to={signatureSettingsPath} className="shrink-0 text-xs font-semibold text-[#2463eb] hover:underline">
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
                className="rounded-lg bg-[#2463eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#93c5fd]"
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
                  <Link to={signatureSettingsPath} className="shrink-0 text-xs font-semibold text-[#2463eb] hover:underline">
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
                className="rounded-lg bg-[#2463eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#93c5fd]"
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
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-[#2463eb] focus:outline-none"
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
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-[#2463eb] focus:outline-none"
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
              <div className="relative mt-1">
                <input
                  type="text"
                  placeholder="dd/mm/yyyy"
                  inputMode="numeric"
                  className="block w-full rounded-lg border border-slate-300 px-4 py-2 pr-11 focus:border-[#2463eb] focus:outline-none"
                  value={extendedEndDate}
                  onChange={(e) => setExtendedEndDate(e.target.value)}
                />
                <label className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-slate-400 hover:text-[#2463eb]">
                  <i className="bi bi-calendar3" />
                  <input
                    type="date"
                    min={minReopenApprovalDate}
                    value={toIsoDate(extendedEndDate)}
                    onChange={(e) => setExtendedEndDate(toDisplayDateFromIso(e.target.value))}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Choose extended end date"
                  />
                </label>
              </div>
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
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-[#2463eb] focus:outline-none"
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
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-[#2463eb] focus:outline-none"
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
