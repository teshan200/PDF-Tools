import type { Config } from '@netlify/functions'
import { getEnv } from './_getEnv.mjs'

// @ts-ignore
import ILovePDFApi from '@ilovepdf/ilovepdf-nodejs'
// @ts-ignore
import ILovePDFFile from '@ilovepdf/ilovepdf-nodejs/ILovePDFFile.js'

function cjsDefault(mod: any) {
  return mod?.default ?? mod
}

interface FilePayload { name: string; data: string; type: string }

interface TextElementPayload {
  text: string
  page: string
  x: number
  y: number
  w: number
  h: number
  fontSize: number
  fontFamily: string
  fontStyle: string   // 'normal' | 'Bold' | 'Italic'
  opacity: number     // 1–100
  underline: boolean
}

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  try {
    const body = await req.json() as { files: FilePayload[]; elements: TextElementPayload[] }
    const { files, elements } = body

    if (!files?.length) return Response.json({ error: 'Please provide a PDF file to edit.' }, { status: 400 })
    if (!elements?.length) return Response.json({ error: 'Please add at least one text element.' }, { status: 400 })

    const publicKey = getEnv('ILOVEPDF_PUBLIC_KEY')
    const secretKey = getEnv('ILOVEPDF_SECRET_KEY')
    if (!publicKey || !secretKey) return Response.json({ error: 'API keys not configured.' }, { status: 500 })

    const TextClass = cjsDefault(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@ilovepdf/ilovepdf-js-core/tasks/edit/Text')
    )

    const file = files[0]
    const fileBuffer = Buffer.from(file.data, 'base64')
    const pdfFile = ILovePDFFile.fromArray(fileBuffer, file.name)

    const ilovepdf = new ILovePDFApi(publicKey, secretKey)
    const task = ilovepdf.newTask('editpdf')
    await task.start()
    await task.addFile(pdfFile)

    for (const el of elements) {
      // Build params — only include optional fields that the API actually accepts
      const params: Record<string, unknown> = {
        coordinates: { x: el.x, y: el.y },
        dimensions:  { w: el.w, h: el.h },
        pages:       el.page,
        text:        el.text,
        font_size:   el.fontSize,
        font_family: el.fontFamily,
        opacity:     el.opacity,
        // font_color is not reliably accepted — skip it
        // underline_text must be 0/1, not boolean
        underline_text: el.underline ? 1 : 0,
      }

      // Only add font_style when not 'normal' (the API rejects 'null' string)
      if (el.fontStyle === 'Bold' || el.fontStyle === 'Italic') {
        params.font_style = el.fontStyle
      }

      const textEl = new TextClass(params)
      task.addElement(textEl)
    }

    await task.process()
    const data: Buffer = await task.download()

    const baseName = file.name.replace(/\.pdf$/i, '')
    return new Response(data, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${baseName}-edited.pdf"`,
      },
    })
  } catch (err: any) {
    const message = err?.response?.data?.error?.message || err?.message || 'Edit failed.'
    console.error('[edit-pdf]', message, err?.response?.data || '')
    return Response.json({ error: message }, { status: 500 })
  }
}

export const config: Config = { path: '/api/edit-pdf', method: ['POST'] }
