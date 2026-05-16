const MAX_DRAWN_SIGNATURE_REQUEST_BYTES = 3 * 1024 * 1024

export function estimateDataUrlBytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(',')
  if (commaIndex < 0) return 0
  const base64 = dataUrl.slice(commaIndex + 1)
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

export function exportSignatureDataUrl(canvas: HTMLCanvasElement): string {
  let currentCanvas = canvas
  let dataUrl = currentCanvas.toDataURL('image/png')
  while (
    estimateDataUrlBytes(dataUrl) > MAX_DRAWN_SIGNATURE_REQUEST_BYTES
    && currentCanvas.width > 120
    && currentCanvas.height > 60
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

export function trimSignatureCanvas(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
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
