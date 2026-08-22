import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

/**
 * Walk up from the current file's directory until we find a .env file.
 * Works whether the function runs from the project root or from inside
 * .netlify/functions-serve/<hash>/<name>/netlify/functions/
 */
function findAndLoadDotEnv(): void {
  try {
    const startDir = dirname(fileURLToPath(import.meta.url))
    let dir = startDir
    for (let i = 0; i < 12; i++) {
      const candidate = join(dir, '.env')
      if (existsSync(candidate)) {
        const content = readFileSync(candidate, 'utf-8')
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith('#')) continue
          const eqIdx = trimmed.indexOf('=')
          if (eqIdx === -1) continue
          const key = trimmed.slice(0, eqIdx).trim()
          const raw = trimmed.slice(eqIdx + 1).trim()
          // Strip surrounding quotes if present
          const value = raw.replace(/^["']|["']$/g, '')
          if (key && value && !process.env[key]) {
            process.env[key] = value
          }
        }
        return
      }
      const parent = dirname(dir)
      if (parent === dir) break // filesystem root
      dir = parent
    }
  } catch { /* silently ignore — production doesn't have .env */ }
}

findAndLoadDotEnv()

/** Get an env var — tries Netlify.env.get() first (production), then process.env (local dev) */
export function getEnv(key: string): string | undefined {
  try {
    // Netlify.env is a global in production Netlify Functions runtime
    const netlifyVal = (globalThis as any).Netlify?.env?.get?.(key)
    if (netlifyVal) return netlifyVal
  } catch { /* not in Netlify runtime */ }
  return process.env[key]
}
