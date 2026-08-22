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
    const body = await req.json() as { files: FilePayload[] }
    const { files } = body

    if (!files?.length) return Response.json({ error: 'Please provide a PDF file to convert.' }, { status: 400 })

    const publicKey = getEnv('ILOVEPDF_PUBLIC_KEY')
    const secretKey = getEnv('ILOVEPDF_SECRET_KEY')
    if (!publicKey || !secretKey) return Response.json({ error: 'API keys not configured.' }, { status: 500 })

    const file = files[0]
    const fileBuffer = Buffer.from(file.data, 'base64')
    const pdfFile = ILovePDFFile.fromArray(fileBuffer, file.name)

    const ilovepdf = new ILovePDFApi(publicKey, secretKey)
    const task = ilovepdf.newTask('officepdf')
    await task.start()
    await task.addFile(pdfFile)
    await task.process({ output_format: 'docx' })
    const data: Buffer = await task.download()

    const baseName = file.name.replace(/\.pdf$/i, '')
    const isZip = data[0] === 0x50 && data[1] === 0x4b

    return new Response(data, {
      headers: {
        'Content-Type': isZip
          ? 'application/zip'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${baseName}${isZip ? '.zip' : '.docx'}"`,
      },
    })
  } catch (err: any) {
    const message = err?.response?.data?.error?.message || err?.message || 'Conversion failed.'
    console.error('[pdf-to-word]', message, err?.response?.data || '')
    return Response.json({ error: message }, { status: 500 })
  }
}

export const config: Config = { path: '/api/pdf-to-word', method: ['POST'] }
