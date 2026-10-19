/**
 * The signed-in user, persisted in localStorage.
 *
 * Kept separate from React so the data layer (`repositories.ts`, app state)
 * can read the current user without hooks.
 */

export interface SessionUser {
  id: string
  email: string
  displayName: string
  /** Signed API token from /auth/login or /auth/register. */
  token?: string
}

const STORAGE_KEY = 'caltrack_session'

export function getSession(): SessionUser | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SessionUser> | null
    if (!parsed || typeof parsed.id !== 'string' || !parsed.id) return null
    return {
      id: parsed.id,
      email: typeof parsed.email === 'string' ? parsed.email : '',
      displayName:
        typeof parsed.displayName === 'string' && parsed.displayName
          ? parsed.displayName
          : 'ผู้ใช้ CalTrack',
      token: typeof parsed.token === 'string' ? parsed.token : undefined,
    }
  } catch {
    return null
  }
}

export function saveSession(user: SessionUser): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  window.localStorage.removeItem(STORAGE_KEY)
}
