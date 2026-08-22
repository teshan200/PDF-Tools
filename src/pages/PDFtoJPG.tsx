import { useState } from 'react'
import ToolPageLayout from '../components/ToolPageLayout'
import DropZone from '../components/DropZone'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import DownloadButton from '../components/DownloadButton'
import { useToolProcessor } from '../hooks/useToolProcessor'

function JpgIcon() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

const RESOLUTION_OPTIONS = [
  { value: '72', label: '72 DPI', desc: 'Screen / Web' },
  { value: '150', label: '150 DPI', desc: 'Standard' },
  { value: '300', label: '300 DPI', desc: 'High Quality' },
]

const QUALITY_OPTIONS = [
  { value: '50', label: '50%', desc: 'Smaller file' },
  { value: '75', label: '75%', desc: 'Balanced' },
  { value: '100', label: '100%', desc: 'Maximum quality' },
]

export default function PDFtoJPG() {
  const [resolution, setResolution] = useState('150')
  const [quality, setQuality] = useState('75')

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
  } = useToolProcessor('/api/pdf-to-jpg', 'pdf-images.zip')

  const handleProcess = () => {
    process({ resolution, quality })
  }

  return (
    <ToolPageLayout
      title="PDF to JPG"
      description="Convert each PDF page into a high-quality JPG image."
      color="orange"
      icon={<JpgIcon />}
    >
      {downloadUrl ? (
        <DownloadButton
          url={downloadUrl}
          filename={downloadName}
          onReset={reset}
          label="Download Images (.zip)"
        />
      ) : isLoading ? (
        <Spinner message={progress} />
      ) : (
        <div className="space-y-6">
          <DropZone
            onFilesSelected={(f) => setFiles(f)}
            selectedFiles={files}
            hint="Select a PDF to convert to JPG images"
          />

          {/* Options */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
            {/* Resolution */}
            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-slate-800">Resolution (DPI)</p>
              <div className="flex gap-2">
                {RESOLUTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setResolution(opt.value)}
                    className={[
                      'flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl border-2 text-center transition-all',
                      resolution === opt.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-slate-300',
                    ].join(' ')}
                  >
                    <span className={`text-sm font-bold ${resolution === opt.value ? 'text-orange-700' : 'text-slate-800'}`}>
                      {opt.label}
                    </span>
                    <span className="text-xs text-slate-500">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-slate-800">JPEG Quality</p>
              <div className="flex gap-2">
                {QUALITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setQuality(opt.value)}
                    className={[
                      'flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl border-2 text-center transition-all',
                      quality === opt.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-slate-300',
                    ].join(' ')}
                  >
                    <span className={`text-sm font-bold ${quality === opt.value ? 'text-orange-700' : 'text-slate-800'}`}>
                      {opt.label}
                    </span>
                    <span className="text-xs text-slate-500">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 flex gap-3 items-start">
            <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-orange-700">
              All pages will be converted to JPG images and downloaded as a single ZIP file.
            </p>
          </div>

          {error && <ErrorMessage message={error} onRetry={handleProcess} />}

          <button
            type="button"
            onClick={handleProcess}
            disabled={!files.length}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            {!files.length ? 'Upload a PDF first' : 'Convert to JPG'}
          </button>
        </div>
      )}
    </ToolPageLayout>
  )
}
