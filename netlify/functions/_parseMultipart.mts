import Busboy from 'busboy'
import { IncomingMessage } from 'http'

export interface ParsedFile {
  fieldname: string
  filename: string
  buffer: Buffer
  mimetype: string
}

export interface ParsedForm {
  files: ParsedFile[]
  fields: Record<string, string>
}

/**
 * Parses a multipart/form-data Request using busboy.
 * Works in both Netlify local emulation and production.
 */
export async function parseMultipart(req: Request): Promise<ParsedForm> {
  const contentType = req.headers.get('content-type') ?? ''

  // Collect raw body bytes
  const arrayBuffer = await req.arrayBuffer()
  const bodyBuffer = Buffer.from(arrayBuffer)

  return new Promise((resolve, reject) => {
    const files: ParsedFile[] = []
    const fields: Record<string, string> = {}

    let bb: ReturnType<typeof Busboy>
    try {
      bb = Busboy({ headers: { 'content-type': contentType } })
    } catch (e) {
      return reject(new Error(`Failed to create busboy parser: ${e}`))
    }

    bb.on('file', (fieldname, stream, info) => {
      const { filename, mimeType } = info
      const chunks: Buffer[] = []
      stream.on('data', (chunk: Buffer) => chunks.push(chunk))
      stream.on('end', () => {
        files.push({
          fieldname,
          filename,
          buffer: Buffer.concat(chunks),
          mimetype: mimeType,
        })
      })
    })

    bb.on('field', (name, value) => {
      fields[name] = value
    })

    bb.on('finish', () => resolve({ files, fields }))
    bb.on('error', reject)

    // Feed the raw body to busboy
    bb.write(bodyBuffer)
    bb.end()
  })
}
