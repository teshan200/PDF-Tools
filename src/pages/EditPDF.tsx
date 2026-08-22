import { useState, useEffect, useRef, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import ToolPageLayout from '../components/ToolPageLayout'
import DropZone from '../components/DropZone'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'

// Configure worker to use locally bundled worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc

// ─── Types ────────────────────────────────────────────────────────────────────
type ToolMode = 'select' | 'text' | 'whiteout' | 'draw' | 'image'

interface ExtractedSpan {
  id: string
  text: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
}

interface BaseAnnotation {
  id: string
  page: number
}

interface TextItem extends BaseAnnotation {
  type: 'text'
  x: number // in PDF points (top-left origin)
  y: number
  text: string
  fontSize: number
  fontFamily: 'Helvetica' | 'TimesRoman' | 'Courier'
  isBold: boolean
  isItalic: boolean
  color: string
}

interface WhiteoutItem extends BaseAnnotation {
  type: 'whiteout'
  x: number
  y: number
  width: number
  height: number
  color: string
  opacity: number
}

interface ImageItem extends BaseAnnotation {
  type: 'image'
  x: number
  y: number
  width: number
  height: number
  dataUrl: string
  fileBytes: ArrayBuffer
  isPng: boolean
}

interface DrawStroke extends BaseAnnotation {
  type: 'draw'
  color: string
  width: number
  opacity: number
  points: { x: number; y: number }[]
}

type AnnotationItem = TextItem | WhiteoutItem | ImageItem | DrawStroke

// Helper to convert Hex to RGB (0-1 for pdf-lib)
function hexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0
  return rgb(r, g, b)
}

function hexToRgba(hex: string, opacity: number) {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export default function EditPDF() {
  const [files, setFiles] = useState<File[]>([])
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({ width: 595, height: 842 })

  // Tool & Zoom states
  const [activeTool, setActiveTool] = useState<ToolMode>('select')
  const [scale, setScale] = useState(1.0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progressMsg, setProgressMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState('edited.pdf')

  // Annotations & Extracted text
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [extractedSpans, setExtractedSpans] = useState<ExtractedSpan[]>([])
  const [hoveredSpanId, setHoveredSpanId] = useState<string | null>(null)

  // Current Tool Styling Options
  const [textColor, setTextColor] = useState('#000000')
  const [textSize, setTextSize] = useState(16)
  const [textBold, setTextBold] = useState(false)
  const [textItalic, setTextItalic] = useState(false)
  const [textFont, setTextFont] = useState<'Helvetica' | 'TimesRoman' | 'Courier'>('Helvetica')

  const [boxColor, setBoxColor] = useState('#ffffff')
  const [boxOpacity, setBoxOpacity] = useState(1.0)

  const [drawColor, setDrawColor] = useState('#ef4444')
  const [drawWidth, setDrawWidth] = useState(3)
  const [drawOpacity, setDrawOpacity] = useState(1.0)

  // Drawing in progress
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[] | null>(null)

  // Interaction refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const activeInputRef = useRef<HTMLInputElement | null>(null)
  const dragRef = useRef<{
    id: string
    startX: number
    startY: number
    origX: number
    origY: number
    origW?: number
    origH?: number
    isResize?: boolean
    resizeCorner?: string
  } | null>(null)

  // ─── 1. Load PDF Document ───────────────────────────────────────────────────
  useEffect(() => {
    const file = files[0]
    if (!file) {
      setPdfDoc(null)
      setNumPages(0)
      setAnnotations([])
      setSelectedId(null)
      setExtractedSpans([])
      setDownloadUrl(null)
      return
    }

    let cancelled = false
    setIsProcessing(true)
    setProgressMsg('Loading PDF preview...')
    setErrorMsg(null)

    file.arrayBuffer().then((buffer) => {
      if (cancelled) return
      return pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
    }).then((doc) => {
      if (cancelled || !doc) return
      setPdfDoc(doc)
      setNumPages(doc.numPages)
      setCurrentPage(1)
      setAnnotations([])
      setSelectedId(null)
      setDownloadName(file.name.replace(/\.pdf$/i, '') + '-edited.pdf')
      setIsProcessing(false)
    }).catch((err) => {
      if (cancelled) return
      console.error('Failed to load PDF:', err)
      setErrorMsg('Failed to load this PDF document. It might be password-protected or corrupted.')
      setIsProcessing(false)
    })

    return () => { cancelled = true }
  }, [files])

  // ─── 2. Render Page to Canvas & Extract Text ────────────────────────────────
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return
    let renderTask: any = null
    let cancelled = false

    pdfDoc.getPage(currentPage).then(async (page: any) => {
      if (cancelled) return
      const unscaledViewport = page.getViewport({ scale: 1.0 })
      setPageDimensions({ width: unscaledViewport.width, height: unscaledViewport.height })

      // Extract text items from the current page
      try {
        const textContent = await page.getTextContent()
        const spans: ExtractedSpan[] = []
        textContent.items.forEach((item: any, idx: number) => {
          if (!item.str || !item.str.trim()) return
          const tx = item.transform[4]
          const ty = item.transform[5]
          const h = item.height || Math.abs(item.transform[3]) || 14
          const w = item.width || (item.str.length * h * 0.55)
          const y = unscaledViewport.height - ty - h * 0.95
          spans.push({
            id: `span_${currentPage}_${idx}`,
            text: item.str,
            x: Math.round(tx),
            y: Math.round(y),
            width: Math.max(10, Math.round(w)),
            height: Math.max(10, Math.round(h)),
            fontSize: Math.max(8, Math.round(h)),
          })
        })
        if (!cancelled) setExtractedSpans(spans)
      } catch (err) {
        console.error('Failed to extract text content:', err)
      }

      // Render canvas
      const viewport = page.getViewport({ scale })
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = viewport.width
      canvas.height = viewport.height

      renderTask = page.render({ canvasContext: ctx, viewport })
      return renderTask.promise
    }).catch((err: any) => {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Render error:', err)
      }
    })

    return () => {
      cancelled = true
      if (renderTask) renderTask.cancel()
    }
  }, [pdfDoc, currentPage, scale])

  // Auto-fit on initial load
  const fitToWidth = useCallback(() => {
    if (!containerRef.current || !pageDimensions.width) return
    const containerWidth = containerRef.current.clientWidth - 64
    const targetScale = Math.min(1.4, Math.max(0.4, (containerWidth / pageDimensions.width)))
    setScale(parseFloat(targetScale.toFixed(2)))
  }, [pageDimensions.width])

  // ─── 3. Pointer & Creation Handlers ─────────────────────────────────────────
  const getPdfCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-interactive]')) return

    const { x, y } = getPdfCoords(e.clientX, e.clientY)

    if (activeTool === 'text') {
      const newText: TextItem = {
        id: 'text_' + Date.now(),
        type: 'text',
        page: currentPage,
        x: Math.round(x),
        y: Math.round(y),
        text: 'Enter text',
        fontSize: textSize,
        fontFamily: textFont,
        isBold: textBold,
        isItalic: textItalic,
        color: textColor,
      }
      setAnnotations((prev) => [...prev, newText])
      setSelectedId(newText.id)
      setActiveTool('select')
    } else if (activeTool === 'whiteout') {
      const newBox: WhiteoutItem = {
        id: 'box_' + Date.now(),
        type: 'whiteout',
        page: currentPage,
        x: Math.round(x),
        y: Math.round(y),
        width: 140,
        height: 35,
        color: boxColor,
        opacity: boxOpacity,
      }
      setAnnotations((prev) => [...prev, newBox])
      setSelectedId(newBox.id)
      setActiveTool('select')
    } else if (activeTool === 'draw') {
      e.currentTarget.setPointerCapture(e.pointerId)
      setCurrentStroke([{ x, y }])
    } else if (activeTool === 'select') {
      setSelectedId(null)
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeTool === 'draw' && currentStroke) {
      const { x, y } = getPdfCoords(e.clientX, e.clientY)
      setCurrentStroke((prev) => (prev ? [...prev, { x, y }] : null))
    }
  }

  const handlePointerUp = () => {
    if (activeTool === 'draw' && currentStroke && currentStroke.length > 1) {
      const newStroke: DrawStroke = {
        id: 'draw_' + Date.now(),
        type: 'draw',
        page: currentPage,
        color: drawColor,
        width: drawWidth,
        opacity: drawOpacity,
        points: currentStroke,
      }
      setAnnotations((prev) => [...prev, newStroke])
    }
    setCurrentStroke(null)
  }

  // ─── 4. Drag & Resize Annotations ───────────────────────────────────────────
  const startDrag = (id: string, e: React.PointerEvent, isResize = false, corner = '') => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setSelectedId(id)

    const item = annotations.find((a) => a.id === id)
    if (!item) return

    const initialW = 'width' in item ? item.width : 0
    const initialH = 'height' in item ? item.height : 0
    const itemX = 'x' in item ? item.x : 0
    const itemY = 'y' in item ? item.y : 0

    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: itemX,
      origY: itemY,
      origW: initialW,
      origH: initialH,
      isResize,
      resizeCorner: corner,
    }

    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current || dragRef.current.id !== id) return
      const dx = (ev.clientX - dragRef.current.startX) / scale
      const dy = (ev.clientY - dragRef.current.startY) / scale

      setAnnotations((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it

          if (dragRef.current?.isResize && 'width' in it && 'height' in it) {
            const newW = Math.max(20, Math.round(dragRef.current.origW! + dx))
            const newH = Math.max(15, Math.round(dragRef.current.origH! + dy))
            return { ...it, width: newW, height: newH }
          } else if ('x' in it && 'y' in it) {
            const newX = Math.max(0, Math.round(dragRef.current.origX + dx))
            const newY = Math.max(0, Math.round(dragRef.current.origY + dy))
            return { ...it, x: newX, y: newY }
          }
          return it
        })
      )
    }

    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // ─── 5. Image & Signature Upload ────────────────────────────────────────────
  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const buffer = await file.arrayBuffer()
    const isPng = file.type.includes('png') || file.name.toLowerCase().endsWith('.png')
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      const img = new window.Image()
      img.onload = () => {
        let w = img.width
        let h = img.height
        const maxDim = 200
        if (w > maxDim || h > maxDim) {
          const ratio = w / h
          if (w > h) {
            w = maxDim
            h = maxDim / ratio
          } else {
            h = maxDim
            w = maxDim * ratio
          }
        }

        const newImage: ImageItem = {
          id: 'img_' + Date.now(),
          type: 'image',
          page: currentPage,
          x: Math.round(pageDimensions.width / 2 - w / 2),
          y: Math.round(pageDimensions.height / 2 - h / 2),
          width: Math.round(w),
          height: Math.round(h),
          dataUrl,
          fileBytes: buffer,
          isPng,
        }
        setAnnotations((prev) => [...prev, newImage])
        setSelectedId(newImage.id)
        setActiveTool('select')
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ─── 6. Edit Existing Text Span ─────────────────────────────────────────────
  const handleEditExistingSpan = (span: ExtractedSpan) => {
    // 1. Create whiteout rectangle over the original text
    const whiteoutBox: WhiteoutItem = {
      id: 'box_' + Date.now(),
      type: 'whiteout',
      page: currentPage,
      x: Math.max(0, span.x - 2),
      y: Math.max(0, span.y - 1),
      width: span.width + 6,
      height: span.height + 4,
      color: '#ffffff',
      opacity: 1.0,
    }

    // 2. Create an editable text annotation right on top
    const newText: TextItem = {
      id: 'text_' + (Date.now() + 1),
      type: 'text',
      page: currentPage,
      x: span.x,
      y: span.y,
      text: span.text,
      fontSize: span.fontSize,
      fontFamily: 'Helvetica',
      isBold: false,
      isItalic: false,
      color: '#000000',
    }

    setAnnotations((prev) => [...prev, whiteoutBox, newText])
    setSelectedId(newText.id)
    setActiveTool('select')
  }

  // ─── 7. Undo & Delete ───────────────────────────────────────────────────────
  const deleteAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id))
    setSelectedId((curr) => (curr === id ? null : curr))
  }, [])

  const deleteSelected = useCallback(() => {
    if (!selectedId) return
    deleteAnnotation(selectedId)
  }, [selectedId, deleteAnnotation])

  const undoLast = () => {
    setAnnotations((prev) => prev.slice(0, -1))
    setSelectedId(null)
  }

  // Keyboard shortcut: Delete or Backspace key to remove selected item, Ctrl+Z for undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        undoLast()
        return
      }

      if (e.key === 'Escape') {
        setSelectedId(null)
        return
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const tag = (document.activeElement?.tagName || '').toLowerCase()
        if (tag === 'input' || tag === 'textarea') return
        e.preventDefault()
        deleteSelected()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, deleteSelected])

  // ─── 8. Export Edited PDF with pdf-lib ──────────────────────────────────────
  const handleExport = async () => {
    const file = files[0]
    if (!file) return
    try {
      setIsProcessing(true)
      setProgressMsg('Rendering your changes into the PDF...')

      // Always read a fresh ArrayBuffer from the file to prevent detached buffer errors
      const freshBytes = await file.arrayBuffer()
      const pdfDocLib = await PDFDocument.load(freshBytes)
      const pages = pdfDocLib.getPages()

      // Embed standard fonts
      const helvetica = await pdfDocLib.embedFont(StandardFonts.Helvetica)
      const helveticaBold = await pdfDocLib.embedFont(StandardFonts.HelveticaBold)
      const helveticaOblique = await pdfDocLib.embedFont(StandardFonts.HelveticaOblique)
      const timesRoman = await pdfDocLib.embedFont(StandardFonts.TimesRoman)
      const courier = await pdfDocLib.embedFont(StandardFonts.Courier)

      for (let pIndex = 0; pIndex < pages.length; pIndex++) {
        const page = pages[pIndex]
        const pageNum = pIndex + 1
        const pageHeight = page.getHeight()
        const pageAnnotations = annotations.filter((a) => a.page === pageNum)

        for (const item of pageAnnotations) {
          if (item.type === 'whiteout') {
            const pdfY = pageHeight - (item.y + item.height)
            page.drawRectangle({
              x: item.x,
              y: pdfY,
              width: item.width,
              height: item.height,
              color: hexToRgb(item.color),
              opacity: item.opacity,
            })
          } else if (item.type === 'text') {
            let selectedFont = helvetica
            if (item.fontFamily === 'TimesRoman') selectedFont = timesRoman
            else if (item.fontFamily === 'Courier') selectedFont = courier
            else if (item.isBold) selectedFont = helveticaBold
            else if (item.isItalic) selectedFont = helveticaOblique

            const pdfY = pageHeight - item.y - item.fontSize * 0.9
            page.drawText(item.text, {
              x: item.x,
              y: pdfY,
              size: item.fontSize,
              font: selectedFont,
              color: hexToRgb(item.color),
            })
          } else if (item.type === 'image') {
            let embeddedImg: any
            const imgBytes = item.fileBytes.slice(0)
            if (item.isPng) {
              embeddedImg = await pdfDocLib.embedPng(imgBytes)
            } else {
              embeddedImg = await pdfDocLib.embedJpg(imgBytes)
            }
            const pdfY = pageHeight - (item.y + item.height)
            page.drawImage(embeddedImg, {
              x: item.x,
              y: pdfY,
              width: item.width,
              height: item.height,
            })
          } else if (item.type === 'draw' && item.points.length > 1) {
            const strokeColor = hexToRgb(item.color)
            for (let i = 0; i < item.points.length - 1; i++) {
              const start = item.points[i]
              const end = item.points[i + 1]
              page.drawLine({
                start: { x: start.x, y: pageHeight - start.y },
                end: { x: end.x, y: pageHeight - end.y },
                thickness: item.width,
                color: strokeColor,
                opacity: item.opacity,
              })
            }
          }
        }
      }

      const modifiedPdfBytes = await pdfDocLib.save()
      const blob = new Blob([modifiedPdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
      setIsProcessing(false)
    } catch (err: any) {
      console.error('Failed to export PDF:', err)
      setErrorMsg('Error generating edited PDF: ' + (err?.message || 'Unknown error'))
      setIsProcessing(false)
    }
  }

  const selectedItem = annotations.find((a) => a.id === selectedId)
  const pageAnnotations = annotations.filter((a) => a.page === currentPage)

  const EditIcon = () => (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )

  const handleReset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    setFiles([])
    setPdfDoc(null)
    setAnnotations([])
    setSelectedId(null)
    setExtractedSpans([])
    setDownloadUrl(null)
  }

  return (
    <ToolPageLayout
      title="Edit PDF"
      description="Click existing text to edit, erase unwanted content with whiteout, add signatures & draw directly."
      color="indigo"
      icon={<EditIcon />}
    >
      {downloadUrl ? (
        <div className="text-center py-10 space-y-6 max-w-lg mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900">Your Edited PDF is Ready!</h3>
            <p className="text-sm text-slate-500">All text edits, whiteouts, images, and drawings are saved cleanly.</p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <a
              href={downloadUrl}
              download={downloadName}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </a>
            <button
              onClick={() => setDownloadUrl(null)}
              className="px-5 py-3.5 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-sm"
            >
              Continue Editing
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-3.5 text-slate-400 hover:text-red-500 font-medium transition-colors text-sm"
            >
              New File
            </button>
          </div>
        </div>
      ) : isProcessing ? (
        <Spinner message={progressMsg} />
      ) : !pdfDoc ? (
        <div className="space-y-4">
          <DropZone onFilesSelected={setFiles} selectedFiles={files} hint="Upload any PDF to edit text, cover content, add images & draw" />
          {errorMsg && <ErrorMessage message={errorMsg} onRetry={handleReset} />}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
              <span className="text-xl">✏️</span>
              <p className="font-bold text-xs text-slate-800 mt-1">Edit Existing Text</p>
              <p className="text-[11px] text-slate-500">Click any text in the PDF to change it</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
              <span className="text-xl">⬜</span>
              <p className="font-bold text-xs text-slate-800 mt-1">Whiteout &amp; Erase</p>
              <p className="text-[11px] text-slate-500">Cleanly cover up unwanted text</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
              <span className="text-xl">🖼️</span>
              <p className="font-bold text-xs text-slate-800 mt-1">Images &amp; Signatures</p>
              <p className="text-[11px] text-slate-500">Add stamps, photos and signs</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
              <span className="text-xl">🖌️</span>
              <p className="font-bold text-xs text-slate-800 mt-1">Freehand Drawing</p>
              <p className="text-[11px] text-slate-500">Draw notes, arrows &amp; highlights</p>
            </div>
          </div>
        </div>
      ) : (
        /* ── Modern Studio Workspace ── */
        <div className="space-y-3" ref={containerRef}>
          {/* Main Top Studio Toolbar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-2 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
            {/* Tool Selection Tabs */}
            <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl flex-wrap">
              <button
                onClick={() => { setActiveTool('select'); setSelectedId(null) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTool === 'select'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Select items or click existing text to edit"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                Select &amp; Edit
              </button>

              <button
                onClick={() => setActiveTool('text')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTool === 'text' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Click anywhere to place a new text box"
              >
                <span className="font-serif font-bold text-sm leading-none">T</span>
                Add Text
              </button>

              <button
                onClick={() => setActiveTool('whiteout')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTool === 'whiteout' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Place a white eraser box over text"
              >
                <div className="w-3.5 h-3.5 border border-slate-400 bg-white rounded-xs shadow-2xs" />
                Whiteout
              </button>

              <button
                onClick={() => {
                  imageInputRef.current?.click()
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-slate-600 hover:text-slate-900"
                title="Upload image or digital signature"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Image / Sign
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={handleImageSelected}
              />

              <button
                onClick={() => setActiveTool('draw')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTool === 'draw' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Draw freehand with pen or highlighter"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Draw
              </button>
            </div>

            {/* Page Nav */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs font-semibold text-slate-700 px-1 min-w-[70px] text-center">
                {currentPage} / {numPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                disabled={currentPage >= numPages}
                className="p-1 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next page"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setScale((s) => Math.max(0.4, parseFloat((s - 0.15).toFixed(2))))}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 text-xs font-bold"
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-xs font-semibold text-slate-700 w-9 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(2.0, parseFloat((s + 0.15).toFixed(2))))}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 text-xs font-bold"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={fitToWidth}
                className="text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 px-1.5 py-0.5 rounded transition-colors ml-0.5"
              >
                Fit
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={undoLast}
                disabled={annotations.length === 0}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 text-xs flex items-center gap-1 font-medium transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2m0 0l-4-4m4 4l4-4" />
                </svg>
                Undo
              </button>

              <button
                onClick={handleExport}
                className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all hover:shadow"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Save &amp; Download
              </button>
            </div>
          </div>

          {/* Contextual Floating Styling Ribbon for Active Tool */}
          {(activeTool === 'text' || (selectedItem && selectedItem.type === 'text')) && (
            <div className="bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 flex items-center gap-3.5 flex-wrap text-xs shadow-xs animate-fadeIn">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Text Style:
              </span>

              <select
                value={selectedItem?.type === 'text' ? selectedItem.fontFamily : textFont}
                onChange={(e) => {
                  const f = e.target.value as any
                  setTextFont(f)
                  if (selectedItem?.type === 'text') {
                    setAnnotations((prev) => prev.map((a) => (a.id === selectedId ? { ...a, fontFamily: f } : a)))
                  }
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-medium text-slate-800 outline-none"
              >
                <option value="Helvetica">Helvetica / Arial</option>
                <option value="TimesRoman">Times New Roman</option>
                <option value="Courier">Courier</option>
              </select>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const currentSz = selectedItem?.type === 'text' ? selectedItem.fontSize : textSize
                    const newSz = Math.max(8, currentSz - 2)
                    setTextSize(newSz)
                    if (selectedItem?.type === 'text') {
                      setAnnotations((prev) => prev.map((a) => (a.id === selectedId ? { ...a, fontSize: newSz } : a)))
                    }
                  }}
                  className="w-6 h-6 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold"
                >
                  -
                </button>
                <span className="w-8 text-center font-semibold text-slate-700">
                  {selectedItem?.type === 'text' ? selectedItem.fontSize : textSize}
                </span>
                <button
                  onClick={() => {
                    const currentSz = selectedItem?.type === 'text' ? selectedItem.fontSize : textSize
                    const newSz = Math.min(72, currentSz + 2)
                    setTextSize(newSz)
                    if (selectedItem?.type === 'text') {
                      setAnnotations((prev) => prev.map((a) => (a.id === selectedId ? { ...a, fontSize: newSz } : a)))
                    }
                  }}
                  className="w-6 h-6 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const isB = selectedItem?.type === 'text' ? !selectedItem.isBold : !textBold
                    setTextBold(isB)
                    if (selectedItem?.type === 'text') {
                      setAnnotations((prev) => prev.map((a) => (a.id === selectedId ? { ...a, isBold: isB } : a)))
                    }
                  }}
                  className={`px-2 py-1 font-bold rounded-lg border ${
                    (selectedItem?.type === 'text' ? selectedItem.isBold : textBold)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  B
                </button>
                <button
                  onClick={() => {
                    const isI = selectedItem?.type === 'text' ? !selectedItem.isItalic : !textItalic
                    setTextItalic(isI)
                    if (selectedItem?.type === 'text') {
                      setAnnotations((prev) => prev.map((a) => (a.id === selectedId ? { ...a, isItalic: isI } : a)))
                    }
                  }}
                  className={`px-2 py-1 italic font-serif rounded-lg border ${
                    (selectedItem?.type === 'text' ? selectedItem.isItalic : textItalic)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  I
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {['#000000', '#2563eb', '#dc2626', '#16a34a', '#9333ea'].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setTextColor(c)
                      if (selectedItem?.type === 'text') {
                        setAnnotations((prev) => prev.map((a) => (a.id === selectedId ? { ...a, color: c } : a)))
                      }
                    }}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${
                      (selectedItem?.type === 'text' ? selectedItem.color : textColor) === c
                        ? 'border-indigo-600 scale-110 shadow-xs'
                        : 'border-white'
                    }`}
                  />
                ))}
              </div>

              {selectedItem && (
                <button
                  onClick={deleteSelected}
                  className="ml-auto flex items-center gap-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 font-semibold transition-colors text-xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          )}

          {(activeTool === 'whiteout' || (selectedItem && selectedItem.type === 'whiteout')) && (
            <div className="bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 flex items-center gap-3.5 flex-wrap text-xs shadow-xs">
              <span className="font-bold text-slate-800">Box Style:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setBoxColor('#ffffff')
                    setBoxOpacity(1.0)
                    if (selectedItem?.type === 'whiteout') {
                      setAnnotations((prev) => prev.map((a) => (a.id === selectedId ? { ...a, color: '#ffffff', opacity: 1.0 } : a)))
                    }
                  }}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-medium shadow-2xs hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <div className="w-3 h-3 bg-white border border-slate-400 rounded-xs" />
                  Whiteout (Erase)
                </button>
                <button
                  onClick={() => {
                    setBoxColor('#000000')
                    setBoxOpacity(1.0)
                    if (selectedItem?.type === 'whiteout') {
                      setAnnotations((prev) => prev.map((a) => (a.id === selectedId ? { ...a, color: '#000000', opacity: 1.0 } : a)))
                    }
                  }}
                  className="px-2.5 py-1 bg-black text-white rounded-lg font-medium shadow-2xs flex items-center gap-1.5"
                >
                  <div className="w-3 h-3 bg-black rounded-xs" />
                  Black (Redact)
                </button>
                <button
                  onClick={() => {
                    setBoxColor('#fef08a')
                    setBoxOpacity(0.45)
                    if (selectedItem?.type === 'whiteout') {
                      setAnnotations((prev) => prev.map((a) => (a.id === selectedId ? { ...a, color: '#fef08a', opacity: 0.45 } : a)))
                    }
                  }}
                  className="px-2.5 py-1 bg-yellow-100 text-yellow-900 border border-yellow-300 rounded-lg font-medium shadow-2xs flex items-center gap-1.5"
                >
                  <div className="w-3 h-3 bg-yellow-400 rounded-xs" />
                  Highlighter
                </button>
              </div>

              {selectedItem && (
                <button
                  onClick={deleteSelected}
                  className="ml-auto flex items-center gap-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 font-semibold transition-colors text-xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Box
                </button>
              )}
            </div>
          )}

          {activeTool === 'draw' && (
            <div className="bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 flex items-center gap-3.5 flex-wrap text-xs shadow-xs">
              <span className="font-bold text-slate-800">Pen &amp; Highlighter:</span>
              <div className="flex items-center gap-2">
                {[
                  { c: '#000000', o: 1.0 },
                  { c: '#2563eb', o: 1.0 },
                  { c: '#ef4444', o: 1.0 },
                  { c: '#eab308', o: 0.45 },
                  { c: '#22c55e', o: 0.45 },
                ].map((item) => (
                  <button
                    key={item.c}
                    onClick={() => {
                      setDrawColor(item.c)
                      setDrawOpacity(item.o)
                    }}
                    style={{ backgroundColor: item.c }}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${drawColor === item.c ? 'border-indigo-600 scale-110 shadow-xs' : 'border-white'}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1">
                <span>Thickness:</span>
                {[2, 4, 8, 14].map((w) => (
                  <button
                    key={w}
                    onClick={() => setDrawWidth(w)}
                    className={`px-2 py-0.5 rounded font-medium border ${
                      drawWidth === w ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {w}px
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Workspace Viewport Canvas */}
          <div
            className="border border-slate-200/80 rounded-2xl bg-slate-100/90 shadow-inner overflow-auto flex justify-center items-start p-6 relative select-none"
            style={{ maxHeight: '74vh', minHeight: '450px' }}
          >
            <div
              className="relative shadow-xl bg-white rounded transition-shadow duration-200"
              style={{
                width: pageDimensions.width * scale,
                height: pageDimensions.height * scale,
                cursor:
                  activeTool === 'text'
                    ? 'text'
                    : activeTool === 'whiteout'
                    ? 'crosshair'
                    : activeTool === 'draw'
                    ? 'crosshair'
                    : 'default',
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {/* PDF.js Rendered Canvas */}
              <canvas ref={canvasRef} className="block pointer-events-none w-full h-full" />

              {/* Freehand SVG Layer */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ width: pageDimensions.width * scale, height: pageDimensions.height * scale }}
              >
                {pageAnnotations
                  .filter((a): a is DrawStroke => a.type === 'draw')
                  .map((stroke) => {
                    const pathData = stroke.points.reduce(
                      (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x * scale} ${pt.y * scale}`,
                      ''
                    )
                    return (
                      <path
                        key={stroke.id}
                        d={pathData}
                        stroke={stroke.color}
                        strokeWidth={stroke.width * scale}
                        strokeOpacity={stroke.opacity}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    )
                  })}

                {currentStroke && currentStroke.length > 1 && (
                  <path
                    d={currentStroke.reduce(
                      (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x * scale} ${pt.y * scale}`,
                      ''
                    )}
                    stroke={drawColor}
                    strokeWidth={drawWidth * scale}
                    strokeOpacity={drawOpacity}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                )}
              </svg>

              {/* Extracted Interactive Text Layer (Click any original text to edit) */}
              {activeTool === 'select' &&
                extractedSpans.map((span) => {
                  const isHovered = hoveredSpanId === span.id
                  return (
                    <div
                      key={span.id}
                      data-interactive="true"
                      onMouseEnter={() => setHoveredSpanId(span.id)}
                      onMouseLeave={() => setHoveredSpanId(null)}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditExistingSpan(span)
                      }}
                      className={`absolute rounded transition-all cursor-pointer z-10 group ${
                        isHovered
                          ? 'border border-dashed border-indigo-400 bg-indigo-500/15'
                          : 'border border-transparent'
                      }`}
                      style={{
                        left: span.x * scale,
                        top: span.y * scale,
                        width: span.width * scale,
                        height: span.height * scale,
                      }}
                      title="Click to edit this text"
                    >
                      {isHovered && (
                        <div className="absolute -top-5 left-0 bg-indigo-700 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm pointer-events-none whitespace-nowrap z-30 font-medium">
                          ✏️ Click to edit
                        </div>
                      )}
                    </div>
                  )
                })}

              {/* Placed Annotations Layer */}
              {pageAnnotations.map((item) => {
                const isSelected = item.id === selectedId

                if (item.type === 'whiteout') {
                  return (
                    <div
                      key={item.id}
                      data-interactive="true"
                      style={{
                        position: 'absolute',
                        left: item.x * scale,
                        top: item.y * scale,
                        width: item.width * scale,
                        height: item.height * scale,
                        backgroundColor: hexToRgba(item.color, item.opacity),
                      }}
                      onPointerDown={(e) => startDrag(item.id, e)}
                      onClick={(e) => { e.stopPropagation(); setSelectedId(item.id) }}
                      className={`group cursor-move ${isSelected ? 'ring-2 ring-indigo-500 shadow-md' : 'hover:ring-1 hover:ring-indigo-300'}`}
                    >
                      {isSelected && (
                        <>
                          <button
                            type="button"
                            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault() }}
                            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault() }}
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); deleteAnnotation(item.id) }}
                            className="absolute -top-3 -right-3 w-5 h-5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md cursor-pointer z-30 transition-transform hover:scale-110"
                            title="Delete box"
                          >
                            ✕
                          </button>
                          <div
                            onPointerDown={(e) => startDrag(item.id, e, true, 'se')}
                            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-600 rounded-xs cursor-nwse-resize z-20"
                          />
                        </>
                      )}
                    </div>
                  )
                }

                if (item.type === 'text') {
                  return (
                    <div
                      key={item.id}
                      data-interactive="true"
                      style={{
                        position: 'absolute',
                        left: item.x * scale,
                        top: item.y * scale,
                        cursor: 'move',
                      }}
                      onPointerDown={(e) => startDrag(item.id, e)}
                      onClick={(e) => { e.stopPropagation(); setSelectedId(item.id) }}
                      className={`group inline-block ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50/40 rounded px-1' : 'hover:ring-1 hover:ring-indigo-300 rounded px-1'}`}
                    >
                      <input
                        ref={isSelected ? activeInputRef : undefined}
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const val = e.target.value
                          setAnnotations((prev) => prev.map((a) => (a.id === item.id ? { ...a, text: val } : a)))
                        }}
                        style={{
                          fontFamily: item.fontFamily === 'TimesRoman' ? 'Times New Roman' : item.fontFamily,
                          fontSize: item.fontSize * scale,
                          fontWeight: item.isBold ? 'bold' : 'normal',
                          fontStyle: item.isItalic ? 'italic' : 'normal',
                          color: item.color,
                          backgroundColor: 'transparent',
                          outline: 'none',
                          border: 'none',
                          padding: 0,
                          margin: 0,
                          minWidth: '30px',
                          width: `${Math.max(30, item.text.length * item.fontSize * scale * 0.65)}px`,
                        }}
                      />
                      {isSelected && (
                        <button
                          type="button"
                          onPointerDown={(e) => { e.stopPropagation(); e.preventDefault() }}
                          onMouseDown={(e) => { e.stopPropagation(); e.preventDefault() }}
                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); deleteAnnotation(item.id) }}
                          className="absolute -top-3 -right-3 w-5 h-5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md cursor-pointer z-30 transition-transform hover:scale-110"
                          title="Delete text"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )
                }

                if (item.type === 'image') {
                  return (
                    <div
                      key={item.id}
                      data-interactive="true"
                      style={{
                        position: 'absolute',
                        left: item.x * scale,
                        top: item.y * scale,
                        width: item.width * scale,
                        height: item.height * scale,
                      }}
                      onPointerDown={(e) => startDrag(item.id, e)}
                      onClick={(e) => { e.stopPropagation(); setSelectedId(item.id) }}
                      className={`group cursor-move ${isSelected ? 'ring-2 ring-indigo-500 shadow-lg' : 'hover:ring-1 hover:ring-indigo-300'}`}
                    >
                      <img src={item.dataUrl} alt="Inserted" className="w-full h-full object-contain pointer-events-none" />
                      {isSelected && (
                        <>
                          <button
                            type="button"
                            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault() }}
                            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault() }}
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); deleteAnnotation(item.id) }}
                            className="absolute -top-3 -right-3 w-5 h-5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md cursor-pointer z-30 transition-transform hover:scale-110"
                            title="Delete image"
                          >
                            ✕
                          </button>
                          <div
                            onPointerDown={(e) => startDrag(item.id, e, true, 'se')}
                            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-600 rounded-xs cursor-nwse-resize z-20"
                          />
                        </>
                      )}
                    </div>
                  )
                }

                return null
              })}
            </div>
          </div>

          {/* Quick Help & Document Status Footer */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-2 gap-2">
            <div className="flex items-center gap-3">
              <span>💡 <strong>Tip:</strong> Hover and click any text directly on the document to edit it.</span>
              {annotations.length > 0 && (
                <span className="text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                  {annotations.length} change{annotations.length !== 1 ? 's' : ''} made
                </span>
              )}
            </div>
            <button
              onClick={handleReset}
              className="text-slate-400 hover:text-red-500 font-medium transition-colors"
            >
              Upload another PDF
            </button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  )
}
