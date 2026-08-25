import { useState } from 'react'
import ToolPageLayout from '../components/ToolPageLayout'
import DropZone from '../components/DropZone'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import DownloadButton from '../components/DownloadButton'
import { useToolProcessor } from '../hooks/useToolProcessor'

type Encryption = '128' | '256'

function LockIcon() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

export default function ProtectPDF() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [encryption, setEncryption] = useState<Encryption>('256')

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
  } = useToolProcessor('/api/protect-pdf', 'protected.pdf')

  const mismatch = confirmPassword !== '' && password !== confirmPassword
  const canProcess = files.length > 0 && password.length > 0 && password === confirmPassword

  const handleProcess = () => {
    process({ password, encryption_key: encryption })
  }

  return (
    <ToolPageLayout
      title="Protect PDF"
      description="Add military-grade AES password encryption to your PDF files."
      color="rose"
      icon={<LockIcon />}
    >
      {downloadUrl ? (
        <DownloadButton
          url={downloadUrl}
          filename={downloadName}
          onReset={() => { reset(); setPassword(''); setConfirmPassword('') }}
          label="Download Protected PDF"
        />
      ) : isLoading ? (
        <Spinner message={progress} />
      ) : (
        <div className="space-y-6">
          <DropZone
            onFilesSelected={(f) => setFiles(f)}
            selectedFiles={files}
            hint="Select a PDF to protect with a password"
          />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
            {/* Password input */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-2.5 pr-12 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className={[
                  'w-full px-4 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-colors',
                  mismatch
                    ? 'border-red-400 focus:ring-red-400 bg-red-50 dark:bg-red-950/30'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500',
                ].join(' ')}
              />
              {mismatch && (
                <p className="text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
              )}
            </div>

            {/* Encryption level */}
            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Encryption Strength</p>
              <div className="flex gap-3">
                {(['128', '256'] as const).map((bit) => (
                  <button
                    key={bit}
                    type="button"
                    onClick={() => setEncryption(bit)}
                    className={[
                      'flex-1 flex flex-col items-center gap-1 py-3 px-3 rounded-xl border-2 transition-all cursor-pointer',
                      encryption === bit
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
                    ].join(' ')}
                  >
                    <span className={`text-base font-bold ${encryption === bit ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {bit}-bit AES
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {bit === '128' ? 'Standard security' : 'Maximum 256-bit security'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <ErrorMessage message={error} onRetry={handleProcess} />}

          <button
            type="button"
            onClick={handleProcess}
            disabled={!canProcess}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 active:opacity-90 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer text-sm"
          >
            {!files.length
              ? 'Upload a PDF first'
              : !password
                ? 'Enter a password'
                : mismatch
                  ? 'Passwords must match'
                  : 'Protect PDF with AES'}
          </button>
        </div>
      )}
    </ToolPageLayout>
  )
}
