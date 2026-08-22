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

    if (!files || files.length < 2) {
      return Response.json({ error: 'Please provide at least 2 PDF files to merge.' }, { status: 400 })
    }

    const publicKey = getEnv('ILOVEPDF_PUBLIC_KEY')
    const secretKey = getEnv('ILOVEPDF_SECRET_KEY')
    if (!publicKey || !secretKey) return Response.json({ error: 'API keys not configured.' }, { status: 500 })

    const ilovepdf = new ILovePDFApi(publicKey, secretKey)
    const task = ilovepdf.newTask('merge')
    await task.start()

    for (const file of files) {
      const fileBuffer = Buffer.from(file.data, 'base64')
      const pdfFile = ILovePDFFile.fromArray(fileBuffer, file.name)
      await task.addFile(pdfFile)
    }

    await task.process({})
    const data: Buffer = await task.download()

    return new Response(data, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="merged.pdf"',
      },
    })
  } catch (err: any) {
    const message = err?.response?.data?.error?.message || err?.message || 'Merge failed.'
    console.error('[merge-pdf]', message, err?.response?.data || '')
    return Response.json({ error: message }, { status: 500 })
  }
}

export const config: Config = { path: '/api/merge-pdf', method: ['POST'] }
