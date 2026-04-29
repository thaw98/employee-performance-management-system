import { useEffect, useMemo, useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { useGetDefaultSignatureQuery, useSaveDrawnSignatureMutation, useUploadSignatureMutation } from '../features/user/userApi'
import { resolveMediaSrc } from '../utils/mediaUrl'
import toast from 'react-hot-toast'
import { Image as ImageIcon, Loader2, PenLine, RotateCcw, Save, Upload } from 'lucide-react'

// Drawn signatures are posted as base64 JSON, so keep payload notably below server max-request-size.
const MAX_DRAWN_SIGNATURE_REQUEST_BYTES = 3 * 1024 * 1024

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const fbqError = error as FetchBaseQueryError & { data?: { message?: unknown }; error?: string }
    if (typeof fbqError.data?.message === 'string' && fbqError.data.message.trim()) {
      return fbqError.data.message
    }
    if (typeof fbqError.error === 'string' && fbqError.error.trim()) {
      return fbqError.error
    }
    if (typeof fbqError.status === 'number') {
      return `Request failed (HTTP ${fbqError.status}).`
    }
    if (typeof fbqError.status === 'string' && fbqError.status.trim()) {
      return `Request failed (${fbqError.status}).`
    }
  }
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: unknown } }).data
    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message
    }
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
    if (typeof status === 'number') {
      return `HTTP_${status}`
    }
    if (typeof status === 'string' && status.trim()) {
      return status.trim().toUpperCase()
    }

    const originalStatus = errorObj.originalStatus
    if (typeof originalStatus === 'number') {
      return `HTTP_${originalStatus}`
    }

    const code = errorObj.code
    if (typeof code === 'string' && code.trim()) {
      return code.trim().toUpperCase()
    }

    const message = typeof errorObj.message === 'string' ? errorObj.message : ''
    const rawError = typeof errorObj.error === 'string' ? errorObj.error : ''
    const combined = `${message} ${rawError}`.toUpperCase()
    if (combined.includes('FAILED TO FETCH') || combined.includes('NETWORKERROR') || combined.includes('NETWORK ERROR')) {
      return 'FETCH_ERROR'
    }

    const name = errorObj.name
    if (typeof name === 'string' && name.trim()) {
      return name.trim().toUpperCase()
    }
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
  // Keep shrinking until the PNG comfortably fits backend request limits.
  let currentCanvas = canvas
  let dataUrl = currentCanvas.toDataURL('image/png')

  while (estimateDataUrlBytes(dataUrl) > MAX_DRAWN_SIGNATURE_REQUEST_BYTES && currentCanvas.width > 120 && currentCanvas.height > 60) {
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

  trimmedContext.putImageData(sourceContext.getImageData(left, top, trimmedCanvas.width, trimmedCanvas.height), 0, 0)
  return trimmedCanvas
}

export function DefaultSignaturePage() {
  const { data: signatureResponse, isLoading } = useGetDefaultSignatureQuery()
  const [saveDrawnSignature, { isLoading: isSavingDrawnSignature }] = useSaveDrawnSignatureMutation()
  const [uploadSignature, { isLoading: isUploadingSignature }] = useUploadSignatureMutation()

  const defaultSignature = signatureResponse?.data || null
  const defaultSignatureSrc = resolveMediaSrc(defaultSignature?.signatureData)
  const signatureCanvasRef = useRef<SignatureCanvas | null>(null)
  const signatureFileInputRef = useRef<HTMLInputElement>(null)

  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw')
  const [signatureFile, setSignatureFile] = useState<File | null>(null)

  const isSignatureSaving = isSavingDrawnSignature || isUploadingSignature
  const signaturePreview = useMemo(() => signatureFile ? URL.createObjectURL(signatureFile) : null, [signatureFile])

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
      const result = await saveDrawnSignature(dataUrl)
      if ('error' in result) {
        const message = getErrorMessage(result.error, '')
        const errorCode = getErrorCodeLabel(result.error)
        toast.error(message ? `Save signature failed [${errorCode}]: ${message}` : `Save signature failed [${errorCode}]`)
        return
      }
      signatureCanvasRef.current.clear()
      toast.success('Default signature saved.')
    } catch (err: unknown) {
      const message = getErrorMessage(err, '')
      const errorCode = getErrorCodeLabel(err)
      toast.error(message ? `Save signature failed [${errorCode}]: ${message}` : `Save signature failed [${errorCode}]`)
    }
  }

  const handleSaveUploadedSignature = async () => {
    try {
      if (!signatureFile) {
        toast.error('Choose a signature image before saving.')
        return
      }
      await uploadSignature(signatureFile).unwrap()
      setSignatureFile(null)
      if (signatureFileInputRef.current) {
        signatureFileInputRef.current.value = ''
      }
      toast.success('Default signature uploaded.')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to upload signature.'))
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Siganture Settings</h1>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          Save the signature that will be used for reviews, approvals, and exports.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all hover:shadow-xl hover:border-blue-50 dark:hover:border-blue-900/30">
        <div className="p-8 sm:p-10 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <PenLine size={20} className="text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Signature Preview</h2>
              </div>
            </div>

            <div className="w-full lg:w-72 min-h-28 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 flex items-center justify-center p-4">
              {isLoading ? (
                <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={24} />
              ) : defaultSignatureSrc ? (
                <img src={defaultSignatureSrc} alt="Current default signature" className="max-h-24 max-w-full object-contain" />
              ) : (
                <div className="text-center text-xs font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">
                  No signature
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10 space-y-6">
          <div className="inline-flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setSignatureMode('draw')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
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
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
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
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 overflow-hidden">
                <SignatureCanvas
                  ref={signatureCanvasRef}
                  penColor="#0f172a"
                  canvasProps={{
                    className: 'w-full h-56 bg-white dark:bg-slate-900',
                  }}
                />
              </div>
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClearSignatureCanvas}
                  disabled={isSignatureSaving}
                  className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw size={15} />
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleSaveDrawnSignature}
                  disabled={isSignatureSaving}
                  className="px-5 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {isSavingDrawnSignature ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save as Default
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
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
                className="w-full min-h-44 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-900 transition-all flex items-center justify-center p-6 disabled:opacity-50"
              >
                {signaturePreview ? (
                  <img src={signaturePreview} alt="Signature upload preview" className="max-h-36 max-w-full object-contain" />
                ) : (
                  <span className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
                    <ImageIcon size={28} />
                    <span className="text-xs font-black uppercase tracking-widest">Choose signature image</span>
                  </span>
                )}
              </button>
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSignatureFile(null)
                    if (signatureFileInputRef.current) signatureFileInputRef.current.value = ''
                  }}
                  disabled={isSignatureSaving || !signatureFile}
                  className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw size={15} />
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleSaveUploadedSignature}
                  disabled={isSignatureSaving}
                  className="px-5 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {isUploadingSignature ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save as Default
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
