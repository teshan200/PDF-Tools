import { useState, useEffect, useRef, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import ToolPageLayout from '../components/ToolPageLayout'
import DropZone from '../components/DropZone'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import DownloadButton from '../components/DownloadButton'
import { useToolProcessor } from '../hooks/useToolProcessor'

// Configure worker to use locally bundled worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc

// Render scale: 1 PDF pt = SCALE canvas pixels
const SCALE = 1.4

// ─── Types ────────────────────────────────────────────────────────────────────
interface TextEl {
  id: number
  text: string
  page: number       // 1-indexed
  x: number          // PDF points from left (top-left origin)
  y: number          // PDF points from top
  fontSize: number
  fontFamily: string
  fontStyle: 'normal' | 'Bold' | 'Italic'
  opacity: number    // 1–100
  underline: boolean
}

let _nextId = 1
function makeEl(x: number, y: number, page: number): TextEl {
  return {
    id: _nextId++,
    text: '',
    page,
    x: Math.round(x),
    y: Math.round(y),
    fontSize: 16,
    fontFamily: 'Arial',
    fontStyle: 'normal',
    opacity: 100,
    underline: false,
  }
}

// ─── Properties Panel ─────────────────────────────────────────────────────────
function PropertiesPanel({
  el,
  numPages,
  onChange,
  onRemove,
  textareaRef,
}: {
  el: TextEl
  numPages: number
  onChange: <K extends keyof TextEl>(k: K, v: TextEl[K]) => void
  onRemove: () => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}) {
  const inp = 'w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400'
  const lbl = 'text-xs font-semibold text-slate-500 mb-1 block'

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
          Text Properties
        </h3>
        <button
          onClick={onRemove}
          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Remove
        </button>
      </div>

      {/* Text content */}
      <div>
        <label className={lbl}>Text Content</label>
        <textarea
          ref={textareaRef as React.RefObject<HTMLTextAreaElement>}
          className={`${inp} resize-none h-20`}
          placeholder="Type your text here…"
          value={el.text}
          onChange={e => onChange('text', e.target.value)}
        />
      </div>

      {/* Page */}
      {numPages > 1 && (
        <div>
          <label className={lbl}>Page</label>
          <select className={inp} value={el.page} onChange={e => onChange('page', Number(e.target.value))}>
            {Array.from({ length: numPages }, (_, i) => (
              <option key={i + 1} value={i + 1}>Page {i + 1}</option>
            ))}
          </select>
        </div>
      )}

      {/* Position (manual override) */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={lbl}>X (pt)</label>
          <input type="number" className={inp} value={el.x} min={0}
            onChange={e => onChange('x', Math.max(0, Number(e.target.value)))} />
        </div>
        <div>
          <label className={lbl}>Y (pt)</label>
          <input type="number" className={inp} value={el.y} min={0}
            onChange={e => onChange('y', Math.max(0, Number(e.target.value)))} />
        </div>
      </div>

      {/* Font family */}
      <div>
        <label className={lbl}>Font</label>
        <select className={inp} value={el.fontFamily} onChange={e => onChange('fontFamily', e.target.value)}>
          {['Arial', 'Verdana', 'Courier', 'Times New Roman', 'Comic Sans MS'].map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Size + Style */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={lbl}>Size (pt)</label>
          <input type="number" className={inp} value={el.fontSize} min={6} max={144}
            onChange={e => onChange('fontSize', Math.max(6, Math.min(144, Number(e.target.value))))} />
        </div>
        <div>
          <label className={lbl}>Style</label>
          <select className={inp} value={el.fontStyle} onChange={e => onChange('fontStyle', e.target.value as any)}>
            <option value="normal">Normal</option>
            <option value="Bold">Bold</option>
            <option value="Italic">Italic</option>
          </select>
        </div>
      </div>

      {/* Opacity slider */}
      <div>
        <label className={lbl}>Opacity — {el.opacity}%</label>
        <input type="range" min={10} max={100} value={el.opacity}
          onChange={e => onChange('opacity', Number(e.target.value))}
          className="w-full accent-indigo-600 h-1.5 rounded-full" />
      </div>

      {/* Underline */}
      <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-700 hover:text-indigo-700 transition-colors">
        <input type="checkbox" checked={el.underline}
          onChange={e => onChange('underline', e.target.checked)}
          className="w-4 h-4 accent-indigo-600 rounded" />
        Underline text
      </label>

      {/* Preview */}
      <div className="border border-dashed border-slate-200 rounded-lg p-3 bg-slate-50">
        <p className="text-[10px] text-slate-400 mb-1.5 font-semibold uppercase tracking-wide">Preview</p>
        <p
          style={{
            fontFamily: el.fontFamily,
            fontSize: Math.min(el.fontSize, 24),
            fontWeight: el.fontStyle === 'Bold' ? 'bold' : 'normal',
            fontStyle: el.fontStyle === 'Italic' ? 'italic' : 'normal',
            textDecoration: el.underline ? 'underline' : 'none',
            opacity: el.opacity / 100,
            wordBreak: 'break-word',
            minHeight: '1.5em',
            color: '#1e293b',
          }}
        >
          {el.text || <span className="text-slate-300 italic">Preview will appear here…</span>}
        </p>
      </div>
    </div>
  )
}

// ─── Draggable Text Overlay on the canvas ─────────────────────────────────────
function TextOverlay({
  el,
  isSelected,
  onPointerDown,
}: {
  el: TextEl
  isSelected: boolean
  onPointerDown: (e: React.PointerEvent) => void
}) {
  const left = el.x * SCALE
  const top  = el.y * SCALE

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        minWidth: 80,
        cursor: 'move',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onPointerDown={onPointerDown}
    >
      {/* Selection ring + label */}
      <div
        className={[
          'px-1.5 py-0.5 rounded transition-all max-w-[400px] break-words',
          isSelected
            ? 'ring-2 ring-indigo-500 bg-indigo-50/70 shadow-lg shadow-indigo-200/50'
            : 'ring-1 ring-dashed ring-slate-400/70 hover:ring-indigo-400 hover:bg-indigo-50/30',
        ].join(' ')}
        style={{
          fontFamily: el.fontFamily,
          fontSize: el.fontSize * SCALE * 0.75,
          fontWeight: el.fontStyle === 'Bold' ? 'bold' : 'normal',
          fontStyle: el.fontStyle === 'Italic' ? 'italic' : 'normal',
          textDecoration: el.underline ? 'underline' : 'none',
          opacity: el.opacity / 100,
          lineHeight: 1.25,
          color: '#111',
          whiteSpace: 'pre-wrap',
          minHeight: el.fontSize * SCALE * 0.75 * 1.4,
        }}
      >
        {el.text || (
          <span className="italic text-slate-400" style={{ fontSize: '0.75rem' }}>
            {isSelected ? 'Type in the panel →' : 'Empty text'}
          </span>
        )}
      </div>

      {/* Small drag handle badge on selected */}
      {isSelected && (
        <div className="absolute -top-5 left-0 flex items-center gap-1 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap select-none pointer-events-none">
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M7 8h10M7 12h10M7 16h10" />
          </svg>
          Drag to move
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EditPDF() {
  const { files, setFiles, isLoading, error, downloadUrl, downloadName, progress, process, reset } =
    useToolProcessor('/api/edit-pdf', 'edited.pdf')

  // PDF.js state
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [loadingDoc, setLoadingDoc] = useState(false)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [rendering, setRendering] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Text elements
  const [elements, setElements] = useState<TextEl[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<{
    id: number; startX: number; startY: number; origX: number; origY: number
  } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Load PDF using ArrayBuffer
  useEffect(() => {
    const file = files[0]
    if (!file) {
      setPdfDoc(null)
      setNumPages(0)
      setElements([])
      setSelectedId(null)
      setLoadError(null)
      return
    }

    let cancelled = false
    setLoadingDoc(true)
    setLoadError(null)

    file.arrayBuffer()
      .then(buffer => {
        if (cancelled) return
        return pdfjsLib
          .getDocument({ data: new Uint8Array(buffer) })
          .promise
      })
      .then((doc: any) => {
        if (cancelled || !doc) return
        setPdfDoc(doc)
        setNumPages(doc.numPages)
        setCurrentPage(1)
        setElements([])
        setSelectedId(null)
        setLoadingDoc(false)
      })
      .catch((err: any) => {
        if (cancelled) return
        console.error('Failed to load PDF document:', err)
        setLoadError(err?.message || 'Could not parse this PDF file.')
        setLoadingDoc(false)
      })

    return () => {
      cancelled = true
    }
  }, [files])

  // Render current page to canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return
    let renderTask: any = null
    setRendering(true)

    pdfDoc.getPage(currentPage).then((page: any) => {
      const viewport = page.getViewport({ scale: SCALE })
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width  = viewport.width
      canvas.height = viewport.height

      renderTask = page.render({ canvasContext: ctx, viewport })
      renderTask.promise
        .then(() => {
          setRendering(false)
        })
        .catch((err: any) => {
          if (err?.name !== 'RenderingCancelledException') {
            console.error('Canvas render error:', err)
          }
          setRendering(false)
        })
    }).catch((err: any) => {
      console.error('Get page error:', err)
      setRendering(false)
    })

    return () => {
      if (renderTask) {
        renderTask.cancel()
      }
    }
  }, [pdfDoc, currentPage])

  // Auto-focus textarea when a new element is selected
  useEffect(() => {
    if (selectedId !== null) {
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [selectedId])

  // Click on canvas → add new text element
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (dragRef.current) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const x = (e.clientX - rect.left) / SCALE
    const y = (e.clientY - rect.top)  / SCALE
    const el = makeEl(x, y, currentPage)
    setElements(prev => [...prev, el])
    setSelectedId(el.id)
  }, [currentPage])

  // Pointer down on a text overlay → start drag
  const startDrag = useCallback((id: number, e: React.PointerEvent) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setSelectedId(id)
    const el = elements.find(x => x.id === id)
    if (!el) return
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y }
    const target = e.currentTarget as HTMLElement

    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current || dragRef.current.id !== id) return
      const dx = (ev.clientX - dragRef.current.startX) / SCALE
      const dy = (ev.clientY - dragRef.current.startY) / SCALE
      setElements(prev => prev.map(el =>
        el.id === id
          ? { ...el, x: Math.round(Math.max(0, dragRef.current!.origX + dx)), y: Math.round(Math.max(0, dragRef.current!.origY + dy)) }
          : el
      ))
    }

    const onUp = () => {
      setTimeout(() => { dragRef.current = null }, 0)
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
    }

    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
  }, [elements])

  const updateEl = useCallback(<K extends keyof TextEl>(k: K, v: TextEl[K]) => {
    if (selectedId === null) return
    setElements(prev => prev.map(e => e.id === selectedId ? { ...e, [k]: v } : e))
  }, [selectedId])

  const removeEl = useCallback(() => {
    if (selectedId === null) return
    setElements(prev => prev.filter(e => e.id !== selectedId))
    setSelectedId(null)
  }, [selectedId])

  function handleProcess() {
    if (!elements.length) return
    const payload = elements.map(el => ({
      text: el.text || 'Text',
      page: String(el.page),
      x: el.x,
      y: el.y,
      w: Math.max(200, el.text.length * el.fontSize * 0.55),
      h: Math.max(40, el.fontSize * 2),
      fontSize: el.fontSize,
      fontFamily: el.fontFamily,
      fontStyle: el.fontStyle,
      opacity: el.opacity,
      underline: el.underline,
    }))
    process({ elements: payload })
  }

  const pageEls = elements.filter(e => e.page === currentPage)
  const selectedEl = elements.find(e => e.id === selectedId) ?? null

  const EditIcon = () => (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )

  function handleReset() {
    reset()
    setFiles([])
    setPdfDoc(null)
    setElements([])
    setSelectedId(null)
    setLoadError(null)
  }

  return (
    <ToolPageLayout
      title="Edit PDF"
      description="Click anywhere on the PDF preview to place text, then drag to reposition."
      color="indigo"
      icon={<EditIcon />}
    >
      {downloadUrl ? (
        <DownloadButton url={downloadUrl} filename={downloadName} onReset={handleReset} label="Download Edited PDF" />
      ) : isLoading ? (
        <Spinner message={progress} />
      ) : loadingDoc ? (
        <Spinner message="Rendering PDF preview..." />
      ) : !pdfDoc ? (
        /* ── Step 1: Upload ── */
        <div className="space-y-4">
          <DropZone onFilesSelected={setFiles} selectedFiles={files} hint="Upload the PDF you want to add text to" />
          {loadError && <ErrorMessage message={loadError} onRetry={handleReset} />}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 items-start">
            <svg className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-indigo-800 space-y-1">
              <p className="font-semibold">How it works</p>
              <ul className="list-disc list-inside space-y-0.5 text-indigo-700">
                <li>Upload your PDF — pages are rendered as an interactive preview</li>
                <li>Click anywhere on the page to drop a text box</li>
                <li>Drag text boxes to reposition them</li>
                <li>Edit font, size &amp; style in the panel on the right</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* ── Step 2: Canvas Editor ── */
        <div className="space-y-4">
          {/* ── Toolbar ── */}
          <div className="flex items-center gap-3 flex-wrap bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
            {/* Page nav */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-medium text-slate-700 min-w-[90px] text-center">
                Page {currentPage} / {numPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                disabled={currentPage >= numPages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Element count */}
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              {elements.length} text{elements.length !== 1 ? 's' : ''} total
              {numPages > 1 && ` • ${pageEls.length} on this page`}
            </span>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
              >
                Change file
              </button>
            </div>
          </div>

          {/* ── Editor split ── */}
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            {/* Canvas */}
            <div className="flex-1 min-w-0 overflow-hidden w-full">
              <div
                className="relative border border-slate-200 rounded-xl overflow-auto bg-slate-100 shadow-inner flex justify-center p-4"
                style={{ maxHeight: '75vh', cursor: 'crosshair' }}
                onClick={e => {
                  if ((e.target as HTMLElement).closest('[data-text-overlay]')) return
                  handleCanvasClick(e)
                }}
              >
                {rendering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-20 rounded-xl">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* The canvas + overlay container */}
                <div className="relative shadow-lg bg-white rounded">
                  <canvas ref={canvasRef} className="block select-none" />

                  {/* Text overlays for current page */}
                  {pageEls.map(el => (
                    <div key={el.id} data-text-overlay="true"
                      onPointerDown={e => startDrag(el.id, e)}
                      onClick={e => { e.stopPropagation(); setSelectedId(el.id) }}
                    >
                      <TextOverlay
                        el={el}
                        isSelected={el.id === selectedId}
                        onPointerDown={e => startDrag(el.id, e)}
                      />
                    </div>
                  ))}
                </div>

                {/* Hint overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
                  <span className="text-[11px] text-slate-600 bg-white/90 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow border border-slate-200 select-none font-medium">
                    ✦ Click anywhere on the PDF to place text • Drag to move
                  </span>
                </div>
              </div>
            </div>

            {/* Properties panel */}
            <div className="w-full lg:w-72 shrink-0">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm lg:sticky lg:top-4">
                {selectedEl ? (
                  <PropertiesPanel
                    el={selectedEl}
                    numPages={numPages}
                    onChange={updateEl}
                    onRemove={removeEl}
                    textareaRef={textareaRef}
                  />
                ) : (
                  <div className="flex flex-col items-center text-center py-10 gap-3 text-slate-400">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                      <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">Click on the PDF to add text</p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Or click an existing text box to edit its style and content.
                      </p>
                    </div>
                    {elements.length > 0 && (
                      <div className="mt-2 w-full space-y-1.5">
                        <p className="text-xs font-semibold text-slate-500 text-left">All text elements:</p>
                        {elements.map(e => (
                          <button
                            key={e.id}
                            onClick={() => {
                              setCurrentPage(e.page)
                              setSelectedId(e.id)
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-600 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 transition-colors border border-slate-100 truncate"
                          >
                            <span className="text-slate-400 mr-1.5">p{e.page}</span>
                            {e.text || <span className="italic text-slate-400">empty</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && <ErrorMessage message={error} onRetry={handleProcess} />}

          {/* Process button */}
          <button
            onClick={handleProcess}
            disabled={!elements.length || elements.every(e => !e.text.trim())}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm text-sm"
          >
            {!elements.length
              ? 'Click on the PDF to add text first'
              : elements.every(e => !e.text.trim())
              ? 'Enter text in at least one text box'
              : `Apply ${elements.filter(e => e.text.trim()).length} Text Edit${elements.filter(e => e.text.trim()).length !== 1 ? 's' : ''} & Download`
            }
          </button>
        </div>
      )}
    </ToolPageLayout>
  )
}
