import { useEffect } from 'react'
import ToolCard from '../components/ToolCard'
import { useRouter } from '../router'

const TOOLS = [
  {
    path: '/merge',
    label: 'Merge PDF',
    description: 'Combine multiple PDFs into one document. Reorder pages before merging.',
    gradient: 'from-blue-500 to-blue-700',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    path: '/split',
    label: 'Split PDF',
    description: 'Split a PDF by page ranges, every N pages, or into individual pages.',
    gradient: 'from-purple-500 to-purple-700',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    path: '/compress',
    label: 'Compress PDF',
    description: 'Reduce PDF file size with low, recommended, or extreme compression.',
    gradient: 'from-emerald-500 to-emerald-700',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    ),
  },
  {
    path: '/edit',
    label: 'Edit PDF',
    description: 'Click existing text to edit, erase with whiteout, add images & draw directly.',
    gradient: 'from-indigo-500 to-indigo-700',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    path: '/word',
    label: 'PDF to Word',
    description: 'Convert PDF files to editable Word (.docx) documents instantly.',
    gradient: 'from-violet-500 to-violet-700',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    path: '/jpg',
    label: 'PDF to JPG',
    description: 'Convert each PDF page into a high-quality JPG image. Download as ZIP.',
    gradient: 'from-orange-500 to-orange-700',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    path: '/rotate',
    label: 'Rotate PDF',
    description: 'Rotate all or specific pages by 90°, 180°, or 270° with one click.',
    gradient: 'from-amber-500 to-amber-700',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    path: '/protect',
    label: 'Protect PDF',
    description: 'Add password protection with 128-bit or 256-bit encryption.',
    gradient: 'from-rose-500 to-rose-700',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    path: '/unlock',
    label: 'Unlock PDF',
    description: 'Remove password protection from PDF files. Enter the existing password.',
    gradient: 'from-teal-500 to-teal-700',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>
    ),
  },
]

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    bg: 'bg-blue-50',
    title: '100% Secure',
    body: 'Your files are processed via encrypted HTTPS. We never store your documents.',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    bg: 'bg-emerald-50',
    title: 'Lightning Fast',
    body: 'High-performance cloud processing converts and optimizes your documents in seconds.',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    bg: 'bg-purple-50',
    title: 'Professional Quality',
    body: 'Enterprise-grade PDF processing with no quality loss or watermarks.',
  },
]

export default function Home() {
  const { navigate } = useRouter()

  useEffect(() => {
    document.title = 'Easy PDF Tools — Free Online PDF Editor, Converter & Utilities | easypdftools.xyz'
  }, [])

  return (
    <div>
      {/* ── Hero ─────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white py-20 sm:py-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium text-blue-100 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            9 Free PDF Tools — No Signup Required
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-5 tracking-tight leading-tight">
            All Your PDF Tools
            <br />
            <span className="text-blue-200">in One Place</span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Merge, split, compress, edit, convert, rotate, protect and unlock PDF files.
            Fast, secure, and completely free.
          </p>
          <button
            onClick={() => navigate('/merge')}
            className="mt-8 inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-7 py-3.5 rounded-xl hover:bg-blue-50 active:bg-blue-100 transition-colors shadow-lg shadow-blue-900/30 text-base"
          >
            Get Started
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Tools Grid ───────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Choose a Tool</h2>
          <p className="text-slate-500 mt-2 text-base">Select any tool below to get started instantly</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.path} {...tool} />
          ))}
        </div>
      </div>

      {/* ── Features ─────────────────────────── */}
      <div className="bg-white border-t border-b border-slate-100 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center gap-3">
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-slate-900 text-base">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
