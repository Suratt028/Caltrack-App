import type { ReactNode } from 'react'
import { Leaf } from 'lucide-react'
import { t } from '../i18n'

/**
 * Centered card layout shared by the login and register screens —
 * intentionally free of the app chrome (top nav / side nav / tab bar).
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex min-dvh items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-icon bg-brand text-white">
            <Leaf aria-hidden="true" className="h-6 w-6" />
          </span>
          <p className="mt-2 text-lg font-bold text-ink">{t('appName')}</p>
          <p className="mt-0.5 text-xs text-ink-muted">{t('tagline')}</p>
        </div>

        <div className="app-card p-6 shadow-soft">
          <h1 className="text-xl font-bold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
          <div className="mt-5">{children}</div>
        </div>

        {footer ? <div className="mt-4 text-center text-sm text-ink-muted">{footer}</div> : null}
      </div>
    </div>
  )
}
