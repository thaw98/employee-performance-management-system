import { useRef, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  useValidateAppraisalImportFileMutation,
  useCommitAppraisalImportMutation,
} from './appraisalImportApi'
import type {
  AppraisalImportValidationResponse,
  AppraisalImportCommitResponse,
} from './appraisalImportApi'

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

type Step = 'upload' | 'validated' | 'success'

export default function AppraisalImportModal({ isOpen, onClose, onImportSuccess, token }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [step, setStep] = useState<Step>('upload')
  const [validationResult, setValidationResult] = useState<AppraisalImportValidationResponse | null>(null)
  const [commitResult, setCommitResult] = useState<AppraisalImportCommitResponse | null>(null)
  const [templateLoading, setTemplateLoading] = useState(false)

  const [validateFile, { isLoading: isValidating }] = useValidateAppraisalImportFileMutation()
  const [commitImport, { isLoading: isCommitting }] = useCommitAppraisalImportMutation()

  const handleClose = useCallback(() => {
    setSelectedFile(null)
    setStep('upload')
    setValidationResult(null)
    setCommitResult(null)
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
        setStep('validated')
      } else {
        toast.error(res.message || 'Validation failed')
      }
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } }
      toast.error(e.data?.message || 'Validation failed')
    }
  }, [selectedFile, validateFile])

  const handleCommit = useCallback(async () => {
    if (!validationResult?.validationId) return
    try {
      const res = await commitImport({ validationId: validationResult.validationId }).unwrap()
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
  }, [validationResult, commitImport, onImportSuccess])

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

  if (!isOpen) return null

  // Group valid items by category for preview
  const groupedValid: Record<string, { rowNumber: number; questionText: string }[]> = {}
  if (validationResult?.validItems) {
    for (const item of validationResult.validItems) {
      const cat = item.rowData['categoryName'] || 'Unknown'
      if (!groupedValid[cat]) groupedValid[cat] = []
      groupedValid[cat].push({
        rowNumber: item.rowNumber,
        questionText: item.rowData['questionText'] || '',
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#eff6ff] to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] flex items-center justify-center shadow shadow-[#dbeafe]">
              <i className="bi bi-file-earmark-spreadsheet text-white text-lg"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Import Appraisal Template</h2>
              <p className="text-xs text-gray-500">Upload .xlsx file with categories and questions</p>
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
          {step === 'upload' && (
            <div className="space-y-5">
              {/* Template hint */}
              <div className="flex items-center gap-3 p-4 bg-[#eff6ff] rounded-xl border border-[#bfdbfe]">
                <i className="bi bi-info-circle text-[#2463eb] text-lg flex-shrink-0"></i>
                <p className="text-sm text-[#1e40af]">
                  Download the template (Instructions, Sample Data, and Appraisal Template sheets), fill in the
                  Appraisal Template sheet only, then upload it here.
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

              {/* File input */}
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

          {step === 'validated' && validationResult && (
            <div className="space-y-5">
              {/* Summary cards */}
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

              {/* File name */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <i className="bi bi-file-earmark-spreadsheet text-emerald-500"></i>
                <span>{validationResult.fileName}</span>
              </div>

              {/* Action messages */}
              {validationResult.validRows > 0 && validationResult.invalidRows === 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800">
                  <i className="bi bi-check-circle mr-2"></i>
                  All {validationResult.validRows} rows are valid and ready to import.
                </div>
              )}

              {validationResult.validRows > 0 && validationResult.invalidRows > 0 && (
                <div className="p-4 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl text-sm text-[#1e40af]">
                  <i className="bi bi-info-circle mr-2"></i>
                  {validationResult.validRows} valid rows can be imported. {validationResult.invalidRows} rows will be skipped due to errors.
                </div>
              )}

              {validationResult.validRows === 0 && validationResult.invalidRows > 0 && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-800">
                  <i className="bi bi-x-circle mr-2"></i>
                  All rows have errors. Please fix them and re-upload.
                </div>
              )}

              {/* Valid items preview grouped by category */}
              {validationResult.validRows > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <i className="bi bi-check-circle text-emerald-500"></i>
                    Valid Rows Preview ({validationResult.validRows})
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {Object.entries(groupedValid).map(([catName, questions]) => (
                      <div key={catName} className="bg-emerald-50/50 rounded-xl border border-emerald-100 p-3">
                        <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-2">{catName}</div>
                        <ul className="space-y-1">
                          {questions.map((q) => (
                            <li key={q.rowNumber} className="text-xs text-gray-600 flex items-start gap-2">
                              <span className="text-gray-400 font-mono shrink-0">Row {q.rowNumber}:</span>
                              <span>{q.questionText}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invalid rows */}
              {validationResult.invalidRows > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <i className="bi bi-exclamation-circle text-red-500"></i>
                    Failed Rows ({validationResult.invalidRows})
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
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
                          <tr key={item.rowNumber} className="border-b border-gray-100 hover:bg-red-50/40 transition">
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
            </div>
          )}

          {step === 'success' && commitResult && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <i className="bi bi-check-circle-fill text-emerald-500 text-3xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Import Successful!</h3>
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

              {step === 'validated' && validationResult && validationResult.validRows > 0 && (
                <button
                  onClick={handleCommit}
                  disabled={isCommitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {isCommitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="bi bi-cloud-upload"></i>
                  )}
                  Import {validationResult.validRows} Valid Rows
                </button>
              )}

              {step === 'validated' && (
                <button
                  onClick={() => {
                    setStep('upload')
                    setValidationResult(null)
                    setSelectedFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition"
                >
                  <i className="bi bi-arrow-left"></i>
                  Back
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
