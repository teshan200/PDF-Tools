import { useState } from 'react'
import { useRouter } from '../router'

const NAV_ITEMS = [
  { path: '/merge', label: 'Merge PDF' },
  { path: '/split', label: 'Split PDF' },
  { path: '/compress', label: 'Compress' },
  { path: '/edit', label: 'Edit PDF' },
  { path: '/word', label: 'PDF to Word' },
  { path: '/jpg', label: 'PDF to JPG' },
  { path: '/rotate', label: 'Rotate PDF' },
  { path: '/protect', label: 'Protect PDF' },
  { path: '/unlock', label: 'Unlock PDF' },
]

function PdfLogo() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

function LinkedinIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2m1.4 9.74V9.93H5.06v8.57z" />
    </svg>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { path, navigate } = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Header ───────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => { navigate('/'); setMenuOpen(false) }}
              className="flex items-center gap-2.5 font-extrabold text-xl text-slate-900 hover:text-blue-700 transition-colors focus-visible:outline-none"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
                <PdfLogo />
              </div>
              PDF Tools
            </button>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={[
                    'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                    path === item.path
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-3 grid grid-cols-2 gap-1.5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMenuOpen(false) }}
                className={[
                  'px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all',
                  path === item.path
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100',
                ].join(' ')}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Main ─────────────────────────────────── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo & Copyright */}
            <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-xs">
                  <PdfLogo />
                </div>
                <span className="font-bold text-slate-800">PDF Tools</span>
              </div>
              <span className="hidden sm:inline text-slate-300">|</span>
              <p className="text-xs text-slate-500">
                Files are processed securely in real-time and never stored.
              </p>
            </div>

            {/* Developer Credits & Socials */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 text-xs text-slate-600">
              <span className="text-slate-700">
                Developed by <a href="https://teshan.click" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">Teshan Pamodya</a>
              </span>

              <div className="flex items-center gap-2">
                <a
                  href="https://teshan.click"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Website"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  <GlobeIcon />
                  <span>teshan.click</span>
                </a>
                <a
                  href="https://github.com/teshan200/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  <GithubIcon />
                  <span>GitHub</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/teshan-pamodya/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors"
                >
                  <LinkedinIcon />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
