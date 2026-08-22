import { useState, useCallback, useRef } from 'react'

export interface UseToolProcessorReturn {
  files: File[]
  setFiles: React.Dispatch<React.SetStateAction<File[]>>
  addFiles: (newFiles: File[]) => void
  isLoading: boolean
  error: string | null
  downloadUrl: string | null
  downloadName: string
  progress: string
  process: (extraData?: Record<string, string>) => Promise<void>
  reset: () => void
}

/** Convert a File to a base64 string (chunked to avoid call-stack overflow on large files) */
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ''
  const chunk = 0x8000 // 32 KB chunks
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export function useToolProcessor(
  endpoint: string,
  defaultFileName = 'output.pdf',
): UseToolProcessorReturn {
  const [files, setFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState(defaultFileName)
  const [progress, setProgress] = useState('')
  const prevUrlRef = useRef<string | null>(null)

  const addFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles])
    setError(null)
    setDownloadUrl(null)
  }, [])

  const process = useCallback(
    async (extraData?: Record<string, string>) => {
      if (!files.length) return

      setIsLoading(true)
      setError(null)
      setDownloadUrl(null)
      setProgress('Reading your file(s)…')

      try {
        // Convert all files to base64 — avoids multipart proxy issues
        const encodedFiles = await Promise.all(
          files.map(async (file) => ({
            name: file.name,
            type: file.type || 'application/pdf',
            data: await fileToBase64(file),
          })),
        )

        setProgress('Processing your file…')

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: encodedFiles, ...extraData }),
        })

        if (!response.ok) {
          let errMsg = `Request failed (HTTP ${response.status})`
          try {
            const json = await response.json()
            if (json?.error) errMsg = json.error
          } catch { /* ignore */ }
          throw new Error(errMsg)
        }

        setProgress('Preparing your download…')
        const blob = await response.blob()

        if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
        const url = URL.createObjectURL(blob)
        prevUrlRef.current = url
        setDownloadUrl(url)

        const cd = response.headers.get('Content-Disposition')
        if (cd) {
          const match = cd.match(/filename="?([^";\n]+)"?/i)
          if (match?.[1]) setDownloadName(match[1].trim())
        }

        setProgress('')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
        setError(msg)
      } finally {
        setIsLoading(false)
      }
    },
    [files, endpoint],
  )

  const reset = useCallback(() => {
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current)
      prevUrlRef.current = null
    }
    setFiles([])
    setDownloadUrl(null)
    setError(null)
    setProgress('')
  }, [])

  return { files, setFiles, addFiles, isLoading, error, downloadUrl, downloadName, progress, process, reset }
}
