import { create } from 'zustand'

interface PersistedAuth {
  accessToken: string | null
  expiresAt: number | null
  email: string | null
}

interface AuthState extends PersistedAuth {
  setToken: (token: string, expiresInSec: number) => void
  setEmail: (email: string | null) => void
  clear: () => void
}

const SESSION_KEY = 'fm_auth'

function loadFromSession(): PersistedAuth {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return { accessToken: null, expiresAt: null, email: null }
    return JSON.parse(raw) as PersistedAuth
  } catch {
    return { accessToken: null, expiresAt: null, email: null }
  }
}

function persist(state: PersistedAuth) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state))
  } catch {
    // sessionStorage unavailable (private mode etc.) - auth just won't survive a reload
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...loadFromSession(),
  setToken: (token, expiresInSec) => {
    const expiresAt = Date.now() + expiresInSec * 1000
    set({ accessToken: token, expiresAt })
    persist({ accessToken: token, expiresAt, email: get().email })
  },
  setEmail: (email) => {
    set({ email })
    persist({ accessToken: get().accessToken, expiresAt: get().expiresAt, email })
  },
  clear: () => {
    set({ accessToken: null, expiresAt: null, email: null })
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      // ignore
    }
  },
}))

export function isTokenValid(): boolean {
  const { accessToken, expiresAt } = useAuthStore.getState()
  return !!accessToken && !!expiresAt && expiresAt - Date.now() > 60_000
}
