/**
 * Tiny JSON client for the CalTrack backend (`server.js` → MongoDB).
 *
 * The base URL uses the Expo public API setting shared by native and web.
 * Every request times out after 10 s so screens can
 * fall back to their recovery/empty states instead of hanging.
 */
import { API_BASE_URL } from '../../config'
import { getSession } from '../auth/session'

export const API_BASE = API_BASE_URL.replace(/\/+$/, '')

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  const token = getSession()?.token

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers as Record<string, string> | undefined),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    const aborted = (error as Error)?.name === 'AbortError'
    throw new ApiError(
      aborted ? 'เชื่อมต่อเซิร์ฟเวอร์ใช้เวลานานเกินไป' : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้',
      0,
    )
  } finally {
    clearTimeout(timeout)
  }

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>
  if (!response.ok) {
    const message =
      typeof payload.error === 'string' && payload.error
        ? payload.error
        : `คำขอไม่สำเร็จ (${response.status})`
    throw new ApiError(message, response.status)
  }
  return payload as T
}

export const api = {
  get: <T,>(path: string) => apiRequest<T>(path),
  post: <T,>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body }),
  put: <T,>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PUT', body }),
  del: <T,>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
}
