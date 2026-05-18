import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Loader2, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useSaveDrawnSignatureMutation,
  useSetDefaultSignatureMutation,
} from '../../features/user/userApi'
import { getSignatureErrorMessage } from './signatureErrorUtils'
import {
  estimateDataUrlBytes,
  exportSignatureDataUrl,
  trimSignatureCanvas,
} from './signatureCanvasUtils'

const MAX_DRAWN_SIGNATURE_REQUEST_BYTES = 3 * 1024 * 1024
const CANVAS_WIDTH = 520
const CANVAS_HEIGHT = 144

export type InlineDefaultSignaturePadHandle = {
  saveAsDefault: () => Promise<boolean>
  hasDrawing: () => boolean
}

type InlineDefaultSignaturePadProps = {
  onDrawingChange?: (hasDrawing: boolean) => void
  disabled?: boolean
}

export const InlineDefaultSignaturePad = forwardRef<
  InlineDefaultSignaturePadHandle,
  InlineDefaultSignaturePadProps
>(({ onDrawingChange, disabled = false }, ref) => {
  const signatureCanvasRef = useRef<SignatureCanvas | null>(null)
  const [canvasKey, setCanvasKey] = useState(0)
  const [saveDrawnSignature, { isLoading: isSaving }] = useSaveDrawnSignatureMutation()
  const [setDefaultSignature] = useSetDefaultSignatureMutation()

  const notifyDrawingChange = useCallback(() => {
    const hasDrawing = Boolean(signatureCanvasRef.current && !signatureCanvasRef.current.isEmpty())
    onDrawingChange?.(hasDrawing)
  }, [onDrawingChange])

  const handleClear = () => {
    signatureCanvasRef.current?.clear()
    notifyDrawingChange()
  }

  const saveAsDefault = useCallback(async (): Promise<boolean> => {
    const pad = signatureCanvasRef.current
    if (!pad || pad.isEmpty()) {
      toast.error('Draw your signature before submitting.')
      return false
    }

    try {
      const canvas = pad.getCanvas()
      if (canvas.width < 2 || canvas.height < 2) {
        toast.error('Signature pad is not ready yet. Please wait a moment and try again.')
        return false
      }

      const trimmedCanvas = trimSignatureCanvas(canvas)
      const dataUrl = exportSignatureDataUrl(trimmedCanvas)
      if (estimateDataUrlBytes(dataUrl) > MAX_DRAWN_SIGNATURE_REQUEST_BYTES) {
        toast.error('Signature is too detailed. Please draw a simpler signature and try again.')
        return false
      }

      const saved = await saveDrawnSignature({ signaturePngDataUrl: dataUrl }).unwrap()
      const savedSignature = saved?.data
      const savedSignatureId = savedSignature?.id
      if (!savedSignatureId) {
        toast.error('Signature saved, but could not set it as default.')
        return false
      }
      if (!savedSignature.isDefault) {
        await setDefaultSignature(savedSignatureId).unwrap()
      }
      return true
    } catch (error: unknown) {
      toast.error(getSignatureErrorMessage(error, 'Failed to save signature. Please try again.'))
      return false
    }
  }, [saveDrawnSignature, setDefaultSignature])

  useImperativeHandle(ref, () => ({
    saveAsDefault,
    hasDrawing: () => Boolean(signatureCanvasRef.current && !signatureCanvasRef.current.isEmpty()),
  }), [saveAsDefault])

  return (
    <div className="mt-3 space-y-2">
      <div className="relative overflow-hidden rounded-xl border border-amber-300/80 bg-white dark:border-amber-700/50 dark:bg-slate-900">
        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 select-none text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-300 dark:text-slate-600">
          Sign here
        </div>
        <SignatureCanvas
          key={canvasKey}
          ref={signatureCanvasRef}
          clearOnResize={false}
          penColor="#0f172a"
          onEnd={notifyDrawingChange}
          canvasProps={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            className: 'h-36 w-full touch-none',
          }}
        />
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            handleClear()
            setCanvasKey((k) => k + 1)
          }}
          disabled={disabled || isSaving}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/80 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-700/50 dark:bg-slate-900 dark:text-amber-100 dark:hover:bg-amber-950/30"
        >
          {isSaving ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
          Clear
        </button>
      </div>
    </div>
  )
})

InlineDefaultSignaturePad.displayName = 'InlineDefaultSignaturePad'
