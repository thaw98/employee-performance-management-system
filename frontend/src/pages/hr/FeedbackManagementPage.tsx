import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'react-hot-toast'
import { ClipboardList, Download, Eye, FileText, Filter, LayoutGrid, Pencil, Plus, Search, Table2, Trash2, Upload, Users, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import axios from '../../app/axiosInstance'
import { CriteriaPage } from './CriteriaPage'
import { formatDateTime } from '../../utils/dateUtils'
import {
  type FeedbackLimitConfig,
  type FeedbackTemplateConfig,
  useDeleteFeedbackTemplateMutation,
  useGetFeedbackLimitsQuery,
  useGetFeedbackTemplatesQuery,
  useSaveFeedbackLimitMutation,
  useSaveFeedbackTemplateMutation,
} from '../../features/feedback/api/feedbackManagementApi'
import { useGetReviewCyclesQuery, type ReviewCycleDto } from '../../features/reviewCycle/api/reviewCycleApi'

type TabKey = 'criteria' | 'template' | 'progress'
type Option = { id: number; name: string }
const LOCK_MESSAGE = 'This configuration is already active for the current review cycle and cannot be changed. Any updates will apply only to future review cycles.'

const emptyTemplate: FeedbackTemplateConfig = {
  templateName: '',
  targetType: 'DEPARTMENT',
  targetId: 0,
  targetName: '',
  questionIds: [],
  status: 'ACTIVE',
}

const emptyLimit: FeedbackLimitConfig = {
  relationshipType: 'MANAGER',
  minimumCount: 1,
  maximumCount: 2,
}

const targetLabel = (type: string) => {
  if (type === 'DEPARTMENT') return 'Department-based template'
  if (type === 'LEVEL_CODE') return 'Level code-based template'
  return 'Person-based template'
}

const displayType = (value: string) => value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
const isLockedCycle = (cycle?: ReviewCycleDto | null) => Boolean(cycle && (cycle.isActive || cycle.status?.toUpperCase() === 'ACTIVE'))
const cycleDate = (value?: string) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-GB') : '-'

export default function FeedbackManagementPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('criteria')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleDownloadTemplate = () => {
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ['Feedback Management Import Template'],
      ['Fill the Criteria, Feedback Templates, and Peer Progress sheets. Keep the column names unchanged.'],
      ['For Question Ids, enter criteria IDs separated by commas, for example: 1,2,3.'],
      ['Review Cycle Id is required for Feedback Templates and Peer Progress. Use a future/upcoming review cycle.'],
      ['Target Type values: DEPARTMENT, LEVEL_CODE, PERSON. Relationship Type values: MANAGER, PEER, SUBORDINATE.'],
    ]), 'Instructions')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ['Name', 'Description', 'Status'],
      ['Communication', 'Shares clear and timely feedback.', 'ACTIVE'],
      ['Teamwork', 'Collaborates well with others.', 'ACTIVE'],
    ]), 'Criteria')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ['Template Name', 'Review Cycle Id', 'Target Type', 'Target Id', 'Target Name', 'Question Ids', 'Status'],
      ['Engineering Peer Feedback', 2, 'DEPARTMENT', 1, 'Engineering', '1,2,3', 'ACTIVE'],
      ['Level L2 Feedback', 2, 'LEVEL_CODE', 2, 'L2', '1,3', 'ACTIVE'],
      ['Lisa Wong Feedback', 2, 'PERSON', 6, 'Lisa Wong', '2,3', 'ACTIVE'],
    ]), 'Feedback Templates')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ['Relationship Type', 'Review Cycle Id', 'Minimum Count', 'Maximum Count'],
      ['MANAGER', 2, 1, 2],
      ['PEER', 2, 2, 5],
      ['SUBORDINATE', 2, 0, 3],
    ]), 'Peer Progress')
    XLSX.writeFile(workbook, 'feedback_management_import_template.xlsx')
  }

  const normalize = (value: unknown) => String(value ?? '').trim()
  const parseStatus = (value: unknown) => {
    const status = normalize(value).toUpperCase()
    return status === '' || status === 'ACTIVE' || status === 'TRUE' || status === 'YES'
  }
  const parseIds = (value: unknown) => normalize(value).split(/[,\n;]/).map((item) => Number(item.trim())).filter(Boolean)

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const rows = (sheetName: string) => {
        const sheet = workbook.Sheets[sheetName]
        return sheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' }) : []
      }

      let importedCriteria = 0
      let importedTemplates = 0
      let importedLimits = 0

      for (const row of rows('Criteria')) {
        const name = normalize(row['Name'])
        if (!name) continue
        await axios.post('/criteria', {
          name,
          description: normalize(row['Description']),
          active: parseStatus(row['Status']),
          sortOrder: importedCriteria + 1,
        })
        importedCriteria += 1
      }

      for (const row of rows('Feedback Templates')) {
        const templateName = normalize(row['Template Name'])
        const targetType = normalize(row['Target Type']).toUpperCase()
        const reviewCycleId = Number(row['Review Cycle Id'])
        const targetId = Number(row['Target Id'])
        const questionIds = parseIds(row['Question Ids'])
        if (!templateName || !targetType || !reviewCycleId || !targetId || questionIds.length === 0) continue
        await axios.post('/feedback-management/templates', {
          templateName,
          reviewCycleId,
          targetType,
          targetId,
          targetName: normalize(row['Target Name']),
          questionIds,
          status: parseStatus(row['Status']) ? 'ACTIVE' : 'INACTIVE',
        })
        importedTemplates += 1
      }

      for (const row of rows('Peer Progress')) {
        const relationshipType = normalize(row['Relationship Type']).toUpperCase()
        const reviewCycleId = Number(row['Review Cycle Id'])
        const minimumCount = Number(row['Minimum Count'])
        const maximumCount = Number(row['Maximum Count'])
        if (!relationshipType || !reviewCycleId || Number.isNaN(minimumCount) || Number.isNaN(maximumCount)) continue
        await axios.post('/feedback-management/limits', { relationshipType, reviewCycleId, minimumCount, maximumCount })
        importedLimits += 1
      }

      toast.success(`Imported ${importedCriteria} criteria, ${importedTemplates} templates, and ${importedLimits} limits`)
      window.location.reload()
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Failed to import feedback management file')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Feedback Management</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage feedback criteria, templates, and peer progress limits.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          {[
            ['criteria', 'Criteria', ClipboardList],
            ['template', 'Template', FileText],
            ['progress', 'Peer Progress', Users],
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
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#bfdbfe] bg-white px-4 py-2.5 text-sm font-semibold text-[#1d4ed8] shadow-sm transition hover:border-[#93c5fd] hover:bg-[#eff6ff] focus:outline-none focus:ring-4 focus:ring-[#dbeafe]"
          >
            <Download size={16} />
            <span className="whitespace-nowrap">Download Template</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#dbeafe] transition hover:from-[#1d4ed8] hover:to-[#1e40af] focus:outline-none focus:ring-4 focus:ring-[#dbeafe] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload size={16} />
            <span className="whitespace-nowrap">{isImporting ? 'Importing...' : 'Import File'}</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />
        </div>
      </div>

      {activeTab === 'criteria' && <CriteriaPage />}
      {activeTab === 'template' && <TemplateTab />}
      {activeTab === 'progress' && <PeerProgressTab />}
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Review Cycle</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Select the cycle this configuration belongs to. Active cycles are view-only.
          </p>
        </div>
        <select
          value={selectedReviewCycleId ?? ''}
          onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 lg:w-96"
        >
          <option value="">Select review cycle...</option>
          {reviewCycles.map((cycle) => (
            <option key={cycle.id} value={cycle.id}>
              {cycle.name} ({cycleDate(cycle.startDate)} - {cycleDate(cycle.endDate)}) - {cycle.status}
            </option>
          ))}
        </select>
      </div>
      {selected && (
        <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${locked ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {locked ? LOCK_MESSAGE : `Changes will be saved for ${selected.name} only.`}
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
  const [showModal, setShowModal] = useState(false)
  const [viewing, setViewing] = useState<FeedbackTemplateConfig | null>(null)
  const [form, setForm] = useState<FeedbackTemplateConfig>(emptyTemplate)
  const [searchQuery, setSearchQuery] = useState('')
  const [targetFilter, setTargetFilter] = useState<'ALL' | FeedbackTemplateConfig['targetType']>('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

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
      const [criteriaRes, deptRes, levelCodeRes, empRes] = await Promise.all([
        axios.get('/criteria'),
        axios.get('/departments'),
        axios.get('/lookups/level-codes/active'),
        axios.get('/hr/employees', { params: { size: 1000 } }),
      ])
      setCriteria((criteriaRes.data?.data ?? []).map((c: any) => ({ id: Number(c.id), name: c.name })))
      setDepartments((deptRes.data?.data ?? []).map((d: any) => ({ id: Number(d.departmentId ?? d.id), name: d.departmentName ?? d.name })))
      setLevelCodes((levelCodeRes.data?.data ?? []).map((levelCode: any) => ({ id: Number(levelCode.id), name: levelCode.code ?? levelCode.name })))
      const employeeRows = empRes.data?.data?.content ?? empRes.data?.data ?? []
      setEmployees(employeeRows.map((e: any) => ({ id: Number(e.employeeId ?? e.id), name: e.employeeName ?? e.name ?? e.email })))
    } catch (error) {
      console.error(error)
      toast.error('Failed to load template options')
    }
  }

  const targetOptions = form.targetType === 'DEPARTMENT' ? departments : form.targetType === 'LEVEL_CODE' ? levelCodes : employees
  const questionNameById = useMemo(() => new Map(criteria.map((item) => [item.id, item.name])), [criteria])
  const activeLimitTypes = new Set(limits.map((limit) => limit.relationshipType))
  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return templates.filter((template) => {
      const matchesTarget = targetFilter === 'ALL' || template.targetType === targetFilter
      const matchesSearch = !query
        || template.templateName.toLowerCase().includes(query)
        || (template.targetName ?? '').toLowerCase().includes(query)
        || targetLabel(template.targetType).toLowerCase().includes(query)
      return matchesTarget && matchesSearch
    })
  }, [searchQuery, targetFilter, templates])
  const activeTemplates = templates.filter((template) => template.status === 'ACTIVE').length
  const assignedQuestions = new Set(templates.flatMap((template) => template.questionIds ?? [])).size

  const openCreate = () => {
    if (!selectedReviewCycleId) return toast.error('Please select a review cycle')
    if (isLocked) return toast.error(LOCK_MESSAGE)
    setForm({ ...emptyTemplate, reviewCycleId: selectedReviewCycleId, reviewCycleName: selectedReviewCycle?.name })
    setShowModal(true)
  }

  const openEdit = (template: FeedbackTemplateConfig) => {
    if (isLocked) return toast.error(LOCK_MESSAGE)
    setForm({ ...template, questionIds: template.questionIds ?? [] })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!selectedReviewCycleId) return toast.error('Review cycle is required')
    if (isLocked) return toast.error(LOCK_MESSAGE)
    if (!form.templateName.trim()) return toast.error('Template name is required')
    if (!form.targetId) return toast.error('Template target is required')
    if (!form.questionIds.length) return toast.error('At least one question is required')
    const targetName = targetOptions.find((item) => item.id === Number(form.targetId))?.name ?? form.targetName ?? ''
    try {
      await saveTemplate({ ...form, reviewCycleId: selectedReviewCycleId, reviewCycleName: selectedReviewCycle?.name, targetId: Number(form.targetId), targetName }).unwrap()
      toast.success(form.id ? 'Template updated' : 'Template created')
      setShowModal(false)
    } catch (error: any) {
      toast.error(error?.data?.message ?? 'Failed to save template')
    }
  }

  const handleDelete = async (id?: number) => {
    if (!id) return
    if (isLocked) return toast.error(LOCK_MESSAGE)
    if (!window.confirm('Delete this feedback template?')) return
    await deleteTemplate(id).unwrap()
    toast.success('Template deleted')
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
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-white">{templates.length}</span>
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Feedback Templates</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-500">Create, configure, and manage feedback question templates across departments, level codes, and individual employees.</p>
          </div>
        </div>
        <button onClick={openCreate} disabled={!selectedReviewCycleId || isLocked} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#2463eb]/20 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
          <Plus size={16} /> Create Template
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Total Templates', templates.length, FileText],
          ['Active Templates', activeTemplates, ClipboardList],
          ['Assigned Questions', assignedQuestions, LayoutGrid],
          ['Available Questions', criteria.length, Filter],
        ].map(([label, value, Icon]) => {
          const StatIcon = Icon as typeof FileText
          return (
            <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label as string}</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{value as number}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <StatIcon size={18} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">Templates</h3>
            <p className="text-xs text-slate-500">{filteredTemplates.length} of {templates.length} template{templates.length === 1 ? '' : 's'}</p>
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
            </select>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${viewMode === 'grid' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                title="Grid view"
              >
                <LayoutGrid size={15} />
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${viewMode === 'table' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                title="Table view"
              >
                <Table2 size={15} />
                Table
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
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-5 py-4">Template Name</th>
                      <th className="px-5 py-4">Target Type</th>
                      <th className="px-5 py-4">Assigned To</th>
                      <th className="px-5 py-4 text-center">Questions</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Updated</th>
                      <th className="px-5 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredTemplates.map((template) => (
                      <tr key={template.id} className="transition hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <p className="font-black text-slate-900">{template.templateName}</p>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-600">{targetLabel(template.targetType)}</td>
                        <td className="px-5 py-4 text-sm text-slate-500">{template.targetName || 'No target name'}</td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex min-w-10 justify-center rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                            {template.questionIds.length}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${template.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{template.status}</span>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-600">{formatDateTime(template.updatedDate ?? template.createdDate)}</td>
                        <td className="px-5 py-4">
                          <div className="flex justify-center gap-1">
                            <button onClick={() => setViewing(template)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="View"><Eye size={16} /></button>
                            {!isLocked && <button onClick={() => openEdit(template)} className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600" title="Edit"><Pencil size={16} /></button>}
                            {!isLocked && <button onClick={() => void handleDelete(template.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 size={16} /></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate text-base font-black text-slate-900">{template.templateName}</h4>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${template.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{template.status}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-600">{targetLabel(template.targetType)}</p>
                      <p className="text-xs text-slate-400">{template.targetName || 'No target name'}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => setViewing(template)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Eye size={16} /></button>
                      {!isLocked && <button onClick={() => openEdit(template)} className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil size={16} /></button>}
                      {!isLocked && <button onClick={() => void handleDelete(template.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Questions</p>
                      <p className="mt-1 font-black text-slate-900">{template.questionIds.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Updated</p>
                      <p className="mt-1 truncate font-semibold text-slate-700">{formatDateTime(template.updatedDate ?? template.createdDate)}</p>
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
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
      {viewing && (
        <DetailsModal title={viewing.templateName} onClose={() => setViewing(null)}>
          <div className="space-y-3 text-sm">
            <p><strong>Target:</strong> {targetLabel(viewing.targetType)} - {viewing.targetName}</p>
            <p><strong>Status:</strong> {viewing.status}</p>
            <div>
              <strong>Assigned Questions</strong>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
                {viewing.questionIds.map((id) => <li key={id}>{questionNameById.get(id) ?? `Question #${id}`}</li>)}
              </ul>
            </div>
          </div>
        </DetailsModal>
      )}
    </section>
  )
}

function TemplateModal({ form, setForm, targetOptions, criteria, isSaving, onClose, onSave }: {
  form: FeedbackTemplateConfig
  setForm: (form: FeedbackTemplateConfig) => void
  targetOptions: Option[]
  criteria: Option[]
  isSaving: boolean
  onClose: () => void
  onSave: () => void
}) {
  const selectedTarget = targetOptions.find((item) => item.id === Number(form.targetId))
  const selectedQuestions = criteria.filter((item) => form.questionIds.includes(item.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <ClipboardList size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black">{form.id ? 'Edit Feedback Template' : 'Create Feedback Template'}</h3>
                <p className="mt-0.5 text-sm text-blue-100">Configure the audience and assign feedback questions.</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"><X size={18} /></button>
          </div>
        </div>

        <div className="grid max-h-[calc(92vh-150px)] gap-0 overflow-auto lg:grid-cols-[1fr_320px]">
          <div className="space-y-5 p-6">
            <section className="rounded-2xl border border-slate-200 p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-sm font-black">1</span>
                <div>
                  <h4 className="font-black text-slate-900">Template Details</h4>
                  <p className="text-xs text-slate-500">Name the template and choose its status.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-400">Template Name</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold focus:border-[#2463eb] focus:outline-none"
                    placeholder="e.g. Engineering Peer Feedback"
                    value={form.templateName}
                    onChange={(e) => setForm({ ...form, templateName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-400">Status</label>
                  <select className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold focus:border-[#2463eb] focus:outline-none" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as FeedbackTemplateConfig['status'] })}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-sm font-black">2</span>
                <div>
                  <h4 className="font-black text-slate-900">Audience</h4>
                  <p className="text-xs text-slate-500">Match the self-assessment audience style by selecting one target type.</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['DEPARTMENT', 'Department', 'Assign to all employees in a department.'],
                  ['LEVEL_CODE', 'Level Code', 'Assign by organization level code.'],
                  ['PERSON', 'Person', 'Assign to one employee.'],
                ].map(([value, label, description]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, targetType: value as FeedbackTemplateConfig['targetType'], targetId: 0 })}
                    className={`rounded-xl border p-4 text-left transition ${form.targetType === value ? 'border-[#2463eb] bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    <p className="font-black text-slate-900">{label}</p>
                    <p className="mt-1 text-xs text-slate-500">{description}</p>
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-400">Target</label>
                <select className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold focus:border-[#2463eb] focus:outline-none" value={form.targetId || ''} onChange={(e) => setForm({ ...form, targetId: Number(e.target.value) })}>
                  <option value="">Select {displayType(form.targetType).replace('_', ' ').toLowerCase()}...</option>
                  {targetOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-sm font-black">3</span>
                  <div>
                    <h4 className="font-black text-slate-900">Question Assignment</h4>
                    <p className="text-xs text-slate-500">Select the criteria/questions included in this template.</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{form.questionIds.length} selected</span>
              </div>
              <div className="grid max-h-72 gap-2 overflow-auto rounded-xl border border-slate-100 bg-slate-50 p-3">
                {criteria.map((item) => (
                  <label key={item.id} className="flex items-start gap-3 rounded-xl bg-white px-3 py-2.5 text-sm shadow-sm ring-1 ring-slate-100">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={form.questionIds.includes(item.id)}
                      onChange={(e) => {
                        const questionIds = e.target.checked
                          ? [...form.questionIds, item.id]
                          : form.questionIds.filter((id) => id !== item.id)
                        setForm({ ...form, questionIds })
                      }}
                    />
                    <span className="font-semibold text-slate-700">{item.name}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <aside className="border-t border-slate-100 bg-slate-50 p-6 lg:border-l lg:border-t-0">
            <h4 className="font-black text-slate-900">Template Preview</h4>
            <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Name</p>
                <p className="mt-1 font-bold text-slate-900">{form.templateName || 'Untitled template'}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Audience</p>
                <p className="mt-1 font-semibold text-slate-700">{targetLabel(form.targetType)}</p>
                <p className="text-xs text-slate-500">{selectedTarget?.name || 'No target selected'}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Questions</p>
                {selectedQuestions.length === 0 ? (
                  <p className="mt-1 text-sm text-slate-500">No questions selected</p>
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
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
          <button onClick={onSave} disabled={isSaving} className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">{isSaving ? 'Saving...' : 'Save Template'}</button>
        </div>
      </div>
    </div>
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

function DetailsModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
