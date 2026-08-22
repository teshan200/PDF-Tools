import { useState, useCallback } from 'react'
import ToolPageLayout from '../components/ToolPageLayout'
import DropZone from '../components/DropZone'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import DownloadButton from '../components/DownloadButton'
import { useToolProcessor } from '../hooks/useToolProcessor'

function EditIcon() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

// ─── Position Grid Helper ──────────────────────────────────────────────────
// A4 in PDF pts: 595 × 842. Letter: 612 × 792. We use A4 as baseline.
const PAGE_W = 595
const PAGE_H = 842

const PRESET_POSITIONS: Record<string, { x: number; y: number }> = {
  'top-left':      { x: 40,  y: 40  },
  'top-center':    { x: 200, y: 40  },
  'top-right':     { x: 400, y: 40  },
  'middle-left':   { x: 40,  y: 380 },
  'middle-center': { x: 200, y: 380 },
  'middle-right':  { x: 400, y: 380 },
  'bottom-left':   { x: 40,  y: 760 },
  'bottom-center': { x: 200, y: 760 },
  'bottom-right':  { x: 400, y: 760 },
}

// ─── Default element ───────────────────────────────────────────────────────
interface TextEl {
  id: number
  text: string
  page: string
  x: number
  y: number
  w: number
  h: number
  fontSize: number
  fontFamily: string
  fontStyle: string
  fontColor: string
  opacity: number
  underline: boolean
  positionPreset: string
}

function makeDefault(id: number): TextEl {
  return {
    id,
    text: '',
    page: '1',
    x: 40,
    y: 40,
    w: 200,
    h: 40,
    fontSize: 16,
    fontFamily: 'Arial',
    fontStyle: 'null',
    fontColor: '#000000',
    opacity: 100,
    underline: false,
    positionPreset: 'top-left',
  }
}

// ─── Preset Position Picker ────────────────────────────────────────────────
const GRID_KEYS = [
  ['top-left', 'top-center', 'top-right'],
  ['middle-left', 'middle-center', 'middle-right'],
  ['bottom-left', 'bottom-center', 'bottom-right'],
]

function PositionGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1 w-24">
      {GRID_KEYS.map((row) =>
        row.map((key) => (
          <button
            key={key}
            type="button"
            title={key.replace('-', ' ')}
            onClick={() => onChange(key)}
            className={[
              'w-7 h-7 rounded border-2 transition-all',
              value === key
                ? 'bg-indigo-600 border-indigo-600'
                : 'bg-white border-slate-300 hover:border-indigo-400',
            ].join(' ')}
          />
        ))
      )}
    </div>
  )
}

// ─── Single text element card ──────────────────────────────────────────────
function TextCard({
  el,
  index,
  onChange,
  onRemove,
}: {
  el: TextEl
  index: number
  onChange: (updated: TextEl) => void
  onRemove: () => void
}) {
  function set<K extends keyof TextEl>(key: K, val: TextEl[K]) {
    onChange({ ...el, [key]: val })
  }

  function applyPreset(preset: string) {
    const pos = PRESET_POSITIONS[preset]
    if (pos) onChange({ ...el, positionPreset: preset, x: pos.x, y: pos.y })
    else onChange({ ...el, positionPreset: preset })
  }

  const inputCls = 'w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400'
  const labelCls = 'text-xs font-semibold text-slate-500 mb-0.5 block'

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 border-b border-indigo-100">
        <span className="text-sm font-bold text-indigo-700">Text #{index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Text content */}
        <div>
          <label className={labelCls}>Text Content</label>
          <textarea
            className={`${inputCls} resize-none h-16`}
            placeholder="Enter the text to add to the PDF…"
            value={el.text}
            onChange={(e) => set('text', e.target.value)}
          />
        </div>

        {/* Page + Position */}
        <div className="flex gap-4 flex-wrap">
          {/* Page selector */}
          <div className="flex-1 min-w-[120px]">
            <label className={labelCls}>Page(s)</label>
            <input
              type="text"
              className={inputCls}
              placeholder="1 or 1,2,3 or all"
              value={el.page}
              onChange={(e) => set('page', e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">e.g. 1 · 1,3 · all</p>
          </div>

          {/* Position grid */}
          <div>
            <label className={labelCls}>Position on page</label>
            <PositionGrid
              value={el.positionPreset}
              onChange={applyPreset}
            />
          </div>

          {/* Custom X/Y */}
          <div className="flex gap-2 flex-1 min-w-[160px]">
            <div className="flex-1">
              <label className={labelCls}>X (pt)</label>
              <input type="number" className={inputCls} value={el.x}
                min={0} max={PAGE_W}
                onChange={(e) => set('x', Number(e.target.value))} />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Y (pt)</label>
              <input type="number" className={inputCls} value={el.y}
                min={0} max={PAGE_H}
                onChange={(e) => set('y', Number(e.target.value))} />
            </div>
          </div>
        </div>

        {/* Font settings */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className={labelCls}>Font</label>
            <select className={inputCls} value={el.fontFamily}
              onChange={(e) => set('fontFamily', e.target.value)}>
              {['Arial', 'Verdana', 'Courier', 'Times New Roman', 'Comic Sans MS'].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Style</label>
            <select className={inputCls} value={el.fontStyle}
              onChange={(e) => set('fontStyle', e.target.value)}>
              <option value="null">Normal</option>
              <option value="Bold">Bold</option>
              <option value="Italic">Italic</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Size (pt)</label>
            <input type="number" className={inputCls} value={el.fontSize}
              min={6} max={144}
              onChange={(e) => set('fontSize', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Opacity %</label>
            <input type="number" className={inputCls} value={el.opacity}
              min={10} max={100}
              onChange={(e) => set('opacity', Number(e.target.value))} />
          </div>
        </div>

        {/* Underline */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-700 w-fit">
          <input
            type="checkbox"
            checked={el.underline}
            onChange={(e) => set('underline', e.target.checked)}
            className="w-4 h-4 accent-indigo-600"
          />
          Underline text
        </label>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────
let nextId = 1

export default function EditPDF() {
  const {
    files, setFiles,
    isLoading, error, downloadUrl, downloadName, progress,
    process, reset,
  } = useToolProcessor('/api/edit-pdf', 'edited.pdf')

  const [elements, setElements] = useState<TextEl[]>([makeDefault(nextId++)])

  const addElement = useCallback(() => {
    setElements((prev) => [...prev, makeDefault(nextId++)])
  }, [])

  const removeElement = useCallback((id: number) => {
    setElements((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const updateElement = useCallback((updated: TextEl) => {
    setElements((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
  }, [])

  function handleProcess() {
    if (!files.length) return
    const invalid = elements.find((e) => !e.text.trim())
    if (invalid) return
    // Strip `id` and `positionPreset` before sending (not needed by API)
    const payload = elements.map(({ id: _id, positionPreset: _pp, ...rest }) => rest)
    process({ elements: payload })
  }

  const canProcess = files.length > 0 && elements.length > 0 && elements.every((e) => e.text.trim())

  return (
    <ToolPageLayout
      title="Edit PDF"
      description="Add text annotations anywhere on your PDF pages."
      color="indigo"
      icon={<EditIcon />}
    >
      {downloadUrl ? (
        <DownloadButton url={downloadUrl} filename={downloadName} onReset={() => { reset(); setElements([makeDefault(nextId++)]) }} label="Download Edited PDF" />
      ) : isLoading ? (
        <Spinner message={progress} />
      ) : (
        <div className="space-y-6">
          {/* File upload */}
          <DropZone
            onFilesSelected={(f) => setFiles(f)}
            selectedFiles={files}
            hint="Upload the PDF you want to add text to"
          />

          {/* Info callout */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex gap-3 items-start">
            <svg className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-indigo-900">How it works</p>
              <p className="text-xs text-indigo-700 mt-0.5">
                Click the grid to pick a position on the page, or enter exact X/Y coordinates in PDF points (A4 = 595 × 842 pt).
                Add as many text labels as you need, then click <strong>Apply Edits</strong>.
              </p>
            </div>
          </div>

          {/* Text elements list */}
          <div className="space-y-4">
            {elements.map((el, i) => (
              <TextCard
                key={el.id}
                el={el}
                index={i}
                onChange={updateElement}
                onRemove={() => removeElement(el.id)}
              />
            ))}
          </div>

          {/* Add text button */}
          <button
            type="button"
            onClick={addElement}
            className="w-full py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-semibold text-sm hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Another Text
          </button>

          {error && <ErrorMessage message={error} onRetry={handleProcess} />}

          {/* Process button */}
          <button
            type="button"
            onClick={handleProcess}
            disabled={!canProcess}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            {!files.length
              ? 'Upload a PDF first'
              : elements.some((e) => !e.text.trim())
              ? 'Fill in all text fields'
              : 'Apply Edits & Download'}
          </button>
        </div>
      )}
    </ToolPageLayout>
  )
}
