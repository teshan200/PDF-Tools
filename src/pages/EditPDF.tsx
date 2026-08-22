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
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null)
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

  // Annotations
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

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
      setPdfBytes(null)
      setNumPages(0)
      setAnnotations([])
      setSelectedId(null)
      setDownloadUrl(null)
      return
    }

    let cancelled = false
    setIsProcessing(true)
    setProgressMsg('Loading PDF preview...')
    setErrorMsg(null)

    file.arrayBuffer().then((buffer) => {
      if (cancelled) return
      setPdfBytes(buffer)
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

  // ─── 2. Render Page to Canvas ───────────────────────────────────────────────
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return
    let renderTask: any = null
    let cancelled = false

    pdfDoc.getPage(currentPage).then((page: any) => {
      if (cancelled) return
      const unscaledViewport = page.getViewport({ scale: 1.0 })
      setPageDimensions({ width: unscaledViewport.width, height: unscaledViewport.height })

      // Auto-fit scale if container is available and not customized yet
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
    const containerWidth = containerRef.current.clientWidth - 48 // margin
    const targetScale = Math.min(1.5, Math.max(0.4, (containerWidth / pageDimensions.width)))
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
        text: 'Enter text here',
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
        // Compute reasonable size
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

  // ─── 6. Undo & Delete ───────────────────────────────────────────────────────
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

  // Keyboard shortcut: Delete or Backspace key to remove selected item
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        // Do not trigger if typing in an active text input or textarea
        const tag = (document.activeElement?.tagName || '').toLowerCase()
        if (tag === 'input' || tag === 'textarea') return
        e.preventDefault()
        deleteSelected()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, deleteSelected])

  // ─── 7. Export Edited PDF with pdf-lib ──────────────────────────────────────
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
            // Invert Y coordinate for PDF coordinate space (bottom-left origin)
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

            // Invert Y coordinate (accounting for text baseline)
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
    setPdfBytes(null)
    setAnnotations([])
    setSelectedId(null)
    setDownloadUrl(null)
  }

  return (
    <ToolPageLayout
      title="Edit PDF"
      description="Add text, erase unwanted content with whiteout, insert signatures & images, and draw annotations."
      color="indigo"
      icon={<EditIcon />}
    >
      {downloadUrl ? (
        <div className="text-center py-8 space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900">Your PDF is Ready!</h3>
            <p className="text-sm text-slate-500">All your edits, text, and annotations have been saved into your document.</p>
          </div>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href={downloadUrl}
              download={downloadName}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition-colors text-base"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Edited PDF
            </a>
            <button
              onClick={() => setDownloadUrl(null)}
              className="px-6 py-3.5 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Continue Editing
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3.5 text-slate-400 hover:text-red-500 font-medium transition-colors"
            >
              Start New File
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
              <span className="text-xl">🔤</span>
              <p className="font-bold text-xs text-slate-800 mt-1">Add Text</p>
              <p className="text-[11px] text-slate-500">Insert custom text anywhere</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
              <span className="text-xl">⬜</span>
              <p className="font-bold text-xs text-slate-800 mt-1">Whiteout & Erase</p>
              <p className="text-[11px] text-slate-500">Cover up text or highlight</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
              <span className="text-xl">🖼️</span>
              <p className="font-bold text-xs text-slate-800 mt-1">Add Image & Signature</p>
              <p className="text-[11px] text-slate-500">Place logos, stamps & signs</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
              <span className="text-xl">✏️</span>
              <p className="font-bold text-xs text-slate-800 mt-1">Freehand Drawing</p>
              <p className="text-[11px] text-slate-500">Draw notes, arrows & lines</p>
            </div>
          </div>
        </div>
      ) : (
        /* ── Modern Studio Workspace ── */
        <div className="space-y-3" ref={containerRef}>
          {/* Top Control Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
            {/* Tool Selection Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => { setActiveTool('select'); setSelectedId(null) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTool === 'select' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Select and Move objects"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                Select
              </button>

              <button
                onClick={() => setActiveTool('text')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTool === 'text' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Click anywhere to add text"
              >
                <span className="font-serif font-bold text-sm leading-none">T</span>
                Text
              </button>

              <button
                onClick={() => setActiveTool('whiteout')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTool === 'whiteout' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Cover existing text or add highlight box"
              >
                <div className="w-3.5 h-3.5 border border-slate-400 bg-white rounded-xs" />
                Whiteout / Box
              </button>

              <button
                onClick={() => {
                  imageInputRef.current?.click()
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-slate-600 hover:text-slate-900`}
                title="Upload image or signature"
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
                title="Freehand drawing"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Draw
              </button>
            </div>

            {/* Page Nav */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs font-semibold text-slate-700 px-2 min-w-[75px] text-center">
                {currentPage} / {numPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                disabled={currentPage >= numPages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setScale((s) => Math.max(0.4, parseFloat((s - 0.15).toFixed(2))))}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 text-xs font-bold"
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-xs font-semibold text-slate-600 w-10 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(2.0, parseFloat((s + 0.15).toFixed(2))))}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 text-xs font-bold"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={fitToWidth}
                className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 px-2 py-1 bg-slate-100 rounded-lg"
              >
                Fit
              </button>
            </div>

            {/* Export & Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={undoLast}
                disabled={annotations.length === 0}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 text-xs flex items-center gap-1"
                title="Undo last change"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2m0 0l-4-4m4 4l4-4" />
                </svg>
              </button>
              <button
                onClick={handleExport}
                className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Save &amp; Download
              </button>
            </div>
          </div>

          {/* Dynamic Secondary Options Bar */}
          {(activeTool === 'text' || (selectedItem && selectedItem.type === 'text')) && (
            <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl px-4 py-2 flex items-center gap-4 flex-wrap text-xs">
              <span className="font-bold text-indigo-900">Text Options:</span>
              <div className="flex items-center gap-1.5">
                <span>Font:</span>
                <select
                  value={selectedItem?.type === 'text' ? selectedItem.fontFamily : textFont}
                  onChange={(e) => {
                    const f = e.target.value as any
                    setTextFont(f)
                    if (selectedItem?.type === 'text') {
                      setAnnotations((prev) => prev.map((a) => (a.id === selectedId ? { ...a, fontFamily: f } : a)))
                    }
                  }}
                  className="bg-white border border-indigo-200 rounded px-2 py-1 font-medium"
                >
                  <option value="Helvetica">Helvetica / Arial</option>
                  <option value="TimesRoman">Times New Roman</option>
                  <option value="Courier">Courier</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span>Size:</span>
                <input
                  type="number"
                  min={8}
                  max={72}
                  value={selectedItem?.type === 'text' ? selectedItem.fontSize : textSize}
                  onChange={(e) => {
                    const sz = Math.max(8, Number(e.target.value))
                    setTextSize(sz)
                    if (selectedItem?.type === 'text') {
                      setAnnotations((prev) => prev.map((a) => (a.id === selectedId ? { ...a, fontSize: sz } : a)))
                    }
                  }}
                  className="w-14 bg-white border border-indigo-200 rounded px-1.5 py-1 text-center font-medium"
                />
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
                  className={`px-2 py-1 font-bold rounded border ${
                    (selectedItem?.type === 'text' ? selectedItem.isBold : textBold)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-indigo-200 text-indigo-900'
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
                  className={`px-2 py-1 italic font-serif rounded border ${
                    (selectedItem?.type === 'text' ? selectedItem.isItalic : textItalic)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-indigo-200 text-indigo-900'
                  }`}
                >
                  I
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span>Color:</span>
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
                    className={`w-5 h-5 rounded-full border-2 ${
                      (selectedItem?.type === 'text' ? selectedItem.color : textColor) === c
                        ? 'border-indigo-600 scale-110'
                        : 'border-white'
                    }`}
                  />
                ))}
              </div>
              {selectedItem && (
                <button
                  onClick={deleteSelected}
                  className="ml-auto flex items-center gap-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded border border-red-200 font-semibold transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Item
                </button>
              )}
            </div>
          )}

          {(activeTool === 'whiteout' || (selectedItem && selectedItem.type === 'whiteout')) && (
            <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-4 flex-wrap text-xs">
              <span className="font-bold text-slate-800">Box &amp; Whiteout Options:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setBoxColor('#ffffff')
                    setBoxOpacity(1.0)
                    if (selectedItem?.type === 'whiteout') {
                      setAnnotations((prev) => prev.map((a) => (a.id === selectedId ? { ...a, color: '#ffffff', opacity: 1.0 } : a)))
                    }
                  }}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded font-medium shadow-xs hover:bg-slate-50"
                >
                  ⬜ Solid White (Erase Text)
                </button>
                <button
                  onClick={() => {
                    setBoxColor('#000000')
                    setBoxOpacity(1.0)
                    if (selectedItem?.type === 'whiteout') {
                      setAnnotations((prev) => prev.map((a) => (a.id === selectedId ? { ...a, color: '#000000', opacity: 1.0 } : a)))
                    }
                  }}
                  className="px-2.5 py-1 bg-black text-white rounded font-medium shadow-xs"
                >
                  ⬛ Black (Redaction)
                </button>
                <button
                  onClick={() => {
                    setBoxColor('#fef08a')
                    setBoxOpacity(0.4)
                    if (selectedItem?.type === 'whiteout') {
                      setAnnotations((prev) => prev.map((a) => (a.id === selectedId ? { ...a, color: '#fef08a', opacity: 0.4 } : a)))
                    }
                  }}
                  className="px-2.5 py-1 bg-yellow-200 text-yellow-900 border border-yellow-300 rounded font-medium shadow-xs"
                >
                  🟨 Yellow Highlighter
                </button>
              </div>

              {selectedItem && (
                <button
                  onClick={deleteSelected}
                  className="ml-auto flex items-center gap-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded border border-red-200 font-semibold transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Item
                </button>
              )}
            </div>
          )}

          {activeTool === 'draw' && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-2 flex items-center gap-4 flex-wrap text-xs">
              <span className="font-bold text-rose-900">Pen / Highlighter:</span>
              <div className="flex items-center gap-2">
                <span>Color:</span>
                {[
                  { c: '#000000', o: 1.0 },
                  { c: '#2563eb', o: 1.0 },
                  { c: '#ef4444', o: 1.0 },
                  { c: '#eab308', o: 0.45 }, // Highlighter
                  { c: '#22c55e', o: 0.45 },
                ].map((item) => (
                  <button
                    key={item.c}
                    onClick={() => {
                      setDrawColor(item.c)
                      setDrawOpacity(item.o)
                    }}
                    style={{ backgroundColor: item.c }}
                    className={`w-5 h-5 rounded-full border-2 ${drawColor === item.c ? 'border-rose-600 scale-110' : 'border-white'}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span>Thickness:</span>
                {[2, 4, 8, 14].map((w) => (
                  <button
                    key={w}
                    onClick={() => setDrawWidth(w)}
                    className={`px-2 py-0.5 rounded font-medium border ${
                      drawWidth === w ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-rose-200 text-rose-900'
                    }`}
                  >
                    {w}px
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Canvas Workspace Viewport */}
          <div
            className="border border-slate-200 rounded-2xl bg-slate-100/90 shadow-inner overflow-auto flex justify-center items-start p-6"
            style={{ maxHeight: '72vh', minHeight: '400px' }}
          >
            <div
              className="relative shadow-2xl bg-white rounded transition-shadow duration-200 select-none"
              style={{
                width: pageDimensions.width * scale,
                height: pageDimensions.height * scale,
                cursor:
                  activeTool === 'text'
                    ? 'text'
                    : activeTool === 'whiteout'
                    ? 'crosshair'
                    : activeTool === 'draw'
                    ? 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'black\' stroke-width=\'2\'><path d=\'M15.232 5.232l3.536 3.536M6.5 21.036H3v-3.572L16.732 3.732z\'/></svg>") 0 16, crosshair'
                    : 'default',
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {/* PDF.js Rendered Canvas */}
              <canvas ref={canvasRef} className="block pointer-events-none w-full h-full" />

              {/* Freehand SVG Layer for drawing strokes */}
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

              {/* Interactive Annotations Overlay */}
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
                            className="absolute -top-3.5 -right-3.5 w-6 h-6 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md cursor-pointer z-30 transition-transform hover:scale-110"
                            title="Delete this box"
                          >
                            ✕
                          </button>
                          {/* Resize handle */}
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
                          minWidth: '50px',
                          width: `${Math.max(50, item.text.length * item.fontSize * scale * 0.65)}px`,
                        }}
                      />
                      {isSelected && (
                        <button
                          type="button"
                          onPointerDown={(e) => { e.stopPropagation(); e.preventDefault() }}
                          onMouseDown={(e) => { e.stopPropagation(); e.preventDefault() }}
                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); deleteAnnotation(item.id) }}
                          className="absolute -top-3.5 -right-3.5 w-5 h-5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md cursor-pointer z-30 transition-transform hover:scale-110"
                          title="Delete this text"
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
                            className="absolute -top-3.5 -right-3.5 w-6 h-6 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md cursor-pointer z-30 transition-transform hover:scale-110"
                            title="Delete this image"
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

          {/* Quick Toolbar Help Footer */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-2">
            <div className="flex items-center gap-4">
              <span>💡 <strong>Tip:</strong> Click on any placed text or box to edit or drag it.</span>
              {annotations.length > 0 && (
                <span className="text-indigo-600 font-medium">
                  {annotations.length} annotation{annotations.length !== 1 ? 's' : ''} on this document
                </span>
              )}
            </div>
            <button
              onClick={handleReset}
              className="text-slate-400 hover:text-red-500 underline"
            >
              Upload a different PDF
            </button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  )
}
