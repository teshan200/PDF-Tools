import { useState, useCallback } from 'react'
import { PDFDocument } from 'pdf-lib'
import ToolPageLayout from '../components/ToolPageLayout'
import DropZone from '../components/DropZone'
import FileList from '../components/FileList'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import DownloadButton from '../components/DownloadButton'

function MergeIcon() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

export default function MergePDF() {
  const [files, setFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState('merged.pdf')
  const [progress, setProgress] = useState('')

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles])
    setError(null)
    setDownloadUrl(null)
  }, [])

  const handleMove = useCallback((from: number, to: number) => {
    setFiles((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }, [])

  const handleRemove = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleMerge = async () => {
    if (files.length < 2) return
    setIsLoading(true)
    setError(null)
    setProgress('Reading PDF files locally...')

    try {
      const mergedPdf = await PDFDocument.create()

      for (let i = 0; i < files.length; i++) {
        setProgress(`Merging file ${i + 1} of ${files.length} (${files[i].name})...`)
        const fileBuffer = await files[i].arrayBuffer()
        const pdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true })
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        copiedPages.forEach((page) => mergedPdf.addPage(page))
      }

      setProgress('Finalizing document in browser memory...')
      const pdfBytes = await mergedPdf.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
      setDownloadName('merged.pdf')
    } catch (err) {
      console.error('Merge error:', err)
      setError(err instanceof Error ? err.message : 'Failed to merge PDF files.')
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
      title="Merge PDF"
      description="Combine multiple PDF files into a single document. Runs 100% locally in your browser."
      color="blue"
      icon={<MergeIcon />}
    >
      {downloadUrl ? (
        <DownloadButton
          url={downloadUrl}
          filename={downloadName}
          onReset={reset}
          label="Download Merged PDF"
        />
      ) : isLoading ? (
        <Spinner message={progress} />
      ) : (
        <div className="space-y-6">
          {/* Upload zone */}
          <DropZone
            onFilesSelected={handleFilesSelected}
            multiple
            hint="Select multiple PDF files to merge"
          />

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {files.length} file{files.length !== 1 ? 's' : ''} — drag arrows to reorder
                </p>
                <button
                  onClick={() => setFiles([])}
                  className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              </div>
              <FileList files={files} onMove={handleMove} onRemove={handleRemove} />
            </div>
          )}

          {/* Error */}
          {error && <ErrorMessage message={error} onRetry={handleMerge} />}

          {/* Action */}
          <button
            type="button"
            onClick={handleMerge}
            disabled={files.length < 2}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            {files.length < 2
              ? `Add at least ${2 - files.length} more PDF${files.length === 1 ? '' : 's'}`
              : `Merge ${files.length} PDFs (Client-Side)`}
          </button>

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            Files are merged 100% locally on your computer in the order shown above.
          </p>
        </div>
      )}
    </ToolPageLayout>
  )
}
