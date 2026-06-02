import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  AlertCircle,
  Building2,
  Briefcase,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  LayoutGrid,
  Network,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Table2,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserX,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import axios from '../../app/axiosInstance'
import { PaginationBar } from '../../components/common/PaginationBar'
import { CriteriaPage } from './CriteriaPage'
import { formatDateTime } from '../../utils/dateUtils'
import {
  type FeedbackCoverage,
  type FeedbackCoverageEmployeeRow,
  type FeedbackLimitConfig,
  type FeedbackTemplateConfig,
  type FeedbackTemplateImportValidRow,
  type FeedbackTemplateImportValidationResponse,
  useDeleteFeedbackTemplateMutation,
  useGetFeedbackCoverageQuery,
  useGetFeedbackLimitsQuery,
  useGetFeedbackTemplatesQuery,
  useSaveFeedbackLimitMutation,
  useSaveFeedbackTemplateMutation,
  useValidateFeedbackTemplateImportMutation,
} from '../../features/feedback/api/feedbackManagementApi'
import { useGetReviewCyclesQuery, type ReviewCycleDto } from '../../features/reviewCycle/api/reviewCycleApi'

type TabKey = 'criteria' | 'template' | 'progress' | 'coverage'
type Option = { id: number; name: string; active?: boolean }
type FeedbackTemplateRow = FeedbackTemplateConfig & { currentInUseFallback?: boolean }
const LOCK_MESSAGE = 'This configuration is already active for the current review cycle and cannot be changed. Any updates will apply only to future review cycles.'

const FEEDBACK_ROLE_OPTIONS = [
  { value: 'SELF', label: 'Self-evaluate' },
  { value: 'PEER', label: 'Peers' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'SUBORDINATE', label: 'Subordinate' },
] as const

const emptyTemplate: FeedbackTemplateConfig = {
  templateName: '',
  targetType: 'DEPARTMENT',
  targetId: 0,
  targetName: '',
  questionIds: [],
  status: 'ACTIVE',
  maxRating: 5,
  activeRoles: ['SELF', 'PEER', 'MANAGER', 'SUBORDINATE'],
  questionsByRole: {},
}

const emptyLimit: FeedbackLimitConfig = {
  relationshipType: 'MANAGER',
  minimumCount: 1,
  maximumCount: 2,
}

const targetLabel = (type: string) => {
  if (type === 'DEPARTMENT') return 'Department-based template'
  if (type === 'LEVEL_CODE') return 'Level code-based template'
  if (type === 'PERSON') return 'Person-based template'
  if (type === 'POSITION') return 'Position-based template'
  if (type === 'HYBRID') return 'Hybrid (Department + Position) template'
  return 'Template'
}

const displayType = (value: string) => value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
const isLockedCycle = (cycle?: ReviewCycleDto | null) => Boolean(cycle && (cycle.isActive || cycle.status?.toUpperCase() === 'ACTIVE'))
const cycleDate = (value?: string) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-GB') : '-'
const cycleDateRange = (cycle?: ReviewCycleDto | null) => `${cycleDate(cycle?.startDate)} - ${cycleDate(cycle?.endDate)}`
const isCurrentCycle = (cycle?: ReviewCycleDto | null) => Boolean(cycle && (cycle.isActive || cycle.status?.toUpperCase() === 'ACTIVE'))
const cycleSearchText = (cycle: ReviewCycleDto) =>
  `${cycle.cycleType ?? ''} ${cycle.name ?? ''} ${cycle.code ?? ''}`.toUpperCase()
const isQ2Cycle = (cycle: ReviewCycleDto) => /\bQ2\b/.test(cycleSearchText(cycle))

function pickDefaultCoverageReviewCycle(cycles: ReviewCycleDto[]): ReviewCycleDto | undefined {
  if (cycles.length === 0) return undefined
  const q2Cycles = cycles.filter(isQ2Cycle)
  if (q2Cycles.length > 0) {
    const activeQ2 = q2Cycles.find((cycle) => cycle.isActive || cycle.status?.toUpperCase() === 'ACTIVE')
    if (activeQ2) return activeQ2
    const upcomingQ2 = q2Cycles.find((cycle) => cycle.status?.toUpperCase() === 'UPCOMING')
    if (upcomingQ2) return upcomingQ2
    return [...q2Cycles].sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
  }
  return cycles.find((cycle) => cycle.isActive || cycle.status?.toUpperCase() === 'ACTIVE') ?? cycles[0]
}

function CurrentInUseBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
      Current in use
    </span>
  )
}

export default function FeedbackManagementPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('criteria')

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Feedback Management</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage feedback criteria, templates, and peer progress limits.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {[
          ['criteria', 'Criteria', ClipboardList],
          ['template', 'Template', FileText],
          ['progress', 'Peer Progress', Users],
          ['coverage', 'Coverage', CheckCircle2],
        ].map(([key, label, Icon]) => {
          const selected = activeTab === key
          const TabIcon = Icon as typeof ClipboardList
          return (
            <button
              key={key as string}
              type="button"
              onClick={() => setActiveTab(key as TabKey)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${selected ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <TabIcon size={16} />
              {label as string}
            </button>
          )
        })}
      </div>

      {activeTab === 'criteria' && <CriteriaPage />}
      {activeTab === 'template' && <TemplateTab />}
      {activeTab === 'progress' && <PeerProgressTab />}
      {activeTab === 'coverage' && <CoverageTab />}
    </div>
  )
}

function ReviewCycleSelector({
  reviewCycles,
  selectedReviewCycleId,
  onChange,
  locked,
}: {
  reviewCycles: ReviewCycleDto[]
  selectedReviewCycleId: number | null
  onChange: (id: number | null) => void
  locked: boolean
}) {
  const selected = reviewCycles.find((cycle) => cycle.id === selectedReviewCycleId)
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Review Cycle</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Select the cycle this configuration belongs to. Active cycles are view-only.
          </p>
        </div>
        <select
          value={selectedReviewCycleId ?? ''}
          onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
          title={selected ? `${selected.name} (${cycleDateRange(selected)}) - ${isCurrentCycle(selected) ? 'Active - Current in use' : selected.status}` : 'Select review cycle'}
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 xl:min-w-[46rem]"
        >
          <option value="">Select review cycle...</option>
          {reviewCycles.map((cycle) => (
            <option key={cycle.id} value={cycle.id}>
              {cycle.name} ({cycleDate(cycle.startDate)} - {cycleDate(cycle.endDate)}) - {isCurrentCycle(cycle) ? 'Active - Current in use' : cycle.status}
            </option>
          ))}
        </select>
      </div>
      {selected && (
        <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${locked ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-slate-700">
            <span className="font-black">{selected.name}</span>
            <span className="text-xs font-bold text-slate-500">{cycleDateRange(selected)}</span>
          </div>
          {locked ? (
            <div className="flex flex-wrap items-center gap-2">
              <CurrentInUseBadge />
              <span>{LOCK_MESSAGE}</span>
            </div>
          ) : `Changes will be saved for ${selected.name} only.`}
        </div>
      )}
    </div>
  )
}

function TemplateTab() {
  const { data: reviewCycles = [] } = useGetReviewCyclesQuery({ requiresEmployeeSubmission: true })
  const [selectedReviewCycleId, setSelectedReviewCycleId] = useState<number | null>(null)
  const selectedReviewCycle = reviewCycles.find((cycle) => cycle.id === selectedReviewCycleId) ?? null
  const isLocked = isLockedCycle(selectedReviewCycle)
  const { data: templates = [], isLoading } = useGetFeedbackTemplatesQuery(selectedReviewCycleId ?? undefined, { skip: !selectedReviewCycleId })
  const { data: limits = [] } = useGetFeedbackLimitsQuery(selectedReviewCycleId ?? undefined, { skip: !selectedReviewCycleId })
  const [saveTemplate, { isLoading: isSaving }] = useSaveFeedbackTemplateMutation()
  const [deleteTemplate] = useDeleteFeedbackTemplateMutation()
  const [criteria, setCriteria] = useState<Option[]>([])
  const [departments, setDepartments] = useState<Option[]>([])
  const [levelCodes, setLevelCodes] = useState<Option[]>([])
  const [employees, setEmployees] = useState<Option[]>([])
  const [positions, setPositions] = useState<Option[]>([])
  const [showModal, setShowModal] = useState(false)
  const [viewing, setViewing] = useState<FeedbackTemplateRow | null>(null)
  const [form, setForm] = useState<FeedbackTemplateConfig>(emptyTemplate)
  const [searchQuery, setSearchQuery] = useState('')
  const [targetFilter, setTargetFilter] = useState<'ALL' | FeedbackTemplateConfig['targetType']>('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importedRows, setImportedRows] = useState<FeedbackTemplateImportValidRow[]>([])
  const [importErrors, setImportErrors] = useState<FeedbackTemplateImportValidationResponse | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [validateImport, { isLoading: isValidating }] = useValidateFeedbackTemplateImportMutation()

  useEffect(() => {
    void loadOptions()
  }, [])

  useEffect(() => {
    if (selectedReviewCycleId != null || reviewCycles.length === 0) return
    const activeFirst = reviewCycles.find((cycle) => cycle.isActive || cycle.status?.toUpperCase() === 'ACTIVE') ?? reviewCycles[0]
    setSelectedReviewCycleId(activeFirst.id)
  }, [reviewCycles, selectedReviewCycleId])

  const loadOptions = async () => {
    try {
      const [criteriaRes, deptRes, levelCodeRes, empRes, positionRes] = await Promise.all([
        axios.get('/criteria'),
        axios.get('/departments'),
        axios.get('/lookups/level-codes/active'),
        axios.get('/hr/employees', { params: { size: 1000 } }),
        axios.get('/positions/by-department'),
      ])
      setCriteria((criteriaRes.data?.data ?? []).map((c: any) => ({ id: Number(c.id), name: c.name, active: c.active !== false })))
      setDepartments((deptRes.data?.data ?? []).map((d: any) => ({ id: Number(d.departmentId ?? d.id), name: d.departmentName ?? d.name })))
      setLevelCodes((levelCodeRes.data?.data ?? []).map((levelCode: any) => ({ id: Number(levelCode.id), name: levelCode.code ?? levelCode.name })))
      const employeeRows = empRes.data?.data?.content ?? empRes.data?.data ?? []
      setEmployees(employeeRows.map((e: any) => ({ id: Number(e.employeeId ?? e.id), name: e.employeeName ?? e.name ?? e.email })))
      setPositions((positionRes.data?.data ?? []).map((p: any) => ({ id: Number(p.positionId ?? p.id), name: p.positionName ?? p.name })))
    } catch (error) {
      console.error(error)
      toast.error('Failed to load template options')
    }
  }

  const targetOptions = form.targetType === 'DEPARTMENT' ? departments : form.targetType === 'LEVEL_CODE' ? levelCodes : form.targetType === 'POSITION' ? positions : employees
  const activeCriteria = useMemo(() => criteria.filter((item) => item.active !== false), [criteria])
  const criteriaNameById = useMemo(() => new Map(criteria.map((item) => [item.id, item.name])), [criteria])
  const activeLimitTypes = new Set(limits.map((limit) => limit.relationshipType))
  const selectedCycleIsCurrent = isCurrentCycle(selectedReviewCycle)
  const hasActiveConfiguredTemplate = templates.some((template) => template.status === 'ACTIVE')
  const currentInUseFallbackTemplate = useMemo<FeedbackTemplateRow | null>(() => {
    if (!selectedCycleIsCurrent || hasActiveConfiguredTemplate || activeCriteria.length === 0) return null
    return {
      templateName: 'Current Feedback Template',
      targetType: 'PERSON',
      targetId: 0,
      targetName: 'All active feedback recipients',
      reviewCycleId: selectedReviewCycleId ?? undefined,
      reviewCycleName: selectedReviewCycle?.name,
      questionIds: activeCriteria.map((item) => item.id),
      status: 'ACTIVE',
      currentInUseFallback: true,
    }
  }, [activeCriteria, hasActiveConfiguredTemplate, selectedCycleIsCurrent, selectedReviewCycle?.name, selectedReviewCycleId])
  const templateRows = useMemo<FeedbackTemplateRow[]>(
    () => currentInUseFallbackTemplate ? [currentInUseFallbackTemplate, ...templates] : templates,
    [currentInUseFallbackTemplate, templates]
  )
  const selectedCycleRange = cycleDateRange(selectedReviewCycle)
  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return templateRows.filter((template) => {
      const matchesTarget = targetFilter === 'ALL' || template.targetType === targetFilter
      const assignedCriteria = (template.questionIds ?? [])
        .map((id) => criteriaNameById.get(id) ?? `criteria ${id}`)
        .join(' ')
      const searchableText = [
        template.templateName,
        template.targetName,
        template.reviewCycleName,
        selectedReviewCycle?.name,
        selectedCycleRange,
        template.status,
        targetLabel(template.targetType),
        assignedCriteria,
        template.currentInUseFallback ? 'current in use live feedback active system default' : '',
      ].filter(Boolean).join(' ').toLowerCase()
      const matchesSearch = !query
        || searchableText.includes(query)
      return matchesTarget && matchesSearch
    })
  }, [criteriaNameById, searchQuery, selectedCycleRange, selectedReviewCycle?.name, targetFilter, templateRows])
  const activeTemplates = templateRows.filter((template) => template.status === 'ACTIVE').length
  const assignedQuestions = new Set(templateRows.flatMap((template) => template.questionIds ?? [])).size
  const isTemplateCurrentInUse = (template: FeedbackTemplateRow) => selectedCycleIsCurrent && template.status === 'ACTIVE'

  const openCreate = () => {
    if (!selectedReviewCycleId) return toast.error('Please select a review cycle')
    if (isLocked) return toast.error(LOCK_MESSAGE)
    setForm({ ...emptyTemplate, reviewCycleId: selectedReviewCycleId, reviewCycleName: selectedReviewCycle?.name })
    setShowModal(true)
  }

  const openEdit = (template: FeedbackTemplateConfig) => {
    if (isLocked) return toast.error(LOCK_MESSAGE)
    setForm({
      ...template,
      questionIds: template.questionIds ?? [],
      activeRoles: template.activeRoles ?? ['SELF', 'PEER', 'MANAGER', 'SUBORDINATE'],
      questionsByRole: template.questionsByRole ?? {},
    })
    setShowModal(true)
  }

  const openDuplicate = (template: FeedbackTemplateRow) => {
    if (isLocked) return toast.error(LOCK_MESSAGE)
    if (template.currentInUseFallback) return toast.error('Current in-use templates are read-only. Duplicate from a future-cycle template.')
    if (!selectedReviewCycleId) return toast.error('Please select a review cycle')
    setForm({
      ...template,
      id: undefined,
      templateName: `Copy of ${template.templateName}`,
      reviewCycleId: selectedReviewCycleId,
      reviewCycleName: selectedReviewCycle?.name,
      questionIds: template.questionIds ?? [],
      activeRoles: template.activeRoles ?? ['SELF', 'PEER', 'MANAGER', 'SUBORDINATE'],
      questionsByRole: template.questionsByRole ?? {},
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!selectedReviewCycleId) return toast.error('Review cycle is required')
    if (isLocked) return toast.error(LOCK_MESSAGE)
    if (!form.templateName.trim()) return toast.error('Template name is required')
    if (form.targetType === 'HYBRID') {
      if (!form.audienceRules || form.audienceRules.length === 0) return toast.error('At least one audience rule is required')
      const invalidRule = form.audienceRules.find((rule) => !rule.departmentId)
      if (invalidRule) return toast.error('Each rule must have a department selected')
    } else {
      if (!form.targetId) return toast.error('Template target is required')
    }
    const activeRoles = form.activeRoles ?? []
    if (activeRoles.length === 0) return toast.error('At least one feedback role must be selected')
    if (importedRows.length === 0) {
      for (const role of activeRoles) {
        const roleQuestions = form.questionsByRole?.[role] ?? []
        if (roleQuestions.length === 0) return toast.error(`At least one question is required for ${FEEDBACK_ROLE_OPTIONS.find(r => r.value === role)?.label ?? role}`)
      }
    }
    let targetName = form.targetName ?? ''
    let targetId = Number(form.targetId)
    if (form.targetType === 'POSITION') {
      targetName = targetOptions.find((item) => item.id === targetId)?.name ?? targetName
    } else if (form.targetType === 'HYBRID') {
      targetId = 0
      const deptMap = new Map(departments.map((d) => [d.id, d.name]))
      const posMap = new Map(positions.map((p) => [p.id, p.name]))
      targetName = (form.audienceRules ?? []).map((rule) => {
        const deptName = deptMap.get(rule.departmentId) ?? rule.departmentName ?? `Dept ${rule.departmentId}`
        const posName = rule.positionId ? (posMap.get(rule.positionId) ?? rule.positionName ?? `Pos ${rule.positionId}`) : 'All Positions'
        return `${deptName} / ${posName}`
      }).join('; ')
    } else {
      targetName = targetOptions.find((item) => item.id === targetId)?.name ?? targetName
    }
    try {
      if (importedRows.length > 0) {
        const ids = await resolveCriteriaIds()
        const questionsByRole: Record<string, number[]> = {}
        for (const role of activeRoles) {
          questionsByRole[role] = [...ids]
        }
        await saveTemplate({
          ...form,
          reviewCycleId: selectedReviewCycleId,
          reviewCycleName: selectedReviewCycle?.name,
          targetId,
          targetName,
          activeRoles,
          questionsByRole,
          questionIds: ids,
        }).unwrap()
        setImportedRows([])
        setImportErrors(null)
      } else {
        await saveTemplate({ ...form, reviewCycleId: selectedReviewCycleId, reviewCycleName: selectedReviewCycle?.name, targetId, targetName, activeRoles, questionsByRole: form.questionsByRole }).unwrap()
      }
      toast.success(form.id ? 'Template updated' : 'Template created')
      setShowModal(false)
    } catch (error: any) {
      toast.error(error?.data?.message ?? 'Failed to save template')
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get('/feedback-management/templates/import/template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = '360_feedback_template_import_template.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Failed to download template')
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    setImportErrors(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await validateImport(formData).unwrap()
      if (!res.success) {
        toast.error(res.message || 'Validation failed')
        return
      }
      if (!res.data) {
        toast.error('No validation data received')
        return
      }
      if (res.data.invalidRows > 0) {
        setImportErrors(res.data)
      }
      if (res.data.validRows > 0) {
        setImportedRows(res.data.validRowData)
        const importedCriteriaIds: number[] = res.data.validRowData
          .filter((r) => r.existingCriteriaId != null)
          .map((r) => r.existingCriteriaId!)
        if (importedCriteriaIds.length > 0) {
          setCriteria((prev) => {
            const existingIds = new Set(prev.map((c) => c.id))
            const newItems = res.data.validRowData
              .filter((r) => r.existingCriteriaId != null && !existingIds.has(r.existingCriteriaId!))
              .map((r) => ({ id: r.existingCriteriaId!, name: r.criteriaName, active: true }))
            return newItems.length > 0 ? [...prev, ...newItems] : prev
          })
        }
        const defaultRoles = ['SELF', 'PEER', 'MANAGER', 'SUBORDINATE']
        setForm({
          ...emptyTemplate,
          reviewCycleId: selectedReviewCycleId ?? undefined,
          reviewCycleName: selectedReviewCycle?.name,
          activeRoles: defaultRoles,
          questionsByRole: {},
          questionIds: [],
        })
        setShowModal(true)
      }
      if (res.data.validRows === 0 && res.data.invalidRows > 0) {
        toast.error('No valid rows found. Check the error details below.')
      }
    } catch (error: any) {
      toast.error(error?.data?.message ?? 'Failed to validate import')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id?: number) => {
    if (!id) return
    if (isLocked) return toast.error(LOCK_MESSAGE)
    if (!window.confirm('Delete this feedback template?')) return
    await deleteTemplate(id).unwrap()
    toast.success('Template deleted')
  }

  const resolveCriteriaIds = async (): Promise<number[]> => {
    if (importedRows.length === 0) return form.questionIds ?? []
    const ids: number[] = []
    for (const row of importedRows) {
      if (row.existingCriteriaId != null) {
        ids.push(row.existingCriteriaId)
      } else if (row.criteriaName.trim()) {
        try {
          const response = await axios.post('/criteria', { name: row.criteriaName.trim(), description: row.description ?? '', active: true })
          const newId = Number(response.data?.data?.id)
          if (newId) ids.push(newId)
        } catch {
          toast.error(`Failed to create criteria: ${row.criteriaName}`)
        }
      }
    }
    return ids
  }

  return (
    <section className="space-y-6">
      <ReviewCycleSelector
        reviewCycles={reviewCycles}
        selectedReviewCycleId={selectedReviewCycleId}
        onChange={setSelectedReviewCycleId}
        locked={isLocked}
      />
      <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] text-white shadow-lg shadow-[#2463eb]/20">
            <ClipboardList size={22} />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-white">{templateRows.length}</span>
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Feedback Templates</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-500">Create, configure, and manage feedback question templates across departments, level codes, and individual employees.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".xlsx" onChange={handleFileSelect} className="hidden" />
          <button onClick={handleDownloadTemplate} disabled={!selectedReviewCycleId} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            <Download size={16} /> Download Template
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={!selectedReviewCycleId || isLocked || isValidating || isImporting} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            {isValidating || isImporting ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" /> : <Upload size={16} />}
            {isValidating ? 'Validating...' : isImporting ? 'Importing...' : 'Import Template'}
          </button>
          <button onClick={openCreate} disabled={!selectedReviewCycleId || isLocked} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#2463eb]/20 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
            <Plus size={16} /> Create Template
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Total Templates', templateRows.length, FileText, 'bg-blue-50 text-blue-600'],
          ['Active Templates', activeTemplates, CheckCircle2, 'bg-emerald-50 text-emerald-600'],
          ['Assigned Criteria', assignedQuestions, ClipboardList, 'bg-violet-50 text-violet-600'],
          ['Available Criteria', criteria.length, Filter, 'bg-amber-50 text-amber-600'],
        ].map(([label, value, Icon, tone]) => {
          const StatIcon = Icon as typeof FileText
          return (
            <div key={label as string} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label as string}</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{value as number}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone as string}`}>
                  <StatIcon size={18} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">Templates</h3>
            <p className="text-xs text-slate-500">{filteredTemplates.length} of {templateRows.length} template{templateRows.length === 1 ? '' : 's'}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search template or target..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm focus:border-[#2463eb] focus:outline-none sm:w-72"
              />
            </div>
            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value as typeof targetFilter)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 focus:border-[#2463eb] focus:outline-none"
            >
              <option value="ALL">All targets</option>
              <option value="DEPARTMENT">Department</option>
              <option value="LEVEL_CODE">Level Code</option>
              <option value="PERSON">Person</option>
              <option value="POSITION">Position</option>
              <option value="HYBRID">Hybrid</option>
            </select>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${viewMode === 'table' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                title="Table view"
              >
                <Table2 size={15} />
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${viewMode === 'grid' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                title="Grid view"
              >
                <LayoutGrid size={15} />
                Grid
              </button>
            </div>
          </div>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center">
              <p className="font-bold text-slate-700">No feedback templates found</p>
              <p className="mt-1 text-sm text-slate-500">Create a template to assign feedback questions.</p>
              <button onClick={openCreate} disabled={!selectedReviewCycleId || isLocked} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                <Plus size={16} /> Create Template
              </button>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="w-full overflow-hidden">
                <table className="w-full table-fixed text-left">
                  <colgroup>
                    <col className="w-[38%]" />
                    <col className="hidden w-[13%] xl:table-column" />
                    <col className="hidden w-[14%] 2xl:table-column" />
                    <col className="hidden w-[17%] lg:table-column" />
                    <col className="w-[68px]" />
                    <col className="w-[84px]" />
                    <col className="hidden w-[110px] xl:table-column" />
                    <col className="w-[86px]" />
                  </colgroup>
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-3 py-4 sm:px-4">Template</th>
                      <th className="hidden px-3 py-4 xl:table-cell">Target Type</th>
                      <th className="hidden px-3 py-4 2xl:table-cell">Assigned To</th>
                      <th className="hidden px-3 py-4 lg:table-cell">Cycle</th>
                      <th className="px-2 py-4 text-center">Criteria</th>
                      <th className="px-2 py-4">Status</th>
                      <th className="hidden px-3 py-4 xl:table-cell">Updated</th>
                      <th className="px-2 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredTemplates.map((template) => (
                      <tr key={template.id ?? 'current-in-use-template'} className={`transition hover:bg-slate-50 ${template.currentInUseFallback ? 'bg-emerald-50/40' : ''}`}>
                        <td className="min-w-0 px-3 py-4 sm:px-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="max-w-[260px] truncate font-black text-slate-900">{template.templateName}</p>
                                {isTemplateCurrentInUse(template) && <CurrentInUseBadge />}
                              </div>
                              <p className="mt-1 truncate text-[11px] font-semibold text-slate-400">{template.reviewCycleName ?? selectedReviewCycle?.name ?? 'Review cycle'}</p>
                              <p className="mt-1 truncate text-[11px] font-semibold text-slate-400 lg:hidden">{selectedCycleRange}</p>
                            </div>
                          </div>
                          {template.currentInUseFallback && (
                            <p className="mt-1 line-clamp-2 max-w-sm text-xs font-medium text-emerald-700">
                              Built from the active feedback criteria used by the live feedback form.
                            </p>
                          )}
                        </td>
                        <td className="hidden px-3 py-4 text-sm font-semibold text-slate-600 xl:table-cell">
                          <span className="inline-flex items-center gap-1.5">
                            {template.targetType === 'DEPARTMENT' && <Building2 size={12} className="text-slate-400" />}
                            {template.currentInUseFallback ? 'Live feedback criteria set' : targetLabel(template.targetType)}
                          </span>
                        </td>
                        <td className="hidden truncate px-3 py-4 text-sm text-slate-500 2xl:table-cell">{template.targetName || 'No target name'}</td>
                        <td className="hidden px-3 py-4 text-sm font-semibold text-slate-600 lg:table-cell">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarRange size={12} className="text-slate-400" />
                            {selectedCycleRange}
                          </span>
                        </td>
                        <td className="px-2 py-4 text-center">
                          <span className="inline-flex min-w-10 justify-center rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                            {template.questionIds.length}
                          </span>
                        </td>
                        <td className="px-2 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${template.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {template.status === 'ACTIVE' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                            {template.status}
                          </span>
                        </td>
                        <td className="hidden px-3 py-4 text-sm font-semibold text-slate-600 xl:table-cell">
                          {template.currentInUseFallback ? 'System default' : formatDateTime(template.updatedDate ?? template.createdDate)}
                        </td>
                        <td className="px-2 py-4">
                          <div className="mx-auto flex max-w-[62px] flex-wrap justify-center gap-1">
                            {!isLocked && !template.currentInUseFallback && <button onClick={() => openDuplicate(template)} className="rounded-lg p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600" title="Duplicate"><Copy size={15} /></button>}
                            <button onClick={() => setViewing(template)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="View"><Eye size={15} /></button>
                            {!isLocked && !template.currentInUseFallback && <button onClick={() => openEdit(template)} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600" title="Edit"><Pencil size={15} /></button>}
                            {!isLocked && !template.currentInUseFallback && <button onClick={() => void handleDelete(template.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 size={15} /></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredTemplates.map((template, index) => (
                <div
                  key={template.id ?? 'current-in-use-template'}
                  className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${template.currentInUseFallback ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white ring-1 ring-emerald-100' : 'border-slate-200/70 bg-white'}`}
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-blue-500/[0.03] blur-2xl transition duration-500 group-hover:scale-150 group-hover:bg-blue-500/[0.06]" />
                  <div className="relative">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-black text-slate-900">{template.templateName}</h4>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${template.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {template.status === 'ACTIVE' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                              {template.status}
                            </span>
                            {isTemplateCurrentInUse(template) && <CurrentInUseBadge />}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setViewing(template)} className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Eye size={16} /></button>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users size={12} className="shrink-0 text-slate-400" />
                        <span className="truncate font-medium">
                          {template.currentInUseFallback ? 'Live feedback criteria set' : targetLabel(template.targetType)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Building2 size={12} className="shrink-0 text-slate-400" />
                        <span className="truncate">{template.targetName || 'No target name'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <CalendarRange size={12} className="shrink-0 text-slate-400" />
                        <span className="truncate">{selectedReviewCycle?.name ?? template.reviewCycleName ?? 'Review cycle'} - {selectedCycleRange}</span>
                      </div>
                    </div>

                    {template.currentInUseFallback && (
                      <p className="mt-3 rounded-xl border border-emerald-100 bg-white/70 px-3 py-2 text-xs font-medium leading-relaxed text-emerald-700">
                        This is the current template employees and reviewers use when no saved active-cycle template has been configured.
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100/80 px-2 py-1 text-[10px] font-bold text-slate-600">
                        <ClipboardList size={9} />
                        {template.questionIds.length} criteria
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                        {template.currentInUseFallback ? 'Live feedback criteria set' : targetLabel(template.targetType)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                      {!isLocked && !template.currentInUseFallback && (
                        <button onClick={() => openDuplicate(template)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50">
                          <Copy size={14} />
                          Duplicate Template
                        </button>
                      )}
                      <button onClick={() => setViewing(template)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50">
                        <Eye size={14} />
                        View Template
                      </button>
                      {!isLocked && !template.currentInUseFallback && (
                        <button onClick={() => openEdit(template)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100">
                          <Pencil size={14} />
                          Edit Template
                        </button>
                      )}
                      {!isLocked && !template.currentInUseFallback && (
                        <button onClick={() => void handleDelete(template.id)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50">
                          <Trash2 size={14} />
                          Delete Template
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeLimitTypes.size > 0 && (
        <p className="border-t border-slate-100 px-6 py-3 text-xs text-slate-500">Configured peer progress relationships: {Array.from(activeLimitTypes).map(displayType).join(', ')}</p>
      )}

      {showModal && (
        <TemplateModal
          form={form}
          setForm={setForm}
          targetOptions={targetOptions}
          criteria={criteria}
          isSaving={isSaving}
          reviewCycleName={selectedReviewCycle?.name ?? null}
          reviewCycleDetail={selectedCycleRange}
          onClose={() => { setShowModal(false); setImportedRows([]); setImportErrors(null) }}
          onSave={handleSave}
          departments={departments}
          positions={positions}
          importedRows={importedRows}
          setImportedRows={setImportedRows}
          importErrors={importErrors}
        />
      )}
      {viewing && (
        <TemplateModal
          form={viewing}
          setForm={(next) => setViewing({ ...next, currentInUseFallback: viewing.currentInUseFallback })}
          targetOptions={targetOptions}
          criteria={criteria}
          isSaving={false}
          reviewCycleName={selectedReviewCycle?.name ?? viewing.reviewCycleName ?? null}
          reviewCycleDetail={selectedCycleRange}
          onClose={() => setViewing(null)}
          onSave={() => undefined}
          readOnly
          modalTitle="View Feedback Template"
          departments={departments}
          positions={positions}
          readOnlyMessage={
            viewing.currentInUseFallback
              ? 'This is the current feedback template generated from active criteria and cannot be edited.'
              : selectedCycleIsCurrent
                ? 'Current-cycle feedback templates are view-only. Edit feedback templates only from future review cycles.'
                : 'This is a read-only preview. Use Edit Template to change future-cycle feedback templates.'
          }
        />
      )}
    </section>
  )
}

type FeedbackTargetType = FeedbackTemplateConfig['targetType']

const FEEDBACK_TARGET_TYPE_OPTIONS: {
  value: FeedbackTargetType
  label: string
  description: string
  icon: LucideIcon
}[] = [
  { value: 'DEPARTMENT', label: 'Department', description: 'Assign to all employees in a department.', icon: Building2 },
  { value: 'LEVEL_CODE', label: 'Level Code', description: 'Assign by organization level code.', icon: Layers },
  { value: 'PERSON', label: 'Person', description: 'Assign to one employee.', icon: User },
  { value: 'POSITION', label: 'Position', description: 'Assign by job position.', icon: Briefcase },
  { value: 'HYBRID', label: 'Hybrid', description: 'Department + optional position per rule.', icon: Network },
]

function FeedbackTargetTypeCard({
  label,
  description,
  icon: Icon,
  selected,
  readOnly,
  onClick,
}: {
  label: string
  description: string
  icon: LucideIcon
  selected: boolean
  readOnly: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (!readOnly) onClick()
      }}
      aria-pressed={selected}
      className={`group relative flex h-full min-h-[148px] flex-col rounded-2xl border p-4 text-left transition-all duration-200 ${
        readOnly ? 'cursor-default' : 'cursor-pointer'
      } ${
        selected
          ? 'border-[#2463eb]/50 bg-[#2463eb]/[0.05] shadow-md shadow-[#2463eb]/10 ring-1 ring-[#2463eb]/25'
          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-sm'
      } ${readOnly && !selected ? 'opacity-55' : ''}`}
    >
      {selected && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#2463eb]/[0.04] to-[#1d4ed8]/[0.02]" />
      )}
      <div className="relative flex flex-1 flex-col">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
              selected
                ? 'bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] text-white shadow-lg shadow-[#2463eb]/25'
                : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/90 group-hover:scale-105'
            }`}
          >
            <Icon size={18} strokeWidth={2.25} />
          </div>
          {selected && (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] shadow-sm">
              <CheckCircle2 size={14} className="text-white" strokeWidth={2.75} />
            </div>
          )}
        </div>
        <h5
          className={`text-sm font-bold leading-snug ${
            selected ? 'text-[#1d4ed8]' : 'text-slate-900'
          }`}
        >
          {label}
        </h5>
        <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
    </button>
  )
}

function TemplateModal({
  form,
  setForm,
  targetOptions,
  criteria,
  isSaving,
  reviewCycleName,
  reviewCycleDetail,
  onClose,
  onSave,
  readOnly = false,
  modalTitle,
  readOnlyMessage,
  departments,
  positions,
  importedRows,
  setImportedRows,
  importErrors,
}: {
  form: FeedbackTemplateConfig
  setForm: (form: FeedbackTemplateConfig) => void
  targetOptions: Option[]
  criteria: Option[]
  isSaving: boolean
  reviewCycleName: string | null
  reviewCycleDetail: string
  onClose: () => void
  onSave: () => void
  readOnly?: boolean
  modalTitle?: string
  readOnlyMessage?: string
  departments: Option[]
  positions: Option[]
  importedRows?: FeedbackTemplateImportValidRow[]
  setImportedRows?: (rows: FeedbackTemplateImportValidRow[]) => void
  importErrors?: FeedbackTemplateImportValidationResponse | null
}) {
  const selectedTarget = targetOptions.find((item) => item.id === Number(form.targetId))
  const selectedQuestions = criteria.filter((item) => form.questionIds.includes(item.id))
  const deptMap = useMemo(() => new Map(departments.map((d) => [d.id, d.name])), [departments])
  const posMap = useMemo(() => new Map(positions.map((p) => [p.id, p.name])), [positions])
  const activeRoles = form.activeRoles ?? []
  const [activeRoleTab, setActiveRoleTab] = useState(activeRoles.length > 0 ? activeRoles[0] : 'SELF')
  useEffect(() => {
    if (activeRoles.length > 0 && !activeRoles.includes(activeRoleTab)) {
      setActiveRoleTab(activeRoles[0])
    }
  }, [activeRoles, activeRoleTab])

  const addHybridRule = () => {
    const rules = form.audienceRules ?? []
    setForm({ ...form, audienceRules: [...rules, { departmentId: 0, positionId: null }] })
  }

  const updateHybridRule = (index: number, updates: Partial<FeedbackTemplateConfig['audienceRules'][number]>) => {
    const rules = [...(form.audienceRules ?? [])]
    rules[index] = { ...rules[index], ...updates }
    setForm({ ...form, audienceRules: rules })
  }

  const removeHybridRule = (index: number) => {
    const rules = [...(form.audienceRules ?? [])]
    rules.splice(index, 1)
    setForm({ ...form, audienceRules: rules.length > 0 ? rules : undefined })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[92vh] w-full max-w-7xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <ClipboardList size={20} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black">{modalTitle ?? (form.id ? 'Edit Feedback Template' : 'Create Feedback Template')}</h3>
                  {readOnly && (
                    <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white ring-1 ring-white/20">
                      Read-only
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-blue-100">
                  {readOnly ? 'Review the template exactly as it is available for this cycle.' : 'Configure the audience and assign feedback criteria.'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"><X size={18} /></button>
          </div>
        </div>

        <div className="grid max-h-[calc(92vh-150px)] gap-0 overflow-auto lg:grid-cols-[1fr_320px]">
          <div className="space-y-5 p-6">
            <section className="rounded-2xl border border-slate-200 p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] text-white shadow-md shadow-[#2463eb]/20">
                  <CalendarRange size={17} />
                </span>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#2463eb]">Step 1</span>
                  <h4 className="font-black text-slate-900">Review Cycle</h4>
                  <p className="text-xs text-slate-500">Feedback templates are saved against the selected future or upcoming review cycle.</p>
                </div>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <p className="text-sm font-black text-slate-900">{reviewCycleName ?? 'Selected review cycle'}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{reviewCycleDetail}</p>
              </div>
              {readOnlyMessage && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  {readOnlyMessage}
                </div>
              )}
            </section>

            {importErrors && importErrors.invalidRowsData && importErrors.invalidRowsData.length > 0 && (
              <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-500" />
                  <h4 className="text-sm font-black text-red-700">Import Errors</h4>
                  <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">{importErrors.invalidRows} invalid row{importErrors.invalidRows === 1 ? '' : 's'}</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {importErrors.invalidRowsData.map((row, idx) => (
                    <div key={idx} className="rounded-xl border border-red-100 bg-white p-3">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-red-600 shrink-0 w-10">Row {row.rowNumber}</span>
                        <div className="flex-1 min-w-0">
                          {row.criteriaName && <p className="text-xs font-semibold text-red-900 truncate">{row.criteriaName}</p>}
                          <ul className="mt-1 space-y-0.5">
                            {row.errors.map((err, eIdx) => (
                              <li key={eIdx} className="text-xs text-red-600">- {err}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] text-white shadow-md shadow-[#2463eb]/20">
                  <FileText size={17} />
                </span>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#2463eb]">Step 2</span>
                  <h4 className="font-black text-slate-900">Template Details</h4>
                  <p className="text-xs text-slate-500">Name the template and choose its status.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-400">Template Name</label>
                  <input
                    readOnly={readOnly}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold focus:border-[#2463eb] focus:outline-none read-only:bg-slate-50 read-only:text-slate-500"
                    placeholder="e.g. Engineering Peer Feedback"
                    value={form.templateName}
                    onChange={(e) => setForm({ ...form, templateName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-400">Status</label>
                  <select disabled={readOnly} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold focus:border-[#2463eb] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as FeedbackTemplateConfig['status'] })}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] text-white shadow-md shadow-[#2463eb]/20">
                  <Star size={17} />
                </span>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#2463eb]">Step 3</span>
                  <h4 className="font-black text-slate-900">Rating Scale</h4>
                  <p className="text-xs text-slate-500">Set the maximum rating value for this template (2-10).</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">Max Rating</label>
                  <select
                    disabled={readOnly}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold focus:border-[#2463eb] focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                    value={form.maxRating ?? 5}
                    onChange={(e) => setForm({ ...form, maxRating: Number(e.target.value) })}
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="mb-2 text-xs font-bold text-slate-500">Preview</p>
                  <div className="flex flex-wrap items-center gap-1">
                    {Array.from({ length: form.maxRating ?? 5 }, (_, i) => i + 1).map((num) => {
                      const max = form.maxRating ?? 5
                      const isMax = num === max
                      return (
                        <span
                          key={num}
                          aria-hidden
                          className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${
                            isMax ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {num}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            </section>

            {importedRows && importedRows.length > 0 && (
              <section className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-blue-600" />
                  <h4 className="text-sm font-black text-blue-800">Imported Criteria ({importedRows.length})</h4>
                </div>
                <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-blue-50 text-[10px] font-black uppercase tracking-wider text-blue-700 border-b border-blue-100">
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3">Criteria Name</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-center w-12">Known</th>
                        <th className="py-2.5 px-3 text-center w-14">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                      {importedRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-2 px-3 text-center text-xs font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
                              value={row.criteriaName}
                              maxLength={100}
                              onChange={(e) => {
                                const next = [...importedRows]
                                next[idx] = { ...next[idx], criteriaName: e.target.value }
                                setImportedRows?.(next)
                              }}
                              readOnly={readOnly}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 outline-none focus:ring-2 focus:ring-blue-100"
                              value={row.description ?? ''}
                              onChange={(e) => {
                                const next = [...importedRows]
                                next[idx] = { ...next[idx], description: e.target.value }
                                setImportedRows?.(next)
                              }}
                              readOnly={readOnly}
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            {row.existingCriteriaId ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Yes</span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">New</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {!readOnly && (
                              <button
                                onClick={() => {
                                  const next = importedRows.filter((_, i) => i !== idx)
                                  setImportedRows?.(next)
                                }}
                                className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-[11px] text-blue-600 font-medium">
                  Imported criteria will be auto-assigned to all selected feedback roles. You can edit names above before saving.
                </p>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] text-white shadow-md shadow-[#2463eb]/20">
                  <Users size={17} />
                </span>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#2463eb]">Step 4</span>
                  <h4 className="font-black text-slate-900">Feedback Roles</h4>
                  <p className="text-xs text-slate-500">Select which feedback roles this template applies to.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {FEEDBACK_ROLE_OPTIONS.map(({ value, label }) => {
                  const selected = (form.activeRoles ?? []).includes(value)
                  const roleQuestions = form.questionsByRole?.[value] ?? []
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={readOnly}
                      onClick={() => {
                        if (readOnly) return
                        const currentRoles = form.activeRoles ?? []
                        const newRoles = selected
                          ? currentRoles.filter(r => r !== value)
                          : [...currentRoles, value]
                        const newQuestionsByRole = { ...(form.questionsByRole ?? {}) }
                        if (!selected) {
                          newQuestionsByRole[value] = []
                        }
                        setForm({ ...form, activeRoles: newRoles, questionsByRole: newQuestionsByRole })
                      }}
                      className={`relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all ${
                        selected
                          ? 'border-[#2463eb]/50 bg-[#2463eb]/[0.05] shadow-md shadow-[#2463eb]/10 ring-1 ring-[#2463eb]/25'
                          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                      } ${readOnly && !selected ? 'opacity-55' : ''}`}
                    >
                      {selected && (
                        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#2463eb]/[0.04] to-[#1d4ed8]/[0.02]" />
                      )}
                      <div className="relative flex flex-col items-center">
                        <p className={`text-sm font-bold ${selected ? 'text-[#1d4ed8]' : 'text-slate-900'}`}>{label}</p>
                        <p className={`mt-1 text-xs ${selected ? 'text-blue-500' : 'text-slate-400'}`}>
                          {roleQuestions.length} question{roleQuestions.length === 1 ? '' : 's'}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] text-white shadow-md shadow-[#2463eb]/20">
                  <Users size={17} />
                </span>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#2463eb]">Step 5</span>
                  <h4 className="font-black text-slate-900">Audience</h4>
                  <p className="text-xs text-slate-500">Match the self-assessment audience style by selecting one target type.</p>
                </div>
              </div>
              <div
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
                role="radiogroup"
                aria-label="Audience target type"
              >
                {FEEDBACK_TARGET_TYPE_OPTIONS.map(({ value, label, description, icon }) => (
                  <FeedbackTargetTypeCard
                    key={value}
                    label={label}
                    description={description}
                    icon={icon}
                    selected={form.targetType === value}
                    readOnly={readOnly}
                    onClick={() =>
                      setForm({
                        ...form,
                        targetType: value,
                        targetId: 0,
                        audienceRules: value === 'HYBRID' ? (form.audienceRules ?? []) : undefined,
                      })
                    }
                  />
                ))}
              </div>

              {form.targetType === 'HYBRID' ? (
                <div className="mt-4 space-y-3">
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-400">Audience Rules</label>
                  {(form.audienceRules ?? []).map((rule, index) => (
                    <div key={index} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="min-w-0 flex-1">
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</label>
                        <select
                          disabled={readOnly}
                          value={rule.departmentId || ''}
                          onChange={(e) => updateHybridRule(index, { departmentId: Number(e.target.value) })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold focus:border-[#2463eb] focus:outline-none disabled:bg-slate-100"
                        >
                          <option value="">Select department...</option>
                          {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                        </select>
                      </div>
                      <div className="min-w-0 flex-1">
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Position (optional)</label>
                        <select
                          disabled={readOnly}
                          value={rule.positionId ?? ''}
                          onChange={(e) => updateHybridRule(index, { positionId: e.target.value ? Number(e.target.value) : null })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold focus:border-[#2463eb] focus:outline-none disabled:bg-slate-100"
                        >
                          <option value="">All Positions</option>
                          {positions.map((pos) => <option key={pos.id} value={pos.id}>{pos.name}</option>)}
                        </select>
                      </div>
                      {!readOnly && (form.audienceRules ?? []).length > 1 && (
                        <button type="button" onClick={() => removeHybridRule(index)} className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  {!readOnly && (
                    <button type="button" onClick={addHybridRule} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-600">
                      <Plus size={14} /> Add Rule
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-400">Target</label>
                  <select disabled={readOnly} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold focus:border-[#2463eb] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500" value={form.targetId || ''} onChange={(e) => setForm({ ...form, targetId: Number(e.target.value) })}>
                    <option value="">Select {displayType(form.targetType).replace('_', ' ').toLowerCase()}...</option>
                    {targetOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] text-white shadow-md shadow-[#2463eb]/20">
                  <ClipboardList size={17} />
                </span>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#2463eb]">Step 6</span>
                  <h4 className="font-black text-slate-900">Criteria Assignment</h4>
                  <p className="text-xs text-slate-500">Select feedback criteria for each selected role.</p>
                </div>
              </div>
              {activeRoles.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Select at least one feedback role first.</p>
              ) : (
                <div>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {activeRoles.map(role => {
                      const roleLabel = FEEDBACK_ROLE_OPTIONS.find(r => r.value === role)?.label ?? role
                      const roleQuestions = form.questionsByRole?.[role] ?? []
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setActiveRoleTab(role)}
                          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                            activeRoleTab === role
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {roleLabel}
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                            activeRoleTab === role ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {roleQuestions.length}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <div className="grid max-h-72 gap-2 overflow-auto rounded-xl border border-slate-100 bg-slate-50 p-3">
                    {criteria.map((item) => {
                      const roleQuestions = form.questionsByRole?.[activeRoleTab] ?? []
                      return (
                        <label key={item.id} className="flex items-start gap-3 rounded-xl bg-white px-3 py-2.5 text-sm shadow-sm ring-1 ring-slate-100">
                          <input
                            type="checkbox"
                            disabled={readOnly}
                            className="mt-1"
                            checked={roleQuestions.includes(item.id)}
                            onChange={(e) => {
                              const newQuestionsByRole = { ...(form.questionsByRole ?? {}) }
                              const current = newQuestionsByRole[activeRoleTab] ?? []
                              newQuestionsByRole[activeRoleTab] = e.target.checked
                                ? [...current, item.id]
                                : current.filter((id) => id !== item.id)
                              const allQuestionIds = [...new Set(Object.values(newQuestionsByRole).flat())]
                              setForm({ ...form, questionsByRole: newQuestionsByRole, questionIds: allQuestionIds })
                            }}
                          />
                          <span className="font-semibold text-slate-700">{item.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="border-t border-slate-100 bg-slate-50 p-6 lg:border-l lg:border-t-0">
            <h4 className="font-black text-slate-900">Template Preview</h4>
            <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Review Cycle</p>
                <p className="mt-1 font-semibold text-slate-700">{reviewCycleName ?? 'Selected review cycle'}</p>
                <p className="text-xs text-slate-500">{reviewCycleDetail}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Name</p>
                <p className="mt-1 font-bold text-slate-900">{form.templateName || 'Untitled template'}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Rating Scale</p>
                <p className="mt-1 font-bold text-slate-900">1 - {form.maxRating ?? 5}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Feedback Roles</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(form.activeRoles ?? ['SELF', 'PEER', 'MANAGER', 'SUBORDINATE']).map(role => {
                    const roleLabel = FEEDBACK_ROLE_OPTIONS.find(r => r.value === role)?.label ?? role
                    return (
                      <span key={role} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        {roleLabel}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Audience</p>
                <p className="mt-1 font-semibold text-slate-700">{targetLabel(form.targetType)}</p>
                {form.targetType === 'HYBRID' ? (
                  <div className="mt-2 space-y-1">
                    {(form.audienceRules ?? []).length === 0 ? (
                      <p className="text-xs text-slate-500">No rules configured</p>
                    ) : (
                      (form.audienceRules ?? []).map((rule, i) => {
                        const deptName = deptMap.get(rule.departmentId) ?? rule.departmentName ?? `Dept ${rule.departmentId}`
                        const posName = rule.positionId ? (posMap.get(rule.positionId) ?? rule.positionName ?? `Pos ${rule.positionId}`) : 'All Positions'
                        return <p key={i} className="text-xs text-slate-500">{deptName} / {posName}</p>
                      })
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">{selectedTarget?.name || form.targetName || 'No target selected'}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Criteria</p>
                {selectedQuestions.length === 0 ? (
                  <p className="mt-1 text-sm text-slate-500">No criteria selected</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    {selectedQuestions.slice(0, 5).map((question) => <li key={question.id}>- {question.name}</li>)}
                    {selectedQuestions.length > 5 && <li className="font-semibold text-slate-400">+ {selectedQuestions.length - 5} more</li>}
                  </ul>
                )}
              </div>
            </div>
          </aside>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-white p-5">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50">{readOnly ? 'Close' : 'Cancel'}</button>
          {!readOnly && (
            <button onClick={onSave} disabled={isSaving} className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">{isSaving ? 'Saving...' : 'Save Template'}</button>
          )}
        </div>
      </div>
    </div>
  )
}

type CoverageStatus = 'COVERED' | 'UNCOVERED'

const coverageFilterControlClass =
  'w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all focus:border-[#2463eb] focus:outline-none focus:ring-2 focus:ring-[#2463eb]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-[#2463eb]'

function CoverageTab() {
  const { data: reviewCycles = [] } = useGetReviewCyclesQuery({ requiresEmployeeSubmission: true })
  const [selectedReviewCycleId, setSelectedReviewCycleId] = useState<number | null>(null)
  const { data: coverage, isLoading } = useGetFeedbackCoverageQuery(selectedReviewCycleId ?? undefined, { skip: !selectedReviewCycleId })
  const [statusFilter, setStatusFilter] = useState<CoverageStatus>('UNCOVERED')
  const [searchQuery, setSearchQuery] = useState('')
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [posFilter, setPosFilter] = useState('ALL')
  const [levelCodeFilter, setLevelCodeFilter] = useState('ALL')
  const [expandedFilters, setExpandedFilters] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    if (selectedReviewCycleId != null || reviewCycles.length === 0) return
    const defaultCycle = pickDefaultCoverageReviewCycle(reviewCycles)
    if (defaultCycle) setSelectedReviewCycleId(defaultCycle.id)
  }, [reviewCycles, selectedReviewCycleId])

  const allRows = useMemo(() => {
    if (!coverage) return []
    return [...coverage.coveredEmployees, ...coverage.uncoveredEmployees]
  }, [coverage])

  const departments = useMemo(() => {
    if (!coverage) return new Map<string, string>()
    const map = new Map<string, string>()
    for (const row of allRows) {
      if (row.departmentId != null && row.departmentName) {
        map.set(String(row.departmentId), row.departmentName)
      }
    }
    return map
  }, [allRows])

  const positions = useMemo(() => {
    if (!coverage) return new Map<string, string>()
    const map = new Map<string, string>()
    for (const row of allRows) {
      if (row.positionId != null && row.positionName) {
        map.set(String(row.positionId), row.positionName)
      }
    }
    return map
  }, [allRows])

  const levelCodes = useMemo(() => {
    if (!coverage) return new Map<string, string>()
    const map = new Map<string, string>()
    for (const row of allRows) {
      if (row.levelCodeId != null && row.levelCode) {
        map.set(String(row.levelCodeId), row.levelCode)
      }
    }
    return map
  }, [allRows])

  const sourceRows = useMemo(() => {
    if (!coverage) return []
    return statusFilter === 'COVERED' ? coverage.coveredEmployees : coverage.uncoveredEmployees
  }, [coverage, statusFilter])

  const filteredRows = useMemo(() => {
    if (!coverage) return []
    const query = searchQuery.trim().toLowerCase()
    return sourceRows.filter((row) => {
      if (deptFilter !== 'ALL' && String(row.departmentId) !== deptFilter) return false
      if (posFilter !== 'ALL' && String(row.positionId) !== posFilter) return false
      if (levelCodeFilter !== 'ALL' && String(row.levelCodeId) !== levelCodeFilter) return false
      if (!query) return true
      const text = [row.employeeName, row.employeeCode, row.departmentName, row.positionName, row.levelCode].filter(Boolean).join(' ').toLowerCase()
      return text.includes(query)
    })
  }, [sourceRows, searchQuery, deptFilter, posFilter, levelCodeFilter])

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(filteredRows.length / pageSize)),
    [filteredRows.length, pageSize],
  )

  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, pageIndex, pageSize])

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    deptFilter !== 'ALL' ||
    posFilter !== 'ALL' ||
    levelCodeFilter !== 'ALL'

  const activeFilterCount = [
    searchQuery.trim() !== '',
    deptFilter !== 'ALL',
    posFilter !== 'ALL',
    levelCodeFilter !== 'ALL',
  ].filter(Boolean).length

  const clearAllFilters = () => {
    setSearchQuery('')
    setDeptFilter('ALL')
    setPosFilter('ALL')
    setLevelCodeFilter('ALL')
  }

  useEffect(() => {
    setPageIndex(0)
  }, [selectedReviewCycleId, searchQuery, deptFilter, posFilter, levelCodeFilter, statusFilter])

  useEffect(() => {
    setDeptFilter('ALL')
    setPosFilter('ALL')
    setLevelCodeFilter('ALL')
  }, [statusFilter])

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(0, pageCount - 1))
    }
  }, [pageIndex, pageCount])

  return (
    <section className="space-y-6">
      <ReviewCycleSelector
        reviewCycles={reviewCycles}
        selectedReviewCycleId={selectedReviewCycleId}
        onChange={setSelectedReviewCycleId}
        locked={false}
      />
      <div className="flex flex-col gap-5 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">360 Feedback Coverage</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              Identify active employees with active accounts and whether they have a matching 360 Feedback template for the selected review cycle.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {([
          { label: 'Eligible', value: coverage?.eligibleCount ?? 0, icon: Users, lightBg: 'bg-sky-50 dark:bg-sky-950/30', lightIcon: 'text-sky-600 dark:text-sky-400', ring: 'ring-sky-500/20', bgGlow: 'bg-sky-500/10' },
          { label: 'Covered', value: coverage?.coveredCount ?? 0, icon: UserCheck, lightBg: 'bg-emerald-50 dark:bg-emerald-950/30', lightIcon: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20', bgGlow: 'bg-emerald-500/10' },
          { label: 'Uncovered', value: coverage?.uncoveredCount ?? 0, icon: UserX, lightBg: 'bg-red-50 dark:bg-red-950/30', lightIcon: 'text-red-600 dark:text-red-400', ring: 'ring-red-500/20', bgGlow: 'bg-red-500/10' },
          { label: 'Coverage', value: `${(coverage?.coveragePercent ?? 0).toFixed(1)}%`, icon: FileText, lightBg: 'bg-violet-50 dark:bg-violet-950/30', lightIcon: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-500/20', bgGlow: 'bg-violet-500/10' },
        ] as const).map((card) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-800/80"
          >
            <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full ${card.bgGlow} blur-2xl transition-all duration-500 group-hover:scale-150`} />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">{card.value}</p>
              </div>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.lightBg} ring-1 ${card.ring}`}>
                <card.icon size={14} className={card.lightIcon} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200/60 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-400">
          Loading coverage...
        </div>
      ) : !selectedReviewCycleId ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
          Select a review cycle to view coverage.
        </div>
      ) : !coverage || coverage.eligibleCount === 0 ? (
        <div className="rounded-2xl border border-slate-200/60 bg-white px-6 py-12 text-center shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700/60">
            <Users size={28} className="text-slate-300 dark:text-slate-500" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-200">No eligible employees</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            There are no eligible employees for 360 feedback coverage in the selected cycle.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700/60">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div
                  role="tablist"
                  aria-label="Coverage status"
                  className="inline-flex rounded-xl border border-slate-200 bg-slate-50/50 p-1 dark:border-slate-700 dark:bg-slate-800/60"
                >
                  {([
                    { id: 'COVERED' as const, label: 'Covered', icon: UserCheck, count: coverage.coveredCount, activeClass: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20' },
                    { id: 'UNCOVERED' as const, label: 'Uncovered', icon: UserX, count: coverage.uncoveredCount, activeClass: 'bg-red-600 text-white shadow-sm shadow-red-600/20' },
                  ]).map((tab) => {
                    const Icon = tab.icon
                    const isActive = statusFilter === tab.id
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setStatusFilter(tab.id)}
                        className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                          isActive
                            ? tab.activeClass
                            : 'text-slate-500 hover:bg-white hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white'
                        }`}
                      >
                        <Icon size={14} />
                        {tab.label}
                        <span
                          className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-500 dark:bg-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {filteredRows.length} of {sourceRows.length} employee{sourceRows.length !== 1 ? 's' : ''}
                  {hasActiveFilters && (
                    <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-[#2463eb]/10 px-2 py-0.5 text-[10px] font-bold text-[#2463eb] dark:bg-[#2463eb]/20 dark:text-[#60a5fa]">
                      <Filter size={9} />
                      Filtered
                    </span>
                  )}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, staff no, dept, position, level..."
                    className={`${coverageFilterControlClass} py-2 pl-9 pr-9 text-xs font-medium`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedFilters(!expandedFilters)}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all shadow-sm ${
                    expandedFilters || hasActiveFilters
                      ? 'border-[#2463eb]/30 bg-[#2463eb]/[0.04] text-[#2463eb] dark:border-[#2463eb]/40 dark:bg-[#2463eb]/10 dark:text-[#60a5fa]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <SlidersHorizontal size={14} />
                  Filters
                  {hasActiveFilters && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2463eb] text-[10px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                  <ChevronDown size={12} className={`transition-transform ${expandedFilters ? 'rotate-180' : ''}`} />
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  >
                    <X size={13} />
                    Clear
                  </button>
                )}
              </div>

              {expandedFilters && (
                <div className="grid gap-3 animate-fade-in sm:grid-cols-3">
                  <div>
                    <label htmlFor="fb-coverage-dept-filter" className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Department
                    </label>
                    <select
                      id="fb-coverage-dept-filter"
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className={coverageFilterControlClass}
                    >
                      <option value="ALL">All departments</option>
                      {Array.from(departments.entries()).map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="fb-coverage-pos-filter" className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Position
                    </label>
                    <select
                      id="fb-coverage-pos-filter"
                      value={posFilter}
                      onChange={(e) => setPosFilter(e.target.value)}
                      className={coverageFilterControlClass}
                    >
                      <option value="ALL">All positions</option>
                      {Array.from(positions.entries()).map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="fb-coverage-level-filter" className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Level code
                    </label>
                    <select
                      id="fb-coverage-level-filter"
                      value={levelCodeFilter}
                      onChange={(e) => setLevelCodeFilter(e.target.value)}
                      className={coverageFilterControlClass}
                    >
                      <option value="ALL">All level codes</option>
                      {Array.from(levelCodes.entries()).map(([id, code]) => (
                        <option key={id} value={id}>{code}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {filteredRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700/60">
                {hasActiveFilters ? (
                  <Search size={28} className="text-slate-300 dark:text-slate-500" />
                ) : statusFilter === 'COVERED' ? (
                  <UserCheck size={28} className="text-slate-300 dark:text-slate-500" />
                ) : (
                  <UserX size={28} className="text-slate-300 dark:text-slate-500" />
                )}
              </div>
              <p className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-200">
                {hasActiveFilters
                  ? 'No employees match your search or filters'
                  : statusFilter === 'COVERED'
                    ? 'No covered employees'
                    : 'All employees are covered'}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <X size={14} />
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-slate-50/40 dark:border-slate-700/60 dark:from-slate-800/60 dark:to-slate-800/30">
                      <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Employee
                      </th>
                      <th className="hidden px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 sm:table-cell">
                        Department
                      </th>
                      <th className="hidden px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 lg:table-cell">
                        Position
                      </th>
                      <th className="hidden px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 md:table-cell">
                        Level
                      </th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 dark:divide-slate-700/40">
                    {paginatedRows.map((row) => (
                      <tr
                        key={row.employeeId}
                        className="group transition-all duration-200 hover:bg-[#2463eb]/[0.02] dark:hover:bg-[#2463eb]/[0.04]"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-50 text-xs font-bold text-slate-600 ring-1 ring-slate-200/80 dark:from-slate-700 dark:to-slate-800 dark:text-slate-300 dark:ring-slate-600">
                              {(row.employeeName?.trim().charAt(0) ?? '?').toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900 dark:text-white">{row.employeeName}</p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                {row.employeeCode ? `Staff #${row.employeeCode}` : 'No staff no.'}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] text-slate-500 sm:hidden dark:text-slate-400">
                                {[row.departmentName, row.positionName].filter(Boolean).join(' · ') || '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-5 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 sm:table-cell">
                          {row.departmentName ?? '-'}
                        </td>
                        <td className="hidden max-w-[200px] truncate px-5 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 lg:table-cell">
                          {row.positionName ?? '-'}
                        </td>
                        <td className="hidden px-5 py-3 md:table-cell">
                          {row.levelCode ? (
                            <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              {row.levelCode}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {statusFilter === 'COVERED' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              <UserCheck size={10} />
                              Covered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              <UserX size={10} />
                              No template
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-700/60">
                <PaginationBar
                  className="mt-0 rounded-none border-0 shadow-none dark:bg-transparent"
                  pageIndex={pageIndex}
                  pageSize={pageSize}
                  pageCount={pageCount}
                  totalItems={filteredRows.length}
                  itemLabel="employees"
                  rowsPerPageOptions={[5, 10, 20, 50]}
                  onPageIndexChange={setPageIndex}
                  onPageSizeChange={(nextSize) => {
                    setPageSize(nextSize)
                    setPageIndex(0)
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}

function PeerProgressTab() {
  const { data: reviewCycles = [] } = useGetReviewCyclesQuery({ requiresEmployeeSubmission: true })
  const [selectedReviewCycleId, setSelectedReviewCycleId] = useState<number | null>(null)
  const selectedReviewCycle = reviewCycles.find((cycle) => cycle.id === selectedReviewCycleId) ?? null
  const isLocked = isLockedCycle(selectedReviewCycle)
  const { data: limits = [], isLoading } = useGetFeedbackLimitsQuery(selectedReviewCycleId ?? undefined, { skip: !selectedReviewCycleId })
  const [saveLimit, { isLoading: isSaving }] = useSaveFeedbackLimitMutation()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FeedbackLimitConfig>(emptyLimit)
  const relationshipCards: Array<{ type: FeedbackLimitConfig['relationshipType']; title: string; description: string }> = [
    { type: 'MANAGER', title: 'Manager', description: 'Feedback between employee and manager.' },
    { type: 'PEER', title: 'Peer', description: 'Feedback from colleagues at similar level.' },
    { type: 'SUBORDINATE', title: 'Subordinate', description: 'Feedback from direct or indirect reports.' },
  ]
  const totalMinimum = limits.reduce((sum, limit) => sum + limit.minimumCount, 0)
  const totalMaximum = limits.reduce((sum, limit) => sum + limit.maximumCount, 0)
  const configuredTypes = new Set(limits.map((limit) => limit.relationshipType))
  const hasInvalidRange = form.minimumCount > form.maximumCount
  const hasNegativeValue = form.minimumCount < 0 || form.maximumCount < 0

  useEffect(() => {
    if (selectedReviewCycleId != null || reviewCycles.length === 0) return
    const activeFirst = reviewCycles.find((cycle) => cycle.isActive || cycle.status?.toUpperCase() === 'ACTIVE') ?? reviewCycles[0]
    setSelectedReviewCycleId(activeFirst.id)
  }, [reviewCycles, selectedReviewCycleId])

  const openConfigure = (type: FeedbackLimitConfig['relationshipType'], limit?: FeedbackLimitConfig) => {
    if (!selectedReviewCycleId) return toast.error('Please select a review cycle')
    if (isLocked) return toast.error(LOCK_MESSAGE)
    setForm(limit ? { ...limit } : { ...emptyLimit, relationshipType: type, reviewCycleId: selectedReviewCycleId, reviewCycleName: selectedReviewCycle?.name })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!selectedReviewCycleId) return toast.error('Review cycle is required')
    if (isLocked) return toast.error(LOCK_MESSAGE)
    if (form.minimumCount == null || form.maximumCount == null) return toast.error('Minimum and maximum counts are required')
    if (form.minimumCount < 0 || form.maximumCount < 0) return toast.error('Values cannot be negative')
    if (form.minimumCount > form.maximumCount) return toast.error('Minimum count cannot be greater than maximum count')
    try {
      await saveLimit({ ...form, reviewCycleId: selectedReviewCycleId, reviewCycleName: selectedReviewCycle?.name }).unwrap()
      toast.success(form.id ? 'Limit updated' : 'Limit created')
      setShowModal(false)
    } catch (error: any) {
      toast.error(error?.data?.message ?? 'Failed to save feedback limit')
    }
  }

  return (
    <section className="space-y-6">
      <ReviewCycleSelector
        reviewCycles={reviewCycles}
        selectedReviewCycleId={selectedReviewCycleId}
        onChange={setSelectedReviewCycleId}
        locked={isLocked}
      />
      <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
            <Users size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Peer Progress Limits</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-500">Set the minimum and maximum feedback responses required for each relationship type.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Configured Types', limits.length, Users],
          ['Minimum Feedback', totalMinimum, ClipboardList],
          ['Maximum Feedback', totalMaximum, FileText],
        ].map(([label, value, Icon]) => {
          const StatIcon = Icon as typeof Users
          return (
            <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label as string}</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{value as number}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <StatIcon size={18} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="space-y-4">
        {relationshipCards.map((card) => {
          const limit = limits.find((item) => item.relationshipType === card.type)
          const configured = Boolean(limit)
          return (
            <div key={card.type} className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${configured ? 'border-emerald-200 bg-white' : 'border-dashed border-slate-200 bg-slate-50'}`}>
              <div className="grid gap-5 lg:grid-cols-[1fr_360px_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Users size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{card.title}</h3>
                      <p className="text-sm text-slate-500">{card.description}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${configured ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {configured ? 'Configured' : 'Not Set'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="min-h-[104px] rounded-xl border border-slate-100 bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Minimum Feedback</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{limit?.minimumCount ?? '-'}</p>
                  </div>
                  <div className="min-h-[104px] rounded-xl border border-slate-100 bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Maximum Feedback</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{limit?.maximumCount ?? '-'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button
                    onClick={() => openConfigure(card.type, limit)}
                    disabled={!selectedReviewCycleId || isLocked}
                    className="inline-flex min-h-10 w-36 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3.5 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={15} /> Configure
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {isLoading && <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading limits...</div>}
      {!isLoading && configuredTypes.size === 0 && <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No feedback limits configured yet.</div>}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
              <div>
                <h3 className="text-xl font-black">Configure Feedback Limit</h3>
                <p className="mt-1 text-sm text-emerald-50">Define minimum and maximum required feedback responses.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">Relationship Type</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {relationshipCards.map((card) => (
                    <button
                      key={card.type}
                      type="button"
                      onClick={() => setForm({ ...form, relationshipType: card.type })}
                      className={`rounded-xl border p-4 text-left transition ${form.relationshipType === card.type ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <p className="font-black text-slate-900">{card.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{card.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">Minimum Feedback Count</label>
                  <input type="number" min={0} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-2xl font-black text-slate-900 focus:border-emerald-500 focus:outline-none" value={form.minimumCount} onChange={(e) => setForm({ ...form, minimumCount: Number(e.target.value) })} />
                  <p className="mt-2 text-xs text-slate-500">Required lower bound for this relationship.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">Maximum Feedback Count</label>
                  <input type="number" min={0} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-2xl font-black text-slate-900 focus:border-emerald-500 focus:outline-none" value={form.maximumCount} onChange={(e) => setForm({ ...form, maximumCount: Number(e.target.value) })} />
                  <p className="mt-2 text-xs text-slate-500">Allowed upper bound for this relationship.</p>
                </div>
              </div>
              {(hasInvalidRange || hasNegativeValue) && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {hasNegativeValue ? 'Feedback counts cannot be negative.' : 'Minimum feedback count cannot be greater than maximum feedback count.'}
                </div>
              )}
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Preview</p>
                <p className="mt-2 text-sm text-slate-700">
                  {displayType(form.relationshipType).replace('_', ' ')} feedback requires at least <strong>{form.minimumCount}</strong> and at most <strong>{form.maximumCount}</strong> response{form.maximumCount === 1 ? '' : 's'}.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
              <button onClick={() => setShowModal(false)} className="rounded-lg px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={isSaving || hasInvalidRange || hasNegativeValue} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">{isSaving ? 'Saving...' : 'Save Limit'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
