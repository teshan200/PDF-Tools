import { useEffect, useState } from 'react'
import ToolCard from '../components/ToolCard'
import { useRouter } from '../router'

const TOOLS = [
  {
    path: '/edit',
    label: 'Edit PDF',
    description: 'Edit existing text, erase with whiteout, insert images, and draw annotations in real time.',
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
    description: 'Draw, type, or extract signatures from photos. Secured with AES-256 local encryption.',
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
    description: 'Combine multiple PDF documents into a single file with custom page reordering.',
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
    description: 'Extract custom page ranges, split by intervals, or save every page as an individual PDF.',
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
    description: 'Rotate all or selected pages (even/odd) by 90°, 180°, or 270° instantly.',
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
    description: 'Convert PDF pages into high-resolution JPG images packaged in a clean ZIP download.',
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
    description: 'Optimize and reduce PDF file size while preserving high visual document fidelity.',
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
    description: 'Convert PDF documents into fully editable Microsoft Word (.docx) documents.',
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
    description: 'Encrypt and lock sensitive PDF files with secure AES password protection.',
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
    description: 'Remove password restrictions and security permissions from unlocked PDF files.',
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

export default function Home() {
  const { navigate } = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    document.title = 'Easy PDF Tools — Free Online PDF Editor, Converter & Utilities | easypdftools.xyz'
  }, [])

  const filteredTools = selectedCategory === 'all'
    ? TOOLS
    : TOOLS.filter((t) => t.category === selectedCategory)

  return (
    <div className="space-y-12">
      {/* ── Minimalist SaaS Hero ─────────────────────────────── */}
      <section className="border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 py-16 sm:py-20 px-4 transition-colors">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-300 rounded-full text-xs font-semibold">
            10 Free Web PDF Utilities
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Professional PDF Tools for Everyone
          </h1>

          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Edit text in-place, sign contracts, merge, split, rotate, and convert PDF files. Fast, unrestricted, and built with local browser privacy.
          </p>

          <div className="pt-3 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/edit')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
            >
              Edit PDF Document
            </button>
            <button
              onClick={() => navigate('/sign')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              Sign PDF
            </button>
          </div>
        </div>
      </section>

      {/* ── Tools Grid & Filter Tabs ───────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Available Tools</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Select a utility to process documents immediately</p>
          </div>

          {/* Clean Segmented Filter Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-1 overflow-x-auto text-xs font-medium">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.path} {...tool} />
          ))}
        </div>
      </section>

      {/* ── Architecture & Capabilities Summary ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Client-Side First</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Core document operations (editing, signing, merging, splitting, and rendering) run directly inside your browser memory.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Zero File Size Limits</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Process large PDF files without arbitrary artificial file size caps, page count restrictions, or paywalls.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Open Source &amp; Auditable</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Built transparently on GitHub for open verification by developers and privacy-conscious professionals worldwide.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
