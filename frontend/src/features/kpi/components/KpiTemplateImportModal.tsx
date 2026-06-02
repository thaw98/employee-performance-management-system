import { useRef, useState, useCallback, useMemo } from 'react'
import { Download, Upload, X, Trash2, Plus, CheckCircle2, AlertCircle, FileSpreadsheet, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useValidateKpiTemplateImportMutation,
  useCreateKpiTemplateFromImportMutation,
} from '../kpiTemplateApi'
import type {
  KpiTemplateImportValidationResponse,
  KpiTemplateImportValidRow,
  KpiTemplateImportCreateRequest,
} from '../kpiTemplateApi'
import { useGetDepartmentsQuery } from '../../../features/department/api/departmentApi'
import { useGetPositionsByDepartmentQuery } from '../../../features/position/api/positionApi'
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'

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

interface Props {
  isOpen: boolean
  onClose: () => void
  onImportSuccess: () => void
  token: string | null
}

type Step = 'upload' | 'review' | 'success'

export default function KpiTemplateImportModal({ isOpen, onClose, onImportSuccess, token }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [step, setStep] = useState<Step>('upload')
  const [validationResult, setValidationResult] = useState<KpiTemplateImportValidationResponse | null>(null)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [editedRows, setEditedRows] = useState<KpiTemplateImportValidRow[]>([])
  const [templateName, setTemplateName] = useState('')
  const [scopeType, setScopeType] = useState<'INDIVIDUAL' | 'DEPARTMENT' | 'POSITION'>('INDIVIDUAL')
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null)
  const [selectedPosId, setSelectedPosId] = useState<number | null>(null)
  const [deptQuery, setDeptQuery] = useState('')

  const [validateFile, { isLoading: isValidating }] = useValidateKpiTemplateImportMutation()
  const [createFromImport, { isLoading: isCreating }] = useCreateKpiTemplateFromImportMutation()

  const { data: deptsResponse } = useGetDepartmentsQuery()
  const departments = deptsResponse?.data || []
  const { data: positionsResponse } = useGetPositionsByDepartmentQuery(selectedDeptId!, { skip: !selectedDeptId })
  const positions = positionsResponse?.data || []

  const filteredDepartments = useMemo(() => {
    const query = deptQuery.trim().toLowerCase()
    if (!query) return departments
    return departments.filter((dept: any) => dept.departmentName.toLowerCase().includes(query))
  }, [departments, deptQuery])

  const totalWeight = useMemo(() => {
    return editedRows.reduce((sum, row) => sum + (Number(row.weight) || 0), 0)
  }, [editedRows])

  const canSubmit = useMemo(() => {
    const isScopeSelectionValid =
      scopeType === 'INDIVIDUAL' ||
      (scopeType === 'DEPARTMENT' && selectedDeptId !== null) ||
      (scopeType === 'POSITION' && selectedDeptId !== null && selectedPosId !== null)

    return (
      templateName.trim() !== '' &&
      editedRows.length > 0 &&
      totalWeight === 100 &&
      isScopeSelectionValid &&
      validationResult &&
      validationResult.invalidRowsData.length === 0
    )
  }, [templateName, editedRows, totalWeight, scopeType, selectedDeptId, selectedPosId, validationResult])

  const handleClose = useCallback(() => {
    setSelectedFile(null)
    setStep('upload')
    setValidationResult(null)
    setEditedRows([])
    setTemplateName('')
    setScopeType('INDIVIDUAL')
    setSelectedDeptId(null)
    setSelectedPosId(null)
    setDeptQuery('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }, [onClose])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
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
      await downloadBlob('/kpi-templates/import/template', 'kpi_template_import_template.xlsx', token)
    } catch {
      toast.error('Failed to download template')
    } finally {
      setTemplateLoading(false)
    }
  }, [token])

  const handleRowEdit = useCallback((index: number, field: keyof KpiTemplateImportValidRow, value: any) => {
    setEditedRows((prev) => {
      const next = [...prev]
      ;(next[index] as any)[field] = value
      return next
    })
  }, [])

  const handleRemoveRow = useCallback((index: number) => {
    setEditedRows((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleAddRow = useCallback(() => {
    setEditedRows((prev) => [
      ...prev,
      { rowNumber: prev.length + 2, name: '', category: '', target: '', unit: null, weight: 0 },
    ])
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return

    const payload: KpiTemplateImportCreateRequest = {
      name: templateName.trim(),
      type: scopeType,
      departmentId: scopeType !== 'INDIVIDUAL' ? selectedDeptId ?? undefined : undefined,
      positionId: scopeType === 'POSITION' ? selectedPosId ?? undefined : undefined,
      items: editedRows.map((r) => ({
        name: r.name,
        category: r.category,
        target: r.target,
        unit: r.unit,
        weight: r.weight,
      })),
    }

    let res: { success: boolean; message: string } | null = null
    try {
      res = await createFromImport(payload).unwrap()
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } }
      toast.error(e.data?.message || 'Failed to create template')
      return
    }

    if (!res?.success) {
      toast.error(res?.message || 'Failed to create template')
      return
    }

    toast.success('KPI template created successfully')
    setStep('success')

    try {
      onImportSuccess()
    } catch {
      toast.error('Template created, but failed to refresh KPI lists')
    }
  }, [canSubmit, templateName, scopeType, selectedDeptId, selectedPosId, editedRows, createFromImport, onImportSuccess])

  if (!isOpen) return null

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
              <h2 className="text-lg font-bold text-gray-900">Import KPI Template from Excel</h2>
              <p className="text-xs text-gray-500">Upload a .xlsx file with KPI definitions</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <div className="space-y-5">
              {/* Template hint */}
              <div className="flex items-center gap-3 p-4 bg-[#eff6ff] rounded-xl border border-[#bfdbfe]">
                <AlertCircle className="text-[#2463eb] flex-shrink-0" size={18} />
                <p className="text-sm text-[#1e40af]">
                  Download the template (Instructions, Sample Data, and KPI Template sheets), fill in the KPI Template sheet, then upload it here.
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

              {/* File input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Excel File (.xlsx)
                </label>
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

          {step === 'review' && validationResult && (
            <div className="space-y-5">
              {/* Scope & Name */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Template Name *</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Sales Team Q1"
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 outline-none transition-colors focus:border-[#bfdbfe] focus:ring-2 focus:ring-[#dbeafe]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Template Scope *</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {(['INDIVIDUAL', 'DEPARTMENT', 'POSITION'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => { setScopeType(t); setSelectedDeptId(null); setSelectedPosId(null) }}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${scopeType === t ? 'bg-white text-[#2463eb] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                {scopeType !== 'INDIVIDUAL' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Department *</label>
                    <div className="relative min-w-[180px]">
                      <Combobox
                        value={departments.find((d: any) => d.departmentId === selectedDeptId) ?? null}
                        onChange={(dept: any | null) => {
                          setSelectedDeptId(dept ? dept.departmentId : null)
                          setSelectedPosId(null)
                        }}
                        nullable
                      >
                        <ComboboxInput
                          className="w-full border-0 bg-slate-50 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#dbeafe] outline-none placeholder:font-medium placeholder:text-slate-400"
                          displayValue={(dept: any | null) => dept?.departmentName ?? ''}
                          onChange={(e) => setDeptQuery(e.target.value)}
                          placeholder="Select Department"
                          autoComplete="off"
                        />
                        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center text-slate-400 pr-3">
                          <ChevronDown size={14} />
                        </ComboboxButton>
                        <ComboboxOptions
                          anchor="bottom start"
                          className="z-50 mt-1 max-h-60 w-(--anchor-width) min-w-[220px] overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg focus:outline-none"
                        >
                          {filteredDepartments.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-slate-500">No departments found</div>
                          ) : (
                            filteredDepartments.map((dept: any) => (
                              <ComboboxOption
                                key={dept.departmentId}
                                value={dept}
                                className="cursor-pointer px-3 py-2 text-sm text-slate-800 data-focus:bg-[#eff6ff] data-selected:font-semibold data-selected:text-[#1d4ed8]"
                              >
                                {dept.departmentName}
                              </ComboboxOption>
                            ))
                          )}
                        </ComboboxOptions>
                      </Combobox>
                    </div>
                  </div>
                )}
                {scopeType === 'POSITION' && selectedDeptId && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Position *</label>
                    <div className="relative min-w-[180px]">
                      <Combobox
                        value={positions.find((p: any) => p.positionId === selectedPosId) ?? null}
                        onChange={(pos: any | null) => setSelectedPosId(pos ? pos.positionId : null)}
                        nullable
                      >
                        <ComboboxInput
                          className="w-full border-0 bg-slate-50 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#dbeafe] outline-none placeholder:font-medium placeholder:text-slate-400"
                          displayValue={(pos: any | null) => pos?.positionName ?? ''}
                          placeholder="Select Position"
                          autoComplete="off"
                        />
                        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center text-slate-400 pr-3">
                          <ChevronDown size={14} />
                        </ComboboxButton>
                        <ComboboxOptions
                          anchor="bottom start"
                          className="z-50 mt-1 max-h-60 w-(--anchor-width) min-w-[220px] overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg focus:outline-none"
                        >
                          {positions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-slate-500">No positions found</div>
                          ) : (
                            positions.map((pos: any) => (
                              <ComboboxOption
                                key={pos.positionId}
                                value={pos}
                                className="cursor-pointer px-3 py-2 text-sm text-slate-800 data-focus:bg-[#eff6ff] data-selected:font-semibold data-selected:text-[#1d4ed8]"
                              >
                                {pos.positionName}
                              </ComboboxOption>
                            ))
                          )}
                        </ComboboxOptions>
                      </Combobox>
                    </div>
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
                <div className={`ml-auto px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${totalWeight === 100 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                  Total Weight: {totalWeight}%
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
                          {row.rowNumber > 0 && (
                            <p className="text-xs font-bold text-red-900">Row {row.rowNumber}</p>
                          )}
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
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">KPI Items ({editedRows.length})</h4>
                    <button
                      onClick={handleAddRow}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-[#bfdbfe] text-[#1d4ed8] rounded-lg hover:bg-[#eff6ff] transition"
                    >
                      <Plus size={14} /> Add Row
                    </button>
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                          <th className="py-3 px-4">KPI Name</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Target</th>
                          <th className="py-3 px-4">Unit</th>
                          <th className="py-3 px-4 text-center">Weight (%)</th>
                          <th className="py-3 px-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {editedRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                            <td className="py-2 px-4">
                              <input
                                type="text"
                                className="w-full min-w-[140px] bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#dbeafe]"
                                value={row.name}
                                onChange={(e) => handleRowEdit(idx, 'name', e.target.value)}
                              />
                            </td>
                            <td className="py-2 px-4">
                              <input
                                type="text"
                                className="w-full min-w-[120px] bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#dbeafe]"
                                value={row.category}
                                onChange={(e) => handleRowEdit(idx, 'category', e.target.value)}
                              />
                            </td>
                            <td className="py-2 px-4">
                              <input
                                type="text"
                                className="w-full min-w-[140px] bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#dbeafe]"
                                value={row.target}
                                onChange={(e) => handleRowEdit(idx, 'target', e.target.value)}
                              />
                            </td>
                            <td className="py-2 px-4">
                              <input
                                type="text"
                                className="w-full min-w-[80px] bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#dbeafe]"
                                value={row.unit || ''}
                                placeholder="Optional"
                                onChange={(e) => handleRowEdit(idx, 'unit', e.target.value || null)}
                              />
                            </td>
                            <td className="py-2 px-4 text-center">
                              <input
                                type="number"
                                className="w-20 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-black text-[#2463eb] text-center outline-none focus:ring-2 focus:ring-[#dbeafe]"
                                value={row.weight}
                                onChange={(e) => handleRowEdit(idx, 'weight', Number(e.target.value))}
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
                      <tfoot>
                        <tr className="bg-slate-50/50 border-t border-slate-100">
                          <td colSpan={4} className="py-3 px-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</td>
                          <td className={`py-3 px-4 text-center text-sm font-black ${totalWeight === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {totalWeight}%
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Template Created Successfully!</h3>
              <p className="text-gray-500">Your KPI template has been saved and is ready to use.</p>
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
                disabled={isValidating || isCreating}
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
                    <Upload size={16} />
                  )}
                  Validate File
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
                      <CheckCircle2 size={16} />
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
