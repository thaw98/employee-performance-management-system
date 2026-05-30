import { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { Download, Upload, X, Trash2, Plus, CheckCircle2, AlertCircle, FileSpreadsheet, Building2, BriefcaseBusiness, Search, Layers3, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useValidateSelfAssessmentTemplateImportMutation,
  useCreateTemplateMutation,
  useCheckActiveTemplateConflictsMutation,
  useGetSelfAssessmentSettingsQuery,
  type SelfAssessmentTemplateImportValidRow,
  type SelfAssessmentTemplateImportValidationResponse,
  type SelfAssessmentRatingSystem,
} from '../../features/selfAssessmentForm/api/selfAssessmentFormApi'
import { useGetDepartmentsQuery } from '../../features/department/api/departmentApi'
import { useGetPositionsByDepartmentQuery } from '../../features/position/api/positionApi'
import { useGetEmployeesQuery } from '../../features/hrEmployeeList/hrEmployeeApi'
import { useGetReviewCyclesQuery } from '../../features/reviewCycle/api/reviewCycleApi'
import { formatCycleDate } from './SelfAssessmentReviewCycleInfo'
import { formatEmployeeCount } from './SelfAssessmentAudienceCard'

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string)?.replace(/\/$/, '') ||
  'http://localhost:8080'

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

interface TargetPair {
  departmentId: number
  departmentName: string
  positionId: number
  positionName: string
}

type AudienceType = 'all' | 'departments' | 'positions' | 'hybrid'

interface HybridRule {
  id: string
  departmentId: number | null
  positionId: number | null
  departmentLabel?: string | null
  positionLabel?: string | null
}

const createHybridRuleId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `hr-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeLookupKey = (value: unknown) => (typeof value === 'string' ? value.trim().toLowerCase() : '')

interface Props {
  isOpen: boolean
  onClose: () => void
  onImportSuccess: () => void
  token: string | null
}

type Step = 'upload' | 'review' | 'success'

const inputBase =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-[#2463eb] focus:outline-none focus:ring-2 focus:ring-[#2463eb]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500'

const selectBase =
  'w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 shadow-sm transition-all focus:border-[#2463eb] focus:outline-none focus:ring-2 focus:ring-[#2463eb]/20 disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-[#2463eb] dark:disabled:bg-slate-900'

export default function SelfAssessmentTemplateImportModal({ isOpen, onClose, onImportSuccess, token }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [step, setStep] = useState<Step>('upload')
  const [validationResult, setValidationResult] = useState<SelfAssessmentTemplateImportValidationResponse | null>(null)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [editedRows, setEditedRows] = useState<SelfAssessmentTemplateImportValidRow[]>([])
  const [templateName, setTemplateName] = useState('')
  const [audienceType, setAudienceType] = useState<AudienceType>('all')
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<number[]>([])
  const [selectedGlobalPositionIds, setSelectedGlobalPositionIds] = useState<number[]>([])
  const [hybridRules, setHybridRules] = useState<HybridRule[]>([{ id: createHybridRuleId(), departmentId: null, positionId: null }])
  const [positionAudienceSearch, setPositionAudienceSearch] = useState('')
  const [timelineMode, setTimelineMode] = useState<'REVIEW_CYCLE' | 'MANUAL'>('REVIEW_CYCLE')
  const [selectedReviewCycleId, setSelectedReviewCycleId] = useState<number | null>(null)
  const [manualStartDate, setManualStartDate] = useState('')
  const [manualEndDate, setManualEndDate] = useState('')
  const [ratingSystem, setRatingSystem] = useState<SelfAssessmentRatingSystem | undefined>(undefined)
  const [tenPointYesMinRating, setTenPointYesMinRating] = useState<number>(5)

  const [validateFile, { isLoading: isValidating }] = useValidateSelfAssessmentTemplateImportMutation()
  const [createTemplate, { isLoading: isCreating }] = useCreateTemplateMutation()
  const [checkActiveTemplateConflicts] = useCheckActiveTemplateConflictsMutation()

  const { data: reviewCycles = [], isLoading: reviewCyclesLoading } = useGetReviewCyclesQuery({ requiresEmployeeSubmission: true })
  const { data: deptsResponse } = useGetDepartmentsQuery()
  const departments = useMemo(() => {
    const items = deptsResponse?.data || []
    return items.map((d: any) => ({
      id: Number(d.departmentId ?? d.id),
      name: String(d.departmentName ?? d.name ?? ''),
    })).filter((d: any) => d.id && d.name)
  }, [deptsResponse?.data])
  const { data: positionsResponse } = useGetPositionsByDepartmentQuery()
  const positions = useMemo(() => {
    const items = positionsResponse?.data || []
    return items.map((p: any) => ({
      id: Number(p.positionId ?? p.id),
      name: String(p.positionName ?? p.name ?? ''),
    })).filter((p: any) => p.id && p.name)
  }, [positionsResponse?.data])
  const { data: employeesResponse } = useGetEmployeesQuery({ page: 0, size: 10000, sortBy: 'employeeId', sortDir: 'asc' })
  const { data: selfAssessmentSettings, isLoading: selfAssessmentSettingsLoading } = useGetSelfAssessmentSettingsQuery()
  const activeEmployees = useMemo(() => {
    const content = (employeesResponse as any)?.data?.content || []
    return content.filter((e: any) => e.employeeActiveStatus === 'ACTIVE' || (e.employmentStatus !== 'Resigned' && e.employmentStatus !== 'Terminated'))
  }, [employeesResponse])

  const departmentIdByName = useMemo(
    () => new Map(departments.filter((d: any) => d.name).map((d: any) => [normalizeLookupKey(d.name), d.id] as const)),
    [departments]
  )
  const positionIdByName = useMemo(
    () => new Map(positions.filter((p: any) => p.name).map((p: any) => [normalizeLookupKey(p.name), p.id] as const)),
    [positions]
  )

  const activeEmployeePairs = useMemo(() => {
    const pairs = new Map<string, TargetPair>()
    activeEmployees.forEach((employee: any) => {
      const departmentName = normalizeLookupKey(employee.departmentName)
      const positionName = normalizeLookupKey(employee.positionName)
      if (!departmentName || !positionName) return
      const departmentId = departmentIdByName.get(departmentName)
      const positionId = positionIdByName.get(positionName)
      if (!departmentId || !positionId) return
      pairs.set(`${departmentId}-${positionId}`, {
        departmentId,
        departmentName: employee.departmentName,
        positionId,
        positionName: employee.positionName,
      })
    })
    return Array.from(pairs.values())
  }, [activeEmployees, departmentIdByName, positionIdByName])

  const reviewCycleSuffix = (status: string | undefined) => {
    const s = status?.toUpperCase() ?? ''
    if (s === 'ACTIVE') return 'Active'
    if (s === 'UPCOMING') return 'Upcoming'
    return s ? status : ''
  }

  const selectableReviewCycles = useMemo(() => {
    return reviewCycles
      .filter((c: any) => {
        const st = c.status?.toUpperCase()
        return st === 'ACTIVE' || st === 'UPCOMING'
      })
      .slice()
      .sort((a: any, b: any) => a.startDate.localeCompare(b.startDate))
  }, [reviewCycles])

  useEffect(() => {
    if (timelineMode === 'MANUAL') return
    if (selectedReviewCycleId != null || selectableReviewCycles.length === 0) return
    const activeFirst = selectableReviewCycles.find((c: any) => c.status?.toUpperCase() === 'ACTIVE') ?? selectableReviewCycles[0]
    if (activeFirst) setSelectedReviewCycleId(activeFirst.id)
  }, [selectableReviewCycles, selectedReviewCycleId, timelineMode])

  useEffect(() => {
    if (!selfAssessmentSettingsLoading && selfAssessmentSettings) {
      setRatingSystem(selfAssessmentSettings.ratingSystem)
      setTenPointYesMinRating(selfAssessmentSettings.tenPointYesMinRating)
    }
  }, [selfAssessmentSettings, selfAssessmentSettingsLoading])

  const employeeCountByDepartmentId = useMemo(() => {
    const counts = new Map<number, number>()
    departments.forEach((d: any) => counts.set(d.id, 0))
    activeEmployees.forEach((employee: any) => {
      const did = departmentIdByName.get(normalizeLookupKey(employee.departmentName))
      if (did) counts.set(did, (counts.get(did) ?? 0) + 1)
    })
    return counts
  }, [activeEmployees, departmentIdByName, departments])

  const positionAudienceStats = useMemo(() => {
    const map = new Map<number, { count: number; departments: Set<string> }>()
    positions.forEach((p: any) => map.set(p.id, { count: 0, departments: new Set<string>() }))
    activeEmployees.forEach((employee: any) => {
      const pid = positionIdByName.get(normalizeLookupKey(employee.positionName))
      if (!pid || !map.has(pid)) return
      const entry = map.get(pid)!
      entry.count += 1
      if (employee.departmentName) entry.departments.add(String(employee.departmentName))
    })
    const result = new Map<number, { count: number; departmentNames: string[] }>()
    map.forEach((entry, pid) => {
      result.set(pid, { count: entry.count, departmentNames: Array.from(entry.departments).sort() })
    })
    return result
  }, [activeEmployees, positionIdByName, positions])

  const filteredPositionsForAudience = useMemo(() => {
    const query = positionAudienceSearch.trim().toLowerCase()
    if (!query) return positions
    return positions.filter((p: any) => p.name.toLowerCase().includes(query))
  }, [positions, positionAudienceSearch])

  const hybridPairsDeduped = useMemo(() => {
    const merged: TargetPair[] = []
    const seen = new Set<string>()
    for (const rule of hybridRules) {
      if (!rule.departmentId) continue
      if (rule.positionId == null) {
        activeEmployeePairs.forEach((pair) => {
          if (pair.departmentId !== rule.departmentId) return
          const key = `${pair.departmentId}-${pair.positionId}`
          if (!seen.has(key)) { seen.add(key); merged.push(pair) }
        })
      } else {
        const pair = activeEmployeePairs.find((p) => p.departmentId === rule.departmentId && p.positionId === rule.positionId)
        if (pair) {
          const key = `${pair.departmentId}-${pair.positionId}`
          if (!seen.has(key)) { seen.add(key); merged.push(pair) }
        }
      }
    }
    return merged
  }, [hybridRules, activeEmployeePairs])

  const getTargetPairs = (): TargetPair[] => {
    if (audienceType === 'all') return activeEmployeePairs
    if (audienceType === 'departments') return activeEmployeePairs.filter((pair) => selectedDepartmentIds.includes(pair.departmentId))
    if (audienceType === 'positions') return activeEmployeePairs.filter((pair) => selectedGlobalPositionIds.includes(pair.positionId))
    return hybridPairsDeduped
  }

  const allCount = activeEmployees.length
  const selectedDepartmentEmployeeTotal = useMemo(
    () => selectedDepartmentIds.reduce((sum, id) => sum + (employeeCountByDepartmentId.get(id) ?? 0), 0),
    [selectedDepartmentIds, employeeCountByDepartmentId]
  )
  const selectedGlobalPositionEmployeeTotal = useMemo(
    () => selectedGlobalPositionIds.reduce((sum, id) => sum + (positionAudienceStats.get(id)?.count ?? 0), 0),
    [selectedGlobalPositionIds, positionAudienceStats]
  )

  const canSubmit = useMemo(() => {
    return (
      templateName.trim() !== '' &&
      editedRows.length > 0 &&
      validationResult != null &&
      (timelineMode === 'MANUAL' ? (manualStartDate && manualEndDate) : (selectedReviewCycleId != null))
    )
  }, [templateName, editedRows, validationResult, timelineMode, manualStartDate, manualEndDate, selectedReviewCycleId])

  const handleClose = useCallback(() => {
    setSelectedFile(null)
    setStep('upload')
    setValidationResult(null)
    setEditedRows([])
    setTemplateName('')
    setAudienceType('all')
    setSelectedDepartmentIds([])
    setSelectedGlobalPositionIds([])
    setHybridRules([{ id: createHybridRuleId(), departmentId: null, positionId: null }])
    setPositionAudienceSearch('')
    setTimelineMode('REVIEW_CYCLE')
    setSelectedReviewCycleId(null)
    setManualStartDate('')
    setManualEndDate('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }, [onClose])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    setValidationResult(null)
  }, [])

  const handleValidate = useCallback(async () => {
    if (!selectedFile) { toast.error('Please select a file first'); return }
    const formData = new FormData()
    formData.append('file', selectedFile)
    try {
      const res = await validateFile(formData).unwrap()
      if (res.success && res.data) {
        setValidationResult(res.data)
        setEditedRows(res.data.validRowData || [])
        setStep('review')
      } else {
        toast.error(res.message || 'Validation failed')
      }
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } }
      toast.error(e.data?.message || 'Validation failed')
    }
  }, [selectedFile, validateFile])

  const handleDownloadTemplate = useCallback(async () => {
    setTemplateLoading(true)
    try {
      await downloadBlob('/self-assessment-forms/templates/import/template', 'self_assessment_template_import_template.xlsx', token)
    } catch { toast.error('Failed to download template') }
    finally { setTemplateLoading(false) }
  }, [token])

  const handleRowEdit = useCallback((index: number, value: string) => {
    setEditedRows((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], questionText: value }
      return next
    })
  }, [])

  const handleRemoveRow = useCallback((index: number) => {
    setEditedRows((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleAddRow = useCallback(() => {
    setEditedRows((prev) => [...prev, { rowNumber: prev.length + 2, questionText: '' }])
  }, [])

  const toggleDepartment = (departmentId: number) => {
    setSelectedDepartmentIds((current) =>
      current.includes(departmentId) ? current.filter((id) => id !== departmentId) : [...current, departmentId]
    )
  }

  const toggleGlobalPosition = (positionId: number) => {
    setSelectedGlobalPositionIds((current) =>
      current.includes(positionId) ? current.filter((id) => id !== positionId) : [...current, positionId]
    )
  }

  const updateHybridRuleDepartment = (ruleId: string, departmentId: number | null) => {
    setHybridRules((rules) =>
      rules.map((rule) => rule.id === ruleId ? { ...rule, departmentId, positionId: null, departmentLabel: undefined, positionLabel: undefined } : rule)
    )
  }

  const updateHybridRulePosition = (ruleId: string, positionId: number | null) => {
    setHybridRules((rules) =>
      rules.map((rule) => rule.id === ruleId ? { ...rule, positionId, positionLabel: undefined } : rule)
    )
  }

  const addHybridRule = () => {
    setHybridRules((rules) => [...rules, { id: createHybridRuleId(), departmentId: null, positionId: null }])
  }

  const removeHybridRule = (ruleId: string) => {
    setHybridRules((rules) => {
      const next = rules.filter((rule) => rule.id !== ruleId)
      return next.length > 0 ? next : [{ id: createHybridRuleId(), departmentId: null, positionId: null }]
    })
  }

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (!isRecord(error)) return fallback
    const data = error.data
    if (isRecord(data) && typeof data.message === 'string') return data.message
    return fallback
  }

  const validateAudience = () => {
    if (audienceType === 'departments' && selectedDepartmentIds.length === 0) {
      toast.error('Please select at least one department'); return false
    }
    if (audienceType === 'positions' && selectedGlobalPositionIds.length === 0) {
      toast.error('Please select at least one position'); return false
    }
    if (audienceType === 'hybrid') {
      const hasCompleteRule = hybridRules.some((rule) => rule.departmentId != null)
      if (!hasCompleteRule) { toast.error('Please add at least one hybrid rule with a department'); return false }
    }
    return true
  }

  const handleSubmit = useCallback(async () => {
    if (!templateName.trim()) { toast.error('Please enter a template name'); return }
    if (editedRows.length === 0 || editedRows.every((r) => !r.questionText.trim())) {
      toast.error('Please add at least one valid question'); return
    }
    if (!validateAudience()) return
    if (timelineMode === 'REVIEW_CYCLE' && selectedReviewCycleId == null) {
      toast.error('Please select a review cycle'); return
    }
    if (timelineMode === 'MANUAL') {
      if (!manualStartDate || !manualEndDate) { toast.error('Please select manual start and end dates'); return }
      if (manualStartDate > manualEndDate) { toast.error('End date cannot be earlier than start date'); return }
    }

    const questions = editedRows
      .filter((r) => r.questionText.trim())
      .map((r, index) => ({ questionText: r.questionText.trim(), sortOrder: index }))

    const targetPairs = getTargetPairs()
    if (targetPairs.length === 0) { toast.error('No active employees match the selected audience'); return }

    const uniqueTargetPairs = Array.from(
      new Map(targetPairs.map((pair) => [`${pair.departmentId}-${pair.positionId}`, pair])).values()
    )

    try {
      if (timelineMode === 'REVIEW_CYCLE') {
        const conflicts = await checkActiveTemplateConflicts({
          reviewCycleId: selectedReviewCycleId as number,
          targets: uniqueTargetPairs.map((pair) => ({ departmentId: pair.departmentId, positionId: pair.positionId })),
        }).unwrap()
        if (conflicts.length > 0) {
          const conflictLabels = conflicts.slice(0, 5).map((c) => `${c.departmentName} / ${c.positionName}`).join(', ')
          const remaining = conflicts.length > 5 ? `, and ${conflicts.length - 5} more` : ''
          toast.error(`Active template already exists for: ${conflictLabels}${remaining}`)
          return
        }
      }

      let createdCount = 0
      const failures: string[] = []

      for (const pair of uniqueTargetPairs) {
        try {
          await createTemplate({
            title: templateName.trim(),
            departmentId: pair.departmentId,
            positionId: pair.positionId,
            questions,
            reviewCycleId: timelineMode === 'MANUAL' ? null : selectedReviewCycleId,
            timelineMode,
            manualStartDate: timelineMode === 'MANUAL' ? manualStartDate : null,
            manualEndDate: timelineMode === 'MANUAL' ? manualEndDate : null,
            ratingSystem: ratingSystem || undefined,
            tenPointYesMinRating: tenPointYesMinRating || undefined,
          }).unwrap()
          createdCount += 1
        } catch (error: unknown) {
          failures.push(`${pair.departmentName} / ${pair.positionName}: ${getErrorMessage(error, 'Failed to create template')}`)
        }
      }

      if (createdCount === 0) { toast.error(failures[0] || 'Failed to create template'); return }
      if (failures.length > 0) {
        toast.error(`${createdCount} template(s) created, ${failures.length} failed: ${failures.join('; ')}`)
      } else {
        toast.success(createdCount === 1 ? 'Template created successfully' : `${createdCount} templates created successfully`)
      }
      setStep('success')
      onImportSuccess()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to create template'))
    }
  }, [templateName, editedRows, audienceType, selectedDepartmentIds, selectedGlobalPositionIds, hybridRules, timelineMode, selectedReviewCycleId, manualStartDate, manualEndDate, ratingSystem, tenPointYesMinRating, createTemplate, checkActiveTemplateConflicts, onImportSuccess, activeEmployeePairs, hybridPairsDeduped])

  if (!isOpen) return null

  const resolveHybridPositions = (departmentId: number) => {
    return positions.filter((p: any) => {
      return activeEmployeePairs.some((pair) => pair.departmentId === departmentId && pair.positionId === p.id)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#eff6ff] to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] flex items-center justify-center shadow shadow-[#dbeafe]">
              <FileSpreadsheet className="text-white text-lg" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Import Self-Assessment Template from Excel</h2>
              <p className="text-xs text-gray-500">Upload a .xlsx file with question definitions</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-[#eff6ff] rounded-xl border border-[#bfdbfe]">
                <AlertCircle className="text-[#2463eb] flex-shrink-0" size={18} />
                <p className="text-sm text-[#1e40af] flex-1">
                  Download the template (Instructions, Sample Data, and Self Assessment Template sheets), fill in the Self Assessment Template sheet with your questions, then upload it here.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  disabled={templateLoading}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#bfdbfe] text-[#1d4ed8] rounded-lg hover:bg-[#eff6ff] disabled:opacity-60 transition shrink-0"
                >
                  {templateLoading ? (
                    <span className="inline-block w-3 h-3 border-2 border-[#60a5fa] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  Download Template
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Excel File (.xlsx)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#60a5fa] hover:bg-[#eff6ff]/30 transition group"
                >
                  <Upload className="mx-auto text-gray-300 group-hover:text-[#2463eb] transition" size={32} />
                  {selectedFile ? (
                    <p className="mt-2 text-sm font-medium text-gray-700">{selectedFile.name}</p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-400">Click to browse or drag a .xlsx file</p>
                  )}
                  <input ref={fileInputRef} type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" />
                </div>
              </div>
            </div>
          )}

          {step === 'review' && validationResult && (
            <div className="space-y-5">
              {/* Template Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Template Name *</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Q1 Self-Assessment 2026"
                  className={inputBase}
                />
              </div>

              {/* Timeline */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Timeline *</label>
                {reviewCyclesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-[#2463eb] rounded-full animate-spin" />
                    Loading review cycles...
                  </div>
                ) : (
                  <select
                    value={timelineMode === 'MANUAL' ? 'MANUAL' : selectedReviewCycleId ?? ''}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === 'MANUAL') { setTimelineMode('MANUAL'); setSelectedReviewCycleId(null) }
                      else { setTimelineMode('REVIEW_CYCLE'); setSelectedReviewCycleId(value ? Number(value) : null) }
                    }}
                    className={`${selectBase} max-w-xl`}
                  >
                    <option value="" disabled>Select a review cycle</option>
                    {selectableReviewCycles.map((cycle: any) => (
                      <option key={cycle.id} value={cycle.id}>
                        {cycle.name} ({cycle.yearLabel}) — {formatCycleDate(cycle.startDate)} – {formatCycleDate(cycle.endDate)}
                        {reviewCycleSuffix(cycle.status) ? ` · ${reviewCycleSuffix(cycle.status)}` : ''}
                      </option>
                    ))}
                    <option value="MANUAL">Manual Entry</option>
                  </select>
                )}
                {timelineMode === 'MANUAL' && (
                  <div className="mt-3 grid max-w-xl gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Start Date</span>
                      <input type="date" value={manualStartDate} onChange={(e) => setManualStartDate(e.target.value)} className={inputBase} />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">End Date</span>
                      <input type="date" value={manualEndDate} min={manualStartDate || undefined} onChange={(e) => setManualEndDate(e.target.value)} className={inputBase} />
                    </label>
                  </div>
                )}
              </div>

              {/* Rating */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Rating System</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl max-w-xs">
                    {(['FIVE_POINT', 'TEN_POINT'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRatingSystem(r)}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${ratingSystem === r ? 'bg-white text-[#2463eb] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {r === 'FIVE_POINT' ? '5-Point' : '10-Point'}
                      </button>
                    ))}
                  </div>
                </div>
                {ratingSystem === 'TEN_POINT' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Yes Min Rating (2-10)</label>
                    <input
                      type="number"
                      min={2}
                      max={10}
                      value={tenPointYesMinRating}
                      onChange={(e) => setTenPointYesMinRating(Math.min(10, Math.max(2, Number(e.target.value) || 5)))}
                      className={`${inputBase} max-w-[120px]`}
                    />
                  </div>
                )}
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Target Audience *</label>
                <div className="flex bg-slate-100 p-1 rounded-xl max-w-lg mb-4">
                  {(['all', 'departments', 'positions', 'hybrid'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setAudienceType(t)}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${audienceType === t ? 'bg-white text-[#2463eb] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {t === 'all' ? 'All' : t}
                    </button>
                  ))}
                </div>

                {audienceType === 'all' && (
                  <p className="text-sm text-slate-500">Targeting all active employees ({allCount} total)</p>
                )}

                {audienceType === 'departments' && (
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Building2 size={14} className="text-[#2463eb]" />
                      <h3 className="text-sm font-bold text-slate-800">Select Departments</h3>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <ul className="divide-y divide-slate-100 bg-white max-h-48 overflow-y-auto">
                        {departments.map((d: any) => {
                          const checked = selectedDepartmentIds.includes(d.id)
                          const empCount = employeeCountByDepartmentId.get(d.id) ?? 0
                          return (
                            <li key={d.id}>
                              <label className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-all ${checked ? 'bg-[#2463eb]/[0.04]' : 'hover:bg-slate-50'}`}>
                                <input type="checkbox" checked={checked} onChange={() => toggleDepartment(d.id)} className="sr-only peer" />
                                <div className="flex h-4 w-4 items-center justify-center rounded border-2 border-slate-300 transition-all peer-checked:border-[#2463eb] peer-checked:bg-[#2463eb]">
                                  {checked && <CheckCircle2 size={12} className="text-white" />}
                                </div>
                                <span className="flex-1 text-sm font-medium text-slate-800">{d.name}</span>
                                {empCount > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{formatEmployeeCount(empCount)}</span>}
                              </label>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#2463eb]">
                      <span>{selectedDepartmentIds.length} departments</span>
                      <span className="text-slate-300">|</span>
                      <span>{selectedDepartmentEmployeeTotal} employees</span>
                    </div>
                  </div>
                )}

                {audienceType === 'positions' && (
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <BriefcaseBusiness size={14} className="text-[#2463eb]" />
                      <h3 className="text-sm font-bold text-slate-800">Select Positions</h3>
                    </div>
                    <div className="relative mb-3">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input type="search" value={positionAudienceSearch} onChange={(e) => setPositionAudienceSearch(e.target.value)} placeholder="Search positions..." className={`${inputBase} pl-9`} />
                    </div>
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <ul className="divide-y divide-slate-100 bg-white max-h-48 overflow-y-auto">
                        {filteredPositionsForAudience.length === 0 ? (
                          <li className="px-4 py-8 text-center text-sm text-slate-500">No positions found</li>
                        ) : (
                          filteredPositionsForAudience.map((p: any) => {
                            const stats = positionAudienceStats.get(p.id)
                            const empCount = stats?.count ?? 0
                            const checked = selectedGlobalPositionIds.includes(p.id)
                            return (
                              <li key={p.id}>
                                <label className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-all ${checked ? 'bg-[#2463eb]/[0.04]' : 'hover:bg-slate-50'}`}>
                                  <input type="checkbox" checked={checked} onChange={() => toggleGlobalPosition(p.id)} className="sr-only peer" />
                                  <div className="flex h-4 w-4 items-center justify-center rounded border-2 border-slate-300 transition-all peer-checked:border-[#2463eb] peer-checked:bg-[#2463eb]">
                                    {checked && <CheckCircle2 size={12} className="text-white" />}
                                  </div>
                                  <span className="flex-1 text-sm font-medium text-slate-800">{p.name}</span>
                                  {empCount > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{formatEmployeeCount(empCount)}</span>}
                                </label>
                              </li>
                            )
                          })
                        )}
                      </ul>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#2463eb]">
                      <span>{selectedGlobalPositionIds.length} positions</span>
                      <span className="text-slate-300">|</span>
                      <span>{selectedGlobalPositionEmployeeTotal} employees</span>
                    </div>
                  </div>
                )}

                {audienceType === 'hybrid' && (
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Layers3 size={14} className="text-[#2463eb]" />
                      <h3 className="text-sm font-bold text-slate-800">Hybrid Rules</h3>
                    </div>
                    <div className="space-y-2.5">
                      {hybridRules.map((rule) => {
                        const rowPositions = rule.departmentId ? resolveHybridPositions(rule.departmentId) : []
                        return (
                          <div key={rule.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 border border-slate-200">
                            <div className="relative min-w-[140px] flex-1">
                              <select
                                value={rule.departmentId ?? ''}
                                onChange={(e) => updateHybridRuleDepartment(rule.id, e.target.value ? Number(e.target.value) : null)}
                                className={selectBase}
                              >
                                <option value="">Select department</option>
                                {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                              </select>
                            </div>
                            <div className="relative min-w-[140px] flex-1">
                              <select
                                value={rule.positionId ?? ''}
                                disabled={!rule.departmentId}
                                onChange={(e) => updateHybridRulePosition(rule.id, e.target.value ? Number(e.target.value) : null)}
                                className={selectBase}
                              >
                                <option value="">All Positions</option>
                                {rowPositions.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            </div>
                            <button
                              onClick={() => removeHybridRule(rule.id)}
                              disabled={hybridRules.length <= 1}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 transition"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                    <button onClick={addHybridRule} className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#2463eb] hover:bg-[#2463eb]/[0.06]">
                      <Plus size={15} /> Add Rule
                    </button>
                  </div>
                )}
              </div>

              {/* Validation summary */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-700">{validationResult.validRows} Valid</span>
                </div>
                {validationResult.invalidRows > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-500" />
                    <span className="text-xs font-bold text-red-700">{validationResult.invalidRows} Invalid</span>
                  </div>
                )}
                <div className="ml-auto text-xs font-bold text-slate-500">
                  {validationResult.totalRows} Total Rows
                </div>
              </div>

              {/* Invalid rows */}
              {validationResult.invalidRowsData && validationResult.invalidRowsData.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-red-700 uppercase tracking-widest">Invalid Rows</h4>
                  <div className="space-y-2">
                    {validationResult.invalidRowsData.map((row, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                        <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          {row.rowNumber > 0 && <p className="text-xs font-bold text-red-900">Row {row.rowNumber}</p>}
                          {row.questionText && <p className="text-xs text-red-800 mt-0.5 line-clamp-1">{row.questionText}</p>}
                          <ul className="mt-1 space-y-0.5">
                            {row.errors.map((err, eIdx) => (
                              <li key={eIdx} className="text-xs text-red-600">{err}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Valid rows table */}
              {editedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Questions ({editedRows.length})</h4>
                    <button
                      onClick={handleAddRow}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-[#bfdbfe] text-[#1d4ed8] rounded-lg hover:bg-[#eff6ff] transition"
                    >
                      <Plus size={14} /> Add Question
                    </button>
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                          <th className="py-3 px-4 w-12 text-center">#</th>
                          <th className="py-3 px-4">Question Text</th>
                          <th className="py-3 px-4 text-center w-16">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {editedRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                            <td className="py-2 px-4 text-center text-xs font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-4">
                              <input
                                type="text"
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#dbeafe]"
                                value={row.questionText}
                                maxLength={100}
                                onChange={(e) => handleRowEdit(idx, e.target.value)}
                              />
                            </td>
                            <td className="py-2 px-4 text-center">
                              <button
                                onClick={() => handleRemoveRow(idx)}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="text-emerald-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Templates Created Successfully!</h3>
              <p className="text-gray-500">Your self-assessment templates have been saved and are ready to use.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          {step === 'success' ? (
            <button onClick={handleClose} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition">Done</button>
          ) : (
            <>
              <button onClick={handleClose} disabled={isValidating || isCreating} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition">Cancel</button>
              {step === 'upload' && (
                <button
                  onClick={handleValidate}
                  disabled={!selectedFile || isValidating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] text-white text-sm font-semibold hover:from-[#1d4ed8] hover:to-[#1e40af] disabled:opacity-50 transition shadow-sm shadow-[#dbeafe]"
                >
                  {isValidating ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                  Validate & Review
                </button>
              )}
              {step === 'review' && (
                <>
                  <button
                    onClick={() => { setStep('upload'); setValidationResult(null); setEditedRows([]); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition"
                  >
                    <Download size={14} /> Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || isCreating}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    {isCreating ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Create Templates
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
