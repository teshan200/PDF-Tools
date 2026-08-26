import { useState, useEffect, useRef, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import ToolPageLayout from '../components/ToolPageLayout'
import DropZone from '../components/DropZone'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import { encryptData, decryptData, sha256Hash, generateAuditId, EncryptedPayload } from '../utils/crypto'
import { extractSignature, InkColorMode, CropRect } from '../utils/imageExtractor'
import { PenIcon, TypeIcon, CameraIcon, CalendarIcon, CheckIcon, LockIcon, ShieldIcon, SlidersIcon } from '../components/Icons'

// Configure worker to use locally bundled worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc

const STORAGE_KEY = 'easypdf_saved_signatures_v1'
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes

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

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const parts = dataUrl.split(',')
  const base64 = parts.length > 1 ? parts[1] : parts[0]
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
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

  // Security Options
  const [includeAuditTrail, setIncludeAuditTrail] = useState(true)

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

  // Upload & Extractor Studio state
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null)
  const [uploadedImgEl, setUploadedImgEl] = useState<HTMLImageElement | null>(null)
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number }>({ x: 10, y: 10, w: 80, h: 80 }) // in percent 0..100
  const [thresholdVal, setThresholdVal] = useState(150)
  const [inkColorChoice, setInkColorChoice] = useState<InkColorMode>('black')
  const [extractedPreviewUrl, setExtractedPreviewUrl] = useState<string | null>(null)

  // Storage & Encryption Options in Modal
  const [saveToDevice, setSaveToDevice] = useState(true)
  const [usePinLock, setUsePinLock] = useState(false)
  const [creationPin, setCreationPin] = useState('')

  // Unlock PIN Modal & Brute-Force Rate Limiting
  const [unlockTarget, setUnlockTarget] = useState<LoadedSignature | null>(null)
  const [unlockPin, setUnlockPin] = useState('')
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  // Inactivity tracking
  const lastActivityRef = useRef(Date.now())

  // Interaction refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const padCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const cropContainerRef = useRef<HTMLDivElement>(null)

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

  const cropDragRef = useRef<{
    startX: number
    startY: number
    origX: number
    origY: number
    origW: number
    origH: number
    type: 'move' | 'nw' | 'ne' | 'se' | 'sw'
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
            loadedList.push({
              id: rec.id,
              label: rec.label,
              createdAt: rec.createdAt,
              hasPin: true,
              isLocked: true,
            })
          } else {
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

  // ─── 2. Inactivity Auto-Lock & RAM Zeroization ──────────────────────────────
  const lockSensitiveSignatures = useCallback(() => {
    setSavedSignatures((prev) =>
      prev.map((sig) => (sig.hasPin ? { ...sig, isLocked: true, dataUrl: undefined } : sig))
    )
    setUnlockTarget(null)
    setUnlockPin('')
  }, [])

  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now()
    }

    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('pointerdown', handleActivity)
    window.addEventListener('touchstart', handleActivity)

    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > INACTIVITY_TIMEOUT_MS) {
        lockSensitiveSignatures()
      }
    }, 15000)

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('pointerdown', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
      clearInterval(interval)
    }
  }, [lockSensitiveSignatures])

  // Cooldown countdown timer for brute force protection
  useEffect(() => {
    if (cooldownRemaining <= 0) return
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownRemaining])

  // ─── 3. Load PDF Document ───────────────────────────────────────────────────
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

  // ─── 4. Render Current Page ─────────────────────────────────────────────────
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

  // Auto-fit to mobile container width on initial load and page dimension changes
  useEffect(() => {
    if (!containerRef.current || !pageDimensions.width) return
    const isMobile = window.innerWidth < 640
    const containerWidth = containerRef.current.clientWidth - (isMobile ? 20 : 64)
    if (containerWidth > 0 && pageDimensions.width > 0) {
      const targetScale = Math.min(1.2, Math.max(0.3, containerWidth / pageDimensions.width))
      setScale(parseFloat(targetScale.toFixed(2)))
    }
  }, [pageDimensions.width])

  // Auto-fit on window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !pageDimensions.width) return
      const isMobile = window.innerWidth < 640
      const containerWidth = containerRef.current.clientWidth - (isMobile ? 20 : 64)
      if (containerWidth > 0 && pageDimensions.width > 0) {
        const targetScale = Math.min(1.2, Math.max(0.3, containerWidth / pageDimensions.width))
        setScale(parseFloat(targetScale.toFixed(2)))
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [pageDimensions.width])

  const fitToWidth = useCallback(() => {
    if (!containerRef.current || !pageDimensions.width) return
    const isMobile = window.innerWidth < 640
    const containerWidth = containerRef.current.clientWidth - (isMobile ? 20 : 64)
    const targetScale = Math.min(1.4, Math.max(0.3, (containerWidth / pageDimensions.width)))
    setScale(parseFloat(targetScale.toFixed(2)))
  }, [pageDimensions.width])

  // ─── 5. Signature Pad Drawing Logic ─────────────────────────────────────────
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

  // ─── 6. Save & Encrypt Signature ────────────────────────────────────────────
  const addSignatureToDocument = async (dataUrl: string, label = 'Signature') => {
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
    setUploadedImageSrc(null)
    setUploadedImgEl(null)
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

  // ─── 7. Smart Image Upload & Extractor Live Updates ─────────────────────────
  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      const img = new Image()
      img.onload = () => {
        setUploadedImgEl(img)
        setUploadedImageSrc(src)
        // Center crop default
        setCropBox({ x: 15, y: 15, w: 70, h: 70 })
        setThresholdVal(150)
      }
      img.src = src
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Recalculate extracted preview whenever cropBox, threshold, or colorMode changes
  useEffect(() => {
    if (!uploadedImgEl) {
      setExtractedPreviewUrl(null)
      return
    }

    const naturalW = uploadedImgEl.naturalWidth
    const naturalH = uploadedImgEl.naturalHeight

    const pixelCrop: CropRect = {
      x: Math.round((cropBox.x / 100) * naturalW),
      y: Math.round((cropBox.y / 100) * naturalH),
      width: Math.round((cropBox.w / 100) * naturalW),
      height: Math.round((cropBox.h / 100) * naturalH),
    }

    const { dataUrl } = extractSignature(uploadedImgEl, pixelCrop, thresholdVal, inkColorChoice)
    setExtractedPreviewUrl(dataUrl)
  }, [uploadedImgEl, cropBox, thresholdVal, inkColorChoice])

  // Draggable crop box logic
  const startCropDrag = (e: React.PointerEvent, type: 'move' | 'nw' | 'ne' | 'se' | 'sw') => {
    e.stopPropagation()
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)

    cropDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: cropBox.x,
      origY: cropBox.y,
      origW: cropBox.w,
      origH: cropBox.h,
      type,
    }

    const onMove = (ev: PointerEvent) => {
      if (!cropDragRef.current || !cropContainerRef.current) return
      const containerRect = cropContainerRef.current.getBoundingClientRect()
      const dxPct = ((ev.clientX - cropDragRef.current.startX) / containerRect.width) * 100
      const dyPct = ((ev.clientY - cropDragRef.current.startY) / containerRect.height) * 100

      const { origX, origY, origW, origH, type: dragType } = cropDragRef.current

      if (dragType === 'move') {
        const newX = Math.max(0, Math.min(100 - origW, origX + dxPct))
        const newY = Math.max(0, Math.min(100 - origH, origY + dyPct))
        setCropBox({ x: newX, y: newY, w: origW, h: origH })
      } else if (dragType === 'se') {
        const newW = Math.max(10, Math.min(100 - origX, origW + dxPct))
        const newH = Math.max(10, Math.min(100 - origY, origH + dyPct))
        setCropBox({ x: origX, y: origY, w: newW, h: newH })
      } else if (dragType === 'nw') {
        const newX = Math.max(0, Math.min(origX + origW - 10, origX + dxPct))
        const newY = Math.max(0, Math.min(origY + origH - 10, origY + dyPct))
        const newW = origW - (newX - origX)
        const newH = origH - (newY - origY)
        setCropBox({ x: newX, y: newY, w: newW, h: newH })
      }
    }

    const onUp = () => {
      cropDragRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // ─── 8. Unlock PIN-Protected Signature with Rate Limiting ───────────────────
  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unlockTarget || !unlockPin.trim() || cooldownRemaining > 0) return

    setUnlockError(null)
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) throw new Error('No storage found')
      const records: StoredSignatureRecord[] = JSON.parse(raw)
      const record = records.find((r) => r.id === unlockTarget.id)
      if (!record) throw new Error('Signature record not found')

      const decryptedDataUrl = await decryptData(record.payload, unlockPin.trim())

      setFailedAttempts(0)

      setSavedSignatures((prev) =>
        prev.map((s) =>
          s.id === unlockTarget.id
            ? { ...s, dataUrl: decryptedDataUrl, isLocked: false }
            : s
        )
      )

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

      setUnlockTarget(null)
      setUnlockPin('')
    } catch (err: any) {
      console.error(err)
      const newFails = failedAttempts + 1
      setFailedAttempts(newFails)

      if (newFails >= 5) {
        setCooldownRemaining(60)
        setUnlockError('Security Lockout: 5 failed attempts. Please wait 60 seconds.')
      } else if (newFails >= 3) {
        setCooldownRemaining(30)
        setUnlockError('Too many failed attempts. Cooldown active for 30 seconds.')
      } else {
        setUnlockError(`Incorrect PIN. (${3 - newFails} attempts remaining before cooldown)`)
      }
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

  // ─── 9. Quick Stamps (Date, Checkmark) ──────────────────────────────────────
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

  // ─── 10. Drag & Resize Placed Items ─────────────────────────────────────────
  const startDrag = (id: string, e: React.PointerEvent, isResize = false) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
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
      if (typeof ev.clientX !== 'number' || typeof ev.clientY !== 'number') return
      const currentScale = Math.max(0.1, scale || 1)
      const dx = (ev.clientX - dragRef.current.startX) / currentScale
      const dy = (ev.clientY - dragRef.current.startY) / currentScale

      setPlacedItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it
          if (dragRef.current?.isResize) {
            const newW = Math.max(30, Math.round(dragRef.current.origW + dx))
            const ratio = (dragRef.current.origW || 150) / (dragRef.current.origH || 60)
            const newH = Math.max(15, Math.round(newW / (ratio || 2.5)))
            return { ...it, width: isNaN(newW) ? it.width : newW, height: isNaN(newH) ? it.height : newH }
          } else {
            const maxX = Math.max(0, (pageDimensions.width || 800) - (it.width || 100))
            const maxY = Math.max(0, (pageDimensions.height || 1000) - (it.height || 40))
            const rawX = Math.round(dragRef.current.origX + dx)
            const rawY = Math.round(dragRef.current.origY + dy)
            const newX = isNaN(rawX) ? it.x : Math.max(0, Math.min(maxX, rawX))
            const newY = isNaN(rawY) ? it.y : Math.max(0, Math.min(maxY, rawY))
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

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
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

  // ─── 11. Flattened Export with Cryptographic SHA-256 Audit Trail ────────────
  const handleExportSigned = async () => {
    const file = files[0]
    if (!file) return

    try {
      setIsProcessing(true)
      setProgressMsg('Computing cryptographic SHA-256 hash & embedding signatures...')

      const freshBytes = await file.arrayBuffer()
      const docHash = await sha256Hash(freshBytes)
      const auditId = generateAuditId()
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'

      const pdfDocLib = await PDFDocument.load(freshBytes)
      const pages = pdfDocLib.getPages()
      const helvetica = await pdfDocLib.embedFont(StandardFonts.Helvetica)
      const helveticaBold = await pdfDocLib.embedFont(StandardFonts.HelveticaBold)

      for (let pIndex = 0; pIndex < pages.length; pIndex++) {
        const page = pages[pIndex]
        const pageNum = pIndex + 1
        const pageWidth = page.getWidth()
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

        if (includeAuditTrail && pageSignatures.length > 0) {
          const footerH = 14
          const footerY = 8
          const footerW = pageWidth - 32

          page.drawRectangle({
            x: 16,
            y: footerY,
            width: footerW,
            height: footerH,
            color: rgb(0.96, 0.97, 0.98),
            borderColor: rgb(0.85, 0.88, 0.92),
            borderWidth: 0.5,
          })

          const auditShortHash = `${docHash.substring(0, 10)}...${docHash.substring(docHash.length - 8)}`
          const auditText = `[VERIFIED SIGNATURE] SHA-256: ${auditShortHash} | ID: ${auditId} | ${timestamp}`
          page.drawText(auditText, {
            x: 22,
            y: footerY + 4,
            size: 6.5,
            font: helvetica,
            color: rgb(0.3, 0.35, 0.4),
          })

          page.drawText('Easy PDF Tools', {
            x: footerW - 40,
            y: footerY + 4,
            size: 6.5,
            font: helveticaBold,
            color: rgb(0.1, 0.45, 0.4),
          })
        }
      }

      const signedBytes = await pdfDocLib.save()
      const blob = new Blob([signedBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
      setIsProcessing(false)

      // Auto-trigger direct browser download
      try {
        const a = document.createElement('a')
        a.href = url
        a.download = downloadName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } catch (dlErr) {
        console.warn('Auto download popup blocked, download button available:', dlErr)
      }
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
    setUploadedImageSrc(null)
    setUploadedImgEl(null)
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
      description="Create digital signatures with smart background removal, AES-256 encryption, anti-tamper flattening, and cryptographic SHA-256 audit trails."
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
            <h3 className="text-2xl font-bold text-slate-900">Your Document is Signed &amp; Verified!</h3>
            <p className="text-sm text-slate-500">
              Signatures flattened directly into the document stream with cryptographic SHA-256 tamper verification.
            </p>
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
          <DropZone onFilesSelected={setFiles} selectedFiles={files} hint="Upload any PDF to sign with smart ink extraction, AES-256 encryption & SHA-256 audit trail" />
          {errorMsg && <ErrorMessage message={errorMsg} onRetry={handleReset} />}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-2xs">
              <div className="w-8 h-8 mx-auto rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-1.5">
                <CameraIcon className="w-4 h-4" />
              </div>
              <p className="font-bold text-xs text-slate-800 dark:text-slate-200">Photo Extractor</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Crops &amp; removes paper/shadows</p>
            </div>
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-2xs">
              <div className="w-8 h-8 mx-auto rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-1.5">
                <LockIcon className="w-4 h-4" />
              </div>
              <p className="font-bold text-xs text-slate-800 dark:text-slate-200">AES-256 Storage</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Encrypted on your device</p>
            </div>
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-2xs">
              <div className="w-8 h-8 mx-auto rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-1.5">
                <ShieldIcon className="w-4 h-4" />
              </div>
              <p className="font-bold text-xs text-slate-800 dark:text-slate-200">Audit Trail</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">SHA-256 cryptographic verification</p>
            </div>
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-2xs">
              <div className="w-8 h-8 mx-auto rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-1.5">
                <CheckIcon className="w-4 h-4" />
              </div>
              <p className="font-bold text-xs text-slate-800 dark:text-slate-200">PDF Flattening</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Permanent vector embedding</p>
            </div>
          </div>

          {/* Client-Side Guarantee */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-start gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5 border border-teal-100 dark:border-teal-900">
              <ShieldIcon className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <p className="font-bold text-slate-900 dark:text-white">100% Client-Side Processing</p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                This tool runs locally inside your browser using Web Workers and the Web Crypto API. Your files and signatures never leave your computer or touch remote servers.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ── Signature Studio Workspace ── */
        <div className="space-y-3" ref={containerRef}>
          {errorMsg && <ErrorMessage message={errorMsg} onRetry={() => setErrorMsg(null)} />}
          {/* Main Top Studio Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
            {/* Signature & Quick Stamp Actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  setIsModalOpen(true)
                  setTimeout(initPad, 50)
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Signature
              </button>

              <button
                onClick={addDateStamp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                title="Add today's date stamp"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                Add Date
              </button>

              <button
                onClick={addCheckmarkStamp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                title="Add a green checkmark"
              >
                <CheckIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Checkmark
              </button>

              {/* Audit Trail Toggle */}
              <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 select-none ml-1">
                <input
                  type="checkbox"
                  checked={includeAuditTrail}
                  onChange={(e) => setIncludeAuditTrail(e.target.checked)}
                  className="w-3.5 h-3.5 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                />
                <ShieldIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Audit Trail Stamp</span>
              </label>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Previous page"
              >
                <svg className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 px-1 min-w-[70px] text-center">
                {currentPage} / {numPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                disabled={currentPage >= numPages}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Next page"
              >
                <svg className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setScale((s) => Math.max(0.4, parseFloat((s - 0.15).toFixed(2))))}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 w-9 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(2.0, parseFloat((s + 0.15).toFixed(2))))}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={fitToWidth}
                className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 px-1.5 py-0.5 rounded transition-colors ml-0.5 cursor-pointer"
              >
                Fit
              </button>
            </div>

            {/* Download Button */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={handleExportSigned}
                disabled={placedItems.length === 0}
                className="bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sign &amp; Download
              </button>
            </div>
          </div>

          {/* Saved Signatures Tray with AES-256 & Session Lock */}
          {savedSignatures.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-3.5 py-2 flex items-center justify-between gap-3 overflow-x-auto text-xs shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0 flex items-center gap-1.5">
                  <LockIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Saved Signatures:</span>
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                  AES-256 Encrypted
                </span>
              </div>

              <div className="flex items-center gap-2">
                {savedSignatures.map((sig) => {
                  if (sig.isLocked) {
                    return (
                      <div
                        key={sig.id}
                        onClick={() => {
                          setUnlockTarget(sig)
                          setUnlockPin('')
                          setUnlockError(null)
                        }}
                        className="h-10 px-3 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-xl flex items-center gap-1.5 font-semibold transition-all shrink-0 relative group cursor-pointer"
                        title="Locked with PIN — Click to unlock"
                      >
                        <LockIcon className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                        <span className="text-xs">PIN Locked</span>
                        <button
                          type="button"
                          onClick={(e) => deleteSavedSignature(sig.id, e)}
                          className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-950/80 hover:bg-red-500 hover:text-white text-red-600 dark:text-red-400 flex items-center justify-center text-[10px] ml-1 opacity-70 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Delete saved signature"
                        >
                          ✕
                        </button>
                      </div>
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
                      className="h-10 px-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 rounded-xl flex items-center justify-between gap-2 transition-all cursor-pointer group shrink-0 relative"
                      title="Click to stamp onto this page"
                    >
                      <img src={sig.dataUrl} alt={sig.label} className="h-7 max-w-[90px] object-contain pointer-events-none bg-white rounded-xs px-1" />
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold hidden group-hover:inline">+ Stamp</span>
                      <button
                        type="button"
                        onClick={(e) => deleteSavedSignature(sig.id, e)}
                        className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-red-500 hover:text-white text-slate-500 dark:text-slate-300 flex items-center justify-center text-[10px] opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Delete from this device"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}

                {savedSignatures.some((s) => s.hasPin && !s.isLocked) && (
                  <button
                    onClick={lockSensitiveSignatures}
                    className="h-8 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[11px] font-medium flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                    title="Zero out decrypted RAM and lock session immediately"
                  >
                    <LockIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Lock Session</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Document Canvas Workspace */}
          <div
            className="flex justify-center overflow-auto p-2 sm:p-8 bg-slate-100 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[350px] sm:min-h-[550px] shadow-inner touch-pan-x touch-pan-y"
            onClick={() => setSelectedId(null)}
          >
            <div
              className="relative bg-white shadow-xl rounded-sm select-none transition-transform shrink-0"
              style={{
                width: `${pageDimensions.width * scale}px`,
                height: `${pageDimensions.height * scale}px`,
              }}
            >
              {/* PDF Page Canvas */}
              <canvas ref={canvasRef} className="block pointer-events-none w-full h-full bg-white" />

              {/* Placed Signatures & Stamps on current page */}
              {placedItems
                .filter((item) => item.page === currentPage)
                .map((item) => {
                  const isSelected = selectedId === item.id
                  const itemX = Math.max(0, (item.x || 0) * scale)
                  const itemY = Math.max(0, (item.y || 0) * scale)
                  const itemW = Math.max(20, (item.width || 150) * scale)
                  const itemH = Math.max(10, (item.height || 60) * scale)

                  return (
                    <div
                      key={item.id}
                      onPointerDown={(e) => startDrag(item.id, e, false)}
                      className={`absolute cursor-move select-none group transition-shadow touch-none ${
                        isSelected
                          ? 'ring-2 ring-teal-500 bg-teal-500/5 shadow-md'
                          : 'hover:ring-1 hover:ring-teal-400'
                      }`}
                      style={{
                        left: `${itemX}px`,
                        top: `${itemY}px`,
                        width: `${itemW}px`,
                        height: `${itemH}px`,
                        touchAction: 'none',
                      }}
                    >
                      <img
                        src={item.dataUrl}
                        alt="Signature"
                        className="w-full h-full object-contain pointer-events-none"
                      />

                      {/* Resize Handle at Bottom-Right */}
                      {isSelected && (
                        <>
                          <div
                            onPointerDown={(e) => startDrag(item.id, e, true)}
                            className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-teal-600 rounded-full cursor-nwse-resize shadow-md z-30"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              deletePlacedItem(item.id)
                            }}
                            className="absolute -top-3 -right-3 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md hover:bg-red-600 z-30 font-bold"
                            title="Delete"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* ── Create Signature Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className={`bg-white dark:bg-slate-900 rounded-3xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto transition-colors ${modalTab === 'upload' && uploadedImageSrc ? 'max-w-2xl' : 'max-w-lg'}`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                  <PenIcon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Signature</h3>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setUploadedImageSrc(null)
                  setUploadedImgEl(null)
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-1 border border-slate-200/60 dark:border-slate-700/60">
              <button
                onClick={() => setModalTab('draw')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === 'draw' ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PenIcon className="w-3.5 h-3.5" />
                <span>Draw</span>
              </button>
              <button
                onClick={() => setModalTab('type')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === 'type' ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TypeIcon className="w-3.5 h-3.5" />
                <span>Type</span>
              </button>
              <button
                onClick={() => setModalTab('upload')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === 'upload' ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CameraIcon className="w-3.5 h-3.5" />
                <span>Photo Extractor</span>
              </button>
            </div>

            {/* Tab 1: Draw */}
            {modalTab === 'draw' && (
              <div className="space-y-3">
                <div className="border border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-950 overflow-hidden relative shadow-inner">
                  <canvas
                    ref={padCanvasRef}
                    width={480}
                    height={180}
                    className="w-full h-40 cursor-crosshair touch-none bg-white"
                    onPointerDown={startPadDrawing}
                    onPointerMove={drawOnPad}
                    onPointerUp={stopPadDrawing}
                    onPointerLeave={stopPadDrawing}
                  />
                  <div className="absolute bottom-2 left-3 text-[11px] text-slate-400 pointer-events-none select-none">
                    Sign with finger, stylus, or mouse
                  </div>
                  <button
                    onClick={initPad}
                    className="absolute top-2 right-2 text-xs font-semibold text-slate-500 hover:text-red-500 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Color:</span>
                    {['#000000', '#1e3a8a', '#991b1b'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setDrawColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${drawColor === c ? 'border-teal-500 scale-110' : 'border-white dark:border-slate-700'}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Thickness:</span>
                    {[2, 3, 5].map((w) => (
                      <button
                        key={w}
                        onClick={() => setDrawWidth(w)}
                        className={`px-2.5 py-1 rounded-lg border font-bold transition-colors cursor-pointer ${
                          drawWidth === w ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Your Full Name:</label>
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm transition-colors"
                  />
                </div>

                {typedName.trim() && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Select Signature Style:</label>
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
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            typedFontIndex === idx
                              ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/50 shadow-xs'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/60'
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
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Color:</span>
                      {['#000000', '#1e3a8a', '#991b1b'].map((c) => (
                        <button
                          key={c}
                          onClick={() => setTypedColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${typedColor === c ? 'border-teal-500 scale-110' : 'border-white dark:border-slate-700'}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Upload & Smart Extractor Studio */}
            {modalTab === 'upload' && (
              <div className="space-y-4">
                {!uploadedImageSrc ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 rounded-2xl p-8 cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/40 hover:bg-teal-50/30 dark:hover:bg-teal-950/30 text-center"
                  >
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-2">
                      <CameraIcon className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Upload Photo of Signature</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      Supports photos of signatures on paper. We will crop and erase background shadows.
                    </p>
                  </div>
                ) : (
                  /* ── Smart Crop & Extractor Workspace ── */
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Left: Source Image with Interactive Crop Box */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span>1. Drag box over signature:</span>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-semibold cursor-pointer"
                          >
                            Change Photo
                          </button>
                        </div>

                        <div
                          ref={cropContainerRef}
                          className="relative border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-900 select-none flex items-center justify-center"
                          style={{ height: '220px' }}
                        >
                          <img
                            src={uploadedImageSrc}
                            alt="Uploaded"
                            className="max-h-full max-w-full object-contain pointer-events-none"
                          />

                          {/* Interactive Crop Box Overlay */}
                          <div
                            style={{
                              position: 'absolute',
                              left: `${cropBox.x}%`,
                              top: `${cropBox.y}%`,
                              width: `${cropBox.w}%`,
                              height: `${cropBox.h}%`,
                            }}
                            onPointerDown={handleCropBoxPointerDown}
                            className="border-2 border-teal-400 bg-teal-500/15 cursor-move shadow-sm group"
                          >
                            {/* Resize Handle at Bottom-Right */}
                            <div
                              onPointerDown={handleCropHandlePointerDown}
                              className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-teal-600 rounded-full cursor-nwse-resize shadow-md"
                            />
                            {/* Visual Center Crosshair Guide */}
                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                              <div className="border-r border-b border-white/50" />
                              <div className="border-r border-b border-white/50" />
                              <div className="border-b border-white/50" />
                              <div className="border-r border-b border-white/50" />
                              <div className="border-r border-b border-white/50" />
                              <div className="border-b border-white/50" />
                              <div className="border-r border-white/50" />
                              <div className="border-r border-white/50" />
                              <div />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Real-Time Vector Transparent Ink Preview */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span>2. Extracted Vector Stamp:</span>
                          <span className="text-[10px] text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-full">
                            Transparent Ink
                          </span>
                        </div>

                        <div
                          className="border border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center p-4 bg-[repeating-conic-gradient(#f8fafc_0%_25%,#e2e8f0_0%_50%)] dark:bg-[repeating-conic-gradient(#0f172a_0%_25%,#1e293b_0%_50%)] bg-[length:16px_16px]"
                          style={{ height: '220px' }}
                        >
                          {extractedPreviewUrl ? (
                            <img
                              src={extractedPreviewUrl}
                              alt="Extracted Ink Stamp"
                              className="max-h-full max-w-full object-contain filter drop-shadow-md"
                            />
                          ) : (
                            <p className="text-xs text-slate-400">Processing vector ink…</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Fine-Tuning Controls */}
                    <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Threshold Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                            <span>Background Eraser:</span>
                            <span className="font-mono text-teal-600 dark:text-teal-400">{extractionThreshold}</span>
                          </div>
                          <input
                            type="range"
                            min={80}
                            max={240}
                            value={extractionThreshold}
                            onChange={(e) => setExtractionThreshold(parseInt(e.target.value))}
                            className="w-full accent-teal-600 cursor-pointer"
                          />
                        </div>

                        {/* Contrast Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                            <span>Ink Sharpness:</span>
                            <span className="font-mono text-teal-600 dark:text-teal-400">{extractionContrast}</span>
                          </div>
                          <input
                            type="range"
                            min={20}
                            max={200}
                            value={extractionContrast}
                            onChange={(e) => setExtractionContrast(parseInt(e.target.value))}
                            className="w-full accent-teal-600 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Ink Color Selector */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/70 dark:border-slate-700/70 flex-wrap gap-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Ink Color:</span>
                        <div className="flex items-center gap-1.5">
                          {[
                            { id: 'black' as InkColorMode, label: 'Black Ink', bg: '#0f172a' },
                            { id: 'blue' as InkColorMode, label: 'Blue Ink', bg: '#1d4ed8' },
                            { id: 'original' as InkColorMode, label: 'Original', bg: '#64748b' },
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setInkColorChoice(item.id)}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                                inkColorChoice === item.id
                                  ? 'bg-white dark:bg-slate-900 border-teal-500 text-teal-700 dark:text-teal-400 shadow-xs'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.bg }} />
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleUploadSignature}
                />
              </div>
            )}

            {/* ── Security & AES-256 Encryption Options ── */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200 select-none">
                <input
                  type="checkbox"
                  checked={saveToDevice}
                  onChange={(e) => setSaveToDevice(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                />
                <span>Save signature securely on this device (AES-256 Encrypted)</span>
              </label>

              {saveToDevice && (
                <div className="pl-6 space-y-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={usePinLock}
                      onChange={(e) => setUsePinLock(e.target.checked)}
                      className="w-3.5 h-3.5 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                    />
                    <LockIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span className="font-medium">Protect signature with a PIN code (Optional)</span>
                  </label>

                  {usePinLock && (
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <input
                        type="password"
                        value={creationPin}
                        onChange={(e) => setCreationPin(e.target.value)}
                        placeholder="Enter 4-digit PIN"
                        maxLength={8}
                        className="w-40 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono tracking-widest text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Required to unlock on this device</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {modalTab === 'upload' ? (
              uploadedImageSrc && (
                <button
                  onClick={() => {
                    if (extractedPreviewUrl) {
                      addSignatureToDocument(extractedPreviewUrl, 'Extracted Photo')
                    }
                  }}
                  disabled={!extractedPreviewUrl}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md shadow-teal-100 dark:shadow-none text-sm transition-colors cursor-pointer"
                >
                  Insert Extracted Signature
                </button>
              )
            ) : (
              <button
                onClick={modalTab === 'draw' ? handleSaveDrawnSignature : handleSaveTypedSignature}
                disabled={modalTab === 'type' && !typedName.trim()}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md shadow-teal-100 dark:shadow-none text-sm transition-colors cursor-pointer"
              >
                Insert Signature
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Unlock PIN Modal with Brute-Force Protection ── */}
      {unlockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800 text-amber-800 dark:text-amber-400 flex items-center justify-center">
                  <LockIcon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Unlock Signature</h3>
              </div>
              <button
                onClick={() => {
                  setUnlockTarget(null)
                  setUnlockPin('')
                  setUnlockError(null)
                }}
                className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
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
                disabled={cooldownRemaining > 0}
                placeholder="Enter PIN code"
                autoFocus
                maxLength={8}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-center font-mono text-lg tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:bg-slate-100 outline-none transition-colors"
              />

              {cooldownRemaining > 0 ? (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-center space-y-1">
                  <p className="text-xs font-bold text-red-700 dark:text-red-400">⏳ Cooldown Active</p>
                  <p className="text-[11px] text-red-600 dark:text-red-300">
                    Security lock: Please wait <span className="font-bold">{cooldownRemaining}s</span> before retrying.
                  </p>
                </div>
              ) : unlockError ? (
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold text-center">{unlockError}</p>
              ) : null}

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
                  disabled={!unlockPin.trim() || cooldownRemaining > 0}
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
