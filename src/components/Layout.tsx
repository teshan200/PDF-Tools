import { useState, useRef, useEffect } from 'react'
import { useRouter } from '../router'
import { useTheme } from '../context/ThemeContext'
import { SunIcon, MoonIcon } from './Icons'

interface ToolItem {
  path: string
  label: string
  desc: string
}

const TOOL_CATEGORIES = [
  {
    category: 'Edit & Sign',
    items: [
      { path: '/edit', label: 'Edit PDF', desc: 'Edit text, whiteout & draw' },
      { path: '/sign', label: 'Sign PDF', desc: 'Sign with digital signatures' },
    ],
  },
  {
    category: 'Organize',
    items: [
      { path: '/merge', label: 'Merge PDF', desc: 'Combine multiple PDFs into one' },
      { path: '/split', label: 'Split PDF', desc: 'Extract or separate pages' },
      { path: '/rotate', label: 'Rotate PDF', desc: 'Rotate pages by 90° or 180°' },
    ],
  },
  {
    category: 'Convert & Optimize',
    items: [
      { path: '/compress', label: 'Compress PDF', desc: 'Reduce file size efficiently' },
      { path: '/word', label: 'PDF to Word', desc: 'Convert PDF to editable DOCX' },
      { path: '/jpg', label: 'PDF to JPG', desc: 'Extract pages as high-res JPGs' },
    ],
  },
  {
    category: 'Security',
    items: [
      { path: '/protect', label: 'Protect PDF', desc: 'Add password encryption' },
      { path: '/unlock', label: 'Unlock PDF', desc: 'Remove password protection' },
    ],
  },
]

const QUICK_NAV = [
  { path: '/edit', label: 'Edit PDF' },
  { path: '/sign', label: 'Sign PDF' },
  { path: '/merge', label: 'Merge PDF' },
  { path: '/compress', label: 'Compress' },
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
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* ── Modern Navigation Header ───────────────────────────────── */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => { navigate('/'); setMenuOpen(false) }}
              className="flex items-center gap-2.5 font-extrabold text-xl text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus-visible:outline-none shrink-0 cursor-pointer"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-xs">
                <PdfLogo />
              </div>
              <span className="tracking-tight">PDF Tools</span>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {QUICK_NAV.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={[
                    'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                    path === item.path
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              ))}

              {/* All Tools Mega Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className={[
                    'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer',
                    dropdownOpen
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
                  ].join(' ')}
                >
                  <span>All Tools</span>
                  <svg className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu Popup */}
                {dropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-[520px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl grid grid-cols-2 gap-4 z-50 animate-fadeIn">
                    {TOOL_CATEGORIES.map((cat) => (
                      <div key={cat.category} className="space-y-1.5">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">
                          {cat.category}
                        </h4>
                        <div className="space-y-0.5">
                          {cat.items.map((tool) => (
                            <button
                              key={tool.path}
                              onClick={() => {
                                navigate(tool.path)
                                setDropdownOpen(false)
                              }}
                              className={[
                                'w-full text-left px-2 py-1.5 rounded-xl transition-all block cursor-pointer',
                                path === tool.path
                                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200',
                              ].join(' ')}
                            >
                              <p className="text-xs font-bold">{tool.label}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">{tool.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* Right Action Controls: Theme Toggle & GitHub & Mobile Menu */}
            <div className="flex items-center gap-2">
              {/* Dark / Light Theme Toggle */}
              <button
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              >
                {theme === 'dark' ? <SunIcon className="w-4 h-4 text-amber-400" /> : <MoonIcon className="w-4 h-4 text-slate-600" />}
              </button>

              {/* Open Source GitHub Badge */}
              <a
                href="https://github.com/teshan200/PDF-Tools"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
                title="100% Free & Open Source on GitHub"
              >
                <GithubIcon />
                <span>Open Source</span>
              </a>

              {/* Mobile menu toggle button */}
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Toggle menu"
                className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
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
        </div>

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {TOOL_CATEGORIES.flatMap((c) => c.items).map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMenuOpen(false) }}
                  className={[
                    'p-2.5 rounded-xl text-left transition-all block',
                    path === item.path
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                  ].join(' ')}
                >
                  <p className="text-xs font-semibold">{item.label}</p>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <a
                href="https://github.com/teshan200/PDF-Tools"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:underline"
              >
                <GithubIcon />
                <span>GitHub Repository ↗</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="flex-1">{children}</main>

      {/* ── Professional 4-Column Footer ───────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-16 text-xs text-slate-600 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-100 dark:border-slate-800">
            {/* Column 1: Brand & Open Source */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-xs">
                  <PdfLogo />
                </div>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">Easy PDF Tools</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                Free, fast, and 100% private in-browser PDF editor, signer, and converter with zero server file storage.
              </p>
              <div className="pt-1">
                <a
                  href="https://github.com/teshan200/PDF-Tools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-[11px] transition-colors"
                >
                  <GithubIcon />
                  <span>Public GitHub Repository</span>
                </a>
              </div>
            </div>

            {/* Column 2: Popular Tools */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">PDF Tools</h4>
              <ul className="space-y-1.5 text-slate-500 dark:text-slate-400">
                <li><button onClick={() => navigate('/edit')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">Edit PDF</button></li>
                <li><button onClick={() => navigate('/sign')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">Sign PDF</button></li>
                <li><button onClick={() => navigate('/merge')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">Merge PDF</button></li>
                <li><button onClick={() => navigate('/split')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">Split PDF</button></li>
                <li><button onClick={() => navigate('/compress')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">Compress PDF</button></li>
              </ul>
            </div>

            {/* Column 3: More Tools */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Convert &amp; Security</h4>
              <ul className="space-y-1.5 text-slate-500 dark:text-slate-400">
                <li><button onClick={() => navigate('/word')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">PDF to Word</button></li>
                <li><button onClick={() => navigate('/jpg')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">PDF to JPG</button></li>
                <li><button onClick={() => navigate('/rotate')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">Rotate PDF</button></li>
                <li><button onClick={() => navigate('/protect')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">Protect PDF</button></li>
                <li><button onClick={() => navigate('/unlock')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">Unlock PDF</button></li>
              </ul>
            </div>

            {/* Column 4: Legal & Company (Google AdSense Requirements) */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Company &amp; Legal</h4>
              <ul className="space-y-1.5 text-slate-500 dark:text-slate-400">
                <li><button onClick={() => navigate('/about')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">About Us</button></li>
                <li><button onClick={() => navigate('/privacy')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">Privacy Policy</button></li>
                <li><button onClick={() => navigate('/terms')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">Terms of Service</button></li>
                <li><button onClick={() => navigate('/contact')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">Contact Us</button></li>
              </ul>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 dark:text-slate-500 text-[11px]">
              &copy; {new Date().getFullYear()} Easy PDF Tools (easypdftools.xyz) • Developed by{' '}
              <a href="https://teshan.click" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-700 dark:text-slate-300 hover:underline">
                Teshan Pamodya
              </a>
            </p>

            <div className="flex items-center gap-2">
              <a
                href="https://teshan.click"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Website"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors text-[11px]"
              >
                <GlobeIcon />
                <span>teshan.click</span>
              </a>
              <a
                href="https://github.com/teshan200/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors text-[11px]"
              >
                <GithubIcon />
                <span>GitHub</span>
              </a>
              <a
                href="https://www.linkedin.com/in/teshan-pamodya/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium transition-colors text-[11px]"
              >
                <LinkedinIcon />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
