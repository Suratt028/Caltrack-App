import { NavLink, useLocation } from 'react-router-dom'
import { t } from '../i18n'
import { isTabActive, NAV_ITEMS } from '../navigation/items'

/** Mobile bottom tab bar (4 tabs) with a mint pill on the active tab. */
export function TabBar() {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label={t('nav.home')}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-content items-stretch justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = isTabActive(pathname, item.match)
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px]"
              >
                <span
                  className={`flex items-center justify-center rounded-full px-4 py-1 transition-colors ${
                    active ? 'bg-mint text-brand-deep' : 'text-ink-muted'
                  }`}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className={active ? 'font-semibold text-brand-deep' : 'text-ink-muted'}>
                  {t(item.labelKey)}
                </span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
