/**
 * Client-Side AES-GCM 256-bit Encryption & Decryption Utility
 * Uses native Web Crypto API (window.crypto.subtle)
 * Zero external dependencies. 100% private and in-browser.
 */

export interface EncryptedPayload {
  ciphertext: string // Base64
  iv: string // Base64 (12 bytes)
  salt?: string // Base64 (16 bytes, if PIN protected)
  hasPin: boolean
}

// Convert BufferSource to Base64 string
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

// Convert Base64 string to Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// Derive a 256-bit AES-GCM key from a user PIN using PBKDF2 (100,000 iterations)
async function deriveKeyFromPin(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Get or create a device-local fallback key seed (for encryption without PIN)
function getDeviceSeed(): Uint8Array {
  const storageKey = '__easypdf_dev_key_seed__'
  let seedStr = localStorage.getItem(storageKey)
  if (!seedStr) {
    const randomBytes = window.crypto.getRandomValues(new Uint8Array(32))
    seedStr = bufferToBase64(randomBytes)
    localStorage.setItem(storageKey, seedStr)
  }
  return base64ToBuffer(seedStr)
}

// Encrypt plaintext string (e.g. dataURL) using AES-GCM 256
export async function encryptData(
  plainText: string,
  pin?: string
): Promise<EncryptedPayload> {
  const enc = new TextEncoder()
  const data = enc.encode(plainText)
  const iv = window.crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for AES-GCM

  let cryptoKey: CryptoKey
  let saltBase64: string | undefined

  if (pin && pin.trim().length > 0) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16))
    saltBase64 = bufferToBase64(salt)
    cryptoKey = await deriveKeyFromPin(pin.trim(), salt)
  } else {
    const seed = getDeviceSeed()
    cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      seed as any,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    )
  }

  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    cryptoKey,
    data
  )

  return {
    ciphertext: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv),
    salt: saltBase64,
    hasPin: !!(pin && pin.trim().length > 0),
  }
}

// Decrypt AES-GCM 256 ciphertext back to plaintext
export async function decryptData(
  payload: EncryptedPayload,
  pin?: string
): Promise<string> {
  const iv = base64ToBuffer(payload.iv)
  const ciphertext = base64ToBuffer(payload.ciphertext)

  let cryptoKey: CryptoKey

  if (payload.hasPin) {
    if (!pin || !pin.trim()) {
      throw new Error('PIN is required to unlock this encrypted signature.')
    }
    if (!payload.salt) {
      throw new Error('Invalid signature payload (missing salt).')
    }
    const salt = base64ToBuffer(payload.salt)
    cryptoKey = await deriveKeyFromPin(pin.trim(), salt)
  } else {
    const seed = getDeviceSeed()
    cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      seed as any,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    )
  }

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as any },
      cryptoKey,
      ciphertext as any
    )
    const dec = new TextDecoder()
    return dec.decode(decryptedBuffer)
  } catch {
    throw new Error('Incorrect PIN or corrupted signature data.')
  }
}

// Compute hex SHA-256 hash of ArrayBuffer (for document fingerprinting)
export async function sha256Hash(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Generate a cryptographically strong audit ID
export function generateAuditId(): string {
  const rand = window.crypto.getRandomValues(new Uint8Array(4))
  const hex = Array.from(rand).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
  const year = new Date().getFullYear()
  return `SIG-${year}-${hex}`
}

