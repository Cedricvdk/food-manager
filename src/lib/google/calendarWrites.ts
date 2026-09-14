import { appendValues, batchGetValues, updateValues } from './sheetsClient'
import { deleteEvent, insertEvent, updateEvent } from './calendarClient'
import type { Recipe } from '../../types/sheet'

export async function setCalendarRecipe(
  spreadsheetId: string,
  date: string,
  recipeName: string,
): Promise<void> {
  const [calendarR] = await batchGetValues(spreadsheetId, ['Calendar!A2:C1000'])
  const rows = calendarR.values ?? []
  const idx = rows.findIndex((r) => (r[0] ?? '').trim() === date)

  if (idx === -1) {
    if (recipeName) {
      await appendValues(spreadsheetId, 'Calendar!A:C', [[date, recipeName, '']])
    }
    return
  }

  const rowNumber = idx + 2
  // Leave column C (CalendarEventId) untouched here even when clearing the recipe —
  // syncCalendarToGoogle needs it to delete the real Google Calendar event before
  // the id is cleared from the sheet. Clearing it here would orphan that event.
  await updateValues(spreadsheetId, `Calendar!B${rowNumber}`, [[recipeName]])
}

export interface CalendarSyncSummary {
  created: number
  updated: number
  deleted: number
}

export async function syncCalendarToGoogle(
  spreadsheetId: string,
  dates: string[],
  recipes: Recipe[],
): Promise<CalendarSyncSummary> {
  const [calendarR] = await batchGetValues(spreadsheetId, ['Calendar!A2:C1000'])
  const rows = calendarR.values ?? []
  const linkByRecipe = new Map(recipes.map((r) => [r.name, r.link]))

  let created = 0
  let updated = 0
  let deleted = 0

  for (const date of dates) {
    const idx = rows.findIndex((r) => (r[0] ?? '').trim() === date)
    if (idx === -1) continue

    const rowNumber = idx + 2
    const recipeName = (rows[idx][1] ?? '').trim()
    const eventId = (rows[idx][2] ?? '').trim()

    if (recipeName) {
      const description = linkByRecipe.get(recipeName) ?? ''
      if (eventId) {
        try {
          await updateEvent(eventId, { date, title: recipeName, description })
          updated += 1
          continue
        } catch {
          // The event may have been deleted on the Google Calendar side — re-create it below.
        }
      }
      const newId = await insertEvent({ date, title: recipeName, description })
      await updateValues(spreadsheetId, `Calendar!C${rowNumber}`, [[newId]])
      created += 1
    } else if (eventId) {
      await deleteEvent(eventId)
      await updateValues(spreadsheetId, `Calendar!C${rowNumber}`, [['']])
      deleted += 1
    }
  }

  return { created, updated, deleted }
}
