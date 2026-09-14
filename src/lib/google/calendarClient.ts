import { useAuthStore } from '../../store/authStore'
import { addDays } from '../date'

const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().accessToken
  if (!token) throw new Error('Not signed in to Google')
  return fetch(url, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
  })
}

export interface CalendarEventInput {
  date: string
  title: string
  description?: string
}

function eventBody(input: CalendarEventInput) {
  return {
    summary: input.title,
    description: input.description,
    start: { date: input.date },
    end: { date: addDays(input.date, 1) },
  }
}

export async function insertEvent(input: CalendarEventInput): Promise<string> {
  const res = await authFetch(CALENDAR_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventBody(input)),
  })
  if (!res.ok) throw new Error(`Calendar insert failed: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as { id: string }
  return data.id
}

export async function updateEvent(eventId: string, input: CalendarEventInput): Promise<void> {
  const res = await authFetch(`${CALENDAR_BASE}/${eventId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventBody(input)),
  })
  if (!res.ok) throw new Error(`Calendar update failed: ${res.status} ${await res.text()}`)
}

export async function deleteEvent(eventId: string): Promise<void> {
  const res = await authFetch(`${CALENDAR_BASE}/${eventId}`, { method: 'DELETE' })
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`Calendar delete failed: ${res.status} ${await res.text()}`)
  }
}
