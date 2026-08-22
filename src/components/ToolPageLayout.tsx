import { useEffect } from 'react'
import { useRouter } from '../router'

const COLOR_MAP: Record<string, { hero: string; iconBg: string; back: string }> = {
  blue: {
    hero: 'from-blue-600 via-blue-700 to-blue-900',
    iconBg: 'bg-white/15',
    back: 'text-blue-100 hover:text-white',
  },
  purple: {
    hero: 'from-purple-600 via-purple-700 to-purple-900',
    iconBg: 'bg-white/15',
    back: 'text-purple-100 hover:text-white',
  },
  emerald: {
    hero: 'from-emerald-600 via-emerald-700 to-emerald-900',
    iconBg: 'bg-white/15',
    back: 'text-emerald-100 hover:text-white',
  },
  violet: {
    hero: 'from-violet-600 via-violet-700 to-violet-900',
    iconBg: 'bg-white/15',
    back: 'text-violet-100 hover:text-white',
  },
  orange: {
    hero: 'from-orange-500 via-orange-600 to-orange-800',
    iconBg: 'bg-white/15',
    back: 'text-orange-100 hover:text-white',
  },
  amber: {
    hero: 'from-amber-500 via-amber-600 to-amber-800',
    iconBg: 'bg-white/15',
    back: 'text-amber-100 hover:text-white',
  },
  rose: {
    hero: 'from-rose-600 via-rose-700 to-rose-900',
    iconBg: 'bg-white/15',
    back: 'text-rose-100 hover:text-white',
  },
  teal: {
    hero: 'from-teal-600 via-teal-700 to-teal-900',
    iconBg: 'bg-white/15',
    back: 'text-teal-100 hover:text-white',
  },
  indigo: {
    hero: 'from-indigo-600 via-indigo-700 to-indigo-900',
    iconBg: 'bg-white/15',
    back: 'text-indigo-100 hover:text-white',
  },
}

interface ToolPageLayoutProps {
  title: string
  description: string
  color: string
  icon: React.ReactNode
  children: React.ReactNode
}

export default function ToolPageLayout({
  title,
  description,
  color,
  icon,
  children,
}: ToolPageLayoutProps) {
  const { navigate } = useRouter()
  const c = COLOR_MAP[color] ?? COLOR_MAP.blue

  useEffect(() => {
    document.title = `${title} — Free Online PDF Tool | asypdftools.xyz`
  }, [title])

  return (
    <div>
      {/* Hero banner */}
      <div className={`bg-gradient-to-br ${c.hero} text-white py-10 sm:py-14 px-4`}>
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors ${c.back}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            All Tools
          </button>

          {/* Title row */}
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 ${c.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm`}>
              <div className="text-white">{icon}</div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{title}</h1>
              <p className="text-white/70 mt-1 text-sm sm:text-base">{description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tool content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">{children}</div>
    </div>
  )
}
