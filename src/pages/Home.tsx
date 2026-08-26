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

const FAQS = [
  {
    q: 'Is Easy PDF Tools completely free to use?',
    a: 'Yes, Easy PDF Tools is 100% free for everyone. There are no file size limits, no daily document caps, and no registration or credit card required.',
  },
  {
    q: 'Are my PDF documents uploaded to remote servers?',
    a: 'Core tools (Sign PDF, Edit PDF, Merge, Split, Rotate, PDF to JPG) run 100% locally inside your web browser memory with 0 bytes uploaded over the internet. Conversion tools process files in ephemeral, encrypted RAM and permanently delete them immediately after completion.',
  },
  {
    q: 'Can I edit existing text in a PDF document?',
    a: 'Yes! The Edit PDF tool allows you to click on existing paragraphs in your PDF and edit or replace text directly in your browser without altering the document format.',
  },
  {
    q: 'How does digital signature extraction work?',
    a: 'Upload a smartphone photo of your signature written on paper. Our vector engine automatically erases the paper background, removes shadows, and converts your signature into a crisp, transparent digital ink stamp.',
  },
  {
    q: 'Are saved signatures encrypted on my device?',
    a: 'Yes. If you choose to save a signature, it is encrypted locally on your device using 256-bit AES-GCM encryption with optional PIN-lock protection. We have zero access to your saved signatures or keys.',
  },
]

export default function Home() {
  const { navigate } = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredTools = useMemo(() => {
    if (selectedCategory === 'all') return TOOLS
    return TOOLS.filter((t) => t.category === selectedCategory)
  }, [selectedCategory])

  return (
    <div className="space-y-12 pb-16">
      {/* ── Modern Minimalist Hero ─────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 py-16 sm:py-20 px-4 transition-colors">
        {/* Soft Ambient Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-5 relative z-10">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 rounded-full text-xs font-semibold shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>100% Client-Side Privacy • Zero File Caps</span>
          </div>

          {/* Primary H1 Heading for SEO */}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Professional PDF Tools for Everyone
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Edit text in-place, sign documents, merge, split, rotate, and convert PDF files. Runs directly in your browser with zero server uploads.
          </p>

          {/* Quick Primary Actions */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/edit')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
            >
              Edit PDF Document
            </button>
            <button
              onClick={() => navigate('/sign')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs sm:text-sm border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer"
            >
              Sign PDF
            </button>
          </div>
        </div>
      </section>

      {/* ── Tools Grid & Filter Tabs ───────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Available Tools</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Select a tool to process documents immediately</p>
          </div>

          {/* Segmented Filter Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-1 overflow-x-auto text-xs font-medium border border-slate-200/60 dark:border-slate-700/60">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={[
                  'px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer',
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.path} {...tool} />
          ))}
        </div>
      </section>

      {/* ── Architecture Highlights ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-2xs">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              0b
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Local-First Execution</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Core document editing, signing, merging, splitting, and rendering run 100% locally in browser memory without sending data to servers.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
              AES
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Encrypted Signatures</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Saved digital signatures and stamps are encrypted with Web Crypto AES-256 and protected with optional on-device PIN locks.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
              GIT
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Open Source &amp; Auditable</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Full transparency on GitHub for independent code auditing by developers and privacy-focused professionals worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* ── Semantic SEO FAQ Section ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Everything you need to know about Easy PDF Tools security, privacy, and features.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FAQS.map((faq, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 font-mono text-xs mt-0.5">Q.</span>
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-5">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
