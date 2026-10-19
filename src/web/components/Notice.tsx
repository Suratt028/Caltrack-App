import type { ReactNode } from 'react'

export type NoticeTone = 'info' | 'mint' | 'warn'

const toneClasses: Record<NoticeTone, string> = {
  info: 'bg-surface border-line text-ink',
  mint: 'bg-mint border-mint text-ink',
  warn: 'bg-warnbg border-line text-ink',
}

/**
 * A gentle, non-judgemental notice box. Never uses alarming red — over-goal and
 * AI uncertainty are phrased supportively (spec §1, §6.7).
 */
export function Notice({
  tone = 'info',
  icon,
  title,
  children,
  className = '',
}: {
  tone?: NoticeTone
  icon?: ReactNode
  title?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-card border p-4 ${toneClasses[tone]} ${className}`}>
      <div className="flex gap-3">
        {icon ? <span className="mt-0.5 shrink-0 text-brand">{icon}</span> : null}
        <div className="min-w-0 text-sm leading-relaxed">
          {title ? <p className="font-semibold text-ink">{title}</p> : null}
          {children ? <div className={title ? 'mt-1 text-ink-muted-on-mint' : ''}>{children}</div> : null}
        </div>
      </div>
    </div>
  )
}
