interface DownloadButtonProps {
  url: string
  filename: string
  onReset: () => void
  label?: string
}

export default function DownloadButton({
  url,
  filename,
  onReset,
  label = 'Download Result',
}: DownloadButtonProps) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 flex flex-col items-center gap-5 text-center">
      {/* Success icon */}
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <p className="text-lg font-bold text-emerald-900">Your file is ready!</p>
        <p className="text-sm text-emerald-700 mt-1 font-medium">{filename}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        {/* Download button */}
        <a
          href={url}
          download={filename}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl transition-colors shadow-sm shadow-emerald-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {label}
        </a>

        {/* Process another */}
        <button
          type="button"
          onClick={onReset}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Process Another
        </button>
      </div>
    </div>
  )
}
