import { useCallback } from 'react'
import ToolPageLayout from '../components/ToolPageLayout'
import DropZone from '../components/DropZone'
import FileList from '../components/FileList'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import DownloadButton from '../components/DownloadButton'
import { useToolProcessor } from '../hooks/useToolProcessor'

function MergeIcon() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

export default function MergePDF() {
  const {
    files,
    setFiles,
    addFiles,
    isLoading,
    error,
    downloadUrl,
    downloadName,
    progress,
    process,
    reset,
  } = useToolProcessor('/api/merge-pdf', 'merged.pdf')

  const handleFilesSelected = useCallback(
    (newFiles: File[]) => {
      addFiles(newFiles)
    },
    [addFiles],
  )

  const handleMove = useCallback(
    (from: number, to: number) => {
      setFiles((prev) => {
        const next = [...prev]
        const [item] = next.splice(from, 1)
        next.splice(to, 0, item)
        return next
      })
    },
    [setFiles],
  )

  const handleRemove = useCallback(
    (index: number) => {
      setFiles((prev) => prev.filter((_, i) => i !== index))
    },
    [setFiles],
  )

  return (
    <ToolPageLayout
      title="Merge PDF"
      description="Combine multiple PDF files into a single document."
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
                <p className="text-sm font-semibold text-slate-700">
                  {files.length} file{files.length !== 1 ? 's' : ''} — drag arrows to reorder
                </p>
                <button
                  onClick={() => setFiles([])}
                  className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors"
                >
                  Clear all
                </button>
              </div>
              <FileList files={files} onMove={handleMove} onRemove={handleRemove} />
            </div>
          )}

          {/* Error */}
          {error && <ErrorMessage message={error} onRetry={() => process()} />}

          {/* Action */}
          <button
            type="button"
            onClick={() => process()}
            disabled={files.length < 2}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            {files.length < 2
              ? `Add at least ${2 - files.length} more PDF${files.length === 1 ? '' : 's'}`
              : `Merge ${files.length} PDFs`}
          </button>

          <p className="text-xs text-slate-400 text-center">
            Files are merged in the order shown above
          </p>
        </div>
      )}
    </ToolPageLayout>
  )
}
