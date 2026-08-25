/**
 * Smart Signature Extractor & Background Removal Engine
 * Extracts handwritten ink from photos, receipt paper, or scans
 * Supports adaptive thresholding, auto-trimming, and ink recoloring.
 */

export type InkColorMode = 'original' | 'black' | 'navy' | 'red'

export interface CropRect {
  x: number // ratio 0..1 or pixel
  y: number
  width: number
  height: number
}

// Convert image + crop rect + threshold to clean transparent PNG
export function extractSignature(
  img: HTMLImageElement,
  crop: CropRect, // in image pixel space
  threshold: number = 160,
  colorMode: InkColorMode = 'black'
): { dataUrl: string; width: number; height: number } {
  const canvas = document.createElement('canvas')
  const cropW = Math.max(10, Math.min(img.naturalWidth - crop.x, crop.width))
  const cropH = Math.max(10, Math.min(img.naturalHeight - crop.y, crop.height))

  canvas.width = cropW
  canvas.height = cropH
  const ctx = canvas.getContext('2d')
  if (!ctx) return { dataUrl: '', width: 0, height: 0 }

  // Draw cropped slice
  ctx.drawImage(img, crop.x, crop.y, cropW, cropH, 0, 0, cropW, cropH)

  const imgData = ctx.getImageData(0, 0, cropW, cropH)
  const data = imgData.data

  let minX = cropW
  let minY = cropH
  let maxX = 0
  let maxY = 0
  let hasInk = false

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const idx = (y * cropW + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      // Perceived luminance (standard Rec. 709)
      const lum = 0.299 * r + 0.587 * g + 0.114 * b

      if (lum >= threshold) {
        // Paper background / light noise -> 100% transparent
        data[idx + 3] = 0
      } else {
        // Dark ink detected
        hasInk = true
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)

        // Calculate opacity and contrast curve
        const darkness = (threshold - lum) / threshold
        const alpha = Math.min(255, Math.max(0, Math.round(darkness * 2.2 * 255)))

        data[idx + 3] = alpha

        if (colorMode === 'black') {
          data[idx] = 15
          data[idx + 1] = 23
          data[idx + 2] = 42
        } else if (colorMode === 'navy') {
          data[idx] = 30
          data[idx + 1] = 58
          data[idx + 2] = 138
        } else if (colorMode === 'red') {
          data[idx] = 153
          data[idx + 1] = 27
          data[idx + 2] = 27
        }
        // 'original' retains r, g, b with cleaned alpha
      }
    }
  }

  ctx.putImageData(imgData, 0, 0)

  // Auto-trim empty margins around ink
  if (hasInk && maxX > minX && maxY > minY) {
    const pad = 6
    const trimX = Math.max(0, minX - pad)
    const trimY = Math.max(0, minY - pad)
    const trimW = Math.min(cropW - trimX, maxX - minX + pad * 2)
    const trimH = Math.min(cropH - trimY, maxY - minY + pad * 2)

    const trimmedCanvas = document.createElement('canvas')
    trimmedCanvas.width = trimW
    trimmedCanvas.height = trimH
    const trimmedCtx = trimmedCanvas.getContext('2d')
    if (trimmedCtx) {
      trimmedCtx.drawImage(canvas, trimX, trimY, trimW, trimH, 0, 0, trimW, trimH)
      return {
        dataUrl: trimmedCanvas.toDataURL('image/png'),
        width: trimW,
        height: trimH,
      }
    }
  }

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: cropW,
    height: cropH,
  }
}
