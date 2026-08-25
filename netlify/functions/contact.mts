import type { Context } from '@netlify/functions'

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    let name = ''
    let email = ''
    let message = ''

    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const data = await req.json()
      name = data.name
      email = data.email
      message = data.message
    } else {
      const text = await req.text()
      const params = new URLSearchParams(text)
      name = params.get('name') || ''
      email = params.get('email') || ''
      message = params.get('message') || ''
    }

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Please fill in all required fields (name, email, message).' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`[Contact Form Received] Name: ${name} | Email: ${email} | Message: ${message}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Your message has been received successfully. We will get back to you shortly.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('Contact function error:', err)
    return new Response(
      JSON.stringify({ error: 'Failed to process message. Please try again.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
