import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { clearSession, getSession, saveSession, type SessionUser } from './session'

interface LoginInput {
  email: string
  password: string
}

interface RegisterInput extends LoginInput {
  displayName: string
}

interface AuthValue {
  user: SessionUser | null
  login(input: LoginInput): Promise<SessionUser>
  register(input: RegisterInput): Promise<SessionUser>
  logout(): void
}

const AuthContext = createContext<AuthValue | null>(null)

/** Server messages that are safe (and useful) to show on the auth screens. */
function messageFrom(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
    if (error.status === 409) return 'อีเมลนี้ถูกลงทะเบียนไว้แล้ว'
    if (error.status === 503) return 'ฐานข้อมูลยังไม่พร้อม กรุณาลองใหม่ภายหลัง'
    return error.message || fallback
  }
  return fallback
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => getSession())

  const login = useCallback(async ({ email, password }: LoginInput) => {
    try {
      const { user: signedIn } = await api.post<{ user: SessionUser }>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      })
      const session: SessionUser = {
        id: signedIn.id,
        email: signedIn.email,
        displayName: signedIn.displayName || email,
        token: signedIn.token,
      }
      saveSession(session)
      setUser(session)
      return session
    } catch (error) {
      throw new Error(messageFrom(error, 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่'))
    }
  }, [])

  const register = useCallback(async ({ email, password, displayName }: RegisterInput) => {
    try {
      const { user: created } = await api.post<{ user: SessionUser }>('/auth/register', {
        email: email.trim().toLowerCase(),
        password,
        displayName: displayName.trim(),
      })
      const session: SessionUser = {
        id: created.id,
        email: created.email,
        displayName: created.displayName || displayName,
        token: created.token,
      }
      saveSession(session)
      setUser(session)
      return session
    } catch (error) {
      throw new Error(messageFrom(error, 'สมัครใช้งานไม่สำเร็จ กรุณาลองใหม่'))
    }
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo<AuthValue>(
    () => ({ user, login, register, logout }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}

/** Blocks every app route until a session exists (redirects to /login). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }
  return <>{children}</>
}
