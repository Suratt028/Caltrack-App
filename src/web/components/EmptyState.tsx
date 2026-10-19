import type { ReactNode } from 'react'

/** Calm, supportive empty state — an icon in a mint tile plus a short message. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center px-6 py-10 text-center ${className}`}>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint text-brand">
        {icon}
      </span>
      <p className="mt-4 text-base font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
