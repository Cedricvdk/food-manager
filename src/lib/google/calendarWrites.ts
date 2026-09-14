import { appendValues, batchGetValues, updateValues } from './sheetsClient'

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
  if (!recipeName) {
    await updateValues(spreadsheetId, `Calendar!B${rowNumber}:C${rowNumber}`, [['', '']])
  } else {
    await updateValues(spreadsheetId, `Calendar!B${rowNumber}`, [[recipeName]])
  }
}
