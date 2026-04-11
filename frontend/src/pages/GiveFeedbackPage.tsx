import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

import { useGetCriteriaQuery } from '../features/criteria/api/criteriaApi'
import { 
  useGetFeedbackRolesQuery, 
  useGetMeQuery, 
  useSubmitFeedbackMutation 
} from '../features/feedback/api/feedbackApi'
import { formatDate } from '../utils/dateUtils'

const getScoreGrade = (score: number) => {
  if (score >= 86) return { text: 'Outstanding', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' }
  if (score >= 71) return { text: 'Good', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' }
  if (score >= 60) return { text: 'Meet Requirement', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', dot: 'bg-indigo-500' }
  if (score >= 40) return { text: 'Need Improvement', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' }
  return { text: 'Unsatisfactory', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-500' }
}

const GRADING_SCALE = [
  { range: '86–100', label: 'Outstanding', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { range: '71–85', label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' },
  { range: '60–70', label: 'Meet Requirement', color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { range: '40–59', label: 'Need Improvement', color: 'text-amber-600', bg: 'bg-amber-100' },
  { range: '00–39', label: 'Unsatisfactory', color: 'text-rose-600', bg: 'bg-rose-100' },
]

export function GiveFeedbackPage() {
  const navigate = useNavigate()
  
  const { data: criteriaRes, isLoading: criteriaLoading } = useGetCriteriaQuery()
  const { data: rolesRes, isLoading: rolesLoading } = useGetFeedbackRolesQuery()
  const { data: meRes, isLoading: meLoading } = useGetMeQuery()
  const [submitFeedback] = useSubmitFeedbackMutation()

  // Evaluatee/Target Information (Section 12)
  const [evaluateeName, setEvaluateeName] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('')
  
  // Feedback Data
  const [ratings, setRatings] = useState<Record<number, number>>({})
  const [comments, setComments] = useState<Record<number, string>>({})

  const [previewOpen, setPreviewOpen] = useState(false)
  const [finishedOpen, setFinishedOpen] = useState(false)

  if (criteriaLoading || rolesLoading || meLoading) return <div className="p-8">Loading data...</div>

  const criteriaList = criteriaRes?.data || []
  const rolesList = rolesRes?.data || []
  const currentUser = meRes?.data

  const todayStr = formatDate(new Date().toISOString())

  // Derived Target Info
  const selectedRoleName = rolesList.find(r => r.id === selectedRoleId)?.name || ''

  // Requirements Check
  const hasRatings = criteriaList.length > 0 && criteriaList.some(c => ratings[c.id] !== undefined)
  
  const isComplete = criteriaList.length > 0 && 
                     evaluateeName.trim() !== '' && 
                     selectedRoleId !== '' && 
                     criteriaList.every(c => ratings[c.id] !== undefined)

  // Calcs - Applied Formula: (total points * 100) / (number of questions * 5)
  const numberOfQuestions = criteriaList.length
  const maxPossiblePoints = numberOfQuestions * 5
  const totalPoints = criteriaList.reduce((sum, c) => sum + (ratings[c.id] || 0), 0)
  const currentScore = maxPossiblePoints > 0 ? (totalPoints * 100) / maxPossiblePoints : 0
  const grade = getScoreGrade(currentScore)

  const handlePreview = () => {
    if (!isComplete) {
      alert("Please fill in all employee information and rate all criteria.")
      return
    }
    setPreviewOpen(true)
  }

  const handleSubmit = async () => {
    setPreviewOpen(false)
    try {
      await submitFeedback({
        evaluateePositionId: Number(selectedRoleId),
        evaluateeName,
        totalPoints,
        totalScore: currentScore,
        scoreGrade: grade.text,
        details: criteriaList.map(c => ({
          criteriaId: c.id,
          rating: ratings[c.id],
          comment: comments[c.id] || ''
        }))
      }).unwrap()

      setFinishedOpen(true)
    } catch (err: any) {
      alert(err?.data?.message || "Error submitting feedback.")
      console.error(err)
    }
  }

  const handleReset = () => {
    setFinishedOpen(false)
    setEvaluateeName('')
    setSelectedRoleId('')
    setRatings({})
    setComments({})
  }

  return (
    <div className="p-8 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-blue-900 tracking-tight">360° Performance Feedback</h1>
          <p className="text-slate-500 font-medium">Evaluate the performance of colleagues within your department.</p>
        </div>
        <button 
          onClick={() => navigate('/hr/360-feedback/history')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-blue-700 hover:bg-slate-50 transition shadow-sm"
        >
          <i className="bi bi-clock-history text-lg" /> View History
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Section: EVALUATOR INFORMATION (The User/Evaluator) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <i className="bi bi-person-badge-fill text-xl" />
            </div>
            <h2 className="text-xl font-bold text-blue-900 uppercase tracking-wide">Evaluator Information</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-bold uppercase tracking-tighter">Full Name</span>
              <span className="font-semibold text-blue-800 text-right">{currentUser?.employeeName || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-bold uppercase tracking-tighter">Employee ID</span>
              <span className="font-semibold text-blue-800 text-right">{currentUser?.employeeId || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-bold uppercase tracking-tighter">Current Position</span>
              <span className="font-semibold text-blue-800 text-right">{currentUser?.positionName || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-bold uppercase tracking-tighter">Department</span>
              <span className="font-black text-blue-600 text-right">{currentUser?.departmentName || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500 font-bold uppercase tracking-tighter">Assessment Date</span>
              <span className="font-semibold text-blue-800 text-right">{todayStr}</span>
            </div>
          </div>
        </div>

        {/* Section: EMPLOYEE INFORMATION (Feedback Target) */}
        <div className="bg-slate-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
              <i className="bi bi-person-plus-fill text-xl" />
            </div>
            <h2 className="text-xl font-bold text-blue-900 uppercase tracking-wide">Employee Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Employee Name</label>
              <input 
                type="text" 
                placeholder="Enter colleague's full name..."
                value={evaluateeName}
                onChange={(e) => setEvaluateeName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Target Department</label>
                <div className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-blue-700">
                  {currentUser?.departmentName}
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Select Role</label>
                <select 
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm font-bold text-blue-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition cursor-pointer"
                >
                  <option value="">-- Choose Role --</option>
                  {rolesList.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="pt-1">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Confirmed Position</label>
              <div className={`w-full border rounded-xl px-4 py-3 text-sm font-bold transition-all ${selectedRoleName ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                {selectedRoleName || 'Please select a role above'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluation Form */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-blue-900 px-8 py-5 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg">Performance Assessment Form</h3>
          <span className="text-blue-300 text-xs font-black tracking-widest">{criteriaList.length} CRITERIA TOTAL</span>
        </div>
        
        <div className="p-8">
          <div className="space-y-4">
            {criteriaList.map((c, i) => (
              <div key={c.id} className="group border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center px-4 py-3 rounded-2xl group-hover:bg-slate-50/50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-black text-blue-900 text-lg mb-1">{i + 1}. {c.name}</h4>
                    {c.description && <p className="text-sm text-slate-500 font-medium leading-relaxed">{c.description}</p>}
                  </div>
                  
                  <div className="flex gap-3 shrink-0 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm ml-auto">
                    {[1, 2, 3, 4, 5].map(val => (
                      <label key={val} className="flex flex-col items-center cursor-pointer group/item">
                        <span className={`text-[10px] font-black mb-1 transition-colors ${ratings[c.id] === val ? 'text-blue-600' : 'text-slate-400 group-hover/item:text-blue-400'}`}>{val}</span>
                        <input 
                          type="radio" 
                          name={`crit-${c.id}`}
                          value={val}
                          className="w-5 h-5 text-blue-600 focus:ring-0 focus:ring-offset-0 border-slate-200 rounded-lg cursor-pointer transition-all hover:scale-110"
                          checked={ratings[c.id] === val}
                          onChange={() => setRatings(prev => ({ ...prev, [c.id]: val }))}
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mt-2 px-4">
                  <textarea 
                    placeholder="Provide specific details or feedback (Optional)..."
                    rows={2}
                    value={comments[c.id] || ''}
                    onChange={(e) => setComments(prev => ({ ...prev, [c.id]: e.target.value }))}
                    className="w-full text-sm border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 p-4 border transition-all resize-none shadow-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Box */}
      {criteriaList.length > 0 && (
        <div className="mt-12 space-y-6">
          <div className="flex items-center gap-4 px-2">
            <h3 className="text-xl font-black text-blue-900 uppercase tracking-tight">Assessment Result</h3>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {!isComplete && hasRatings && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-700 text-sm font-bold">
              <i className="bi bi-exclamation-triangle-fill text-xl" />
              <span>Please finish selecting a target role and filling all criteria to finalize this result.</span>
            </div>
          )}

          <div className={`border-2 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-slate-200/50 transition-all ${grade.bg} ${grade.border}`}>
            <div className="mb-8 md:mb-0 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 border border-white/80 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
                <div className={`w-2 h-2 rounded-full ${grade.dot} ${hasRatings ? 'animate-pulse' : ''}`} />
                Current Calculated Score
              </div>
              <div className="text-6xl font-black text-blue-950 tracking-tighter leading-none">
                {currentScore.toFixed(0)}
                <span className="text-2xl text-slate-400 font-medium tracking-tight ml-2">/ 100</span>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end">
              <div className="text-center md:text-right">
                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] block mb-2">Qualitative Scale</span>
                <div className={`text-5xl font-black uppercase tracking-tighter ${grade.color}`}>
                  {grade.text}
                </div>
                <div className="mt-4 flex items-center justify-center md:justify-end gap-2 text-slate-500 font-bold text-sm">
                  <i className="bi bi-info-circle" />
                  {totalPoints} pts / {maxPossiblePoints} max
                </div>
              </div>
            </div>
          </div>

          {/* Grading Legend */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 px-2">
              <i className="bi bi-bar-chart-fill text-slate-400" />
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Reference Grading Scale</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {GRADING_SCALE.map((s) => (
                <div key={s.label} className={`flex flex-col items-center p-4 rounded-2xl border ${grade.text === s.label ? `${s.bg} border-current ring-2 ring-offset-2 ring-slate-100` : 'bg-slate-50/50 border-slate-100'}`}>
                  <span className={`text-lg font-black ${grade.text === s.label ? s.color : 'text-blue-900'}`}>{s.range}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest mt-1 text-center ${grade.text === s.label ? s.color : 'text-slate-400'}`}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Submit Action */}
      <div className="flex justify-center mt-12 mb-20">
        <button 
          onClick={handlePreview}
          disabled={!isComplete}
          className={`group flex items-center gap-3 px-16 py-5 rounded-2xl font-black text-xl shadow-xl transition-all ${
            isComplete 
            ? 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 shadow-blue-500/30' 
            : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <i className={`bi bi-shield-check transition-transform group-hover:scale-125 ${isComplete ? 'text-blue-200' : 'text-slate-300'}`} />
          Preview & Submit Review
        </button>
      </div>

      {/* Modals remain mostly similar... */}
      <Transition appear show={previewOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setPreviewOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl transition-all">
                  <Dialog.Title as="h3" className="text-2xl font-black text-slate-900 mb-6 border-b pb-4">Review Confirmation</Dialog.Title>
                  
                  <div className="mb-6 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target Name</span>
                      <span className="font-bold text-slate-800">{evaluateeName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Selected Role</span>
                      <span className="font-bold text-slate-800">{selectedRoleName}</span>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 pb-4">
                    {criteriaList.map((c, i) => (
                      <div key={c.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                        <span className="font-bold text-slate-700">{i + 1}. {c.name}</span>
                        <span className="font-black text-blue-600 text-lg">{ratings[c.id]} / 5</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex justify-end gap-3">
                    <button type="button" className="px-6 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition" onClick={() => setPreviewOpen(false)}>Edit</button>
                    <button type="button" className="px-8 py-3 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition" onClick={handleSubmit}>Confirm & Submit Final</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={finishedOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md rounded-[2.5rem] bg-white p-10 text-center shadow-2xl transition-all">
              <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 text-green-600">
                <i className="bi bi-check-lg text-5xl" />
              </div>
              <Dialog.Title as="h3" className="text-3xl font-black text-slate-900 mb-2">Success!</Dialog.Title>
              <p className="text-slate-500 font-medium mb-10 leading-relaxed">Your performance evaluation for <strong className="text-slate-800">{evaluateeName}</strong> has been successfully uploaded to the system.</p>
              
              <div className="space-y-4">
                <button type="button" className="w-full py-4 font-black text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xl shadow-blue-500/20 transition-all" onClick={handleReset}>New Evaluation</button>
                <button type="button" className="w-full py-4 font-bold text-slate-600 border-2 border-slate-200 hover:bg-slate-50 transition rounded-2xl" onClick={() => navigate('/hr/dashboard')}>Return to Dashboard</button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}
