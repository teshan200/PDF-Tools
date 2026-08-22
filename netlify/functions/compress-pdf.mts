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
    const body = await req.json() as { files: FilePayload[]; compression_level?: string }
    const { files, compression_level = 'recommended' } = body

    if (!files?.length) return Response.json({ error: 'Please provide a PDF file to compress.' }, { status: 400 })
    if (!['low', 'recommended', 'extreme'].includes(compression_level)) {
      return Response.json({ error: 'Invalid compression level.' }, { status: 400 })
    }

    const publicKey = getEnv('ILOVEPDF_PUBLIC_KEY')
    const secretKey = getEnv('ILOVEPDF_SECRET_KEY')
    if (!publicKey || !secretKey) return Response.json({ error: 'API keys not configured.' }, { status: 500 })

    const file = files[0]
    const fileBuffer = Buffer.from(file.data, 'base64')
    const pdfFile = ILovePDFFile.fromArray(fileBuffer, file.name)

    const ilovepdf = new ILovePDFApi(publicKey, secretKey)
    const task = ilovepdf.newTask('compress')
    await task.start()
    await task.addFile(pdfFile)
    await task.process({ compression_level })
    const data: Buffer = await task.download()

    return new Response(data, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="compressed-${file.name}"`,
      },
    })
  } catch (err: any) {
    const message = err?.response?.data?.error?.message || err?.message || 'Compression failed.'
    console.error('[compress-pdf]', message, err?.response?.data || '')
    return Response.json({ error: message }, { status: 500 })
  }
}

export const config: Config = { path: '/api/compress-pdf', method: ['POST'] }
