import fs from 'fs'
import path from 'path'
import { deflateSync } from 'fflate'

// Simple Pure-JS PNG Encoder (Creates valid, uncompressed/deflated PNGs)
function createPNG(width, height, rgbaBuffer) {
  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData.writeUInt8(8, 8) // Bit depth: 8
  ihdrData.writeUInt8(6, 9) // Color type: RGBA (6)
  ihdrData.writeUInt8(0, 10) // Compression: Deflate
  ihdrData.writeUInt8(0, 11) // Filter: Default
  ihdrData.writeUInt8(0, 12) // Interlace: None
  const ihdrChunk = makeChunk('IHDR', ihdrData)

  // Scanlines with filter byte 0 (None)
  const scanlines = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    const scanlineOffset = y * (1 + width * 4)
    scanlines[scanlineOffset] = 0 // Filter type 0
    rgbaBuffer.copy(
      scanlines,
      scanlineOffset + 1,
      y * width * 4,
      (y + 1) * width * 4
    )
  }

  // Deflate IDAT
  const compressed = Buffer.from(deflateSync(new Uint8Array(scanlines)))
  const idatChunk = makeChunk('IDAT', compressed)

  // IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

// CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  crcTable[i] = c
}

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function makeChunk(type, data) {
  const len = data.length
  const chunk = Buffer.alloc(4 + 4 + len + 4)
  chunk.writeUInt32BE(len, 0)
  chunk.write(type, 4, 4, 'ascii')
  data.copy(chunk, 8)
  const crcTarget = Buffer.concat([Buffer.from(type, 'ascii'), data])
  chunk.writeUInt32BE(crc32(crcTarget), 8 + len)
  return chunk
}

// Draw a beautiful 1200x630 OpenGraph Banner
function generateOGImage() {
  const width = 1200
  const height = 630
  const buf = Buffer.alloc(width * height * 4)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4

      // Deep modern navy/slate gradient
      const t = (x / width + y / height) / 2
      let r = Math.round(11 + t * 10)
      let g = Math.round(15 + t * 20)
      let b = Math.round(25 + t * 35)

      // Radial glow in top center / right
      const dx = x - 600
      const dy = y - 200
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 450) {
        const glow = (1 - dist / 450) * 0.35
        r = Math.min(255, Math.round(r + 37 * glow))
        g = Math.min(255, Math.round(g + 99 * glow))
        b = Math.min(255, Math.round(b + 235 * glow))
      }

      // Rounded container card in middle
      const cardX1 = 120
      const cardX2 = 1080
      const cardY1 = 80
      const cardY2 = 550
      if (x >= cardX1 && x <= cardX2 && y >= cardY1 && y <= cardY2) {
        // Border glow
        const isBorder = (x === cardX1 || x === cardX2 || y === cardY1 || y === cardY2)
        if (isBorder) {
          r = 59; g = 130; b = 246 // Blue-500
        } else {
          // Card interior
          r = Math.round(r * 0.7 + 15 * 0.3)
          g = Math.round(g * 0.7 + 23 * 0.3)
          b = Math.round(b * 0.7 + 42 * 0.3)
        }
      }

      buf[idx] = r
      buf[idx + 1] = g
      buf[idx + 2] = b
      buf[idx + 3] = 255 // Alpha
    }
  }

  return createPNG(width, height, buf)
}

// Generate Apple Touch Icon (192x192)
function generateAppIcon() {
  const size = 192
  const buf = Buffer.alloc(size * size * 4)
  const radius = 38

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4

      // Rounded rect check
      let inside = true
      const cx = x < radius ? radius : x > size - radius ? size - radius : x
      const cy = y < radius ? radius : y > size - radius ? size - radius : y
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      if (d > radius) inside = false

      if (inside) {
        // Sleek gradient background (Slate-900 to Blue-600)
        const t = (x + y) / (size * 2)
        buf[idx] = Math.round(15 + t * 25)     // R
        buf[idx + 1] = Math.round(23 + t * 75) // G
        buf[idx + 2] = Math.round(42 + t * 190)// B
        buf[idx + 3] = 255
      } else {
        buf[idx + 3] = 0 // Transparent
      }
    }
  }

  return createPNG(size, size, buf)
}

const outDir = path.resolve('public')
fs.writeFileSync(path.join(outDir, 'og-image.png'), generateOGImage())
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), generateAppIcon())
fs.writeFileSync(path.join(outDir, 'favicon-32x32.png'), generateAppIcon())
console.log('Successfully generated og-image.png and app icons in public/')
