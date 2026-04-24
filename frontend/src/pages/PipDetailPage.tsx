import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  useGetPipByIdQuery,
  useUpdateProgressMutation,
  useScheduleMeetingMutation,
  useClosePipMutation,
  useReopenPipMutation,
  useReviewPipMutation,
  useGetTrainingHistoryQuery,
} from '../features/pip/pipApi'
import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'
import { formatDate, formatDateTime } from '../utils/dateUtils'

export default function PipDetailPage() {
  const { id } = useParams<{ id: string }>()
  const pipId = parseInt(id!)
  const { data: pip, isLoading } = useGetPipByIdQuery(pipId)
  const { user } = useSelector((state: RootState) => state.auth)

  const [updateProgress] = useUpdateProgressMutation()
  const [scheduleMeeting] = useScheduleMeetingMutation()
  const [closePip] = useClosePipMutation()
  const [reopenPip] = useReopenPipMutation()
  const [reviewPip] = useReviewPipMutation()

  const employeeRecordId = pip?.employee?.employee?.id
  const { data: trainingHistory } = useGetTrainingHistoryQuery(
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

  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingHour, setMeetingHour] = useState('12')
  const [meetingMinute, setMeetingMinute] = useState('00')
  const [meetingPeriod, setMeetingPeriod] = useState('AM')

  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closeData, setCloseData] = useState({ finalOutcome: '', closingRemarks: '' })

  const [showReopenModal, setShowReopenModal] = useState(false)
  const [reopenReasonType, setReopenReasonType] = useState('Incomplete Goals')
  const [customReason, setCustomReason] = useState('')
  const [showReviewDenyModal, setShowReviewDenyModal] = useState(false)
  const [reviewReasonType, setReviewReasonType] = useState('Policy Not Met')
  const [reviewCustomReason, setReviewCustomReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const userRole = user?.role?.toUpperCase().replace(/\s+/g, '_') || ''
  const isManager = userRole === 'DEPARTMENT_HEAD' || userRole === 'TEAM_HEAD' || userRole === 'MANAGER'
  const isAdmin = userRole === 'HR'
  const isDirectManager = Boolean(
    isManager &&
    pip &&
    (
      (user?.id != null && user.id === pip.manager?.id) ||
      (user?.email && pip.manager?.email && user.email.toLowerCase() === pip.manager.email.toLowerCase()) ||
      (user?.employeeId && pip.manager?.employeeId && user.employeeId === pip.manager.employeeId)
    )
  )
  const routeBase = isAdmin ? '/hr/pip-monitoring' : '/manager/pip'

  if (isLoading || !pip) return <div className="p-8">Loading PIP details...</div>

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
      await closePip({ pipId, ...closeData }).unwrap()
      setShowCloseModal(false)
    } catch (error: any) {
      console.error('[PIP Detail] Close PIP failed:', error)
      setActionError(error?.data?.message || error?.error || 'Failed to close PIP.')
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

  const handleReview = async (action: 'CONFIRMED' | 'DENIED') => {
    try {
      setActionError(null)
      await reviewPip({ pipId, action }).unwrap()
    } catch (error: any) {
      console.error('[PIP Detail] Review PIP failed:', error)
      setActionError(error?.data?.message || error?.error || 'Failed to review PIP.')
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
              Status: <span className="font-semibold uppercase">{pip.status}</span>
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
              <button
                onClick={() => setShowCloseModal(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <i className="bi bi-check-circle" /> Close PIP
              </button>
            </>
          )}
          {isDirectManager && pip.status === 'PENDING_CLOSE' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
              Close request pending HR review
            </div>
          )}
          {isDirectManager && pip.status === 'PENDING_CREATION' && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              New PIP pending HR confirmation
            </div>
          )}
          {isDirectManager && pip.status === 'CLOSED' && (
            <button
              onClick={() => setShowReopenModal(true)}
              className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              <i className="bi bi-arrow-counterclockwise" /> Request Reopen
            </button>
          )}
          {isDirectManager && pip.status === 'PENDING_REOPEN' && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700">
              Reopen request pending HR review
            </div>
          )}
          {isAdmin && (pip.status === 'PENDING_CREATION' || pip.status === 'PENDING_REOPEN' || pip.status === 'PENDING_CLOSE') && (
            <>
              <button
                onClick={() => handleReview('CONFIRMED')}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <i className="bi bi-check-lg" /> Confirm
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
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Training & Development History</h2>
              <span className="text-xs text-slate-500">linked to employee improvement goals</span>
            </div>
            <div className="space-y-4">
              {trainingHistory?.map((t) => (
                <div key={t.id} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-800">{t.trainingName}</p>
                    <p className="text-xs text-slate-500">{formatDate(t.completionDate)}</p>
                  </div>
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {t.status}
                  </span>
                </div>
              ))}
              {(!trainingHistory || trainingHistory.length === 0) && (
                <p className="py-4 text-center text-slate-500">No training records found for this employee.</p>
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
              {pip.status === 'CLOSED' && (
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
              {pip.reopenReason && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500">Reopen Reason</p>
                  <p className="text-sm font-medium text-orange-600 whitespace-pre-wrap">{pip.reopenReason}</p>
                </div>
              )}
              {pip.reviewReason && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500">HR Review Reason</p>
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
                  min={new Date().toISOString().split('T')[0]}
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
            <h3 className="mb-4 text-lg font-bold">Close PIP</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Final Outcome</label>
                <select
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  value={closeData.finalOutcome}
                  onChange={(e) => setCloseData({ ...closeData, finalOutcome: e.target.value })}
                >
                  <option value="">Select Outcome...</option>
                  <option value="SUCCESSFUL">Improvement Achieved</option>
                  <option value="UNSUCCESSFUL">Insufficient Progress</option>
                  <option value="EXTENDED">PIP Extended</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Closing Remarks</label>
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
                Submit Close Request
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
