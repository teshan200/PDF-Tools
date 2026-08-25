import { useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { zipSync } from 'fflate'
import ToolPageLayout from '../components/ToolPageLayout'
import DropZone from '../components/DropZone'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import DownloadButton from '../components/DownloadButton'

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

function JpgIcon() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

const RESOLUTION_OPTIONS = [
  { value: '72', label: '72 DPI', desc: 'Screen / Fast' },
  { value: '150', label: '150 DPI', desc: 'Standard' },
  { value: '300', label: '300 DPI', desc: 'High Quality' },
]

const QUALITY_OPTIONS = [
  { value: '0.6', label: '60%', desc: 'Smaller file' },
  { value: '0.85', label: '85%', desc: 'Balanced' },
  { value: '0.98', label: '100%', desc: 'Maximum' },
]

export default function PDFtoJPG() {
  const [files, setFiles] = useState<File[]>([])
  const [resolution, setResolution] = useState('150')
  const [quality, setQuality] = useState('0.85')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState('pdf-images.zip')
  const [progress, setProgress] = useState('')

  const handleConvert = async () => {
    if (!files.length) return
    setIsLoading(true)
    setError(null)
    setProgress('Reading PDF document...')

    try {
      const fileBuffer = await files[0].arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: fileBuffer })
      const pdf = await loadingTask.promise
      const totalPages = pdf.numPages

      if (totalPages === 0) {
        throw new Error('This PDF has no pages.')
      }

      const dpi = parseInt(resolution, 10)
      const scale = dpi / 72 // 72 DPI is standard 1x PDF scale
      const qualityVal = parseFloat(quality)
      const zipFiles: Record<string, Uint8Array> = {}
      const baseName = files[0].name.replace(/\.pdf$/i, '')

      for (let i = 1; i <= totalPages; i++) {
        setProgress(`Rendering page ${i} of ${totalPages} at ${dpi} DPI...`)
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale })

        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Failed to create canvas rendering context.')

        // Fill white background for transparent PDFs
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        }

        // @ts-expect-error - pdfjs typing compatibility
        await page.render(renderContext).promise

        // Convert canvas to JPG blob
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/jpeg', qualityVal)
        })

        if (!blob) throw new Error(`Failed to encode page ${i} to JPG.`)

        const buffer = await blob.arrayBuffer()
        const pageNumPadded = String(i).padStart(String(totalPages).length, '0')
        zipFiles[`${baseName}_page_${pageNumPadded}.jpg`] = new Uint8Array(buffer)
      }

      const fileKeys = Object.keys(zipFiles)
      if (fileKeys.length === 1) {
        // Single page -> single JPG download
        const singleBlob = new Blob([zipFiles[fileKeys[0]]], { type: 'image/jpeg' })
        const url = URL.createObjectURL(singleBlob)
        setDownloadUrl(url)
        setDownloadName(fileKeys[0])
      } else {
        // Multi-page -> ZIP
        setProgress('Zipping high-resolution JPG images...')
        const zipped = zipSync(zipFiles)
        const zipBlob = new Blob([zipped], { type: 'application/zip' })
        const url = URL.createObjectURL(zipBlob)
        setDownloadUrl(url)
        setDownloadName(`${baseName}_images.zip`)
      }
    } catch (err) {
      console.error('PDF to JPG error:', err)
      setError(err instanceof Error ? err.message : 'Failed to convert PDF to JPG.')
    } finally {
      setIsLoading(false)
      setProgress('')
    }
  }

  const reset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    setFiles([])
    setDownloadUrl(null)
    setError(null)
    setProgress('')
  }

  return (
    <ToolPageLayout
      title="PDF to JPG"
      description="Convert each PDF page into a high-quality JPG image. Runs 100% locally in your browser."
      color="orange"
      icon={<JpgIcon />}
    >
      {downloadUrl ? (
        <DownloadButton
          url={downloadUrl}
          filename={downloadName}
          onReset={reset}
          label={downloadName.endsWith('.zip') ? 'Download Images (.zip)' : 'Download JPG Image'}
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
            {/* Resolution */}
            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Resolution (DPI)</p>
              <div className="flex gap-2">
                {RESOLUTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setResolution(opt.value)}
                    className={[
                      'flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl border-2 text-center transition-all cursor-pointer',
                      resolution === opt.value
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/60'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
                    ].join(' ')}
                  >
                    <span className={`text-sm font-bold ${resolution === opt.value ? 'text-orange-700 dark:text-orange-300' : 'text-slate-800 dark:text-slate-200'}`}>
                      {opt.label}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">JPEG Quality</p>
              <div className="flex gap-2">
                {QUALITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setQuality(opt.value)}
                    className={[
                      'flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl border-2 text-center transition-all cursor-pointer',
                      quality === opt.value
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/60'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
                    ].join(' ')}
                  >
                    <span className={`text-sm font-bold ${quality === opt.value ? 'text-orange-700 dark:text-orange-300' : 'text-slate-800 dark:text-slate-200'}`}>
                      {opt.label}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 rounded-xl px-4 py-3 flex gap-3 items-start">
            <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-orange-800 dark:text-orange-300">
              All pages are rendered locally at full resolution in browser memory and packaged into a ZIP. Zero server upload.
            </p>
          </div>

          {error && <ErrorMessage message={error} onRetry={handleConvert} />}

          <button
            type="button"
            onClick={handleConvert}
            disabled={!files.length}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            {!files.length ? 'Upload a PDF first' : 'Convert to JPG (Client-Side)'}
          </button>
        </div>
      )}
    </ToolPageLayout>
  )
}
