import { useAuthStore } from '../../store/authStore'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

interface TokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
}

interface TokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: TokenResponse) => void
          }) => TokenClient
          revoke: (token: string, done: () => void) => void
        }
      }
    }
  }
}

let tokenClient: TokenClient | null = null

function waitForGis(timeoutMs = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    function poll() {
      if (window.google?.accounts?.oauth2) {
        resolve()
        return
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error('Google Identity Services script failed to load'))
        return
      }
      setTimeout(poll, 100)
    }
    poll()
  })
}

async function fetchUserEmail(token: string) {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return
    const data = (await res.json()) as { email?: string }
    useAuthStore.getState().setEmail(data.email ?? null)
  } catch {
    // non-critical - the app still works without a displayed email
  }
}

async function getTokenClient(): Promise<TokenClient> {
  if (tokenClient) return tokenClient
  if (!CLIENT_ID) {
    throw new Error(
      'VITE_GOOGLE_CLIENT_ID is not set. Add it to a .env file — see README for how to get one from Google Cloud Console.',
    )
  }
  await waitForGis()
  tokenClient = window.google!.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (response.error || !response.access_token) {
        console.error('Google auth error', response.error)
        return
      }
      useAuthStore.getState().setToken(response.access_token, response.expires_in ?? 3600)
      void fetchUserEmail(response.access_token)
    },
  })
  return tokenClient
}

export async function requestAccessToken(opts: { silent: boolean }): Promise<void> {
  const client = await getTokenClient()
  client.requestAccessToken({ prompt: opts.silent ? '' : 'consent' })
}

export function signOut(): void {
  const token = useAuthStore.getState().accessToken
  if (token) {
    window.google?.accounts.oauth2.revoke(token, () => {})
  }
  useAuthStore.getState().clear()
}
