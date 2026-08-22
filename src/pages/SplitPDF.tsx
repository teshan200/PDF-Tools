import { useState, useCallback } from 'react'
import ToolPageLayout from '../components/ToolPageLayout'
import DropZone from '../components/DropZone'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import DownloadButton from '../components/DownloadButton'
import { useToolProcessor } from '../hooks/useToolProcessor'

type SplitMode = 'ranges' | 'fixed' | 'pages'

function SplitIcon() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  )
}

// ── Mini visual illustration for each mode ───────────────────────────────────

function RangesIllustration() {
  return (
    <div className="flex items-center gap-1 justify-center">
      {[1,2,3,'…',7,8].map((p, i) => (
        <div
          key={i}
          className={[
            'w-5 h-7 rounded text-[8px] font-bold flex items-center justify-center border',
            i < 3 ? 'bg-purple-100 border-purple-400 text-purple-700' :
            i === 3 ? 'bg-transparent border-transparent text-slate-400' :
            'bg-purple-50 border-purple-300 text-purple-600',
          ].join(' ')}
        >
          {p}
        </div>
      ))}
      <svg className="w-3 h-3 text-slate-400 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      <div className="flex flex-col gap-1">
        <div className="flex gap-0.5">
          {[1,2,3].map(p => (
            <div key={p} className="w-4 h-5 rounded text-[7px] font-bold flex items-center justify-center bg-purple-200 border border-purple-400 text-purple-800">{p}</div>
          ))}
        </div>
        <div className="flex gap-0.5">
          {[7,8].map(p => (
            <div key={p} className="w-4 h-5 rounded text-[7px] font-bold flex items-center justify-center bg-purple-100 border border-purple-300 text-purple-700">{p}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FixedIllustration({ n }: { n: number }) {
  const pages = [1,2,3,4,5,6]
  const chunks: number[][] = []
  for (let i = 0; i < pages.length; i += n) chunks.push(pages.slice(i, i + n))
  const colors = ['bg-blue-100 border-blue-400 text-blue-700', 'bg-indigo-100 border-indigo-400 text-indigo-700', 'bg-violet-100 border-violet-400 text-violet-700']
  return (
    <div className="flex items-center gap-1.5 justify-center flex-wrap">
      {chunks.map((chunk, ci) => (
        <div key={ci} className="flex gap-0.5">
          {chunk.map(p => (
            <div key={p} className={`w-5 h-7 rounded text-[8px] font-bold flex items-center justify-center border ${colors[ci % colors.length]}`}>{p}</div>
          ))}
        </div>
      ))}
    </div>
  )
}

function PagesIllustration() {
  return (
    <div className="flex items-center gap-0.5 justify-center">
      {[1,2,3,4,5].map(p => (
        <div key={p} className="w-5 h-7 rounded text-[8px] font-bold flex items-center justify-center border bg-emerald-50 border-emerald-400 text-emerald-700">
          {p}
        </div>
      ))}
      <svg className="w-3 h-3 text-slate-400 mx-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(p => (
          <div key={p} className="w-4 h-5 rounded text-[7px] font-bold flex items-center justify-center border bg-emerald-100 border-emerald-400 text-emerald-800">{p}</div>
        ))}
      </div>
    </div>
  )
}

// ── Range tag builder ────────────────────────────────────────────────────────

interface RangeTag {
  id: number
  value: string
  valid: boolean
}

function validateRange(val: string): boolean {
  const trimmed = val.trim()
  if (!trimmed) return false
  // Accept: "3", "1-5"
  return /^\d+(-\d+)?$/.test(trimmed)
}

function RangeBuilder({
  tags,
  onAdd,
  onRemove,
}: {
  tags: RangeTag[]
  onAdd: (val: string) => void
  onRemove: (id: number) => void
}) {
  const [input, setInput] = useState('')
  const [touched, setTouched] = useState(false)

  const isValid = validateRange(input)

  const commit = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setInput('')
    setTouched(false)
  }, [input, onAdd])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    }
  }

  return (
    <div className="space-y-3">
      {/* Tag list */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className={[
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border',
                tag.valid
                  ? 'bg-purple-50 border-purple-300 text-purple-800'
                  : 'bg-red-50 border-red-300 text-red-700',
              ].join(' ')}
            >
              Pages {tag.value}
              <button
                type="button"
                onClick={() => onRemove(tag.id)}
                className="text-current opacity-60 hover:opacity-100 transition-opacity"
                aria-label={`Remove range ${tag.value}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setTouched(true) }}
            onKeyDown={handleKey}
            onBlur={() => setTouched(true)}
            placeholder='e.g.  1-3  or  5  or  8-12'
            className={[
              'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors',
              touched && input && !isValid
                ? 'border-red-400 focus:ring-red-400 bg-red-50'
                : 'border-slate-300 focus:ring-purple-500 focus:border-purple-500',
            ].join(' ')}
          />
          {touched && input && !isValid && (
            <p className="absolute -bottom-5 left-0 text-xs text-red-600">
              Use format: 3 or 1-5
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={commit}
          disabled={!isValid}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm whitespace-nowrap"
        >
          + Add Range
        </button>
      </div>
      <p className="text-xs text-slate-400">
        Press <kbd className="bg-slate-100 border border-slate-300 rounded px-1 py-0.5 text-slate-600 font-mono text-[10px]">Enter</kbd> or click <strong>+ Add Range</strong> after each range · Order doesn't matter
      </p>
    </div>
  )
}

// ── Stepper for "Every N pages" ──────────────────────────────────────────────

function Stepper({ value, onChange, min = 1, max = 100 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="inline-flex items-center gap-0 border border-slate-300 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-lg"
      >
        −
      </button>
      <div className="w-14 h-10 flex items-center justify-center font-bold text-xl text-slate-900 border-x border-slate-300 select-none">
        {value}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-lg"
      >
        +
      </button>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

let tagIdCounter = 0

export default function SplitPDF() {
  const [mode, setMode] = useState<SplitMode>('ranges')
  const [rangeTags, setRangeTags] = useState<RangeTag[]>([])
  const [fixedN, setFixedN] = useState(2)

  const {
    files,
    setFiles,
    isLoading,
    error,
    downloadUrl,
    downloadName,
    progress,
    process,
    reset,
  } = useToolProcessor('/api/split-pdf', 'split-pages.zip')

  const handleAddRange = useCallback((val: string) => {
    setRangeTags((prev) => [...prev, { id: ++tagIdCounter, value: val, valid: validateRange(val) }])
  }, [])

  const handleRemoveRange = useCallback((id: number) => {
    setRangeTags((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const handleReset = () => {
    reset()
    setRangeTags([])
    setFixedN(2)
  }

  const handleProcess = () => {
    const extra: Record<string, string> = { mode }
    if (mode === 'ranges') {
      extra.ranges = rangeTags.map((t) => t.value).join(',')
    } else if (mode === 'fixed') {
      extra.fixed_range = String(fixedN)
    }
    process(extra)
  }

  const canProcess =
    files.length > 0 &&
    (mode === 'fixed' || mode === 'pages' || (mode === 'ranges' && rangeTags.length > 0))

  const MODES: { value: SplitMode; label: string; subtitle: string; visual: React.ReactNode; accent: string; border: string; bg: string }[] = [
    {
      value: 'ranges',
      label: 'Custom Ranges',
      subtitle: 'Pick exactly which pages go into each file',
      visual: <RangesIllustration />,
      accent: 'text-purple-700',
      border: 'border-purple-500',
      bg: 'bg-purple-50',
    },
    {
      value: 'fixed',
      label: `Every ${fixedN} Page${fixedN !== 1 ? 's' : ''}`,
      subtitle: 'Split into equal-sized chunks',
      visual: <FixedIllustration n={fixedN} />,
      accent: 'text-blue-700',
      border: 'border-blue-500',
      bg: 'bg-blue-50',
    },
    {
      value: 'pages',
      label: 'Individual Pages',
      subtitle: 'One PDF file per page',
      visual: <PagesIllustration />,
      accent: 'text-emerald-700',
      border: 'border-emerald-500',
      bg: 'bg-emerald-50',
    },
  ]

  return (
    <ToolPageLayout
      title="Split PDF"
      description="Divide a PDF into multiple documents — your way."
      color="purple"
      icon={<SplitIcon />}
    >
      {downloadUrl ? (
        <DownloadButton
          url={downloadUrl}
          filename={downloadName}
          onReset={handleReset}
          label="Download Split Files (.zip)"
        />
      ) : isLoading ? (
        <Spinner message={progress} />
      ) : (
        <div className="space-y-6">

          {/* Step 1 — Upload */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
              <p className="font-semibold text-slate-800">Upload your PDF</p>
            </div>
            <DropZone
              onFilesSelected={(f) => setFiles(f)}
              selectedFiles={files}
              hint="Select one PDF to split"
            />
          </div>

          {/* Step 2 — Choose mode */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
              <p className="font-semibold text-slate-800">Choose how to split</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  className={[
                    'flex flex-col items-center gap-3 p-4 rounded-2xl border-2 text-center transition-all duration-150',
                    mode === m.value
                      ? `${m.border} ${m.bg} shadow-sm`
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {/* Visual preview */}
                  <div className="py-2 w-full overflow-hidden">{m.visual}</div>
                  <div>
                    <p className={`text-sm font-bold ${mode === m.value ? m.accent : 'text-slate-800'}`}>
                      {m.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">{m.subtitle}</p>
                  </div>
                  {/* Selected indicator */}
                  <div className={[
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    mode === m.value ? `${m.border} ${m.bg}` : 'border-slate-300',
                  ].join(' ')}>
                    {mode === m.value && (
                      <div className={`w-2 h-2 rounded-full ${m.border.replace('border-', 'bg-')}`} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3 — Configure */}
          {mode === 'ranges' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                <p className="font-semibold text-slate-800">Define page ranges</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <RangeBuilder
                  tags={rangeTags}
                  onAdd={handleAddRange}
                  onRemove={handleRemoveRange}
                />
                {rangeTags.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold text-purple-700">{rangeTags.length}</span> range{rangeTags.length !== 1 ? 's' : ''} → <span className="font-semibold text-purple-700">{rangeTags.length}</span> output file{rangeTags.length !== 1 ? 's' : ''}
                    </p>
                    <button
                      type="button"
                      onClick={() => setRangeTags([])}
                      className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {mode === 'fixed' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                <p className="font-semibold text-slate-800">Set chunk size</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5">
                <Stepper value={fixedN} onChange={setFixedN} min={1} max={500} />
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {fixedN === 1 ? 'Every page' : `Every ${fixedN} pages`} becomes a separate file
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Example: a 10-page PDF with chunks of {fixedN} → <strong>{Math.ceil(10 / fixedN)} files</strong>
                  </p>
                </div>
              </div>
              {/* Live mini preview */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 mb-2">Preview (first 6 pages)</p>
                <FixedIllustration n={fixedN} />
              </div>
            </div>
          )}

          {mode === 'pages' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex gap-4 items-start">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-emerald-900">Each page → its own PDF</p>
                <p className="text-sm text-emerald-700 mt-1 leading-relaxed">
                  Every page in your PDF will become a separate file. All files will be packaged into a single <strong>.zip</strong> for download.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && <ErrorMessage message={error} onRetry={handleProcess} />}

          {/* Action button */}
          <button
            type="button"
            onClick={handleProcess}
            disabled={!canProcess}
            className={[
              'w-full py-4 font-bold rounded-xl transition-colors shadow-sm text-white text-base',
              canProcess
                ? mode === 'ranges'
                  ? 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
                  : mode === 'fixed'
                    ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed',
            ].join(' ')}
          >
            {!files.length
              ? '① Upload a PDF first'
              : mode === 'ranges' && rangeTags.length === 0
                ? '③ Add at least one page range'
                : mode === 'ranges'
                  ? `Split into ${rangeTags.length} file${rangeTags.length !== 1 ? 's' : ''} →`
                  : mode === 'fixed'
                    ? `Split every ${fixedN} page${fixedN !== 1 ? 's' : ''} →`
                    : 'Split into Individual Pages →'}
          </button>

          <p className="text-xs text-slate-400 text-center">
            Result will be downloaded as a <strong>.zip</strong> file containing all split PDFs
          </p>
        </div>
      )}
    </ToolPageLayout>
  )
}
