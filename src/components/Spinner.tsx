interface SpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Spinner({ message, size = 'md' }: SpinnerProps) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-9 h-9 border-[3px]',
    lg: 'w-14 h-14 border-4',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      <div
        className={[
          sizes[size],
          'rounded-full border-blue-100 border-t-blue-600 animate-spin',
        ].join(' ')}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="text-sm text-slate-500 animate-pulse font-medium">{message}</p>
      )}
    </div>
  )
}
