import { NavLink, useLocation } from 'react-router-dom'
import { t } from '../i18n'
import { isActive, NAV_ITEMS } from '../navigation/items'

/** Desktop-only left sidebar with the four sections + a supportive note. */
export function SideNav() {
  const { pathname } = useLocation()

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-20 flex flex-col gap-6 px-4">
        <nav aria-label={t('nav.home')} className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(pathname, item.match)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-btn px-3.5 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-mint text-brand-deep'
                    : 'text-ink-muted hover:bg-mint/60'
                }`}
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
                {t(item.labelKey)}
              </NavLink>
            )
          })}
        </nav>

        <div className="rounded-card border border-mint bg-mint/70 p-4 text-sm text-ink-muted-on-mint">
          <p className="font-semibold text-ink">ดูแลตัวเองทีละมื้อก็พอ</p>
          <p className="mt-1">
            ไม่มีวันที่ต้องสมบูรณ์แบบ เริ่มจากสิ่งที่สะดวกสำหรับคุณได้เลย
          </p>
        </div>
      </div>
    </aside>
  )
}
