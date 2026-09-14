import { useAuthStore } from '../../store/authStore'

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

async function authFetch(url: string, init: RequestInit = {}, attempt = 0): Promise<Response> {
  const token = useAuthStore.getState().accessToken
  if (!token) throw new Error('Not signed in to Google')

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.status === 429 && attempt < 4) {
    const delay = 2 ** attempt * 500
    await new Promise((resolve) => setTimeout(resolve, delay))
    return authFetch(url, init, attempt + 1)
  }

  return res
}

export interface ValueRange {
  range: string
  values?: string[][]
}

export async function batchGetValues(spreadsheetId: string, ranges: string[]): Promise<ValueRange[]> {
  const params = ranges.map((range) => `ranges=${encodeURIComponent(range)}`).join('&')
  const url = `${SHEETS_BASE}/${spreadsheetId}/values:batchGet?${params}`
  const res = await authFetch(url)
  if (!res.ok) throw new Error(`Sheets batchGet failed: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as { valueRanges: ValueRange[] }
  return data.valueRanges
}

export async function appendValues(
  spreadsheetId: string,
  range: string,
  rows: unknown[][],
): Promise<void> {
  const url = `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(
    range,
  )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`
  const res = await authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: rows }),
  })
  if (!res.ok) throw new Error(`Sheets append failed: ${res.status} ${await res.text()}`)
}

export async function updateValues(
  spreadsheetId: string,
  range: string,
  rows: unknown[][],
): Promise<void> {
  const url = `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`
  const res = await authFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: rows }),
  })
  if (!res.ok) throw new Error(`Sheets update failed: ${res.status} ${await res.text()}`)
}

export async function clearValues(spreadsheetId: string, range: string): Promise<void> {
  const url = `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`
  const res = await authFetch(url, { method: 'POST' })
  if (!res.ok) throw new Error(`Sheets clear failed: ${res.status} ${await res.text()}`)
}
