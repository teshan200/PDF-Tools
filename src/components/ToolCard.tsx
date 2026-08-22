import { useRouter } from '../router'

interface ToolCardProps {
  path: string
  label: string
  description: string
  icon: React.ReactNode
  gradient: string
  badgeText?: string
}

export default function ToolCard({
  path,
  label,
  description,
  icon,
  gradient,
  badgeText,
}: ToolCardProps) {
  const { navigate } = useRouter()

  return (
    <button
      onClick={() => navigate(path)}
      className="relative bg-white border border-slate-200 rounded-2xl p-6 text-left hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group w-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      {badgeText && (
        <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
          {badgeText}
        </span>
      )}

      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${gradient} shadow-sm`}>
        <div className="text-white">{icon}</div>
      </div>

      {/* Title */}
      <h3 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors text-base">
        {label}
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
        {description}
      </p>

      {/* CTA */}
      <div className="flex items-center gap-1 mt-4 text-blue-600 text-sm font-semibold">
        <span>Use Tool</span>
        <svg
          className="w-4 h-4 group-hover:translate-x-1 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}
