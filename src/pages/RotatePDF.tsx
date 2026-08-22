import { useState } from 'react'
import ToolPageLayout from '../components/ToolPageLayout'
import DropZone from '../components/DropZone'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import DownloadButton from '../components/DownloadButton'
import { useToolProcessor } from '../hooks/useToolProcessor'

type Angle = '90' | '180' | '270'
type PageMode = 'all' | 'even' | 'odd'

function RotateIcon() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

const ANGLES: { value: Angle; label: string; visual: string }[] = [
  { value: '90', label: '90° Clockwise', visual: '↻ 90°' },
  { value: '180', label: '180° Flip', visual: '↕ 180°' },
  { value: '270', label: '90° Counter-Clockwise', visual: '↺ 270°' },
]

const PAGE_MODES: { value: PageMode; label: string; desc: string }[] = [
  { value: 'all', label: 'All Pages', desc: 'Rotate every page' },
  { value: 'even', label: 'Even Pages', desc: 'Pages 2, 4, 6…' },
  { value: 'odd', label: 'Odd Pages', desc: 'Pages 1, 3, 5…' },
]

export default function RotatePDF() {
  const [angle, setAngle] = useState<Angle>('90')
  const [pageMode, setPageMode] = useState<PageMode>('all')

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
  } = useToolProcessor('/api/rotate-pdf', 'rotated.pdf')

  const handleProcess = () => {
    process({ angle, page_mode: pageMode })
  }

  return (
    <ToolPageLayout
      title="Rotate PDF"
      description="Rotate PDF pages to the correct orientation."
      color="amber"
      icon={<RotateIcon />}
    >
      {downloadUrl ? (
        <DownloadButton
          url={downloadUrl}
          filename={downloadName}
          onReset={reset}
          label="Download Rotated PDF"
        />
      ) : isLoading ? (
        <Spinner message={progress} />
      ) : (
        <div className="space-y-6">
          <DropZone
            onFilesSelected={(f) => setFiles(f)}
            selectedFiles={files}
            hint="Select a PDF to rotate"
          />

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
            {/* Rotation angle */}
            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-slate-800">Rotation Angle</p>
              <div className="grid grid-cols-3 gap-2">
                {ANGLES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAngle(opt.value)}
                    className={[
                      'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all',
                      angle === opt.value
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300',
                    ].join(' ')}
                  >
                    <span className="text-xl font-bold text-slate-700">{opt.visual}</span>
                    <span className={`text-xs font-medium ${angle === opt.value ? 'text-amber-700' : 'text-slate-600'}`}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Page selection */}
            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-slate-800">Apply To</p>
              <div className="flex gap-2">
                {PAGE_MODES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPageMode(opt.value)}
                    className={[
                      'flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl border-2 text-center transition-all',
                      pageMode === opt.value
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300',
                    ].join(' ')}
                  >
                    <span className={`text-sm font-semibold ${pageMode === opt.value ? 'text-amber-700' : 'text-slate-800'}`}>
                      {opt.label}
                    </span>
                    <span className="text-xs text-slate-500">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <ErrorMessage message={error} onRetry={handleProcess} />}

          <button
            type="button"
            onClick={handleProcess}
            disabled={!files.length}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            {!files.length ? 'Upload a PDF first' : `Rotate ${angle}° — ${pageMode} pages`}
          </button>
        </div>
      )}
    </ToolPageLayout>
  )
}
