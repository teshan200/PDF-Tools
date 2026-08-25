import { useEffect, useState } from 'react'

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    document.title = 'Contact Us — Easy PDF Tools | easypdftools.xyz'
    window.scrollTo(0, 0)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Open default mail client
    const mailto = `mailto:teshanpamodya@gmail.com?subject=Easy PDF Tools Inquiry from ${encodeURIComponent(name)}&body=${encodeURIComponent(message + '\n\nFrom: ' + name + ' (' + email + ')')}`
    window.location.href = mailto
    setSubmitted(true)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
        <div className="border-b border-slate-100 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-full text-xs font-bold mb-3">
            <span>✉️</span> Get in Touch
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Contact Us</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Have questions, feedback, bug reports, or feature requests? We'd love to hear from you.
          </p>
        </div>

        {submitted ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
            <span className="text-3xl">🎉</span>
            <h3 className="font-bold text-emerald-950 text-base">Thank you for your message!</h3>
            <p className="text-xs text-emerald-800">Your email client has opened. We typically respond within 24–48 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message / Inquiry</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help you?"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl text-sm transition-colors shadow-md shadow-teal-100"
            >
              Send Message
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-6 text-xs text-slate-600">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1">🌐 Developer Website</h4>
            <p>Visit Teshan Pamodya's portfolio:</p>
            <a href="https://teshan.click" target="_blank" rel="noopener noreferrer" className="text-teal-700 font-semibold hover:underline block mt-1">
              https://teshan.click ↗
            </a>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1">⭐ GitHub Repository</h4>
            <p>Report issues or contribute on GitHub:</p>
            <a href="https://github.com/teshan200/PDF-Tools" target="_blank" rel="noopener noreferrer" className="text-teal-700 font-semibold hover:underline block mt-1">
              github.com/teshan200/PDF-Tools ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
