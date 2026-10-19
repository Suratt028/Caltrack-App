import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Leaf, LogOut } from 'lucide-react'
import { t } from '../i18n'
import { useAuth } from '../auth/auth-context'
import { isActive, TABLET_NAV_ITEMS } from '../navigation/items'
import { useAppState } from '../state/app-state'

/** Full-width top bar used on tablet and desktop (spec §6.3, §6.4). */
export function TopNav() {
  const { profile } = useAppState()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-30 hidden border-b border-line bg-surface/95 backdrop-blur sm:block">
      <div className="mx-auto flex h-16 max-w-content items-center gap-6 px-5">
        <NavLink to="/" className="flex items-center gap-2.5 font-bold text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-icon bg-brand text-white">
            <Leaf aria-hidden="true" className="h-5 w-5" />
          </span>
          <span className="text-lg">{t('appName')}</span>
        </NavLink>

        <p className="hidden flex-1 text-sm text-ink-muted lg:block">{t('tagline')}</p>

        {/* Tablet-only inline menu; desktop uses the sidebar instead */}
        <nav aria-label={t('nav.home')} className="flex flex-1 items-center gap-1 lg:hidden">
          {TABLET_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={`rounded-btn px-3.5 py-2 text-sm font-medium transition-colors ${
                isActive(pathname, item.match)
                  ? 'bg-mint text-brand-deep'
                  : 'text-ink-muted hover:bg-mint/60'
              }`}
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 rounded-btn border border-line bg-card px-3 py-1.5 text-sm text-ink">
          <span className="max-w-40 truncate font-medium">
            {profile.name || user?.displayName}
          </span>
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
            className="inline-flex items-center gap-1 rounded-btn px-2 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-mint hover:text-brand-deep"
          >
            <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
            {t('profile.logout')}
          </button>
        </div>
      </div>
    </header>
  )
}
