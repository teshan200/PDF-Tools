import { useState, useCallback } from 'react'
import { PDFDocument } from 'pdf-lib'
import { zipSync } from 'fflate'
import ToolPageLayout from '../components/ToolPageLayout'
import DropZone from '../components/DropZone'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import DownloadButton from '../components/DownloadButton'

type SplitMode = 'ranges' | 'fixed' | 'pages'

function SplitIcon() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  )
}

function RangesIllustration() {
  return (
    <div className="flex items-center gap-1 justify-center">
      {[1, 2, 3, '…', 7, 8].map((p, i) => (
        <div
          key={i}
          className={[
            'w-5 h-7 rounded text-[8px] font-bold flex items-center justify-center border',
            i < 3
              ? 'bg-purple-100 dark:bg-purple-950 border-purple-400 dark:border-purple-600 text-purple-700 dark:text-purple-300'
              : i === 3
              ? 'bg-transparent border-transparent text-slate-400'
              : 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400',
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
          {[1, 2, 3].map((p) => (
            <div key={p} className="w-4 h-5 rounded text-[7px] font-bold flex items-center justify-center bg-purple-200 dark:bg-purple-900 border border-purple-400 text-purple-800 dark:text-purple-200">{p}</div>
          ))}
        </div>
        <div className="flex gap-0.5">
          {[7, 8].map((p) => (
            <div key={p} className="w-4 h-5 rounded text-[7px] font-bold flex items-center justify-center bg-purple-100 dark:bg-purple-950 border border-purple-300 text-purple-700 dark:text-purple-300">{p}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FixedIllustration({ n }: { n: number }) {
  const pages = [1, 2, 3, 4, 5, 6]
  const chunks: number[][] = []
  for (let i = 0; i < pages.length; i += n) chunks.push(pages.slice(i, i + n))
  const colors = [
    'bg-blue-100 dark:bg-blue-950 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300',
    'bg-indigo-100 dark:bg-indigo-950 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300',
    'bg-violet-100 dark:bg-violet-950 border-violet-400 dark:border-violet-600 text-violet-700 dark:text-violet-300',
  ]
  return (
    <div className="flex items-center gap-1.5 justify-center flex-wrap">
      {chunks.map((chunk, ci) => (
        <div key={ci} className="flex gap-0.5">
          {chunk.map((p) => (
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
      {[1, 2, 3, 4, 5].map((p) => (
        <div key={p} className="w-5 h-7 rounded text-[8px] font-bold flex items-center justify-center border bg-emerald-50 dark:bg-emerald-950 border-emerald-400 text-emerald-700 dark:text-emerald-300">
          {p}
        </div>
      ))}
      <svg className="w-3 h-3 text-slate-400 mx-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((p) => (
          <div key={p} className="w-4 h-5 rounded text-[7px] font-bold flex items-center justify-center border bg-emerald-100 dark:bg-emerald-900 border-emerald-400 text-emerald-800 dark:text-emerald-200">{p}</div>
        ))}
      </div>
    </div>
  )
}

interface RangeTag {
  id: number
  value: string
  valid: boolean
}

function validateRange(val: string): boolean {
  const trimmed = val.trim()
  if (!trimmed) return false
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
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className={[
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border',
                tag.valid
                  ? 'bg-purple-50 dark:bg-purple-950 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-200'
                  : 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300',
              ].join(' ')}
            >
              Pages {tag.value}
              <button
                type="button"
                onClick={() => onRemove(tag.id)}
                className="text-current opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
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

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setTouched(true) }}
            onKeyDown={handleKey}
            onBlur={() => setTouched(true)}
            placeholder="e.g. 1-3 or 5 or 8-12"
            className={[
              'w-full px-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-colors',
              touched && input && !isValid
                ? 'border-red-400 focus:ring-red-400 bg-red-50 dark:bg-red-950/30'
                : 'border-slate-300 dark:border-slate-700 focus:ring-purple-500 focus:border-purple-500',
            ].join(' ')}
          />
        </div>
        <button
          type="button"
          onClick={commit}
          disabled={!isValid}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm whitespace-nowrap cursor-pointer"
        >
          + Add Range
        </button>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Press <kbd className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1 py-0.5 text-slate-600 dark:text-slate-300 font-mono text-[10px]">Enter</kbd> or click <strong>+ Add Range</strong>
      </p>
    </div>
  )
}

function Stepper({ value, onChange, min = 1, max = 100 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="inline-flex items-center gap-0 border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-lg cursor-pointer"
      >
        −
      </button>
      <div className="w-14 h-10 flex items-center justify-center font-bold text-xl text-slate-900 dark:text-white border-x border-slate-300 dark:border-slate-700 select-none">
        {value}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-lg cursor-pointer"
      >
        +
      </button>
    </div>
  )
}

let tagIdCounter = 0

export default function SplitPDF() {
  const [files, setFiles] = useState<File[]>([])
  const [mode, setMode] = useState<SplitMode>('ranges')
  const [rangeTags, setRangeTags] = useState<RangeTag[]>([])
  const [fixedN, setFixedN] = useState(2)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState('split-documents.zip')
  const [progress, setProgress] = useState('')

  const handleAddRange = useCallback((val: string) => {
    setRangeTags((prev) => [...prev, { id: ++tagIdCounter, value: val, valid: validateRange(val) }])
  }, [])

  const handleRemoveRange = useCallback((id: number) => {
    setRangeTags((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const handleReset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    setFiles([])
    setDownloadUrl(null)
    setError(null)
    setProgress('')
    setRangeTags([])
    setFixedN(2)
  }

  const handleSplit = async () => {
    if (!files.length) return
    setIsLoading(true)
    setError(null)
    setProgress('Loading PDF locally in browser memory...')

    try {
      const fileBuffer = await files[0].arrayBuffer()
      const srcDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true })
      const totalPages = srcDoc.getPageCount()

      if (totalPages === 0) {
        throw new Error('The uploaded PDF contains no pages.')
      }

      const zipFiles: Record<string, Uint8Array> = {}
      const baseName = files[0].name.replace(/\.pdf$/i, '')

      if (mode === 'ranges') {
        setProgress('Extracting custom ranges...')
        for (let i = 0; i < rangeTags.length; i++) {
          const tag = rangeTags[i].value
          const rangeDoc = await PDFDocument.create()

          let pageIndices: number[] = []
          if (tag.includes('-')) {
            const [startStr, endStr] = tag.split('-')
            const start = Math.max(1, parseInt(startStr, 10))
            const end = Math.min(totalPages, parseInt(endStr, 10))
            for (let p = start; p <= end; p++) pageIndices.push(p - 1)
          } else {
            const p = parseInt(tag, 10)
            if (p >= 1 && p <= totalPages) pageIndices.push(p - 1)
          }

          if (pageIndices.length > 0) {
            const copied = await rangeDoc.copyPages(srcDoc, pageIndices)
            copied.forEach((page) => rangeDoc.addPage(page))
            const bytes = await rangeDoc.save()
            zipFiles[`${baseName}_range_${tag}.pdf`] = bytes
          }
        }
      } else if (mode === 'fixed') {
        setProgress(`Splitting into chunks of ${fixedN} pages...`)
        let chunkIndex = 1
        for (let i = 0; i < totalPages; i += fixedN) {
          const rangeDoc = await PDFDocument.create()
          const chunkIndices: number[] = []
          for (let p = i; p < Math.min(totalPages, i + fixedN); p++) {
            chunkIndices.push(p)
          }
          const copied = await rangeDoc.copyPages(srcDoc, chunkIndices)
          copied.forEach((page) => rangeDoc.addPage(page))
          const bytes = await rangeDoc.save()
          zipFiles[`${baseName}_part_${chunkIndex}.pdf`] = bytes
          chunkIndex++
        }
      } else if (mode === 'pages') {
        setProgress('Extracting all individual pages...')
        for (let i = 0; i < totalPages; i++) {
          const singleDoc = await PDFDocument.create()
          const [copied] = await singleDoc.copyPages(srcDoc, [i])
          singleDoc.addPage(copied)
          const bytes = await singleDoc.save()
          zipFiles[`${baseName}_page_${i + 1}.pdf`] = bytes
        }
      }

      const fileKeys = Object.keys(zipFiles)
      if (fileKeys.length === 0) {
        throw new Error('No valid pages matched the specified split criteria.')
      }

      if (fileKeys.length === 1) {
        // Only 1 file created, deliver as direct PDF
        const blob = new Blob([zipFiles[fileKeys[0]]], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        setDownloadUrl(url)
        setDownloadName(fileKeys[0])
      } else {
        // Multiple files, package in ZIP
        setProgress('Packaging split PDFs into ZIP...')
        const zipped = zipSync(zipFiles)
        const blob = new Blob([zipped], { type: 'application/zip' })
        const url = URL.createObjectURL(blob)
        setDownloadUrl(url)
        setDownloadName(`${baseName}_split.zip`)
      }
    } catch (err) {
      console.error('Split error:', err)
      setError(err instanceof Error ? err.message : 'Failed to split PDF.')
    } finally {
      setIsLoading(false)
      setProgress('')
    }
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
      accent: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950/60',
    },
    {
      value: 'fixed',
      label: `Every ${fixedN} Page${fixedN !== 1 ? 's' : ''}`,
      subtitle: 'Split into equal-sized chunks',
      visual: <FixedIllustration n={fixedN} />,
      accent: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/60',
    },
    {
      value: 'pages',
      label: 'Individual Pages',
      subtitle: 'One PDF file per page',
      visual: <PagesIllustration />,
      accent: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    },
  ]

  return (
    <ToolPageLayout
      title="Split PDF"
      description="Divide a PDF into multiple documents. Runs 100% locally in your browser."
      color="purple"
      icon={<SplitIcon />}
    >
      {downloadUrl ? (
        <DownloadButton
          url={downloadUrl}
          filename={downloadName}
          onReset={handleReset}
          label={downloadName.endsWith('.zip') ? 'Download Split Files (.zip)' : 'Download Split PDF'}
        />
      ) : isLoading ? (
        <Spinner message={progress} />
      ) : (
        <div className="space-y-6">
          {/* Step 1 — Upload */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Upload your PDF</p>
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
              <p className="font-semibold text-slate-800 dark:text-slate-200">Choose how to split</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  className={[
                    'flex flex-col items-center gap-3 p-4 rounded-2xl border-2 text-center transition-all duration-150 cursor-pointer',
                    mode === m.value
                      ? `${m.border} ${m.bg} shadow-sm`
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
                  ].join(' ')}
                >
                  <div className="py-2 w-full overflow-hidden">{m.visual}</div>
                  <div>
                    <p className={`text-sm font-bold ${mode === m.value ? m.accent : 'text-slate-800 dark:text-slate-200'}`}>
                      {m.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{m.subtitle}</p>
                  </div>
                  <div className={[
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    mode === m.value ? `${m.border} ${m.bg}` : 'border-slate-300 dark:border-slate-600',
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
                <p className="font-semibold text-slate-800 dark:text-slate-200">Define page ranges</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <RangeBuilder
                  tags={rangeTags}
                  onAdd={handleAddRange}
                  onRemove={handleRemoveRange}
                />
                {rangeTags.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-purple-700 dark:text-purple-400">{rangeTags.length}</span> range{rangeTags.length !== 1 ? 's' : ''} → <span className="font-semibold text-purple-700 dark:text-purple-400">{rangeTags.length}</span> output file{rangeTags.length !== 1 ? 's' : ''}
                    </p>
                    <button
                      type="button"
                      onClick={() => setRangeTags([])}
                      className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors cursor-pointer"
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
                <p className="font-semibold text-slate-800 dark:text-slate-200">Set chunk size</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5">
                <Stepper value={fixedN} onChange={setFixedN} min={1} max={500} />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                    {fixedN === 1 ? 'Every page' : `Every ${fixedN} pages`} becomes a separate file
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Example: a 10-page PDF with chunks of {fixedN} → <strong>{Math.ceil(10 / fixedN)} files</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {mode === 'pages' && (
            <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 flex gap-4 items-start">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-700 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-emerald-900 dark:text-emerald-200">Each page → its own PDF</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed">
                  Every page in your PDF will become a separate file packaged into a single <strong>.zip</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && <ErrorMessage message={error} onRetry={handleSplit} />}

          {/* Action button */}
          <button
            type="button"
            onClick={handleSplit}
            disabled={!canProcess}
            className={[
              'w-full py-4 font-bold rounded-xl transition-colors shadow-sm text-white text-base cursor-pointer',
              canProcess
                ? mode === 'ranges'
                  ? 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
                  : mode === 'fixed'
                    ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed',
            ].join(' ')}
          >
            {!files.length
              ? '① Upload a PDF first'
              : mode === 'ranges' && rangeTags.length === 0
                ? '③ Add at least one page range'
                : mode === 'ranges'
                  ? `Split into ${rangeTags.length} file${rangeTags.length !== 1 ? 's' : ''} (Client-Side) →`
                  : mode === 'fixed'
                    ? `Split every ${fixedN} page${fixedN !== 1 ? 's' : ''} (Client-Side) →`
                    : 'Split into Individual Pages (Client-Side) →'}
          </button>

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            Result is processed 100% locally on your computer with zero server upload.
          </p>
        </div>
      )}
    </ToolPageLayout>
  )
}
