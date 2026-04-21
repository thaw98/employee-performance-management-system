import { useRef, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  useValidateEmployeeImportFileMutation,
  useCommitEmployeeImportMutation,
} from '../employeeImportApi'
import type {
  EmployeeImportValidationResponse,
  EmployeeImportCommitResponse,
} from '../employeeImportApi'
import { EmployeeImportValidationSummary } from './EmployeeImportValidationSummary'

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

export default function EmployeeImportModal({ isOpen, onClose, onImportSuccess, token }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [step, setStep] = useState<Step>('upload')
  const [validationResult, setValidationResult] = useState<EmployeeImportValidationResponse | null>(null)
  const [commitResult, setCommitResult] = useState<EmployeeImportCommitResponse | null>(null)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [errorFileLoading, setErrorFileLoading] = useState(false)

  const [validateFile, { isLoading: isValidating }] = useValidateEmployeeImportFileMutation()
  const [commitImport, { isLoading: isCommitting }] = useCommitEmployeeImportMutation()

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
      await downloadBlob('/employees/import/template', 'employee_import_template.xlsx', token)
    } catch {
      toast.error('Failed to download template')
    } finally {
      setTemplateLoading(false)
    }
  }, [token])

  const handleDownloadErrorFile = useCallback(async () => {
    if (!validationResult?.errorFileDownloadUrl) return
    setErrorFileLoading(true)
    try {
      await downloadBlob(
        validationResult.errorFileDownloadUrl,
        `employee_import_errors.xlsx`,
        token
      )
    } catch {
      toast.error('Failed to download error file')
    } finally {
      setErrorFileLoading(false)
    }
  }, [validationResult, token])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow">
              <i className="bi bi-file-earmark-spreadsheet text-white text-lg"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Import Employees</h2>
              <p className="text-xs text-gray-500">Upload .xls or .xlsx file</p>
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
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <i className="bi bi-info-circle text-blue-500 text-lg flex-shrink-0"></i>
                <p className="text-sm text-blue-800">
                  Download the template, fill it in, then upload it here.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  disabled={templateLoading}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-60 transition shrink-0"
                >
                  {templateLoading ? (
                    <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
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
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition group"
                >
                  <i className="bi bi-cloud-upload text-3xl text-gray-300 group-hover:text-indigo-400 transition"></i>
                  {selectedFile ? (
                    <p className="mt-2 text-sm font-medium text-gray-700">{selectedFile.name}</p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-400">Click to browse or drag a .xls / .xlsx file</p>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 'validated' && validationResult && (
            <EmployeeImportValidationSummary
              result={validationResult}
              onDownloadErrorFile={handleDownloadErrorFile}
              errorFileLoading={errorFileLoading}
            />
          )}

          {step === 'success' && commitResult && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <i className="bi bi-check-circle-fill text-emerald-500 text-3xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Import Successful!</h3>
              <p className="text-gray-500 mb-4">{commitResult.message}</p>
              <div className="flex justify-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-600">{commitResult.importedCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Imported</p>
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
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
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
