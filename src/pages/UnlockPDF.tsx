import { useState } from 'react'
import ToolPageLayout from '../components/ToolPageLayout'
import DropZone from '../components/DropZone'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import DownloadButton from '../components/DownloadButton'
import { useToolProcessor } from '../hooks/useToolProcessor'

function UnlockIcon() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  )
}

export default function UnlockPDF() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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
  } = useToolProcessor('/api/unlock-pdf', 'unlocked.pdf')

  const handleProcess = () => {
    process({ password })
  }

  return (
    <ToolPageLayout
      title="Unlock PDF"
      description="Remove password protection from your PDF files."
      color="teal"
      icon={<UnlockIcon />}
    >
      {downloadUrl ? (
        <DownloadButton
          url={downloadUrl}
          filename={downloadName}
          onReset={() => { reset(); setPassword('') }}
          label="Download Unlocked PDF"
        />
      ) : isLoading ? (
        <Spinner message={progress} />
      ) : (
        <div className="space-y-6">
          <DropZone
            onFilesSelected={(f) => setFiles(f)}
            selectedFiles={files}
            hint="Select a password-protected PDF"
          />

          {/* Password input */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                PDF Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && files.length && password && handleProcess()}
                  placeholder="Enter the PDF password"
                  className="w-full px-4 py-2.5 pr-12 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Leave blank if the PDF only has owner restrictions (no open password).
              </p>
            </div>
          </div>

          {/* Security note */}
          <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 flex gap-3 items-start">
            <svg className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-xs text-teal-700">
              Only use this tool on PDFs you own or have permission to unlock. Your password is sent securely over HTTPS.
            </p>
          </div>

          {error && <ErrorMessage message={error} onRetry={handleProcess} />}

          <button
            type="button"
            onClick={handleProcess}
            disabled={!files.length}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            {!files.length ? 'Upload a PDF first' : 'Remove Password Protection'}
          </button>
        </div>
      )}
    </ToolPageLayout>
  )
}
