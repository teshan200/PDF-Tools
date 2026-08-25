import { useState, useCallback, useRef } from 'react'

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: string
  multiple?: boolean
  selectedFiles?: File[]
  label?: string
  hint?: string
  className?: string
}

export default function DropZone({
  onFilesSelected,
  accept = '.pdf,application/pdf',
  multiple = false,
  selectedFiles = [],
  label,
  hint,
  className = '',
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return
      const arr = Array.from(fileList)
      const filtered = arr.filter((f) => {
        const isPdf =
          f.type === 'application/pdf' ||
          f.name.toLowerCase().endsWith('.pdf')
        return accept.includes('pdf') ? isPdf : true
      })
      if (filtered.length > 0) {
        onFilesSelected(multiple ? filtered : [filtered[0]])
      }
    },
    [accept, multiple, onFilesSelected],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  const hasFiles = selectedFiles.length > 0

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Upload ${multiple ? 'PDF files' : 'a PDF file'}`}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={[
        'relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12',
        'flex flex-col items-center justify-center gap-3.5 min-h-[220px] text-center',
        'transition-all duration-200 select-none outline-none group',
        isDragging
          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 scale-[1.01] shadow-lg shadow-blue-500/10'
          : hasFiles
            ? 'border-emerald-500 dark:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20'
            : 'border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40',
        className,
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
        onClick={(e) => e.stopPropagation()}
      />

      {hasFiles ? (
        <>
          {/* Success state */}
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shadow-2xs">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-slate-900 dark:text-white text-sm">
              {selectedFiles.length === 1
                ? selectedFiles[0].name
                : `${selectedFiles.length} files selected`}
            </p>
            {selectedFiles.length === 1 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatSize(selectedFiles[0].size)}</p>
            )}
            {selectedFiles.length > 1 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total: {formatSize(selectedFiles.reduce((s, f) => s + f.size, 0))}
              </p>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                inputRef.current?.click()
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold mt-1 inline-block cursor-pointer"
            >
              {multiple ? 'Change files' : 'Change file'}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Empty state */}
          <div
            className={[
              'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 border',
              isDragging
                ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 text-blue-600'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 group-hover:scale-105 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:border-blue-200 dark:group-hover:border-blue-800',
            ].join(' ')}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {isDragging
                ? `Drop your ${multiple ? 'files' : 'file'} here`
                : label || `Select ${multiple ? 'PDF files' : 'a PDF file'} or drag & drop`}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Files stay completely private on your device
            </p>
            {hint && <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 font-medium">{hint}</p>}
          </div>
        </>
      )}
    </div>
  )
}
