import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import {
  useValidateAppraisalImportFileMutation,
  useCommitAppraisalImportMutation,
} from './appraisalImportApi'
import type {
  AppraisalImportValidationResponse,
  AppraisalImportCommitResponse,
  AppraisalImportCommitRequest,
} from './appraisalImportApi'

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string)?.replace(/\/$/, '') ||
  'http://localhost:8080'

function apiFetch(url: string, token: string | null) {
  return fetch(`${API_BASE}/api${url}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then((r) => {
    if (!r.ok) throw new Error('Request failed')
    return r.json()
  })
}

function downloadBlob(url: string, filename: string, token: string | null) {
  return fetch(`${API_BASE}/api${url}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
    .then((r) => {
      if (!r.ok) throw new Error('Download failed')
      return r.blob()
    })
    .then((blob) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
    })
}

interface ReviewCycleDto {
  id: number
  name: string
  startDate: string
  endDate: string
  status: string
  yearLabel?: string
}

interface PositionMapping {
  id: number
  departmentId: number
  departmentName: string
  positionId: number
  positionCode: string
  positionName: string
  levelCodeId: number
  levelCodeName: string
}

interface EditedRow {
  rowNumber: number
  categoryName: string
  categoryDescription: string
  questionText: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onImportSuccess: () => void
  token: string | null
}

type Step = 'upload' | 'edit' | 'success'

export default function AppraisalImportModal({ isOpen, onClose, onImportSuccess, token }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [step, setStep] = useState<Step>('upload')
  const [validationResult, setValidationResult] = useState<AppraisalImportValidationResponse | null>(null)
  const [commitResult, setCommitResult] = useState<AppraisalImportCommitResponse | null>(null)
  const [templateLoading, setTemplateLoading] = useState(false)

  // Template metadata fields
  const [templateName, setTemplateName] = useState('')
  const [assessmentDate, setAssessmentDate] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [deadlineDate, setDeadlineDate] = useState('')
  const [reviewCycleId, setReviewCycleId] = useState<number | null>(null)
  const [maxRating, setMaxRating] = useState(10)
  const [selectedPositionIds, setSelectedPositionIds] = useState<number[]>([])
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null)

  // Edited rows
  const [editedRows, setEditedRows] = useState<EditedRow[]>([])

  // Fetched data
  const [reviewCycles, setReviewCycles] = useState<ReviewCycleDto[]>([])
  const [allPositions, setAllPositions] = useState<PositionMapping[]>([])

  const [validateFile, { isLoading: isValidating }] = useValidateAppraisalImportFileMutation()
  const [commitImport, { isLoading: isCommitting }] = useCommitAppraisalImportMutation()

  // Fetch reference data when entering edit step
  useEffect(() => {
    if (step === 'edit') {
      apiFetch('/review-cycles?requiresEmployeeSubmission=true', token)
        .then((res) => {
          const cycles: ReviewCycleDto[] = res.data || []
          setReviewCycles(cycles)
          const activeCycle = cycles.find((c) => c.status?.toUpperCase() === 'ACTIVE')
          if (activeCycle) {
            setReviewCycleId(activeCycle.id)
            setAssessmentDate(activeCycle.startDate)
            setEffectiveDate(activeCycle.startDate)
            setDeadlineDate(activeCycle.endDate)
          }
        })
        .catch(() => {})

      apiFetch('/lookups/department-positions/active', token)
        .then((res) => {
          setAllPositions(res.data || [])
        })
        .catch(() => {})
    }
  }, [step, token])

  const handleClose = useCallback(() => {
    setSelectedFile(null)
    setStep('upload')
    setValidationResult(null)
    setCommitResult(null)
    setTemplateName('')
    setAssessmentDate('')
    setEffectiveDate('')
    setDeadlineDate('')
    setReviewCycleId(null)
    setMaxRating(10)
    setSelectedPositionIds([])
    setSelectedDeptId(null)
    setEditedRows([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }, [onClose])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    setStep('upload')
    setValidationResult(null)
  }, [])

  const handleValidate = useCallback(async () => {
    if (!selectedFile) {
      toast.error('Please select a file first')
      return
    }
    const formData = new FormData()
    formData.append('file', selectedFile)
    try {
      const res = await validateFile(formData).unwrap()
      if (res.success && res.data) {
        setValidationResult(res.data)
        // Initialize edited rows from valid items
        const initial: EditedRow[] = (res.data.validItems || []).map((item) => ({
          rowNumber: item.rowNumber,
          categoryName: (item.rowData['categoryName'] || '') as string,
          categoryDescription: (item.rowData['categoryDescription'] || '') as string,
          questionText: (item.rowData['questionText'] || '') as string,
        }))
        setEditedRows(initial)
        // Auto-generate template name from file name
        const baseName = selectedFile.name.replace(/\.xlsx$/i, '')
        setTemplateName(baseName)
        setStep('edit')
      } else {
        toast.error(res.message || 'Validation failed')
      }
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } }
      toast.error(e.data?.message || 'Validation failed')
    }
  }, [selectedFile, validateFile])

  // Check if form is valid for create
  const isCreateValid = useMemo(() => {
    if (!templateName.trim()) return false
    if (!assessmentDate || !effectiveDate || !deadlineDate) return false
    if (selectedPositionIds.length === 0) return false
    if (editedRows.length === 0) return false
    // Check all edited rows have non-blank category name and question text
    for (const row of editedRows) {
      if (!row.categoryName.trim()) return false
      if (!row.questionText.trim()) return false
    }
    return true
  }, [templateName, assessmentDate, effectiveDate, deadlineDate, selectedPositionIds, editedRows])

  const handleCommit = useCallback(async () => {
    if (!validationResult?.validationId) return
    if (!isCreateValid) return

    const payload: AppraisalImportCommitRequest = {
      validationId: validationResult.validationId,
      templateName: templateName.trim(),
      assessmentDate,
      effectiveDate,
      deadlineDate,
      reviewCycleId,
      maxRating,
      positionIds: selectedPositionIds,
      editedRows: editedRows.map((r) => ({
        rowNumber: r.rowNumber,
        categoryName: r.categoryName.trim(),
        categoryDescription: r.categoryDescription.trim(),
        questionText: r.questionText.trim(),
      })),
    }
    try {
      const res = await commitImport(payload).unwrap()
      if (res.success && res.data) {
        setCommitResult(res.data)
        setStep('success')
        onImportSuccess()
      } else {
        toast.error(res.message || 'Import failed')
      }
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } }
      toast.error(e.data?.message || 'Import failed')
    }
  }, [validationResult, commitImport, onImportSuccess, isCreateValid, templateName, assessmentDate, effectiveDate, deadlineDate, reviewCycleId, maxRating, selectedPositionIds, editedRows])

  const handleDownloadTemplate = useCallback(async () => {
    setTemplateLoading(true)
    try {
      await downloadBlob('/appraisals/import/template', 'appraisal_import_template.xlsx', token)
    } catch {
      toast.error('Failed to download template')
    } finally {
      setTemplateLoading(false)
    }
  }, [token])

  const updateEditedRow = useCallback((rowNumber: number, field: keyof EditedRow, value: string) => {
    setEditedRows((prev) =>
      prev.map((r) => (r.rowNumber === rowNumber ? { ...r, [field]: value } : r))
    )
  }, [])

  // Group edited rows by category name (current edited name)
  const groupedEdited = useMemo(() => {
    const map: Record<string, EditedRow[]> = {}
    for (const row of editedRows) {
      const cat = row.categoryName.trim() || 'Unknown'
      if (!map[cat]) map[cat] = []
      map[cat].push(row)
    }
    return map
  }, [editedRows])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#eff6ff] to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] flex items-center justify-center shadow shadow-[#dbeafe]">
              <i className="bi bi-file-earmark-spreadsheet text-white text-lg"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {step === 'edit' ? 'Review & Create Template' : 'Import Appraisal Template'}
              </h2>
              <p className="text-xs text-gray-500">
                {step === 'upload' && 'Upload .xlsx file with categories and questions'}
                {step === 'edit' && 'Edit rows and fill template details to create'}
                {step === 'success' && 'Import complete'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <i className="bi bi-x-lg text-sm"></i>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-[#eff6ff] rounded-xl border border-[#bfdbfe]">
                <i className="bi bi-info-circle text-[#2463eb] text-lg flex-shrink-0"></i>
                <p className="text-sm text-[#1e40af]">
                  Download the template, fill in the Appraisal Template sheet, then upload it here.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  disabled={templateLoading}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#bfdbfe] text-[#1d4ed8] rounded-lg hover:bg-[#eff6ff] disabled:opacity-60 transition shrink-0"
                >
                  {templateLoading ? (
                    <span className="inline-block w-3 h-3 border-2 border-[#60a5fa] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="bi bi-download"></i>
                  )}
                  Template
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Excel File
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#60a5fa] hover:bg-[#eff6ff]/30 transition group"
                >
                  <i className="bi bi-cloud-upload text-3xl text-gray-300 group-hover:text-[#2463eb] transition"></i>
                  {selectedFile ? (
                    <p className="mt-2 text-sm font-medium text-gray-700">{selectedFile.name}</p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-400">Click to browse or drag a .xlsx file</p>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step: Edit */}
          {step === 'edit' && validationResult && (
            <div className="space-y-6">
              {/* Validation summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                  <p className="text-2xl font-bold text-gray-800">{validationResult.totalRows}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Rows</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                  <p className="text-2xl font-bold text-emerald-600">{validationResult.validRows}</p>
                  <p className="text-xs text-emerald-600 mt-1">Valid</p>
                </div>
                <div className={`rounded-xl p-4 text-center border ${validationResult.invalidRows > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                  <p className={`text-2xl font-bold ${validationResult.invalidRows > 0 ? 'text-red-600' : 'text-gray-400'}`}>{validationResult.invalidRows}</p>
                  <p className={`text-xs mt-1 ${validationResult.invalidRows > 0 ? 'text-red-500' : 'text-gray-400'}`}>Failed</p>
                </div>
              </div>

              {/* Template Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 outline-none focus:border-[#2463eb] focus:ring-4 focus:ring-[#dbeafe] transition-all"
                />
              </div>

              {/* Dates and Rating */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl border-2 transition-all ${!assessmentDate ? 'bg-red-50/10 border-red-100' : 'bg-slate-50/50 border-[#dbeafe]'}`}>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Assessment Date {!assessmentDate && '*'}
                  </p>
                  <input
                    type="date"
                    value={assessmentDate}
                    onChange={(e) => setAssessmentDate(e.target.value)}
                    className="w-full text-sm font-semibold text-gray-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer outline-none"
                  />
                </div>
                <div className={`p-4 rounded-xl border-2 transition-all ${!effectiveDate ? 'bg-red-50/10 border-red-100' : 'bg-slate-50/50 border-emerald-100'}`}>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Effective Date {!effectiveDate && '*'}
                  </p>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full text-sm font-semibold text-gray-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer outline-none"
                  />
                </div>
                <div className={`p-4 rounded-xl border-2 transition-all ${!deadlineDate ? 'bg-red-50/10 border-red-100' : 'bg-slate-50/50 border-amber-100'}`}>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Deadline Date {!deadlineDate && '*'}
                  </p>
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full text-sm font-semibold text-gray-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer outline-none"
                  />
                </div>
                <div className="p-4 rounded-xl border-2 bg-slate-50/50 border-[#dbeafe]">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Rating Scale
                  </p>
                  <select
                    value={maxRating}
                    onChange={(e) => setMaxRating(Number(e.target.value))}
                    className="w-full text-sm font-semibold text-gray-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer appearance-none outline-none"
                  >
                    <option value={10}>1 to 10 Scale</option>
                    <option value={5}>1 to 5 Scale</option>
                    <option value={4}>1 to 4 Scale</option>
                    <option value={3}>1 to 3 Scale</option>
                  </select>
                </div>
              </div>

              {/* Review Cycle */}
              <div className={`p-4 rounded-xl border-2 transition-all ${!reviewCycleId ? 'bg-red-50/10 border-red-100' : 'bg-slate-50/50 border-[#dbeafe]'}`}>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Review Cycle {!reviewCycleId && '*'}
                </p>
                <select
                  value={reviewCycleId || ''}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null
                    setReviewCycleId(id)
                    if (id) {
                      const cycle = reviewCycles.find((c) => c.id === id)
                      if (cycle) {
                        setAssessmentDate(cycle.startDate)
                        setEffectiveDate(cycle.startDate)
                        setDeadlineDate(cycle.endDate)
                      }
                    }
                  }}
                  className="w-full text-sm font-semibold text-gray-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer appearance-none outline-none"
                >
                  <option value="">Manual Date Entry</option>
                  {reviewCycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.yearLabel || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Positions */}
              <div className={`p-5 rounded-xl border-2 transition-all ${selectedPositionIds.length === 0 ? 'bg-red-50/10 border-red-100' : 'bg-slate-50/50 border-slate-200'}`}>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Target Positions {selectedPositionIds.length === 0 && '*'}
                </p>
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Department list */}
                  <div className="w-full lg:w-1/3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Departments</p>
                    <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-gray-100 p-1.5 bg-white">
                      {Array.from(new Set(allPositions.map((p) => p.departmentId))).map((deptId) => {
                        const deptName = allPositions.find((p) => p.departmentId === deptId)?.departmentName || 'General'
                        return (
                          <button
                            key={deptId}
                            onClick={() => setSelectedDeptId(deptId)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${
                              selectedDeptId === deptId
                                ? 'bg-[#2463eb] text-white'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {deptName}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  {/* Position checkboxes */}
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Positions</p>
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-100 p-3 bg-white">
                      {selectedDeptId ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {allPositions
                            .filter((p) => p.departmentId === selectedDeptId)
                            .map((pos) => (
                              <label
                                key={pos.id}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                                  selectedPositionIds.includes(pos.id)
                                    ? 'border-blue-500 bg-[#eff6ff]'
                                    : 'border-transparent hover:border-gray-200'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                    selectedPositionIds.includes(pos.id)
                                      ? 'bg-[#2463eb] border-[#2463eb]'
                                      : 'border-gray-300'
                                  }`}
                                >
                                  {selectedPositionIds.includes(pos.id) && (
                                    <i className="bi bi-check text-white text-[10px]"></i>
                                  )}
                                </div>
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={selectedPositionIds.includes(pos.id)}
                                  onChange={() => {
                                    setSelectedPositionIds((prev) =>
                                      prev.includes(pos.id)
                                        ? prev.filter((id) => id !== pos.id)
                                        : [...prev, pos.id]
                                    )
                                  }}
                                />
                                <span className="text-[11px] font-semibold text-gray-700">
                                  {pos.positionName}
                                </span>
                              </label>
                            ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 text-center py-6">Select a department to view positions</p>
                      )}
                    </div>
                  </div>
                </div>
                {selectedPositionIds.length > 0 && (
                  <p className="text-[10px] font-semibold text-emerald-600 mt-2">
                    {selectedPositionIds.length} position{selectedPositionIds.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Editable Valid Rows */}
              {editedRows.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <i className="bi bi-pencil-square text-[#2463eb]"></i>
                    Edit Imported Rows ({editedRows.length})
                  </h4>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {Object.entries(groupedEdited).map(([catName, rows]) => (
                      <div key={catName} className="bg-white rounded-xl border border-gray-200 p-3">
                        <div className="text-xs font-bold text-[#2463eb] uppercase tracking-wide mb-2 px-1">
                          {catName}
                        </div>
                        <div className="space-y-2">
                          {rows.map((row) => (
                            <div key={row.rowNumber} className="bg-gray-50 rounded-lg border border-gray-100 p-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                                    Category Name
                                  </label>
                                  <input
                                    type="text"
                                    value={row.categoryName}
                                    onChange={(e) => updateEditedRow(row.rowNumber, 'categoryName', e.target.value)}
                                    className={`w-full bg-white border-2 rounded-lg px-3 py-2 text-xs font-semibold text-gray-800 outline-none transition-all ${
                                      row.categoryName.trim()
                                        ? 'border-gray-200 focus:border-[#2463eb]'
                                        : 'border-red-300 focus:border-red-500'
                                    }`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                                    Category Description
                                  </label>
                                  <input
                                    type="text"
                                    value={row.categoryDescription}
                                    onChange={(e) => updateEditedRow(row.rowNumber, 'categoryDescription', e.target.value)}
                                    className="w-full bg-white border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-[#2463eb] transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                                    Question Text
                                  </label>
                                  <input
                                    type="text"
                                    value={row.questionText}
                                    onChange={(e) => updateEditedRow(row.rowNumber, 'questionText', e.target.value)}
                                    className={`w-full bg-white border-2 rounded-lg px-3 py-2 text-xs font-semibold text-gray-800 outline-none transition-all ${
                                      row.questionText.trim()
                                        ? 'border-gray-200 focus:border-[#2463eb]'
                                        : 'border-red-300 focus:border-red-500'
                                    }`}
                                  />
                                </div>
                              </div>
                              <div className="text-[9px] text-gray-400 font-mono mt-1.5">Row {row.rowNumber}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invalid rows - read-only */}
              {validationResult.invalidRows > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <i className="bi bi-exclamation-circle text-red-500"></i>
                    Failed Rows - Will Be Skipped ({validationResult.invalidRows})
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-50">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="bg-red-50 border-b border-red-100">
                          <th className="px-3 py-2 text-left text-red-700 font-semibold w-12">Row</th>
                          <th className="px-3 py-2 text-left text-red-700 font-semibold">Category Name</th>
                          <th className="px-3 py-2 text-left text-red-700 font-semibold">Question Text</th>
                          <th className="px-3 py-2 text-left text-red-700 font-semibold">Errors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationResult.invalidItems.map((item) => (
                          <tr key={item.rowNumber} className="border-b border-gray-100">
                            <td className="px-3 py-2 font-mono text-gray-500">{item.rowNumber}</td>
                            <td className="px-3 py-2 text-gray-700">{item.rowData['categoryName'] || '—'}</td>
                            <td className="px-3 py-2 text-gray-700">{item.rowData['questionText'] || '—'}</td>
                            <td className="px-3 py-2">
                              <ul className="list-disc list-inside space-y-0.5">
                                {item.errors.map((err, i) => (
                                  <li key={i} className="text-red-600">{err}</li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Validation hint */}
              {!isCreateValid && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
                  <i className="bi bi-info-circle mr-1.5"></i>
                  Fill in all required fields (
                  {!templateName.trim() && 'Template Name, '}
                  {!assessmentDate && 'Assessment Date, '}
                  {!effectiveDate && 'Effective Date, '}
                  {!deadlineDate && 'Deadline Date, '}
                  {selectedPositionIds.length === 0 && 'Target Positions, '}
                  {editedRows.some((r) => !r.categoryName.trim() || !r.questionText.trim()) && 'All Row Fields'}
                  ) to enable creation.
                </div>
              )}
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && commitResult && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <i className="bi bi-check-circle-fill text-emerald-500 text-3xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Import Successful!</h3>
              <p className="text-sm font-semibold text-[#2463eb] mb-4">
                Template: {commitResult.templateName}
              </p>
              <p className="text-gray-500 mb-4">{commitResult.message}</p>
              <div className="flex justify-center gap-6 flex-wrap">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-600">{commitResult.createdCategoryCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Categories Created</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#2463eb]">{commitResult.reusedCategoryCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Categories Reused</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-600">{commitResult.createdQuestionCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Questions Created</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#2463eb]">{commitResult.reusedQuestionCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Questions Reused</p>
                </div>
                {commitResult.failedCount > 0 && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-500">{commitResult.failedCount}</p>
                    <p className="text-xs text-gray-500 mt-1">Failed</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          {step === 'success' ? (
            <button
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
            >
              Done
            </button>
          ) : (
            <>
              <button
                onClick={handleClose}
                disabled={isValidating || isCommitting}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Cancel
              </button>

              {step === 'upload' && (
                <button
                  onClick={handleValidate}
                  disabled={!selectedFile || isValidating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] text-white text-sm font-semibold hover:from-[#1d4ed8] hover:to-[#1e40af] disabled:opacity-50 transition shadow-sm shadow-[#dbeafe]"
                >
                  {isValidating ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="bi bi-shield-check"></i>
                  )}
                  Validate File
                </button>
              )}

              {step === 'edit' && (
                <>
                  <button
                    onClick={() => {
                      setStep('upload')
                      setValidationResult(null)
                      setSelectedFile(null)
                      setEditedRows([])
                      setTemplateName('')
                      setAssessmentDate('')
                      setEffectiveDate('')
                      setDeadlineDate('')
                      setReviewCycleId(null)
                      setSelectedPositionIds([])
                      setSelectedDeptId(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    disabled={isCommitting}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition"
                  >
                    <i className="bi bi-arrow-left"></i>
                    Back
                  </button>
                  <button
                    onClick={handleCommit}
                    disabled={!isCreateValid || isCommitting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    {isCommitting ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <i className="bi bi-cloud-upload"></i>
                    )}
                    Create Template
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
