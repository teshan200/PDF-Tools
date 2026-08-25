import ToolPageLayout from '../components/ToolPageLayout'
import DropZone from '../components/DropZone'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import DownloadButton from '../components/DownloadButton'
import { useToolProcessor } from '../hooks/useToolProcessor'

function WordIcon() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

export default function PDFtoWord() {
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
  } = useToolProcessor('/api/pdf-to-word', 'converted.docx')

  return (
    <ToolPageLayout
      title="PDF to Word"
      description="Convert PDF documents into editable Microsoft Word (.docx) documents."
      color="violet"
      icon={<WordIcon />}
    >
      {downloadUrl ? (
        <DownloadButton
          url={downloadUrl}
          filename={downloadName}
          onReset={reset}
          label="Download Word Document (.docx)"
        />
      ) : isLoading ? (
        <Spinner message={progress} />
      ) : (
        <div className="space-y-6">
          <DropZone
            onFilesSelected={(f) => setFiles(f)}
            selectedFiles={files}
            hint="Select a PDF to convert to Word"
          />

          {/* Info card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Output: .docx (Word Document)</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Text, tables, and document layouts are preserved during conversion. Files are processed securely in ephemeral memory and permanently deleted immediately.
            </p>
          </div>

          {error && <ErrorMessage message={error} onRetry={() => process()} />}

          <button
            type="button"
            onClick={() => process()}
            disabled={!files.length}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 active:opacity-90 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer text-sm"
          >
            {!files.length ? 'Upload a PDF first' : 'Convert to Word (.docx)'}
          </button>
        </div>
      )}
    </ToolPageLayout>
  )
}
