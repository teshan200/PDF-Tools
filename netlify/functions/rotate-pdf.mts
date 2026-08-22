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
    const body = await req.json() as { files: FilePayload[]; angle?: string; page_mode?: string }
    const { files, angle = '90', page_mode = 'all' } = body

    if (!files?.length) return Response.json({ error: 'Please provide a PDF file to rotate.' }, { status: 400 })
    const angleNum = parseInt(angle, 10)
    if (![90, 180, 270].includes(angleNum)) {
      return Response.json({ error: 'Angle must be 90, 180, or 270.' }, { status: 400 })
    }

    const publicKey = getEnv('ILOVEPDF_PUBLIC_KEY')
    const secretKey = getEnv('ILOVEPDF_SECRET_KEY')
    if (!publicKey || !secretKey) return Response.json({ error: 'API keys not configured.' }, { status: 500 })

    const file = files[0]
    const fileBuffer = Buffer.from(file.data, 'base64')
    const pdfFile = ILovePDFFile.fromArray(fileBuffer, file.name)

    const ilovepdf = new ILovePDFApi(publicKey, secretKey)
    const task = ilovepdf.newTask('rotate')
    await task.start()
    await task.addFile(pdfFile)

    const params: Record<string, unknown> = { rotate: angleNum }
    if (page_mode === 'even') params.pages = 'even'
    else if (page_mode === 'odd') params.pages = 'odd'

    await task.process(params)
    const data: Buffer = await task.download()

    const baseName = file.name.replace(/\.pdf$/i, '')
    return new Response(data, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${baseName}-rotated.pdf"`,
      },
    })
  } catch (err: any) {
    const message = err?.response?.data?.error?.message || err?.message || 'Rotation failed.'
    console.error('[rotate-pdf]', message, err?.response?.data || '')
    return Response.json({ error: message }, { status: 500 })
  }
}

export const config: Config = { path: '/api/rotate-pdf', method: ['POST'] }
