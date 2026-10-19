import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { SideNav } from './SideNav'
import { TopNav } from './TopNav'
import { TabBar } from './TabBar'
import { t } from '../i18n'

/** Responsive shell: top nav + sidebar on desktop, bottom tabs on mobile. */
export function AppLayout() {
  const { pathname } = useLocation()

  // Reset scroll on navigation (SPA behaviour)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return (
    <div className="min-h-dvh bg-surface">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-btn focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
      >
        ข้ามไปยังเนื้อหาหลัก
      </a>

      <TopNav />

      <div className="mx-auto flex max-w-content gap-6 px-4 sm:px-5">
        <SideNav />
        <main
          id="main"
          className="min-w-0 flex-1 pb-28 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-6 lg:pb-10"
        >
          <Outlet />
        </main>
      </div>

      <footer className="mx-auto hidden max-w-content px-5 pb-10 pt-4 text-xs text-ink-muted sm:block">
        {t('notes.footer')}
      </footer>
      <p className="mx-auto max-w-content px-4 pb-3 text-center text-xs text-ink-muted sm:hidden">
        {t('notes.footer')}
      </p>

      <TabBar />
    </div>
  )
}
