import { useEffect, useMemo, useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import {
  useGetAllSignaturesQuery,
  useSaveDrawnSignatureMutation,
  useUploadSignatureMutation,
  useSetDefaultSignatureMutation,
  useDeleteSignatureMutation,
} from '../features/user/userApi'
import { resolveMediaSrc } from '../utils/mediaUrl'
import toast from 'react-hot-toast'
import {
  PenLine,
  Loader2,
  RotateCcw,
  Save,
  Upload,
  ImageIcon,
  FileCheck2,
  ShieldCheck,
  Lightbulb,
  PenTool,
  ChevronRight,
  Clock,
  Trash2,
  Star,
  CheckCircle2,
  X,
} from 'lucide-react'

const MAX_DRAWN_SIGNATURE_REQUEST_BYTES = 3 * 1024 * 1024

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const fbqError = error as FetchBaseQueryError & {
      data?: { message?: unknown }
      error?: string
    }
    if (typeof fbqError.data?.message === 'string' && fbqError.data.message.trim())
      return fbqError.data.message
    if (typeof fbqError.error === 'string' && fbqError.error.trim()) return fbqError.error
    if (typeof fbqError.status === 'number') return `Request failed (HTTP ${fbqError.status}).`
    if (typeof fbqError.status === 'string' && fbqError.status.trim())
      return `Request failed (${fbqError.status}).`
  }
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: unknown } }).data
    if (typeof data?.message === 'string' && data.message.trim()) return data.message
  }
  return fallback
}

function getErrorCodeLabel(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as {
      status?: unknown
      originalStatus?: unknown
      code?: unknown
      name?: unknown
      message?: unknown
      error?: unknown
    }
    const status = errorObj.status
    if (typeof status === 'number') return `HTTP_${status}`
    if (typeof status === 'string' && status.trim()) return status.trim().toUpperCase()
    const originalStatus = errorObj.originalStatus
    if (typeof originalStatus === 'number') return `HTTP_${originalStatus}`
    const code = errorObj.code
    if (typeof code === 'string' && code.trim()) return code.trim().toUpperCase()
    const message = typeof errorObj.message === 'string' ? errorObj.message : ''
    const rawError = typeof errorObj.error === 'string' ? errorObj.error : ''
    const combined = `${message} ${rawError}`.toUpperCase()
    if (
      combined.includes('FAILED TO FETCH') ||
      combined.includes('NETWORKERROR') ||
      combined.includes('NETWORK ERROR')
    )
      return 'FETCH_ERROR'
    const name = errorObj.name
    if (typeof name === 'string' && name.trim()) return name.trim().toUpperCase()
  }
  return 'CLIENT_ERROR'
}

function estimateDataUrlBytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(',')
  if (commaIndex < 0) return 0
  const base64 = dataUrl.slice(commaIndex + 1)
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

function exportSignatureDataUrl(canvas: HTMLCanvasElement): string {
  let currentCanvas = canvas
  let dataUrl = currentCanvas.toDataURL('image/png')
  while (
    estimateDataUrlBytes(dataUrl) > MAX_DRAWN_SIGNATURE_REQUEST_BYTES &&
    currentCanvas.width > 120 &&
    currentCanvas.height > 60
  ) {
    const nextCanvas = document.createElement('canvas')
    nextCanvas.width = Math.floor(currentCanvas.width * 0.8)
    nextCanvas.height = Math.floor(currentCanvas.height * 0.8)
    const ctx = nextCanvas.getContext('2d')
    if (!ctx) break
    ctx.drawImage(currentCanvas, 0, 0, nextCanvas.width, nextCanvas.height)
    currentCanvas = nextCanvas
    dataUrl = currentCanvas.toDataURL('image/png')
  }
  return dataUrl
}

function trimSignatureCanvas(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const sourceContext = sourceCanvas.getContext('2d')
  if (!sourceContext) return sourceCanvas
  const { width, height } = sourceCanvas
  const pixels = sourceContext.getImageData(0, 0, width, height)
  const data = pixels.data
  let top = height
  let right = 0
  let bottom = 0
  let left = width
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha === 0) continue
      if (x < left) left = x
      if (x > right) right = x
      if (y < top) top = y
      if (y > bottom) bottom = y
    }
  }
  if (left > right || top > bottom) return sourceCanvas
  const trimmedCanvas = document.createElement('canvas')
  trimmedCanvas.width = right - left + 1
  trimmedCanvas.height = bottom - top + 1
  const trimmedContext = trimmedCanvas.getContext('2d')
  if (!trimmedContext) return sourceCanvas
  trimmedContext.putImageData(
    sourceContext.getImageData(left, top, trimmedCanvas.width, trimmedCanvas.height),
    0,
    0,
  )
  return trimmedCanvas
}

const PEN_COLORS = [
  { value: '#0f172a', label: 'Dark' },
  { value: '#1e40af', label: 'Blue' },
  { value: '#374151', label: 'Gray' },
] as const

export function DefaultSignaturePage() {
  const { data: signaturesResponse, isLoading: isLoadingSignatures } = useGetAllSignaturesQuery()
  const [saveDrawnSignature, { isLoading: isSavingDrawnSignature }] =
    useSaveDrawnSignatureMutation()
  const [uploadSignature, { isLoading: isUploadingSignature }] = useUploadSignatureMutation()
  const [setDefaultSignature, { isLoading: isSettingDefault }] = useSetDefaultSignatureMutation()
  const [deleteSignature, { isLoading: isDeleting }] = useDeleteSignatureMutation()

  const signatures = signaturesResponse?.data || []
  const signatureCanvasRef = useRef<SignatureCanvas | null>(null)
  const signatureFileInputRef = useRef<HTMLInputElement>(null)

  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw')
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [penColor, setPenColor] = useState('#0f172a')
  const [canvasKey, setCanvasKey] = useState(0)
  const [signatureNameInput, setSignatureNameInput] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const isSignatureSaving = isSavingDrawnSignature || isUploadingSignature
  const signaturePreview = useMemo(
    () => (signatureFile ? URL.createObjectURL(signatureFile) : null),
    [signatureFile],
  )

  useEffect(() => {
    if (!signaturePreview) return
    return () => URL.revokeObjectURL(signaturePreview)
  }, [signaturePreview])

  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Signature image size exceeds 5MB.')
      return
    }
    setSignatureFile(file)
  }

  const handleClearSignatureCanvas = () => {
    signatureCanvasRef.current?.clear()
  }

  const handlePenColorChange = (color: string) => {
    const hasContent = signatureCanvasRef.current && !signatureCanvasRef.current.isEmpty()
    setPenColor(color)
    if (hasContent) {
      setCanvasKey((k) => k + 1)
    }
  }

  const handleSaveDrawnSignature = async () => {
    try {
      if (!signatureCanvasRef.current || signatureCanvasRef.current.isEmpty()) {
        toast.error('Draw your signature before saving.')
        return
      }
      const trimmedCanvas = trimSignatureCanvas(signatureCanvasRef.current.getCanvas())
      const dataUrl = exportSignatureDataUrl(trimmedCanvas)
      if (estimateDataUrlBytes(dataUrl) > MAX_DRAWN_SIGNATURE_REQUEST_BYTES) {
        toast.error('Signature is too detailed. Please draw a simpler signature and try again.')
        return
      }
      const result = await saveDrawnSignature({
        signaturePngDataUrl: dataUrl,
        name: signatureNameInput.trim() || undefined,
      })
      if ('error' in result) {
        const message = getErrorMessage(result.error, '')
        const errorCode = getErrorCodeLabel(result.error)
        toast.error(
          message
            ? `Save signature failed [${errorCode}]: ${message}`
            : `Save signature failed [${errorCode}]`,
        )
        return
      }
      signatureCanvasRef.current.clear()
      setSignatureNameInput('')
      toast.success('Signature saved.')
    } catch (err: unknown) {
      const message = getErrorMessage(err, '')
      const errorCode = getErrorCodeLabel(err)
      toast.error(
        message
          ? `Save signature failed [${errorCode}]: ${message}`
          : `Save signature failed [${errorCode}]`,
      )
    }
  }

  const handleSaveUploadedSignature = async () => {
    try {
      if (!signatureFile) {
        toast.error('Choose a signature image before saving.')
        return
      }
      await uploadSignature({
        file: signatureFile,
        name: signatureNameInput.trim() || undefined,
      }).unwrap()
      setSignatureFile(null)
      setSignatureNameInput('')
      if (signatureFileInputRef.current) {
        signatureFileInputRef.current.value = ''
      }
      toast.success('Signature uploaded.')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to upload signature.'))
    }
  }

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultSignature(id).unwrap()
      toast.success('Default signature updated.')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to set default signature.'))
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteSignature(id).unwrap()
      setDeleteConfirmId(null)
      toast.success('Signature deleted.')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to delete signature.'))
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 max-w-sm mx-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Delete Signature
              </h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed">
              Are you sure you want to delete this signature? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black shadow-lg shadow-red-600/30 hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Signature Settings
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
          Create and manage your default signature used for reviews, approvals, and document exports across the platform.
        </p>
      </div>

      <div className="space-y-8">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all hover:shadow-xl hover:border-blue-50 dark:hover:border-blue-900/30">
          <div className="p-8 sm:p-10 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50/80 to-blue-50/30 dark:from-slate-800/10 dark:to-blue-900/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <FileCheck2 size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  My Signatures
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  Manage your saved signatures
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            {isLoadingSignatures ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={28} />
              </div>
            ) : signatures.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <PenLine size={32} className="text-slate-200 dark:text-slate-700" />
                <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  No signatures yet
                </span>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Create your first signature below
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {signatures.map((sig) => (
                  <div
                    key={sig.id}
                    className={`rounded-2xl border-2 overflow-hidden transition-all hover:shadow-md ${
                      sig.isDefault
                        ? 'border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-900/10'
                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950'
                    }`}
                  >
                    <div className="p-4 flex flex-col items-center">
                      <div className="w-full rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-950 p-3 flex items-center justify-center min-h-[80px] mb-3">
                        <img
                          src={resolveMediaSrc(sig.signatureData)}
                          alt={sig.name || 'Signature'}
                          className="max-h-16 max-w-full object-contain"
                        />
                      </div>
                      <div className="w-full flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                          {sig.name || 'Untitled'}
                        </span>
                        {sig.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider">
                            <Star size={10} />
                            Default
                          </span>
                        )}
                      </div>
                      <div className="w-full flex items-center gap-2">
                        {sig.isDefault ? (
                          <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider">
                            <CheckCircle2 size={12} />
                            Active
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(sig.id)}
                            disabled={isSettingDefault}
                            className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-50"
                          >
                            Set as Default
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(sig.id)}
                          disabled={isDeleting || signatures.length <= 1}
                          title={signatures.length <= 1 ? 'Cannot delete the last signature' : 'Delete signature'}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all hover:shadow-xl hover:border-blue-50 dark:hover:border-blue-900/30">
          <div className="p-8 sm:p-10 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center">
                <PenTool size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-200 uppercase tracking-widest">
                  Create New Signature
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  Choose your preferred method
                </p>
              </div>
            </div>

            <div className="inline-flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1.5">
              <button
                type="button"
                onClick={() => setSignatureMode('draw')}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  signatureMode === 'draw'
                    ? 'bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <PenLine size={14} />
                Draw
              </button>
              <button
                type="button"
                onClick={() => setSignatureMode('upload')}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  signatureMode === 'upload'
                    ? 'bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Upload size={14} />
                Upload
              </button>
            </div>

            {signatureMode === 'draw' ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
                    Ink Color
                  </span>
                  <div className="flex items-center gap-2">
                    {PEN_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => handlePenColorChange(color.value)}
                        className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                          penColor === color.value
                            ? 'border-blue-500 scale-110 shadow-md'
                            : 'border-slate-200 dark:border-slate-700 hover:scale-105'
                        }`}
                        title={color.label}
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color.value }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden shadow-inner relative">
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-200 dark:text-slate-700 uppercase tracking-[0.2em] pointer-events-none select-none">
                    Sign here
                  </div>
                  <SignatureCanvas
                    key={canvasKey}
                    ref={signatureCanvasRef}
                    penColor={penColor}
                    canvasProps={{
                      className: 'w-full h-56',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 mb-2">
                    Signature name (optional)
                  </label>
                  <input
                    type="text"
                    value={signatureNameInput}
                    onChange={(e) => setSignatureNameInput(e.target.value.slice(0, 50))}
                    placeholder="e.g. Formal, Quick sign..."
                    maxLength={50}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClearSignatureCanvas}
                    disabled={isSignatureSaving}
                    className="px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <RotateCcw size={15} />
                    Clear Canvas
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDrawnSignature}
                    disabled={isSignatureSaving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {isSavingDrawnSignature ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Save Signature
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <input
                  ref={signatureFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSignatureFileChange}
                />
                <button
                  type="button"
                  onClick={() => signatureFileInputRef.current?.click()}
                  disabled={isSignatureSaving}
                  className="w-full min-h-48 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-600 transition-all flex flex-col items-center justify-center p-8 disabled:opacity-50 group"
                >
                  {signaturePreview ? (
                    <img
                      src={signaturePreview}
                      alt="Signature upload preview"
                      className="max-h-36 max-w-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                        <ImageIcon
                          size={28}
                          className="text-slate-300 dark:text-slate-600 group-hover:text-blue-400 transition-colors"
                        />
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors">
                          Click to upload signature image
                        </span>
                        <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1 font-medium">
                          PNG, JPG, or SVG up to 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </button>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 mb-2">
                    Signature name (optional)
                  </label>
                  <input
                    type="text"
                    value={signatureNameInput}
                    onChange={(e) => setSignatureNameInput(e.target.value.slice(0, 50))}
                    placeholder="e.g. Formal, Quick sign..."
                    maxLength={50}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSignatureFile(null)
                      if (signatureFileInputRef.current) signatureFileInputRef.current.value = ''
                    }}
                    disabled={isSignatureSaving || !signatureFile}
                    className="px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <RotateCcw size={15} />
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveUploadedSignature}
                    disabled={isSignatureSaving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {isUploadingSignature ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Save Signature
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                <Lightbulb size={20} />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-200 tracking-tight">
                Tips for a Great Signature
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: <PenLine size={16} />,
                  title: 'Draw Clearly',
                  description: 'Use smooth, confident strokes. A simpler signature reproduces better on documents.',
                },
                {
                  icon: <ShieldCheck size={16} />,
                  title: 'Stay Consistent',
                  description: 'Your saved signature is used across all approvals and reviews. Keep it professional.',
                },
                {
                  icon: <ImageIcon size={16} />,
                  title: 'Upload High Quality',
                  description: 'For uploaded images, use a transparent PNG with a dark ink color for best results.',
                },
              ].map((tip) => (
                <div
                  key={tip.title}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 shadow-sm">
                    {tip.icon}
                  </div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                    {tip.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {tip.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border border-transparent dark:border-slate-800 transition-all">
          <div className="absolute top-0 right-0 h-64 w-64 bg-violet-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 h-32 w-32 bg-blue-600/10 rounded-full blur-[60px] -ml-16 -mb-16" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <ShieldCheck size={24} className="text-violet-400" />
                <h2 className="text-xl font-black tracking-tight">Legally Binding</h2>
              </div>
              <p className="text-slate-400 font-bold max-w-md text-sm leading-relaxed">
                Your digital signature is uniquely tied to your account and carries the same
                validity as a handwritten signature for all internal approvals.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
              <ChevronRight size={16} className="text-violet-400" />
              Protected by your account credentials
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
