import { useEffect, useRef, useState } from 'react'
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
  useExtendPipDateMutation,
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

const PIP_HOURS_LIMIT_MESSAGE = 'Cannot update PIP hours because the total PIP hours exceed the allowed completion time. Please extend the PIP date instead.'

const getPipDurationDays = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return 1
  const start = new Date(`${startDate}T00:00:00Z`).getTime()
  const end = new Date(`${endDate}T00:00:00Z`).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 1
  return Math.max(1, Math.round((end - start) / 86400000))
}

const addDaysToIsoDate = (value?: string, days = 1) => {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return ''
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
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
  const [showExtendDateModal, setShowExtendDateModal] = useState(false)
  const [pipExtendedEndDate, setPipExtendedEndDate] = useState('')
  const extendDatePickerRef = useRef<HTMLInputElement | null>(null)
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
  const [showHoursLimitModal, setShowHoursLimitModal] = useState(false)
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
  const effectiveEndDate = pip?.extendedEndDate || pip?.endDate
  const pipDurationDays = getPipDurationDays(pip?.startDate, effectiveEndDate)
  const allowedPipHours = pipDurationDays * 5
  const summedObjectiveHours = pip?.objectives.reduce((sum, objective) => sum + Number(objective.totalHours ?? 0), 0) ?? 0
  const summaryAutoCloseDate = addDaysToIsoDate(pip?.extendedEndDate || pip?.originalEndDate || pip?.endDate)

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

  const [closePip, { isLoading: isSavingResult }] = useClosePipMutation()
  const [manualClosePip, { isLoading: isManualClosing }] = useManualClosePipMutation()
  const [extendPipDate, { isLoading: isExtendingPipDate }] = useExtendPipDateMutation()
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

  if (isLoading || !pip) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-600" />
        <p className="text-sm font-bold text-slate-400">Loading PIP details...</p>
      </div>
    </div>
  )

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
  const minPipExtendedDate = addDaysToIsoDate(effectiveEndDate)
  const goToPipMeetingScheduler = () => {
    const employeeRecordId = pip.employee.employee?.id
    const employeeName = pip.employee.employee?.employeeName
    const description = [
      `[PIP_ID:${pip.id}]`,
      `PIP #${pip.id} follow-up discussion for ${employeeName || 'employee'}.`,
    ].join('\n')
    const params = new URLSearchParams({
      action: 'schedule',
      source: 'pip',
      pipId: String(pip.id),
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
      if (summedObjectiveHours + updateValue.additionalHours > allowedPipHours) {
        setShowHoursLimitModal(true)
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
        const message = getActionErrorMessage(error, 'Failed to increase objective hours.')
        if (message === PIP_HOURS_LIMIT_MESSAGE) {
          setShowHoursLimitModal(true)
        } else {
          setActionError(message)
        }
      }
    } else {
      setActionError('Select an objective before increasing PIP hours.')
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

  const handleExtendPipDate = async () => {
    const extendedEndDateIso = toIsoDate(pipExtendedEndDate)
    if (!pipExtendedEndDate.trim()) {
      setActionError('Extended end date is required.')
      return
    }
    if (!extendedEndDateIso) {
      setActionError('Extended end date must be in dd/mm/yyyy format.')
      return
    }
    if (minPipExtendedDate && extendedEndDateIso < minPipExtendedDate) {
      setActionError('Extended end date must be after the current PIP end date.')
      return
    }

    try {
      setActionError(null)
      await extendPipDate({ pipId, extendedEndDate: extendedEndDateIso }).unwrap()
      setShowExtendDateModal(false)
      setPipExtendedEndDate('')
    } catch (error) {
      console.error('[PIP Detail] Extend PIP date failed:', error)
      setActionError(getActionErrorMessage(error, 'Failed to extend PIP date.'))
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
    <div className="px-6 py-8 md:px-10 pb-20 max-w-[1600px] mx-auto">
      {actionError && (
        <div className="mb-8 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
          <i className="bi bi-exclamation-circle mr-2" />{actionError}
        </div>
      )}

      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link to={routeBase} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-800">
            <i className="bi bi-chevron-left" />
          </Link>
          <div>
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">PIP #{pip.id}</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">PIP Details</h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {isDirectManager && pip.status === 'ACTIVE' && (
            <>
              <button
                onClick={() => {
                  setPipExtendedEndDate('')
                  setShowExtendDateModal(true)
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-[0_4px_10px_-2px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-700 active:scale-95"
              >
                <i className="bi bi-plus-circle" /> Extend PIP Date
              </button>
              <button
                onClick={goToPipMeetingScheduler}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md"
              >
                <i className="bi bi-calendar-event" /> Schedule Meeting
              </button>
            </>
          )}
          {canManualClose && (
            <button
              onClick={handleManualClosePip}
              disabled={isManualClosing}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <i className="bi bi-lock" /> {isManualClosing ? 'Closing...' : 'Manual Close'}
            </button>
          )}
          {canManagerMarkResult && (
            <button
              onClick={() => setShowCloseModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-[0_4px_10px_-2px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-700 active:scale-95"
            >
              <i className="bi bi-check-circle" /> Mark Result
            </button>
          )}
          {canEmployeeSign && (
            <button
              onClick={() => setShowEmployeeSignModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-[0_4px_10px_-2px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-700 active:scale-95"
            >
              <i className="bi bi-pen" /> Sign PIP
            </button>
          )}
          {canManagerSign && (
            <button
              onClick={() => setShowManagerSignModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-[0_4px_10px_-2px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-700 active:scale-95"
            >
              <i className="bi bi-pen" /> Sign PIP
            </button>
          )}
          {canMarkCompleted && (
            <button
              onClick={handleMarkPipCompleted}
              disabled={isMarkingCompleted}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <i className="bi bi-check2-circle" /> {isMarkingCompleted ? 'Marking...' : 'Mark Completed'}
            </button>
          )}
          {canEmployeeRequestReopen && (
            <button
              onClick={() => setShowReopenModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:bg-orange-700 active:scale-95"
            >
              <i className="bi bi-arrow-counterclockwise" /> Request More Time
            </button>
          )}
          {isDirectManager && pip.status === 'REOPEN_REQUESTED' && (
            <>
              <button
                onClick={() => setShowApproveReopenModal(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95"
              >
                <i className="bi bi-check-lg" /> Approve
              </button>
              <button
                onClick={() => setShowReviewDenyModal(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:bg-red-700 active:scale-95"
              >
                <i className="bi bi-x-lg" /> Deny
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Objectives Section */}
          <section className="rounded-[2rem] border border-white bg-white p-8 shadow-sm">
            <h2 className="mb-8 text-lg font-black text-slate-900 tracking-tight">
              <i className="bi bi-bullseye mr-2 text-blue-600" />
              Improvement Objectives
            </h2>
            <div className="space-y-8">
              {pip.objectives.map((obj) => {
                const metrics = getObjectiveRuntimeMetrics(obj)
                return (
                <div key={obj.id} className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-all hover:border-slate-200 hover:shadow-sm">
                  {isEmployee && pip.status === 'ACTIVE' && (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void handleToggleObjectiveTimer(obj.id, obj.timerRunning)}
                        className={`rounded-2xl px-5 py-2.5 text-xs font-black text-white transition-all active:scale-95 ${
                          obj.timerRunning
                            ? 'bg-red-600 shadow-[0_4px_10px_-2px_rgba(220,38,38,0.3)] hover:bg-red-700'
                            : 'bg-blue-600 shadow-[0_4px_10px_-2px_rgba(37,99,235,0.3)] hover:bg-blue-700'
                        }`}
                      >
                        {obj.timerRunning ? 'End PIP' : 'Start PIP'}
                      </button>
                      {obj.timerRunning && (
                        <span className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2.5 font-mono text-sm font-black text-blue-700">
                          <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          {formatLiveTimer(metrics.elapsedMilliseconds)}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <span className="min-w-0 break-words text-base font-black text-slate-900">{obj.description}</span>
                    {isDirectManager && pip.status === 'ACTIVE' && (
                      <button
                        onClick={() => {
                          setShowUpdateModal({ open: true, objectiveId: obj.id })
                          setUpdateValue({ additionalHours: 0, note: '' })
                        }}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 transition-all hover:bg-blue-100"
                      >
                        <i className="bi bi-plus-circle" /> Extend Hour
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-white p-3 text-center shadow-sm">
                      <p className="text-lg font-black text-slate-900">{formatHours(metrics.totalHours)}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Hours</p>
                    </div>
                    <div className="rounded-xl bg-white p-3 text-center shadow-sm">
                      <p className="text-lg font-black text-blue-600">{formatHours(metrics.completedHours)}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Completed</p>
                    </div>
                    <div className="rounded-xl bg-white p-3 text-center shadow-sm">
                      <p className="text-lg font-black text-orange-600">{formatHours(metrics.remainingHours)}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Remaining</p>
                    </div>
                    <div className="rounded-xl bg-white p-3 text-center shadow-sm">
                      <p className="text-lg font-black text-emerald-600">{metrics.progressPercentage}%</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progress</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-white shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          metrics.progressPercentage >= 100 ? 'bg-emerald-500' :
                          metrics.progressPercentage >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(metrics.progressPercentage, 100)}%` }}
                      />
                    </div>
                    <span className="min-w-[44px] text-right text-sm font-black text-slate-700">{metrics.progressPercentage}%</span>
                  </div>
                </div>
                )
              })}
            </div>
          </section>

          {(pip.expectedImprovements || pip.reasonForPlan) && (
            <section className="rounded-[2rem] border border-white bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-lg font-black text-slate-900 tracking-tight">
                <i className="bi bi-info-circle mr-2 text-blue-600" />
                PIP Details
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {pip.expectedImprovements && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Expected Improvements</p>
                    <p className="text-sm font-bold text-slate-700 whitespace-pre-wrap">{pip.expectedImprovements}</p>
                  </div>
                )}
                {pip.reasonForPlan && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Reason for Plan</p>
                    <p className="text-sm font-bold text-slate-700 whitespace-pre-wrap">{pip.reasonForPlan}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Follow-up Meetings Section */}
          <section className="rounded-[2rem] border border-white bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-black text-slate-900 tracking-tight">
              <i className="bi bi-calendar-check mr-2 text-blue-600" />
              Follow-Up Meetings
            </h2>
            <div className="max-h-[460px] space-y-3 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
              {isPipMeetingsLoading && (
                <p className="py-6 text-center text-sm font-bold text-slate-400">Loading meetings...</p>
              )}
              {!isPipMeetingsLoading && oneOnOnePipMeetings.map((m) => (
                <div key={`one-on-one-${m.id}`} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <i className="bi bi-calendar-check text-lg" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {formatDateTime(m.scheduledTime)}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500">
                        One-on-one meeting | {m.status} | {getActualMeetingDuration(m.actualStartTime, m.actualEndTime)}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`${meetingRouteBase}/meetings/${m.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 transition-all hover:bg-blue-100"
                  >
                    View meeting <i className="bi bi-chevron-right text-[9px]" />
                  </Link>
                </div>
              ))}
              {!isPipMeetingsLoading && pip.followUpMeetings?.map((m) => (
                <div key={`pip-${m.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <i className="bi bi-calendar-check text-lg" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {formatDateTime(m.startMeetingTime || m.meetingTime)} - {m.endMeetingTime ? formatDateTime(m.endMeetingTime) : 'No end time'}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500">{m.status}</p>
                    </div>
                  </div>
                  {m.reminderSent && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700">
                      <i className="bi bi-bell-fill" /> Reminder sent
                    </span>
                  )}
                </div>
              ))}
              {!isPipMeetingsLoading && oneOnOnePipMeetings.length === 0 && (!pip.followUpMeetings || pip.followUpMeetings.length === 0) && (
                <p className="py-6 text-center text-sm font-bold text-slate-400">No meetings scheduled yet.</p>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white bg-white p-8 shadow-sm">
            <PipCommunicationNotes
              pipId={pipId}
              pipStatus={pip.status}
              canAdd={canAddCommunicationNote}
              currentUserId={user?.id}
              isHr={isAdmin}
              onError={setActionError}
            />
          </section>

          <div className="rounded-[2rem] border border-white bg-white p-8 shadow-sm">
            <PipUnifiedLog pipId={pip.id} />
          </div>

          {/* Training History Section */}
          <section className="rounded-[2rem] border border-white bg-white p-8 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                <i className="bi bi-mortarboard mr-2 text-blue-600" />
                Training & Development History
              </h2>
              <div className="inline-flex w-fit rounded-2xl border border-slate-100 bg-slate-50 p-1">
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
                    className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      trainingHistoryFilter === value
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-h-[500px] overflow-auto rounded-2xl border border-slate-100">
              {isTrainingHistoryLoading && (
                <p className="py-8 text-center text-sm font-bold text-slate-400">Loading training records...</p>
              )}
              {!isTrainingHistoryLoading && groupedTrainingHistory.length > 0 && (
                <div className="min-w-[980px]">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="whitespace-nowrap px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Training</th>
                        <th className="whitespace-nowrap px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Provider</th>
                        <th className="whitespace-nowrap px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Start Date</th>
                        <th className="whitespace-nowrap px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">End Date</th>
                        <th className="whitespace-nowrap px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                        <th className="whitespace-nowrap px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Hours</th>
                        <th className="whitespace-nowrap px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Completion</th>
                        <th className="min-w-48 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Feedback</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {groupedTrainingHistory.map((t) => (
                        <tr key={t.id} className="align-top transition-colors hover:bg-slate-50/50">
                          <td className="px-5 py-4">
                            <p className="whitespace-pre-wrap font-black text-slate-800">{t.trainingName || '-'}</p>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-600">{t.trainingProvider || '-'}</td>
                          <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-600">{formatDate(t.startDate)}</td>
                          <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-600">{formatDate(t.endDate ?? t.completionDate)}</td>
                          <td className="whitespace-nowrap px-5 py-4">
                            <span className={`inline-flex rounded-xl px-2.5 py-1 text-[10px] font-black uppercase ${getTrainingStatusClass(t.completionStatus || t.status)}`}>
                              {formatTrainingStatus(t.completionStatus || t.status)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-600">
                            {t.totalCompletedHours ?? pip.completedHours ?? 0} / {pip.totalHours ?? 0}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4">
                            <span className="font-black text-slate-700">
                              {getTrainingCompletionPercentage(t.percentageCompletion, t.completionStatus || t.status)}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-600">{t.feedbackNotes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!isTrainingHistoryLoading && groupedTrainingHistory.length === 0 && (
                <p className="py-8 text-center text-sm font-bold text-slate-400">
                  {trainingHistoryFilter === 'ALL' ? 'No training records found for this employee.' : `No ${formatTrainingStatus(trainingHistoryFilter).toLowerCase()} training history records found.`}
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-[2rem] border border-white bg-white p-8 shadow-sm">
            <h2 className="mb-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</h2>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl font-black text-blue-600 shadow-sm">
                {pip.employee.employee?.employeeName ? pip.employee.employee.employeeName.charAt(0).toUpperCase() : <i className="bi bi-person" />}
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-slate-900 leading-tight">{pip.employee.employee?.employeeName || pip.employee.email || 'N/A'}</p>
                <p className="mt-1 text-xs font-bold text-slate-400">Staff ID: {pip.employee.employeeId || '-'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-xl bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-600">
                    <i className="bi bi-building text-slate-400" /> {pip.employee.employee?.department?.departmentName || '-'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-xl bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-600">
                    <i className="bi bi-briefcase text-slate-400" /> {pip.employee.employee?.position?.positionName || pip.employee.employee?.positionName || '-'}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500">
                  <i className="bi bi-person-check text-blue-600" />
                  Assigned to: {pip.manager.employee?.employeeName || pip.manager.email || '-'}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white bg-white p-8 shadow-sm">
            <h2 className="mb-5 text-[10px] font-black uppercase tracking-widest text-slate-400">PIP Summary</h2>
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50/80 px-5 py-4">
                <span className="text-xs font-bold text-slate-500">Status</span>
                <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase ${getStatusClass(pip.status)}`}>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                    pip.status === 'ACTIVE' ? 'bg-blue-600' :
                    pip.status === 'COMPLETED' ? 'bg-emerald-600' :
                    pip.status === 'CLOSED' ? 'bg-slate-500' :
                    pip.status === 'AUTO_CLOSED' ? 'bg-amber-600' :
                    pip.status === 'REOPEN_REQUESTED' ? 'bg-orange-600' : 'bg-slate-400'
                  }`} />
                  {getStatusLabel(pip.status)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400">PIP Duration</span>
                  <span className="text-sm font-black text-slate-800">{formatDate(pip.startDate)} — {formatDate(pip.endDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400">Original End Date</span>
                  <span className="text-sm font-black text-slate-800">{formatDate(pip.originalEndDate || pip.endDate)}</span>
                </div>
                {pip.extendedEndDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">Extended End Date</span>
                    <span className="text-sm font-black text-blue-700">{formatDate(pip.extendedEndDate)}</span>
                  </div>
                )}
                {summaryAutoCloseDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">Auto-Close Date</span>
                    <span className="text-sm font-black text-amber-700">{formatDate(summaryAutoCloseDate)}</span>
                  </div>
                )}
                {pip.finalCloseDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">Final Close Date</span>
                    <span className="text-sm font-black text-slate-800">{formatDate(pip.finalCloseDate)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400">Created On</span>
                  <span className="text-sm font-black text-slate-800">{formatDateTime(pip.createdAt)}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50/80 p-5">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Hours</p>
                    <p className="text-2xl font-black text-slate-900 leading-none mt-1">{pip.totalHours}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Completed</p>
                    <p className="text-2xl font-black text-blue-600 leading-none mt-1">{pip.completedHours}</p>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-700"
                    style={{ width: `${Math.min(Number(pip.overallProgressPercentage) || 0, 100)}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-[10px] font-bold text-slate-400">Progress</span>
                  <span className="text-[10px] font-black text-slate-700">{pip.overallProgressPercentage}%</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-xs font-bold text-slate-400">Allowed Completion Time</span>
                  <span className="text-sm font-black text-slate-900">{formatHours(allowedPipHours)} hours</span>
                </div>
                <p className="mt-1 text-[10px] font-bold text-slate-400">{pipDurationDays} PIP days x 5 hours/day</p>
              </div>

              {pip.finalOutcome && (
                <>
                  <div className="flex justify-between items-center rounded-2xl bg-emerald-50/80 px-5 py-4">
                    <span className="text-xs font-bold text-slate-500">Final Outcome</span>
                    <span className="text-sm font-black text-emerald-700">{pip.finalOutcome}</span>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-bold text-slate-400">Closing Remarks</p>
                    <p className="text-sm font-bold text-slate-700 whitespace-pre-wrap rounded-2xl bg-slate-50/80 p-4">{pip.closingRemarks}</p>
                  </div>
                </>
              )}
              {shouldShowSignatureSummary && (
                <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Manager Signature</p>
                    {pip.managerSignature && isImageSignature(pip.managerSignature) ? (
                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <img src={resolveMediaSrc(pip.managerSignature)} alt="Manager signature" className="max-h-14 max-w-full object-contain" />
                      </div>
                    ) : pip.managerSignature ? (
                      <p className="text-sm font-bold text-slate-800">{pip.managerSignature}</p>
                    ) : null}
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {pip.managerSignatureDate ? `Signed on ${formatDateTime(pip.managerSignatureDate)}` : 'Pending'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Employee Signature</p>
                    {pip.employeeSignature && isImageSignature(pip.employeeSignature) ? (
                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <img src={resolveMediaSrc(pip.employeeSignature)} alt="Employee signature" className="max-h-14 max-w-full object-contain" />
                      </div>
                    ) : pip.employeeSignature ? (
                      <p className="text-sm font-bold text-slate-800">{pip.employeeSignature}</p>
                    ) : null}
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {pip.employeeSignatureDate ? `Signed on ${formatDateTime(pip.employeeSignatureDate)}` : 'Pending'}
                    </p>
                  </div>
                </div>
              )}
              {pip.reopenReason && (
                <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-1">Reopen Reason</p>
                  <p className="text-sm font-bold text-orange-800 whitespace-pre-wrap">{pip.reopenReason}</p>
                </div>
              )}
              {pip.reopenDecision && (
                <div className="flex justify-between items-center rounded-2xl bg-slate-50/80 px-5 py-4">
                  <span className="text-xs font-bold text-slate-400">Reopen Decision</span>
                  <span className="text-sm font-black text-slate-800">
                    {pip.reopenDecision}
                    {pip.reopenDecisionDate ? ` (${formatDateTime(pip.reopenDecisionDate)})` : ''}
                  </span>
                </div>
              )}
              {pip.reviewReason && (
                <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1">Rejection Reason</p>
                  <p className="text-sm font-bold text-red-800 whitespace-pre-wrap">{pip.reviewReason}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* MODALS */}
      {showUpdateModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl animate-scale-in">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Extend Hour</h3>
              <button onClick={() => setShowUpdateModal({ open: false, objectiveId: null })} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
                <i className="bi bi-x" />
              </button>
            </div>
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="flex justify-between gap-3 mb-2">
                  <span className="text-xs font-bold text-slate-400">Allowed PIP Hours</span>
                  <span className="text-sm font-black text-slate-900">{formatHours(allowedPipHours)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-xs font-bold text-slate-400">Current Objective Hours</span>
                  <span className="text-sm font-black text-slate-900">{formatHours(summedObjectiveHours)}</span>
                </div>
              </div>
              <div>
                <label className="block mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Objective</label>
                <select
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={showUpdateModal.objectiveId ?? ''}
                  onChange={(e) => setShowUpdateModal({ open: true, objectiveId: Number(e.target.value) || null })}
                >
                  <option value="">Select objective...</option>
                  {pip.objectives.map((objective) => (
                    <option key={objective.id} value={objective.id}>{objective.description}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Current Total Hours</label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">{selectedObjective?.totalHours ?? 0} hours</div>
              </div>
              <div>
                <label className="block mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Additional Hours</label>
                <input
                  type="number"
                  min="0.25"
                  step="0.25"
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={updateValue.additionalHours || ''}
                  onChange={(e) => setUpdateValue({ ...updateValue, additionalHours: Number(e.target.value) })}
                />
                <p className="mt-1.5 text-[10px] font-bold text-slate-400">Managers can only increase objective hours.</p>
              </div>
              <div>
                <label className="block mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Required Note</label>
                <textarea
                  className="block w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  rows={3}
                  placeholder="Explain why these hours are being increased..."
                  value={updateValue.note}
                  onChange={(e) => setUpdateValue({ ...updateValue, note: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowUpdateModal({ open: false, objectiveId: null })} className="rounded-2xl border border-slate-200 px-6 py-3 text-xs font-black text-slate-500 transition-all hover:bg-slate-50">Cancel</button>
              <button
                onClick={handleUpdateProgress}
                disabled={!showUpdateModal.objectiveId || updateValue.additionalHours <= 0 || !updateValue.note.trim()}
                className="rounded-2xl bg-blue-600 px-6 py-3 text-xs font-black text-white shadow-[0_4px_10px_-2px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Extend Hour
              </button>
            </div>
          </div>
        </div>
      )}

      {showHoursLimitModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-2xl animate-scale-in">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <i className="bi bi-exclamation-triangle text-2xl" />
            </div>
            <p className="text-sm font-bold text-slate-700 leading-relaxed">{PIP_HOURS_LIMIT_MESSAGE}</p>
            <button
              type="button"
              onClick={() => setShowHoursLimitModal(false)}
              className="mt-8 rounded-2xl bg-blue-600 px-8 py-3 text-xs font-black text-white shadow-[0_4px_10px_-2px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showExtendDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl animate-scale-in">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Extend PIP Date</h3>
              <button onClick={() => setShowExtendDateModal(false)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
                <i className="bi bi-x" />
              </button>
            </div>
            <div>
              <label className="block mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Extended End Date</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="dd/mm/yyyy"
                  inputMode="numeric"
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm font-bold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={pipExtendedEndDate}
                  onChange={(e) => setPipExtendedEndDate(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    const picker = extendDatePickerRef.current as (HTMLInputElement & { showPicker?: () => void }) | null
                    if (picker?.showPicker) { picker.showPicker() } else { picker?.click() }
                  }}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 hover:text-blue-600"
                  aria-label="Choose extended PIP end date"
                >
                  <i className="bi bi-calendar3" />
                </button>
                <input ref={extendDatePickerRef} type="date" min={minPipExtendedDate} value={toIsoDate(pipExtendedEndDate)} onChange={(e) => setPipExtendedEndDate(toDisplayDateFromIso(e.target.value))} className="sr-only" tabIndex={-1} aria-hidden="true" />
              </div>
              <p className="mt-2 text-xs font-bold text-slate-400">Current PIP end date: {formatDate(effectiveEndDate)}</p>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowExtendDateModal(false)} className="rounded-2xl border border-slate-200 px-6 py-3 text-xs font-black text-slate-500 transition-all hover:bg-slate-50">Cancel</button>
              <button
                onClick={handleExtendPipDate}
                disabled={isExtendingPipDate || !pipExtendedEndDate}
                className="rounded-2xl bg-blue-600 px-6 py-3 text-xs font-black text-white shadow-[0_4px_10px_-2px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isExtendingPipDate ? 'Extending...' : 'Extend Date'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-4 md:items-center">
          <div className="my-4 flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-2xl animate-scale-in sm:my-6 sm:rounded-[2rem]">
            <div className="shrink-0 border-b border-slate-100 bg-slate-950 px-5 py-4 text-white sm:px-8 sm:py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">
                    <i className="bi bi-flag" /> Final Decision
                  </span>
                  <h3 className="mt-3 text-xl font-black tracking-tight sm:text-2xl">Mark PIP Result</h3>
                  <p className="mt-1 max-w-xl text-xs font-semibold leading-5 text-slate-300 sm:text-sm sm:leading-6">
                    Confirm the final outcome after both signatures are recorded.
                  </p>
                </div>
                <button onClick={() => setShowCloseModal(false)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20">
                  <i className="bi bi-x-lg text-sm" />
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</p>
                  <p className="mt-1 truncate text-sm font-black text-white">{pip.employee.employee?.employeeName || pip.employee.email}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">PIP Period</p>
                  <p className="mt-1 text-sm font-black text-white">{formatDate(pip.startDate)} - {formatDate(effectiveEndDate)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progress</p>
                  <p className="mt-1 text-sm font-black text-white">{pip.overallProgressPercentage}% complete</p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-8">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    value: 'SUCCESSFUL',
                    title: 'Successful',
                    description: 'Employee met the PIP expectations.',
                    icon: 'bi-check2-circle',
                    className: 'border-emerald-200 bg-emerald-50 text-emerald-700 ring-emerald-200',
                  },
                  {
                    value: 'FAILED',
                    title: 'Failed',
                    description: 'Employee did not meet the PIP expectations.',
                    icon: 'bi-x-circle',
                    className: 'border-red-200 bg-red-50 text-red-700 ring-red-200',
                  },
                ].map((outcome) => {
                  const isSelected = closeData.finalOutcome === outcome.value
                  return (
                    <button
                      key={outcome.value}
                      type="button"
                      onClick={() => setCloseData({ ...closeData, finalOutcome: outcome.value })}
                      className={`group flex min-h-[104px] items-start gap-4 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md sm:min-h-[112px] sm:p-5 ${
                        isSelected
                          ? `${outcome.className} ring-2`
                          : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/40'
                      }`}
                    >
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        isSelected ? 'bg-white/80' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-blue-600'
                      }`}>
                        <i className={`bi ${outcome.icon} text-lg`} />
                      </span>
                      <span>
                        <span className="block text-sm font-black text-slate-900">{outcome.title}</span>
                        <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">{outcome.description}</span>
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Completion Checks</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <i className="bi bi-check-lg" />
                    </span>
                    <div>
                      <p className="text-xs font-black text-slate-800">Employee Signed</p>
                      <p className="text-[11px] font-bold text-slate-500">{pip.employeeSignatureDate ? formatDateTime(pip.employeeSignatureDate) : 'Pending'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <i className="bi bi-check-lg" />
                    </span>
                    <div>
                      <p className="text-xs font-black text-slate-800">Manager Signed</p>
                      <p className="text-[11px] font-bold text-slate-500">{pip.managerSignatureDate ? formatDateTime(pip.managerSignatureDate) : 'Pending'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Manager Comments</label>
                  <span className="text-[11px] font-bold text-slate-400">{closeData.closingRemarks.trim().length} characters</span>
                </div>
                <textarea
                  className="block min-h-[150px] w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  rows={6}
                  placeholder="Summarize the final outcome, evidence reviewed, and next steps..."
                  value={closeData.closingRemarks}
                  onChange={(e) => setCloseData({ ...closeData, closingRemarks: e.target.value })}
                />
              </div>
            </div>

            <div className="shrink-0 flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-8 sm:py-5">
              <button onClick={() => setShowCloseModal(false)} className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-xs font-black text-slate-500 transition-all hover:bg-slate-50">Cancel</button>
              <button
                onClick={handleClosePip}
                disabled={isSavingResult || !closeData.finalOutcome.trim() || !closeData.closingRemarks.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-xs font-black text-white shadow-[0_4px_10px_-2px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className="bi bi-check2-circle" />
                {isSavingResult ? 'Saving...' : 'Save Result'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmployeeSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl animate-scale-in">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Sign PIP Acknowledgement</h3>
              <button onClick={() => setShowEmployeeSignModal(false)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
                <i className="bi bi-x" />
              </button>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-900">Default Signature</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">Your signature from Signature Settings will be recorded for this PIP.</p>
                </div>
                <Link to={signatureSettingsPath} className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-2 text-[10px] font-black text-blue-700 hover:bg-blue-100">
                  Settings <i className="bi bi-chevron-right text-[8px]" />
                </Link>
              </div>
              <div className="mt-4 flex min-h-[80px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white px-4 py-3">
                {isDefaultSigLoading ? (
                  <span className="text-xs font-bold text-slate-400">Loading signature...</span>
                ) : defaultSignature?.signatureData ? (
                  <img src={resolveMediaSrc(defaultSignature.signatureData)} alt="Your default signature" className="max-h-14 max-w-full object-contain" />
                ) : (
                  <p className="text-center text-xs font-bold text-slate-400">No default signature yet.</p>
                )}
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowEmployeeSignModal(false)} className="rounded-2xl border border-slate-200 px-6 py-3 text-xs font-black text-slate-500 transition-all hover:bg-slate-50">Cancel</button>
              <button
                onClick={handleEmployeeSign}
                disabled={isSigningEmployee || isDefaultSigLoading || !hasDefaultSignature}
                className="rounded-2xl bg-blue-600 px-6 py-3 text-xs font-black text-white shadow-[0_4px_10px_-2px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSigningEmployee ? 'Signing...' : 'Sign PIP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showManagerSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl animate-scale-in">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Sign PIP Result</h3>
              <button onClick={() => setShowManagerSignModal(false)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
                <i className="bi bi-x" />
              </button>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-900">Default Signature</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">Your signature from Signature Settings will be recorded for this PIP.</p>
                </div>
                <Link to={signatureSettingsPath} className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-2 text-[10px] font-black text-blue-700 hover:bg-blue-100">
                  Settings <i className="bi bi-chevron-right text-[8px]" />
                </Link>
              </div>
              <div className="mt-4 flex min-h-[80px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white px-4 py-3">
                {isDefaultSigLoading ? (
                  <span className="text-xs font-bold text-slate-400">Loading signature...</span>
                ) : defaultSignature?.signatureData ? (
                  <img src={resolveMediaSrc(defaultSignature.signatureData)} alt="Your default signature" className="max-h-14 max-w-full object-contain" />
                ) : (
                  <p className="text-center text-xs font-bold text-slate-400">No default signature yet.</p>
                )}
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowManagerSignModal(false)} className="rounded-2xl border border-slate-200 px-6 py-3 text-xs font-black text-slate-500 transition-all hover:bg-slate-50">Cancel</button>
              <button
                onClick={handleManagerSign}
                disabled={isSigningManager || isDefaultSigLoading || !hasDefaultSignature}
                className="rounded-2xl bg-blue-600 px-6 py-3 text-xs font-black text-white shadow-[0_4px_10px_-2px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSigningManager ? 'Signing...' : 'Sign PIP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl animate-scale-in">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Submit Reopen Request</h3>
              <button onClick={() => setShowReopenModal(false)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
                <i className="bi bi-x" />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Reason for Reopening</label>
                <select
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
                  <label className="block mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Custom Reason</label>
                  <textarea
                    className="block w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    rows={4}
                    placeholder="State the reason for further action..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowReopenModal(false)} className="rounded-2xl border border-slate-200 px-6 py-3 text-xs font-black text-slate-500 transition-all hover:bg-slate-50">Cancel</button>
              <button onClick={handleReopenPip} className="rounded-2xl bg-orange-600 px-6 py-3 text-xs font-black text-white shadow-sm transition-all hover:bg-orange-700 active:scale-95">Submit Request</button>
            </div>
          </div>
        </div>
      )}

      {showApproveReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl animate-scale-in">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Approve Reopen Request</h3>
              <button onClick={() => setShowApproveReopenModal(false)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
                <i className="bi bi-x" />
              </button>
            </div>
            <div>
              <label className="block mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Extended End Date</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="dd/mm/yyyy"
                  inputMode="numeric"
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm font-bold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={extendedEndDate}
                  onChange={(e) => setExtendedEndDate(e.target.value)}
                />
                <label className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center text-slate-400 hover:text-blue-600">
                  <i className="bi bi-calendar3" />
                  <input type="date" min={minReopenApprovalDate} value={toIsoDate(extendedEndDate)} onChange={(e) => setExtendedEndDate(toDisplayDateFromIso(e.target.value))} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Choose extended end date" />
                </label>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowApproveReopenModal(false)} className="rounded-2xl border border-slate-200 px-6 py-3 text-xs font-black text-slate-500 transition-all hover:bg-slate-50">Cancel</button>
              <button
                onClick={handleApproveReopen}
                disabled={!extendedEndDate}
                className="rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-black text-white shadow-sm transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewDenyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl animate-scale-in">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Deny Request</h3>
              <button onClick={() => setShowReviewDenyModal(false)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
                <i className="bi bi-x" />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Reason</label>
                <select
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
                  <label className="block mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Custom Reason</label>
                  <textarea
                    className="block w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    rows={4}
                    placeholder="Enter deny reason..."
                    value={reviewCustomReason}
                    onChange={(e) => setReviewCustomReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowReviewDenyModal(false)} className="rounded-2xl border border-slate-200 px-6 py-3 text-xs font-black text-slate-500 transition-all hover:bg-slate-50">Cancel</button>
              <button onClick={handleDenyReview} className="rounded-2xl bg-red-600 px-6 py-3 text-xs font-black text-white shadow-sm transition-all hover:bg-red-700 active:scale-95">Deny Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
