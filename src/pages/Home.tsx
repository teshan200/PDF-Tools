import { useEffect, useState, useMemo } from 'react'
import ToolCard from '../components/ToolCard'
import { useRouter } from '../router'

const TOOLS = [
  {
    path: '/edit',
    label: 'Edit PDF',
    description: 'Edit existing text in-place, whiteout unwanted content, insert images, and draw annotations.',
    category: 'edit',
    isClientSide: true,
    tags: ['text', 'draw', 'whiteout', 'modify', 'write', 'change text'],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    path: '/sign',
    label: 'Sign PDF',
    description: 'Draw, type, or extract transparent signatures from photos. AES-256 encrypted local storage & PIN lock.',
    category: 'edit',
    isClientSide: true,
    tags: ['signature', 'stamp', 'sign', 'draw', 'pin', 'contract', 'e-sign'],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    path: '/merge',
    label: 'Merge PDF',
    description: 'Combine multiple PDF documents into a single file with custom drag-and-drop page reordering.',
    category: 'organize',
    isClientSide: true,
    tags: ['combine', 'join', 'merge', 'append', 'collate'],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    path: '/split',
    label: 'Split PDF',
    description: 'Extract custom page ranges, split by intervals (every N pages), or export individual pages in a ZIP archive.',
    category: 'organize',
    isClientSide: true,
    tags: ['separate', 'extract', 'split', 'cut', 'pages'],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    path: '/rotate',
    label: 'Rotate PDF',
    description: 'Rotate all or selected pages (even/odd) by 90°, 180°, or 270° with instant in-browser saving.',
    category: 'organize',
    isClientSide: true,
    tags: ['turn', 'flip', 'rotate', 'orientation', 'upside down'],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    path: '/jpg',
    label: 'PDF to JPG',
    description: 'Render PDF pages into high-resolution JPG images with adjustable DPI, packaged into a ZIP archive.',
    category: 'convert',
    isClientSide: true,
    tags: ['image', 'jpeg', 'jpg', 'photo', 'picture', 'export'],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    path: '/compress',
    label: 'Compress PDF',
    description: 'Reduce PDF file size efficiently with Low, Recommended, or Extreme compression profiles.',
    category: 'convert',
    isClientSide: false,
    tags: ['shrink', 'reduce size', 'optimize', 'compress', 'smaller file'],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    ),
  },
  {
    path: '/word',
    label: 'PDF to Word',
    description: 'Convert PDF documents into editable Microsoft Word (.docx) documents with layout preservation.',
    category: 'convert',
    isClientSide: false,
    tags: ['docx', 'doc', 'word', 'convert', 'editable'],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    path: '/protect',
    label: 'Protect PDF',
    description: 'Encrypt and lock confidential PDF files with 128-bit or 256-bit AES password security.',
    category: 'security',
    isClientSide: false,
    tags: ['lock', 'password', 'encrypt', 'security', 'protect'],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    path: '/unlock',
    label: 'Unlock PDF',
    description: 'Remove password protection, printing restrictions, and editing locks from PDF documents.',
    category: 'security',
    isClientSide: false,
    tags: ['decrypt', 'remove password', 'unlock', 'open'],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>
    ),
  },
]

const CATEGORY_TABS = [
  { id: 'all', label: 'All Tools' },
  { id: 'edit', label: 'Edit & Sign' },
  { id: 'organize', label: 'Organize' },
  { id: 'convert', label: 'Convert' },
  { id: 'security', label: 'Security' },
]

export default function Home() {
  const { navigate } = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    document.title = 'Easy PDF Tools — Free Online PDF Editor, Converter & Utilities | easypdftools.xyz'
  }, [])

  const filteredTools = useMemo(() => {
    let list = TOOLS
    if (selectedCategory !== 'all') {
      list = list.filter((t) => t.category === selectedCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (t) =>
          t.label.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    }
    return list
  }, [selectedCategory, searchQuery])

  return (
    <div className="space-y-12 pb-16">
      {/* ── World-Class SaaS Hero Section ─────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 py-16 sm:py-24 px-4 transition-colors">
        {/* Soft Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 rounded-full text-xs font-semibold shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>100% Client-Side Privacy • Zero File Limits</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight sm:leading-tight">
            The Private, Free PDF Suite
            <br />
            <span className="text-slate-500 dark:text-slate-400 font-bold">Built for your browser</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Edit text in-place, sign documents, merge, split, and convert PDF files. Fast, secure, and runs directly on your device with 0 bytes uploaded.
          </p>

          {/* 🔍 Real-Time Instant Search / Filter Bar */}
          <div className="pt-2 max-w-lg mx-auto">
            <div className="relative flex items-center">
              <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools (e.g. sign, merge, edit, compress, word)..."
                className="w-full pl-11 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white flex items-center justify-center text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Popular:</span>
            {[
              { path: '/edit', label: 'Edit Text' },
              { path: '/sign', label: 'Sign Document' },
              { path: '/merge', label: 'Merge PDF' },
              { path: '/compress', label: 'Compress' },
            ].map((quick) => (
              <button
                key={quick.path}
                onClick={() => navigate(quick.path)}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
              >
                {quick.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tools Grid & Filter Tabs ───────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'All Tools'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Showing {filteredTools.length} of {TOOLS.length} PDF utilities
            </p>
          </div>

          {/* Segmented Filter Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-1 overflow-x-auto text-xs font-medium border border-slate-200/60 dark:border-slate-700/60">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={[
                  'px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer',
                  selectedCategory === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Cards Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.path} {...tool} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-3">
            <p className="text-sm font-bold text-slate-900 dark:text-white">No tools matched "{searchQuery}"</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Try searching for terms like "sign", "merge", "convert", "word", or "rotate".
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all') }}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold mt-2 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* ── Architecture Highlights ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-2xs">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              0b
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Local-First Execution</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Core document editing, signing, merging, splitting, and rendering run 100% locally in browser memory without sending data to servers.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
              AES
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Encrypted Signatures</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Saved digital signatures and stamps are encrypted with Web Crypto AES-256 and protected with optional on-device PIN locks.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
              GIT
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Open Source &amp; Auditable</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Full transparency on GitHub for independent code auditing by developers and privacy-focused professionals worldwide.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
