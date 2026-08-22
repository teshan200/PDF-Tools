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
    // Only leave if moving outside the entire zone
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    // Reset input so same file can be re-selected
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
        'relative cursor-pointer rounded-2xl border-2 border-dashed p-10',
        'flex flex-col items-center justify-center gap-4 min-h-52 text-center',
        'transition-all duration-200 select-none outline-none',
        isDragging
          ? 'border-blue-500 bg-blue-50 scale-[1.01] shadow-md shadow-blue-100'
          : hasFiles
            ? 'border-emerald-400 bg-emerald-50/60'
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50',
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
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-slate-900">
              {selectedFiles.length === 1
                ? selectedFiles[0].name
                : `${selectedFiles.length} files selected`}
            </p>
            {selectedFiles.length === 1 && (
              <p className="text-sm text-slate-500">{formatSize(selectedFiles[0].size)}</p>
            )}
            {selectedFiles.length > 1 && (
              <p className="text-sm text-slate-500">
                Total: {formatSize(selectedFiles.reduce((s, f) => s + f.size, 0))}
              </p>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                inputRef.current?.click()
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2 mt-1"
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
              'w-14 h-14 rounded-full flex items-center justify-center transition-colors',
              isDragging ? 'bg-blue-100' : 'bg-slate-100',
            ].join(' ')}
          >
            <svg
              className={['w-7 h-7 transition-colors', isDragging ? 'text-blue-600' : 'text-slate-400'].join(' ')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold text-slate-700">
              {isDragging
                ? `Drop your ${multiple ? 'files' : 'file'} here!`
                : label || `Drag & drop your PDF${multiple ? 's' : ''} here`}
            </p>
            <p className="text-sm text-slate-500">
              or{' '}
              <span className="text-blue-600 font-medium">browse from your device</span>
            </p>
            {hint && <p className="text-xs text-slate-400 pt-1">{hint}</p>}
          </div>
        </>
      )}
    </div>
  )
}
