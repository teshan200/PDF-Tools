import { useEffect } from 'react'
import { useRouter } from '../router'

interface ToolPageLayoutProps {
  title: string
  description: string
  color?: string
  icon: React.ReactNode
  children: React.ReactNode
}

export default function ToolPageLayout({
  title,
  description,
  icon,
  children,
}: ToolPageLayoutProps) {
  const { navigate } = useRouter()

  useEffect(() => {
    document.title = `${title} — Free Online PDF Tool | easypdftools.xyz`
  }, [title])

  return (
    <div>
      {/* Clean, Content-First Tool Header */}
      <div className="bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 py-8 px-4 transition-colors">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Breadcrumb */}
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to All Tools</span>
          </button>

          {/* Title row */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0">
              {icon}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tool Content Workspace */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">{children}</div>
    </div>
  )
}
