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
      description="Convert PDF files to editable Word (.docx) documents."
      color="violet"
      icon={<WordIcon />}
    >
      {downloadUrl ? (
        <DownloadButton
          url={downloadUrl}
          filename={downloadName}
          onReset={reset}
          label="Download Word Document"
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
          <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 flex gap-3 items-start">
            <svg className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-violet-900">Output: .docx (Word document)</p>
              <p className="text-xs text-violet-700">
                Text-based PDFs convert best. Scanned PDFs may require OCR and might have limited formatting accuracy.
              </p>
            </div>
          </div>

          {error && <ErrorMessage message={error} onRetry={() => process()} />}

          <button
            type="button"
            onClick={() => process()}
            disabled={!files.length}
            className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            {!files.length ? 'Upload a PDF first' : 'Convert to Word'}
          </button>
        </div>
      )}
    </ToolPageLayout>
  )
}
