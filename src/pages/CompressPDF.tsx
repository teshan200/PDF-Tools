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

const LEVELS: { value: Level; label: string; desc: string; badge: string; badgeColor: string }[] = [
  {
    value: 'low',
    label: 'Low',
    desc: 'Minimal compression, maximum quality preserved.',
    badge: 'Quality First',
    badgeColor: 'bg-blue-50 text-blue-700',
  },
  {
    value: 'recommended',
    label: 'Recommended',
    desc: 'Best balance of size reduction and quality.',
    badge: 'Best Choice',
    badgeColor: 'bg-emerald-50 text-emerald-700',
  },
  {
    value: 'extreme',
    label: 'Extreme',
    desc: 'Maximum compression. Some quality reduction.',
    badge: 'Smallest Size',
    badgeColor: 'bg-orange-50 text-orange-700',
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
      description="Reduce your PDF file size while keeping it readable."
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
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <p className="font-semibold text-slate-800 text-sm">Compression Level</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LEVELS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLevel(opt.value)}
                  className={[
                    'relative flex flex-col items-start gap-1.5 px-4 py-4 rounded-xl border-2 text-left transition-all',
                    level === opt.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white',
                  ].join(' ')}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${opt.badgeColor}`}>
                    {opt.badge}
                  </span>
                  <span className={`text-sm font-semibold ${level === opt.value ? 'text-emerald-700' : 'text-slate-800'}`}>
                    {opt.label}
                  </span>
                  <span className="text-xs text-slate-500 leading-relaxed">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <ErrorMessage message={error} onRetry={() => process({ compression_level: level })} />}

          <button
            type="button"
            onClick={() => process({ compression_level: level })}
            disabled={!files.length}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            {!files.length ? 'Upload a PDF first' : `Compress PDF (${level})`}
          </button>
        </div>
      )}
    </ToolPageLayout>
  )
}
