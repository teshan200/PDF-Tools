import { useState } from 'react'
import ToolPageLayout from '../components/ToolPageLayout'
import DropZone from '../components/DropZone'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import DownloadButton from '../components/DownloadButton'
import { useToolProcessor } from '../hooks/useToolProcessor'

type Level = 'low' | 'recommended' | 'extreme'

function CompressIcon() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  )
}

const LEVELS: { value: Level; label: string; desc: string; badge: string }[] = [
  {
    value: 'low',
    label: 'Low',
    desc: 'Minimal compression, maximum image & text quality preserved.',
    badge: 'Quality First',
  },
  {
    value: 'recommended',
    label: 'Recommended',
    desc: 'Optimal balance of file size reduction and visual clarity.',
    badge: 'Standard',
  },
  {
    value: 'extreme',
    label: 'Extreme',
    desc: 'Maximum compression profile for smallest file size.',
    badge: 'Smallest Size',
  },
]

export default function CompressPDF() {
  const [level, setLevel] = useState<Level>('recommended')

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
  } = useToolProcessor('/api/compress-pdf', 'compressed.pdf')

  return (
    <ToolPageLayout
      title="Compress PDF"
      description="Reduce PDF file size efficiently while preserving visual document fidelity."
      color="emerald"
      icon={<CompressIcon />}
    >
      {downloadUrl ? (
        <DownloadButton
          url={downloadUrl}
          filename={downloadName}
          onReset={reset}
          label="Download Compressed PDF"
        />
      ) : isLoading ? (
        <Spinner message={progress} />
      ) : (
        <div className="space-y-6">
          <DropZone
            onFilesSelected={(f) => setFiles(f)}
            selectedFiles={files}
            hint="Select a PDF to compress"
          />

          {/* Compression level */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Select Compression Profile</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LEVELS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLevel(opt.value)}
                  className={[
                    'relative flex flex-col items-start gap-1.5 px-4 py-4 rounded-xl border-2 text-left transition-all cursor-pointer',
                    level === opt.value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900',
                  ].join(' ')}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {opt.badge}
                  </span>
                  <span className={`text-sm font-semibold ${level === opt.value ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}`}>
                    {opt.label}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <ErrorMessage message={error} onRetry={() => process({ compression_level: level })} />}

          <button
            type="button"
            onClick={() => process({ compression_level: level })}
            disabled={!files.length}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 active:opacity-90 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer text-sm"
          >
            {!files.length ? 'Upload a PDF first' : `Compress PDF (${level} profile)`}
          </button>
        </div>
      )}
    </ToolPageLayout>
  )
}
