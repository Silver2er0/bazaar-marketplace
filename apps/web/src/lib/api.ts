import { useAuth } from './store'
import type { Session } from './types'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

let refreshing: Promise<boolean> | null = null

function refreshSession() {
  refreshing ??= (async () => {
    const { refreshToken, setSession, logout } = useAuth.getState()
    const res = refreshToken
      ? await fetch(`${BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
      : null
    if (res?.ok) setSession((await res.json()) as Session)
    else logout()
    return !!res?.ok
  })().finally(() => (refreshing = null))
  return refreshing
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const { accessToken } = useAuth.getState()
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      ...(typeof init.body === 'string' && { 'Content-Type': 'application/json' }),
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
  })
  if (res.status === 401 && accessToken && retry && (await refreshSession())) {
    return request<T>(path, init, false)
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message
    throw new ApiError(res.status, message ?? res.statusText)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

const send =
  (method: string) =>
  <T = void>(path: string, body?: unknown) =>
    request<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) })

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: send('POST'),
  patch: send('PATCH'),
  del: send('DELETE'),
  upload: (file: File) => {
    const body = new FormData()
    body.append('file', file)
    return request<{ url: string }>('/uploads', { method: 'POST', body })
  },
}
