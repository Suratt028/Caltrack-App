import { BarChart3, Home, PlusCircle, User, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  labelKey: string
  icon: LucideIcon
  /** Match nested routes (e.g. /log/portion/...). */
  match: string
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', labelKey: 'nav.home', icon: Home, match: '/' },
  { to: '/log', labelKey: 'nav.log', icon: PlusCircle, match: '/log' },
  { to: '/trends', labelKey: 'nav.trends', icon: BarChart3, match: '/trends' },
  { to: '/profile', labelKey: 'nav.profile', icon: User, match: '/profile' },
]

/** Tablet top nav shows a reduced set (spec §4). */
export const TABLET_NAV_ITEMS = [NAV_ITEMS[0], NAV_ITEMS[2]]

export function isActive(pathname: string, match: string): boolean {
  if (match === '/') return pathname === '/'
  return pathname === match || pathname.startsWith(`${match}/`)
}

/**
 * Tab-bar active state. The "บันทึกอาหาร" tab stays active throughout the whole
 * logging + AI-scan flow (spec §9).
 */
export function isTabActive(pathname: string, match: string): boolean {
  if (match === '/log') {
    return pathname.startsWith('/log') || pathname.startsWith('/scan')
  }
  return isActive(pathname, match)
}
