import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Camera, ChartColumn, House, Leaf, LogOut, Moon, NotebookPen, Sun, UserRound } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const NAV: { label: string; icon: LucideIcon; active?: boolean }[] = [
  { label: 'หน้าหลัก', icon: House, active: true },
  { label: 'บันทึก', icon: NotebookPen },
  { label: 'สแกน', icon: Camera },
  { label: 'แนวโน้ม', icon: ChartColumn },
  { label: 'โปรไฟล์', icon: UserRound },
]

type Props = {
  children: ReactNode
  userName: string
  userDetail: string
  dark: boolean
  onToggleDark: () => void
  onSignOut: () => void
  signOutLabel: string
}

export function AppShell({ children, userName, userDetail, dark, onToggleDark, onSignOut, signOutLabel }: Props) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      {/* Desktop sidebar: fixed so its background always reaches the bottom */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r bg-sidebar p-4 lg:flex">
        <Brand />
        <nav aria-label="เมนูหลัก" className="mt-8 flex flex-col gap-1">
          {NAV.map(({ label, icon: Icon, active }) => (
            <a
              key={label}
              href="#"
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none',
                active && 'bg-sidebar-accent text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </a>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-3 rounded-lg p-2">
          <Avatar className="size-9">
            <AvatarFallback className="bg-accent text-accent-foreground">{userName.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName}</p>
            <p className="truncate text-xs text-muted-foreground">{userDetail}</p>
          </div>
          <ThemeButton dark={dark} onToggle={onToggleDark} />
          <SignOutButton label={signOutLabel} onSignOut={onSignOut} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col lg:col-start-2">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/90 px-4 py-2 backdrop-blur lg:hidden">
          <Brand />
          <div className="flex items-center gap-1">
            <ThemeButton dark={dark} onToggle={onToggleDark} />
            <SignOutButton label={signOutLabel} onSignOut={onSignOut} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">{children}</main>

        {/* Mobile bottom tabs, scan raised in the centre (thumb zone) */}
        <nav
          aria-label="เมนูหลัก"
          className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        >
          {NAV.map(({ label, icon: Icon, active }) =>
            label === 'สแกน' ? (
              <a key={label} href="#" className="flex flex-col items-center justify-end pb-1.5 text-xs font-medium text-primary">
                <span className="-mt-6 mb-1 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background">
                  <Icon className="size-6" aria-hidden />
                </span>
                {label}
              </a>
            ) : (
              <a
                key={label}
                href="#"
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 text-xs text-muted-foreground',
                  active && 'font-semibold text-primary',
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </a>
            ),
          )}
        </nav>
      </div>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Leaf className="size-5" aria-hidden />
      </span>
      <span className="text-lg font-bold tracking-tight">CalTrack</span>
    </div>
  )
}

function SignOutButton({ label, onSignOut }: { label: string; onSignOut: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="size-10" onClick={onSignOut} aria-label={label}>
          <LogOut className="size-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function ThemeButton({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  const label = dark ? 'ใช้โหมดสว่าง' : 'ใช้โหมดมืด'
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="size-10" onClick={onToggle} aria-label={label}>
          {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
