import { useState, useEffect, useRef, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { PDFDocument, rgb } from 'pdf-lib'
import ToolPageLayout from '../components/ToolPageLayout'
import DropZone from '../components/DropZone'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import { encryptData, decryptData, EncryptedPayload } from '../utils/crypto'

// Configure worker to use locally bundled worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc

const STORAGE_KEY = 'easypdf_saved_signatures_v1'

// ─── Types ────────────────────────────────────────────────────────────────────
type SignatureMode = 'draw' | 'type' | 'upload'

interface PlacedSignature {
  id: string
  page: number
  x: number // in PDF points (top-left origin)
  y: number
  width: number
  height: number
  dataUrl: string
  isText?: boolean
  text?: string
}

interface StoredSignatureRecord {
  id: string
  label: string
  createdAt: number
  payload: EncryptedPayload
}

interface LoadedSignature {
  id: string
  label: string
  createdAt: number
  hasPin: boolean
  dataUrl?: string // populated once decrypted
  isLocked: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0
  return rgb(r, g, b)
}

async function dataUrlToBytes(dataUrl: string): Promise<ArrayBuffer> {
  const res = await fetch(dataUrl)
  return res.arrayBuffer()
}

export default function SignPDF() {
  const [files, setFiles] = useState<File[]>([])
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({ width: 595, height: 842 })

  // Studio & Zoom states
  const [scale, setScale] = useState(1.0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progressMsg, setProgressMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState('signed.pdf')

  // Signatures on Document
  const [placedItems, setPlacedItems] = useState<PlacedSignature[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Saved Signatures List (AES-256 Encrypted in localStorage)
  const [savedSignatures, setSavedSignatures] = useState<LoadedSignature[]>([])

  // Signature Creation Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<SignatureMode>('draw')
  const [drawColor, setDrawColor] = useState('#000000')
  const [drawWidth, setDrawWidth] = useState(3)

  // Type signature state
  const [typedName, setTypedName] = useState('')
  const [typedFontIndex, setTypedFontIndex] = useState(0)
  const [typedColor, setTypedColor] = useState('#000000')

  // Storage & Encryption Options in Modal
  const [saveToDevice, setSaveToDevice] = useState(true)
  const [usePinLock, setUsePinLock] = useState(false)
  const [creationPin, setCreationPin] = useState('')

  // Unlock PIN Modal
  const [unlockTarget, setUnlockTarget] = useState<LoadedSignature | null>(null)
  const [unlockPin, setUnlockPin] = useState('')
  const [unlockError, setUnlockError] = useState<string | null>(null)

  // Interaction refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const padCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  const dragRef = useRef<{
    id: string
    startX: number
    startY: number
    origX: number
    origY: number
    origW: number
    origH: number
    isResize: boolean
  } | null>(null)

  // ─── 1. Load Saved Encrypted Signatures from localStorage on Mount ───────────
  useEffect(() => {
    async function loadSaved() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const records: StoredSignatureRecord[] = JSON.parse(raw)
        const loadedList: LoadedSignature[] = []

        for (const rec of records) {
          if (rec.payload.hasPin) {
            // Needs user PIN to decrypt
            loadedList.push({
              id: rec.id,
              label: rec.label,
              createdAt: rec.createdAt,
              hasPin: true,
              isLocked: true,
            })
          } else {
            // Auto-decrypt with device AES-256 key
            try {
              const dataUrl = await decryptData(rec.payload)
              loadedList.push({
                id: rec.id,
                label: rec.label,
                createdAt: rec.createdAt,
                hasPin: false,
                dataUrl,
                isLocked: false,
              })
            } catch (err) {
              console.error('Failed to auto-decrypt saved signature:', err)
            }
          }
        }
        setSavedSignatures(loadedList)
      } catch (err) {
        console.error('Failed to parse saved signatures:', err)
      }
    }
    loadSaved()
  }, [])

  // ─── 2. Load PDF Document ───────────────────────────────────────────────────
  useEffect(() => {
    const file = files[0]
    if (!file) {
      setPdfDoc(null)
      setNumPages(0)
      setPlacedItems([])
      setSelectedId(null)
      setDownloadUrl(null)
      return
    }

    let cancelled = false
    setIsProcessing(true)
    setProgressMsg('Loading PDF preview...')
    setErrorMsg(null)

    file.arrayBuffer().then((buffer) => {
      if (cancelled) return
      return pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
    }).then((doc) => {
      if (cancelled || !doc) return
      setPdfDoc(doc)
      setNumPages(doc.numPages)
      setCurrentPage(1)
      setPlacedItems([])
      setSelectedId(null)
      setDownloadName(file.name.replace(/\.pdf$/i, '') + '-signed.pdf')
      setIsProcessing(false)
    }).catch((err) => {
      if (cancelled) return
      console.error('Failed to load PDF:', err)
      setErrorMsg('Failed to load this PDF document. It might be password-protected or corrupted.')
      setIsProcessing(false)
    })

    return () => { cancelled = true }
  }, [files])

  // ─── 3. Render Current Page ─────────────────────────────────────────────────
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return
    let renderTask: any = null
    let cancelled = false

    pdfDoc.getPage(currentPage).then(async (page: any) => {
      if (cancelled) return
      const unscaledViewport = page.getViewport({ scale: 1.0 })
      setPageDimensions({ width: unscaledViewport.width, height: unscaledViewport.height })

      const viewport = page.getViewport({ scale })
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = viewport.width
      canvas.height = viewport.height

      renderTask = page.render({ canvasContext: ctx, viewport })
      return renderTask.promise
    }).catch((err: any) => {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Render error:', err)
      }
    })

    return () => {
      cancelled = true
      if (renderTask) renderTask.cancel()
    }
  }, [pdfDoc, currentPage, scale])

  const fitToWidth = useCallback(() => {
    if (!containerRef.current || !pageDimensions.width) return
    const containerWidth = containerRef.current.clientWidth - 64
    const targetScale = Math.min(1.4, Math.max(0.4, (containerWidth / pageDimensions.width)))
    setScale(parseFloat(targetScale.toFixed(2)))
  }, [pageDimensions.width])

  // ─── 4. Signature Pad Drawing Logic ─────────────────────────────────────────
  const initPad = () => {
    const pad = padCanvasRef.current
    if (!pad) return
    const ctx = pad.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, pad.width, pad.height)
  }

  const startPadDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pad = padCanvasRef.current
    if (!pad) return
    pad.setPointerCapture(e.pointerId)
    isDrawingRef.current = true
    const rect = pad.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (pad.width / rect.width)
    const y = (e.clientY - rect.top) * (pad.height / rect.height)
    lastPointRef.current = { x, y }

    const ctx = pad.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.arc(x, y, drawWidth / 2, 0, Math.PI * 2)
      ctx.fillStyle = drawColor
      ctx.fill()
    }
  }

  const drawOnPad = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return
    const pad = padCanvasRef.current
    if (!pad) return
    const rect = pad.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (pad.width / rect.width)
    const y = (e.clientY - rect.top) * (pad.height / rect.height)

    const ctx = pad.getContext('2d')
    if (!ctx) return

    ctx.strokeStyle = drawColor
    ctx.lineWidth = drawWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    ctx.lineTo(x, y)
    ctx.stroke()

    lastPointRef.current = { x, y }
  }

  const stopPadDrawing = () => {
    isDrawingRef.current = false
    lastPointRef.current = null
  }

  // ─── 5. Save & Encrypt Signature ────────────────────────────────────────────
  const addSignatureToDocument = async (dataUrl: string, label = 'Signature') => {
    // 1. If user opted to save to device: Encrypt with AES-256 and store in localStorage
    if (saveToDevice) {
      try {
        const pinToUse = usePinLock && creationPin.trim() ? creationPin.trim() : undefined
        const encryptedPayload = await encryptData(dataUrl, pinToUse)
        const id = 'sigrec_' + Date.now()

        const newRecord: StoredSignatureRecord = {
          id,
          label,
          createdAt: Date.now(),
          payload: encryptedPayload,
        }

        const raw = localStorage.getItem(STORAGE_KEY)
        const existing: StoredSignatureRecord[] = raw ? JSON.parse(raw) : []
        const updated = [newRecord, ...existing]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

        // Update UI state
        setSavedSignatures((prev) => [
          {
            id,
            label,
            createdAt: newRecord.createdAt,
            hasPin: !!pinToUse,
            dataUrl,
            isLocked: false,
          },
          ...prev,
        ])
      } catch (err) {
        console.error('Failed to encrypt signature:', err)
      }
    }

    // 2. Place on current PDF page
    const w = 150
    const h = 60
    const newItem: PlacedSignature = {
      id: 'sig_' + Date.now(),
      page: currentPage,
      x: Math.round(pageDimensions.width / 2 - w / 2),
      y: Math.round(pageDimensions.height / 2 - h / 2),
      width: w,
      height: h,
      dataUrl,
    }

    setPlacedItems((prev) => [...prev, newItem])
    setSelectedId(newItem.id)
    setIsModalOpen(false)
    setCreationPin('')
    setUsePinLock(false)
  }

  const handleSaveDrawnSignature = () => {
    const pad = padCanvasRef.current
    if (!pad) return
    const dataUrl = pad.toDataURL('image/png')
    addSignatureToDocument(dataUrl, 'Handwritten')
  }

  const handleSaveTypedSignature = () => {
    if (!typedName.trim()) return
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 200
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const fonts = [
      'italic bold 56px "Brush Script MT", "Caveat", cursive',
      'italic 50px "Lucida Handwriting", "Dancing Script", cursive',
      'bold 46px "Segoe Script", "Great Vibes", cursive',
      'italic 44px "Snell Roundhand", "Caveat", cursive',
    ]

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.font = fonts[typedFontIndex] || fonts[0]
    ctx.fillStyle = typedColor
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2)

    const dataUrl = canvas.toDataURL('image/png')
    addSignatureToDocument(dataUrl, typedName)
  }

  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(img, 0, 0)

        // Make background transparent (filter out white/light background)
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imgData.data
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          if (r > 215 && g > 215 && b > 215) {
            data[i + 3] = 0
          }
        }
        ctx.putImageData(imgData, 0, 0)
        const dataUrl = canvas.toDataURL('image/png')
        addSignatureToDocument(dataUrl, 'Uploaded')
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ─── 6. Unlock PIN-Protected Signature ─────────────────────────────────────
  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unlockTarget || !unlockPin.trim()) return

    setUnlockError(null)
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) throw new Error('No storage found')
      const records: StoredSignatureRecord[] = JSON.parse(raw)
      const record = records.find((r) => r.id === unlockTarget.id)
      if (!record) throw new Error('Signature record not found')

      // Decrypt with user PIN
      const decryptedDataUrl = await decryptData(record.payload, unlockPin.trim())

      // Update state to unlocked
      setSavedSignatures((prev) =>
        prev.map((s) =>
          s.id === unlockTarget.id
            ? { ...s, dataUrl: decryptedDataUrl, isLocked: false }
            : s
        )
      )

      // Automatically stamp onto document
      const w = 150
      const h = 60
      const newItem: PlacedSignature = {
        id: 'sig_' + Date.now(),
        page: currentPage,
        x: Math.round(pageDimensions.width / 2 - w / 2),
        y: Math.round(pageDimensions.height / 2 - h / 2),
        width: w,
        height: h,
        dataUrl: decryptedDataUrl,
      }
      setPlacedItems((prev) => [...prev, newItem])
      setSelectedId(newItem.id)

      // Close modal
      setUnlockTarget(null)
      setUnlockPin('')
    } catch (err: any) {
      console.error(err)
      setUnlockError('Incorrect PIN. Please try again.')
    }
  }

  const deleteSavedSignature = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const records: StoredSignatureRecord[] = JSON.parse(raw)
        const updated = records.filter((r) => r.id !== id)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      }
      setSavedSignatures((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      console.error('Failed to delete signature:', err)
    }
  }

  // ─── 7. Quick Stamps (Date, Checkmark) ──────────────────────────────────────
  const addDateStamp = () => {
    const today = new Date().toISOString().split('T')[0]
    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 70
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.font = 'bold 32px Helvetica, Arial, sans-serif'
    ctx.fillStyle = '#0f172a'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText(today, canvas.width / 2, canvas.height / 2)

    const dataUrl = canvas.toDataURL('image/png')
    const w = 110
    const h = 30
    const newItem: PlacedSignature = {
      id: 'date_' + Date.now(),
      page: currentPage,
      x: Math.round(pageDimensions.width / 2 - w / 2),
      y: Math.round(pageDimensions.height / 2 - h / 2),
      width: w,
      height: h,
      dataUrl,
      isText: true,
      text: today,
    }
    setPlacedItems((prev) => [...prev, newItem])
    setSelectedId(newItem.id)
  }

  const addCheckmarkStamp = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 120
    canvas.height = 120
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.font = 'bold 80px Helvetica, Arial, sans-serif'
    ctx.fillStyle = '#16a34a'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText('✓', canvas.width / 2, canvas.height / 2)

    const dataUrl = canvas.toDataURL('image/png')
    const w = 35
    const h = 35
    const newItem: PlacedSignature = {
      id: 'chk_' + Date.now(),
      page: currentPage,
      x: Math.round(pageDimensions.width / 2 - w / 2),
      y: Math.round(pageDimensions.height / 2 - h / 2),
      width: w,
      height: h,
      dataUrl,
    }
    setPlacedItems((prev) => [...prev, newItem])
    setSelectedId(newItem.id)
  }

  // ─── 8. Drag & Resize Placed Items ──────────────────────────────────────────
  const startDrag = (id: string, e: React.PointerEvent, isResize = false) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setSelectedId(id)

    const item = placedItems.find((a) => a.id === id)
    if (!item) return

    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: item.x,
      origY: item.y,
      origW: item.width,
      origH: item.height,
      isResize,
    }

    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current || dragRef.current.id !== id) return
      const dx = (ev.clientX - dragRef.current.startX) / scale
      const dy = (ev.clientY - dragRef.current.startY) / scale

      setPlacedItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it
          if (dragRef.current?.isResize) {
            const newW = Math.max(30, Math.round(dragRef.current.origW + dx))
            const ratio = dragRef.current.origW / dragRef.current.origH
            const newH = Math.max(15, Math.round(newW / ratio))
            return { ...it, width: newW, height: newH }
          } else {
            const newX = Math.max(0, Math.round(dragRef.current.origX + dx))
            const newY = Math.max(0, Math.round(dragRef.current.origY + dy))
            return { ...it, x: newX, y: newY }
          }
        })
      )
    }

    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const deletePlacedItem = (id: string) => {
    setPlacedItems((prev) => prev.filter((a) => a.id !== id))
    setSelectedId((curr) => (curr === id ? null : curr))
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedId(null)
        setIsModalOpen(false)
        setUnlockTarget(null)
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        deletePlacedItem(selectedId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId])

  // ─── 9. Export Signed PDF with pdf-lib ──────────────────────────────────────
  const handleExportSigned = async () => {
    const file = files[0]
    if (!file) return

    try {
      setIsProcessing(true)
      setProgressMsg('Embedding your signatures and generating PDF...')

      const freshBytes = await file.arrayBuffer()
      const pdfDocLib = await PDFDocument.load(freshBytes)
      const pages = pdfDocLib.getPages()

      for (let pIndex = 0; pIndex < pages.length; pIndex++) {
        const page = pages[pIndex]
        const pageNum = pIndex + 1
        const pageHeight = page.getHeight()
        const pageSignatures = placedItems.filter((item) => item.page === pageNum)

        for (const item of pageSignatures) {
          const imgBytes = await dataUrlToBytes(item.dataUrl)
          const embeddedPng = await pdfDocLib.embedPng(imgBytes)
          const pdfY = pageHeight - (item.y + item.height)

          page.drawImage(embeddedPng, {
            x: item.x,
            y: pdfY,
            width: item.width,
            height: item.height,
          })
        }
      }

      const signedBytes = await pdfDocLib.save()
      const blob = new Blob([signedBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
      setIsProcessing(false)
    } catch (err: any) {
      console.error('Failed to export signed PDF:', err)
      setErrorMsg('Error generating signed PDF: ' + (err?.message || 'Unknown error'))
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    setFiles([])
    setPdfDoc(null)
    setPlacedItems([])
    setSelectedId(null)
    setDownloadUrl(null)
  }

  const SignIcon = () => (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )

  const currentPageItems = placedItems.filter((it) => it.page === currentPage)

  return (
    <ToolPageLayout
      title="Sign PDF"
      description="Create your digital signature with AES-256 encryption, add date stamps & checkmarks, and sign documents securely in your browser."
      color="teal"
      icon={<SignIcon />}
    >
      {downloadUrl ? (
        <div className="text-center py-10 space-y-6 max-w-lg mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900">Your Document is Signed!</h3>
            <p className="text-sm text-slate-500">Signatures and date stamps have been embedded into your PDF securely.</p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <a
              href={downloadUrl}
              download={downloadName}
              className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-teal-200 transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Signed PDF
            </a>
            <button
              onClick={() => setDownloadUrl(null)}
              className="px-5 py-3.5 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-sm"
            >
              Continue Editing
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-3.5 text-slate-400 hover:text-red-500 font-medium transition-colors text-sm"
            >
              New File
            </button>
          </div>
        </div>
      ) : isProcessing ? (
        <Spinner message={progressMsg} />
      ) : !pdfDoc ? (
        <div className="space-y-4">
          <DropZone onFilesSelected={setFiles} selectedFiles={files} hint="Upload any PDF to add signatures, initials & date stamps" />
          {errorMsg && <ErrorMessage message={errorMsg} onRetry={handleReset} />}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
              <span className="text-2xl">✍️</span>
              <p className="font-bold text-xs text-slate-800 mt-1.5">Draw Signature</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Smooth digital ink with custom pen colors</p>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
              <span className="text-2xl">🔤</span>
              <p className="font-bold text-xs text-slate-800 mt-1.5">Type Signature</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Elegant handwriting calligraphy styles</p>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
              <span className="text-2xl">🛡️</span>
              <p className="font-bold text-xs text-slate-800 mt-1.5">AES-256 Encryption</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Optional PIN protection for saved signatures</p>
            </div>
          </div>
        </div>
      ) : (
        /* ── Signature Studio Workspace ── */
        <div className="space-y-3" ref={containerRef}>
          {/* Main Top Studio Toolbar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-2 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
            {/* Signature & Quick Stamp Actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  setIsModalOpen(true)
                  setTimeout(initPad, 50)
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Signature
              </button>

              <button
                onClick={addDateStamp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                title="Add today's date stamp"
              >
                <span>📅</span>
                Add Date
              </button>

              <button
                onClick={addCheckmarkStamp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                title="Add a green checkmark"
              >
                <span className="text-emerald-600 font-bold">✓</span>
                Checkmark
              </button>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs font-semibold text-slate-700 px-1 min-w-[70px] text-center">
                {currentPage} / {numPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                disabled={currentPage >= numPages}
                className="p-1 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next page"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setScale((s) => Math.max(0.4, parseFloat((s - 0.15).toFixed(2))))}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 text-xs font-bold"
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-xs font-semibold text-slate-700 w-9 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(2.0, parseFloat((s + 0.15).toFixed(2))))}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 text-xs font-bold"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={fitToWidth}
                className="text-[11px] font-semibold text-teal-600 hover:bg-teal-50 px-1.5 py-0.5 rounded transition-colors ml-0.5"
              >
                Fit
              </button>
            </div>

            {/* Download Button */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={handleExportSigned}
                disabled={placedItems.length === 0}
                className="bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sign &amp; Download
              </button>
            </div>
          </div>

          {/* Saved Signatures Tray with AES-256 & PIN Badge */}
          {savedSignatures.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 flex items-center justify-between gap-3 overflow-x-auto text-xs shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 shrink-0 flex items-center gap-1">
                  <span>🔒</span> Saved Signatures:
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                  AES-256 Encrypted
                </span>
              </div>

              <div className="flex items-center gap-2">
                {savedSignatures.map((sig) => {
                  if (sig.isLocked) {
                    return (
                      <button
                        key={sig.id}
                        onClick={() => {
                          setUnlockTarget(sig)
                          setUnlockPin('')
                          setUnlockError(null)
                        }}
                        className="h-10 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg flex items-center gap-1.5 font-semibold transition-all shrink-0 relative group"
                        title="Locked with PIN — Click to unlock"
                      >
                        <span>🔐</span>
                        <span className="text-xs">PIN Locked</span>
                        <button
                          type="button"
                          onClick={(e) => deleteSavedSignature(sig.id, e)}
                          className="w-4 h-4 rounded-full bg-red-100 hover:bg-red-500 hover:text-white text-red-600 flex items-center justify-center text-[10px] ml-1 opacity-70 group-hover:opacity-100 transition-opacity"
                          title="Delete saved signature"
                        >
                          ✕
                        </button>
                      </button>
                    )
                  }

                  return (
                    <div
                      key={sig.id}
                      onClick={() => {
                        if (!sig.dataUrl) return
                        const w = 150
                        const h = 60
                        const newItem: PlacedSignature = {
                          id: 'sig_' + Date.now(),
                          page: currentPage,
                          x: Math.round(pageDimensions.width / 2 - w / 2),
                          y: Math.round(pageDimensions.height / 2 - h / 2),
                          width: w,
                          height: h,
                          dataUrl: sig.dataUrl,
                        }
                        setPlacedItems((prev) => [...prev, newItem])
                        setSelectedId(newItem.id)
                      }}
                      className="h-10 px-2.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-lg flex items-center justify-between gap-2 transition-all cursor-pointer group shrink-0 relative"
                      title="Click to stamp onto this page"
                    >
                      <img src={sig.dataUrl} alt={sig.label} className="h-7 max-w-[90px] object-contain pointer-events-none" />
                      <span className="text-[10px] text-teal-600 font-semibold hidden group-hover:inline">+ Stamp</span>
                      <button
                        type="button"
                        onClick={(e) => deleteSavedSignature(sig.id, e)}
                        className="w-4 h-4 rounded-full bg-slate-200 hover:bg-red-500 hover:text-white text-slate-500 flex items-center justify-center text-[10px] opacity-60 group-hover:opacity-100 transition-opacity"
                        title="Delete from this device"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Document Canvas Workspace */}
          <div
            className="border border-slate-200/80 rounded-2xl bg-slate-100/90 shadow-inner overflow-auto flex justify-center items-start p-6 relative select-none"
            style={{ maxHeight: '74vh', minHeight: '450px' }}
            onClick={() => setSelectedId(null)}
          >
            <div
              className="relative shadow-xl bg-white rounded transition-shadow duration-200"
              style={{
                width: pageDimensions.width * scale,
                height: pageDimensions.height * scale,
              }}
            >
              {/* PDF.js Rendered Canvas */}
              <canvas ref={canvasRef} className="block pointer-events-none w-full h-full" />

              {/* Placed Signatures Layer */}
              {currentPageItems.map((item) => {
                const isSelected = item.id === selectedId
                return (
                  <div
                    key={item.id}
                    style={{
                      position: 'absolute',
                      left: item.x * scale,
                      top: item.y * scale,
                      width: item.width * scale,
                      height: item.height * scale,
                      cursor: 'move',
                      zIndex: isSelected ? 30 : 20,
                    }}
                    onPointerDown={(e) => startDrag(item.id, e)}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedId(item.id)
                    }}
                    className={`group ${isSelected ? 'ring-2 ring-teal-500 shadow-md bg-teal-50/20' : 'hover:ring-1 hover:ring-teal-400'}`}
                  >
                    <img
                      src={item.dataUrl}
                      alt="Signature"
                      className="w-full h-full object-contain pointer-events-none"
                    />

                    {isSelected && (
                      <>
                        {/* Delete Button */}
                        <button
                          type="button"
                          onPointerDown={(e) => { e.stopPropagation(); e.preventDefault() }}
                          onMouseDown={(e) => { e.stopPropagation(); e.preventDefault() }}
                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); deletePlacedItem(item.id) }}
                          className="absolute -top-3.5 -right-3.5 w-5 h-5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md cursor-pointer z-40 transition-transform hover:scale-110"
                          title="Delete signature"
                        >
                          ✕
                        </button>
                        {/* Resize Handle */}
                        <div
                          onPointerDown={(e) => startDrag(item.id, e, true)}
                          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-teal-600 rounded-xs cursor-nwse-resize z-30"
                          title="Drag to resize"
                        />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Help & Status */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-2 gap-2">
            <div className="flex items-center gap-3">
              <span>💡 <strong>Privacy Note:</strong> All signatures are encrypted locally with AES-256. Zero data is ever sent to any server.</span>
              {placedItems.length > 0 && (
                <span className="text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {placedItems.length} signature{placedItems.length !== 1 ? 's' : ''} placed
                </span>
              )}
            </div>
            <button
              onClick={handleReset}
              className="text-slate-400 hover:text-red-500 font-medium transition-colors"
            >
              Upload another PDF
            </button>
          </div>
        </div>
      )}

      {/* ── Create Signature Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">✍️</span>
                <h3 className="text-lg font-bold text-slate-900">Create Signature</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => setModalTab('draw')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  modalTab === 'draw' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ✍️ Draw
              </button>
              <button
                onClick={() => setModalTab('type')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  modalTab === 'type' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🔤 Type
              </button>
              <button
                onClick={() => setModalTab('upload')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  modalTab === 'upload' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📤 Upload
              </button>
            </div>

            {/* Tab 1: Draw */}
            {modalTab === 'draw' && (
              <div className="space-y-3">
                <div className="border border-slate-300 rounded-2xl bg-white overflow-hidden relative shadow-inner">
                  <canvas
                    ref={padCanvasRef}
                    width={480}
                    height={180}
                    className="w-full h-40 cursor-crosshair touch-none"
                    onPointerDown={startPadDrawing}
                    onPointerMove={drawOnPad}
                    onPointerUp={stopPadDrawing}
                    onPointerLeave={stopPadDrawing}
                  />
                  <div className="absolute bottom-2 left-3 text-[11px] text-slate-400 pointer-events-none">
                    Sign with mouse, trackpad, or finger
                  </div>
                  <button
                    onClick={initPad}
                    className="absolute top-2 right-2 text-xs font-semibold text-slate-500 hover:text-red-500 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600">Color:</span>
                    {['#000000', '#1e3a8a', '#991b1b'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setDrawColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${drawColor === c ? 'border-teal-500 scale-110' : 'border-white'}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-600">Thickness:</span>
                    {[2, 3, 5].map((w) => (
                      <button
                        key={w}
                        onClick={() => setDrawWidth(w)}
                        className={`px-2.5 py-1 rounded-lg border font-bold ${
                          drawWidth === w ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        {w === 2 ? 'Fine' : w === 3 ? 'Medium' : 'Bold'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Type */}
            {modalTab === 'type' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name:</label>
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                  />
                </div>

                {typedName.trim() && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">Select Signature Style:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: 'Elegant Script', font: 'font-serif italic' },
                        { name: 'Casual Flow', font: 'font-sans italic' },
                        { name: 'Classic Script', font: 'font-serif' },
                        { name: 'Executive Style', font: 'font-mono italic' },
                      ].map((style, idx) => (
                        <button
                          key={idx}
                          onClick={() => setTypedFontIndex(idx)}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            typedFontIndex === idx
                              ? 'border-teal-500 bg-teal-50/50 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                          }`}
                        >
                          <p
                            className={`text-base truncate ${style.font}`}
                            style={{ color: typedColor }}
                          >
                            {typedName}
                          </p>
                          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">{style.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <span className="font-semibold text-slate-600">Color:</span>
                      {['#000000', '#1e3a8a', '#991b1b'].map((c) => (
                        <button
                          key={c}
                          onClick={() => setTypedColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${typedColor === c ? 'border-teal-500 scale-110' : 'border-white'}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Upload */}
            {modalTab === 'upload' && (
              <div className="space-y-3 text-center">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 cursor-pointer transition-colors bg-slate-50 hover:bg-teal-50/30"
                >
                  <span className="text-3xl">📷</span>
                  <p className="font-bold text-sm text-slate-800 mt-2">Upload signature photo or scan</p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG, or JPEG (White background will be automatically removed)</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={handleUploadSignature}
                />
              </div>
            )}

            {/* ── Security & AES-256 Encryption Options ── */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 select-none">
                <input
                  type="checkbox"
                  checked={saveToDevice}
                  onChange={(e) => setSaveToDevice(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span>Save signature securely on this device (AES-256 Encrypted)</span>
              </label>

              {saveToDevice && (
                <div className="pl-6 space-y-2 pt-1 border-t border-slate-200/60">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={usePinLock}
                      onChange={(e) => setUsePinLock(e.target.checked)}
                      className="w-3.5 h-3.5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span className="font-medium">🔐 Protect signature with a PIN code (Optional)</span>
                  </label>

                  {usePinLock && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="password"
                        value={creationPin}
                        onChange={(e) => setCreationPin(e.target.value)}
                        placeholder="Enter 4-digit PIN"
                        maxLength={8}
                        className="w-40 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono tracking-widest text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                      <span className="text-[11px] text-slate-500">Required to unlock on this device</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {modalTab !== 'upload' && (
              <button
                onClick={modalTab === 'draw' ? handleSaveDrawnSignature : handleSaveTypedSignature}
                disabled={modalTab === 'type' && !typedName.trim()}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md shadow-teal-100 text-sm transition-colors"
              >
                Insert Signature
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Unlock PIN Modal ── */}
      {unlockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔐</span>
                <h3 className="text-base font-bold text-slate-900">Unlock Signature</h3>
              </div>
              <button
                onClick={() => {
                  setUnlockTarget(null)
                  setUnlockPin('')
                  setUnlockError(null)
                }}
                className="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              This signature is encrypted with AES-256. Enter your PIN to decrypt and place it on your document.
            </p>

            <form onSubmit={handleUnlockSubmit} className="space-y-3">
              <input
                type="password"
                value={unlockPin}
                onChange={(e) => {
                  setUnlockPin(e.target.value)
                  setUnlockError(null)
                }}
                placeholder="Enter PIN code"
                autoFocus
                maxLength={8}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-center font-mono text-lg tracking-widest text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
              />

              {unlockError && (
                <p className="text-xs text-red-600 font-semibold text-center">{unlockError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setUnlockTarget(null)
                    setUnlockPin('')
                    setUnlockError(null)
                  }}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!unlockPin.trim()}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  Unlock &amp; Stamp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ToolPageLayout>
  )
}
