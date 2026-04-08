import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  useGetPipByIdQuery,
  useUpdateProgressMutation,
  useScheduleMeetingMutation,
  useClosePipMutation,
  useReopenPipMutation,
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

  const { data: trainingHistory } = useGetTrainingHistoryQuery(pip?.employee.employeeId ?? '', {
    skip: !pip?.employee.employeeId,
  })

  const [showUpdateModal, setShowUpdateModal] = useState<{ open: boolean; objectiveId: number | null }>({
    open: false,
    objectiveId: null,
  })
  const [updateValue, setUpdateValue] = useState({ percentage: 0, completedHours: 0, feedback: '' })

  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [meetingTime, setMeetingTime] = useState('')

  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closeData, setCloseData] = useState({ finalOutcome: '', closingRemarks: '' })

  const [showReopenModal, setShowReopenModal] = useState(false)
  const [reopenReason, setReopenReason] = useState('')

  const isManagerOrAdmin = user?.role === 'HR' || user?.role === 'DEPARTMENT_HEAD' || user?.role === 'TEAM_HEAD'
  const isAdmin = user?.role === 'HR'

  if (isLoading || !pip) return <div className="p-8">Loading PIP details...</div>

  const handleUpdateProgress = async () => {
    if (showUpdateModal.objectiveId) {
      await updateProgress({
        objectiveId: showUpdateModal.objectiveId,
        progressPercentage: updateValue.percentage,
        completedHours: updateValue.completedHours,
        feedback: updateValue.feedback,
      })
      setShowUpdateModal({ open: false, objectiveId: null })
      setUpdateValue({ percentage: 0, completedHours: 0, feedback: '' })
    }
  }

  const handleScheduleMeeting = async () => {
    await scheduleMeeting({ pipId, meetingTime })
    setShowMeetingModal(false)
    setMeetingTime('')
  }

  const handleClosePip = async () => {
    await closePip({ pipId, ...closeData })
    setShowCloseModal(false)
  }

  const handleReopenPip = async () => {
    await reopenPip({ pipId, reason: reopenReason })
    setShowReopenModal(false)
    setReopenReason('')
  }

  return (
    <div className="p-8 pb-20">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/pip-monitoring" className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
            <i className="bi bi-chevron-left" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">PIP Details: {pip.employee.email}</h1>
            <p className="text-slate-500">Employee ID: {pip.employee.employeeId} | Status: <span className="font-semibold uppercase">{pip.status}</span></p>
          </div>
        </div>

        <div className="flex gap-3">
          {isManagerOrAdmin && pip.status === 'ACTIVE' && (
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
          {isAdmin && pip.status === 'CLOSED' && (
            <button
              onClick={() => setShowReopenModal(true)}
              className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              <i className="bi bi-arrow-counterclockwise" /> Reopen PIP
            </button>
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
                    {isManagerOrAdmin && pip.status === 'ACTIVE' && (
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
                <p className="font-medium text-slate-800">{pip.manager.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Created On</p>
                <p className="font-medium text-slate-800">{formatDate(pip.createdAt)}</p>
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
                <label className="block text-sm font-medium text-slate-700">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                />
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
              <button onClick={handleClosePip} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Close PIP</button>
            </div>
          </div>
        </div>
      )}

      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">Reopen PIP</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Reason for Reopening</label>
                <textarea
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
                  rows={4}
                  placeholder="State the reason for further action..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowReopenModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
              <button onClick={handleReopenPip} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">Reopen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
