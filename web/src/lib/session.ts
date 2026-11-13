import type { SessionUser } from './api'

// Kept in localStorage so a reload stays signed in. The token expires on the
// server side; a 401 clears it (see App.tsx).
const KEY = 'caltrack-session'

export function readSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed?.id && parsed?.token ? parsed : null
  } catch {
    return null
  }
}

export function writeSession(user: SessionUser | null) {
  try {
    if (user) localStorage.setItem(KEY, JSON.stringify(user))
    else localStorage.removeItem(KEY)
  } catch {
    // Storage blocked: the session lasts for this tab only.
  }
}
