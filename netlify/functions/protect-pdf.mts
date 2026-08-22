import type { Config } from '@netlify/functions'
import { getEnv } from './_getEnv.mjs'

// @ts-ignore
import ILovePDFApi from '@ilovepdf/ilovepdf-nodejs'
// @ts-ignore
import ILovePDFFile from '@ilovepdf/ilovepdf-nodejs/ILovePDFFile.js'

interface FilePayload { name: string; data: string; type: string }

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  try {
    const body = await req.json() as { files: FilePayload[]; password?: string; encryption_key?: string }
    const { files, password = '', encryption_key = '128' } = body

    if (!files?.length) return Response.json({ error: 'Please provide a PDF file to protect.' }, { status: 400 })
    if (!password.trim()) return Response.json({ error: 'A password is required.' }, { status: 400 })
    if (!['128', '256'].includes(encryption_key)) {
      return Response.json({ error: 'Invalid encryption key size.' }, { status: 400 })
    }

    const publicKey = getEnv('ILOVEPDF_PUBLIC_KEY')
    const secretKey = getEnv('ILOVEPDF_SECRET_KEY')
    if (!publicKey || !secretKey) return Response.json({ error: 'API keys not configured.' }, { status: 500 })

    const file = files[0]
    const fileBuffer = Buffer.from(file.data, 'base64')
    const pdfFile = ILovePDFFile.fromArray(fileBuffer, file.name)

    const ilovepdf = new ILovePDFApi(publicKey, secretKey)
    const task = ilovepdf.newTask('protect')
    await task.start()
    await task.addFile(pdfFile)
    await task.process({ password: password.trim(), encryption_key })
    const data: Buffer = await task.download()

    const baseName = file.name.replace(/\.pdf$/i, '')
    return new Response(data, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${baseName}-protected.pdf"`,
      },
    })
  } catch (err: any) {
    const message = err?.response?.data?.error?.message || err?.message || 'Protection failed.'
    console.error('[protect-pdf]', message, err?.response?.data || '')
    return Response.json({ error: message }, { status: 500 })
  }
}

export const config: Config = { path: '/api/protect-pdf', method: ['POST'] }
