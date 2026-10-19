import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { t } from '../i18n'
import type { ReactNode } from 'react'

/**
 * Screen title block. Secondary screens pass `backTo` to render a top-left
 * back control (spec §9).
 */
export function ScreenHeader({
  title,
  subtitle,
  backTo,
  actions,
  className = '',
}: {
  title: string
  subtitle?: string
  backTo?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex items-start gap-3">
        {backTo ? (
          <Link
            to={backTo}
            aria-label={t('common.back')}
            className="-ml-2 mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-icon text-ink transition-colors hover:bg-mint"
          >
            <ChevronLeft aria-hidden="true" className="h-6 w-6" />
          </Link>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-ink sm:text-2xl">{title}</h1>
          {subtitle ? <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
